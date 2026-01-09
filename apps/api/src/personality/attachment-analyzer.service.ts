import { Injectable } from '@nestjs/common';
import { AttachmentStyle, CommunicationStyle } from '@prisma/client';
import { LinguisticFeatures } from './linguistic-analysis.service';

/**
 * Attachment style analysis based on Bowlby's attachment theory and
 * Bartholomew & Horowitz's four-category model.
 *
 * Attachment dimensions:
 * - Anxiety (fear of abandonment): High I-focus, negative emotions, reassurance-seeking
 * - Avoidance (discomfort with closeness): Low we-focus, fewer emotion words, distancing language
 *
 * Four styles:
 * - SECURE: Low anxiety, low avoidance
 * - ANXIOUS_PREOCCUPIED: High anxiety, low avoidance
 * - DISMISSIVE_AVOIDANT: Low anxiety, high avoidance
 * - FEARFUL_AVOIDANT: High anxiety, high avoidance
 */
export interface AttachmentAnalysis {
  style: AttachmentStyle;
  anxietyScore: number; // 0-100
  avoidanceScore: number; // 0-100
  confidence: number; // 0-100 based on data quantity
  indicators: string[];
}

/**
 * Communication style analysis based on Virginia Satir's model.
 *
 * Five communication patterns:
 * - PLACATER: Agrees, apologizes, seeks harmony
 * - BLAMER: Attacks, criticizes, dominates
 * - COMPUTER: Intellectualizes, uses logic, avoids emotions
 * - DISTRACTER: Changes topics, uses humor to deflect
 * - LEVELER: Direct, authentic, balanced (healthy)
 */
export interface CommunicationAnalysis {
  style: CommunicationStyle;
  placaterScore: number;
  blamerScore: number;
  computerScore: number;
  distracterScore: number;
  levelerScore: number;
  confidence: number;
  indicators: string[];
}

/**
 * Conflict style analysis based on Thomas-Kilmann model.
 *
 * Five conflict handling modes:
 * - Avoiding: Low assertiveness, low cooperation
 * - Accommodating: Low assertiveness, high cooperation
 * - Competing: High assertiveness, low cooperation
 * - Compromising: Medium assertiveness, medium cooperation
 * - Collaborating: High assertiveness, high cooperation
 */
export type ConflictStyle =
  | 'avoiding'
  | 'accommodating'
  | 'competing'
  | 'compromising'
  | 'collaborating';

export interface ConflictStyleAnalysis {
  style: ConflictStyle;
  assertivenessScore: number; // 0-100
  cooperativenessScore: number; // 0-100
  confidence: number;
  indicators: string[];
}

@Injectable()
export class AttachmentAnalyzerService {
  /**
   * Analyze attachment style from linguistic features
   */
  analyzeAttachment(
    features: LinguisticFeatures,
    horsemen: { criticism: number; contempt: number; defensiveness: number; stonewalling: number },
    repairAttempts: number,
  ): AttachmentAnalysis {
    const indicators: string[] = [];

    // Calculate anxiety score (fear of abandonment)
    let anxietyScore = 0;

    // High self-focus indicates anxiety
    if (features.firstPersonSingular > 10) {
      anxietyScore += 15;
      indicators.push('High self-focus language');
    }
    if (features.firstPersonSingular > 15) {
      anxietyScore += 10;
    }

    // Negative emotions indicate anxiety
    if (features.negativeEmotionWords > 3) {
      anxietyScore += 15;
      indicators.push('Elevated negative emotion expression');
    }
    if (features.anxietyWords > 1) {
      anxietyScore += 20;
      indicators.push('Anxiety-related language');
    }

    // Certainty words can indicate anxious attachment
    if (features.certaintyWords > 5) {
      anxietyScore += 10;
      indicators.push('Absolutist language patterns');
    }

    // Questions can indicate seeking reassurance
    if (features.questionFrequency > 40) {
      anxietyScore += 15;
      indicators.push('High question frequency (reassurance-seeking)');
    }

    // Discrepancy words indicate unmet needs
    if (features.discrepancyWords > 3) {
      anxietyScore += 10;
      indicators.push('Expressions of unmet expectations');
    }

    // Defensiveness indicates anxiety about relationship
    if (horsemen.defensiveness > 2) {
      anxietyScore += 10;
      indicators.push('Defensive communication patterns');
    }

    // Calculate avoidance score (discomfort with closeness)
    let avoidanceScore = 0;

    // Low we-focus indicates avoidance
    if (features.firstPersonPlural < 2) {
      avoidanceScore += 20;
      indicators.push('Low shared identity language ("we")');
    }

    // Low emotion words indicate emotional distancing
    if (features.positiveEmotionWords < 2 && features.negativeEmotionWords < 1) {
      avoidanceScore += 15;
      indicators.push('Limited emotional expression');
    }

    // High third person indicates distancing
    if (features.thirdPerson > 5) {
      avoidanceScore += 10;
      indicators.push('Distancing language patterns');
    }

    // Computer-like language (low emotion, high logic words)
    if (features.tentativeWords > 5 && features.positiveEmotionWords < 3) {
      avoidanceScore += 10;
      indicators.push('Intellectualized communication');
    }

    // Stonewalling indicates avoidance
    if (horsemen.stonewalling > 2) {
      avoidanceScore += 20;
      indicators.push('Withdrawal/stonewalling patterns');
    }

    // Low affiliation words indicate avoidance
    if (features.affiliationWords < 1) {
      avoidanceScore += 10;
      indicators.push('Low connection language');
    }

    // Low repair attempts indicate avoidance
    if (repairAttempts === 0 && features.totalWords > 100) {
      avoidanceScore += 15;
      indicators.push('Minimal repair attempts');
    }

    // Cap scores at 100
    anxietyScore = Math.min(100, anxietyScore);
    avoidanceScore = Math.min(100, avoidanceScore);

    // Determine attachment style based on quadrant
    const style = this.determineAttachmentStyle(anxietyScore, avoidanceScore);

    // Confidence based on word count
    const confidence = this.calculateConfidence(features.totalWords);

    return {
      style,
      anxietyScore,
      avoidanceScore,
      confidence,
      indicators,
    };
  }

