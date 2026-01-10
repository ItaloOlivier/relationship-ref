import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { QuestType, QuestStatus } from '@prisma/client';

const DAILY_QUEST_TEMPLATES = [
  {
    title: 'Daily Check-in',
    description: 'Complete one coach session with your partner',
    targetValue: 1,
    rewardPoints: 10,
  },
  {
    title: 'Express Appreciation',
    description: 'Share something you appreciate about your partner',
    targetValue: 1,
    rewardPoints: 5,
  },
  {
    title: 'Quality Time',
    description: 'Spend 15 minutes of focused time together',
    targetValue: 1,
    rewardPoints: 8,
  },
];

const WEEKLY_QUEST_TEMPLATES = [
  {
    title: 'Weekly Review',
    description: 'Complete 3 coach sessions this week',
    targetValue: 3,
    rewardPoints: 30,
  },
  {
    title: 'Repair Master',
    description: 'Successfully use repair attempts in sessions',
    targetValue: 5,
    rewardPoints: 25,
  },
  {
    title: 'Green Card Collector',
    description: 'Earn 10 green cards from your sessions',
    targetValue: 10,
    rewardPoints: 40,
  },
];

@Injectable()
export class QuestsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all relationship IDs and couple IDs for a user
   */
  private async getUserRelationshipIds(userId: string): Promise<{
    relationshipIds: string[];
    coupleId: string | null;
  }> {
    // Get relationships
    const relationships = await this.prisma.relationship.findMany({
      where: {
        members: {
          some: {
            userId,
            leftAt: null
          }
        },
        status: 'ACTIVE'
      }
    });

    // Get couple
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [
          { partner1Id: userId },
          { partner2Id: userId },
        ],
      },
    });

    return {
      relationshipIds: relationships.map(r => r.id),
      coupleId: couple?.id ?? null
    };
  }

  async getActiveQuests(userId: string) {
    const { relationshipIds, coupleId } = await this.getUserRelationshipIds(userId);

    // Build query for quests across all relationships and couple
    const whereClause: any = {
      status: QuestStatus.ACTIVE,
      OR: []
    };

    if (relationshipIds.length > 0) {
      whereClause.OR.push({ relationshipId: { in: relationshipIds } });
    }

    if (coupleId) {
      whereClause.OR.push({ coupleId });
    }

    if (whereClause.OR.length === 0) {
      return [];
    }

    const quests = await this.prisma.quest.findMany({
      where: whereClause,
      include: {
        progress: {
          where: { userId },
        },
        relationship: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        couple: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { expiresAt: 'asc' },
    });

    return quests.map(quest => ({
      ...quest,
      userProgress: quest.progress[0]?.currentValue ?? 0,
    }));
  }

  async generateDailyQuests(coupleId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if daily quests already exist for today
    const existingDaily = await this.prisma.quest.findFirst({
      where: {
        coupleId,
        type: QuestType.DAILY,
        createdAt: { gte: today },
      },
    });

    if (existingDaily) {
      return; // Already generated
    }

    // Pick a random daily quest
    const template = DAILY_QUEST_TEMPLATES[
      Math.floor(Math.random() * DAILY_QUEST_TEMPLATES.length)
    ];

    await this.prisma.quest.create({
      data: {
        coupleId,
        type: QuestType.DAILY,
        title: template.title,
        description: template.description,
        targetValue: template.targetValue,
        rewardPoints: template.rewardPoints,
        expiresAt: tomorrow,
      },
    });
  }

  async generateWeeklyQuests(coupleId: string) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Check if weekly quest already exists
    const existingWeekly = await this.prisma.quest.findFirst({
      where: {
        coupleId,
        type: QuestType.WEEKLY,
        createdAt: { gte: startOfWeek },
      },
    });

    if (existingWeekly) {
      return;
    }

    // Pick a random weekly quest
    const template = WEEKLY_QUEST_TEMPLATES[
      Math.floor(Math.random() * WEEKLY_QUEST_TEMPLATES.length)
    ];

    await this.prisma.quest.create({
      data: {
        coupleId,
        type: QuestType.WEEKLY,
        title: template.title,
        description: template.description,
        targetValue: template.targetValue,
        rewardPoints: template.rewardPoints,
        expiresAt: endOfWeek,
      },
    });
  }

  async updateQuestProgress(coupleId: string, userId: string, action: string) {
    const activeQuests = await this.prisma.quest.findMany({
      where: {
        coupleId,
        status: QuestStatus.ACTIVE,
      },
    });

    await this.processQuestProgress(activeQuests, userId, action);
  }

  async updateQuestProgressForRelationship(relationshipId: string, userId: string, action: string) {
    const activeQuests = await this.prisma.quest.findMany({
      where: {
        relationshipId,
        status: QuestStatus.ACTIVE,
      },
    });

    await this.processQuestProgress(activeQuests, userId, action);
  }

  private async processQuestProgress(activeQuests: any[], userId: string, action: string) {
    for (const quest of activeQuests) {
      // Check if this action contributes to the quest
      if (this.questMatchesAction(quest.title, action)) {
        // Get or create progress
        let progress = await this.prisma.questProgress.findUnique({
          where: {
            questId_userId: {
              questId: quest.id,
              userId,
            },
          },
        });

        if (!progress) {
          progress = await this.prisma.questProgress.create({
            data: {
              questId: quest.id,
              userId,
              currentValue: 0,
            },
          });
        }

        // Increment progress
        const newValue = progress.currentValue + 1;
        await this.prisma.questProgress.update({
          where: { id: progress.id },
          data: { currentValue: newValue },
        });

        // Check if quest is completed
        if (newValue >= quest.targetValue) {
          await this.prisma.quest.update({
            where: { id: quest.id },
            data: {
              status: QuestStatus.COMPLETED,
              completedAt: new Date(),
            },
          });
        }
      }
    }
  }

  private questMatchesAction(questTitle: string, action: string): boolean {
    const actionMap: Record<string, string[]> = {
      session_completed: ['Daily Check-in', 'Weekly Review'],
      repair_attempt: ['Repair Master'],
      green_card_earned: ['Green Card Collector'],
    };

    return actionMap[action]?.includes(questTitle) ?? false;
  }

  async expireOldQuests() {
    const now = new Date();

    await this.prisma.quest.updateMany({
      where: {
        status: QuestStatus.ACTIVE,
        expiresAt: { lt: now },
      },
      data: {
        status: QuestStatus.EXPIRED,
      },
    });
  }
}
