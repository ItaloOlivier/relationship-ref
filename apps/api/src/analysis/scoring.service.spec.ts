import { Test, TestingModule } from '@nestjs/testing';
import { ScoringService } from './scoring.service';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CardType } from '@prisma/client';

describe('ScoringService', () => {
  let service: ScoringService;
  let prisma: PrismaService;

  const mockPrismaService = {
    scoringConfig: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeTranscript', () => {
    it('should detect appreciation and give green card', async () => {
      const transcript = 'Thank you for listening to me today. I really appreciate it.';
      const result = await service.analyzeTranscript(transcript);

      expect(result.cards.some(c => c.type === CardType.GREEN)).toBe(true);
      expect(result.cards.some(c => c.category === 'appreciation')).toBe(true);
      expect(result.bankChange).toBeGreaterThan(0);
    });

    it('should detect validation and give green card', async () => {
      const transcript = 'I understand how you feel. That makes sense to me.';
      const result = await service.analyzeTranscript(transcript);

      expect(result.cards.some(c => c.type === CardType.GREEN)).toBe(true);
      expect(result.cards.some(c => c.category === 'validation')).toBe(true);
    });

    it('should detect curiosity/questions and give green card', async () => {
      const transcript = 'Can you tell me more about what happened? How do you feel about it?';
      const result = await service.analyzeTranscript(transcript);

      expect(result.cards.some(c => c.type === CardType.GREEN)).toBe(true);
      expect(result.cards.some(c => c.category === 'curiosity')).toBe(true);
    });

    it('should detect repair attempts and give green card with high points', async () => {
      const transcript = "I'm sorry for what I said. Let's start over.";
      const result = await service.analyzeTranscript(transcript);

      expect(result.cards.some(c => c.type === CardType.GREEN)).toBe(true);
      expect(result.repairAttempts.length).toBeGreaterThan(0);
      expect(result.bankChange).toBeGreaterThan(0);
    });

    it('should detect always/never language and give yellow card', async () => {
      const transcript = 'You always do this! You never listen to me.';
      const result = await service.analyzeTranscript(transcript);

      expect(result.cards.some(c => c.type === CardType.YELLOW)).toBe(true);
      expect(result.cards.some(c => c.category === 'always_never')).toBe(true);
      expect(result.bankChange).toBeLessThan(0);
    });

    it('should detect blame phrasing and give yellow card', async () => {
      const transcript = "You made me feel terrible. It's your fault this happened.";
      const result = await service.analyzeTranscript(transcript);

      expect(result.cards.some(c => c.type === CardType.YELLOW)).toBe(true);
      expect(result.cards.some(c => c.category === 'blame_phrasing')).toBe(true);
    });

    it('should detect contempt and give red card', async () => {
      const transcript = "You're pathetic. You disgust me.";
      const result = await service.analyzeTranscript(transcript);

      expect(result.cards.some(c => c.type === CardType.RED)).toBe(true);
      expect(result.horsemenDetected.some(h => h.type === 'contempt')).toBe(true);
      expect(result.bankChange).toBeLessThan(0);
    });

    it('should detect defensiveness and give red card', async () => {
      const transcript = "It's not my fault! You're overreacting as usual.";
      const result = await service.analyzeTranscript(transcript);

      expect(result.cards.some(c => c.type === CardType.RED)).toBe(true);
      expect(result.horsemenDetected.some(h => h.type === 'defensiveness')).toBe(true);
    });

    it('should detect stonewalling and give red card', async () => {
      const transcript = "Whatever. I don't care. Leave me alone.";
      const result = await service.analyzeTranscript(transcript);

      expect(result.cards.some(c => c.type === CardType.RED)).toBe(true);
      expect(result.horsemenDetected.some(h => h.type === 'stonewalling')).toBe(true);
    });

    it('should trigger safety flag for threatening language', async () => {
      const transcript = "I'll hurt you if you don't stop.";
      const result = await service.analyzeTranscript(transcript);

      expect(result.safetyFlagTriggered).toBe(true);
    });

    it('should not trigger safety flag for normal conversation', async () => {
      const transcript = 'I understand. Can you tell me more about how you feel?';
      const result = await service.analyzeTranscript(transcript);

      expect(result.safetyFlagTriggered).toBe(false);
    });

    it('should calculate overall score between 0-100', async () => {
      const transcript = 'Thank you for being here. I appreciate you.';
      const result = await service.analyzeTranscript(transcript);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should handle empty transcript', async () => {
      const transcript = '';
      const result = await service.analyzeTranscript(transcript);

      expect(result.cards).toHaveLength(0);
      expect(result.bankChange).toBe(0);
      expect(result.overallScore).toBe(70); // Base score
    });

    it('should handle mixed positive and negative patterns', async () => {
      const transcript = "Thank you for trying. But you always say that and never follow through.";
      const result = await service.analyzeTranscript(transcript);

      const greenCards = result.cards.filter(c => c.type === CardType.GREEN);
      const yellowCards = result.cards.filter(c => c.type === CardType.YELLOW);

      expect(greenCards.length).toBeGreaterThan(0);
      expect(yellowCards.length).toBeGreaterThan(0);
    });
  });

  describe('countCards', () => {
    it('should correctly count cards by type', () => {
      const cards = [
        { type: CardType.GREEN, reason: 'test', category: 'appreciation' },
        { type: CardType.GREEN, reason: 'test', category: 'validation' },
        { type: CardType.YELLOW, reason: 'test', category: 'always_never' },
        { type: CardType.RED, reason: 'test', category: 'contempt' },
      ];

      const counts = service.countCards(cards);

      expect(counts.green).toBe(2);
      expect(counts.yellow).toBe(1);
      expect(counts.red).toBe(1);
    });

    it('should return zeros for empty cards', () => {
      const counts = service.countCards([]);

      expect(counts.green).toBe(0);
      expect(counts.yellow).toBe(0);
      expect(counts.red).toBe(0);
    });
  });
});
