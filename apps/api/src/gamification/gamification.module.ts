import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { QuestsService } from './quests.service';
import { StreaksService } from './streaks.service';

@Module({
  controllers: [GamificationController],
  providers: [GamificationService, QuestsService, StreaksService],
  exports: [GamificationService, QuestsService, StreaksService],
})
export class GamificationModule {}
