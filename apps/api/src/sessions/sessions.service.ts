import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CouplesService } from '@/couples/couples.service';
import { RelationshipsService } from '@/relationships/relationships.service';
import { TranscriptionService } from '@/analysis/transcription.service';
import { SessionStatus, SessionSourceType } from '@prisma/client';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { ImportWhatsAppDto } from './dto/import-whatsapp.dto';
import { WhatsAppParserService, ParsedChat } from './services/whatsapp-parser.service';
import { VoiceNoteMatchingService } from './services/voice-note-matching.service';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private prisma: PrismaService,
    private couplesService: CouplesService,
    private relationshipsService: RelationshipsService,
    private whatsAppParser: WhatsAppParserService,
    private voiceNoteMatchingService: VoiceNoteMatchingService,
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
      // Fallback: Try to get active romantic couple
      const couple = await this.couplesService.getCoupleForUser(userId);
      if (!couple) {
        throw new BadRequestException('Must be in a couple or relationship to create a session');
      }
      coupleId = couple.id;
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

    // Check user has access (either via couple or relationship)
    let hasAccess = false;

    if (session.couple) {
      hasAccess = session.couple.partner1Id === userId || session.couple.partner2Id === userId;
    }

    if (session.relationship) {
      hasAccess = session.relationship.members.some(member => member.userId === userId);
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

    // Build query to find sessions from either relationships or couple
    const whereClause: any = {
      OR: []
    };

    if (relationshipIds.length > 0) {
      whereClause.OR.push({ relationshipId: { in: relationshipIds } });
    }

    if (coupleId) {
      whereClause.OR.push({ coupleId });
    }

    // If user has no relationships or couples, return empty
    if (whereClause.OR.length === 0) {
      return { sessions: [], total: 0, page, limit };
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
      // Fallback: Try to get active romantic couple
      const couple = await this.couplesService.getCoupleForUser(userId);
      if (!couple) {
        throw new BadRequestException('Must be in a couple or relationship to import a chat');
      }
      coupleId = couple.id;
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
}
