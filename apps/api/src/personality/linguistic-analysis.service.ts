import { Injectable } from '@nestjs/common';

/**
 * Linguistic features extracted from text, based on LIWC (Linguistic Inquiry and Word Count)
 * research by James Pennebaker.
 *
 * These features have been validated to correlate with psychological traits:
 * - Pronoun usage correlates with self-focus, social connection, and depression
 * - Emotion words correlate with emotional state and regulation
 * - Cognitive words correlate with analytical thinking and certainty
 */
export interface LinguisticFeatures {
  // Basic counts
  totalWords: number;
  uniqueWords: number;
  avgWordLength: number;
  avgSentenceLength: number;

  // Pronoun usage (as percentage of total words)
  firstPersonSingular: number; // I, me, my, mine, myself
  firstPersonPlural: number; // we, us, our, ours, ourselves
  secondPerson: number; // you, your, yours, yourself
  thirdPerson: number; // he, she, they, him, her, them, his, hers, their

  // Emotional language (as percentage of total words)
  positiveEmotionWords: number;
  negativeEmotionWords: number;
  anxietyWords: number;
  angerWords: number;
  sadnessWords: number;

  // Cognitive patterns (as percentage of total words)
  certaintyWords: number; // always, never, definitely, absolutely
  tentativeWords: number; // maybe, perhaps, might, possibly
  discrepancyWords: number; // should, would, could, ought

  // Social dynamics (as percentage of total words)
  affiliationWords: number; // friend, together, share, team
  achievementWords: number; // win, success, achieve, accomplish
  powerWords: number; // control, force, superior, dominate

  // Communication markers
  questionFrequency: number; // percentage of sentences that are questions
  exclamationFrequency: number; // percentage of sentences with exclamations
  hedgingPhrases: number; // percentage containing hedging phrases
}

/**
 * Word dictionaries based on LIWC categories and research.
 * These are simplified versions - production would use full LIWC dictionary.
 */
