import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { SessionQAService } from './services/session-qa.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { ImportWhatsAppDto } from './dto/import-whatsapp.dto';
import { AskQuestionDto } from './dto/ask-question.dto';
import { CreateShareLinkDto } from './dto/create-share-link.dto';
import { SharedReportDto } from './dto/shared-report.dto';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(
    private sessionsService: SessionsService,
    private sessionQAService: SessionQAService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new coach session' })
  @ApiResponse({ status: 201, description: 'Session created' })
  async create(@Request() req: any, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sessions for current user (optionally filtered by relationship)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'relationshipId', required: false, description: 'Filter by specific relationship' })
  @ApiResponse({ status: 200, description: 'Sessions list retrieved' })
  async findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('relationshipId') relationshipId?: string,
  ) {
    return this.sessionsService.findAllForUser(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      relationshipId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session retrieved' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.sessionsService.findById(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session updated' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.sessionsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete session and all related data' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session deleted' })
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.sessionsService.delete(id, req.user.id);
  }

  @Post('import-whatsapp')
  @UseInterceptors(FilesInterceptor('voiceNotes', 20, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    fileFilter: (req, file, cb) => {
      if (/\.(opus|m4a|mp3)$/i.test(file.originalname)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only audio files (.opus, .m4a, .mp3) are allowed'), false);
      }
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Import a WhatsApp chat export for analysis',
    description: 'Parse and import a WhatsApp chat export (.txt file content). Optionally include voice note files (.opus, .m4a, .mp3) for transcription. The chat will be analyzed using the same coaching engine as live sessions.',
  })
  @ApiResponse({
    status: 201,
    description: 'WhatsApp chat imported and session created',
    schema: {
      type: 'object',
      properties: {
        session: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string', example: 'UPLOADED' },
            sourceType: { type: 'string', example: 'WHATSAPP_CHAT' },
          },
        },
        participants: {
          type: 'array',
          items: { type: 'string' },
          example: ['John', 'Sarah'],
        },
        messageCount: { type: 'number', example: 150 },
        voiceNoteStats: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 5 },
            matched: { type: 'number', example: 4 },
            unmatched: { type: 'number', example: 1 },
            warnings: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid chat format or content' })
  async importWhatsApp(
    @Request() req: any,
    @Body() dto: ImportWhatsAppDto,
    @UploadedFiles() voiceNotes?: Express.Multer.File[]
  ) {
    const { session, parsedChat, voiceNoteStats } = await this.sessionsService.importWhatsAppChat(
      req.user.id,
      dto,
      voiceNotes,
    );

    return {
      session: {
        id: session.id,
        status: session.status,
        sourceType: session.sourceType,
        createdAt: session.createdAt,
      },
      participants: parsedChat.participants,
      messageCount: parsedChat.messageCount,
      dateRange: {
        start: parsedChat.startDate,
        end: parsedChat.endDate,
      },
      ...(voiceNoteStats && { voiceNoteStats }),
    };
  }

  @Post(':id/audio')
  @ApiOperation({ summary: 'Upload audio file for session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Audio uploaded successfully' })
  async uploadAudio(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { audioUrl: string },
  ) {
    return this.sessionsService.update(id, req.user.id, {
      audioUrl: body.audioUrl,
      status: 'UPLOADED',
    });
  }

  // ==========================================================================
  // SESSION Q&A ENDPOINTS
  // ==========================================================================

  @Post(':id/ask')
  @ApiOperation({
    summary: 'Ask a question about a session',
    description: 'Use AI to answer questions about a specific session, such as "Why did the fight start?" or "Show me examples of contempt". Rate limited to 5 questions per session per hour.',
  })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({
    status: 201,
    description: 'Question answered successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        sessionId: { type: 'string' },
        question: { type: 'string' },
        answer: { type: 'string' },
        referencedQuotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              speaker: { type: 'string' },
              context: { type: 'string' },
            },
          },
        },
        keyInsight: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid question or session not analyzed' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded (5 questions/hour)' })
  async askQuestion(
    @Request() req: any,
    @Param('id') sessionId: string,
    @Body() dto: AskQuestionDto,
  ) {
    return this.sessionQAService.askQuestion(sessionId, req.user.id, dto.question);
  }

  @Get(':id/questions')
  @ApiOperation({
    summary: 'Get Q&A history for a session',
    description: 'Retrieve all questions and answers for a specific session',
  })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Results per page (default: 20)' })
  @ApiResponse({
    status: 200,
    description: 'Q&A history retrieved',
    schema: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              question: { type: 'string' },
              answer: { type: 'string' },
              referencedQuotes: { type: 'array' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async getQuestions(
    @Request() req: any,
    @Param('id') sessionId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sessionQAService.getQuestionHistory(
      sessionId,
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('qa/suggested-questions')
  @ApiOperation({
    summary: 'Get suggested questions',
    description: 'Get a list of suggested questions users can ask about their sessions',
  })
  @ApiResponse({
    status: 200,
    description: 'Suggested questions retrieved',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['Why did the fight start?', 'When did things escalate?'],
    },
  })
  getSuggestedQuestions() {
    return this.sessionQAService.getSuggestedQuestions();
  }

  // ============================================================================
  // SHARING ENDPOINTS (Phase 7)
  // ============================================================================

  @Post(':id/share')
  @ApiOperation({
    summary: 'Create shareable link for session report',
    description: 'Generate a time-limited public link to share session analysis',
  })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({
    status: 201,
    description: 'Share link created',
    schema: {
      type: 'object',
      properties: {
        shareToken: { type: 'string', example: 'abc123...' },
        shareUrl: { type: 'string', example: 'https://app.example.com/share/report/abc123' },
        expiresAt: { type: 'string', format: 'date-time' },
        anonymize: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Session not analyzed yet' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async createShareLink(
    @Param('id') sessionId: string,
    @Request() req: any,
    @Body() dto: CreateShareLinkDto,
  ) {
    return this.sessionsService.createShareLink(sessionId, req.user.id, dto);
  }

  @Public()
  @Get('share/report/:token')
  @ApiOperation({
    summary: 'Get shared report (public)',
    description: 'View session report via public share link. No authentication required.',
  })
  @ApiParam({ name: 'token', description: 'Share token' })
  @ApiResponse({
    status: 200,
    description: 'Shared report retrieved',
    type: SharedReportDto,
  })
  @ApiResponse({ status: 404, description: 'Report not found or link expired' })
  async getSharedReport(@Param('token') token: string): Promise<SharedReportDto> {
    return this.sessionsService.getSharedReport(token);
  }

  @Delete(':id/share')
  @ApiOperation({
    summary: 'Revoke share link',
    description: 'Disable public sharing for a session report',
  })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Share link revoked',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Share link revoked successfully' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async revokeShareLink(@Param('id') sessionId: string, @Request() req: any) {
    return this.sessionsService.revokeShareLink(sessionId, req.user.id);
  }
}