  private determineAttachmentStyle(anxiety: number, avoidance: number): AttachmentStyle {
    const highThreshold = 40;
    const highAnxiety = anxiety >= highThreshold;
    const highAvoidance = avoidance >= highThreshold;

    if (!highAnxiety && !highAvoidance) {
      return AttachmentStyle.SECURE;
    } else if (highAnxiety && !highAvoidance) {
      return AttachmentStyle.ANXIOUS_PREOCCUPIED;
    } else if (!highAnxiety && highAvoidance) {
      return AttachmentStyle.DISMISSIVE_AVOIDANT;
    } else {
      return AttachmentStyle.FEARFUL_AVOIDANT;
    }
  }

  /**
   * Analyze Satir communication style from linguistic features
   */
  analyzeCommunicationStyle(
    features: LinguisticFeatures,
    horsemen: { criticism: number; contempt: number; defensiveness: number; stonewalling: number },
    repairAttempts: number,
  ): CommunicationAnalysis {
    const indicators: string[] = [];

    // PLACATER: agreeing, apologizing, peace-keeping
    let placaterScore = 0;
    if (features.tentativeWords > 5) {
      placaterScore += 20;
      indicators.push('Tentative language (Placater)');
    }
    if (features.hedgingPhrases > 30) {
      placaterScore += 20;
      indicators.push('Hedging phrases (Placater)');
    }
    if (repairAttempts > 3) {
      placaterScore += 15;
      indicators.push('Frequent repair attempts (Placater)');
    }
    // Affiliation words can indicate placating
    if (features.affiliationWords > 3) {
      placaterScore += 10;
    }

    // BLAMER: attacking, criticizing, dominating
    let blamerScore = 0;
    if (horsemen.criticism > 2) {
      blamerScore += 25;
      indicators.push('Critical language patterns (Blamer)');
    }
    if (horsemen.contempt > 1) {
      blamerScore += 30;
      indicators.push('Contemptuous expressions (Blamer)');
    }
    if (features.secondPerson > 15) {
      blamerScore += 15;
      indicators.push('High "you" focus (Blamer)');
    }
    if (features.certaintyWords > 5) {
      blamerScore += 10;
    }
    if (features.powerWords > 2) {
      blamerScore += 15;
      indicators.push('Power language (Blamer)');
    }

    // COMPUTER: intellectualizing, avoiding emotions
    let computerScore = 0;
    if (features.positiveEmotionWords < 2 && features.negativeEmotionWords < 2) {
      computerScore += 25;
      indicators.push('Low emotional expression (Computer)');
    }
    if (features.avgWordLength > 5) {
      computerScore += 10;
      indicators.push('Complex vocabulary (Computer)');
    }
    if (features.thirdPerson > 5) {
      computerScore += 15;
      indicators.push('Third-person distancing (Computer)');
    }
    if (features.tentativeWords > 3 && features.hedgingPhrases > 20) {
      computerScore += 15;
    }

    // DISTRACTER: deflecting, avoiding, changing topics
    let distracterScore = 0;
    if (horsemen.stonewalling > 2) {
      distracterScore += 25;
      indicators.push('Withdrawal patterns (Distracter)');
    }
    if (features.exclamationFrequency > 30) {
      distracterScore += 15;
      indicators.push('High exclamation usage (Distracter)');
    }
    // Short sentence length can indicate topic-hopping
    if (features.avgSentenceLength < 5) {
      distracterScore += 10;
    }

    // LEVELER: direct, authentic, balanced
    let levelerScore = 0;
    if (features.firstPersonPlural > 3) {
      levelerScore += 20;
      indicators.push('Shared identity language (Leveler)');
    }
    if (features.positiveEmotionWords > 3 && features.negativeEmotionWords < 3) {
      levelerScore += 15;
      indicators.push('Balanced positive expression (Leveler)');
    }
    if (repairAttempts > 0 && horsemen.criticism < 2 && horsemen.contempt < 1) {
      levelerScore += 25;
      indicators.push('Healthy conflict patterns (Leveler)');
    }
    if (features.affiliationWords > 2) {
      levelerScore += 15;
      indicators.push('Connection language (Leveler)');
    }
    // Low certainty words (not absolutist)
    if (features.certaintyWords < 3) {
      levelerScore += 10;
    }

    // Normalize scores
    const total = placaterScore + blamerScore + computerScore + distracterScore + levelerScore;
    if (total > 0) {
      placaterScore = (placaterScore / total) * 100;
      blamerScore = (blamerScore / total) * 100;
      computerScore = (computerScore / total) * 100;
      distracterScore = (distracterScore / total) * 100;
      levelerScore = (levelerScore / total) * 100;
    }

    // Determine dominant style
    const scores = {
      [CommunicationStyle.PLACATER]: placaterScore,
      [CommunicationStyle.BLAMER]: blamerScore,
      [CommunicationStyle.COMPUTER]: computerScore,
      [CommunicationStyle.DISTRACTER]: distracterScore,
      [CommunicationStyle.LEVELER]: levelerScore,
    };

    const maxScore = Math.max(...Object.values(scores));
    let style: CommunicationStyle = CommunicationStyle.MIXED;

    // Need clear winner (>10% difference from second place) to assign specific style
    const sortedScores = Object.values(scores).sort((a, b) => b - a);
    if (sortedScores[0] - sortedScores[1] > 10) {
      const winningEntry = Object.entries(scores).find(([, score]) => score === maxScore);
      if (winningEntry) {
        style = winningEntry[0] as CommunicationStyle;
      }
    }

    const confidence = this.calculateConfidence(features.totalWords);

    return {
      style,
      placaterScore,
      blamerScore,
      computerScore,
      distracterScore,
      levelerScore,
      confidence,
      indicators,
    };
  }

