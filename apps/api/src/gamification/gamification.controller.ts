import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { QuestsService } from './quests.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gamification')
export class GamificationController {
  constructor(
    private gamificationService: GamificationService,
    private questsService: QuestsService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get gamification dashboard (optionally filtered by relationship)' })
  @ApiQuery({ name: 'relationshipId', required: false, description: 'Filter by specific relationship' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  async getDashboard(
    @Request() req: any,
    @Query('relationshipId') relationshipId?: string,
  ) {
    return this.gamificationService.getDashboard(req.user.id, relationshipId);
  }

  @Get('quests')
  @ApiOperation({ summary: 'Get active quests (optionally filtered by relationship)' })
  @ApiQuery({ name: 'relationshipId', required: false, description: 'Filter by specific relationship' })
  @ApiResponse({ status: 200, description: 'Active quests retrieved' })
  async getQuests(
    @Request() req: any,
    @Query('relationshipId') relationshipId?: string,
  ) {
    return this.questsService.getActiveQuests(req.user.id, relationshipId);
  }
}
