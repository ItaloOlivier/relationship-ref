import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { LinguisticFeatures } from './linguistic-analysis.service';

/**
 * Couple-level relationship dynamics analysis.
 *
 * Analyzes interaction patterns between partners:
 * - Power balance and conversation dominance
 * - Emotional reciprocity
 * - Conflict patterns (pursuer-withdrawer, escalation)
 * - Gottman ratios (positive:negative interactions)
 */

export interface ParticipantFeatures {
  participantName: string;
  userId?: string;
  features: LinguisticFeatures;
  horsemen: {
    criticism: number;
    contempt: number;
    defensiveness: number;
    stonewalling: number;
  };
  repairAttempts: number;
  messageCount: number;
  wordCount: number;
}

export interface ConversationDominance {
  [participantId: string]: number; // Percentage of total words
}

export interface PursuerWithdrawerAnalysis {
  isPursuerWithdrawer: boolean;
  pursuerId?: string;
  withdrawerId?: string;
  confidence: number;
  indicators: string[];
}

export interface RelationshipDynamicsAnalysis {
  // Conversation patterns
  dominance: ConversationDominance;
  topicInitiation: ConversationDominance;

  // Pursuer-withdrawer dynamic
  pursuerWithdrawer: PursuerWithdrawerAnalysis;

  // Emotional reciprocity (0-100)
  emotionalReciprocity: number;
  validationBalance: number;
  supportBalance: number;

  // Conflict patterns
  escalationTendency: number; // 0-100: how quickly conflicts escalate
  deescalationSkill: number; // 0-100: ability to calm conflicts
  resolutionRate: number; // 0-100: estimated conflict resolution

  // Gottman ratio
  positiveToNegativeRatio: number;

  // Strengths and growth areas
  relationshipStrengths: string[];
  growthOpportunities: string[];

  // Confidence
  confidence: number;
}

@Injectable()
export class RelationshipDynamicsService {
  private openai: OpenAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Analyze relationship dynamics from both partners' linguistic features
   */
  analyzeRelationshipDynamics(
    participant1: ParticipantFeatures,
    participant2: ParticipantFeatures,
  ): RelationshipDynamicsAnalysis {
    const totalWords = participant1.wordCount + participant2.wordCount;
    const totalMessages = participant1.messageCount + participant2.messageCount;

    // Calculate conversation dominance
    const dominance: ConversationDominance = {
      [participant1.participantName]:
        totalWords > 0 ? (participant1.wordCount / totalWords) * 100 : 50,
      [participant2.participantName]:
        totalWords > 0 ? (participant2.wordCount / totalWords) * 100 : 50,
    };

    // Calculate topic initiation (approximated by message count ratio)
    const topicInitiation: ConversationDominance = {
      [participant1.participantName]:
        totalMessages > 0 ? (participant1.messageCount / totalMessages) * 100 : 50,
      [participant2.participantName]:
        totalMessages > 0 ? (participant2.messageCount / totalMessages) * 100 : 50,
    };

    // Analyze pursuer-withdrawer dynamic
    const pursuerWithdrawer = this.analyzePursuerWithdrawer(
      participant1,
      participant2,
    );

    // Calculate emotional reciprocity
    const emotionalReciprocity = this.calculateEmotionalReciprocity(
      participant1,
      participant2,
    );

    // Calculate validation balance
    const validationBalance = this.calculateValidationBalance(
      participant1,
      participant2,
    );

    // Calculate support balance
    const supportBalance = this.calculateSupportBalance(
      participant1,
      participant2,
    );

    // Calculate conflict patterns
    const { escalationTendency, deescalationSkill, resolutionRate } =
      this.analyzeConflictPatterns(participant1, participant2);

    // Calculate Gottman ratio
    const positiveToNegativeRatio = this.calculateGottmanRatio(
      participant1,
      participant2,
    );

    // Identify strengths and growth opportunities
    const { strengths, growthAreas } = this.identifyStrengthsAndGrowth(
      participant1,
      participant2,
      positiveToNegativeRatio,
      emotionalReciprocity,
      pursuerWithdrawer,
    );

    // Calculate overall confidence
    const confidence = this.calculateConfidence(totalWords);

    return {
      dominance,
      topicInitiation,
      pursuerWithdrawer,
      emotionalReciprocity,
      validationBalance,
      supportBalance,
      escalationTendency,
      deescalationSkill,
      resolutionRate,
      positiveToNegativeRatio,
      relationshipStrengths: strengths,
      growthOpportunities: growthAreas,
      confidence,
    };
  }

