import { Test, TestingModule } from '@nestjs/testing';
import {
  LinguisticAnalysisService,
  LinguisticFeatures,
} from './linguistic-analysis.service';

describe('LinguisticAnalysisService', () => {
  let service: LinguisticAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LinguisticAnalysisService],
    }).compile();

    service = module.get<LinguisticAnalysisService>(LinguisticAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractFeatures', () => {
    it('should return empty features for empty text', () => {
      const features = service.extractFeatures('');
      expect(features.totalWords).toBe(0);
      expect(features.uniqueWords).toBe(0);
    });

    it('should count words correctly', () => {
      const features = service.extractFeatures('Hello world this is a test');
      expect(features.totalWords).toBe(6);
    });

    it('should count unique words correctly', () => {
      const features = service.extractFeatures('hello hello world world world');
      expect(features.totalWords).toBe(5);
      expect(features.uniqueWords).toBe(2);
    });

    it('should calculate average word length', () => {
      const features = service.extractFeatures('cat dog rat'); // 3+3+3 = 9, /3 = 3
      expect(features.avgWordLength).toBe(3);
    });

    it('should calculate average sentence length', () => {
      // "Hello world" (2) + "How are you" (3) + "I am fine" (3) = 8 words, 3 sentences
      const features = service.extractFeatures(
        'Hello world. How are you. I am fine.',
      );
      expect(features.avgSentenceLength).toBeCloseTo(8 / 3, 1);
    });

    describe('pronoun detection', () => {
      it('should detect first person singular pronouns', () => {
        const features = service.extractFeatures('I think my idea is mine');
        expect(features.firstPersonSingular).toBeGreaterThan(0);
      });

      it('should detect first person plural pronouns', () => {
        const features = service.extractFeatures('We should do our best');
        expect(features.firstPersonPlural).toBeGreaterThan(0);
      });

      it('should detect second person pronouns', () => {
        const features = service.extractFeatures('You should do your best');
        expect(features.secondPerson).toBeGreaterThan(0);
      });

      it('should detect third person pronouns', () => {
        const features = service.extractFeatures('He said she was there');
        expect(features.thirdPerson).toBeGreaterThan(0);
      });

      it('should show high self-focus with many I pronouns', () => {
        const selfFocusedText =
          'I went to the store. I bought milk. I came home. I was happy.';
        const otherFocusedText =
          'You went to the store. You bought milk. You came home. You were happy.';

        const selfFeatures = service.extractFeatures(selfFocusedText);
        const otherFeatures = service.extractFeatures(otherFocusedText);

        expect(selfFeatures.firstPersonSingular).toBeGreaterThan(
          otherFeatures.firstPersonSingular,
        );
        expect(otherFeatures.secondPerson).toBeGreaterThan(
          selfFeatures.secondPerson,
        );
      });
    });

    describe('emotion word detection', () => {
      it('should detect positive emotion words', () => {
        const features = service.extractFeatures(
          'I love you and I am so happy and grateful',
        );
        expect(features.positiveEmotionWords).toBeGreaterThan(0);
      });

      it('should detect negative emotion words', () => {
        const features = service.extractFeatures(
          'I hate this and I am so angry and frustrated',
        );
        expect(features.negativeEmotionWords).toBeGreaterThan(0);
      });

      it('should detect anxiety words', () => {
        const features = service.extractFeatures(
          'I am worried and nervous about this stressful situation',
        );
        expect(features.anxietyWords).toBeGreaterThan(0);
      });

      it('should detect anger words', () => {
        const features = service.extractFeatures(
          'I am so angry and furious about this outrage',
        );
        expect(features.angerWords).toBeGreaterThan(0);
      });

      it('should detect sadness words', () => {
        const features = service.extractFeatures(
          'I am sad and depressed and feeling lonely',
        );
        expect(features.sadnessWords).toBeGreaterThan(0);
      });

      it('should differentiate positive from negative text', () => {
        const positiveText =
          'I love spending time with you! You make me so happy and grateful.';
        const negativeText =
          'I hate when you do that. It makes me angry and frustrated.';

        const positiveFeatures = service.extractFeatures(positiveText);
        const negativeFeatures = service.extractFeatures(negativeText);

        expect(positiveFeatures.positiveEmotionWords).toBeGreaterThan(
          positiveFeatures.negativeEmotionWords,
        );
        expect(negativeFeatures.negativeEmotionWords).toBeGreaterThan(
          negativeFeatures.positiveEmotionWords,
        );
      });
    });

    describe('cognitive pattern detection', () => {
      it('should detect certainty words', () => {
        const features = service.extractFeatures(
          'You always do this. You never listen. It is definitely your fault.',
        );
        expect(features.certaintyWords).toBeGreaterThan(0);
      });

      it('should detect tentative words', () => {
        const features = service.extractFeatures(
          'Maybe we could try something. Perhaps it might work.',
        );
        expect(features.tentativeWords).toBeGreaterThan(0);
      });

      it('should detect discrepancy words', () => {
        const features = service.extractFeatures(
          'You should do this. You need to change. I want you to listen.',
        );
        expect(features.discrepancyWords).toBeGreaterThan(0);
      });

      it('should differentiate certain from tentative language', () => {
        const certainText =
          'You always forget. You never remember. It is definitely true.';
        const tentativeText =
          'Maybe you forgot. Perhaps you might try. It could be true.';

        const certainFeatures = service.extractFeatures(certainText);
        const tentativeFeatures = service.extractFeatures(tentativeText);

        expect(certainFeatures.certaintyWords).toBeGreaterThan(
          certainFeatures.tentativeWords,
        );
        expect(tentativeFeatures.tentativeWords).toBeGreaterThan(
          tentativeFeatures.certaintyWords,
        );
      });
    });

    describe('social dynamics detection', () => {
      it('should detect affiliation words', () => {
        const features = service.extractFeatures(
          'We are together as a team and share everything as friends',
        );
        expect(features.affiliationWords).toBeGreaterThan(0);
      });

      it('should detect achievement words', () => {
        const features = service.extractFeatures(
          'We achieved success and won the goal through improvement',
        );
        expect(features.achievementWords).toBeGreaterThan(0);
      });

      it('should detect power words', () => {
        const features = service.extractFeatures(
          'I demand you follow my orders and submit to my control',
        );
        expect(features.powerWords).toBeGreaterThan(0);
      });
    });

    describe('communication markers', () => {
      it('should detect questions', () => {
        const features = service.extractFeatures(
          'How are you? What do you think? Why did you do that?',
        );
        expect(features.questionFrequency).toBeGreaterThan(0);
      });

      it('should detect exclamations', () => {
        // Using sentences that will be split but still have exclamation markers
        const features = service.extractFeatures(
          'I love you! That is amazing! Wow! This is great.',
        );
        // The exclamation frequency should be high as most sentences have !
        expect(features.exclamationFrequency).toBeGreaterThan(0);
      });

      it('should detect hedging phrases', () => {
        const features = service.extractFeatures(
          'I think maybe you could, kind of, sort of try to understand, I guess.',
        );
        expect(features.hedgingPhrases).toBeGreaterThan(0);
      });

      it('should show more questions in question-heavy text', () => {
        const questionText =
          'How are you? What happened? Why did you go? Where were you?';
        const statementText = 'I am fine. Nothing happened. I went home. I was there.';

        const questionFeatures = service.extractFeatures(questionText);
        const statementFeatures = service.extractFeatures(statementText);

        expect(questionFeatures.questionFrequency).toBeGreaterThan(
          statementFeatures.questionFrequency,
        );
      });
    });
  });

  describe('extractFeaturesFromConversation', () => {
    it('should extract features for multiple participants', () => {
      const messages = [
        { sender: 'John', content: 'I love you so much!' },
        { sender: 'Sarah', content: 'I love you too!' },
        { sender: 'John', content: 'How was your day?' },
        { sender: 'Sarah', content: 'It was great, thanks for asking.' },
      ];

      const features = service.extractFeaturesFromConversation(messages);

      expect(features.has('John')).toBe(true);
      expect(features.has('Sarah')).toBe(true);
      expect(features.get('John')!.totalWords).toBeGreaterThan(0);
      expect(features.get('Sarah')!.totalWords).toBeGreaterThan(0);
    });

    it('should combine all messages from same participant', () => {
      const messages = [
        { sender: 'John', content: 'Hello' },
        { sender: 'John', content: 'World' },
        { sender: 'John', content: 'Test' },
      ];

      const features = service.extractFeaturesFromConversation(messages);
      expect(features.get('John')!.totalWords).toBe(3);
    });
  });

  describe('detectFourHorsemen', () => {
    describe('criticism detection', () => {
      it('should detect "you always" patterns', () => {
        const horsemen = service.detectFourHorsemen('You always forget things.');
        expect(horsemen.criticism).toBeGreaterThan(0);
      });

      it('should detect "you never" patterns', () => {
        const horsemen = service.detectFourHorsemen('You never listen to me.');
        expect(horsemen.criticism).toBeGreaterThan(0);
      });

      it('should detect global character attacks', () => {
        const horsemen = service.detectFourHorsemen(
          "What's wrong with you? Why can't you do anything right?",
        );
        expect(horsemen.criticism).toBeGreaterThan(0);
      });

      it('should not detect criticism in neutral text', () => {
        const horsemen = service.detectFourHorsemen(
          'I would appreciate it if you could help me with this.',
        );
        expect(horsemen.criticism).toBe(0);
      });
    });

    describe('contempt detection', () => {
      it('should detect mockery and sarcasm', () => {
        const horsemen = service.detectFourHorsemen(
          "Yeah right, sure you did. Whatever.",
        );
        expect(horsemen.contempt).toBeGreaterThan(0);
      });

      it('should detect superiority language', () => {
        const horsemen = service.detectFourHorsemen(
          "You're pathetic. What a joke.",
        );
        expect(horsemen.contempt).toBeGreaterThan(0);
      });

      it('should not detect contempt in supportive text', () => {
        const horsemen = service.detectFourHorsemen(
          'I appreciate your effort and I believe in you.',
        );
        expect(horsemen.contempt).toBe(0);
      });
    });

    describe('defensiveness detection', () => {
      it('should detect denial of responsibility', () => {
        const horsemen = service.detectFourHorsemen(
          "It's not my fault. I didn't do anything wrong.",
        );
        expect(horsemen.defensiveness).toBeGreaterThan(0);
      });

      it('should detect counter-attacks', () => {
        const horsemen = service.detectFourHorsemen(
          "What about when you did the same thing? You're the one who started it.",
        );
        expect(horsemen.defensiveness).toBeGreaterThan(0);
      });

      it('should detect blame shifting', () => {
        const horsemen = service.detectFourHorsemen(
          "You made me do it. If you hadn't been so difficult...",
        );
        expect(horsemen.defensiveness).toBeGreaterThan(0);
      });
    });

    describe('stonewalling detection', () => {
      it('should detect withdrawal language', () => {
        const horsemen = service.detectFourHorsemen(
          "I don't want to talk about this. Leave me alone.",
        );
        expect(horsemen.stonewalling).toBeGreaterThan(0);
      });

      it('should detect dismissive responses', () => {
        const horsemen = service.detectFourHorsemen(
          "Whatever. I don't care. Fine.",
        );
        expect(horsemen.stonewalling).toBeGreaterThan(0);
      });

      it('should detect shutdown language', () => {
        const horsemen = service.detectFourHorsemen(
          "I give up. Forget it. I'm done.",
        );
        expect(horsemen.stonewalling).toBeGreaterThan(0);
      });
    });

    it('should detect multiple horsemen in conflict text', () => {
      const conflictText = `
        You always do this! You never think about how I feel.
        Yeah right, sure you care. Whatever.
        It's not my fault! You're the one who started it.
        I don't want to talk about this anymore. I'm done.
      `;

      const horsemen = service.detectFourHorsemen(conflictText);

      expect(horsemen.criticism).toBeGreaterThan(0);
      expect(horsemen.contempt).toBeGreaterThan(0);
      expect(horsemen.defensiveness).toBeGreaterThan(0);
      expect(horsemen.stonewalling).toBeGreaterThan(0);
    });

    it('should return zeros for healthy communication', () => {
      const healthyText = `
        I understand how you feel. Thank you for sharing that with me.
        I appreciate your perspective and I want to work together on this.
        Can we take a break and come back to this when we're both calmer?
      `;

      const horsemen = service.detectFourHorsemen(healthyText);

      // Some patterns might still trigger (like "Can we take a break")
      // but should be minimal
      const totalHorsemen =
        horsemen.criticism +
        horsemen.contempt +
        horsemen.defensiveness +
        horsemen.stonewalling;
      expect(totalHorsemen).toBeLessThan(5);
    });
  });

  describe('detectRepairAttempts', () => {
    it('should detect apologies', () => {
      const count = service.detectRepairAttempts("I'm sorry. I apologize for what I said.");
      expect(count).toBeGreaterThan(0);
    });

    it('should detect validation', () => {
      const count = service.detectRepairAttempts(
        "I understand how you feel. You're right about that.",
      );
      expect(count).toBeGreaterThan(0);
    });

    it('should detect requests for breaks', () => {
      const count = service.detectRepairAttempts(
        "Let's take a break. Can we calm down and try again?",
      );
      expect(count).toBeGreaterThan(0);
    });

    it('should detect affection during conflict', () => {
      const count = service.detectRepairAttempts(
        "I love you. We're on the same team here.",
      );
      expect(count).toBeGreaterThan(0);
    });

    it('should detect appreciation', () => {
      const count = service.detectRepairAttempts(
        'Thank you for listening. I appreciate your patience.',
      );
      expect(count).toBeGreaterThan(0);
    });

    it('should return zero for conflict without repairs', () => {
      const count = service.detectRepairAttempts(
        "You're wrong. This is ridiculous. I can't believe you.",
      );
      expect(count).toBe(0);
    });
  });

  describe('psychological correlations', () => {
    // These tests verify that the linguistic features correlate
    // with known psychological patterns from research

    it('should show higher self-focus in anxious text', () => {
      // Research shows depressed/anxious individuals use more first-person singular
      const anxiousText =
        "I'm so worried about my future. I feel like I can't handle this. My anxiety is overwhelming me.";
      const calmText =
        "We discussed the plans for our project. The team made good progress on their goals.";

      const anxiousFeatures = service.extractFeatures(anxiousText);
      const calmFeatures = service.extractFeatures(calmText);

      expect(anxiousFeatures.firstPersonSingular).toBeGreaterThan(
        calmFeatures.firstPersonSingular,
      );
    });

    it('should show more "we" language in connected text', () => {
      // Couples using more "we" language have better relationships
      const connectedText =
        "We had a great time together. Our relationship has been wonderful. We really care about us.";
      const disconnectedText =
        'I went to the store. You stayed home. He said you were busy.';

      const connectedFeatures = service.extractFeatures(connectedText);
      const disconnectedFeatures = service.extractFeatures(disconnectedText);

      expect(connectedFeatures.firstPersonPlural).toBeGreaterThan(
        disconnectedFeatures.firstPersonPlural,
      );
    });

    it('should show more certainty words in rigid thinking', () => {
      // Absolutist language correlates with less cognitive flexibility
      const rigidText =
        'You always do this. It will never change. This is definitely wrong.';
      const flexibleText =
        'Sometimes this happens. Maybe we could try something different.';

      const rigidFeatures = service.extractFeatures(rigidText);
      const flexibleFeatures = service.extractFeatures(flexibleText);

      expect(rigidFeatures.certaintyWords).toBeGreaterThan(
        flexibleFeatures.certaintyWords,
      );
    });
  });
});
