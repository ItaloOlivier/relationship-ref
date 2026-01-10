import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PatternType, Prisma, SessionStatus } from '@prisma/client';

interface PatternEvidence {
  sessions: { id: string; date: Date; score?: number }[];
  quotes?: { text: string; speaker?: string }[];
  metrics?: Record<string, number>;
}

interface DetectedPattern {
  patternType: PatternType;
  category: string;
  title: string;
  description: string;
  evidence: PatternEvidence;
  confidence: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sessionsCount: number;
  firstOccurrence?: Date;
  lastOccurrence?: Date;
}

interface SessionWithAnalysis {
  id: string;
  createdAt: Date;
  analysisResult: any;
  transcript?: string;
}

@Injectable()
export class PatternRecognitionService {
  private readonly logger = new Logger(PatternRecognitionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Analyze patterns across sessions for a couple or relationship
   */
  async analyzePatterns(
    coupleId?: string,
    relationshipId?: string,
    userId?: string,
  ): Promise<DetectedPattern[]> {
    const sessions = await this.getCompletedSessions(coupleId, relationshipId);

    if (sessions.length < 3) {
      this.logger.debug('Not enough sessions for pattern analysis (need at least 3)');
      return [];
    }

    const patterns = await Promise.all([
      this.detectTopicTriggers(sessions),
      this.detectTimePatterns(sessions),
      this.detectImprovementTrends(sessions),
      this.detectHorsemenTrends(sessions),
      this.detectPositivePatterns(sessions),
    ]);

    const allPatterns = patterns.flat().sort((a, b) => b.confidence - a.confidence);

    // Store patterns in database
    await this.storePatterns(allPatterns, coupleId, relationshipId, userId);

    return allPatterns;
  }

  /**
   * Update metrics cache after session analysis
   */
  async updateMetricsCache(coupleId?: string, relationshipId?: string): Promise<void> {
    const sessions = await this.getCompletedSessions(coupleId, relationshipId);

    if (sessions.length === 0) return;

    const metrics = this.calculateMetrics(sessions);

    const whereClause = coupleId
      ? { coupleId }
      : relationshipId
        ? { relationshipId }
        : null;

    if (!whereClause) return;

    await this.prisma.patternMetricsCache.upsert({
      where: whereClause,
      create: {
        ...(coupleId ? { coupleId } : {}),
        ...(relationshipId ? { relationshipId } : {}),
        ...metrics,
        sessionsCount: sessions.length,
      },
      update: {
        ...metrics,
        sessionsCount: sessions.length,
        lastUpdated: new Date(),
      },
    });

    this.logger.debug(`Updated metrics cache for ${coupleId || relationshipId}`);
  }

  /**
   * Get stored patterns for a couple/relationship
   */
  async getPatterns(
    coupleId?: string,
    relationshipId?: string,
    includeAcknowledged = false,
    includeDismissed = false,
  ) {
    const where: Prisma.PatternInsightWhereInput = {
      ...(coupleId ? { coupleId } : {}),
      ...(relationshipId ? { relationshipId } : {}),
      ...(includeAcknowledged ? {} : { acknowledged: false }),
      ...(includeDismissed ? {} : { dismissed: false }),
    };

    return this.prisma.patternInsight.findMany({
      where,
      orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Acknowledge a pattern (user has seen it)
   */
  async acknowledgePattern(patternId: string, userId: string): Promise<void> {
    await this.prisma.patternInsight.update({
      where: { id: patternId },
      data: { acknowledged: true },
    });
  }

  /**
   * Dismiss a pattern (user doesn't want to see it)
   */
  async dismissPattern(patternId: string, userId: string): Promise<void> {
    await this.prisma.patternInsight.update({
      where: { id: patternId },
      data: { dismissed: true },
    });
  }

  // ==========================================================================
  // PATTERN DETECTION ALGORITHMS
  // ==========================================================================

  /**
   * Detect recurring topics that correlate with low scores
   */
  private async detectTopicTriggers(sessions: SessionWithAnalysis[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];
    const topicScores: Map<string, { total: number; count: number; sessions: SessionWithAnalysis[] }> = new Map();

    for (const session of sessions) {
      const analysis = session.analysisResult;
      if (!analysis?.topicTags || !analysis?.overallScore) continue;

      const topics = analysis.topicTags as string[];
      const score = analysis.overallScore as number;

      for (const topic of topics) {
        const existing = topicScores.get(topic) || { total: 0, count: 0, sessions: [] };
        existing.total += score;
        existing.count += 1;
        existing.sessions.push(session);
        topicScores.set(topic, existing);
      }
    }

    // Find topics that appear in multiple sessions with below-average scores
    const avgScore = sessions.reduce((sum, s) => sum + (s.analysisResult?.overallScore || 0), 0) / sessions.length;

    for (const [topic, data] of topicScores) {
      if (data.count < 2) continue; // Need at least 2 occurrences

      const topicAvg = data.total / data.count;
      if (topicAvg < avgScore - 10) {
        // Significantly below average
        const occurrenceRate = data.count / sessions.length;

        patterns.push({
          patternType: 'TOPIC_TRIGGER',
          category: topic,
          title: `"${topic}" discussions tend to be difficult`,
          description: `${data.count} of ${sessions.length} sessions involved ${topic}, averaging ${Math.round(topicAvg)} points (${Math.round(avgScore - topicAvg)} below your average).`,
          evidence: {
            sessions: data.sessions.map((s) => ({
              id: s.id,
              date: s.createdAt,
              score: s.analysisResult?.overallScore,
            })),
            metrics: {
              occurrences: data.count,
              averageScore: topicAvg,
              overallAverage: avgScore,
            },
          },
          confidence: Math.min(0.9, 0.5 + occurrenceRate * 0.4),
          impact: topicAvg < 40 ? 'HIGH' : topicAvg < 60 ? 'MEDIUM' : 'LOW',
          sessionsCount: data.count,
          firstOccurrence: data.sessions[0]?.createdAt,
          lastOccurrence: data.sessions[data.sessions.length - 1]?.createdAt,
        });
      }
    }

    return patterns;
  }

  /**
   * Detect time-based patterns (e.g., arguments after 9pm)
   */
  private async detectTimePatterns(sessions: SessionWithAnalysis[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    // Group by hour of day
    const hourlyData: Map<number, { scores: number[]; sessions: SessionWithAnalysis[] }> = new Map();

    for (const session of sessions) {
      const hour = session.createdAt.getHours();
      const score = session.analysisResult?.overallScore;
      if (score === undefined) continue;

      const existing = hourlyData.get(hour) || { scores: [], sessions: [] };
      existing.scores.push(score);
      existing.sessions.push(session);
      hourlyData.set(hour, existing);
    }

    // Look for patterns in evening hours (7pm-11pm)
    let eveningTotal = 0;
    let eveningCount = 0;
    const eveningSessions: SessionWithAnalysis[] = [];

    for (let hour = 19; hour <= 23; hour++) {
      const data = hourlyData.get(hour);
      if (data) {
        eveningTotal += data.scores.reduce((a, b) => a + b, 0);
        eveningCount += data.scores.length;
        eveningSessions.push(...data.sessions);
      }
    }

    if (eveningCount >= 3) {
      const eveningAvg = eveningTotal / eveningCount;
      const overallAvg = sessions.reduce((sum, s) => sum + (s.analysisResult?.overallScore || 0), 0) / sessions.length;

      if (eveningAvg < overallAvg - 10) {
        patterns.push({
          patternType: 'TIME_PATTERN',
          category: 'evening',
          title: 'Evening conversations tend to be more difficult',
          description: `Conversations after 7pm average ${Math.round(eveningAvg)} points, ${Math.round(overallAvg - eveningAvg)} points lower than your overall average.`,
          evidence: {
            sessions: eveningSessions.map((s) => ({
              id: s.id,
              date: s.createdAt,
              score: s.analysisResult?.overallScore,
            })),
            metrics: {
              eveningAverage: eveningAvg,
              overallAverage: overallAvg,
              eveningSessionCount: eveningCount,
            },
          },
          confidence: Math.min(0.85, 0.5 + (eveningCount / sessions.length) * 0.35),
          impact: eveningAvg < 40 ? 'HIGH' : eveningAvg < 60 ? 'MEDIUM' : 'LOW',
          sessionsCount: eveningCount,
          firstOccurrence: eveningSessions[0]?.createdAt,
          lastOccurrence: eveningSessions[eveningSessions.length - 1]?.createdAt,
        });
      }
    }

    // Look for weekend patterns
    const weekendData: { scores: number[]; sessions: SessionWithAnalysis[] } = { scores: [], sessions: [] };
    const weekdayData: { scores: number[]; sessions: SessionWithAnalysis[] } = { scores: [], sessions: [] };

    for (const session of sessions) {
      const day = session.createdAt.getDay();
      const score = session.analysisResult?.overallScore;
      if (score === undefined) continue;

      if (day === 0 || day === 6) {
        weekendData.scores.push(score);
        weekendData.sessions.push(session);
      } else {
        weekdayData.scores.push(score);
        weekdayData.sessions.push(session);
      }
    }

    if (weekendData.scores.length >= 2 && weekdayData.scores.length >= 2) {
      const weekendAvg = weekendData.scores.reduce((a, b) => a + b, 0) / weekendData.scores.length;
      const weekdayAvg = weekdayData.scores.reduce((a, b) => a + b, 0) / weekdayData.scores.length;

      if (Math.abs(weekendAvg - weekdayAvg) > 15) {
        const isWeekendWorse = weekendAvg < weekdayAvg;
        patterns.push({
          patternType: 'TIME_PATTERN',
          category: isWeekendWorse ? 'weekend' : 'weekday',
          title: isWeekendWorse
            ? 'Weekend conversations tend to be more difficult'
            : 'Weekday conversations tend to be more difficult',
          description: isWeekendWorse
            ? `Weekend conversations average ${Math.round(weekendAvg)} points, ${Math.round(weekdayAvg - weekendAvg)} points lower than weekdays.`
            : `Weekday conversations average ${Math.round(weekdayAvg)} points, ${Math.round(weekendAvg - weekdayAvg)} points lower than weekends.`,
          evidence: {
            sessions: (isWeekendWorse ? weekendData : weekdayData).sessions.map((s) => ({
              id: s.id,
              date: s.createdAt,
              score: s.analysisResult?.overallScore,
            })),
            metrics: {
              weekendAverage: weekendAvg,
              weekdayAverage: weekdayAvg,
            },
          },
          confidence: 0.7,
          impact: 'MEDIUM',
          sessionsCount: (isWeekendWorse ? weekendData : weekdayData).sessions.length,
        });
      }
    }

    return patterns;
  }

  /**
   * Detect improvement or decline trends over time
   */
  private async detectImprovementTrends(sessions: SessionWithAnalysis[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    // Sort sessions by date
    const sorted = [...sessions].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (sorted.length < 4) return patterns;

    // Compare first half to second half
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    const firstAvg =
      firstHalf.reduce((sum, s) => sum + (s.analysisResult?.overallScore || 0), 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, s) => sum + (s.analysisResult?.overallScore || 0), 0) / secondHalf.length;

    const improvement = secondAvg - firstAvg;

    if (Math.abs(improvement) >= 10) {
      const isImproving = improvement > 0;

      patterns.push({
        patternType: 'BEHAVIOR_TREND',
        category: isImproving ? 'improvement' : 'decline',
        title: isImproving
          ? 'Your communication is improving!'
          : 'Your communication scores have been declining',
        description: isImproving
          ? `Your recent sessions average ${Math.round(secondAvg)} points, up ${Math.round(improvement)} points from earlier sessions.`
          : `Your recent sessions average ${Math.round(secondAvg)} points, down ${Math.round(-improvement)} points from earlier sessions.`,
        evidence: {
          sessions: sorted.map((s) => ({
            id: s.id,
            date: s.createdAt,
            score: s.analysisResult?.overallScore,
          })),
          metrics: {
            earlierAverage: firstAvg,
            recentAverage: secondAvg,
            change: improvement,
          },
        },
        confidence: 0.75,
        impact: isImproving ? 'LOW' : Math.abs(improvement) > 20 ? 'HIGH' : 'MEDIUM',
        sessionsCount: sessions.length,
        firstOccurrence: sorted[0]?.createdAt,
        lastOccurrence: sorted[sorted.length - 1]?.createdAt,
      });
    }

    // Track repair attempt trends
    const firstHalfRepairs = firstHalf.reduce(
      (sum, s) => sum + (s.analysisResult?.repairAttempts || 0),
      0,
    );
    const secondHalfRepairs = secondHalf.reduce(
      (sum, s) => sum + (s.analysisResult?.repairAttempts || 0),
      0,
    );

    const repairImprovement = secondHalfRepairs / secondHalf.length - firstHalfRepairs / firstHalf.length;

    if (repairImprovement > 0.5) {
      patterns.push({
        patternType: 'POSITIVE_PATTERN',
        category: 'repair_attempts',
        title: 'Your repair attempts are increasing',
        description: `You're making ${Math.round(repairImprovement * 100)}% more repair attempts in recent sessions. This is a key indicator of healthy communication.`,
        evidence: {
          sessions: sorted.map((s) => ({
            id: s.id,
            date: s.createdAt,
            score: s.analysisResult?.overallScore,
          })),
          metrics: {
            earlierRepairRate: firstHalfRepairs / firstHalf.length,
            recentRepairRate: secondHalfRepairs / secondHalf.length,
          },
        },
        confidence: 0.8,
        impact: 'LOW',
        sessionsCount: sessions.length,
      });
    }

    return patterns;
  }

  /**
   * Detect Four Horsemen trends
   */
  private async detectHorsemenTrends(sessions: SessionWithAnalysis[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    const horsemenCounts: Map<string, { count: number; sessions: SessionWithAnalysis[] }> = new Map();

    for (const session of sessions) {
      const horsemen = session.analysisResult?.fourHorsemen as string[] | undefined;
      if (!horsemen) continue;

      for (const horseman of horsemen) {
        const existing = horsemenCounts.get(horseman) || { count: 0, sessions: [] };
        existing.count += 1;
        existing.sessions.push(session);
        horsemenCounts.set(horseman, existing);
      }
    }

    const horsemenLabels: Record<string, string> = {
      criticism: 'Criticism',
      contempt: 'Contempt',
      defensiveness: 'Defensiveness',
      stonewalling: 'Stonewalling',
    };

    for (const [horseman, data] of horsemenCounts) {
      const prevalence = data.count / sessions.length;

      if (prevalence >= 0.4) {
        // Present in 40%+ of sessions
        const label = horsemenLabels[horseman] || horseman;
        const isSevere = horseman === 'contempt' || prevalence >= 0.6;

        patterns.push({
          patternType: 'HORSEMAN_TREND',
          category: horseman,
          title: `${label} appears frequently in your conversations`,
          description: `${label} was detected in ${data.count} of ${sessions.length} sessions (${Math.round(prevalence * 100)}%). ${
            horseman === 'contempt'
              ? 'Contempt is particularly damaging to relationships.'
              : `Consider working on reducing ${label.toLowerCase()}.`
          }`,
          evidence: {
            sessions: data.sessions.map((s) => ({
              id: s.id,
              date: s.createdAt,
              score: s.analysisResult?.overallScore,
            })),
            metrics: {
              occurrences: data.count,
              prevalence,
            },
          },
          confidence: Math.min(0.9, 0.6 + prevalence * 0.3),
          impact: isSevere ? 'HIGH' : 'MEDIUM',
          sessionsCount: data.count,
          firstOccurrence: data.sessions[0]?.createdAt,
          lastOccurrence: data.sessions[data.sessions.length - 1]?.createdAt,
        });
      }
    }

    return patterns;
  }

  /**
   * Detect positive patterns to celebrate
   */
  private async detectPositivePatterns(sessions: SessionWithAnalysis[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    // High green card ratio
    let totalGreen = 0;
    let totalCards = 0;
    const highGreenSessions: SessionWithAnalysis[] = [];

    for (const session of sessions) {
      const green = session.analysisResult?.greenCardCount || 0;
      const yellow = session.analysisResult?.yellowCardCount || 0;
      const red = session.analysisResult?.redCardCount || 0;
      const total = green + yellow + red;

      if (total > 0) {
        totalGreen += green;
        totalCards += total;

        if (green / total > 0.6) {
          highGreenSessions.push(session);
        }
      }
    }

    if (totalCards > 0) {
      const greenRatio = totalGreen / totalCards;

      if (greenRatio >= 0.5) {
        patterns.push({
          patternType: 'POSITIVE_PATTERN',
          category: 'green_cards',
          title: 'Strong positive communication patterns',
          description: `${Math.round(greenRatio * 100)}% of your interaction cards are positive (green). You're doing many things well!`,
          evidence: {
            sessions: sessions.map((s) => ({
              id: s.id,
              date: s.createdAt,
              score: s.analysisResult?.overallScore,
            })),
            metrics: {
              greenRatio,
              totalGreenCards: totalGreen,
              totalCards,
            },
          },
          confidence: 0.85,
          impact: 'LOW',
          sessionsCount: sessions.length,
        });
      }
    }

    // Consistent high scores
    const highScoreSessions = sessions.filter((s) => (s.analysisResult?.overallScore || 0) >= 70);
    if (highScoreSessions.length >= sessions.length * 0.6 && sessions.length >= 3) {
      patterns.push({
        patternType: 'POSITIVE_PATTERN',
        category: 'high_scores',
        title: 'Consistently strong communication',
        description: `${highScoreSessions.length} of your ${sessions.length} sessions scored 70 or above. You're maintaining healthy communication patterns.`,
        evidence: {
          sessions: highScoreSessions.map((s) => ({
            id: s.id,
            date: s.createdAt,
            score: s.analysisResult?.overallScore,
          })),
        },
        confidence: 0.8,
        impact: 'LOW',
        sessionsCount: highScoreSessions.length,
      });
    }

    return patterns;
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private async getCompletedSessions(
    coupleId?: string,
    relationshipId?: string,
  ): Promise<SessionWithAnalysis[]> {
    const where: Prisma.SessionWhereInput = {
      status: SessionStatus.COMPLETED,
      analysisResult: { isNot: null },
      ...(coupleId ? { coupleId } : {}),
      ...(relationshipId ? { relationshipId } : {}),
    };

    const sessions = await this.prisma.session.findMany({
      where,
      include: {
        analysisResult: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      analysisResult: s.analysisResult,
      transcript: s.transcript ?? undefined,
    }));
  }

  private calculateMetrics(sessions: SessionWithAnalysis[]) {
    const topicFrequency: Record<string, number> = {};
    const topicScores: Record<string, { total: number; count: number }> = {};
    const hourlyDistribution: Record<number, number> = {};
    const weekdayDistribution: Record<string, number> = {};
    const monthlyScores: Record<string, { total: number; count: number }> = {};
    const horsemenTrend: Record<string, number> = {};
    let totalRepairs = 0;
    let totalGreen = 0;
    let totalYellow = 0;
    let totalRed = 0;

    for (const session of sessions) {
      const analysis = session.analysisResult;
      if (!analysis) continue;

      // Topic frequency and scores
      const topics = (analysis.topicTags as string[]) || [];
      const score = analysis.overallScore as number;

      for (const topic of topics) {
        topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
        if (score !== undefined) {
          topicScores[topic] = topicScores[topic] || { total: 0, count: 0 };
          topicScores[topic].total += score;
          topicScores[topic].count += 1;
        }
      }

      // Time distribution
      const hour = session.createdAt.getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;

      const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
        session.createdAt.getDay()
      ];
      weekdayDistribution[weekday] = (weekdayDistribution[weekday] || 0) + 1;

      // Monthly scores
      const monthKey = `${session.createdAt.getFullYear()}-${String(session.createdAt.getMonth() + 1).padStart(2, '0')}`;
      monthlyScores[monthKey] = monthlyScores[monthKey] || { total: 0, count: 0 };
      if (score !== undefined) {
        monthlyScores[monthKey].total += score;
        monthlyScores[monthKey].count += 1;
      }

      // Horsemen trend
      const horsemen = (analysis.fourHorsemen as string[]) || [];
      for (const horseman of horsemen) {
        horsemenTrend[horseman] = (horsemenTrend[horseman] || 0) + 1;
      }

      // Repair attempts
      totalRepairs += (analysis.repairAttempts as number) || 0;

      // Card counts
      totalGreen += (analysis.greenCardCount as number) || 0;
      totalYellow += (analysis.yellowCardCount as number) || 0;
      totalRed += (analysis.redCardCount as number) || 0;
    }

    return {
      topicFrequency,
      topicScores: Object.fromEntries(
        Object.entries(topicScores).map(([k, v]) => [k, v.total / v.count]),
      ),
      hourlyDistribution,
      weekdayDistribution,
      monthlyScores: Object.fromEntries(
        Object.entries(monthlyScores).map(([k, v]) => [k, { avg: v.total / v.count, count: v.count }]),
      ),
      horsemenTrend,
      repairAttemptTrend: {
        total: totalRepairs,
        average: sessions.length > 0 ? totalRepairs / sessions.length : 0,
      },
      cardRatioTrend: {
        green: totalGreen,
        yellow: totalYellow,
        red: totalRed,
        total: totalGreen + totalYellow + totalRed,
        greenRatio: totalGreen / (totalGreen + totalYellow + totalRed) || 0,
      },
    };
  }

  private async storePatterns(
    patterns: DetectedPattern[],
    coupleId?: string,
    relationshipId?: string,
    userId?: string,
  ): Promise<void> {
    for (const pattern of patterns) {
      // Check if similar pattern already exists
      const existing = await this.prisma.patternInsight.findFirst({
        where: {
          ...(coupleId ? { coupleId } : {}),
          ...(relationshipId ? { relationshipId } : {}),
          patternType: pattern.patternType,
          category: pattern.category,
          dismissed: false,
        },
      });

      if (existing) {
        // Update existing pattern
        await this.prisma.patternInsight.update({
          where: { id: existing.id },
          data: {
            title: pattern.title,
            description: pattern.description,
            evidence: pattern.evidence as any,
            confidence: pattern.confidence,
            impact: pattern.impact,
            sessionsCount: pattern.sessionsCount,
            lastOccurrence: pattern.lastOccurrence,
          },
        });
      } else {
        // Create new pattern
        await this.prisma.patternInsight.create({
          data: {
            ...(coupleId ? { coupleId } : {}),
            ...(relationshipId ? { relationshipId } : {}),
            ...(userId ? { userId } : {}),
            patternType: pattern.patternType,
            category: pattern.category,
            title: pattern.title,
            description: pattern.description,
            evidence: pattern.evidence as any,
            confidence: pattern.confidence,
            impact: pattern.impact,
            sessionsCount: pattern.sessionsCount,
            firstOccurrence: pattern.firstOccurrence,
            lastOccurrence: pattern.lastOccurrence,
          },
        });
      }
    }
  }
}
