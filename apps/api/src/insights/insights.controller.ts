import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { InsightsService } from './insights.service';
import { PatternRecognitionService } from './pattern-recognition.service';
import { PatternInsightResponseDto, GetPatternsQueryDto } from './dto/pattern-insight.dto';
import { InsightsSummaryDto } from './dto/insights-summary.dto';

@ApiTags('insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('insights')
export class InsightsController {
  constructor(
    private readonly insightsService: InsightsService,
    private readonly patternRecognitionService: PatternRecognitionService,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get insights summary',
    description: 'Get an overview of communication patterns and trends across all sessions',
  })
  @ApiResponse({
    status: 200,
    description: 'Insights summary retrieved',
    type: InsightsSummaryDto,
  })
  async getSummary(@Request() req: any): Promise<InsightsSummaryDto> {
    return this.insightsService.getSummary(req.user.id);
  }

  @Get('patterns')
  @ApiOperation({
    summary: 'Get pattern insights',
    description: 'Get detected patterns across your sessions',
  })
  @ApiQuery({ name: 'includeAcknowledged', required: false, type: Boolean })
  @ApiQuery({ name: 'includeDismissed', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Pattern insights retrieved',
    type: [PatternInsightResponseDto],
  })
  async getPatterns(
    @Request() req: any,
    @Query() query: GetPatternsQueryDto,
  ) {
    return this.insightsService.getPatterns(
      req.user.id,
      query.includeAcknowledged,
      query.includeDismissed,
    );
  }

  @Post('patterns/analyze')
  @ApiOperation({
    summary: 'Trigger pattern analysis',
    description: 'Manually trigger pattern recognition across all sessions',
  })
  @ApiResponse({
    status: 201,
    description: 'Pattern analysis completed',
  })
  async analyzePatterns(@Request() req: any) {
    return this.insightsService.analyzePatterns(req.user.id);
  }

  @Post('patterns/:id/acknowledge')
  @ApiOperation({
    summary: 'Acknowledge a pattern',
    description: 'Mark a pattern as seen by the user',
  })
  @ApiParam({ name: 'id', description: 'Pattern ID' })
  @ApiResponse({ status: 200, description: 'Pattern acknowledged' })
  async acknowledgePattern(@Param('id') id: string, @Request() req: any) {
    await this.patternRecognitionService.acknowledgePattern(id, req.user.id);
    return { success: true };
  }

  @Post('patterns/:id/dismiss')
  @ApiOperation({
    summary: 'Dismiss a pattern',
    description: 'Hide a pattern from future views',
  })
  @ApiParam({ name: 'id', description: 'Pattern ID' })
  @ApiResponse({ status: 200, description: 'Pattern dismissed' })
  async dismissPattern(@Param('id') id: string, @Request() req: any) {
    await this.patternRecognitionService.dismissPattern(id, req.user.id);
    return { success: true };
  }
}
