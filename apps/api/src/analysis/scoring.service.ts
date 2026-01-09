import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CardType } from '@prisma/client';

export interface Card {
  type: CardType;
  reason: string;
  quote?: string;
  category: string;
}

export interface HorsemanDetection {
  type: 'criticism' | 'contempt' | 'defensiveness' | 'stonewalling';
  quote?: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface RepairAttempt {
  quote: string;
  type: string;
}

export interface ScoringResult {
  cards: Card[];
  horsemenDetected: HorsemanDetection[];
  repairAttempts: RepairAttempt[];
  bankChange: number;
  overallScore: number;
  safetyFlagTriggered: boolean;
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

              if (scoreConfig.cardType) {
                cards.push({
                  type: scoreConfig.cardType,
                  reason: category.replace(/_/g, ' '),
                  quote: match,
                  category,
                });
              }

              // Track Four Horsemen
              if (['criticism', 'contempt', 'defensiveness', 'stonewalling'].includes(category)) {
                horsemenDetected.push({
                  type: category as HorsemanDetection['type'],
                  quote: match,
                  severity: Math.abs(scoreConfig.points) >= 6 ? 'severe' :
                           Math.abs(scoreConfig.points) >= 4 ? 'moderate' : 'mild',
                });
              }

              // Track repair attempts
              if (category === 'repair_attempt') {
                repairAttempts.push({
                  quote: match,
                  type: 'verbal',
                });
              }
            }
          }
        }
      }
    }

    // Calculate overall score (0-100)
    // Start at 70, adjust based on bank change
    const baseScore = 70;
    const adjustedScore = Math.max(0, Math.min(100, baseScore + bankChange));

    return {
      cards,
      horsemenDetected,
      repairAttempts,
      bankChange,
      overallScore: adjustedScore,
      safetyFlagTriggered,
    };
  }

  countCards(cards: Card[]): { green: number; yellow: number; red: number } {
    return {
      green: cards.filter(c => c.type === CardType.GREEN).length,
      yellow: cards.filter(c => c.type === CardType.YELLOW).length,
      red: cards.filter(c => c.type === CardType.RED).length,
    };
  }
}