  /**
   * Analyze Thomas-Kilmann conflict style
   */
  analyzeConflictStyle(
    features: LinguisticFeatures,
    horsemen: { criticism: number; contempt: number; defensiveness: number; stonewalling: number },
    repairAttempts: number,
  ): ConflictStyleAnalysis {
    const indicators: string[] = [];

    // Assertiveness: standing up for own needs/views
    let assertivenessScore = 0;

    if (features.firstPersonSingular > 10) {
      assertivenessScore += 20;
      indicators.push('Self-advocacy through I-statements');
    }
    if (features.powerWords > 2) {
      assertivenessScore += 20;
      indicators.push('Power/control language');
    }
    if (horsemen.criticism > 1) {
      assertivenessScore += 15;
      indicators.push('Critical stance');
    }
    if (features.certaintyWords > 3) {
      assertivenessScore += 15;
      indicators.push('Confident/certain language');
    }
    if (features.achievementWords > 2) {
      assertivenessScore += 10;
    }

    // Cooperativeness: attending to partner's needs
    let cooperativenessScore = 0;

    if (features.firstPersonPlural > 3) {
      cooperativenessScore += 25;
      indicators.push('Partnership language ("we")');
    }
    if (features.secondPerson > 5 && horsemen.criticism < 2) {
      cooperativenessScore += 15;
      indicators.push('Partner-focused (non-critical)');
    }
    if (repairAttempts > 1) {
      cooperativenessScore += 20;
      indicators.push('Active repair attempts');
    }
    if (features.affiliationWords > 2) {
      cooperativenessScore += 15;
      indicators.push('Affiliation/connection language');
    }
    if (features.positiveEmotionWords > 3) {
      cooperativenessScore += 10;
    }
    if (features.tentativeWords > 3) {
      cooperativenessScore += 10;
      indicators.push('Openness to alternatives');
    }

    // Reduce cooperativeness for horsemen
    if (horsemen.contempt > 1) {
      cooperativenessScore -= 20;
    }
    if (horsemen.stonewalling > 2) {
      cooperativenessScore -= 15;
      assertivenessScore -= 10; // Stonewalling is also low assertiveness
    }

    // Cap scores
    assertivenessScore = Math.max(0, Math.min(100, assertivenessScore));
    cooperativenessScore = Math.max(0, Math.min(100, cooperativenessScore));

    // Determine conflict style based on quadrant
    const style = this.determineConflictStyle(assertivenessScore, cooperativenessScore);

    const confidence = this.calculateConfidence(features.totalWords);

    return {
      style,
      assertivenessScore,
      cooperativenessScore,
      confidence,
      indicators,
    };
  }

