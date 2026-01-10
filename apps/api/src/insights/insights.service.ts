import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PatternRecognitionService } from './pattern-recognition.service';
import { InsightsSummaryDto } from './dto/insights-summary.dto';
import { SessionStatus } from '@prisma/client';

interface SessionWithAnalysis {
  id: string;
  createdAt: Date;
  analysisResult: {
    overallScore?: number;
    topicTags?: string[];
    fourHorsemen?: string[];
    repairAttempts?: number;
    greenCardCount?: number;
    yellowCardCount?: number;
    redCardCount?: number;
  } | null;
}

@Injectable()
export class InsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patternRecognitionService: PatternRecognitionService,
  ) {}

  /**
   * Get the insights summary for a user's relationships
   */
  async getSummary(userId: string): Promise<InsightsSummaryDto> {
    // Get user's couple (can be partner1 or partner2)
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [{ partner1Id: userId }, { partner2Id: userId }],
      },
    });

    // Get user's relationship memberships
    const memberships = await this.prisma.relationshipMember.findMany({
      where: { userId },
    });

    const coupleId = couple?.id;
    const relationshipIds = memberships.map((m) => m.relationshipId);

    // If no couple and no relationships, return empty
    if (!coupleId && relationshipIds.length === 0) {
      return this.emptyInsightsSummary();
    }

    // Get all analyzed sessions for the user's relationships
    const sessions = await this.prisma.session.findMany({
      where: {
        status: SessionStatus.COMPLETED,
        OR: [
          ...(coupleId ? [{ coupleId }] : []),
          ...(relationshipIds.length > 0 ? [{ relationshipId: { in: relationshipIds } }] : []),
        ],
      },
      include: {
        analysisResult: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (sessions.length === 0) {
      return this.emptyInsightsSummary();
    }

    // Calculate metrics
    const sessionsWithAnalysis: SessionWithAnalysis[] = sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      analysisResult: s.analysisResult as SessionWithAnalysis['analysisResult'],
    }));

    const scores = sessionsWithAnalysis
      .map((s) => s.analysisResult?.overallScore)
      .filter((s): s is number => s !== undefined);

    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Calculate score trend
    let scoreTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (scores.length >= 4) {
      const midpoint = Math.floor(scores.length / 2);
      const firstHalfAvg = scores.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
      const secondHalfAvg =
        scores.slice(midpoint).reduce((a, b) => a + b, 0) / (scores.length - midpoint);
      const diff = secondHalfAvg - firstHalfAvg;
      if (diff > 5) scoreTrend = 'improving';
      else if (diff < -5) scoreTrend = 'declining';
    }

    // Topic analysis
    const topicData: Map<string, { count: number; totalScore: number }> = new Map();
    for (const session of sessionsWithAnalysis) {
      const topics = session.analysisResult?.topicTags || [];
      const score = session.analysisResult?.overallScore;
      for (const topic of topics) {
        const existing = topicData.get(topic) || { count: 0, totalScore: 0 };
        existing.count += 1;
        if (score !== undefined) existing.totalScore += score;
        topicData.set(topic, existing);
      }
    }

    const topTopics = Array.from(topicData.entries())
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        averageScore: data.count > 0 ? data.totalScore / data.count : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const triggerTopics = Array.from(topicData.entries())
      .filter(([, data]) => data.count >= 2)
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        averageScore: data.count > 0 ? data.totalScore / data.count : 0,
      }))
      .filter((t) => t.averageScore < averageScore - 10)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 5);

    // Four Horsemen frequency
    const horsemenFrequency: Record<string, number> = {};
    let totalRepairs = 0;
    let totalGreen = 0;
    let totalCards = 0;

    for (const session of sessionsWithAnalysis) {
      const analysis = session.analysisResult;
      if (!analysis) continue;

      const horsemen = analysis.fourHorsemen || [];
      for (const horseman of horsemen) {
        horsemenFrequency[horseman] = (horsemenFrequency[horseman] || 0) + 1;
      }

      totalRepairs += analysis.repairAttempts || 0;
      totalGreen += analysis.greenCardCount || 0;
      totalCards +=
        (analysis.greenCardCount || 0) +
        (analysis.yellowCardCount || 0) +
        (analysis.redCardCount || 0);
    }

    // Monthly trend
    const monthlyData: Map<string, { total: number; count: number }> = new Map();
    for (const session of sessionsWithAnalysis) {
      const score = session.analysisResult?.overallScore;
      if (score === undefined) continue;
      const monthKey = `${session.createdAt.getFullYear()}-${String(session.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyData.get(monthKey) || { total: 0, count: 0 };
      existing.total += score;
      existing.count += 1;
      monthlyData.set(monthKey, existing);
    }

    const monthlyTrend = Array.from(monthlyData.entries())
      .map(([period, data]) => ({
        period,
        value: data.total / data.count,
        count: data.count,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Get active patterns
    const activePatterns = await this.prisma.patternInsight.findMany({
      where: {
        OR: [
          ...(coupleId ? [{ coupleId }] : []),
          ...(relationshipIds.length > 0 ? [{ relationshipId: { in: relationshipIds } }] : []),
        ],
        dismissed: false,
      },
      orderBy: [{ confidence: 'desc' }],
    });

    const impactOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const highestImpactPattern = [...activePatterns].sort(
      (a, b) => impactOrder.indexOf(a.impact) - impactOrder.indexOf(b.impact),
    )[0];

    return {
      totalSessions: sessions.length,
      averageScore: Math.round(averageScore * 10) / 10,
      scoreTrend,
      topTopics,
      triggerTopics,
      horsemenFrequency,
      averageRepairAttempts:
        sessions.length > 0 ? Math.round((totalRepairs / sessions.length) * 10) / 10 : 0,
      greenCardRatio: totalCards > 0 ? Math.round((totalGreen / totalCards) * 100) / 100 : 0,
      monthlyTrend,
      activePatternCount: activePatterns.length,
      highestImpactPattern: highestImpactPattern
        ? {
            id: highestImpactPattern.id,
            title: highestImpactPattern.title,
            impact: highestImpactPattern.impact,
          }
        : undefined,
    };
  }

  /**
   * Trigger pattern analysis for a user's relationships
   */
  async analyzePatterns(userId: string) {
    // Get user's couple
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [{ partner1Id: userId }, { partner2Id: userId }],
      },
    });

    // Get user's relationship memberships
    const memberships = await this.prisma.relationshipMember.findMany({
      where: { userId },
      include: { relationship: true },
    });

    const results: { source: string; patterns: any[] }[] = [];

    // Analyze couple patterns
    if (couple) {
      const patterns = await this.patternRecognitionService.analyzePatterns(
        couple.id,
        undefined,
        userId,
      );
      results.push({ source: 'couple', patterns });
    }

    // Analyze each relationship
    for (const membership of memberships) {
      const patterns = await this.patternRecognitionService.analyzePatterns(
        undefined,
        membership.relationshipId,
        userId,
      );
      results.push({ source: membership.relationship.name || 'relationship', patterns });
    }

    return results;
  }

  /**
   * Get patterns for current user
   */
  async getPatterns(userId: string, includeAcknowledged = false, includeDismissed = false) {
    // Get user's couple
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [{ partner1Id: userId }, { partner2Id: userId }],
      },
    });

    // Get user's relationship memberships
    const memberships = await this.prisma.relationshipMember.findMany({
      where: { userId },
    });

    const coupleId = couple?.id;
    const relationshipIds = memberships.map((m) => m.relationshipId);

    if (!coupleId && relationshipIds.length === 0) {
      return [];
    }

    return this.prisma.patternInsight.findMany({
      where: {
        OR: [
          ...(coupleId ? [{ coupleId }] : []),
          ...(relationshipIds.length > 0 ? [{ relationshipId: { in: relationshipIds } }] : []),
        ],
        ...(includeAcknowledged ? {} : { acknowledged: false }),
        ...(includeDismissed ? {} : { dismissed: false }),
      },
      orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
    });
  }

  private emptyInsightsSummary(): InsightsSummaryDto {
    return {
      totalSessions: 0,
      averageScore: 0,
      scoreTrend: 'stable',
      topTopics: [],
      triggerTopics: [],
      horsemenFrequency: {},
      averageRepairAttempts: 0,
      greenCardRatio: 0,
      monthlyTrend: [],
      activePatternCount: 0,
    };
  }
}
