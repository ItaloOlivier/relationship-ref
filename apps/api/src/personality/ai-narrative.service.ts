import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { BigFiveScores, EmotionalIntelligenceScores, PersonalityNarratives } from './big-five-analyzer.service';
import { AttachmentAnalysis, CommunicationAnalysis, ConflictStyleAnalysis } from './attachment-analyzer.service';
import { RelationshipDynamicsAnalysis } from './relationship-dynamics.service';

/**
 * AI Narrative Service using Claude Sonnet 4
 *
 * Centralizes all AI-generated narrative content for personality profiles
 * and relationship dynamics. Uses Anthropic's Claude for warm, empathetic,
 * and psychologically-informed narrative generation.
 *
 * Model: claude-sonnet-4-20250514
 * - Excellent at empathetic, nuanced relationship advice
 * - Strong at structured JSON output
 * - Cost-effective for production use
 */
@Injectable()
export class AiNarrativeService {
  private readonly logger = new Logger(AiNarrativeService.name);
  private anthropic: Anthropic | null = null;
  private readonly model = 'claude-sonnet-4-20250514';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey && !apiKey.includes('your-anthropic')) {
      this.anthropic = new Anthropic({ apiKey });
      this.logger.log('Anthropic Claude initialized for AI narratives');
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not configured - using fallback narratives');
    }
  }

  /**
   * Check if Claude AI is available
   */
  isAvailable(): boolean {
    return this.anthropic !== null;
  }

  /**
   * Generate personality profile narratives using Claude
   */
  async generatePersonalityNarratives(
    bigFive: BigFiveScores,
    attachment: AttachmentAnalysis,
    communication: CommunicationAnalysis,
    conflict: ConflictStyleAnalysis,
    emotionalIntelligence: EmotionalIntelligenceScores,
  ): Promise<PersonalityNarratives> {
    if (!this.anthropic) {
      return this.generateFallbackPersonalityNarratives(
        bigFive,
        attachment,
        communication,
        conflict,
        emotionalIntelligence,
      );
    }

    try {
      const prompt = this.buildPersonalityPrompt(
        bigFive,
        attachment,
        communication,
        conflict,
        emotionalIntelligence,
      );

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        system: `You are a compassionate relationship coach helping individuals understand their communication patterns. Generate warm, supportive, and actionable personality insights.

Guidelines:
- Be specific but not clinical
- Focus on growth potential rather than deficits
- Use second person ("You...")
- Keep each section to 2-3 sentences
- Avoid jargon - use accessible language
- Frame challenges as opportunities for growth`,
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return this.parsePersonalityResponse(content.text);
      }

      return this.generateFallbackPersonalityNarratives(
        bigFive,
        attachment,
        communication,
        conflict,
        emotionalIntelligence,
      );
    } catch (error) {
      this.logger.error('Failed to generate personality narratives with Claude', error);
      return this.generateFallbackPersonalityNarratives(
        bigFive,
        attachment,
        communication,
        conflict,
        emotionalIntelligence,
      );
    }
  }

  /**
   * Generate couple relationship narrative using Claude
   */
  async generateCoupleNarrative(
    dynamics: RelationshipDynamicsAnalysis,
    participant1Name: string,
    participant2Name: string,
  ): Promise<{ dynamicNarrative: string; coachingFocus: string }> {
    if (!this.anthropic) {
      return this.generateFallbackCoupleNarrative(
        dynamics,
        participant1Name,
        participant2Name,
      );
    }

    try {
      const prompt = this.buildCouplePrompt(dynamics, participant1Name, participant2Name);

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        system: `You are a compassionate couples therapist providing insights about relationship dynamics.

Guidelines:
- Be warm, specific, and actionable
- Focus on growth rather than blame
- Use both partners' names naturally
- Keep each section to 2-3 sentences
- Celebrate strengths while gently noting growth areas
- Frame challenges as shared opportunities`,
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return this.parseCoupleResponse(content.text);
      }

      return this.generateFallbackCoupleNarrative(dynamics, participant1Name, participant2Name);
    } catch (error) {
      this.logger.error('Failed to generate couple narrative with Claude', error);
      return this.generateFallbackCoupleNarrative(dynamics, participant1Name, participant2Name);
    }
  }

  /**
   * Generate coaching suggestions for session analysis using Claude
   */
  async generateCoachingSuggestions(
    transcript: string,
    scoringResult: {
      overallScore: number;
      cards: Array<{ type: string }>;
      repairAttempts: Array<unknown>;
    },
  ): Promise<{ whatWentWell: string; tryNextTime: string; repairSuggestion: string }> {
    if (!this.anthropic) {
      return this.getDefaultCoachingSuggestions();
    }

    try {
      const greenCards = scoringResult.cards.filter((c) => c.type === 'GREEN').length;
      const yellowCards = scoringResult.cards.filter((c) => c.type === 'YELLOW').length;
      const redCards = scoringResult.cards.filter((c) => c.type === 'RED').length;

      const prompt = `Analyze this conversation between partners and provide brief, actionable feedback.

Transcript summary: "${transcript.slice(0, 500)}${transcript.length > 500 ? '...' : ''}"

Analysis:
- Overall score: ${scoringResult.overallScore}/100
- Green cards (positive): ${greenCards}
- Yellow cards (caution): ${yellowCards}
- Red cards (concern): ${redCards}
- Repair attempts: ${scoringResult.repairAttempts.length}

Provide exactly 3 pieces of feedback in this format:

WHAT_WENT_WELL:
[One specific positive thing from this conversation - 1-2 sentences]

TRY_NEXT_TIME:
[One specific, actionable suggestion for improvement - 1-2 sentences]

REPAIR_SUGGESTION:
[A brief script they could use to repair after a difficult moment - 1-2 sentences]`;

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        system: `You are a relationship coach analyzing a conversation between partners. Generate warm, non-judgmental, and actionable feedback. Keep responses concise and practical.`,
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return this.parseCoachingResponse(content.text);
      }

      return this.getDefaultCoachingSuggestions();
    } catch (error) {
      this.logger.error('Failed to generate coaching suggestions with Claude', error);
      return this.getDefaultCoachingSuggestions();
    }
  }

  // ========== Prompt Builders ==========

  private buildPersonalityPrompt(
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
[2-3 sentences about areas for growth, framed positively as opportunities]

COMMUNICATION:
[2-3 sentences about their communication style and how it affects their relationships]`;
  }

  private buildCouplePrompt(
    dynamics: RelationshipDynamicsAnalysis,
    participant1Name: string,
    participant2Name: string,
  ): string {
    return `Analyze this couple's communication dynamics and provide insights:

DYNAMICS DATA:
- Conversation dominance: ${JSON.stringify(dynamics.dominance)}
- Emotional reciprocity: ${dynamics.emotionalReciprocity}/100
- Validation balance: ${dynamics.validationBalance}/100
- Support balance: ${dynamics.supportBalance}/100
- Escalation tendency: ${dynamics.escalationTendency}/100
- Deescalation skill: ${dynamics.deescalationSkill}/100
- Positive:Negative ratio: ${dynamics.positiveToNegativeRatio}:1 (5:1 is the healthy target)
- Pursuer-withdrawer pattern: ${dynamics.pursuerWithdrawer.isPursuerWithdrawer ? 'Yes - ' + (dynamics.pursuerWithdrawer.indicators.join(', ') || 'pattern detected') : 'No'}
- Strengths: ${dynamics.relationshipStrengths.join(', ') || 'Building together'}
- Growth areas: ${dynamics.growthOpportunities.join(', ') || 'Continuing to grow'}

Generate two sections in this exact format:

DYNAMIC_NARRATIVE:
[2-3 sentences describing how ${participant1Name} and ${participant2Name} interact together, in warm accessible language]

COACHING_FOCUS:
[2-3 sentences about what this couple should focus on to strengthen their relationship]`;
  }

  // ========== Response Parsers ==========

  private parsePersonalityResponse(content: string): PersonalityNarratives {
    const strengthsMatch = content.match(/STRENGTHS:\s*([^]*?)(?=GROWTH_AREAS:|$)/i);
    const growthMatch = content.match(/GROWTH_AREAS:\s*([^]*?)(?=COMMUNICATION:|$)/i);
    const commMatch = content.match(/COMMUNICATION:\s*([^]*?)$/i);

    return {
      strengthsNarrative:
        strengthsMatch?.[1]?.trim() ||
        'Your communication patterns show areas of genuine connection with your partner.',
      growthAreasNarrative:
        growthMatch?.[1]?.trim() ||
        'Every relationship has room for growth. Continue building your communication skills through practice.',
      communicationNarrative:
        commMatch?.[1]?.trim() ||
        'Your communication style shapes how you connect with your partner in meaningful ways.',
    };
  }

  private parseCoupleResponse(content: string): { dynamicNarrative: string; coachingFocus: string } {
    const narrativeMatch = content.match(/DYNAMIC_NARRATIVE:\s*([^]*?)(?=COACHING_FOCUS:|$)/i);
    const coachingMatch = content.match(/COACHING_FOCUS:\s*([^]*?)$/i);

    return {
      dynamicNarrative:
        narrativeMatch?.[1]?.trim() ||
        'You are building your communication patterns together as a couple.',
      coachingFocus:
        coachingMatch?.[1]?.trim() ||
        'Continue practicing open, honest communication and expressing appreciation for each other.',
    };
  }

  private parseCoachingResponse(content: string): {
    whatWentWell: string;
    tryNextTime: string;
    repairSuggestion: string;
  } {
    const wellMatch = content.match(/WHAT_WENT_WELL:\s*([^]*?)(?=TRY_NEXT_TIME:|$)/i);
    const tryMatch = content.match(/TRY_NEXT_TIME:\s*([^]*?)(?=REPAIR_SUGGESTION:|$)/i);
    const repairMatch = content.match(/REPAIR_SUGGESTION:\s*([^]*?)$/i);

    return {
      whatWentWell:
        wellMatch?.[1]?.trim() || 'You showed up and engaged in this conversation together.',
      tryNextTime:
        tryMatch?.[1]?.trim() || 'Try using "I feel" statements to express your emotions.',
      repairSuggestion:
        repairMatch?.[1]?.trim() ||
        "Let's take a breath and try again. I want to understand you better.",
    };
  }

  // ========== Fallback Generators ==========

  private generateFallbackPersonalityNarratives(
    bigFive: BigFiveScores,
    attachment: AttachmentAnalysis,
    communication: CommunicationAnalysis,
    conflict: ConflictStyleAnalysis,
    emotionalIntelligence: EmotionalIntelligenceScores,
  ): PersonalityNarratives {
    const strengths: string[] = [];
    if (bigFive.agreeableness > 60) {
      strengths.push(
        'You show a natural ability to connect with your partner and prioritize harmony in your relationship.',
      );
    }
    if (bigFive.openness > 60) {
      strengths.push('Your openness to new ideas and experiences brings richness to your conversations.');
    }
    if (emotionalIntelligence.empathyScore > 60) {
      strengths.push("Your empathy helps you understand and respond to your partner's emotional needs.");
    }
    if (emotionalIntelligence.emotionalRegulation > 60) {
      strengths.push(
        'You demonstrate good emotional regulation, helping maintain calm during difficult conversations.',
      );
    }
    if (attachment.style === 'SECURE') {
      strengths.push('Your secure attachment style provides a stable foundation for open communication.');
    }

    const growthAreas: string[] = [];
    if (bigFive.neuroticism > 60) {
      growthAreas.push(
        'Managing stress and anxiety could help you communicate more effectively during conflicts.',
      );
    }
    if (attachment.anxietyScore > 50) {
      growthAreas.push(
        "Building trust in your relationship's stability may help you feel more secure in expressing your needs.",
      );
    }
    if (attachment.avoidanceScore > 50) {
      growthAreas.push('Opening up more emotionally could deepen your connection with your partner.');
    }
    if (emotionalIntelligence.emotionalAwareness < 50) {
      growthAreas.push(
        'Taking time to identify and name your emotions could enhance your self-understanding.',
      );
    }

    let communicationNarrative = '';
    switch (communication.style) {
      case 'PLACATER':
        communicationNarrative =
          "You tend to prioritize harmony and may sometimes put your partner's needs before your own. While this shows care, remember that your feelings matter equally.";
        break;
      case 'BLAMER':
        communicationNarrative =
          "You communicate directly and assertively. Balancing this strength with curiosity about your partner's perspective can lead to more productive conversations.";
        break;
      case 'COMPUTER':
        communicationNarrative =
          'You bring a thoughtful, analytical approach to discussions. Adding more emotional expression could help your partner feel more connected.';
        break;
      case 'DISTRACTER':
        communicationNarrative =
          'You often use humor or redirection during difficult moments. While this can ease tension, staying present with difficult topics can deepen understanding.';
        break;
      case 'LEVELER':
        communicationNarrative =
          'You communicate authentically and directly while remaining respectful. This balanced approach creates space for genuine connection.';
        break;
      default:
        communicationNarrative = `Your ${conflict.style} approach to conflict, combined with your communication patterns, shapes how you navigate disagreements with your partner.`;
    }

    return {
      strengthsNarrative:
        strengths.length > 0
          ? strengths.slice(0, 2).join(' ')
          : 'Continue building your communication skills through regular practice and reflection.',
      growthAreasNarrative:
        growthAreas.length > 0
          ? growthAreas.slice(0, 2).join(' ')
          : "Every relationship has room for growth. Pay attention to patterns that work well and areas where you'd like to improve.",
      communicationNarrative,
    };
  }

  private generateFallbackCoupleNarrative(
    dynamics: RelationshipDynamicsAnalysis,
    participant1Name: string,
    participant2Name: string,
  ): { dynamicNarrative: string; coachingFocus: string } {
    const narrativeParts: string[] = [];
    const coachingParts: string[] = [];

    const dominanceValues = Object.values(dynamics.dominance);
    const dominanceDiff = Math.abs(dominanceValues[0] - dominanceValues[1]);
    if (dominanceDiff < 20) {
      narrativeParts.push(
        `${participant1Name} and ${participant2Name} share conversation time fairly equally, indicating mutual engagement.`,
      );
    } else {
      const dominant = Object.entries(dynamics.dominance).sort(([, a], [, b]) => b - a)[0][0];
      narrativeParts.push(
        `${dominant} tends to take more conversation space, which may mean ${participant1Name === dominant ? participant2Name : participant1Name} has fewer opportunities to express themselves.`,
      );
      coachingParts.push('Practice active listening and ensure both partners have space to share.');
    }

    if (dynamics.positiveToNegativeRatio >= 5) {
      narrativeParts.push(
        'Your positive-to-negative interaction ratio is healthy, creating a foundation of warmth.',
      );
    } else if (dynamics.positiveToNegativeRatio < 2) {
      coachingParts.push('Try expressing appreciation, affection, and gratitude more frequently.');
    }

    if (dynamics.pursuerWithdrawer.isPursuerWithdrawer) {
      coachingParts.push(
        'Work on the pursuer-withdrawer pattern - the pursuing partner can give space while the withdrawing partner can practice engaging.',
      );
    }

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

  private getDefaultCoachingSuggestions(): {
    whatWentWell: string;
    tryNextTime: string;
    repairSuggestion: string;
  } {
    return {
      whatWentWell: 'You showed up and had this conversation together.',
      tryNextTime: 'Try using "I" statements to express how you feel.',
      repairSuggestion: "Let's take a breath and try again. I want to understand you better.",
    };
  }
}
