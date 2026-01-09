import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PersonalityController } from './personality.controller';
import { ProfileAggregatorService } from './profile-aggregator.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('PersonalityController', () => {
  let controller: PersonalityController;
  let profileAggregator: jest.Mocked<ProfileAggregatorService>;
  let prisma: jest.Mocked<PrismaService>;

  const mockProfile = {
    id: 'profile-1',
    userId: 'user-1',
    openness: 70,
    conscientiousness: 65,
    extraversion: 55,
    agreeableness: 75,
    neuroticism: 30,
    attachmentStyle: 'SECURE',
    communicationStyle: 'LEVELER',
    sessionsAnalyzed: 5,
    confidenceScore: 60,
  };

  const mockDynamics = {
    id: 'dynamic-1',
    coupleId: 'couple-1',
    positiveToNegativeRatio: 5.5,
    pursuerWithdrawer: false,
    relationshipStrengths: ['emotional_attunement'],
    growthOpportunities: ['conflict_resolution'],
  };

  const mockCouple = {
    id: 'couple-1',
    partner1Id: 'user-1',
    partner2Id: 'user-2',
    inviteCode: 'ABC123',
  };

  const mockUser1 = { id: 'user-1', name: 'Alice', email: 'alice@test.com' };
  const mockUser2 = { id: 'user-2', name: 'Bob', email: 'bob@test.com' };

  beforeEach(async () => {
    const mockProfileAggregator = {
      getPersonalityProfile: jest.fn(),
      getRelationshipDynamic: jest.fn(),
      getProfileEvolution: jest.fn(),
      processSession: jest.fn(),
    };

    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      couple: {
        findFirst: jest.fn(),
      },
      session: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalityController],
      providers: [
        { provide: ProfileAggregatorService, useValue: mockProfileAggregator },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<PersonalityController>(PersonalityController);
    profileAggregator = module.get(ProfileAggregatorService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyProfile', () => {
    it('should return the current user profile', async () => {
      profileAggregator.getPersonalityProfile.mockResolvedValue(mockProfile);

      const result = await controller.getMyProfile({ user: { id: 'user-1' } });

      expect(profileAggregator.getPersonalityProfile).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException when no profile exists', async () => {
      profileAggregator.getPersonalityProfile.mockResolvedValue(null);

      await expect(controller.getMyProfile({ user: { id: 'user-1' } })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserProfile', () => {
    beforeEach(() => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser2);
    });

    it('should return partner profile when in same couple', async () => {
      (prisma.couple.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockCouple) // current user's couple
        .mockResolvedValueOnce(mockCouple); // target user's couple

      profileAggregator.getPersonalityProfile.mockResolvedValue(mockProfile);

      const result = await controller.getUserProfile('user-2', { user: { id: 'user-1' } });

      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.getUserProfile('user-unknown', { user: { id: 'user-1' } }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when users not in same couple', async () => {
      (prisma.couple.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockCouple) // current user's couple
        .mockResolvedValueOnce({ ...mockCouple, id: 'different-couple' }); // target user's couple

      await expect(
        controller.getUserProfile('user-2', { user: { id: 'user-1' } }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when no profile exists for target user', async () => {
      (prisma.couple.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockCouple)
        .mockResolvedValueOnce(mockCouple);

      profileAggregator.getPersonalityProfile.mockResolvedValue(null);

      await expect(
        controller.getUserProfile('user-2', { user: { id: 'user-1' } }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyEvolution', () => {
    it('should return profile evolution data', async () => {
      const mockEvolution = [
        { date: new Date(), confidence: 40, traits: { emotionBalance: 5 } },
        { date: new Date(), confidence: 60, traits: { emotionBalance: 6 } },
      ];

      profileAggregator.getProfileEvolution.mockResolvedValue(mockEvolution);

      const result = await controller.getMyEvolution({ user: { id: 'user-1' } });

      expect(profileAggregator.getProfileEvolution).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockEvolution);
    });
  });

  describe('getCoupleAnalysis', () => {
    it('should return relationship dynamics', async () => {
      (prisma.couple.findFirst as jest.Mock).mockResolvedValue(mockCouple);
      profileAggregator.getRelationshipDynamic.mockResolvedValue(mockDynamics);

      const result = await controller.getCoupleAnalysis({ user: { id: 'user-1' } });

      expect(profileAggregator.getRelationshipDynamic).toHaveBeenCalledWith('couple-1');
      expect(result).toEqual(mockDynamics);
    });

    it('should throw NotFoundException when user not in a couple', async () => {
      (prisma.couple.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(controller.getCoupleAnalysis({ user: { id: 'user-1' } })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when no dynamics exist', async () => {
      (prisma.couple.findFirst as jest.Mock).mockResolvedValue(mockCouple);
      profileAggregator.getRelationshipDynamic.mockResolvedValue(null);

      await expect(controller.getCoupleAnalysis({ user: { id: 'user-1' } })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCoupleComparison', () => {
    beforeEach(() => {
      (prisma.couple.findFirst as jest.Mock).mockResolvedValue(mockCouple);
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser1)
        .mockResolvedValueOnce(mockUser2);
    });

    it('should return side-by-side comparison with insights', async () => {
      profileAggregator.getPersonalityProfile
        .mockResolvedValueOnce({ ...mockProfile, attachmentStyle: 'SECURE' })
        .mockResolvedValueOnce({ ...mockProfile, attachmentStyle: 'SECURE' });
      profileAggregator.getRelationshipDynamic.mockResolvedValue(mockDynamics);

      const result = await controller.getCoupleComparison({ user: { id: 'user-1' } });

      expect(result.partner1.userId).toBe('user-1');
      expect(result.partner1.name).toBe('Alice');
      expect(result.partner2.userId).toBe('user-2');
      expect(result.partner2.name).toBe('Bob');
      expect(result.dynamics).toEqual(mockDynamics);
      expect(result.insights).toBeDefined();
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when user not in a couple', async () => {
      (prisma.couple.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(controller.getCoupleComparison({ user: { id: 'user-1' } })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when partner2 not registered', async () => {
      (prisma.couple.findFirst as jest.Mock).mockResolvedValue({
        ...mockCouple,
        partner2Id: null,
      });

      await expect(controller.getCoupleComparison({ user: { id: 'user-1' } })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should generate anxious-avoidant insight', async () => {
      profileAggregator.getPersonalityProfile
        .mockResolvedValueOnce({ ...mockProfile, attachmentStyle: 'ANXIOUS_PREOCCUPIED' })
        .mockResolvedValueOnce({ ...mockProfile, attachmentStyle: 'DISMISSIVE_AVOIDANT' });
      profileAggregator.getRelationshipDynamic.mockResolvedValue(mockDynamics);

      const result = await controller.getCoupleComparison({ user: { id: 'user-1' } });

      expect(result.insights).toContain(
        'This pairing shows a classic anxious-avoidant dynamic. Understanding this pattern can help break cycles.',
      );
    });

    it('should generate healthy ratio insight', async () => {
      profileAggregator.getPersonalityProfile
        .mockResolvedValueOnce(mockProfile)
        .mockResolvedValueOnce(mockProfile);
      profileAggregator.getRelationshipDynamic.mockResolvedValue({
        ...mockDynamics,
        positiveToNegativeRatio: 6,
      });

      const result = await controller.getCoupleComparison({ user: { id: 'user-1' } });

      expect(result.insights).toContain(
        'Your positive-to-negative interaction ratio is healthy (5:1 is the Gottman research target).',
      );
    });
  });

  describe('analyzeSession', () => {
    const mockSession = {
      id: 'session-1',
      coupleId: 'couple-1',
      transcript: '[01/01/2024, 10:00] Alice: Hello!\n[01/01/2024, 10:01] Bob: Hi there!',
      chatParticipants: ['Alice', 'Bob'],
      couple: mockCouple,
    };

    beforeEach(() => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.couple.findFirst as jest.Mock).mockResolvedValue(mockCouple);
    });

    it('should analyze session and return profiles', async () => {
      const mockResult = {
        profiles: new Map([
          ['Alice', { bigFive: { openness: 70 } } as any],
          ['Bob', { bigFive: { openness: 65 } } as any],
        ]),
        dynamics: mockDynamics as any,
      };

      profileAggregator.processSession.mockResolvedValue(mockResult as any);

      const result = await controller.analyzeSession('session-1', { user: { id: 'user-1' } });

      expect(result.sessionId).toBe('session-1');
      expect(result.profiles.Alice).toBeDefined();
      expect(result.profiles.Bob).toBeDefined();
      expect(result.dynamics).toEqual(mockDynamics);
      expect(result.messagesAnalyzed).toBe(2);
    });

    it('should throw NotFoundException when session not found', async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.analyzeSession('session-unknown', { user: { id: 'user-1' } }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user not in session couple', async () => {
      (prisma.couple.findFirst as jest.Mock).mockResolvedValue({
        ...mockCouple,
        id: 'different-couple',
      });

      await expect(
        controller.analyzeSession('session-1', { user: { id: 'user-1' } }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when no messages in transcript', async () => {
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        ...mockSession,
        transcript: null,
      });

      await expect(
        controller.analyzeSession('session-1', { user: { id: 'user-1' } }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('transcript parsing', () => {
    it('should parse WhatsApp format transcripts', async () => {
      const mockSession = {
        id: 'session-1',
        coupleId: 'couple-1',
        transcript:
          '[01/01/2024, 10:00:00] Alice: Good morning!\n' +
          '[01/01/2024, 10:01:00] Bob: Morning! How are you?\n' +
          '[01/01/2024, 10:02:00] Alice: Great, thanks!',
        chatParticipants: ['Alice', 'Bob'],
        couple: mockCouple,
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.couple.findFirst as jest.Mock).mockResolvedValue(mockCouple);

      profileAggregator.processSession.mockResolvedValue({
        profiles: new Map(),
        dynamics: null,
      });

      const result = await controller.analyzeSession('session-1', { user: { id: 'user-1' } });

      expect(result.messagesAnalyzed).toBe(3);
    });

    it('should skip system messages', async () => {
      const mockSession = {
        id: 'session-1',
        coupleId: 'couple-1',
        transcript:
          '[01/01/2024, 10:00:00] Alice: Hello\n' +
          '[01/01/2024, 10:00:01] System: Messages and calls are end-to-end encrypted\n' +
          '[01/01/2024, 10:01:00] Bob: Hi',
        chatParticipants: ['Alice', 'Bob'],
        couple: mockCouple,
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.couple.findFirst as jest.Mock).mockResolvedValue(mockCouple);

      profileAggregator.processSession.mockResolvedValue({
        profiles: new Map(),
        dynamics: null,
      });

      const result = await controller.analyzeSession('session-1', { user: { id: 'user-1' } });

      // Only Alice and Bob messages should be parsed, not the system message
      expect(result.messagesAnalyzed).toBe(2);
    });

    it('should skip media omitted messages', async () => {
      const mockSession = {
        id: 'session-1',
        coupleId: 'couple-1',
        transcript:
          '[01/01/2024, 10:00:00] Alice: Hello\n' +
          '[01/01/2024, 10:00:30] Alice: <Media omitted>\n' +
          '[01/01/2024, 10:01:00] Bob: Hi',
        chatParticipants: ['Alice', 'Bob'],
        couple: mockCouple,
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (prisma.couple.findFirst as jest.Mock).mockResolvedValue(mockCouple);

      profileAggregator.processSession.mockResolvedValue({
        profiles: new Map(),
        dynamics: null,
      });

      const result = await controller.analyzeSession('session-1', { user: { id: 'user-1' } });

      expect(result.messagesAnalyzed).toBe(2);
    });
  });
});
