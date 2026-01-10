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

  describe('Speaker Attribution', () => {
    it('should detect speaker from "SpeakerName: message" format', async () => {
      const transcript = 'John: Thank you for listening to me.';
      const result = await service.analyzeTranscript(transcript);

      const appreciationCard = result.cards.find(c => c.category === 'appreciation');
      expect(appreciationCard).toBeDefined();
      expect(appreciationCard?.speaker).toBe('John');
    });

    it('should detect speaker from WhatsApp format', async () => {
      const transcript = 'Sarah: I appreciate your effort.\nJohn: You always say that.';
      const result = await service.analyzeTranscript(transcript);

      const appreciationCard = result.cards.find(c => c.category === 'appreciation');
      const alwaysCard = result.cards.find(c => c.category === 'always_never');

      expect(appreciationCard?.speaker).toBe('Sarah');
      expect(alwaysCard?.speaker).toBe('John');
    });

    it('should handle multiple speakers saying same thing', async () => {
      const transcript = 'Alice: I appreciate you.\nBob: Thank you so much.';
      const result = await service.analyzeTranscript(transcript);

      const appreciationCards = result.cards.filter(c => c.category === 'appreciation');
      expect(appreciationCards.length).toBeGreaterThanOrEqual(2);

      const speakers = appreciationCards.map(c => c.speaker);
      expect(speakers).toContain('Alice');
      expect(speakers).toContain('Bob');
    });

    it('should handle quotes without speaker (unknown speaker)', async () => {
      const transcript = 'Thank you for everything.';
      const result = await service.analyzeTranscript(transcript);

      const card = result.cards.find(c => c.category === 'appreciation');
      expect(card).toBeDefined();
      expect(card?.speaker).toBeUndefined();
    });

    it('should attribute horsemen to correct speaker', async () => {
      const transcript = "Mike: You're pathetic.\nLisa: I understand your frustration.";
      const result = await service.analyzeTranscript(transcript);

      const contemptHorseman = result.horsemenDetected.find(h => h.type === 'contempt');
      expect(contemptHorseman).toBeDefined();
      expect(contemptHorseman?.speaker).toBe('Mike');
    });

    it('should attribute repair attempts to correct speaker', async () => {
      const transcript = "Sam: You never listen!\nAlex: I'm sorry, let's start over.";
      const result = await service.analyzeTranscript(transcript);

      const repairAttempt = result.repairAttempts.find(r => r.quote.toLowerCase().includes("i'm sorry"));
      expect(repairAttempt).toBeDefined();
      expect(repairAttempt?.speaker).toBe('Alex');
    });

    it('should handle speaker names with spaces', async () => {
      const transcript = 'Mary Smith: I appreciate your help.';
      const result = await service.analyzeTranscript(transcript);

      const card = result.cards.find(c => c.category === 'appreciation');
      expect(card?.speaker).toBe('Mary Smith');
    });

    it('should not detect timestamps as speakers', async () => {
      const transcript = '14:32: Thank you for your time.';
      const result = await service.analyzeTranscript(transcript);

      const card = result.cards.find(c => c.category === 'appreciation');
      expect(card?.speaker).toBeUndefined(); // Timestamp shouldn't be treated as speaker
    });

    it('should handle case-insensitive quote matching', async () => {
      const transcript = 'JOHN: THANK YOU SO MUCH';
      const result = await service.analyzeTranscript(transcript);

      const card = result.cards.find(c => c.category === 'appreciation');
      expect(card).toBeDefined();
      expect(card?.speaker).toBe('JOHN');
    });

    it('should attribute multiple cards from same speaker', async () => {
      const transcript = 'Emily: Thank you. I really appreciate it. Can you tell me more?';
      const result = await service.analyzeTranscript(transcript);

      const emilyCards = result.cards.filter(c => c.speaker === 'Emily');
      expect(emilyCards.length).toBeGreaterThanOrEqual(2);

      const categories = emilyCards.map(c => c.category);
      expect(categories).toContain('appreciation');
    });
  });

  describe('Individual Score Calculation', () => {
    it('should calculate individual scores for two speakers', async () => {
      const transcript = `John: Thank you for listening. I appreciate you.
Sarah: You always say that. You never follow through.`;
      const result = await service.analyzeTranscript(transcript);

      expect(result.individualScores).toBeDefined();
      expect(result.individualScores.length).toBe(2);

      const johnScore = result.individualScores.find(s => s.speaker === 'John');
      const sarahScore = result.individualScores.find(s => s.speaker === 'Sarah');

      expect(johnScore).toBeDefined();
      expect(sarahScore).toBeDefined();
    });

    it('should correctly count card types per speaker', async () => {
      const transcript = `Alice: Thank you. I appreciate you.
Bob: You're pathetic. You always mess up.`;
      const result = await service.analyzeTranscript(transcript);

      const aliceScore = result.individualScores.find(s => s.speaker === 'Alice');
      const bobScore = result.individualScores.find(s => s.speaker === 'Bob');

      expect(aliceScore?.greenCardCount).toBeGreaterThan(0);
      expect(aliceScore?.yellowCardCount).toBe(0);
      expect(aliceScore?.redCardCount).toBe(0);

      expect(bobScore?.greenCardCount).toBe(0);
      expect(bobScore?.yellowCardCount).toBeGreaterThan(0);
      expect(bobScore?.redCardCount).toBeGreaterThan(0);
    });

    it('should calculate bank contribution per speaker', async () => {
      const transcript = `Mike: Thank you so much. I'm sorry.
Lisa: You never listen. You always do this.`;
      const result = await service.analyzeTranscript(transcript);

      const mikeScore = result.individualScores.find(s => s.speaker === 'Mike');
      const lisaScore = result.individualScores.find(s => s.speaker === 'Lisa');

      expect(mikeScore?.bankContribution).toBeGreaterThan(0);
      expect(lisaScore?.bankContribution).toBeLessThan(0);
    });

    it('should calculate personal scores (0-100) per speaker', async () => {
      const transcript = `Tom: Thank you. I appreciate you.
Jerry: You're pathetic. You disgust me.`;
      const result = await service.analyzeTranscript(transcript);

      const tomScore = result.individualScores.find(s => s.speaker === 'Tom');
      const jerryScore = result.individualScores.find(s => s.speaker === 'Jerry');

      expect(tomScore?.personalScore).toBeGreaterThan(70); // Above baseline
      expect(tomScore?.personalScore).toBeLessThanOrEqual(100);

      expect(jerryScore?.personalScore).toBeLessThan(70); // Below baseline
      expect(jerryScore?.personalScore).toBeGreaterThanOrEqual(0);
    });

    it('should track horsemen usage per speaker', async () => {
      const transcript = `Alex: You're pathetic and useless.
Sam: It's not my fault. You're overreacting.`;
      const result = await service.analyzeTranscript(transcript);

      const alexScore = result.individualScores.find(s => s.speaker === 'Alex');
      const samScore = result.individualScores.find(s => s.speaker === 'Sam');

      expect(alexScore?.horsemenUsed).toContain('contempt');
      expect(samScore?.horsemenUsed).toContain('defensiveness');
    });

    it('should count repair attempts per speaker', async () => {
      const transcript = `Emma: You never listen to me!
Oliver: I'm sorry. Let's start over. I love you.`;
      const result = await service.analyzeTranscript(transcript);

      const emmaScore = result.individualScores.find(s => s.speaker === 'Emma');
      const oliverScore = result.individualScores.find(s => s.speaker === 'Oliver');

      expect(emmaScore?.repairAttemptCount).toBe(0);
      expect(oliverScore?.repairAttemptCount).toBeGreaterThan(0);
    });

    it('should handle solo sessions with one speaker', async () => {
      const transcript = 'Chris: Thank you. I appreciate everything. You always help.';
      const result = await service.analyzeTranscript(transcript);

      expect(result.individualScores.length).toBe(1);
      const chrisScore = result.individualScores[0];
      expect(chrisScore.speaker).toBe('Chris');
      expect(chrisScore.greenCardCount).toBeGreaterThan(0);
    });

    it('should exclude cards without speaker attribution from individual scores', async () => {
      const transcript = 'Thank you for everything. You always help me.';
      const result = await service.analyzeTranscript(transcript);

      // Overall cards should exist
      expect(result.cards.length).toBeGreaterThan(0);

      // But no individual scores since no speakers identified
      expect(result.individualScores.length).toBe(0);
    });

    it('should not duplicate horsemen in horsemenUsed array', async () => {
      const transcript = `Karen: You're pathetic. You disgust me. You're so pathetic.`;
      const result = await service.analyzeTranscript(transcript);

      const karenScore = result.individualScores.find(s => s.speaker === 'Karen');
      expect(karenScore).toBeDefined();

      // Should only list 'contempt' once, not multiple times
      const contemptCount = karenScore!.horsemenUsed.filter(h => h === 'contempt').length;
      expect(contemptCount).toBe(1);
    });

    it('should sum individual contributions to match overall bank change', async () => {
      const transcript = `Partner1: Thank you so much.
Partner2: You never listen.`;
      const result = await service.analyzeTranscript(transcript);

      const totalIndividualContribution = result.individualScores.reduce(
        (sum, score) => sum + score.bankContribution,
        0
      );

      expect(totalIndividualContribution).toBe(result.bankChange);
    });

    it('should handle speakers with mixed behaviors', async () => {
      const transcript = `Jordan: Thank you for trying. But you always say that. I'm sorry.`;
      const result = await service.analyzeTranscript(transcript);

      const jordanScore = result.individualScores.find(s => s.speaker === 'Jordan');
      expect(jordanScore).toBeDefined();

      // Should have both green and yellow cards
      expect(jordanScore!.greenCardCount).toBeGreaterThan(0);
      expect(jordanScore!.yellowCardCount).toBeGreaterThan(0);
    });

    it('should return empty individualScores array for empty transcript', async () => {
      const transcript = '';
      const result = await service.analyzeTranscript(transcript);

      expect(result.individualScores).toEqual([]);
    });
  });
});