  /**
   * Analyze pursuer-withdrawer dynamic.
   * Pursuer: More questions, more emotion words, more "you" language
   * Withdrawer: More stonewalling, shorter responses, more third person
   */
  private analyzePursuerWithdrawer(
    p1: ParticipantFeatures,
    p2: ParticipantFeatures,
  ): PursuerWithdrawerAnalysis {
    const indicators: string[] = [];

    // Calculate pursuer score for each participant
    let p1PursuerScore = 0;
    let p2PursuerScore = 0;

    // Pursuers ask more questions
    if (p1.features.questionFrequency > p2.features.questionFrequency + 10) {
      p1PursuerScore += 20;
      indicators.push(`${p1.participantName} asks more questions`);
    } else if (p2.features.questionFrequency > p1.features.questionFrequency + 10) {
      p2PursuerScore += 20;
      indicators.push(`${p2.participantName} asks more questions`);
    }

    // Pursuers use more emotional language
    const p1Emotions =
      p1.features.positiveEmotionWords + p1.features.negativeEmotionWords;
    const p2Emotions =
      p2.features.positiveEmotionWords + p2.features.negativeEmotionWords;
    if (p1Emotions > p2Emotions + 2) {
      p1PursuerScore += 15;
      indicators.push(`${p1.participantName} uses more emotional language`);
    } else if (p2Emotions > p1Emotions + 2) {
      p2PursuerScore += 15;
      indicators.push(`${p2.participantName} uses more emotional language`);
    }

    // Pursuers use more "you" language (seeking engagement)
    if (p1.features.secondPerson > p2.features.secondPerson + 5) {
      p1PursuerScore += 15;
      indicators.push(`${p1.participantName} uses more partner-focused language`);
    } else if (p2.features.secondPerson > p1.features.secondPerson + 5) {
      p2PursuerScore += 15;
      indicators.push(`${p2.participantName} uses more partner-focused language`);
    }

    // Withdrawers stonewall more
    if (p1.horsemen.stonewalling > p2.horsemen.stonewalling + 1) {
      p2PursuerScore += 20;
      indicators.push(`${p1.participantName} shows withdrawal patterns`);
    } else if (p2.horsemen.stonewalling > p1.horsemen.stonewalling + 1) {
      p1PursuerScore += 20;
      indicators.push(`${p2.participantName} shows withdrawal patterns`);
    }

    // Withdrawers have shorter average responses
    const p1AvgWords = p1.wordCount / Math.max(p1.messageCount, 1);
    const p2AvgWords = p2.wordCount / Math.max(p2.messageCount, 1);
    if (p1AvgWords < p2AvgWords * 0.6) {
      p2PursuerScore += 15;
      indicators.push(`${p1.participantName} gives shorter responses`);
    } else if (p2AvgWords < p1AvgWords * 0.6) {
      p1PursuerScore += 15;
      indicators.push(`${p2.participantName} gives shorter responses`);
    }

    // Determine if there's a clear pursuer-withdrawer pattern
    const scoreDiff = Math.abs(p1PursuerScore - p2PursuerScore);
    const isPursuerWithdrawer = scoreDiff >= 25;

    let pursuerId: string | undefined;
    let withdrawerId: string | undefined;

    if (isPursuerWithdrawer) {
      if (p1PursuerScore > p2PursuerScore) {
        pursuerId = p1.userId || p1.participantName;
        withdrawerId = p2.userId || p2.participantName;
      } else {
        pursuerId = p2.userId || p2.participantName;
        withdrawerId = p1.userId || p1.participantName;
      }
    }

    return {
      isPursuerWithdrawer,
      pursuerId,
      withdrawerId,
      confidence: Math.min(100, 50 + scoreDiff),
      indicators,
    };
  }

  /**
   * Calculate emotional reciprocity (balance of emotional expression)
   */
  private calculateEmotionalReciprocity(
    p1: ParticipantFeatures,
    p2: ParticipantFeatures,
  ): number {
    const p1Emotions =
      p1.features.positiveEmotionWords + p1.features.negativeEmotionWords;
    const p2Emotions =
      p2.features.positiveEmotionWords + p2.features.negativeEmotionWords;

    if (p1Emotions === 0 && p2Emotions === 0) return 50;

    const total = p1Emotions + p2Emotions;
    const p1Share = p1Emotions / total;
    const p2Share = p2Emotions / total;

    // Perfect balance = 100, complete imbalance = 0
    const imbalance = Math.abs(p1Share - p2Share);
    return Math.round((1 - imbalance) * 100);
  }

