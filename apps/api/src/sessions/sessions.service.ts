import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CouplesService } from '@/couples/couples.service';
import { RelationshipsService } from '@/relationships/relationships.service';
import { SessionStatus, SessionSourceType } from '@prisma/client';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { ImportWhatsAppDto } from './dto/import-whatsapp.dto';
import { WhatsAppParserService, ParsedChat } from './services/whatsapp-parser.service';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private couplesService: CouplesService,
    private relationshipsService: RelationshipsService,
    private whatsAppParser: WhatsAppParserService,
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
  async importWhatsAppChat(userId: string, dto: ImportWhatsAppDto): Promise<{
    session: any;
    parsedChat: ParsedChat;
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

    // Convert to transcript format
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
      },
    });

    return { session, parsedChat };
  }
}
