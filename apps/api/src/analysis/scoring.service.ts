import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CardType } from '@prisma/client';

export interface Card {
  type: CardType;
  reason: string;
  quote?: string;
  category: string;
  speaker?: string;      // Name of person who said this (parsed from transcript)
  userId?: string;       // User ID if speaker name was mapped to a known user
  timestamp?: Date;      // When in conversation (optional, for future use)
}

export interface HorsemanDetection {
  type: 'criticism' | 'contempt' | 'defensiveness' | 'stonewalling';
  quote?: string;
  severity: 'mild' | 'moderate' | 'severe';
  speaker?: string;      // Who used this horseman
}

export interface RepairAttempt {
  quote: string;
  type: string;
  speaker?: string;      // Who made the repair attempt
}

export interface IndividualScore {
  userId?: string;                    // User ID if speaker was mapped
  speaker: string;                    // Speaker name from transcript
  greenCardCount: number;             // Number of green cards
  yellowCardCount: number;            // Number of yellow cards
  redCardCount: number;               // Number of red cards
  personalScore: number;              // Individual score 0-100
  bankContribution: number;           // Net contribution to emotional bank
  horsemenUsed: string[];             // Which Four Horsemen they used
  repairAttemptCount: number;         // Number of repair attempts made
}

export interface ScoringResult {
  cards: Card[];
  horsemenDetected: HorsemanDetection[];
  repairAttempts: RepairAttempt[];
  bankChange: number;
  overallScore: number;
  safetyFlagTriggered: boolean;
  individualScores: IndividualScore[]; // Per-speaker breakdowns
}

// Default scoring values (can be overridden by DB config)
const DEFAULT_SCORES: Record<string, { points: number; cardType?: CardType }> = {
  // Green card behaviors (deposits)
  appreciation: { points: 5, cardType: CardType.GREEN },
  validation: { points: 4, cardType: CardType.GREEN },
  curiosity: { points: 3, cardType: CardType.GREEN },
  repair_attempt: { points: 7, cardType: CardType.GREEN },

  // Yellow card behaviors
  interrupting: { points: -2, cardType: CardType.YELLOW },
  always_never: { points: -2, cardType: CardType.YELLOW },
  mild_sarcasm: { points: -2, cardType: CardType.YELLOW },
  blame_phrasing: { points: -3, cardType: CardType.YELLOW },

  // Red card behaviors (withdrawals)
  criticism: { points: -4, cardType: CardType.RED },
  defensiveness: { points: -5, cardType: CardType.RED },
  contempt: { points: -8, cardType: CardType.RED },
  stonewalling: { points: -6, cardType: CardType.RED },
  threat: { points: -10, cardType: CardType.RED },
  name_calling: { points: -8, cardType: CardType.RED },
};

// Pattern matchers for rule-based detection
const PATTERNS = {
  // Green patterns
  appreciation: [
    /thank you/i,
    /i appreciate/i,
    /that means a lot/i,
    /i'm grateful/i,
    /you're (amazing|wonderful|great)/i,
  ],
  validation: [
    /i understand/i,
    /that makes sense/i,
    /i can see why/i,
    /you're right/i,
    /i hear you/i,
  ],
  curiosity: [
    /can you tell me more/i,
    /what do you think/i,
    /how do you feel/i,
    /i'm curious/i,
    /help me understand/i,
  ],
  repair_attempt: [
    /i'm sorry/i,
    /let's start over/i,
    /can we take a break/i,
    /i didn't mean/i,
    /let me try again/i,
    /i love you/i,
  ],

  // Yellow patterns
  interrupting: [], // Detected via timing/speaker analysis
  always_never: [
    /you always/i,
    /you never/i,
    /every single time/i,
    /you're always/i,
  ],
  mild_sarcasm: [
    /oh really/i,
    /sure you do/i,
    /whatever you say/i,
    /right\.\.\./i,
  ],
  blame_phrasing: [
    /you made me/i,
    /it's your fault/i,
    /because of you/i,
    /you're the one who/i,
  ],

  // Red patterns
  criticism: [
    /you're so (lazy|stupid|useless)/i,
    /what's wrong with you/i,
    /you can't do anything/i,
  ],
  defensiveness: [
    /it's not my fault/i,
    /i didn't do anything/i,
    /you're overreacting/i,
    /that's not true/i,
  ],
  contempt: [
    /you're pathetic/i,
    /you disgust me/i,
    /\*eye roll\*/i,
    /you're such a/i,
  ],
  stonewalling: [
    /i don't care/i,
    /whatever/i,
    /i'm done talking/i,
    /leave me alone/i,
  ],
  threat: [
    /i'll leave you/i,
    /i'm going to hurt/i,
    /you'll regret/i,
    /i'll make you pay/i,
  ],
  name_calling: [
    /you (idiot|moron|jerk|bitch)/i,
    /stupid/i,
  ],
};

