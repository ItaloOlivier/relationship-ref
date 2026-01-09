import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { LinguisticFeatures } from './linguistic-analysis.service';
import {
  AttachmentAnalysis,
  CommunicationAnalysis,
  ConflictStyleAnalysis,
} from './attachment-analyzer.service';

/**
 * Big Five (OCEAN) personality model analysis.
 *
 * Based on extensive LIWC research correlating language patterns to personality:
 * - Openness: Complex vocabulary, varied topics, creative expression
 * - Conscientiousness: Organized language, achievement words, certainty
 * - Extraversion: Positive emotions, social words, exclamations
 * - Agreeableness: Affiliation words, positive emotions, "we" language
 * - Neuroticism: Negative emotions, anxiety words, self-focus
 *
 * Research sources:
 * - Pennebaker, J.W. & King, L.A. (1999). Linguistic styles
 * - Yarkoni, T. (2010). Personality in 100,000 words
 */
export interface BigFiveScores {
  openness: number; // 0-100
  conscientiousness: number; // 0-100
  extraversion: number; // 0-100
  agreeableness: number; // 0-100
  neuroticism: number; // 0-100
  confidence: number; // 0-100
}

export interface EmotionalIntelligenceScores {
  emotionalAwareness: number; // 0-100
  empathyScore: number; // 0-100
  emotionalRegulation: number; // 0-100
  confidence: number;
}

export interface PersonalityNarratives {
  strengthsNarrative: string;
  growthAreasNarrative: string;
  communicationNarrative: string;
}

@Injectable()
export class BigFiveAnalyzerService {
  private openai: OpenAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Infer Big Five personality traits from linguistic features.
   * Based on Pennebaker's LIWC research correlations.
   */
  analyzeBigFive(features: LinguisticFeatures): BigFiveScores {
    // Start at 50 (neutral) and adjust based on linguistic markers

    // OPENNESS: curiosity, creativity, openness to experience
    // Correlates with: longer words, varied vocabulary, tentative language
    let openness = 50;
    if (features.avgWordLength > 5) openness += 10;
    if (features.avgWordLength > 6) openness += 5;
    const vocabRichness = features.uniqueWords / Math.max(features.totalWords, 1);
    if (vocabRichness > 0.7) openness += 10;
    if (vocabRichness > 0.8) openness += 5;
    if (features.tentativeWords > 4) openness += 5; // Open to possibilities
    if (features.questionFrequency > 30) openness += 5; // Curious

    // CONSCIENTIOUSNESS: organization, dependability, self-discipline
    // Correlates with: achievement words, certainty, low negative emotions
    let conscientiousness = 50;
    if (features.achievementWords > 2) conscientiousness += 15;
    if (features.achievementWords > 4) conscientiousness += 10;
    if (features.certaintyWords > 3) conscientiousness += 5;
    if (features.discrepancyWords > 3) conscientiousness -= 5; // Should/would/could
    if (features.negativeEmotionWords < 2) conscientiousness += 5;

    // EXTRAVERSION: sociability, assertiveness, positive emotions
    // Correlates with: positive emotions, social words, exclamations
    let extraversion = 50;
    if (features.positiveEmotionWords > 3) extraversion += 15;
    if (features.positiveEmotionWords > 5) extraversion += 10;
    if (features.affiliationWords > 2) extraversion += 10;
    if (features.exclamationFrequency > 20) extraversion += 10;
    if (features.firstPersonPlural > 3) extraversion += 5;
    // Introverts use more tentative language
    if (features.tentativeWords > 5) extraversion -= 10;

    // AGREEABLENESS: cooperation, trust, empathy
    // Correlates with: affiliation words, positive emotions, "we" language, low power words
    let agreeableness = 50;
    if (features.firstPersonPlural > 3) agreeableness += 15;
    if (features.affiliationWords > 2) agreeableness += 10;
    if (features.positiveEmotionWords > 3) agreeableness += 10;
    if (features.powerWords > 3) agreeableness -= 15;
    if (features.angerWords > 2) agreeableness -= 10;
    if (features.hedgingPhrases > 20) agreeableness += 5; // Considerate of others

    // NEUROTICISM: emotional instability, anxiety, moodiness
    // Correlates with: negative emotions, anxiety words, self-focus (I), certainty words
    let neuroticism = 50;
    if (features.negativeEmotionWords > 3) neuroticism += 15;
    if (features.negativeEmotionWords > 5) neuroticism += 10;
    if (features.anxietyWords > 1) neuroticism += 15;
    if (features.anxietyWords > 2) neuroticism += 10;
    if (features.firstPersonSingular > 12) neuroticism += 10; // High self-focus
    if (features.sadnessWords > 1) neuroticism += 10;
    if (features.positiveEmotionWords > 4 && features.negativeEmotionWords < 2)
      neuroticism -= 10;

    // Clamp all scores to 0-100
    openness = Math.max(0, Math.min(100, openness));
    conscientiousness = Math.max(0, Math.min(100, conscientiousness));
    extraversion = Math.max(0, Math.min(100, extraversion));
    agreeableness = Math.max(0, Math.min(100, agreeableness));
    neuroticism = Math.max(0, Math.min(100, neuroticism));

    const confidence = this.calculateConfidence(features.totalWords);

    return {
      openness,
      conscientiousness,
      extraversion,
      agreeableness,
      neuroticism,
      confidence,
    };
  }

