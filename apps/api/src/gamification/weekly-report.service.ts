import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class WeeklyReportService {
  constructor(private prisma: PrismaService) {}

  async generateWeeklyReport(coupleId: string) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);

    // Check if report already exists
    const existingReport = await this.prisma.weeklyReport.findUnique({
      where: {
        coupleId_weekStart: {
          coupleId,
          weekStart,
        },
      },
    });

    if (existingReport) {
      return existingReport;
    }

    // Get sessions for the week
    const sessions = await this.prisma.session.findMany({
      where: {
        coupleId,
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: 'COMPLETED',
      },
      include: {
        analysisResult: true,
      },
    });

    if (sessions.length === 0) {
      // No sessions, create empty report
      return this.prisma.weeklyReport.create({
        data: {
          coupleId,
          weekStart,
          weekEnd,
          sessionCount: 0,
          totalGreenCards: 0,
          totalYellowCards: 0,
          totalRedCards: 0,
          bankChangeNet: 0,
          averageScore: 0,
          highlights: [],
          areasToImprove: [],
          weeklyTip: 'Start your first coach session this week to get personalized insights!',
        },
      });
    }

    // Calculate aggregates
    let totalGreenCards = 0;
    let totalYellowCards = 0;
    let totalRedCards = 0;
    let totalBankChange = 0;
    let totalScore = 0;

    const highlights: string[] = [];
    const areasToImprove: string[] = [];

    for (const session of sessions) {
      if (session.analysisResult) {
        totalGreenCards += session.analysisResult.greenCardCount;
        totalYellowCards += session.analysisResult.yellowCardCount;
        totalRedCards += session.analysisResult.redCardCount;
        totalBankChange += session.analysisResult.bankChange;
        totalScore += session.analysisResult.overallScore;

        // Extract highlights
        if (session.analysisResult.whatWentWell) {
          highlights.push(session.analysisResult.whatWentWell);
        }

        // Extract areas to improve
        if (session.analysisResult.tryNextTime) {
          areasToImprove.push(session.analysisResult.tryNextTime);
        }
      }
    }

    const averageScore = sessions.length > 0 ? totalScore / sessions.length : 0;

    // Generate weekly tip based on patterns
    const weeklyTip = this.generateWeeklyTip(
      totalGreenCards,
      totalYellowCards,
      totalRedCards,
      averageScore,
    );

    return this.prisma.weeklyReport.create({
      data: {
        coupleId,
        weekStart,
        weekEnd,
        sessionCount: sessions.length,
        totalGreenCards,
        totalYellowCards,
        totalRedCards,
        bankChangeNet: totalBankChange,
        averageScore,
        highlights: highlights.slice(0, 3), // Top 3
        areasToImprove: areasToImprove.slice(0, 3), // Top 3
        weeklyTip,
      },
    });
  }

  async getLatestReport(coupleId: string) {
    return this.prisma.weeklyReport.findFirst({
      where: { coupleId },
      orderBy: { weekStart: 'desc' },
    });
  }

  async getReportHistory(coupleId: string, limit = 10) {
    return this.prisma.weeklyReport.findMany({
      where: { coupleId },
      orderBy: { weekStart: 'desc' },
      take: limit,
    });
  }

  private generateWeeklyTip(
    greenCards: number,
    yellowCards: number,
    redCards: number,
    averageScore: number,
  ): string {
    // Priority order: address red cards first, then yellows, then celebrate greens

    if (redCards > 3) {
      return "This week had some challenging moments. Consider taking a break when emotions run high. Try saying 'Let's pause and come back to this when we're calmer.'";
    }

    if (yellowCards > greenCards) {
      return "Watch out for 'always' and 'never' statements. Instead of 'You never listen,' try 'I feel unheard when...' This small change can make a big difference.";
    }

    if (averageScore >= 80) {
      return "Fantastic week! You're both showing excellent communication skills. Keep up the appreciation and validation - it's working!";
    }

    if (averageScore >= 60) {
      return "Good progress this week! Try to catch each other doing something right and express appreciation for it. Small acknowledgments build connection.";
    }

    if (greenCards === 0) {
      return "This week, focus on one simple thing: express genuine appreciation for your partner once a day. It could be as simple as 'Thank you for making coffee.'";
    }

    return "Keep practicing! Each conversation is an opportunity to strengthen your connection. Remember: curiosity and kindness go a long way.";
  }
}