const WORD_DICTIONARIES = {
  firstPersonSingular: [
    'i',
    "i'm",
    'im',
    "i've",
    'ive',
    "i'll",
    'ill',
    "i'd",
    'id',
    'me',
    'my',
    'mine',
    'myself',
  ],
  firstPersonPlural: [
    'we',
    "we're",
    'were',
    "we've",
    'weve',
    "we'll",
    'well',
    "we'd",
    'wed',
    'us',
    'our',
    'ours',
    'ourselves',
  ],
  secondPerson: [
    'you',
    "you're",
    'youre',
    "you've",
    'youve',
    "you'll",
    'youll',
    "you'd",
    'youd',
    'your',
    'yours',
    'yourself',
    'yourselves',
  ],
  thirdPerson: [
    'he',
    "he's",
    'hes',
    "he'll",
    'hell',
    "he'd",
    'hed',
    'him',
    'his',
    'himself',
    'she',
    "she's",
    'shes',
    "she'll",
    'shell',
    "she'd",
    'shed',
    'her',
    'hers',
    'herself',
    'they',
    "they're",
    'theyre',
    "they've",
    'theyve',
    "they'll",
    'theyll',
    "they'd",
    'theyd',
    'them',
    'their',
    'theirs',
    'themselves',
    'it',
    "it's",
    'its',
    "it'll",
    'itll',
    "it'd",
    'itd',
    'itself',
  ],

  positiveEmotion: [
    'love',
    'loved',
    'loving',
    'lovely',
    'happy',
    'happiness',
    'happily',
    'glad',
    'joy',
    'joyful',
    'excited',
    'exciting',
    'excitement',
    'good',
    'great',
    'wonderful',
    'amazing',
    'awesome',
    'fantastic',
    'beautiful',
    'nice',
    'kind',
    'kindness',
    'sweet',
    'sweetly',
    'appreciate',
    'appreciated',
    'appreciation',
    'grateful',
    'thankful',
    'thanks',
    'thank',
    'blessed',
    'proud',
    'pride',
    'hope',
    'hopeful',
    'hoping',
    'care',
    'caring',
    'cared',
    'support',
    'supportive',
    'supported',
    'understand',
    'understanding',
    'understood',
    'trust',
    'trusting',
    'trusted',
    'respect',
    'respected',
    'respectful',
    'comfortable',
    'comfort',
    'safe',
    'safety',
    'secure',
    'security',
    'peaceful',
    'peace',
    'calm',
    'relaxed',
    'content',
    'satisfied',
    'fulfilling',
    'fulfilled',
    'perfect',
    'incredible',
    'fun',
    'funny',
    'laugh',
    'laughing',
    'smile',
    'smiling',
    'enjoyed',
    'enjoy',
    'enjoyable',
  ],

  negativeEmotion: [
    'hate',
    'hated',
    'hating',
    'hateful',
    'angry',
    'anger',
    'angrily',
    'mad',
    'furious',
    'frustrated',
    'frustrating',
    'frustration',
    'annoyed',
    'annoying',
    'annoyance',
    'irritated',
    'irritating',
    'upset',
    'upsetting',
    'sad',
    'sadly',
    'sadness',
    'depressed',
    'depressing',
    'depression',
    'hurt',
    'hurting',
    'hurtful',
    'pain',
    'painful',
    'suffering',
    'suffer',
    'disappointed',
    'disappointing',
    'disappointment',
    'unhappy',
    'unhappiness',
    'miserable',
    'terrible',
    'awful',
    'horrible',
    'bad',
    'worst',
    'worse',
    'wrong',
    'wronged',
    'unfair',
    'unjust',
    'betrayed',
    'betrayal',
    'lonely',
    'loneliness',
    'alone',
    'abandoned',
    'abandonment',
    'rejected',
    'rejection',
    'ignored',
    'ignoring',
    'neglected',
    'neglect',
    'dismissed',
    'dismissive',
    'criticized',
    'criticism',
    'blame',
    'blamed',
    'blaming',
    'fault',
    'guilty',
    'guilt',
    'shame',
    'ashamed',
    'embarrassed',
    'embarrassing',
    'stupid',
    'dumb',
    'idiot',
    'pathetic',
    'useless',
    'worthless',
    'hopeless',
  ],

  anxiety: [
    'worried',
    'worrying',
    'worry',
    'anxious',
    'anxiety',
    'nervous',
    'nervously',
    'nervousness',
    'afraid',
    'fear',
    'fearful',
    'fearing',
    'scared',
    'scary',
    'frightened',
    'frightening',
    'terrified',
    'terrifying',
    'panicked',
    'panic',
    'panicking',
    'stressed',
    'stress',
    'stressful',
    'overwhelmed',
    'overwhelming',
    'insecure',
    'insecurity',
    'uncertain',
    'uncertainty',
    'doubt',
    'doubted',
    'doubtful',
    'doubting',
    'concerned',
    'concerning',
    'concern',
    'uneasy',
    'tense',
    'tension',
    'dread',
    'dreading',
  ],

  anger: [
    'angry',
    'anger',
    'angrily',
    'mad',
    'furious',
    'fury',
    'rage',
    'raging',
    'enraged',
    'livid',
    'outraged',
    'outrage',
    'hate',
    'hated',
    'hating',
    'hateful',
    'resent',
    'resentful',
    'resentment',
    'bitter',
    'bitterness',
    'hostile',
    'hostility',
    'aggressive',
    'aggression',
    'attack',
    'attacking',
    'attacked',
    'fight',
    'fighting',
    'fought',
    'yell',
    'yelling',
    'yelled',
    'scream',
    'screaming',
    'screamed',
    'shout',
    'shouting',
    'shouted',
  ],

  sadness: [
    'sad',
    'sadly',
    'sadness',
    'unhappy',
    'unhappiness',
    'depressed',
    'depressing',
    'depression',
    'miserable',
    'misery',
    'despair',
    'despairing',
    'hopeless',
    'hopelessness',
    'helpless',
    'helplessness',
    'lonely',
    'loneliness',
    'alone',
    'isolated',
    'isolation',
    'cry',
    'crying',
    'cried',
    'tears',
    'tearful',
    'weep',
    'weeping',
    'wept',
    'sob',
    'sobbing',
    'sobbed',
    'grief',
    'grieving',
    'mourning',
    'mourn',
    'loss',
    'lost',
    'losing',
    'miss',
    'missing',
    'missed',
    'heartbroken',
    'heartbreak',
    'devastated',
    'devastating',
  ],

  certainty: [
    'always',
    'never',
    'definitely',
    'certainly',
    'absolutely',
    'completely',
    'totally',
    'entirely',
    'fully',
    'surely',
    'undoubtedly',
    'without doubt',
    'for sure',
    'guaranteed',
    'obvious',
    'obviously',
    'clearly',
    'certain',
    'positive',
    'confident',
    'know',
    'knew',
    'known',
    'sure',
    'every time',
    'all the time',
    'constantly',
    'forever',
    'every single',
  ],

  tentative: [
    'maybe',
    'perhaps',
    'possibly',
    'might',
    'could',
    'may',
    'probably',
    'likely',
    'unlikely',
    'possibly',
    'uncertain',
    'unsure',
    'guess',
    'guessing',
    'suppose',
    'supposed',
    'wonder',
    'wondering',
    'wondered',
    'seem',
    'seems',
    'seemed',
    'appear',
    'appears',
    'appeared',
    'think',
    'thought',
    'feel like',
    'kind of',
    'sort of',
    'somehow',
    'somewhat',
  ],

  discrepancy: [
    'should',
    "shouldn't",
    'shouldnt',
    'would',
    "wouldn't",
    'wouldnt',
    'could',
    "couldn't",
    'couldnt',
    'ought',
    'need',
    'needed',
    'needs',
    'want',
    'wanted',
    'wants',
    'wish',
    'wished',
    'wishes',
    'hope',
    'hoped',
    'hoping',
    'expect',
    'expected',
    'expecting',
    'desire',
    'desired',
    'desiring',
    'must',
    'have to',
    'got to',
    'supposed to',
  ],

  affiliation: [
    'friend',
    'friends',
    'friendship',
    'friendly',
    'together',
    'togetherness',
    'share',
    'shared',
    'sharing',
    'team',
    'teammate',
    'partner',
    'partners',
    'partnership',
    'couple',
    'family',
    'families',
    'community',
    'group',
    'belong',
    'belonging',
    'belonged',
    'connect',
    'connected',
    'connection',
    'bond',
    'bonded',
    'bonding',
    'close',
    'closeness',
    'intimate',
    'intimacy',
    'relationship',
    'relationships',
    'love',
    'loved',
    'loving',
    'care',
    'caring',
    'cared',
    'help',
    'helped',
    'helping',
    'support',
    'supported',
    'supporting',
    'join',
    'joined',
    'joining',
    'unite',
    'united',
    'unity',
  ],

  achievement: [
    'win',
    'won',
    'winning',
    'winner',
    'success',
    'successful',
    'successfully',
    'succeed',
    'succeeded',
    'achieve',
    'achieved',
    'achieving',
    'achievement',
    'accomplish',
    'accomplished',
    'accomplishment',
    'goal',
    'goals',
    'best',
    'better',
    'improve',
    'improved',
    'improving',
    'improvement',
    'progress',
    'progressed',
    'progressing',
    'advance',
    'advanced',
    'advancing',
    'excel',
    'excelled',
    'excellent',
    'outstanding',
    'exceptional',
    'master',
    'mastered',
    'mastery',
    'perfect',
    'perfected',
    'complete',
    'completed',
    'completion',
    'finish',
    'finished',
    'finishing',
    'earn',
    'earned',
    'earning',
    'gain',
    'gained',
    'gaining',
  ],

  power: [
    'control',
    'controlled',
    'controlling',
    'force',
    'forced',
    'forcing',
    'power',
    'powerful',
    'powerless',
    'dominate',
    'dominated',
    'dominating',
    'dominant',
    'dominance',
    'superior',
    'superiority',
    'authority',
    'authoritative',
    'command',
    'commanded',
    'commanding',
    'order',
    'ordered',
    'ordering',
    'demand',
    'demanded',
    'demanding',
    'insist',
    'insisted',
    'insisting',
    'rule',
    'ruled',
    'ruling',
    'lead',
    'led',
    'leading',
    'leader',
    'boss',
    'bossed',
    'bossing',
    'manage',
    'managed',
    'managing',
    'decide',
    'decided',
    'deciding',
    'decision',
    'influence',
    'influenced',
    'influencing',
  ],
};