  /**
   * Analyze emotional intelligence from linguistic and behavioral features
   */
  analyzeEmotionalIntelligence(
    features: LinguisticFeatures,
    horsemen: { criticism: number; contempt: number; defensiveness: number; stonewalling: number },
    repairAttempts: number,
  ): EmotionalIntelligenceScores {
    // Emotional Awareness: recognition of own emotions
    let emotionalAwareness = 50;
    const totalEmotionWords =
      features.positiveEmotionWords +
      features.negativeEmotionWords +
      features.anxietyWords +
      features.angerWords +
      features.sadnessWords;
    if (totalEmotionWords > 3) emotionalAwareness += 15;
    if (totalEmotionWords > 6) emotionalAwareness += 10;
    if (features.firstPersonSingular > 8) emotionalAwareness += 10; // Self-reflection
    // Hedging about feelings shows awareness
    if (features.hedgingPhrases > 15 && totalEmotionWords > 2) emotionalAwareness += 5;

    // Empathy: recognition of partner's emotions
    let empathyScore = 50;
    if (features.secondPerson > 5 && horsemen.criticism < 2) empathyScore += 15;
    if (features.firstPersonPlural > 3) empathyScore += 10; // Shared experience
    if (features.questionFrequency > 25) empathyScore += 10; // Asking about partner
    if (repairAttempts > 1) empathyScore += 15;
    if (horsemen.contempt > 1) empathyScore -= 20;
    if (horsemen.criticism > 2) empathyScore -= 10;

    // Emotional Regulation: ability to manage emotional responses
    let emotionalRegulation = 50;
    // Low negative despite conflict indicates regulation
    if (features.negativeEmotionWords < 3 && features.totalWords > 100)
      emotionalRegulation += 10;
    if (repairAttempts > 0) emotionalRegulation += 15;
    if (repairAttempts > 2) emotionalRegulation += 10;
    // Horsemen indicate poor regulation
    if (horsemen.contempt > 0) emotionalRegulation -= 15;
    if (horsemen.stonewalling > 1) emotionalRegulation -= 10;
    if (horsemen.defensiveness > 2) emotionalRegulation -= 10;
    // Tentative language shows measured responses
    if (features.tentativeWords > 3 && features.certaintyWords < 4)
      emotionalRegulation += 10;

    // Clamp scores
    emotionalAwareness = Math.max(0, Math.min(100, emotionalAwareness));
    empathyScore = Math.max(0, Math.min(100, empathyScore));
    emotionalRegulation = Math.max(0, Math.min(100, emotionalRegulation));

    const confidence = this.calculateConfidence(features.totalWords);

    return {
      emotionalAwareness,
      empathyScore,
      emotionalRegulation,
      confidence,
    };
  }

