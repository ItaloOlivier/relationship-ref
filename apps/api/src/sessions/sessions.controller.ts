import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { ImportWhatsAppDto } from './dto/import-whatsapp.dto';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new coach session' })
  @ApiResponse({ status: 201, description: 'Session created' })
  async create(@Request() req: any, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sessions for current user couple' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Sessions list retrieved' })
  async findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sessionsService.findAllForUser(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
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
}