/**
 * Common hedging phrases that indicate uncertainty or softening
 */
const HEDGING_PHRASES = [
  'i think',
  'i feel like',
  'i believe',
  'i guess',
  'sort of',
  'kind of',
  'in my opinion',
  'it seems like',
  'maybe',
  'perhaps',
  'probably',
  'not sure',
  "i'm not sure",
  'i might be wrong',
  'correct me if',
  'if i remember',
  'as far as i know',
  'to be honest',
  'honestly',
  'actually',
  'basically',
  'essentially',
  "i don't know",
  'i dunno',
];

@Injectable()
export class LinguisticAnalysisService {
  /**
   * Extract linguistic features from text for a single participant
   */
  extractFeatures(text: string): LinguisticFeatures {
    const normalizedText = this.normalizeText(text);
    const words = this.tokenize(normalizedText);
    const sentences = this.splitSentences(text);
    const totalWords = words.length;

    if (totalWords === 0) {
      return this.getEmptyFeatures();
    }

    const uniqueWords = new Set(words).size;
    const avgWordLength =
      words.reduce((sum, word) => sum + word.length, 0) / totalWords;
    const avgSentenceLength = totalWords / Math.max(sentences.length, 1);

    return {
      totalWords,
      uniqueWords,
      avgWordLength,
      avgSentenceLength,

      // Pronouns
      firstPersonSingular: this.calculatePercentage(
        words,
        WORD_DICTIONARIES.firstPersonSingular,
      ),
      firstPersonPlural: this.calculatePercentage(
        words,
        WORD_DICTIONARIES.firstPersonPlural,
      ),
      secondPerson: this.calculatePercentage(
        words,
        WORD_DICTIONARIES.secondPerson,
      ),
      thirdPerson: this.calculatePercentage(
        words,
        WORD_DICTIONARIES.thirdPerson,
      ),

      // Emotions
      positiveEmotionWords: this.calculatePercentage(
        words,
        WORD_DICTIONARIES.positiveEmotion,
      ),
      negativeEmotionWords: this.calculatePercentage(
        words,
        WORD_DICTIONARIES.negativeEmotion,
      ),
      anxietyWords: this.calculatePercentage(words, WORD_DICTIONARIES.anxiety),
      angerWords: this.calculatePercentage(words, WORD_DICTIONARIES.anger),
      sadnessWords: this.calculatePercentage(words, WORD_DICTIONARIES.sadness),

      // Cognitive
      certaintyWords: this.calculatePercentage(
        words,
        WORD_DICTIONARIES.certainty,
      ),
      tentativeWords: this.calculatePercentage(
        words,
        WORD_DICTIONARIES.tentative,
      ),
      discrepancyWords: this.calculatePercentage(
        words,
        WORD_DICTIONARIES.discrepancy,
      ),

      // Social
      affiliationWords: this.calculatePercentage(
        words,
        WORD_DICTIONARIES.affiliation,
      ),
      achievementWords: this.calculatePercentage(
        words,
        WORD_DICTIONARIES.achievement,
      ),
      powerWords: this.calculatePercentage(words, WORD_DICTIONARIES.power),

      // Communication markers
      questionFrequency: this.calculateQuestionFrequency(sentences),
      exclamationFrequency: this.calculateExclamationFrequency(text, sentences),
      hedgingPhrases: this.calculateHedgingFrequency(normalizedText, sentences),
    };
  }