  /**
   * Generate human-readable narrative descriptions using LLM synthesis
   */
  async generateNarratives(
    bigFive: BigFiveScores,
    attachment: AttachmentAnalysis,
    communication: CommunicationAnalysis,
    conflict: ConflictStyleAnalysis,
    emotionalIntelligence: EmotionalIntelligenceScores,
  ): Promise<PersonalityNarratives> {
    if (!this.openai) {
      return this.generateFallbackNarratives(
        bigFive,
        attachment,
        communication,
        conflict,
        emotionalIntelligence,
      );
    }

    try {
      const prompt = this.buildNarrativePrompt(
        bigFive,
        attachment,
        communication,
        conflict,
        emotionalIntelligence,
      );

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a compassionate relationship coach helping individuals understand their communication patterns. Generate warm, supportive, and actionable personality insights. Be specific but not clinical. Focus on growth potential rather than deficits. Use second person ("You..."). Keep each section to 2-3 sentences.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseNarrativeResponse(content);
    } catch {
      return this.generateFallbackNarratives(
        bigFive,
        attachment,
        communication,
        conflict,
        emotionalIntelligence,
      );
    }
  }

  private buildNarrativePrompt(
    bigFive: BigFiveScores,
    attachment: AttachmentAnalysis,
    communication: CommunicationAnalysis,
    conflict: ConflictStyleAnalysis,
    emotionalIntelligence: EmotionalIntelligenceScores,
  ): string {
    return `Based on this person's communication analysis, generate three short narratives:

PERSONALITY DATA:
- Big Five: Openness ${bigFive.openness}/100, Conscientiousness ${bigFive.conscientiousness}/100, Extraversion ${bigFive.extraversion}/100, Agreeableness ${bigFive.agreeableness}/100, Neuroticism ${bigFive.neuroticism}/100
- Attachment Style: ${attachment.style} (Anxiety: ${attachment.anxietyScore}/100, Avoidance: ${attachment.avoidanceScore}/100)
- Communication Style: ${communication.style}
- Conflict Style: ${conflict.style} (Assertiveness: ${conflict.assertivenessScore}/100, Cooperativeness: ${conflict.cooperativenessScore}/100)
- Emotional Intelligence: Awareness ${emotionalIntelligence.emotionalAwareness}/100, Empathy ${emotionalIntelligence.empathyScore}/100, Regulation ${emotionalIntelligence.emotionalRegulation}/100

Generate three sections in this exact format:

STRENGTHS:
[2-3 sentences about their communication strengths based on the data]

GROWTH_AREAS:
[2-3 sentences about areas for growth, framed positively]

COMMUNICATION:
[2-3 sentences about their communication style and how it affects their relationship]`;
  }

  private parseNarrativeResponse(content: string): PersonalityNarratives {
    const strengthsMatch = content.match(/STRENGTHS:\s*([^]*?)(?=GROWTH_AREAS:|$)/i);
    const growthMatch = content.match(/GROWTH_AREAS:\s*([^]*?)(?=COMMUNICATION:|$)/i);
    const commMatch = content.match(/COMMUNICATION:\s*([^]*?)$/i);

    return {
      strengthsNarrative: strengthsMatch?.[1]?.trim() || 'Profile data insufficient for strengths analysis.',
      growthAreasNarrative: growthMatch?.[1]?.trim() || 'Profile data insufficient for growth areas analysis.',
      communicationNarrative: commMatch?.[1]?.trim() || 'Profile data insufficient for communication analysis.',
    };
  }

