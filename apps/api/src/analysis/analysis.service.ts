import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SessionsService } from '@/sessions/sessions.service';
import { TranscriptionService } from './transcription.service';
import { ScoringService } from './scoring.service';
import { SessionStatus, BankEntryType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AnalysisService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private sessionsService: SessionsService,
    private transcriptionService: TranscriptionService,
    private scoringService: ScoringService,
    private config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
  }

  async transcribeSession(sessionId: string, userId: string, audioUrl?: string) {
    const session = await this.sessionsService.findById(sessionId, userId);

    if (session.transcript) {
      return { transcript: session.transcript, message: 'Already transcribed' };
    }

    const url = audioUrl || session.audioUrl;
    if (!url) {
      throw new BadRequestException('No audio URL provided');
    }

    await this.sessionsService.updateStatus(sessionId, SessionStatus.TRANSCRIBING);

    try {
      const transcript = await this.transcriptionService.transcribeFromUrl(url);

      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          transcript,
          status: SessionStatus.UPLOADED,
        },
      });

      return { transcript };
    } catch (error) {
      await this.sessionsService.updateStatus(sessionId, SessionStatus.FAILED);
      throw error;
    }
  }

  async analyzeSession(sessionId: string, userId: string) {
    const session = await this.sessionsService.findById(sessionId, userId);

    if (!session.transcript) {
      throw new BadRequestException('Session must be transcribed first');
    }

    if (session.analysisResult) {
      return session.analysisResult;
    }

    await this.sessionsService.updateStatus(sessionId, SessionStatus.ANALYZING);

    try {
      // Run rule-based scoring
      const scoringResult = await this.scoringService.analyzeTranscript(session.transcript);
      const cardCounts = this.scoringService.countCards(scoringResult.cards);

      // Generate coaching suggestions using LLM
      const coaching = await this.generateCoachingSuggestions(
        session.transcript,
        scoringResult,
      );

      // Detect topics
      const topicTags = await this.detectTopics(session.transcript);

      // Create analysis result
      const analysisResult = await this.prisma.analysisResult.create({
        data: {
          sessionId,
          overallScore: scoringResult.overallScore,
          greenCardCount: cardCounts.green,
          yellowCardCount: cardCounts.yellow,
          redCardCount: cardCounts.red,
          bankChange: scoringResult.bankChange,
          cards: scoringResult.cards as any,
          horsemenDetected: scoringResult.horsemenDetected as any,
          repairAttempts: scoringResult.repairAttempts as any,
          topicTags,
          whatWentWell: coaching.whatWentWell,
          tryNextTime: coaching.tryNextTime,
          repairSuggestion: coaching.repairSuggestion,
          safetyFlagTriggered: scoringResult.safetyFlagTriggered,
        },
      });

      // Update emotional bank ledger (only if coupleId exists)
      if (session.coupleId) {
        await this.updateEmotionalBank(session.coupleId, sessionId, userId, scoringResult);
      }

      // Mark session complete
      await this.sessionsService.updateStatus(sessionId, SessionStatus.COMPLETED);

      return analysisResult;
    } catch (error) {
      await this.sessionsService.updateStatus(sessionId, SessionStatus.FAILED);
      throw error;
    }
  }

  async getReport(sessionId: string, userId: string) {
    const session = await this.sessionsService.findById(sessionId, userId);

    if (!session.analysisResult) {
      throw new NotFoundException('Analysis not found. Please analyze the session first.');
    }

    // Get emotional bank balance
    const bankLedger = session.coupleId
      ? await this.prisma.emotionalBankLedger.findUnique({
          where: { coupleId: session.coupleId },
        })
      : null;

    return {
      session: {
        id: session.id,
        createdAt: session.createdAt,
        durationSecs: session.durationSecs,
      },
      analysis: session.analysisResult,
      emotionalBank: {
        currentBalance: bankLedger?.balance ?? 0,
        sessionChange: session.analysisResult.bankChange,
      },
      safetyResources: session.analysisResult.safetyFlagTriggered ? {
        message: 'We noticed some concerning patterns in this conversation. Remember, healthy relationships are built on mutual respect.',
        resources: [
          { name: 'National Domestic Violence Hotline', phone: '1-800-799-7233' },
          { name: 'Crisis Text Line', text: 'Text HOME to 741741' },
        ],
      } : null,
    };
  }

  private async generateCoachingSuggestions(
    transcript: string,
    scoringResult: any,
  ): Promise<{ whatWentWell: string; tryNextTime: string; repairSuggestion: string }> {
    const prompt = `You are a relationship coach analyzing a conversation between partners.
Based on the transcript and analysis, provide brief, actionable feedback.

Transcript summary: "${transcript.slice(0, 500)}..."

Analysis:
- Overall score: ${scoringResult.overallScore}/100
- Green cards (positive): ${scoringResult.cards.filter((c: any) => c.type === 'GREEN').length}
- Yellow cards (caution): ${scoringResult.cards.filter((c: any) => c.type === 'YELLOW').length}
- Red cards (concern): ${scoringResult.cards.filter((c: any) => c.type === 'RED').length}
- Repair attempts: ${scoringResult.repairAttempts.length}

Provide exactly 3 pieces of feedback in JSON format:
{
  "whatWentWell": "One specific positive thing (1-2 sentences)",
  "tryNextTime": "One specific suggestion for improvement (1-2 sentences)",
  "repairSuggestion": "A brief script they could use to repair (1-2 sentences)"
}

Keep responses warm, non-judgmental, and actionable.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 300,
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch {
      // Fallback if LLM fails
      return {
        whatWentWell: 'You showed up and had this conversation together.',
        tryNextTime: 'Try using "I" statements to express how you feel.',
        repairSuggestion: 'Let\'s take a breath and try again. I want to understand you better.',
      };
    }
  }

  private async detectTopics(transcript: string): Promise<string[]> {
    const commonTopics = [
      'finances', 'work', 'children', 'chores', 'intimacy',
      'family', 'communication', 'time', 'health', 'future',
    ];

    const detectedTopics: string[] = [];
    const lowerTranscript = transcript.toLowerCase();

    for (const topic of commonTopics) {
      if (lowerTranscript.includes(topic)) {
        detectedTopics.push(topic);
      }
    }

    return detectedTopics.slice(0, 5); // Max 5 topics
  }

  private async updateEmotionalBank(
    coupleId: string,
    sessionId: string,
    userId: string,
    scoringResult: any,
  ) {
    // Get or create ledger
    let ledger = await this.prisma.emotionalBankLedger.findUnique({
      where: { coupleId },
    });

    if (!ledger) {
      ledger = await this.prisma.emotionalBankLedger.create({
        data: { coupleId, balance: 0 },
      });
    }

    // Create entries for significant behaviors
    const entries = [];

    for (const card of scoringResult.cards) {
      const isDeposit = card.type === 'GREEN';
      entries.push({
        ledgerId: ledger.id,
        sessionId,
        userId,
        type: isDeposit ? BankEntryType.DEPOSIT : BankEntryType.WITHDRAWAL,
        amount: Math.abs(scoringResult.bankChange > 0 ? 1 : -1), // Simplified for entries
        reason: card.reason,
        category: card.category,
      });
    }

    // Batch create entries (limit to significant ones)
    if (entries.length > 0) {
      await this.prisma.emotionalBankEntry.createMany({
        data: entries.slice(0, 10), // Max 10 entries per session
      });
    }

    // Update balance
    await this.prisma.emotionalBankLedger.update({
      where: { id: ledger.id },
      data: { balance: ledger.balance + scoringResult.bankChange },
    });
  }
}
