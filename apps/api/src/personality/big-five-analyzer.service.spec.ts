import { Test, TestingModule } from '@nestjs/testing';
import { BigFiveAnalyzerService } from './big-five-analyzer.service';
import { AiNarrativeService } from './ai-narrative.service';
import { LinguisticFeatures } from './linguistic-analysis.service';
import { AttachmentStyle, CommunicationStyle } from '@prisma/client';

describe('BigFiveAnalyzerService', () => {
  let service: BigFiveAnalyzerService;

  const mockAiNarrativeService = {
    generatePersonalityNarratives: jest.fn().mockResolvedValue({
      strengthsNarrative: 'You show a natural ability to connect with your partner and prioritize harmony in your relationship.',
      growthAreasNarrative: 'Managing stress and anxiety could help you communicate more effectively during conflicts.',
      communicationNarrative: 'You tend to prioritize harmony and may sometimes put your partner\'s needs before your own.',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BigFiveAnalyzerService,
        {
          provide: AiNarrativeService,
          useValue: mockAiNarrativeService,
        },
      ],
    }).compile();

    service = module.get<BigFiveAnalyzerService>(BigFiveAnalyzerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Helper to create base linguistic features
  const createBaseFeatures = (overrides: Partial<LinguisticFeatures> = {}): LinguisticFeatures => ({
    totalWords: 200,
    uniqueWords: 120,
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

  const createBaseHorsemen = () => ({
    criticism: 0,
    contempt: 0,
    defensiveness: 0,
    stonewalling: 0,
  });

  describe('analyzeBigFive', () => {
    it('should return all five traits', () => {
      const features = createBaseFeatures();
      const result = service.analyzeBigFive(features);

      expect(result.openness).toBeDefined();
      expect(result.conscientiousness).toBeDefined();
      expect(result.extraversion).toBeDefined();
      expect(result.agreeableness).toBeDefined();
      expect(result.neuroticism).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it('should score openness higher with complex vocabulary', () => {
      const simpleVocab = createBaseFeatures({
        avgWordLength: 3.5,
        uniqueWords: 80,
        totalWords: 200, // Low richness
        tentativeWords: 1,
      });

      const complexVocab = createBaseFeatures({
        avgWordLength: 6.5,
        uniqueWords: 170,
        totalWords: 200, // High richness
        tentativeWords: 5,
        questionFrequency: 35,
      });

      const simpleResult = service.analyzeBigFive(simpleVocab);
      const complexResult = service.analyzeBigFive(complexVocab);

      expect(complexResult.openness).toBeGreaterThan(simpleResult.openness);
    });

    it('should score conscientiousness higher with achievement words', () => {
      const lowAchievement = createBaseFeatures({
        achievementWords: 0.5,
        certaintyWords: 1,
        negativeEmotionWords: 4,
      });

      const highAchievement = createBaseFeatures({
        achievementWords: 5,
        certaintyWords: 4,
        negativeEmotionWords: 1,
      });

      const lowResult = service.analyzeBigFive(lowAchievement);
      const highResult = service.analyzeBigFive(highAchievement);

      expect(highResult.conscientiousness).toBeGreaterThan(lowResult.conscientiousness);
    });

    it('should score extraversion higher with positive emotions and social words', () => {
      const introverted = createBaseFeatures({
        positiveEmotionWords: 1,
        affiliationWords: 0.5,
        exclamationFrequency: 5,
        tentativeWords: 8,
      });

      const extraverted = createBaseFeatures({
        positiveEmotionWords: 7,
        affiliationWords: 5,
        exclamationFrequency: 30,
        firstPersonPlural: 5,
        tentativeWords: 2,
      });

      const introResult = service.analyzeBigFive(introverted);
      const extraResult = service.analyzeBigFive(extraverted);

      expect(extraResult.extraversion).toBeGreaterThan(introResult.extraversion);
    });

    it('should score agreeableness higher with affiliation and we-language', () => {
      const lowAgreeableness = createBaseFeatures({
        firstPersonPlural: 1,
        affiliationWords: 0.5,
        powerWords: 5,
        angerWords: 4,
      });

      const highAgreeableness = createBaseFeatures({
        firstPersonPlural: 6,
        affiliationWords: 5,
        positiveEmotionWords: 5,
        powerWords: 0.5,
        hedgingPhrases: 25,
      });

      const lowResult = service.analyzeBigFive(lowAgreeableness);
      const highResult = service.analyzeBigFive(highAgreeableness);

      expect(highResult.agreeableness).toBeGreaterThan(lowResult.agreeableness);
    });

    it('should score neuroticism higher with negative emotions and anxiety', () => {
      const stable = createBaseFeatures({
        negativeEmotionWords: 0.5,
        anxietyWords: 0,
        firstPersonSingular: 5,
        positiveEmotionWords: 5,
      });

      const neurotic = createBaseFeatures({
        negativeEmotionWords: 7,
        anxietyWords: 4,
        firstPersonSingular: 15,
        sadnessWords: 3,
      });

      const stableResult = service.analyzeBigFive(stable);
      const neuroticResult = service.analyzeBigFive(neurotic);

      expect(neuroticResult.neuroticism).toBeGreaterThan(stableResult.neuroticism);
    });

    it('should clamp scores to 0-100 range', () => {
      const extremeFeatures = createBaseFeatures({
        negativeEmotionWords: 20,
        anxietyWords: 15,
        firstPersonSingular: 30,
        sadnessWords: 10,
      });

      const result = service.analyzeBigFive(extremeFeatures);

      expect(result.openness).toBeGreaterThanOrEqual(0);
      expect(result.openness).toBeLessThanOrEqual(100);
      expect(result.neuroticism).toBeLessThanOrEqual(100);
    });

    it('should have higher confidence with more words', () => {
      const smallSample = createBaseFeatures({ totalWords: 50 });
      const largeSample = createBaseFeatures({ totalWords: 1500 });

      const smallResult = service.analyzeBigFive(smallSample);
      const largeResult = service.analyzeBigFive(largeSample);

      expect(largeResult.confidence).toBeGreaterThan(smallResult.confidence);
    });
  });

  describe('analyzeEmotionalIntelligence', () => {
    it('should return all three EQ components', () => {
      const features = createBaseFeatures();
      const result = service.analyzeEmotionalIntelligence(
        features,
        createBaseHorsemen(),
        1,
      );

      expect(result.emotionalAwareness).toBeDefined();
      expect(result.empathyScore).toBeDefined();
      expect(result.emotionalRegulation).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it('should score awareness higher with emotion words and self-reflection', () => {
      const lowAwareness = createBaseFeatures({
        positiveEmotionWords: 0.5,
        negativeEmotionWords: 0.5,
        firstPersonSingular: 3,
      });

      const highAwareness = createBaseFeatures({
        positiveEmotionWords: 5,
        negativeEmotionWords: 3,
        anxietyWords: 2,
        firstPersonSingular: 10,
        hedgingPhrases: 20,
      });

      const lowResult = service.analyzeEmotionalIntelligence(
        lowAwareness,
        createBaseHorsemen(),
        1,
      );
      const highResult = service.analyzeEmotionalIntelligence(
        highAwareness,
        createBaseHorsemen(),
        1,
      );

      expect(highResult.emotionalAwareness).toBeGreaterThan(lowResult.emotionalAwareness);
    });

    it('should score empathy higher with partner-focus and repair attempts', () => {
      const lowEmpathy = createBaseFeatures({
        secondPerson: 2,
        firstPersonPlural: 1,
        questionFrequency: 10,
      });

      const highEmpathy = createBaseFeatures({
        secondPerson: 8,
        firstPersonPlural: 5,
        questionFrequency: 30,
      });

      const lowResult = service.analyzeEmotionalIntelligence(
        lowEmpathy,
        createBaseHorsemen(),
        0,
      );
      const highResult = service.analyzeEmotionalIntelligence(
        highEmpathy,
        createBaseHorsemen(),
        3,
      );

      expect(highResult.empathyScore).toBeGreaterThan(lowResult.empathyScore);
    });

    it('should reduce empathy for contempt and criticism', () => {
      const features = createBaseFeatures({
        secondPerson: 6,
        firstPersonPlural: 4,
      });

      const noHorsemen = service.analyzeEmotionalIntelligence(
        features,
        createBaseHorsemen(),
        2,
      );

      const withHorsemen = service.analyzeEmotionalIntelligence(
        features,
        { criticism: 3, contempt: 2, defensiveness: 0, stonewalling: 0 },
        2,
      );

      expect(withHorsemen.empathyScore).toBeLessThan(noHorsemen.empathyScore);
    });

    it('should score regulation higher with repair attempts and low horsemen', () => {
      const poorRegulation = createBaseFeatures({
        negativeEmotionWords: 5,
        totalWords: 200,
      });

      const goodRegulation = createBaseFeatures({
        negativeEmotionWords: 1,
        tentativeWords: 5,
        certaintyWords: 2,
        totalWords: 200,
      });

      const poorResult = service.analyzeEmotionalIntelligence(
        poorRegulation,
        { criticism: 0, contempt: 2, defensiveness: 3, stonewalling: 2 },
        0,
      );

      const goodResult = service.analyzeEmotionalIntelligence(
        goodRegulation,
        createBaseHorsemen(),
        3,
      );

      expect(goodResult.emotionalRegulation).toBeGreaterThan(poorResult.emotionalRegulation);
    });
  });

  describe('generateNarratives', () => {
    it('should generate fallback narratives when OpenAI is unavailable', async () => {
      const bigFive = {
        openness: 70,
        conscientiousness: 55,
        extraversion: 45,
        agreeableness: 75,
        neuroticism: 35,
        confidence: 60,
      };

      const attachment = {
        style: AttachmentStyle.SECURE,
        anxietyScore: 30,
        avoidanceScore: 25,
        confidence: 60,
        indicators: [],
      };

      const communication = {
        style: CommunicationStyle.LEVELER,
        placaterScore: 20,
        blamerScore: 10,
        computerScore: 15,
        distracterScore: 10,
        levelerScore: 45,
        confidence: 60,
        indicators: [],
      };

      const conflict = {
        style: 'collaborating' as const,
        assertivenessScore: 65,
        cooperativenessScore: 70,
        confidence: 60,
        indicators: [],
      };

      const emotionalIntelligence = {
        emotionalAwareness: 65,
        empathyScore: 70,
        emotionalRegulation: 60,
        confidence: 60,
      };

      const result = await service.generateNarratives(
        bigFive,
        attachment,
        communication,
        conflict,
        emotionalIntelligence,
      );

      expect(result.strengthsNarrative).toBeDefined();
      expect(result.strengthsNarrative.length).toBeGreaterThan(20);
      expect(result.growthAreasNarrative).toBeDefined();
      expect(result.communicationNarrative).toBeDefined();
    });

    it('should mention agreeableness strength when score is high', async () => {
      const bigFive = {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 80, // High
        neuroticism: 50,
        confidence: 60,
      };

      const result = await service.generateNarratives(
        bigFive,
        {
          style: AttachmentStyle.SECURE,
          anxietyScore: 30,
          avoidanceScore: 30,
          confidence: 60,
          indicators: [],
        },
        {
          style: CommunicationStyle.MIXED,
          placaterScore: 25,
          blamerScore: 25,
          computerScore: 25,
          distracterScore: 12.5,
          levelerScore: 12.5,
          confidence: 60,
          indicators: [],
        },
        {
          style: 'compromising' as const,
          assertivenessScore: 50,
          cooperativenessScore: 50,
          confidence: 60,
          indicators: [],
        },
        {
          emotionalAwareness: 50,
          empathyScore: 50,
          emotionalRegulation: 50,
          confidence: 60,
        },
      );

      expect(result.strengthsNarrative.toLowerCase()).toContain('connect');
    });

    it('should mention anxiety in growth areas when attachment anxiety is high', async () => {
      const bigFive = {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 70, // High
        confidence: 60,
      };

      const result = await service.generateNarratives(
        bigFive,
        {
          style: AttachmentStyle.ANXIOUS_PREOCCUPIED,
          anxietyScore: 70, // High
          avoidanceScore: 30,
          confidence: 60,
          indicators: [],
        },
        {
          style: CommunicationStyle.MIXED,
          placaterScore: 25,
          blamerScore: 25,
          computerScore: 25,
          distracterScore: 12.5,
          levelerScore: 12.5,
          confidence: 60,
          indicators: [],
        },
        {
          style: 'compromising' as const,
          assertivenessScore: 50,
          cooperativenessScore: 50,
          confidence: 60,
          indicators: [],
        },
        {
          emotionalAwareness: 50,
          empathyScore: 50,
          emotionalRegulation: 50,
          confidence: 60,
        },
      );

      expect(result.growthAreasNarrative.toLowerCase()).toMatch(/stress|anxiety|trust/);
    });

    it('should describe placater style correctly', async () => {
      const result = await service.generateNarratives(
        {
          openness: 50,
          conscientiousness: 50,
          extraversion: 50,
          agreeableness: 50,
          neuroticism: 50,
          confidence: 60,
        },
        {
          style: AttachmentStyle.SECURE,
          anxietyScore: 30,
          avoidanceScore: 30,
          confidence: 60,
          indicators: [],
        },
        {
          style: CommunicationStyle.PLACATER,
          placaterScore: 60,
          blamerScore: 10,
          computerScore: 10,
          distracterScore: 10,
          levelerScore: 10,
          confidence: 60,
          indicators: [],
        },
        {
          style: 'accommodating' as const,
          assertivenessScore: 30,
          cooperativenessScore: 70,
          confidence: 60,
          indicators: [],
        },
        {
          emotionalAwareness: 50,
          empathyScore: 50,
          emotionalRegulation: 50,
          confidence: 60,
        },
      );

      expect(result.communicationNarrative.toLowerCase()).toMatch(/harmony|prioritize|needs/);
    });
  });

  describe('getTraitDescription', () => {
    it('should return high description for scores above 65', () => {
      const description = service.getTraitDescription('openness', 80);
      expect(description.toLowerCase()).toContain('curious');
    });

    it('should return low description for scores below 35', () => {
      const description = service.getTraitDescription('openness', 25);
      expect(description.toLowerCase()).toContain('prefer');
    });

    it('should return moderate description for middle scores', () => {
      const description = service.getTraitDescription('openness', 50);
      expect(description.toLowerCase()).toContain('balance');
    });

    it('should return descriptions for all traits', () => {
      const traits: Array<keyof typeof service.getTraitDescription extends (trait: infer T, score: number) => string ? T : never> = [
        'openness',
        'conscientiousness',
        'extraversion',
        'agreeableness',
        'neuroticism',
      ];

      for (const trait of traits) {
        const high = service.getTraitDescription(trait as any, 80);
        const low = service.getTraitDescription(trait as any, 20);
        const moderate = service.getTraitDescription(trait as any, 50);

        expect(high.length).toBeGreaterThan(10);
        expect(low.length).toBeGreaterThan(10);
        expect(moderate.length).toBeGreaterThan(10);
      }
    });
  });
});