  /**
   * Generate fallback narratives when LLM is unavailable
   */
  private generateFallbackNarratives(
    bigFive: BigFiveScores,
    attachment: AttachmentAnalysis,
    communication: CommunicationAnalysis,
    conflict: ConflictStyleAnalysis,
    emotionalIntelligence: EmotionalIntelligenceScores,
  ): PersonalityNarratives {
    // Build strengths based on high scores
    const strengths: string[] = [];
    if (bigFive.agreeableness > 60) {
      strengths.push('You show a natural ability to connect with your partner and prioritize harmony in your relationship.');
    }
    if (bigFive.openness > 60) {
      strengths.push('Your openness to new ideas and experiences brings richness to your conversations.');
    }
    if (emotionalIntelligence.empathyScore > 60) {
      strengths.push('Your empathy helps you understand and respond to your partner\'s emotional needs.');
    }
    if (emotionalIntelligence.emotionalRegulation > 60) {
      strengths.push('You demonstrate good emotional regulation, helping maintain calm during difficult conversations.');
    }
    if (attachment.style === 'SECURE') {
      strengths.push('Your secure attachment style provides a stable foundation for open communication.');
    }

    // Build growth areas based on lower scores or concerning patterns
    const growthAreas: string[] = [];
    if (bigFive.neuroticism > 60) {
      growthAreas.push('Managing stress and anxiety could help you communicate more effectively during conflicts.');
    }
    if (attachment.anxietyScore > 50) {
      growthAreas.push('Building trust in your relationship\'s stability may help you feel more secure in expressing your needs.');
    }
    if (attachment.avoidanceScore > 50) {
      growthAreas.push('Opening up more emotionally could deepen your connection with your partner.');
    }
    if (emotionalIntelligence.emotionalAwareness < 50) {
      growthAreas.push('Taking time to identify and name your emotions could enhance your self-understanding.');
    }

    // Build communication narrative based on style
    let communicationNarrative = '';
    switch (communication.style) {
      case 'PLACATER':
        communicationNarrative = 'You tend to prioritize harmony and may sometimes put your partner\'s needs before your own. While this shows care, remember that your feelings matter equally.';
        break;
      case 'BLAMER':
        communicationNarrative = 'You communicate directly and assertively. Balancing this strength with curiosity about your partner\'s perspective can lead to more productive conversations.';
        break;
      case 'COMPUTER':
        communicationNarrative = 'You bring a thoughtful, analytical approach to discussions. Adding more emotional expression could help your partner feel more connected.';
        break;
      case 'DISTRACTER':
        communicationNarrative = 'You often use humor or redirection during difficult moments. While this can ease tension, staying present with difficult topics can deepen understanding.';
        break;
      case 'LEVELER':
        communicationNarrative = 'You communicate authentically and directly while remaining respectful. This balanced approach creates space for genuine connection.';
        break;
      default:
        communicationNarrative = `Your ${conflict.style} approach to conflict, combined with your communication patterns, shapes how you navigate disagreements with your partner.`;
    }

    return {
      strengthsNarrative: strengths.length > 0
        ? strengths.slice(0, 2).join(' ')
        : 'Continue building your communication skills through regular practice and reflection.',
      growthAreasNarrative: growthAreas.length > 0
        ? growthAreas.slice(0, 2).join(' ')
        : 'Every relationship has room for growth. Pay attention to patterns that work well and areas where you\'d like to improve.',
      communicationNarrative,
    };
  }

  /**
   * Get human-readable description for Big Five trait
   */
  getTraitDescription(trait: keyof BigFiveScores, score: number): string {
    const level = score > 65 ? 'high' : score < 35 ? 'low' : 'moderate';

    const descriptions: Record<string, Record<string, string>> = {
      openness: {
        high: 'You\'re curious, creative, and enjoy exploring new ideas and experiences.',
        moderate: 'You balance openness to new experiences with appreciation for the familiar.',
        low: 'You tend to prefer familiar routines and practical, concrete thinking.',
      },
      conscientiousness: {
        high: 'You\'re organized, dependable, and goal-oriented in your approach.',
        moderate: 'You balance structure with flexibility in your daily life.',
        low: 'You prefer spontaneity and flexibility over rigid planning.',
      },
      extraversion: {
        high: 'You draw energy from social interaction and express yourself enthusiastically.',
        moderate: 'You enjoy both social time and quiet reflection.',
        low: 'You recharge through quiet time and prefer deeper one-on-one connections.',
      },
      agreeableness: {
        high: 'You\'re naturally cooperative, trusting, and empathetic toward others.',
        moderate: 'You balance compassion for others with attention to your own needs.',
        low: 'You tend to be direct and prioritize honesty over harmony.',
      },
      neuroticism: {
        high: 'You experience emotions intensely and may be prone to worry or stress.',
        moderate: 'You experience a normal range of emotional ups and downs.',
        low: 'You tend to remain calm and emotionally stable across situations.',
      },
    };

    return descriptions[trait]?.[level] || '';
  }

  private calculateConfidence(wordCount: number): number {
    if (wordCount < 50) return 10;
    if (wordCount < 100) return 25;
    if (wordCount < 200) return 40;
    if (wordCount < 500) return 60;
    if (wordCount < 1000) return 75;
    if (wordCount < 2000) return 85;
    return 95;
  }
}
