import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { QuestsService } from './quests.service';
import { StreaksService } from './streaks.service';
import { WeeklyReportService } from './weekly-report.service';

@Module({
  controllers: [GamificationController],
  providers: [GamificationService, QuestsService, StreaksService, WeeklyReportService],
  exports: [GamificationService, QuestsService, StreaksService, WeeklyReportService],
})
export class GamificationModule {}
