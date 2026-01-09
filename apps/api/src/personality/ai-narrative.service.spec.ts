import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiNarrativeService } from './ai-narrative.service';
import { AttachmentStyle, CommunicationStyle } from '@prisma/client';

describe('AiNarrativeService', () => {
  let service: AiNarrativeService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'ANTHROPIC_API_KEY') {
        return undefined; // Test fallback behavior
      }
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiNarrativeService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiNarrativeService>(AiNarrativeService);
  });

  describe('isAvailable', () => {
    it('should return false when API key is not configured', () => {
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('generatePersonalityNarratives', () => {
    const mockBigFive = {
      openness: 70,
      conscientiousness: 60,
      extraversion: 55,
      agreeableness: 75,
      neuroticism: 40,
      confidence: 65,
    };

    const mockAttachment = {
      style: AttachmentStyle.SECURE,
      anxietyScore: 25,
      avoidanceScore: 20,
      confidence: 60,
      indicators: [],
    };

    const mockCommunication = {
      style: CommunicationStyle.LEVELER,
      placaterScore: 15,
      blamerScore: 10,
      computerScore: 20,
      distracterScore: 15,
      levelerScore: 40,
      confidence: 60,
      indicators: [],
    };

    const mockConflict = {
      style: 'collaborating' as const,
      assertivenessScore: 65,
      cooperativenessScore: 70,
      confidence: 60,
      indicators: [],
    };

    const mockEmotionalIntelligence = {
      emotionalAwareness: 70,
      empathyScore: 75,
      emotionalRegulation: 65,
      confidence: 60,
    };

    it('should return fallback narratives when AI is unavailable', async () => {
      const result = await service.generatePersonalityNarratives(
        mockBigFive,
        mockAttachment,
        mockCommunication,
        mockConflict,
        mockEmotionalIntelligence,
      );

      expect(result).toHaveProperty('strengthsNarrative');
      expect(result).toHaveProperty('growthAreasNarrative');
      expect(result).toHaveProperty('communicationNarrative');
      expect(typeof result.strengthsNarrative).toBe('string');
      expect(result.strengthsNarrative.length).toBeGreaterThan(0);
    });

    it('should generate strengths for high agreeableness', async () => {
      const result = await service.generatePersonalityNarratives(
        { ...mockBigFive, agreeableness: 75 },
        mockAttachment,
        mockCommunication,
        mockConflict,
        mockEmotionalIntelligence,
      );

      expect(result.strengthsNarrative).toContain('connect');
    });

    it('should generate strengths for secure attachment with low agreeableness', async () => {
      // With low agreeableness and openness, secure attachment should be the main strength
      const result = await service.generatePersonalityNarratives(
        { ...mockBigFive, agreeableness: 40, openness: 40 },
        { ...mockAttachment, style: AttachmentStyle.SECURE },
        mockCommunication,
        mockConflict,
        { ...mockEmotionalIntelligence, empathyScore: 40, emotionalRegulation: 40 },
      );

      expect(result.strengthsNarrative).toContain('secure');
    });

    it('should generate growth areas for high neuroticism', async () => {
      const result = await service.generatePersonalityNarratives(
        { ...mockBigFive, neuroticism: 70 },
        mockAttachment,
        mockCommunication,
        mockConflict,
        mockEmotionalIntelligence,
      );

      expect(result.growthAreasNarrative).toContain('stress');
    });

    it('should generate placater communication narrative', async () => {
      const result = await service.generatePersonalityNarratives(
        mockBigFive,
        mockAttachment,
        { ...mockCommunication, style: CommunicationStyle.PLACATER },
        mockConflict,
        mockEmotionalIntelligence,
      );

      expect(result.communicationNarrative).toContain('harmony');
    });

    it('should generate leveler communication narrative', async () => {
      const result = await service.generatePersonalityNarratives(
        mockBigFive,
        mockAttachment,
        { ...mockCommunication, style: CommunicationStyle.LEVELER },
        mockConflict,
        mockEmotionalIntelligence,
      );

      expect(result.communicationNarrative).toContain('authentically');
    });
  });

  describe('generateCoupleNarrative', () => {
    const mockDynamics = {
      dominance: { Alice: 55, Bob: 45 },
      topicInitiation: { Alice: 50, Bob: 50 },
      pursuerWithdrawer: {
        isPursuerWithdrawer: false,
        confidence: 50,
        indicators: [],
      },
      emotionalReciprocity: 80,
      validationBalance: 75,
      supportBalance: 70,
      escalationTendency: 30,
      deescalationSkill: 70,
      resolutionRate: 65,
      positiveToNegativeRatio: 5.5,
      relationshipStrengths: ['healthy_positive_negative_ratio', 'mutual_repair_attempts'],
      growthOpportunities: [],
      confidence: 60,
    };

    it('should return fallback narrative when AI is unavailable', async () => {
      const result = await service.generateCoupleNarrative(
        mockDynamics,
        'Alice',
        'Bob',
      );

      expect(result).toHaveProperty('dynamicNarrative');
      expect(result).toHaveProperty('coachingFocus');
      expect(typeof result.dynamicNarrative).toBe('string');
      expect(result.dynamicNarrative.length).toBeGreaterThan(0);
    });

    it('should mention equal conversation sharing for balanced dominance', async () => {
      const result = await service.generateCoupleNarrative(
        mockDynamics,
        'Alice',
        'Bob',
      );

      expect(result.dynamicNarrative).toContain('equally');
    });

    it('should mention positive ratio for healthy couples', async () => {
      const result = await service.generateCoupleNarrative(
        { ...mockDynamics, positiveToNegativeRatio: 6 },
        'Alice',
        'Bob',
      );

      expect(result.dynamicNarrative).toContain('healthy');
    });

    it('should address pursuer-withdrawer pattern when present', async () => {
      const result = await service.generateCoupleNarrative(
        {
          ...mockDynamics,
          pursuerWithdrawer: {
            isPursuerWithdrawer: true,
            pursuerId: 'Alice',
            withdrawerId: 'Bob',
            confidence: 75,
            indicators: ['Alice asks more questions'],
          },
        },
        'Alice',
        'Bob',
      );

      expect(result.coachingFocus).toContain('pursuer-withdrawer');
    });

    it('should address contempt when present in growth opportunities', async () => {
      const result = await service.generateCoupleNarrative(
        {
          ...mockDynamics,
          growthOpportunities: ['reduce_contempt'],
        },
        'Alice',
        'Bob',
      );

      expect(result.coachingFocus).toContain('Contempt');
    });

    it('should suggest positive interactions for low ratio', async () => {
      const result = await service.generateCoupleNarrative(
        { ...mockDynamics, positiveToNegativeRatio: 1.5 },
        'Alice',
        'Bob',
      );

      expect(result.coachingFocus).toContain('appreciation');
    });
  });

  describe('generateCoachingSuggestions', () => {
    const mockTranscript = 'I feel like you never listen to me. You always interrupt.';
    const mockScoringResult = {
      overallScore: 45,
      cards: [
        { type: 'GREEN' },
        { type: 'YELLOW' },
        { type: 'YELLOW' },
        { type: 'RED' },
      ],
      repairAttempts: [],
    };

    it('should return default suggestions when AI is unavailable', async () => {
      const result = await service.generateCoachingSuggestions(
        mockTranscript,
        mockScoringResult,
      );

      expect(result).toHaveProperty('whatWentWell');
      expect(result).toHaveProperty('tryNextTime');
      expect(result).toHaveProperty('repairSuggestion');
      expect(typeof result.whatWentWell).toBe('string');
      expect(result.whatWentWell.length).toBeGreaterThan(0);
    });

    it('should provide actionable try next time suggestion', async () => {
      const result = await service.generateCoachingSuggestions(
        mockTranscript,
        mockScoringResult,
      );

      expect(result.tryNextTime).toContain('I');
    });

    it('should provide a repair suggestion', async () => {
      const result = await service.generateCoachingSuggestions(
        mockTranscript,
        mockScoringResult,
      );

      expect(result.repairSuggestion.length).toBeGreaterThan(10);
    });
  });
});

describe('AiNarrativeService with API key', () => {
  let service: AiNarrativeService;

  const mockConfigServiceWithKey = {
    get: jest.fn((key: string) => {
      if (key === 'ANTHROPIC_API_KEY') {
        return 'sk-ant-test-key-123';
      }
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiNarrativeService,
        { provide: ConfigService, useValue: mockConfigServiceWithKey },
      ],
    }).compile();

    service = module.get<AiNarrativeService>(AiNarrativeService);
  });

  describe('isAvailable', () => {
    it('should return true when API key is configured', () => {
      expect(service.isAvailable()).toBe(true);
    });
  });
});
