import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SessionsService } from '../sessions.service';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Referenced quote from session transcript
 */
export interface ReferencedQuote {
  text: string;
  speaker?: string;
  context?: string;
}

/**
 * Response from asking a question about a session
 */
export interface SessionQuestionResponse {
  id: string;
  sessionId: string;
  question: string;
  answer: string;
  referencedQuotes: ReferencedQuote[];
  referencedCards?: Array<{
    type: string;
    reason: string;
    category: string;
  }>;
  keyInsight?: string;
  createdAt: Date;
}

/**
 * Paginated Q&A history response
 */
export interface QAHistoryResponse {
  questions: SessionQuestionResponse[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Suggested questions based on session content
 */
export const SUGGESTED_QUESTIONS = [
  'Why did the fight start?',
  'When did things escalate?',
  'Show me examples of contempt',
  'What could we have done differently?',
  'What repair attempts did we make?',
  'Who was more defensive in this conversation?',
  'What topics triggered the most tension?',
  'How could I have responded better?',
];

/**
 * Session Q&A Service
 *
 * Enables users to ask questions about specific sessions using Claude AI.
 * The AI analyzes the full transcript and analysis results to provide
 * contextual, psychology-informed answers.
 *
 * Model: Claude Sonnet 4 (claude-sonnet-4-20250514)
 */
@Injectable()
export class SessionQAService {
  private readonly logger = new Logger(SessionQAService.name);
  private anthropic: Anthropic | null = null;
  private readonly model = 'claude-sonnet-4-20250514';

  constructor(
    private prisma: PrismaService,
    private sessionsService: SessionsService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey && !apiKey.includes('your-anthropic')) {
      this.anthropic = new Anthropic({ apiKey });
      this.logger.log('Anthropic Claude initialized for Session Q&A');
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not configured - Q&A will return fallback responses');
    }
  }

  /**
   * Check if Claude AI is available
   */
  isAvailable(): boolean {
    return this.anthropic !== null;
  }

  /**
   * Ask a question about a specific session
   */
  async askQuestion(
    sessionId: string,
    userId: string,
    question: string,
  ): Promise<SessionQuestionResponse> {
    // Validate question
    if (!question || question.trim().length === 0) {
      throw new BadRequestException('Question cannot be empty');
    }
    if (question.length > 500) {
      throw new BadRequestException('Question must be 500 characters or less');
    }

    // Check rate limit (5 questions per session per hour)
    await this.checkRateLimit(sessionId, userId);

    // Fetch session with full context
    const session = await this.sessionsService.findById(sessionId, userId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (!session.transcript) {
      throw new BadRequestException('Session has no transcript. Please transcribe the session first.');
    }

    if (!session.analysisResult) {
      throw new BadRequestException('Session has not been analyzed. Please analyze the session first.');
    }

    // Record start time for metrics
    const startTime = Date.now();

    // Generate answer using Claude
    const { answer, referencedQuotes, referencedCards, keyInsight, tokensUsed } =
      await this.generateAnswer(session, question);

    // Store the Q&A exchange
    const sessionQuestion = await this.prisma.sessionQuestion.create({
      data: {
        sessionId,
        userId,
        question: question.trim(),
        answer,
        referencedQuotes: referencedQuotes as any,
        referencedCards: referencedCards as any,
        processingTimeMs: Date.now() - startTime,
        tokensUsed,
      },
    });

    this.logger.log(
      `Q&A generated for session ${sessionId}: "${question.slice(0, 50)}..." (${Date.now() - startTime}ms)`,
    );

    return {
      id: sessionQuestion.id,
      sessionId: sessionQuestion.sessionId,
      question: sessionQuestion.question,
      answer: sessionQuestion.answer,
      referencedQuotes,
      referencedCards,
      keyInsight,
      createdAt: sessionQuestion.createdAt,
    };
  }

  /**
   * Get Q&A history for a session
   */
  async getQuestionHistory(
    sessionId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<QAHistoryResponse> {
    // Verify user has access to session
    await this.sessionsService.findById(sessionId, userId);

    const [questions, total] = await Promise.all([
      this.prisma.sessionQuestion.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.sessionQuestion.count({ where: { sessionId } }),
    ]);

    return {
      questions: questions.map((q) => ({
        id: q.id,
        sessionId: q.sessionId,
        question: q.question,
        answer: q.answer,
        referencedQuotes: (q.referencedQuotes as unknown as ReferencedQuote[]) || [],
        referencedCards: q.referencedCards as any,
        createdAt: q.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Get suggested questions for a session
   */
  getSuggestedQuestions(): string[] {
    return SUGGESTED_QUESTIONS;
  }

  /**
   * Check rate limit: 5 questions per session per hour
   */
  private async checkRateLimit(sessionId: string, userId: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentQuestions = await this.prisma.sessionQuestion.count({
      where: {
        sessionId,
        userId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentQuestions >= 5) {
      throw new BadRequestException(
        'Rate limit exceeded. You can ask up to 5 questions per session per hour.',
      );
    }
  }

  /**
   * Generate answer using Claude AI
   */
  private async generateAnswer(
    session: any,
    question: string,
  ): Promise<{
    answer: string;
    referencedQuotes: ReferencedQuote[];
    referencedCards?: Array<{ type: string; reason: string; category: string }>;
    keyInsight?: string;
    tokensUsed?: number;
  }> {
    if (!this.anthropic) {
      return this.generateFallbackAnswer(session, question);
    }

    try {
      const prompt = this.buildPrompt(session, question);

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        system: this.getSystemPrompt(),
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const parsed = this.parseResponse(content.text);
        return {
          ...parsed,
          tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
        };
      }

      return this.generateFallbackAnswer(session, question);
    } catch (error) {
      this.logger.error('Failed to generate Q&A answer with Claude', error);
      return this.generateFallbackAnswer(session, question);
    }
  }

  /**
   * Build the prompt for Claude
   */
  private buildPrompt(session: any, question: string): string {
    const analysis = session.analysisResult;
    const cards = analysis.cards as any[];
    const horsemen = analysis.horsemenDetected as any[];
    const repairs = analysis.repairAttempts as any[];

    // Build card summary
    const cardSummary = `
Green cards (positive): ${analysis.greenCardCount}
Yellow cards (caution): ${analysis.yellowCardCount}
Red cards (concerning): ${analysis.redCardCount}`;

    // Build horsemen summary
    const horsemenSummary =
      horsemen && horsemen.length > 0
        ? horsemen.map((h) => `- ${h.type}: "${h.quote || 'detected'}"`).join('\n')
        : 'None detected';

    // Build repair summary
    const repairSummary =
      repairs && repairs.length > 0
        ? repairs.map((r) => `- "${r.quote}"`).join('\n')
        : 'None detected';

    // Build card details
    const cardDetails =
      cards && cards.length > 0
        ? cards
            .slice(0, 15) // Limit to avoid token overflow
            .map((c) => `- [${c.type}] ${c.reason}${c.quote ? `: "${c.quote}"` : ''}`)
            .join('\n')
        : 'No specific cards detected';

    return `CONVERSATION TRANSCRIPT:
"""
${session.transcript}
"""

ANALYSIS SUMMARY:
- Overall Score: ${analysis.overallScore}/100
${cardSummary}

FOUR HORSEMEN DETECTED:
${horsemenSummary}

REPAIR ATTEMPTS:
${repairSummary}

CARD DETAILS:
${cardDetails}

TOPICS DISCUSSED: ${analysis.topicTags?.join(', ') || 'General conversation'}

PARTICIPANTS: ${session.chatParticipants?.join(', ') || 'Two partners'}

USER'S QUESTION:
"${question}"

Please answer the user's question about this conversation. Be specific, reference quotes when relevant, and provide actionable insights based on relationship psychology (Gottman, attachment theory, etc.).`;
  }

  /**
   * System prompt for Claude
   */
  private getSystemPrompt(): string {
    return `You are a compassionate relationship coach analyzing a specific conversation between partners.

Your role is to help them understand their communication patterns by answering their questions about the conversation.

GUIDELINES:
1. Reference specific quotes from the transcript when answering
2. Connect observations to relationship psychology concepts (Gottman's Four Horsemen, attachment styles, etc.)
3. Be warm, empathetic, and non-judgmental
4. Provide actionable insights when relevant
5. When identifying escalation points or triggers, quote the exact text
6. Acknowledge both partners' perspectives fairly
7. If asked about improvement, suggest specific alternative phrases they could have used

FORMAT YOUR RESPONSE AS JSON:
{
  "answer": "Your detailed, empathetic answer to the question (2-4 paragraphs)",
  "referencedQuotes": [
    { "text": "exact quote from transcript", "speaker": "name if known", "context": "brief context like 'escalation point' or 'repair attempt'" }
  ],
  "referencedCards": [
    { "type": "GREEN|YELLOW|RED", "reason": "category", "category": "specific behavior" }
  ],
  "keyInsight": "One sentence summary/takeaway"
}

If you cannot parse the transcript or answer the question, still return valid JSON with a helpful message in the answer field.`;
  }

  /**
   * Parse Claude's response
   */
  private parseResponse(content: string): {
    answer: string;
    referencedQuotes: ReferencedQuote[];
    referencedCards?: Array<{ type: string; reason: string; category: string }>;
    keyInsight?: string;
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          answer: parsed.answer || content,
          referencedQuotes: parsed.referencedQuotes || [],
          referencedCards: parsed.referencedCards,
          keyInsight: parsed.keyInsight,
        };
      }
    } catch (error) {
      this.logger.warn('Failed to parse Claude response as JSON, using raw text');
    }

    // Fallback: use raw text as answer
    return {
      answer: content,
      referencedQuotes: [],
    };
  }

  /**
   * Generate a fallback answer when Claude is unavailable
   */
  private generateFallbackAnswer(
    session: any,
    question: string,
  ): {
    answer: string;
    referencedQuotes: ReferencedQuote[];
    referencedCards?: Array<{ type: string; reason: string; category: string }>;
    keyInsight?: string;
  } {
    const analysis = session.analysisResult;
    const questionLower = question.toLowerCase();

    // Simple keyword-based responses
    if (questionLower.includes('fight') || questionLower.includes('start') || questionLower.includes('escalate')) {
      const redCards = (analysis.cards as any[])?.filter((c) => c.type === 'RED') || [];
      const firstRed = redCards[0];
      return {
        answer: `Based on the analysis, this conversation had ${analysis.redCardCount} concerning moments (red cards). ${
          firstRed
            ? `The first concerning behavior was ${firstRed.reason}${firstRed.quote ? `: "${firstRed.quote}"` : ''}.`
            : 'Review the transcript to identify specific escalation points.'
        } The overall score was ${analysis.overallScore}/100, indicating ${
          analysis.overallScore >= 70 ? 'a relatively healthy exchange' : 'room for improvement in communication patterns'
        }.`,
        referencedQuotes: firstRed?.quote ? [{ text: firstRed.quote, context: 'first concerning moment' }] : [],
        keyInsight: 'Focus on identifying triggers and using softer startup phrases.',
      };
    }

    if (questionLower.includes('contempt') || questionLower.includes('horsem')) {
      const horsemen = (analysis.horsemenDetected as any[]) || [];
      const contempt = horsemen.filter((h) => h.type === 'contempt');
      return {
        answer: `The analysis detected ${horsemen.length} instances of Gottman's "Four Horsemen" (criticism, contempt, defensiveness, stonewalling). ${
          contempt.length > 0
            ? `Contempt was detected ${contempt.length} time(s). Contempt is particularly damaging as it conveys disgust and superiority.`
            : 'No contempt was specifically detected in this conversation.'
        } ${
          horsemen.length > 0
            ? `The horsemen detected were: ${horsemen.map((h) => h.type).join(', ')}.`
            : ''
        }`,
        referencedQuotes: horsemen.slice(0, 3).map((h) => ({
          text: h.quote || h.type,
          context: `${h.type} detected`,
        })),
        keyInsight: 'Replacing criticism with complaints (specific requests) can reduce defensiveness.',
      };
    }

    if (questionLower.includes('repair') || questionLower.includes('better')) {
      const repairs = (analysis.repairAttempts as any[]) || [];
      return {
        answer: `This conversation had ${repairs.length} repair attempt(s). Repair attempts are crucial for de-escalating conflicts. ${
          repairs.length > 0
            ? `Repairs included: ${repairs.slice(0, 3).map((r) => `"${r.quote}"`).join(', ')}.`
            : 'Consider using phrases like "I\'m sorry, let me try again" or "Can we take a break?" to de-escalate.'
        } The coaching suggestion from the analysis was: "${analysis.repairSuggestion || 'Focus on expressing understanding before responding.'}"`,
        referencedQuotes: repairs.slice(0, 3).map((r) => ({
          text: r.quote,
          context: 'repair attempt',
        })),
        keyInsight: 'Successful couples make repair attempts early and often.',
      };
    }

    // Default response
    return {
      answer: `This conversation scored ${analysis.overallScore}/100. It had ${analysis.greenCardCount} positive moments, ${analysis.yellowCardCount} caution moments, and ${analysis.redCardCount} concerning moments. ${
        analysis.whatWentWell ? `What went well: ${analysis.whatWentWell}` : ''
      } ${analysis.tryNextTime ? `For next time: ${analysis.tryNextTime}` : ''} To get more specific insights, try asking about particular moments like "When did things escalate?" or "What repair attempts were made?"`,
      referencedQuotes: [],
      keyInsight: 'Understanding your patterns is the first step to improving communication.',
    };
  }
}