  private determineConflictStyle(assertiveness: number, cooperativeness: number): ConflictStyle {
    const midThreshold = 40;
    const highThreshold = 60;

    const highAssertive = assertiveness >= highThreshold;
    const lowAssertive = assertiveness < midThreshold;
    const highCooperative = cooperativeness >= highThreshold;
    const lowCooperative = cooperativeness < midThreshold;

    if (lowAssertive && lowCooperative) {
      return 'avoiding';
    } else if (lowAssertive && highCooperative) {
      return 'accommodating';
    } else if (highAssertive && lowCooperative) {
      return 'competing';
    } else if (highAssertive && highCooperative) {
      return 'collaborating';
    } else {
      return 'compromising';
    }
  }

  /**
   * Calculate confidence score based on word count
   * More words = more reliable inference
   */
  private calculateConfidence(wordCount: number): number {
    if (wordCount < 50) return 10;
    if (wordCount < 100) return 25;
    if (wordCount < 200) return 40;
    if (wordCount < 500) return 60;
    if (wordCount < 1000) return 75;
    if (wordCount < 2000) return 85;
    return 95;
  }

  /**
   * Generate human-readable description of attachment style
   */
  getAttachmentDescription(style: AttachmentStyle): string {
    const descriptions: Record<AttachmentStyle, string> = {
      [AttachmentStyle.SECURE]:
        'You tend to feel comfortable with emotional intimacy and are generally trusting in relationships. You can express your needs clearly and respond well to your partner\'s needs.',
      [AttachmentStyle.ANXIOUS_PREOCCUPIED]:
        'You may sometimes worry about the stability of your relationships and seek reassurance from your partner. You value closeness highly and may be very attuned to your partner\'s moods.',
      [AttachmentStyle.DISMISSIVE_AVOIDANT]:
        'You tend to value independence highly and may sometimes find it challenging to fully open up emotionally. You\'re often self-reliant and may prefer to handle things on your own.',
      [AttachmentStyle.FEARFUL_AVOIDANT]:
        'You may experience mixed feelings about closeness - wanting connection but also feeling uncomfortable with too much intimacy. This can create push-pull dynamics in relationships.',
      [AttachmentStyle.UNDETERMINED]:
        'We don\'t have enough information yet to determine your attachment style. Continue using the app to build a clearer picture.',
    };
    return descriptions[style];
  }

  /**
   * Generate human-readable description of communication style
   */
  getCommunicationDescription(style: CommunicationStyle): string {
    const descriptions: Record<CommunicationStyle, string> = {
      [CommunicationStyle.PLACATER]:
        'You tend to prioritize harmony and may sometimes put others\' needs before your own. While this shows empathy, remember that your needs matter too.',
      [CommunicationStyle.BLAMER]:
        'You communicate directly and assertively, which can be a strength. Be mindful that sometimes this directness may feel critical to your partner.',
      [CommunicationStyle.COMPUTER]:
        'You approach conversations analytically and logically. This thoughtfulness is valuable, though your partner may sometimes want more emotional connection.',
      [CommunicationStyle.DISTRACTER]:
        'You often use humor or change topics during difficult conversations. While this can defuse tension, it may prevent deeper connection.',
      [CommunicationStyle.LEVELER]:
        'You communicate authentically and directly while remaining respectful. This balanced approach creates space for genuine connection.',
      [CommunicationStyle.MIXED]:
        'Your communication style varies depending on the situation. This flexibility can be helpful, though developing more consistency may strengthen your communication.',
    };
    return descriptions[style];
  }
}