  /**
   * Extract features from a WhatsApp conversation for each participant
   */
  extractFeaturesFromConversation(
    messages: Array<{ sender: string; content: string }>,
  ): Map<string, LinguisticFeatures> {
    const participantTexts = new Map<string, string[]>();

    // Group messages by participant
    for (const message of messages) {
      const texts = participantTexts.get(message.sender) || [];
      texts.push(message.content);
      participantTexts.set(message.sender, texts);
    }

    // Extract features for each participant
    const features = new Map<string, LinguisticFeatures>();
    for (const [participant, texts] of participantTexts) {
      const combinedText = texts.join(' ');
      features.set(participant, this.extractFeatures(combinedText));
    }

    return features;
  }

  /**
   * Normalize text: lowercase, remove special characters except punctuation
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s'.,!?-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Simple word tokenizer
   */
  private tokenize(text: string): string[] {
    return text
      .split(/[\s.,!?]+/)
      .filter((word) => word.length > 0)
      .map((word) => word.toLowerCase().replace(/[^a-z']/g, ''));
  }

  /**
   * Split text into sentences
   */
  private splitSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  /**
   * Calculate percentage of words matching a dictionary
   */
  private calculatePercentage(words: string[], dictionary: string[]): number {
    if (words.length === 0) return 0;
    const dictionarySet = new Set(dictionary);
    const matches = words.filter((word) => dictionarySet.has(word)).length;
    return (matches / words.length) * 100;
  }

  /**
   * Calculate frequency of questions
   */
  private calculateQuestionFrequency(sentences: string[]): number {
    if (sentences.length === 0) return 0;
    const questions = sentences.filter(
      (s) =>
        s.includes('?') ||
        /^(who|what|where|when|why|how|is|are|do|does|did|can|could|would|should|will)\b/i.test(
          s,
        ),
    ).length;
    return (questions / sentences.length) * 100;
  }

  /**
   * Calculate frequency of exclamations
   */
  private calculateExclamationFrequency(
    originalText: string,
    sentences: string[],
  ): number {
    if (sentences.length === 0) return 0;
    // Count exclamation marks in original text
    const exclamationCount = (originalText.match(/!/g) || []).length;
    return (exclamationCount / sentences.length) * 100;
  }

  /**
   * Calculate frequency of hedging phrases
   */
  private calculateHedgingFrequency(
    text: string,
    sentences: string[],
  ): number {
    if (sentences.length === 0) return 0;
    let hedgingCount = 0;
    const lowerText = text.toLowerCase();
    for (const phrase of HEDGING_PHRASES) {
      const regex = new RegExp(phrase, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        hedgingCount += matches.length;
      }
    }
    return (hedgingCount / sentences.length) * 100;
  }

  /**
   * Return empty features object
   */
  private getEmptyFeatures(): LinguisticFeatures {
    return {
      totalWords: 0,
      uniqueWords: 0,
      avgWordLength: 0,
      avgSentenceLength: 0,
      firstPersonSingular: 0,
      firstPersonPlural: 0,
      secondPerson: 0,
      thirdPerson: 0,
      positiveEmotionWords: 0,
      negativeEmotionWords: 0,
      anxietyWords: 0,
      angerWords: 0,
      sadnessWords: 0,
      certaintyWords: 0,
      tentativeWords: 0,
      discrepancyWords: 0,
      affiliationWords: 0,
      achievementWords: 0,
      powerWords: 0,
      questionFrequency: 0,
      exclamationFrequency: 0,
      hedgingPhrases: 0,
    };
  }

  /**
   * Analyze text for Gottman's Four Horsemen patterns
   * Returns counts of each pattern detected
   */
  detectFourHorsemen(text: string): {
    criticism: number;
    contempt: number;
    defensiveness: number;
    stonewalling: number;
  } {
    const lowerText = text.toLowerCase();

    return {
      criticism: this.countCriticismPatterns(lowerText),
      contempt: this.countContemptPatterns(lowerText),
      defensiveness: this.countDefensivenessPatterns(lowerText),
      stonewalling: this.countStonewallingPatterns(lowerText),
    };
  }

  private countCriticismPatterns(text: string): number {
    // Criticism: "You always...", "You never...", global character attacks
    const patterns = [
      /you always/gi,
      /you never/gi,
      /you're so /gi,
      /you are so /gi,
      /what's wrong with you/gi,
      /what is wrong with you/gi,
      /why can't you/gi,
      /why do you always/gi,
      /why don't you ever/gi,
      /you should have/gi,
      /you shouldn't have/gi,
      /typical of you/gi,
      /every time you/gi,
      /you're the one who/gi,
      /your problem is/gi,
    ];

    return patterns.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  private countContemptPatterns(text: string): number {
    // Contempt: mockery, sarcasm, eye-rolling language, superiority
    const patterns = [
      /whatever/gi,
      /yeah right/gi,
      /sure you (did|do|will|are)/gi,
      /oh please/gi,
      /give me a break/gi,
      /you're (pathetic|ridiculous|stupid|an idiot|incompetent)/gi,
      /are you serious/gi,
      /you call that/gi,
      /that's (ridiculous|stupid|pathetic)/gi,
      /what a joke/gi,
      /you must be joking/gi,
      /of course you (would|did|do)/gi,
      /as usual/gi,
      /here we go again/gi,
    ];

    return patterns.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  private countDefensivenessPatterns(text: string): number {
    // Defensiveness: excuses, counter-attacks, denying responsibility
    const patterns = [
      /it's not my fault/gi,
      /that's not true/gi,
      /i didn't do anything/gi,
      /i never said that/gi,
      /you're the one who/gi,
      /what about (when you|that time)/gi,
      /but you/gi,
      /yes but/gi,
      /i was just/gi,
      /i only/gi,
      /i had no choice/gi,
      /you made me/gi,
      /if you hadn't/gi,
      /it's because you/gi,
      /well you/gi,
    ];

    return patterns.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  private countStonewallingPatterns(text: string): number {
    // Stonewalling: withdrawal, minimal engagement, shutting down
    const patterns = [
      /i don't want to talk/gi,
      /leave me alone/gi,
      /i'm done/gi,
      /whatever/gi,
      /i don't care/gi,
      /fine/gi,
      /ok$/gim, // just "ok" as a dismissive response
      /^ok$/gim,
      /nothing/gi,
      /i give up/gi,
      /forget it/gi,
      /never mind/gi,
      /i'm out/gi,
      /\.\.\./g, // ellipsis as trailing off
    ];

    return patterns.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  /**
   * Detect repair attempts in text
   */
  detectRepairAttempts(text: string): number {
    const lowerText = text.toLowerCase();

    const repairPatterns = [
      /i'm sorry/gi,
      /i apologize/gi,
      /my bad/gi,
      /let me try again/gi,
      /can we start over/gi,
      /i didn't mean/gi,
      /i understand (that|how|why|your)/gi,
      /you're right/gi,
      /that's fair/gi,
      /i hear you/gi,
      /let's (take a break|calm down|step back)/gi,
      /i love you/gi,
      /we're (on the same team|in this together)/gi,
      /how can i (help|make it better|fix this)/gi,
      /what do you need/gi,
      /thank you for/gi,
      /i appreciate/gi,
      /please/gi,
      /let's (figure this out|work on this)/gi,
      /i want to understand/gi,
    ];

    return repairPatterns.reduce((count, pattern) => {
      const matches = lowerText.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }
}