  /**
   * Calculate validation balance (mutual positive acknowledgment)
   */
  private calculateValidationBalance(
    p1: ParticipantFeatures,
    p2: ParticipantFeatures,
  ): number {
    // Approximated by positive emotion balance and low criticism
    const p1Positive = p1.features.positiveEmotionWords;
    const p2Positive = p2.features.positiveEmotionWords;
    const totalCriticism = p1.horsemen.criticism + p2.horsemen.criticism;

    let score = 50;

    // Both expressing positive emotions
    if (p1Positive > 2 && p2Positive > 2) score += 20;
    else if (p1Positive > 2 || p2Positive > 2) score += 10;

    // Low criticism indicates mutual validation
    if (totalCriticism === 0) score += 20;
    else if (totalCriticism <= 2) score += 10;
    else score -= totalCriticism * 5;

    // "We" language indicates mutual validation
    if (p1.features.firstPersonPlural > 2 && p2.features.firstPersonPlural > 2) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate support balance (mutual supportive language)
   */
  private calculateSupportBalance(
    p1: ParticipantFeatures,
    p2: ParticipantFeatures,
  ): number {
    let score = 50;

    // Both making repair attempts shows mutual support
    if (p1.repairAttempts > 0 && p2.repairAttempts > 0) score += 25;
    else if (p1.repairAttempts > 0 || p2.repairAttempts > 0) score += 10;

    // Affiliation language indicates support
    const p1Affiliation = p1.features.affiliationWords;
    const p2Affiliation = p2.features.affiliationWords;
    if (p1Affiliation > 2 && p2Affiliation > 2) score += 15;
    else if (p1Affiliation > 2 || p2Affiliation > 2) score += 5;

    // Contempt severely undermines support
    if (p1.horsemen.contempt > 0 || p2.horsemen.contempt > 0) {
      score -= (p1.horsemen.contempt + p2.horsemen.contempt) * 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze conflict patterns
   */
  private analyzeConflictPatterns(
    p1: ParticipantFeatures,
    p2: ParticipantFeatures,
  ): {
    escalationTendency: number;
    deescalationSkill: number;
    resolutionRate: number;
  } {
    const totalHorsemen =
      p1.horsemen.criticism +
      p1.horsemen.contempt +
      p1.horsemen.defensiveness +
      p1.horsemen.stonewalling +
      p2.horsemen.criticism +
      p2.horsemen.contempt +
      p2.horsemen.defensiveness +
      p2.horsemen.stonewalling;

    const totalRepairs = p1.repairAttempts + p2.repairAttempts;

    // Escalation tendency: high horsemen, high certainty words, high negative emotions
    let escalationTendency = 30;
    escalationTendency += totalHorsemen * 5;
    if (p1.features.certaintyWords > 5 || p2.features.certaintyWords > 5) {
      escalationTendency += 10;
    }
    if (p1.features.negativeEmotionWords > 4 || p2.features.negativeEmotionWords > 4) {
      escalationTendency += 15;
    }

    // Deescalation skill: repair attempts, tentative language, low contempt
    let deescalationSkill = 40;
    deescalationSkill += totalRepairs * 8;
    if (p1.features.tentativeWords > 3 && p2.features.tentativeWords > 3) {
      deescalationSkill += 15;
    }
    if (p1.horsemen.contempt === 0 && p2.horsemen.contempt === 0) {
      deescalationSkill += 15;
    }

    // Resolution rate: estimated based on repair attempts vs horsemen
    let resolutionRate = 50;
    if (totalHorsemen > 0) {
      const repairToHorsemenRatio = totalRepairs / totalHorsemen;
      resolutionRate = Math.min(100, 30 + repairToHorsemenRatio * 40);
    } else if (totalRepairs > 0) {
      resolutionRate = 80;
    }

    return {
      escalationTendency: Math.min(100, escalationTendency),
      deescalationSkill: Math.min(100, deescalationSkill),
      resolutionRate: Math.min(100, resolutionRate),
    };
  }

  /**
   * Calculate Gottman ratio (positive to negative interaction ratio)
   * Healthy relationships maintain roughly 5:1 ratio
   */
  private calculateGottmanRatio(
    p1: ParticipantFeatures,
    p2: ParticipantFeatures,
  ): number {
    const positive =
      p1.features.positiveEmotionWords +
      p2.features.positiveEmotionWords +
      p1.features.affiliationWords +
      p2.features.affiliationWords +
      p1.repairAttempts +
      p2.repairAttempts;

    const negative =
      p1.features.negativeEmotionWords +
      p2.features.negativeEmotionWords +
      p1.horsemen.criticism +
      p1.horsemen.contempt +
      p1.horsemen.defensiveness +
      p2.horsemen.criticism +
      p2.horsemen.contempt +
      p2.horsemen.defensiveness;

    if (negative === 0) {
      return positive > 0 ? 10 : 1; // Cap at 10:1
    }

    return Math.round((positive / negative) * 10) / 10;
  }

  /**
   * Identify relationship strengths and growth opportunities
   */
  private identifyStrengthsAndGrowth(
    p1: ParticipantFeatures,
    p2: ParticipantFeatures,
    gottmanRatio: number,
    emotionalReciprocity: number,
    pursuerWithdrawer: PursuerWithdrawerAnalysis,
  ): { strengths: string[]; growthAreas: string[] } {
    const strengths: string[] = [];
    const growthAreas: string[] = [];

    // Gottman ratio analysis
    if (gottmanRatio >= 5) {
      strengths.push('healthy_positive_negative_ratio');
    } else if (gottmanRatio < 2) {
      growthAreas.push('increase_positive_interactions');
    }

    // Emotional reciprocity
    if (emotionalReciprocity >= 70) {
      strengths.push('balanced_emotional_expression');
    } else if (emotionalReciprocity < 40) {
      growthAreas.push('emotional_balance');
    }

    // Repair attempts
    if (p1.repairAttempts > 0 && p2.repairAttempts > 0) {
      strengths.push('mutual_repair_attempts');
    } else if (p1.repairAttempts === 0 && p2.repairAttempts === 0) {
      growthAreas.push('repair_skills');
    }

    // "We" language
    if (p1.features.firstPersonPlural > 2 && p2.features.firstPersonPlural > 2) {
      strengths.push('shared_identity');
    }

    // Pursuer-withdrawer pattern
    if (pursuerWithdrawer.isPursuerWithdrawer) {
      growthAreas.push('pursuer_withdrawer_pattern');
    }

    // Contempt (relationship poison)
    if (p1.horsemen.contempt > 0 || p2.horsemen.contempt > 0) {
      growthAreas.push('reduce_contempt');
    }

    // Low criticism
    if (p1.horsemen.criticism <= 1 && p2.horsemen.criticism <= 1) {
      strengths.push('constructive_feedback');
    }

    // Humor/exclamations
    if (p1.features.exclamationFrequency > 15 && p2.features.exclamationFrequency > 15) {
      strengths.push('shared_enthusiasm');
    }

    // Affiliation
    if (p1.features.affiliationWords > 2 || p2.features.affiliationWords > 2) {
      strengths.push('connection_language');
    }

    return { strengths, growthAreas };
  }

  /**
   * Generate couple narrative using LLM
   */
  async generateCoupleNarrative(
    dynamics: RelationshipDynamicsAnalysis,
    participant1Name: string,
    participant2Name: string,
  ): Promise<{ dynamicNarrative: string; coachingFocus: string }> {
    if (!this.openai) {
      return this.generateFallbackCoupleNarrative(
        dynamics,
        participant1Name,
        participant2Name,
      );
    }

    try {
      const prompt = `Analyze this couple's communication dynamics and provide insights:

DYNAMICS DATA:
- Conversation dominance: ${JSON.stringify(dynamics.dominance)}
- Emotional reciprocity: ${dynamics.emotionalReciprocity}/100
- Validation balance: ${dynamics.validationBalance}/100
- Support balance: ${dynamics.supportBalance}/100
- Escalation tendency: ${dynamics.escalationTendency}/100
- Deescalation skill: ${dynamics.deescalationSkill}/100
- Positive:Negative ratio: ${dynamics.positiveToNegativeRatio}:1 (5:1 is healthy target)
- Pursuer-withdrawer pattern: ${dynamics.pursuerWithdrawer.isPursuerWithdrawer ? 'Yes' : 'No'}
- Strengths: ${dynamics.relationshipStrengths.join(', ') || 'None identified'}
- Growth areas: ${dynamics.growthOpportunities.join(', ') || 'None identified'}

Generate two sections:

DYNAMIC_NARRATIVE:
[2-3 sentences describing how ${participant1Name} and ${participant2Name} interact, in warm accessible language]

COACHING_FOCUS:
[2-3 sentences about what this couple should focus on to strengthen their relationship]`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a compassionate couples therapist providing insights about relationship dynamics. Be warm, specific, and actionable. Focus on growth rather than blame.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || '';
      const narrativeMatch = content.match(
        /DYNAMIC_NARRATIVE:\s*([^]*?)(?=COACHING_FOCUS:|$)/i,
      );
      const coachingMatch = content.match(/COACHING_FOCUS:\s*([^]*?)$/i);

      return {
        dynamicNarrative:
          narrativeMatch?.[1]?.trim() ||
          'Analysis in progress.',
        coachingFocus:
          coachingMatch?.[1]?.trim() ||
          'Continue building your communication skills together.',
      };
    } catch {
      return this.generateFallbackCoupleNarrative(
        dynamics,
        participant1Name,
        participant2Name,
      );
    }
  }

  private generateFallbackCoupleNarrative(
    dynamics: RelationshipDynamicsAnalysis,
    participant1Name: string,
    participant2Name: string,
  ): { dynamicNarrative: string; coachingFocus: string } {
    const narrativeParts: string[] = [];
    const coachingParts: string[] = [];

    // Conversation balance
    const dominanceValues = Object.values(dynamics.dominance);
    const dominanceDiff = Math.abs(dominanceValues[0] - dominanceValues[1]);
    if (dominanceDiff < 20) {
      narrativeParts.push(
        `${participant1Name} and ${participant2Name} share conversation time fairly equally, indicating mutual engagement.`,
      );
    } else {
      const dominant = Object.entries(dynamics.dominance).sort(
        ([, a], [, b]) => b - a,
      )[0][0];
      narrativeParts.push(
        `${dominant} tends to take more conversation space, which may mean ${participant1Name === dominant ? participant2Name : participant1Name} has fewer opportunities to express themselves.`,
      );
      coachingParts.push(
        'Practice active listening and ensure both partners have space to share.',
      );
    }

    // Gottman ratio
    if (dynamics.positiveToNegativeRatio >= 5) {
      narrativeParts.push(
        'Your positive-to-negative interaction ratio is healthy, creating a foundation of warmth.',
      );
    } else if (dynamics.positiveToNegativeRatio < 2) {
      narrativeParts.push(
        'There are opportunities to increase positive interactions to strengthen your emotional connection.',
      );
      coachingParts.push(
        'Try expressing appreciation, affection, and gratitude more frequently.',
      );
    }

    // Pursuer-withdrawer
    if (dynamics.pursuerWithdrawer.isPursuerWithdrawer) {
      coachingParts.push(
        'Work on the pursuer-withdrawer pattern - the pursuing partner can give space while the withdrawing partner can practice engaging.',
      );
    }

    // Contempt
    if (dynamics.growthOpportunities.includes('reduce_contempt')) {
      coachingParts.push(
        'Contempt is particularly harmful to relationships. Practice replacing criticism with specific, kind requests.',
      );
    }

    return {
      dynamicNarrative:
        narrativeParts.join(' ') ||
        `${participant1Name} and ${participant2Name} are building their communication patterns together.`,
      coachingFocus:
        coachingParts.join(' ') ||
        'Continue practicing open, honest communication and expressing appreciation for each other.',
    };
  }

  private calculateConfidence(totalWords: number): number {
    if (totalWords < 100) return 15;
    if (totalWords < 300) return 30;
    if (totalWords < 500) return 50;
    if (totalWords < 1000) return 65;
    if (totalWords < 2000) return 80;
    return 90;
  }

  /**
   * Get human-readable description for a relationship strength
   */
  getStrengthDescription(strength: string): string {
    const descriptions: Record<string, string> = {
      healthy_positive_negative_ratio:
        'You maintain a healthy balance of positive to negative interactions, which research shows is crucial for relationship satisfaction.',
      balanced_emotional_expression:
        'Both partners express emotions openly and equally, creating emotional intimacy.',
      mutual_repair_attempts:
        'When things get tense, both of you work to repair the connection.',
      shared_identity:
        'You frequently use "we" language, indicating a strong sense of partnership.',
      constructive_feedback:
        'You give feedback without attacking each other\'s character.',
      shared_enthusiasm:
        'You share enthusiasm and energy in your conversations.',
      connection_language:
        'Your language reflects care for connection and togetherness.',
    };
    return descriptions[strength] || strength;
  }

  /**
   * Get human-readable description for a growth opportunity
   */
  getGrowthDescription(growthArea: string): string {
    const descriptions: Record<string, string> = {
      increase_positive_interactions:
        'Focus on increasing expressions of appreciation, affection, and positive feedback.',
      emotional_balance:
        'Work toward more balanced emotional expression, where both partners feel safe sharing feelings.',
      repair_skills:
        'Practice making repair attempts when conversations get difficult - a simple "I\'m sorry" or "Let\'s take a break" can help.',
      pursuer_withdrawer_pattern:
        'Notice the pattern where one partner pursues connection while the other withdraws, and work to meet in the middle.',
      reduce_contempt:
        'Contempt (eye-rolling, sarcasm, mockery) is particularly harmful. Practice expressing frustration without attacking.',
    };
    return descriptions[growthArea] || growthArea;
  }
}
