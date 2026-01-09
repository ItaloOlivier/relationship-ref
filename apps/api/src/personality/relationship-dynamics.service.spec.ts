import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  RelationshipDynamicsService,
  ParticipantFeatures,
} from './relationship-dynamics.service';
import { LinguisticFeatures } from './linguistic-analysis.service';

describe('RelationshipDynamicsService', () => {
  let service: RelationshipDynamicsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelationshipDynamicsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<RelationshipDynamicsService>(
      RelationshipDynamicsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const createBaseFeatures = (
    overrides: Partial<LinguisticFeatures> = {},
  ): LinguisticFeatures => ({
    totalWords: 200,
    uniqueWords: 100,
    avgWordLength: 4.5,
    avgSentenceLength: 10,
    firstPersonSingular: 5,
    firstPersonPlural: 3,
    secondPerson: 5,
    thirdPerson: 2,
    positiveEmotionWords: 3,
    negativeEmotionWords: 1,
    anxietyWords: 0.5,
    angerWords: 0.3,
    sadnessWords: 0.2,
    certaintyWords: 2,
    tentativeWords: 2,
    discrepancyWords: 1,
    affiliationWords: 2,
    achievementWords: 1,
    powerWords: 0.5,
    questionFrequency: 20,
    exclamationFrequency: 10,
    hedgingPhrases: 15,
    ...overrides,
  });

  const createParticipant = (
    name: string,
    overrides: Partial<ParticipantFeatures> = {},
  ): ParticipantFeatures => ({
    participantName: name,
    features: createBaseFeatures(),
    horsemen: {
      criticism: 0,
      contempt: 0,
      defensiveness: 0,
      stonewalling: 0,
    },
    repairAttempts: 1,
    messageCount: 20,
    wordCount: 200,
    ...overrides,
  });

  describe('analyzeRelationshipDynamics', () => {
    it('should return all dynamic metrics', () => {
      const p1 = createParticipant('John');
      const p2 = createParticipant('Sarah');

      const result = service.analyzeRelationshipDynamics(p1, p2);

      expect(result.dominance).toBeDefined();
      expect(result.topicInitiation).toBeDefined();
      expect(result.pursuerWithdrawer).toBeDefined();
      expect(result.emotionalReciprocity).toBeDefined();
      expect(result.validationBalance).toBeDefined();
      expect(result.supportBalance).toBeDefined();
      expect(result.escalationTendency).toBeDefined();
      expect(result.deescalationSkill).toBeDefined();
      expect(result.resolutionRate).toBeDefined();
      expect(result.positiveToNegativeRatio).toBeDefined();
      expect(result.relationshipStrengths).toBeDefined();
      expect(result.growthOpportunities).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it('should calculate conversation dominance correctly', () => {
      const p1 = createParticipant('John', { wordCount: 300 });
      const p2 = createParticipant('Sarah', { wordCount: 100 });

      const result = service.analyzeRelationshipDynamics(p1, p2);

      expect(result.dominance['John']).toBe(75);
      expect(result.dominance['Sarah']).toBe(25);
    });

    it('should calculate topic initiation by message count', () => {
      const p1 = createParticipant('John', { messageCount: 30 });
      const p2 = createParticipant('Sarah', { messageCount: 10 });

      const result = service.analyzeRelationshipDynamics(p1, p2);

      expect(result.topicInitiation['John']).toBe(75);
      expect(result.topicInitiation['Sarah']).toBe(25);
    });

    it('should detect pursuer-withdrawer pattern', () => {
      const pursuer = createParticipant('John', {
        features: createBaseFeatures({
          questionFrequency: 40,
          positiveEmotionWords: 5,
          negativeEmotionWords: 3,
          secondPerson: 12,
        }),
        wordCount: 300,
        messageCount: 30,
      });

      const withdrawer = createParticipant('Sarah', {
        features: createBaseFeatures({
          questionFrequency: 10,
          positiveEmotionWords: 1,
          negativeEmotionWords: 0.5,
          secondPerson: 3,
        }),
        horsemen: { criticism: 0, contempt: 0, defensiveness: 0, stonewalling: 3 },
        wordCount: 80,
        messageCount: 15,
      });

      const result = service.analyzeRelationshipDynamics(pursuer, withdrawer);

      expect(result.pursuerWithdrawer.isPursuerWithdrawer).toBe(true);
      expect(result.pursuerWithdrawer.pursuerId).toBe('John');
      expect(result.pursuerWithdrawer.withdrawerId).toBe('Sarah');
      expect(result.pursuerWithdrawer.indicators.length).toBeGreaterThan(0);
    });

    it('should not detect pursuer-withdrawer when balanced', () => {
      const p1 = createParticipant('John');
      const p2 = createParticipant('Sarah');

      const result = service.analyzeRelationshipDynamics(p1, p2);

      expect(result.pursuerWithdrawer.isPursuerWithdrawer).toBe(false);
    });

    it('should calculate high emotional reciprocity when balanced', () => {
      const p1 = createParticipant('John', {
        features: createBaseFeatures({
          positiveEmotionWords: 5,
          negativeEmotionWords: 2,
        }),
      });
      const p2 = createParticipant('Sarah', {
        features: createBaseFeatures({
          positiveEmotionWords: 4,
          negativeEmotionWords: 2,
        }),
      });

      const result = service.analyzeRelationshipDynamics(p1, p2);

      expect(result.emotionalReciprocity).toBeGreaterThan(70);
    });

    it('should calculate low emotional reciprocity when imbalanced', () => {
      const p1 = createParticipant('John', {
        features: createBaseFeatures({
          positiveEmotionWords: 10,
          negativeEmotionWords: 5,
        }),
      });
      const p2 = createParticipant('Sarah', {
        features: createBaseFeatures({
          positiveEmotionWords: 0.5,
          negativeEmotionWords: 0.5,
        }),
      });

      const result = service.analyzeRelationshipDynamics(p1, p2);

      expect(result.emotionalReciprocity).toBeLessThan(50);
    });

    it('should calculate healthy Gottman ratio with positive interactions', () => {
      const p1 = createParticipant('John', {
        features: createBaseFeatures({
          positiveEmotionWords: 6,
          negativeEmotionWords: 0.5,
          affiliationWords: 4,
        }),
        repairAttempts: 2,
      });
      const p2 = createParticipant('Sarah', {
        features: createBaseFeatures({
          positiveEmotionWords: 5,
          negativeEmotionWords: 0.5,
          affiliationWords: 3,
        }),
        repairAttempts: 2,
      });

      const result = service.analyzeRelationshipDynamics(p1, p2);

      expect(result.positiveToNegativeRatio).toBeGreaterThanOrEqual(5);
    });

    it('should calculate poor Gottman ratio with negative interactions', () => {
      const p1 = createParticipant('John', {
        features: createBaseFeatures({
          positiveEmotionWords: 1,
          negativeEmotionWords: 5,
          affiliationWords: 0.5,
        }),
        horsemen: { criticism: 3, contempt: 2, defensiveness: 2, stonewalling: 0 },
        repairAttempts: 0,
      });
      const p2 = createParticipant('Sarah', {
        features: createBaseFeatures({
          positiveEmotionWords: 1,
          negativeEmotionWords: 4,
          affiliationWords: 0.5,
        }),
        horsemen: { criticism: 2, contempt: 1, defensiveness: 3, stonewalling: 0 },
        repairAttempts: 0,
      });

      const result = service.analyzeRelationshipDynamics(p1, p2);

      expect(result.positiveToNegativeRatio).toBeLessThan(1);
    });

    it('should identify strengths in healthy relationships', () => {
      const p1 = createParticipant('John', {
        features: createBaseFeatures({
          positiveEmotionWords: 5,
          negativeEmotionWords: 0.5,
          firstPersonPlural: 4,
          affiliationWords: 3,
        }),
        horsemen: { criticism: 0, contempt: 0, defensiveness: 0, stonewalling: 0 },
        repairAttempts: 2,
      });
      const p2 = createParticipant('Sarah', {
        features: createBaseFeatures({
          positiveEmotionWords: 5,
          negativeEmotionWords: 0.5,
          firstPersonPlural: 4,
          affiliationWords: 3,
        }),
        horsemen: { criticism: 0, contempt: 0, defensiveness: 0, stonewalling: 0 },
        repairAttempts: 2,
      });

      const result = service.analyzeRelationshipDynamics(p1, p2);

      expect(result.relationshipStrengths).toContain('mutual_repair_attempts');
      expect(result.relationshipStrengths).toContain('shared_identity');
    });

    it('should identify growth areas in troubled relationships', () => {
      const p1 = createParticipant('John', {
        features: createBaseFeatures({
          positiveEmotionWords: 1,
          negativeEmotionWords: 4,
        }),
        horsemen: { criticism: 3, contempt: 2, defensiveness: 2, stonewalling: 0 },
        repairAttempts: 0,
      });
      const p2 = createParticipant('Sarah', {
        features: createBaseFeatures({
          positiveEmotionWords: 1,
          negativeEmotionWords: 4,
        }),
        horsemen: { criticism: 2, contempt: 1, defensiveness: 2, stonewalling: 0 },
        repairAttempts: 0,
      });

      const result = service.analyzeRelationshipDynamics(p1, p2);

      expect(result.growthOpportunities).toContain('reduce_contempt');
      expect(result.growthOpportunities).toContain('repair_skills');
    });

    it('should calculate higher confidence with more data', () => {
      const smallSample1 = createParticipant('John', { wordCount: 50 });
      const smallSample2 = createParticipant('Sarah', { wordCount: 50 });
      const largeSample1 = createParticipant('John', { wordCount: 1000 });
      const largeSample2 = createParticipant('Sarah', { wordCount: 1000 });

      const smallResult = service.analyzeRelationshipDynamics(
        smallSample1,
        smallSample2,
      );
      const largeResult = service.analyzeRelationshipDynamics(
        largeSample1,
        largeSample2,
      );

      expect(largeResult.confidence).toBeGreaterThan(smallResult.confidence);
    });
  });

  describe('generateCoupleNarrative', () => {
    it('should generate fallback narratives', async () => {
      const p1 = createParticipant('John');
      const p2 = createParticipant('Sarah');
      const dynamics = service.analyzeRelationshipDynamics(p1, p2);

      const result = await service.generateCoupleNarrative(
        dynamics,
        'John',
        'Sarah',
      );

      expect(result.dynamicNarrative).toBeDefined();
      expect(result.dynamicNarrative.length).toBeGreaterThan(20);
      expect(result.coachingFocus).toBeDefined();
    });

    it('should mention conversation imbalance when present', async () => {
      const p1 = createParticipant('John', { wordCount: 400 });
      const p2 = createParticipant('Sarah', { wordCount: 100 });
      const dynamics = service.analyzeRelationshipDynamics(p1, p2);

      const result = await service.generateCoupleNarrative(
        dynamics,
        'John',
        'Sarah',
      );

      expect(result.dynamicNarrative.toLowerCase()).toMatch(
        /conversation|space|express/,
      );
    });

    it('should mention positive ratio when healthy', async () => {
      const p1 = createParticipant('John', {
        features: createBaseFeatures({
          positiveEmotionWords: 8,
          negativeEmotionWords: 0.5,
          affiliationWords: 4,
        }),
        repairAttempts: 2,
      });
      const p2 = createParticipant('Sarah', {
        features: createBaseFeatures({
          positiveEmotionWords: 7,
          negativeEmotionWords: 0.5,
          affiliationWords: 4,
        }),
        repairAttempts: 2,
      });
      const dynamics = service.analyzeRelationshipDynamics(p1, p2);

      const result = await service.generateCoupleNarrative(
        dynamics,
        'John',
        'Sarah',
      );

      expect(result.dynamicNarrative.toLowerCase()).toMatch(
        /positive|healthy|warmth|foundation/,
      );
    });
  });

  describe('getStrengthDescription', () => {
    it('should return descriptions for all strength types', () => {
      const strengths = [
        'healthy_positive_negative_ratio',
        'balanced_emotional_expression',
        'mutual_repair_attempts',
        'shared_identity',
        'constructive_feedback',
        'shared_enthusiasm',
        'connection_language',
      ];

      for (const strength of strengths) {
        const description = service.getStrengthDescription(strength);
        expect(description.length).toBeGreaterThan(20);
      }
    });
  });

  describe('getGrowthDescription', () => {
    it('should return descriptions for all growth area types', () => {
      const growthAreas = [
        'increase_positive_interactions',
        'emotional_balance',
        'repair_skills',
        'pursuer_withdrawer_pattern',
        'reduce_contempt',
      ];

      for (const growthArea of growthAreas) {
        const description = service.getGrowthDescription(growthArea);
        expect(description.length).toBeGreaterThan(20);
      }
    });
  });
});
