import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get gamification dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  async getDashboard(@Request() req: any) {
    return this.gamificationService.getDashboard(req.user.id);
  }

  @Get('quests')
  @ApiOperation({ summary: 'Get active quests' })
  @ApiResponse({ status: 200, description: 'Active quests retrieved' })
  async getQuests(@Request() req: any) {
    return this.questsService.getActiveQuests(req.user.id);
  }
}
