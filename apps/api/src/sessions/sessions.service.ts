import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CouplesService } from '@/couples/couples.service';
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
    private whatsAppParser: WhatsAppParserService,
  ) {}

  async create(userId: string, dto: CreateSessionDto) {
    const couple = await this.couplesService.getCoupleForUser(userId);

    if (!couple) {
      throw new BadRequestException('Must be in a couple to create a session');
    }

    const session = await this.prisma.session.create({
      data: {
        coupleId: couple.id,
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
        analysisResult: true,
        initiator: { select: { id: true, name: true } },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check user has access
    if (session.couple.partner1Id !== userId && session.couple.partner2Id !== userId) {
      throw new ForbiddenException('Not authorized to view this session');
    }

    return session;
  }

  async findAllForUser(userId: string, page = 1, limit = 20) {
    const couple = await this.couplesService.getCoupleForUser(userId);

    if (!couple) {
      return { sessions: [], total: 0, page, limit };
    }

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where: { coupleId: couple.id },
        include: {
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
      this.prisma.session.count({ where: { coupleId: couple.id } }),
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
    const couple = await this.couplesService.getCoupleForUser(userId);

    if (!couple) {
      throw new BadRequestException('Must be in a couple to import a chat');
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
        coupleId: couple.id,
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