// Safety patterns that trigger resource display
const SAFETY_PATTERNS = [
  /i'll (hurt|kill)/i,
  /threat/i,
  /hit you/i,
  /harm (yourself|myself)/i,
];

@Injectable()
export class ScoringService {
  constructor(private prisma: PrismaService) {}

  /**
   * Detect the speaker who said a given quote in the transcript.
   * Transcript format is typically: "SpeakerName: message text"
   *
   * @param quote - The exact quote to find
   * @param transcript - Full conversation transcript
   * @returns Speaker name or null if not found
   */
  private detectSpeaker(quote: string, transcript: string): string | null {
    if (!quote || !transcript) {
      return null;
    }

    // Split transcript into lines
    const lines = transcript.split('\n');
    const normalizedQuote = quote.toLowerCase().trim();

    // Try to find the line containing this exact quote
    // Prioritize exact substring matches over partial matches
    let bestMatch: { speaker: string; exactness: number } | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      const lowerLine = trimmedLine.toLowerCase();

      // Check if this line contains the quote
      if (lowerLine.includes(normalizedQuote)) {
        // Match pattern: "SpeakerName: quote text"
        const match = trimmedLine.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          const speaker = match[1].trim();
          const message = match[2].trim().toLowerCase();

          // Validate it's not a system message or timestamp
          if (speaker && !speaker.match(/^\d/) && speaker.length < 50) {
            // Calculate exactness: higher score if quote is closer to the full message
            const exactness = normalizedQuote.length / message.length;

            if (!bestMatch || exactness > bestMatch.exactness) {
              bestMatch = { speaker, exactness };
            }
          }
        }
      }
    }

    return bestMatch ? bestMatch.speaker : null;
  }

  async getScoreConfig(): Promise<Record<string, { points: number; cardType?: CardType }>> {
    const configs = await this.prisma.scoringConfig.findMany({
      where: { isActive: true },
    });

    if (configs.length === 0) {
      return DEFAULT_SCORES;
    }

    const configMap: Record<string, { points: number; cardType?: CardType }> = {};
    for (const config of configs) {
      configMap[config.category] = {
        points: config.points,
        cardType: config.cardType ?? undefined,
      };
    }

    return { ...DEFAULT_SCORES, ...configMap };
  }

  async analyzeTranscript(transcript: string): Promise<ScoringResult> {
    const scores = await this.getScoreConfig();
    const cards: Card[] = [];
    const horsemenDetected: HorsemanDetection[] = [];
    const repairAttempts: RepairAttempt[] = [];
    let bankChange = 0;
    let safetyFlagTriggered = false;

    // Check for safety patterns first
    for (const pattern of SAFETY_PATTERNS) {
      if (pattern.test(transcript)) {
        safetyFlagTriggered = true;
        break;
      }
    }

    // Detect patterns
    for (const [category, patterns] of Object.entries(PATTERNS)) {
      for (const pattern of patterns) {
        const matches = transcript.match(new RegExp(pattern, 'gi'));
        if (matches) {
          const scoreConfig = scores[category];
          if (scoreConfig) {
            for (const match of matches) {
              bankChange += scoreConfig.points;

              // Detect speaker for this quote
              const speaker = this.detectSpeaker(match, transcript) ?? undefined;

              if (scoreConfig.cardType) {
                cards.push({
                  type: scoreConfig.cardType,
                  reason: category.replace(/_/g, ' '),
                  quote: match,
                  category,
                  speaker,
                  // userId will be populated later in analysis.service.ts using relationship members
                });
              }

              // Track Four Horsemen
              if (['criticism', 'contempt', 'defensiveness', 'stonewalling'].includes(category)) {
                horsemenDetected.push({
                  type: category as HorsemanDetection['type'],
                  quote: match,
                  severity: Math.abs(scoreConfig.points) >= 6 ? 'severe' :
                           Math.abs(scoreConfig.points) >= 4 ? 'moderate' : 'mild',
                  speaker,
                });
              }

              // Track repair attempts
              if (category === 'repair_attempt') {
                repairAttempts.push({
                  quote: match,
                  type: 'verbal',
                  speaker,
                });
              }
            }
          }
        }
      }
    }

    // Calculate overall score (0-100) using Gottman 5:1 ratio method
    // This prevents the problem where 100 red cards + 1 green card shows "improvement"
    const overallScore = this.calculateRatioBasedScore(cards);

    // Calculate individual scores per speaker
    const individualScores = this.calculateIndividualScores(
      cards,
      horsemenDetected,
      repairAttempts,
      await this.getScoreConfig(),
    );

    return {
      cards,
      horsemenDetected,
      repairAttempts,
      bankChange,
      overallScore,
      safetyFlagTriggered,
      individualScores,
    };
  }

  /**
   * Calculate score using Gottman 5:1 ratio method
   *
   * The Gottman Institute found that healthy relationships need a 5:1 ratio
   * of positive to negative interactions. This method calculates score based
   * on that ratio, making it order-independent and resistant to gaming.
   *
   * Scoring scale:
   * - ratio >= 5.0 = 100 (excellent - meets Gottman threshold)
   * - ratio = 2.5 = 75 (good - above neutral)
   * - ratio = 1.0 = 50 (balanced but not healthy)
   * - ratio = 0.5 = 25 (concerning - more negative than positive)
   * - ratio = 0.0 = 0 (critical - no positive behaviors)
   *
   * @param cards - All detected behavior cards
   * @returns Score from 0-100 based on positive:negative ratio
   */
  private calculateRatioBasedScore(cards: Card[]): number {
    // Count cards by type
    const greenCount = cards.filter(c => c.type === CardType.GREEN).length;
    const yellowCount = cards.filter(c => c.type === CardType.YELLOW).length;
    const redCount = cards.filter(c => c.type === CardType.RED).length;

    // Weight negative behaviors (yellow = 1x, red = 2x)
    // This reflects that red cards are more damaging than yellow
    const negativeWeight = yellowCount + (redCount * 2);

    // Handle edge cases
    if (greenCount === 0 && negativeWeight === 0) {
      // No cards detected - return neutral score
      return 70;
    }

    if (greenCount === 0 && negativeWeight > 0) {
      // Only negative behaviors - very bad
      return 0;
    }

    if (negativeWeight === 0 && greenCount > 0) {
      // Only positive behaviors - excellent
      return 100;
    }

    // Calculate ratio: positive / negative
    const ratio = greenCount / negativeWeight;

    // Convert ratio to 0-100 score
    // ratio >= 5.0 = 100 (Gottman threshold)
    // ratio = 1.0 = 50 (balanced)
    // ratio = 0.0 = 0 (all negative)
    const score = (ratio / 5.0) * 100;

    // Cap at 100 and floor at 0
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate per-speaker score breakdowns for individual accountability
   */
  private calculateIndividualScores(
    cards: Card[],
    horsemen: HorsemanDetection[],
    repairs: RepairAttempt[],
    scoreConfig: Record<string, { points: number; cardType?: CardType }>,
  ): IndividualScore[] {
    // Group cards by speaker
    const speakerMap = new Map<string, IndividualScore>();

    // Process cards
    for (const card of cards) {
      if (!card.speaker) continue; // Skip cards without speaker attribution

      if (!speakerMap.has(card.speaker)) {
        speakerMap.set(card.speaker, {
          speaker: card.speaker,
          userId: card.userId,
          greenCardCount: 0,
          yellowCardCount: 0,
          redCardCount: 0,
          personalScore: 0,
          bankContribution: 0,
          horsemenUsed: [],
          repairAttemptCount: 0,
        });
      }

      const score = speakerMap.get(card.speaker)!;

      // Count cards by type
      if (card.type === CardType.GREEN) {
        score.greenCardCount++;
      } else if (card.type === CardType.YELLOW) {
        score.yellowCardCount++;
      } else if (card.type === CardType.RED) {
        score.redCardCount++;
      }

      // Add to bank contribution
      const categoryConfig = scoreConfig[card.category];
      if (categoryConfig) {
        score.bankContribution += categoryConfig.points;
      }
    }

    // Process horsemen
    for (const horseman of horsemen) {
      if (!horseman.speaker) continue;

      const score = speakerMap.get(horseman.speaker);
      if (score && !score.horsemenUsed.includes(horseman.type)) {
        score.horsemenUsed.push(horseman.type);
      }
    }

    // Process repair attempts
    for (const repair of repairs) {
      if (!repair.speaker) continue;

      const score = speakerMap.get(repair.speaker);
      if (score) {
        score.repairAttemptCount++;
      }
    }

    // Calculate personal scores (0-100) for each speaker using ratio method
    for (const score of speakerMap.values()) {
      const negativeWeight = score.yellowCardCount + (score.redCardCount * 2);

      // Apply same ratio-based logic as overall score
      if (score.greenCardCount === 0 && negativeWeight === 0) {
        score.personalScore = 70; // Neutral
      } else if (score.greenCardCount === 0 && negativeWeight > 0) {
        score.personalScore = 0; // Only negative
      } else if (negativeWeight === 0 && score.greenCardCount > 0) {
        score.personalScore = 100; // Only positive
      } else {
        const ratio = score.greenCardCount / negativeWeight;
        score.personalScore = Math.max(0, Math.min(100, (ratio / 5.0) * 100));
      }
    }

    return Array.from(speakerMap.values());
  }

  countCards(cards: Card[]): { green: number; yellow: number; red: number } {
    return {
      green: cards.filter(c => c.type === CardType.GREEN).length,
      yellow: cards.filter(c => c.type === CardType.YELLOW).length,
      red: cards.filter(c => c.type === CardType.RED).length,
    };
  }
}
