import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class StreaksService {
  constructor(private prisma: PrismaService) {}

  async getStreak(userId: string) {
    return this.prisma.streak.findUnique({
      where: { userId },
    });
  }

  async recordActivity(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = await this.prisma.streak.findUnique({
      where: { userId },
    });

    if (!streak) {
      // Create new streak
      return this.prisma.streak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
        },
      });
    }

    const lastActivity = streak.lastActivityDate;

    if (!lastActivity) {
      // First activity
      return this.prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          longestStreak: Math.max(1, streak.longestStreak),
          lastActivityDate: today,
        },
      });
    }

    const lastActivityDate = new Date(lastActivity);
    lastActivityDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      // Same day, no change
      return streak;
    }

    if (daysDiff === 1) {
      // Consecutive day, increment streak
      const newStreak = streak.currentStreak + 1;
      return this.prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, streak.longestStreak),
          lastActivityDate: today,
        },
      });
    }

    // Streak broken, reset to 1
    return this.prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        lastActivityDate: today,
      },
    });
  }

  async checkAndResetBrokenStreaks() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    // Reset streaks that haven't been active for more than a day
    await this.prisma.streak.updateMany({
      where: {
        currentStreak: { gt: 0 },
        lastActivityDate: { lt: yesterday },
      },
      data: {
        currentStreak: 0,
      },
    });
  }
}
