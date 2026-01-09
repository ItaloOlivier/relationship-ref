import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentStyle, CommunicationStyle } from '@prisma/client';
import { AttachmentAnalyzerService } from './attachment-analyzer.service';
import { LinguisticFeatures } from './linguistic-analysis.service';

describe('AttachmentAnalyzerService', () => {
  let service: AttachmentAnalyzerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttachmentAnalyzerService],
    }).compile();

    service = module.get<AttachmentAnalyzerService>(AttachmentAnalyzerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Helper to create base linguistic features
  const createBaseFeatures = (overrides: Partial<LinguisticFeatures> = {}): LinguisticFeatures => ({
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

  const createBaseHorsemen = () => ({
    criticism: 0,
    contempt: 0,
    defensiveness: 0,
    stonewalling: 0,
  });

  describe('analyzeAttachment', () => {
    it('should identify secure attachment with low anxiety and avoidance', () => {
      const features = createBaseFeatures({
        firstPersonSingular: 5,
        firstPersonPlural: 5,
        positiveEmotionWords: 5,
        negativeEmotionWords: 1,
        anxietyWords: 0,
        affiliationWords: 4,
      });

      const result = service.analyzeAttachment(features, createBaseHorsemen(), 2);

      expect(result.style).toBe(AttachmentStyle.SECURE);
      expect(result.anxietyScore).toBeLessThan(40);
      expect(result.avoidanceScore).toBeLessThan(40);
    });

    it('should identify anxious-preoccupied attachment with high anxiety, low avoidance', () => {
      const features = createBaseFeatures({
        firstPersonSingular: 18, // High self-focus
        firstPersonPlural: 4,
        negativeEmotionWords: 5, // Elevated negative emotions
        anxietyWords: 3, // Anxiety words
        certaintyWords: 8, // Absolutist thinking
        questionFrequency: 50, // Seeking reassurance
        discrepancyWords: 5, // Unmet expectations
        affiliationWords: 3,
      });

      const result = service.analyzeAttachment(
        features,
        { ...createBaseHorsemen(), defensiveness: 3 },
        2,
      );

      expect(result.style).toBe(AttachmentStyle.ANXIOUS_PREOCCUPIED);
      expect(result.anxietyScore).toBeGreaterThanOrEqual(40);
      expect(result.avoidanceScore).toBeLessThan(40);
      expect(result.indicators).toContain('High self-focus language');
    });

    it('should identify dismissive-avoidant attachment with low anxiety, high avoidance', () => {
      const features = createBaseFeatures({
        firstPersonSingular: 5,
        firstPersonPlural: 0.5, // Very low "we"
        positiveEmotionWords: 1,
        negativeEmotionWords: 0.5,
        thirdPerson: 8, // Distancing
        affiliationWords: 0.5, // Low connection
        tentativeWords: 6,
      });

      const result = service.analyzeAttachment(
        features,
        { ...createBaseHorsemen(), stonewalling: 3 },
        0, // No repair attempts
      );

      expect(result.style).toBe(AttachmentStyle.DISMISSIVE_AVOIDANT);
      expect(result.anxietyScore).toBeLessThan(40);
      expect(result.avoidanceScore).toBeGreaterThanOrEqual(40);
      expect(result.indicators).toContain('Low shared identity language ("we")');
    });

    it('should identify fearful-avoidant attachment with high anxiety and avoidance', () => {
      const features = createBaseFeatures({
        firstPersonSingular: 16, // High self-focus
        firstPersonPlural: 0.5, // Very low "we"
        negativeEmotionWords: 4,
        anxietyWords: 2,
        positiveEmotionWords: 1,
        thirdPerson: 6,
        affiliationWords: 0.5,
        questionFrequency: 45,
      });

      const result = service.analyzeAttachment(
        features,
        { ...createBaseHorsemen(), stonewalling: 3, defensiveness: 2 },
        0,
      );

      expect(result.style).toBe(AttachmentStyle.FEARFUL_AVOIDANT);
      expect(result.anxietyScore).toBeGreaterThanOrEqual(40);
      expect(result.avoidanceScore).toBeGreaterThanOrEqual(40);
    });

    it('should have higher confidence with more words', () => {
      const smallSample = createBaseFeatures({ totalWords: 50 });
      const largeSample = createBaseFeatures({ totalWords: 1500 });

      const smallResult = service.analyzeAttachment(smallSample, createBaseHorsemen(), 1);
      const largeResult = service.analyzeAttachment(largeSample, createBaseHorsemen(), 1);

      expect(largeResult.confidence).toBeGreaterThan(smallResult.confidence);
    });

    it('should cap scores at 100', () => {
      const extremeFeatures = createBaseFeatures({
        firstPersonSingular: 30,
        negativeEmotionWords: 10,
        anxietyWords: 10,
        certaintyWords: 15,
        questionFrequency: 80,
        discrepancyWords: 10,
      });

      const result = service.analyzeAttachment(
        extremeFeatures,
        { criticism: 5, contempt: 5, defensiveness: 5, stonewalling: 5 },
        0,
      );

      expect(result.anxietyScore).toBeLessThanOrEqual(100);
      expect(result.avoidanceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('analyzeCommunicationStyle', () => {
    it('should identify placater style', () => {
      const features = createBaseFeatures({
        tentativeWords: 8,
        hedgingPhrases: 40,
        positiveEmotionWords: 4,
      });

      const result = service.analyzeCommunicationStyle(features, createBaseHorsemen(), 5);

      expect(result.placaterScore).toBeGreaterThan(result.blamerScore);
      expect(result.indicators.some((i) => i.includes('Placater'))).toBe(true);
    });

    it('should identify blamer style', () => {
      const features = createBaseFeatures({
        secondPerson: 20,
        certaintyWords: 8,
        powerWords: 5,
      });

      const horsemen = {
        criticism: 5,
        contempt: 3,
        defensiveness: 1,
        stonewalling: 0,
      };

      const result = service.analyzeCommunicationStyle(features, horsemen, 0);

      expect(result.blamerScore).toBeGreaterThan(result.placaterScore);
      expect(result.blamerScore).toBeGreaterThan(result.levelerScore);
      expect(result.indicators.some((i) => i.includes('Blamer'))).toBe(true);
    });

    it('should identify computer style', () => {
      const features = createBaseFeatures({
        positiveEmotionWords: 0.5,
        negativeEmotionWords: 0.5,
        avgWordLength: 6,
        thirdPerson: 8,
        tentativeWords: 5,
        hedgingPhrases: 25,
      });

      const result = service.analyzeCommunicationStyle(features, createBaseHorsemen(), 0);

      expect(result.computerScore).toBeGreaterThan(0);
      expect(result.indicators.some((i) => i.includes('Computer'))).toBe(true);
    });

    it('should identify distracter style', () => {
      const features = createBaseFeatures({
        exclamationFrequency: 40,
        avgSentenceLength: 4,
      });

      const horsemen = {
        criticism: 0,
        contempt: 0,
        defensiveness: 0,
        stonewalling: 5,
      };

      const result = service.analyzeCommunicationStyle(features, horsemen, 0);

      expect(result.distracterScore).toBeGreaterThan(0);
      expect(result.indicators.some((i) => i.includes('Distracter'))).toBe(true);
    });

    it('should identify leveler style', () => {
      const features = createBaseFeatures({
        firstPersonPlural: 6,
        positiveEmotionWords: 5,
        negativeEmotionWords: 1,
        affiliationWords: 4,
        certaintyWords: 1,
      });

      const result = service.analyzeCommunicationStyle(features, createBaseHorsemen(), 2);

      expect(result.levelerScore).toBeGreaterThan(0);
      expect(result.indicators.some((i) => i.includes('Leveler'))).toBe(true);
    });

    it('should return MIXED when no clear winner', () => {
      const features = createBaseFeatures(); // Balanced features

      const result = service.analyzeCommunicationStyle(features, createBaseHorsemen(), 1);

      // With balanced features, no style should dominate strongly
      const scores = [
        result.placaterScore,
        result.blamerScore,
        result.computerScore,
        result.distracterScore,
        result.levelerScore,
      ];
      const max = Math.max(...scores);
      const secondMax = scores.filter((s) => s !== max).sort((a, b) => b - a)[0];

      // If difference is small, expect MIXED
      if (max - secondMax <= 10) {
        expect(result.style).toBe(CommunicationStyle.MIXED);
      }
    });

    it('should normalize scores to sum around 100', () => {
      const features = createBaseFeatures({
        tentativeWords: 8,
        hedgingPhrases: 40,
      });

      const result = service.analyzeCommunicationStyle(features, createBaseHorsemen(), 5);

      const totalScore =
        result.placaterScore +
        result.blamerScore +
        result.computerScore +
        result.distracterScore +
        result.levelerScore;

      expect(totalScore).toBeCloseTo(100, 0);
    });
  });

  describe('analyzeConflictStyle', () => {
    it('should identify avoiding style (low assertiveness, low cooperativeness)', () => {
      const features = createBaseFeatures({
        firstPersonSingular: 3,
        powerWords: 0,
        certaintyWords: 1,
        firstPersonPlural: 1,
        affiliationWords: 0.5,
      });

      const horsemen = {
        criticism: 0,
        contempt: 0,
        defensiveness: 0,
        stonewalling: 4,
      };

      const result = service.analyzeConflictStyle(features, horsemen, 0);

      expect(result.style).toBe('avoiding');
      expect(result.assertivenessScore).toBeLessThan(40);
      expect(result.cooperativenessScore).toBeLessThan(40);
    });

    it('should identify accommodating style (low assertiveness, high cooperativeness)', () => {
      const features = createBaseFeatures({
        firstPersonSingular: 3,
        powerWords: 0,
        certaintyWords: 1,
        firstPersonPlural: 6,
        affiliationWords: 4,
        tentativeWords: 5,
        positiveEmotionWords: 5,
      });

      const result = service.analyzeConflictStyle(features, createBaseHorsemen(), 3);

      expect(result.style).toBe('accommodating');
      expect(result.assertivenessScore).toBeLessThan(40);
      expect(result.cooperativenessScore).toBeGreaterThanOrEqual(60);
    });

    it('should identify competing style (high assertiveness, low cooperativeness)', () => {
      const features = createBaseFeatures({
        firstPersonSingular: 15,
        powerWords: 5,
        certaintyWords: 6,
        achievementWords: 4,
        firstPersonPlural: 0.5,
        affiliationWords: 0.5,
      });

      const horsemen = {
        criticism: 3,
        contempt: 2,
        defensiveness: 0,
        stonewalling: 0,
      };

      const result = service.analyzeConflictStyle(features, horsemen, 0);

      expect(result.style).toBe('competing');
      expect(result.assertivenessScore).toBeGreaterThanOrEqual(60);
      expect(result.cooperativenessScore).toBeLessThan(40);
    });

    it('should identify collaborating style (high assertiveness, high cooperativeness)', () => {
      const features = createBaseFeatures({
        firstPersonSingular: 15, // Strong self-advocacy
        powerWords: 4, // Power language
        certaintyWords: 5, // Confident
        achievementWords: 4, // Achievement-oriented
        firstPersonPlural: 8, // Strong partnership
        secondPerson: 8, // Partner-focused but not critical
        affiliationWords: 5, // Connection
        tentativeWords: 4, // Open to alternatives
        positiveEmotionWords: 5, // Positive
      });

      const result = service.analyzeConflictStyle(features, createBaseHorsemen(), 4);

      expect(result.style).toBe('collaborating');
      expect(result.assertivenessScore).toBeGreaterThanOrEqual(60);
      expect(result.cooperativenessScore).toBeGreaterThanOrEqual(60);
    });

    it('should identify compromising style (medium assertiveness, medium cooperativeness)', () => {
      // For compromising: assertiveness 40-59, cooperativeness 40-59
      // Assertiveness needs: firstPersonSingular>10 (+20), powerWords>2 (+20), certaintyWords>3 (+15)
      // Cooperativeness needs: firstPersonPlural>3 (+25), secondPerson>5 (+15), repairAttempts>1 (+20)
      const features = createBaseFeatures({
        firstPersonSingular: 12, // +20 assertiveness
        powerWords: 3, // +20 assertiveness (total 40)
        certaintyWords: 2, // Not enough for +15 (stay at 40)
        firstPersonPlural: 4, // +25 cooperativeness
        secondPerson: 6, // +15 cooperativeness (total 40)
        affiliationWords: 2, // Not enough for +15
        tentativeWords: 2, // Not enough for +10
        positiveEmotionWords: 3, // Not enough for +10
      });

      // repairAttempts = 1 is not > 1, so no bonus
      const result = service.analyzeConflictStyle(features, createBaseHorsemen(), 1);

      // With these values: assertiveness ~40, cooperativeness ~40
      expect(result.assertivenessScore).toBeGreaterThanOrEqual(40);
      expect(result.assertivenessScore).toBeLessThan(60);
      expect(result.cooperativenessScore).toBeGreaterThanOrEqual(40);
      expect(result.cooperativenessScore).toBeLessThan(60);
      expect(result.style).toBe('compromising');
    });

    it('should reduce scores for contempt and stonewalling', () => {
      const baseFeatures = createBaseFeatures({
        firstPersonPlural: 5,
        affiliationWords: 3,
        positiveEmotionWords: 4,
      });

      const noHorsemenResult = service.analyzeConflictStyle(
        baseFeatures,
        createBaseHorsemen(),
        2,
      );

      const withHorsemenResult = service.analyzeConflictStyle(
        baseFeatures,
        { criticism: 0, contempt: 3, defensiveness: 0, stonewalling: 4 },
        2,
      );

      expect(withHorsemenResult.cooperativenessScore).toBeLessThan(
        noHorsemenResult.cooperativenessScore,
      );
    });
  });

  describe('getAttachmentDescription', () => {
    it('should return description for each attachment style', () => {
      const styles = [
        AttachmentStyle.SECURE,
        AttachmentStyle.ANXIOUS_PREOCCUPIED,
        AttachmentStyle.DISMISSIVE_AVOIDANT,
        AttachmentStyle.FEARFUL_AVOIDANT,
        AttachmentStyle.UNDETERMINED,
      ];

      for (const style of styles) {
        const description = service.getAttachmentDescription(style);
        expect(description).toBeDefined();
        expect(description.length).toBeGreaterThan(20);
      }
    });
  });

  describe('getCommunicationDescription', () => {
    it('should return description for each communication style', () => {
      const styles = [
        CommunicationStyle.PLACATER,
        CommunicationStyle.BLAMER,
        CommunicationStyle.COMPUTER,
        CommunicationStyle.DISTRACTER,
        CommunicationStyle.LEVELER,
        CommunicationStyle.MIXED,
      ];

      for (const style of styles) {
        const description = service.getCommunicationDescription(style);
        expect(description).toBeDefined();
        expect(description.length).toBeGreaterThan(20);
      }
    });
  });
});
