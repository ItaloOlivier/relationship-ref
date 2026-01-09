import { Test, TestingModule } from '@nestjs/testing';
import { StreaksService } from './streaks.service';
import { PrismaService } from '@/common/prisma/prisma.service';

describe('StreaksService', () => {
  let service: StreaksService;
  let prisma: PrismaService;

  const mockPrismaService = {
    streak: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreaksService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StreaksService>(StreaksService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStreak', () => {
    it('should return streak for user', async () => {
      const mockStreak = {
        id: 'streak-1',
        userId: 'user-1',
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: new Date(),
      };

      mockPrismaService.streak.findUnique.mockResolvedValue(mockStreak);

      const result = await service.getStreak('user-1');

      expect(result).toEqual(mockStreak);
      expect(mockPrismaService.streak.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should return null if no streak exists', async () => {
      mockPrismaService.streak.findUnique.mockResolvedValue(null);

      const result = await service.getStreak('user-1');

      expect(result).toBeNull();
    });
  });

  describe('recordActivity', () => {
    it('should create new streak if none exists', async () => {
      mockPrismaService.streak.findUnique.mockResolvedValue(null);
      mockPrismaService.streak.create.mockResolvedValue({
        id: 'streak-1',
        userId: 'user-1',
        currentStreak: 1,
        longestStreak: 1,
      });

      const result = await service.recordActivity('user-1');

      expect(mockPrismaService.streak.create).toHaveBeenCalled();
      expect(result.currentStreak).toBe(1);
    });

    it('should increment streak for consecutive day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockPrismaService.streak.findUnique.mockResolvedValue({
        id: 'streak-1',
        userId: 'user-1',
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: yesterday,
      });

      mockPrismaService.streak.update.mockResolvedValue({
        id: 'streak-1',
        userId: 'user-1',
        currentStreak: 6,
        longestStreak: 10,
      });

      const result = await service.recordActivity('user-1');

      expect(mockPrismaService.streak.update).toHaveBeenCalled();
    });

    it('should reset streak if day is missed', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      mockPrismaService.streak.findUnique.mockResolvedValue({
        id: 'streak-1',
        userId: 'user-1',
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: twoDaysAgo,
      });

      mockPrismaService.streak.update.mockResolvedValue({
        id: 'streak-1',
        userId: 'user-1',
        currentStreak: 1,
        longestStreak: 10,
      });

      await service.recordActivity('user-1');

      expect(mockPrismaService.streak.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentStreak: 1,
          }),
        }),
      );
    });

    it('should not change streak for same day activity', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockStreak = {
        id: 'streak-1',
        userId: 'user-1',
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: today,
      };

      mockPrismaService.streak.findUnique.mockResolvedValue(mockStreak);

      const result = await service.recordActivity('user-1');

      expect(result).toEqual(mockStreak);
      expect(mockPrismaService.streak.update).not.toHaveBeenCalled();
    });

    it('should update longest streak when current exceeds it', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockPrismaService.streak.findUnique.mockResolvedValue({
        id: 'streak-1',
        userId: 'user-1',
        currentStreak: 10,
        longestStreak: 10,
        lastActivityDate: yesterday,
      });

      mockPrismaService.streak.update.mockImplementation(({ data }) => {
        return Promise.resolve({
          id: 'streak-1',
          userId: 'user-1',
          currentStreak: data.currentStreak,
          longestStreak: data.longestStreak,
        });
      });

      await service.recordActivity('user-1');

      expect(mockPrismaService.streak.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentStreak: 11,
            longestStreak: 11,
          }),
        }),
      );
    });
  });

  describe('checkAndResetBrokenStreaks', () => {
    it('should reset streaks older than yesterday', async () => {
      mockPrismaService.streak.updateMany.mockResolvedValue({ count: 5 });

      await service.checkAndResetBrokenStreaks();

      expect(mockPrismaService.streak.updateMany).toHaveBeenCalledWith({
        where: {
          currentStreak: { gt: 0 },
          lastActivityDate: expect.any(Object),
        },
        data: {
          currentStreak: 0,
        },
      });
    });
  });
});
