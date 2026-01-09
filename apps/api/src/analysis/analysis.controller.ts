import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { TranscribeSessionDto } from './dto/transcribe-session.dto';

@ApiTags('analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class AnalysisController {
  constructor(private analysisService: AnalysisService) {}

  @Post(':id/transcribe')
  @ApiOperation({ summary: 'Transcribe session audio' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiBody({ type: TranscribeSessionDto, required: false })
  @ApiResponse({ status: 200, description: 'Transcription completed' })
  async transcribe(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto?: TranscribeSessionDto,
  ) {
    return this.analysisService.transcribeSession(id, req.user.id, dto?.audioUrl);
  }

  @Post(':id/analyze')
  @ApiOperation({ summary: 'Analyze transcribed session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Analysis completed' })
  async analyze(@Request() req: any, @Param('id') id: string) {
    return this.analysisService.analyzeSession(id, req.user.id);
  }

  @Get(':id/report')
  @ApiOperation({ summary: 'Get session match report' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Report retrieved' })
  async getReport(@Request() req: any, @Param('id') id: string) {
    return this.analysisService.getReport(id, req.user.id);
  }
}
