import { Test, TestingModule } from '@nestjs/testing';
import { ProfileAggregatorService, FullPersonalityProfile } from './profile-aggregator.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { LinguisticAnalysisService } from './linguistic-analysis.service';
import { AttachmentAnalyzerService } from './attachment-analyzer.service';
import { BigFiveAnalyzerService } from './big-five-analyzer.service';
import { RelationshipDynamicsService } from './relationship-dynamics.service';
import { AttachmentStyle, CommunicationStyle } from '@prisma/client';

describe('ProfileAggregatorService', () => {
  let service: ProfileAggregatorService;
  let prismaService: jest.Mocked<PrismaService>;
  let linguisticService: jest.Mocked<LinguisticAnalysisService>;
  let attachmentService: jest.Mocked<AttachmentAnalyzerService>;
  let bigFiveService: jest.Mocked<BigFiveAnalyzerService>;
  let relationshipService: jest.Mocked<RelationshipDynamicsService>;

  const mockLinguisticFeatures = {
    totalWords: 100,
    uniqueWords: 50,
    avgWordLength: 5,
    avgSentenceLength: 10,
    firstPersonSingular: 5,
    firstPersonPlural: 3,
    secondPerson: 4,
    thirdPerson: 2,
    positiveEmotionWords: 8,
    negativeEmotionWords: 2,
    anxietyWords: 1,
    angerWords: 0,
    sadnessWords: 1,
    certaintyWords: 4,
    tentativeWords: 2,
    discrepancyWords: 1,
    affiliationWords: 6,
    achievementWords: 3,
    powerWords: 2,
    questionFrequency: 10,
    exclamationFrequency: 5,
    hedgingPhrases: 3,
  };

  const mockHorsemen = {
    criticism: 0,
    contempt: 0,
    defensiveness: 1,
    stonewalling: 0,
  };

  const mockBigFive = {
    openness: 65,
    conscientiousness: 70,
    extraversion: 55,
    agreeableness: 75,
    neuroticism: 35,
    confidence: 60,
  };

  const mockAttachment = {
    anxietyScore: 30,
    avoidanceScore: 25,
    style: 'SECURE' as AttachmentStyle,
    confidence: 65,
    indicators: ['Balanced emotional expression', 'Uses we language'],
  };

  const mockCommunication = {
    style: 'LEVELER' as CommunicationStyle,
    placaterScore: 20,
    blamerScore: 10,
    computerScore: 25,
    distracterScore: 15,
    levelerScore: 70,
    confidence: 60,
    indicators: ['Direct communication', 'Balanced assertiveness'],
  };

  const mockConflict = {
    style: 'collaborating' as const,
    assertivenessScore: 60,
    cooperativenessScore: 75,
    confidence: 55,
    indicators: ['Seeks win-win solutions', 'Open to compromise'],
  };

  const mockEQ = {
    emotionalAwareness: 70,
    empathyScore: 65,
    emotionalRegulation: 60,
    confidence: 62,
  };

  const mockNarratives = {
    strengthsNarrative: 'Shows strong empathy and communication skills.',
    growthAreasNarrative: 'May benefit from developing assertiveness.',
    communicationNarrative: 'Communicates openly and directly.',
  };

  beforeEach(async () => {
    const mockPrisma = {
      personalityProfile: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      linguisticSnapshot: {
        upsert: jest.fn(),
      },
      relationshipDynamic: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const mockLinguistic = {
      extractFeaturesFromConversation: jest.fn(),
      detectFourHorsemen: jest.fn(),
      detectRepairAttempts: jest.fn(),
    };

    const mockAttachmentSvc = {
      analyzeAttachment: jest.fn(),
      analyzeCommunicationStyle: jest.fn(),
      analyzeConflictStyle: jest.fn(),
      getAttachmentDescription: jest.fn(),
      getCommunicationDescription: jest.fn(),
    };

    const mockBigFiveSvc = {
      analyzeBigFive: jest.fn(),
      analyzeEmotionalIntelligence: jest.fn(),
      generateNarratives: jest.fn(),
      getTraitDescription: jest.fn(),
    };

    const mockRelationship = {
      analyzeRelationshipDynamics: jest.fn(),
      generateCoupleNarrative: jest.fn(),
      getStrengthDescription: jest.fn(),
      getGrowthDescription: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileAggregatorService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: LinguisticAnalysisService, useValue: mockLinguistic },
        { provide: AttachmentAnalyzerService, useValue: mockAttachmentSvc },
        { provide: BigFiveAnalyzerService, useValue: mockBigFiveSvc },
        { provide: RelationshipDynamicsService, useValue: mockRelationship },
      ],
    }).compile();

    service = module.get<ProfileAggregatorService>(ProfileAggregatorService);
    prismaService = module.get(PrismaService);
    linguisticService = module.get(LinguisticAnalysisService);
    attachmentService = module.get(AttachmentAnalyzerService);
    bigFiveService = module.get(BigFiveAnalyzerService);
    relationshipService = module.get(RelationshipDynamicsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processSession', () => {
    const messages = [
      { sender: 'Alice', content: 'I love spending time with you.' },
      { sender: 'Bob', content: 'Me too, you make me happy.' },
      { sender: 'Alice', content: 'Should we plan something for the weekend?' },
      { sender: 'Bob', content: 'Great idea!' },
    ];

    beforeEach(() => {
      const featuresMap = new Map([
        ['Alice', mockLinguisticFeatures],
        ['Bob', mockLinguisticFeatures],
      ]);

      linguisticService.extractFeaturesFromConversation.mockReturnValue(featuresMap);
      linguisticService.detectFourHorsemen.mockReturnValue(mockHorsemen);
      linguisticService.detectRepairAttempts.mockReturnValue(2);

      bigFiveService.analyzeBigFive.mockReturnValue(mockBigFive);
      bigFiveService.analyzeEmotionalIntelligence.mockReturnValue(mockEQ);
      bigFiveService.generateNarratives.mockResolvedValue(mockNarratives);

      attachmentService.analyzeAttachment.mockReturnValue(mockAttachment);
      attachmentService.analyzeCommunicationStyle.mockReturnValue(mockCommunication);
      attachmentService.analyzeConflictStyle.mockReturnValue(mockConflict);

      relationshipService.analyzeRelationshipDynamics.mockReturnValue({
        dominance: { Alice: 55, Bob: 45 },
        topicInitiation: { Alice: 60, Bob: 40 },
        pursuerWithdrawer: {
          isPursuerWithdrawer: false,
          confidence: 50,
          indicators: [],
        },
        emotionalReciprocity: 75,
        validationBalance: 80,
        supportBalance: 70,
        escalationTendency: 20,
        deescalationSkill: 75,
        resolutionRate: 80,
        positiveToNegativeRatio: 6.5,
        relationshipStrengths: ['emotional_attunement', 'balanced_communication'],
        growthOpportunities: ['conflict_resolution'],
        confidence: 65,
      });

      relationshipService.generateCoupleNarrative.mockResolvedValue({
        dynamicNarrative: 'This couple shows healthy communication patterns.',
        coachingFocus: 'Continue building on emotional connection.',
      });

      (prismaService.personalityProfile.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.personalityProfile.create as jest.Mock).mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
      });
      (prismaService.linguisticSnapshot.upsert as jest.Mock).mockResolvedValue({});
      (prismaService.personalityProfile.upsert as jest.Mock).mockResolvedValue({});
      (prismaService.relationshipDynamic.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.relationshipDynamic.upsert as jest.Mock).mockResolvedValue({});
    });

    it('should extract features for all participants', async () => {
      const result = await service.processSession('session-1', 'couple-1', messages);

      expect(linguisticService.extractFeaturesFromConversation).toHaveBeenCalledWith(messages);
      expect(result.profiles.size).toBe(2);
      expect(result.profiles.has('Alice')).toBe(true);
      expect(result.profiles.has('Bob')).toBe(true);
    });

    it('should build full profiles for each participant', async () => {
      const result = await service.processSession('session-1', 'couple-1', messages);

      const aliceProfile = result.profiles.get('Alice')!;
      expect(aliceProfile.bigFive).toEqual(mockBigFive);
      expect(aliceProfile.attachment).toEqual(mockAttachment);
      expect(aliceProfile.communication).toEqual(mockCommunication);
      expect(aliceProfile.conflict).toEqual(mockConflict);
      expect(aliceProfile.emotionalIntelligence).toEqual(mockEQ);
      expect(aliceProfile.narratives).toEqual(mockNarratives);
    });

    it('should analyze relationship dynamics for two participants', async () => {
      const result = await service.processSession('session-1', 'couple-1', messages);

      expect(relationshipService.analyzeRelationshipDynamics).toHaveBeenCalled();
      expect(result.dynamics).not.toBeNull();
      expect(result.dynamics!.positiveToNegativeRatio).toBe(6.5);
    });

    it('should save linguistic snapshots when user IDs are provided', async () => {
      const participantToUserMap = new Map([
        ['Alice', 'user-alice'],
        ['Bob', 'user-bob'],
      ]);

      await service.processSession('session-1', 'couple-1', messages, participantToUserMap);

      expect(prismaService.linguisticSnapshot.upsert).toHaveBeenCalledTimes(2);
    });

    it('should update personality profiles when user IDs are provided', async () => {
      const participantToUserMap = new Map([
        ['Alice', 'user-alice'],
        ['Bob', 'user-bob'],
      ]);

      await service.processSession('session-1', 'couple-1', messages, participantToUserMap);

      expect(prismaService.personalityProfile.upsert).toHaveBeenCalledTimes(2);
    });

    it('should update relationship dynamics for the couple', async () => {
      await service.processSession('session-1', 'couple-1', messages);

      expect(prismaService.relationshipDynamic.upsert).toHaveBeenCalled();
      const upsertCall = (prismaService.relationshipDynamic.upsert as jest.Mock).mock.calls[0][0];
      expect(upsertCall.where.coupleId).toBe('couple-1');
    });

    it('should calculate correct confidence score', async () => {
      const result = await service.processSession('session-1', 'couple-1', messages);

      const profile = result.profiles.get('Alice')!;
      // Average of all confidence scores: (60 + 65 + 60 + 55 + 62) / 5 = 60.4 ≈ 60
      expect(profile.confidence).toBeCloseTo(60, 0);
    });

    it('should skip relationship dynamics for single participant', async () => {
      const singleParticipantMessages = [
        { sender: 'Alice', content: 'Hello' },
        { sender: 'Alice', content: 'World' },
      ];

      linguisticService.extractFeaturesFromConversation.mockReturnValue(
        new Map([['Alice', mockLinguisticFeatures]]),
      );

      const result = await service.processSession(
        'session-1',
        'couple-1',
        singleParticipantMessages,
      );

      expect(relationshipService.analyzeRelationshipDynamics).not.toHaveBeenCalled();
      expect(result.dynamics).toBeNull();
    });
  });

  describe('profile blending', () => {
    it('should blend profiles with weighted average on subsequent sessions', async () => {
      const existingProfile = {
        id: 'profile-1',
        userId: 'user-1',
        openness: 60,
        conscientiousness: 70,
        extraversion: 50,
        agreeableness: 80,
        neuroticism: 30,
        confidenceScore: 55,
        sessionsAnalyzed: 5,
        attachmentAnxiety: 25,
        attachmentAvoidance: 20,
        emotionalAwareness: 65,
        empathyScore: 70,
        emotionalRegulation: 55,
      };

      (prismaService.personalityProfile.findUnique as jest.Mock).mockResolvedValue(
        existingProfile,
      );
      (prismaService.personalityProfile.update as jest.Mock).mockResolvedValue({});

      const messages = [
        { sender: 'Alice', content: 'I love this!' },
        { sender: 'Bob', content: 'Me too!' },
      ];

      linguisticService.extractFeaturesFromConversation.mockReturnValue(
        new Map([
          ['Alice', mockLinguisticFeatures],
          ['Bob', mockLinguisticFeatures],
        ]),
      );
      linguisticService.detectFourHorsemen.mockReturnValue(mockHorsemen);
      linguisticService.detectRepairAttempts.mockReturnValue(2);

      bigFiveService.analyzeBigFive.mockReturnValue(mockBigFive);
      bigFiveService.analyzeEmotionalIntelligence.mockReturnValue(mockEQ);
      bigFiveService.generateNarratives.mockResolvedValue(mockNarratives);

      attachmentService.analyzeAttachment.mockReturnValue(mockAttachment);
      attachmentService.analyzeCommunicationStyle.mockReturnValue(mockCommunication);
      attachmentService.analyzeConflictStyle.mockReturnValue(mockConflict);

      (prismaService.personalityProfile.create as jest.Mock).mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
      });
      (prismaService.linguisticSnapshot.upsert as jest.Mock).mockResolvedValue({});
      relationshipService.analyzeRelationshipDynamics.mockReturnValue({
        dominance: {},
        topicInitiation: {},
        pursuerWithdrawer: {
          isPursuerWithdrawer: false,
          confidence: 50,
          indicators: [],
        },
        emotionalReciprocity: 75,
        validationBalance: 80,
        supportBalance: 70,
        escalationTendency: 20,
        deescalationSkill: 75,
        resolutionRate: 80,
        positiveToNegativeRatio: 6.5,
        relationshipStrengths: [],
        growthOpportunities: [],
        confidence: 65,
      });
      relationshipService.generateCoupleNarrative.mockResolvedValue({
        dynamicNarrative: '',
        coachingFocus: '',
      });
      (prismaService.relationshipDynamic.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.relationshipDynamic.upsert as jest.Mock).mockResolvedValue({});

      const participantToUserMap = new Map([
        ['Alice', 'user-1'],
        ['Bob', 'user-2'],
      ]);

      await service.processSession('session-1', 'couple-1', messages, participantToUserMap);

      // Verify update was called (blending occurred)
      expect(prismaService.personalityProfile.update).toHaveBeenCalled();
    });
  });

  describe('getPersonalityProfile', () => {
    it('should return null when profile does not exist', async () => {
      (prismaService.personalityProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getPersonalityProfile('user-1');

      expect(result).toBeNull();
    });

    it('should return profile with descriptions', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'user-1',
        openness: 70,
        conscientiousness: 65,
        extraversion: 55,
        agreeableness: 75,
        neuroticism: 30,
        attachmentStyle: 'SECURE' as AttachmentStyle,
        communicationStyle: 'LEVELER' as CommunicationStyle,
        snapshots: [],
      };

      (prismaService.personalityProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
      attachmentService.getAttachmentDescription.mockReturnValue('Secure attachment description');
      attachmentService.getCommunicationDescription.mockReturnValue('Leveler description');
      bigFiveService.getTraitDescription.mockReturnValue('High trait description');

      const result = await service.getPersonalityProfile('user-1');

      expect(result).not.toBeNull();
      expect(result!.attachmentDescription).toBe('Secure attachment description');
      expect(result!.communicationDescription).toBe('Leveler description');
      expect(result!.traitDescriptions.openness).toBe('High trait description');
    });
  });

  describe('getRelationshipDynamic', () => {
    it('should return null when dynamic does not exist', async () => {
      (prismaService.relationshipDynamic.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getRelationshipDynamic('couple-1');

      expect(result).toBeNull();
    });

    it('should return dynamics with descriptions', async () => {
      const mockDynamic = {
        id: 'dynamic-1',
        coupleId: 'couple-1',
        relationshipStrengths: ['emotional_attunement'],
        growthOpportunities: ['conflict_resolution'],
      };

      (prismaService.relationshipDynamic.findUnique as jest.Mock).mockResolvedValue(mockDynamic);
      relationshipService.getStrengthDescription.mockReturnValue('Good emotional connection');
      relationshipService.getGrowthDescription.mockReturnValue('Work on resolving conflicts');

      const result = await service.getRelationshipDynamic('couple-1');

      expect(result).not.toBeNull();
      expect(result!.strengthDescriptions).toContain('Good emotional connection');
      expect(result!.growthDescriptions).toContain('Work on resolving conflicts');
    });
  });

  describe('getProfileEvolution', () => {
    it('should return empty array when no profile exists', async () => {
      (prismaService.personalityProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getProfileEvolution('user-1');

      expect(result).toEqual([]);
    });

    it('should return empty array when no snapshots exist', async () => {
      (prismaService.personalityProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        snapshots: [],
      });

      const result = await service.getProfileEvolution('user-1');

      expect(result).toEqual([]);
    });

    it('should calculate evolution from snapshots', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      (prismaService.personalityProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        snapshots: [
          {
            createdAt: yesterday,
            positiveEmotionWords: 10,
            negativeEmotionWords: 2,
            firstPersonSingular: 5,
            firstPersonPlural: 3,
            certaintyWords: 4,
            tentativeWords: 2,
          },
          {
            createdAt: now,
            positiveEmotionWords: 12,
            negativeEmotionWords: 1,
            firstPersonSingular: 4,
            firstPersonPlural: 5,
            certaintyWords: 5,
            tentativeWords: 3,
          },
        ],
      });

      const result = await service.getProfileEvolution('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].date).toEqual(yesterday);
      expect(result[1].date).toEqual(now);
      expect(result[0].confidence).toBe(20); // 1 session
      expect(result[1].confidence).toBe(40); // 2 sessions (2-4 range)
    });

    it('should increase confidence with more sessions', async () => {
      const snapshots = Array.from({ length: 10 }, (_, i) => ({
        createdAt: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000),
        positiveEmotionWords: 10,
        negativeEmotionWords: 2,
        firstPersonSingular: 5,
        firstPersonPlural: 3,
        certaintyWords: 4,
        tentativeWords: 2,
      }));

      (prismaService.personalityProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        snapshots,
      });

      const result = await service.getProfileEvolution('user-1');

      expect(result).toHaveLength(10);
      expect(result[0].confidence).toBe(20); // 1 session (< 2)
      expect(result[1].confidence).toBe(40); // 2 sessions (2-4 range)
      expect(result[4].confidence).toBe(60); // 5 sessions (5-9 range)
      expect(result[9].confidence).toBe(80); // 10 sessions (10-19 range)
    });
  });

  describe('confidence calculation', () => {
    it('should return 20 for less than 2 sessions', async () => {
      const snapshots = [
        {
          createdAt: new Date(),
          positiveEmotionWords: 10,
          negativeEmotionWords: 2,
          firstPersonSingular: 5,
          firstPersonPlural: 3,
          certaintyWords: 4,
          tentativeWords: 2,
        },
      ];

      (prismaService.personalityProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        snapshots,
      });

      const result = await service.getProfileEvolution('user-1');
      expect(result[0].confidence).toBe(20);
    });

    it('should return 40 for 2-4 sessions', async () => {
      const snapshots = Array.from({ length: 3 }, (_, i) => ({
        createdAt: new Date(Date.now() - (3 - i) * 24 * 60 * 60 * 1000),
        positiveEmotionWords: 10,
        negativeEmotionWords: 2,
        firstPersonSingular: 5,
        firstPersonPlural: 3,
        certaintyWords: 4,
        tentativeWords: 2,
      }));

      (prismaService.personalityProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        snapshots,
      });

      const result = await service.getProfileEvolution('user-1');
      expect(result[2].confidence).toBe(40);
    });

    it('should return 60 for 5-9 sessions', async () => {
      const snapshots = Array.from({ length: 7 }, (_, i) => ({
        createdAt: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000),
        positiveEmotionWords: 10,
        negativeEmotionWords: 2,
        firstPersonSingular: 5,
        firstPersonPlural: 3,
        certaintyWords: 4,
        tentativeWords: 2,
      }));

      (prismaService.personalityProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        snapshots,
      });

      const result = await service.getProfileEvolution('user-1');
      expect(result[6].confidence).toBe(60);
    });

    it('should return 80 for 10-19 sessions', async () => {
      const snapshots = Array.from({ length: 15 }, (_, i) => ({
        createdAt: new Date(Date.now() - (15 - i) * 24 * 60 * 60 * 1000),
        positiveEmotionWords: 10,
        negativeEmotionWords: 2,
        firstPersonSingular: 5,
        firstPersonPlural: 3,
        certaintyWords: 4,
        tentativeWords: 2,
      }));

      (prismaService.personalityProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        snapshots,
      });

      const result = await service.getProfileEvolution('user-1');
      expect(result[14].confidence).toBe(80);
    });

    it('should return 90 for 20+ sessions', async () => {
      const snapshots = Array.from({ length: 25 }, (_, i) => ({
        createdAt: new Date(Date.now() - (25 - i) * 24 * 60 * 60 * 1000),
        positiveEmotionWords: 10,
        negativeEmotionWords: 2,
        firstPersonSingular: 5,
        firstPersonPlural: 3,
        certaintyWords: 4,
        tentativeWords: 2,
      }));

      (prismaService.personalityProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        snapshots,
      });

      const result = await service.getProfileEvolution('user-1');
      expect(result[24].confidence).toBe(90);
    });
  });
});
