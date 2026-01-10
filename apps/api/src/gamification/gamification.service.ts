import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RelationshipsService } from '@/relationships/relationships.service';
import { QuestsService } from './quests.service';
import { StreaksService } from './streaks.service';

@Injectable()
export class GamificationService {
  constructor(
    private prisma: PrismaService,
    private relationshipsService: RelationshipsService,
    private questsService: QuestsService,
    private streaksService: StreaksService,
  ) {}

  async getDashboard(userId: string) {
    // Get all relationships for user
    const relationships = await this.relationshipsService.getRelationshipsForUser(userId, false);
    const relationshipIds = relationships.map((r: { id: string }) => r.id);

    // Also get legacy couple
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [
          { partner1Id: userId },
          { partner2Id: userId },
        ],
      },
      include: { bankLedger: true },
    });

    // Build query for quests across all relationships
    const questWhereClause: any = {
      status: 'COMPLETED',
      OR: []
    };

    if (relationshipIds.length > 0) {
      questWhereClause.OR.push({ relationshipId: { in: relationshipIds } });
    }

    if (couple) {
      questWhereClause.OR.push({ coupleId: couple.id });
    }

    const [streak, activeQuests, completedQuestsCount] = await Promise.all([
      this.streaksService.getStreak(userId),
      this.questsService.getActiveQuests(userId),
      questWhereClause.OR.length > 0
        ? this.prisma.quest.count({ where: questWhereClause })
        : 0,
    ]);

    // Get emotional bank balance (prefer relationships over couple)
    let emotionalBankBalance = 0;
    if (relationships.length > 0) {
      const primaryRelationship = await this.prisma.relationship.findFirst({
        where: { id: relationships[0].id },
        include: { emotionalBankLedger: true }
      });
      emotionalBankBalance = primaryRelationship?.emotionalBankLedger?.balance ?? 0;
    } else if (couple) {
      emotionalBankBalance = couple.bankLedger?.balance ?? 0;
    }

    return {
      streak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      activeQuests,
      completedQuestsCount,
      emotionalBankBalance,
    };
  }

  async onSessionCompleted(
    userId: string,
    coupleId: string | null = null,
    relationshipId: string | null = null
  ) {
    // Update streak
    await this.streaksService.recordActivity(userId);

    // Check and update quest progress
    if (relationshipId) {
      await this.questsService.updateQuestProgressForRelationship(relationshipId, userId, 'session_completed');
    } else if (coupleId) {
      await this.questsService.updateQuestProgress(coupleId, userId, 'session_completed');
    }
  }
}
