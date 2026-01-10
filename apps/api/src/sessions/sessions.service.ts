import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CouplesService } from '@/couples/couples.service';
import { RelationshipsService } from '@/relationships/relationships.service';
import { TranscriptionService } from '@/analysis/transcription.service';
import { ShareEventsService } from '@/share-events/share-events.service';
import { SessionStatus, SessionSourceType, ShareMethod } from '@prisma/client';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { ImportWhatsAppDto } from './dto/import-whatsapp.dto';
import { CreateShareLinkDto } from './dto/create-share-link.dto';
import { SharedReportDto } from './dto/shared-report.dto';
import { WhatsAppParserService, ParsedChat } from './services/whatsapp-parser.service';
import { VoiceNoteMatchingService } from './services/voice-note-matching.service';
import { generateSecureToken, calculateTokenExpiry, isTokenExpired } from '@/common/utils/token.util';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private prisma: PrismaService,
    private couplesService: CouplesService,
    private relationshipsService: RelationshipsService,
    private whatsAppParser: WhatsAppParserService,
    private voiceNoteMatchingService: VoiceNoteMatchingService,
    private shareEventsService: ShareEventsService,
    @Inject(forwardRef(() => TranscriptionService))
    private transcriptionService: TranscriptionService,
  ) {}

  async create(userId: string, dto: CreateSessionDto) {
    let relationshipId: string | null = null;
    let coupleId: string | null = null;

    // If relationshipId provided, use new system
    if (dto.relationshipId) {
      const relationship = await this.relationshipsService.getRelationshipById(
        dto.relationshipId,
        userId
      );
      if (!relationship) {
        throw new BadRequestException('Relationship not found or access denied');
      }
      relationshipId = dto.relationshipId;
    } else {
      // Try to get active romantic couple (optional - solo sessions allowed)
      const couple = await this.couplesService.getCoupleForUser(userId);
      if (couple) {
        coupleId = couple.id;
      }
      // If no couple, session will be solo (linked only to initiator)
    }

    const session = await this.prisma.session.create({
      data: {
        coupleId,
        relationshipId,
        initiatorId: userId,
        retainAudio: dto.retainAudio ?? false,
        status: SessionStatus.RECORDING,
      },
    });

    return session;
  }

  async findById(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        couple: true,
        relationship: {
          include: {
            members: {
              where: { leftAt: null },
              include: { user: true }
            }
          }
        },
        analysisResult: true,
        initiator: { select: { id: true, name: true } },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check user has access (via couple, relationship, or as initiator for solo sessions)
    let hasAccess = false;

    // Solo session - user is the initiator
    if (session.initiatorId === userId) {
      hasAccess = true;
    }

    // Access via couple
    if (session.couple) {
      hasAccess = hasAccess || session.couple.partner1Id === userId || session.couple.partner2Id === userId;
    }

    // Access via relationship
    if (session.relationship) {
      hasAccess = hasAccess || session.relationship.members.some(member => member.userId === userId);
    }

    if (!hasAccess) {
      throw new ForbiddenException('Not authorized to view this session');
    }

    return session;
  }

  async findAllForUser(userId: string, page = 1, limit = 20) {
    // Get all relationships for user (includes couples via backward compatibility)
    const relationships = await this.relationshipsService.getRelationshipsForUser(userId, false);
    const relationshipIds = relationships.map((r: { id: string }) => r.id);

    // Also try to get legacy couple
    const couple = await this.couplesService.getCoupleForUser(userId);
    const coupleId = couple?.id;

    // Build query to find sessions from relationships, couple, OR solo sessions (initiator)
    const whereClause: any = {
      OR: [
        // Solo sessions - user is the initiator and no couple/relationship linked
        { initiatorId: userId },
      ]
    };

    if (relationshipIds.length > 0) {
      whereClause.OR.push({ relationshipId: { in: relationshipIds } });
    }

    if (coupleId) {
      whereClause.OR.push({ coupleId });
    }

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where: whereClause,
        include: {
          relationship: {
            select: {
              id: true,
              name: true,
              type: true,
            }
          },
          couple: {
            select: {
              id: true,
              name: true,
            }
          },
          analysisResult: {
            select: {
              overallScore: true,
              greenCardCount: true,
              yellowCardCount: true,
              redCardCount: true,
              bankChange: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.session.count({ where: whereClause }),
    ]);

    return { sessions, total, page, limit };
  }

  async update(sessionId: string, userId: string, dto: UpdateSessionDto) {
    const session = await this.findById(sessionId, userId);

    return this.prisma.session.update({
      where: { id: session.id },
      data: {
        status: dto.status,
        durationSecs: dto.durationSecs,
        audioUrl: dto.audioUrl,
        transcript: dto.transcript,
      },
    });
  }

  async updateStatus(sessionId: string, status: SessionStatus) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { status },
    });
  }

  async delete(sessionId: string, userId: string) {
    const session = await this.findById(sessionId, userId);

    await this.prisma.session.delete({
      where: { id: session.id },
    });

    return { message: 'Session deleted' };
  }

  /**
   * Import a WhatsApp chat export and create a session for analysis
   */
  async importWhatsAppChat(
    userId: string,
    dto: ImportWhatsAppDto,
    voiceNotes?: Express.Multer.File[]
  ): Promise<{
    session: any;
    parsedChat: ParsedChat;
    voiceNoteStats?: {
      total: number;
      matched: number;
      unmatched: number;
      warnings: string[];
    };
  }> {
    let relationshipId: string | null = null;
    let coupleId: string | null = null;

    // If relationshipId provided, use new system
    if (dto.relationshipId) {
      const relationship = await this.relationshipsService.getRelationshipById(
        dto.relationshipId,
        userId
      );
      if (!relationship) {
        throw new BadRequestException('Relationship not found or access denied');
      }
      relationshipId = dto.relationshipId;
    } else {
      // Try to get active romantic couple (optional - solo imports allowed)
      const couple = await this.couplesService.getCoupleForUser(userId);
      if (couple) {
        coupleId = couple.id;
      }
      // If no couple, session will be solo (linked only to initiator)
      // User can link to a relationship later
    }

    // Parse the WhatsApp chat content
    const parsedChat = this.whatsAppParser.parseChat(dto.chatContent);

    // Voice note processing (if files provided)
    let voiceNoteStats: {
      total: number;
      matched: number;
      unmatched: number;
      warnings: string[];
    } | undefined;

    const voiceNoteFilenames: string[] = [];
    const voiceNoteDurations: number[] = [];

    if (voiceNotes && voiceNotes.length > 0) {
      this.logger.log(`Processing ${voiceNotes.length} voice note files`);

      // Match voice notes to messages
      const matches = this.voiceNoteMatchingService.matchVoiceNotes(
        parsedChat.messages,
        voiceNotes
      );

      this.logger.log(`Matched ${matches.size} voice notes to messages`);

      // Transcribe matched voice notes in parallel
      const transcriptionPromises = Array.from(matches.entries()).map(
        async ([msgIdx, match]) => {
          try {
            const transcript = await this.transcriptionService.transcribeFromBuffer(
              match.file.buffer,
              match.file.originalname
            );

            return {
              msgIdx,
              transcript: transcript.trim(),
              filename: match.file.originalname,
              duration: null, // Duration not available from file buffer
              success: true,
            };
          } catch (error) {
            this.logger.error(
              `Transcription failed for ${match.file.originalname}: ${error.message}`,
              error.stack
            );
            return {
              msgIdx,
              transcript: '[Voice message - transcription failed]',
              filename: match.file.originalname,
              duration: null,
              success: false,
            };
          }
        }
      );

      const transcriptions = await Promise.all(transcriptionPromises);

      // Augment messages with transcripts
      transcriptions.forEach(({ msgIdx, transcript }) => {
        const msg = parsedChat.messages[msgIdx];
        msg.content = `[Voice Message] ${transcript}`;
      });

      // Collect filenames and durations for storage
      transcriptions.forEach(({ filename, duration }) => {
        voiceNoteFilenames.push(filename);
        if (duration !== null) {
          voiceNoteDurations.push(duration);
        }
      });

      // Handle unmatched voice notes
      const unmatchedFiles = this.voiceNoteMatchingService.getUnmatchedFiles(
        voiceNotes,
        matches
      );

      const warnings: string[] = [];

      if (unmatchedFiles.length > 0) {
        this.logger.warn(
          `${unmatchedFiles.length} voice note(s) could not be matched to messages: ${unmatchedFiles.map(f => f.originalname).join(', ')}`
        );
        warnings.push(
          `${unmatchedFiles.length} voice note(s) could not be matched to specific messages and were appended to the transcript`
        );

        // Transcribe unmatched files and append to transcript
        for (const file of unmatchedFiles) {
          try {
            const transcript = await this.transcriptionService.transcribeFromBuffer(
              file.buffer,
              file.originalname
            );

            // Append as a system message at the end
            parsedChat.messages.push({
              timestamp: new Date(),
              sender: 'System',
              content: `[Unmatched Voice Message from ${file.originalname}] ${transcript.trim()}`,
              isSystemMessage: true,
            });

            voiceNoteFilenames.push(file.originalname);
          } catch (error) {
            this.logger.error(
              `Failed to transcribe unmatched file ${file.originalname}: ${error.message}`
            );
            warnings.push(`Failed to transcribe ${file.originalname}`);
          }
        }
      }

      voiceNoteStats = {
        total: voiceNotes.length,
        matched: matches.size,
        unmatched: unmatchedFiles.length,
        warnings,
      };
    }

    // Convert to transcript format (with augmented voice messages)
    const transcript = this.whatsAppParser.formatAsTranscript(parsedChat);

    // Calculate duration
    const durationSecs = this.whatsAppParser.calculateDuration(parsedChat);

    // Create session with UPLOADED status (ready for analysis, skip RECORDING/TRANSCRIBING)
    const session = await this.prisma.session.create({
      data: {
        coupleId,
        relationshipId,
        initiatorId: userId,
        status: SessionStatus.UPLOADED,
        sourceType: SessionSourceType.WHATSAPP_CHAT,
        transcript,
        durationSecs,
        retainAudio: false, // No audio for imported chats
        importedFileName: dto.fileName,
        importedMessageCount: parsedChat.messageCount,
        chatParticipants: parsedChat.participants,
        voiceNoteCount: voiceNotes?.length || 0,
        voiceNoteFilenames,
        voiceNoteDurations: voiceNoteDurations.length > 0 ? voiceNoteDurations : undefined,
      },
    });

    return { session, parsedChat, voiceNoteStats };
  }

  // ============================================================================
  // SHARING METHODS (Phase 7)
  // ============================================================================

  /**
   * Create a shareable link for a session report
   * @param sessionId Session ID
   * @param userId User creating the share link (must have access to session)
   * @param dto Share configuration (expiry, anonymization)
   * @returns Share URL data
   */
  async createShareLink(sessionId: string, userId: string, dto: CreateShareLinkDto) {
    // Verify user has access to session
    const session = await this.findById(sessionId, userId);

    // Verify session is completed (has analysis)
    if (!session.analysisResult) {
      throw new BadRequestException('Cannot share session without completed analysis');
    }

    // Generate secure token
    const shareToken = generateSecureToken(32);
    const shareTokenExpiry = calculateTokenExpiry(dto.expiryDays || 7);

    // Update session with share data
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        shareToken,
        shareTokenExpiry,
        shareEnabled: true,
      },
    });

    // Track share link creation
    await this.shareEventsService.trackLinkCreated({
      sessionId,
      expiryDays: dto.expiryDays || 7,
      anonymized: dto.anonymize || false,
      method: ShareMethod.COPY_LINK, // Default to copy link, can be updated when method is known
    });

    this.logger.log(`Share link created for session ${sessionId} by user ${userId}`);

    return {
      shareToken,
      shareUrl: `${process.env.WEB_APP_URL || 'http://localhost:3001'}/share/report/${shareToken}`,
      expiresAt: shareTokenExpiry,
      anonymize: dto.anonymize || false,
    };
  }

  /**
   * Get shared report by public token (no authentication required)
   * @param token Share token
   * @returns Sanitized report data
   */
  async getSharedReport(token: string): Promise<SharedReportDto> {
    const session = await this.prisma.session.findFirst({
      where: {
        shareToken: token,
        shareEnabled: true,
      },
      include: {
        analysisResult: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Report not found or sharing has been disabled');
    }

    // Check expiry
    if (isTokenExpired(session.shareTokenExpiry)) {
      throw new NotFoundException('Share link has expired');
    }

    if (!session.analysisResult) {
      throw new NotFoundException('Report not available');
    }

    // Sanitize data - remove sensitive information
    const result = session.analysisResult;

    return {
      sessionId: session.id,
      overallScore: result.overallScore,
      greenCardCount: result.greenCardCount,
      yellowCardCount: result.yellowCardCount,
      redCardCount: result.redCardCount,
      bankChange: result.bankChange,
      individualScores: result.individualScores as any[],
      topicTags: result.topicTags,
      cards: result.cards as any[],
      whatWentWell: result.whatWentWell || undefined,
      tryNextTime: result.tryNextTime || undefined,
      repairSuggestion: result.repairSuggestion || undefined,
      createdAt: session.createdAt,
      sourceType: session.sourceType,
    };
  }

  /**
   * Revoke a share link (disable sharing)
   * @param sessionId Session ID
   * @param userId User revoking the link (must have access)
   */
  async revokeShareLink(sessionId: string, userId: string) {
    // Verify user has access to session
    await this.findById(sessionId, userId);

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        shareEnabled: false,
      },
    });

    // Track share link revocation
    await this.shareEventsService.trackLinkRevoked({ sessionId });

    this.logger.log(`Share link revoked for session ${sessionId} by user ${userId}`);

    return { message: 'Share link revoked successfully' };
  }
}
