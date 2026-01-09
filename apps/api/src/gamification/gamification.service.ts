import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { QuestsService } from './quests.service';
import { StreaksService } from './streaks.service';

@Injectable()
export class GamificationService {
  constructor(
    private prisma: PrismaService,
    private questsService: QuestsService,
    private streaksService: StreaksService,
  ) {}

  async getDashboard(userId: string) {
    const [streak, activeQuests, completedQuestsCount] = await Promise.all([
      this.streaksService.getStreak(userId),
      this.questsService.getActiveQuests(userId),
      this.prisma.quest.count({
        where: {
          couple: {
            OR: [
              { partner1Id: userId },
              { partner2Id: userId },
            ],
          },
          status: 'COMPLETED',
        },
      }),
    ]);

    // Get emotional bank balance
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [
          { partner1Id: userId },
          { partner2Id: userId },
        ],
      },
      include: { bankLedger: true },
    });

    return {
      streak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      activeQuests,
      completedQuestsCount,
      emotionalBankBalance: couple?.bankLedger?.balance ?? 0,
    };
  }

  async onSessionCompleted(userId: string, coupleId: string) {
    // Update streak
    await this.streaksService.recordActivity(userId);

    // Check and update quest progress
    await this.questsService.updateQuestProgress(coupleId, userId, 'session_completed');
  }
}
