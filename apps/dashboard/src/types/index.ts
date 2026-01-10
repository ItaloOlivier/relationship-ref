// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Sessions
export type SessionSource = 'AUDIO' | 'WHATSAPP_CHAT';
export type SessionStatus = 'PENDING' | 'TRANSCRIBING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';

export interface Session {
  id: string;
  initiatorId: string;
  relationshipId?: string;
  source: SessionSource;
  status: SessionStatus;
  audioUrl?: string;
  transcript?: string;
  createdAt: string;
  updatedAt: string;
  analysisResult?: AnalysisResult;
}

// Analysis
export type CardType = 'GREEN' | 'YELLOW' | 'RED';

export interface Card {
  type: CardType;
  reason: string;
  quote?: string;
  category: string;
  speaker?: string;
  userId?: string;
}

export interface HorsemanDetection {
  type: 'CRITICISM' | 'CONTEMPT' | 'DEFENSIVENESS' | 'STONEWALLING';
  quote: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RepairAttempt {
  quote: string;
  category: string;
}

export interface IndividualScore {
  userId?: string;
  speaker: string;
  greenCardCount: number;
  yellowCardCount: number;
  redCardCount: number;
  personalScore: number;
  bankContribution: number;
  horsemenUsed: string[];
  repairAttemptCount: number;
}

export interface AnalysisResult {
  id: string;
  sessionId: string;
  overallScore: number;
  bankChange: number;
  cards: Card[];
  horsemenDetected: HorsemanDetection[];
  repairAttempts: RepairAttempt[];
  individualScores?: IndividualScore[];
  feedback: string;
  coachingTips: string[];
  highlights: string[];
  createdAt: string;
}

// Gamification
export interface GamificationStats {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  averageScore: number;
  totalGreenCards: number;
  totalYellowCards: number;
  totalRedCards: number;
  totalBankBalance: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: string;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  completedAt?: string;
}

// Relationships
export type RelationshipType = 'ROMANTIC' | 'FRIENDSHIP' | 'FAMILY' | 'BUSINESS' | 'PROFESSIONAL';
export type RelationshipStatus = 'ACTIVE' | 'PAUSED' | 'ENDED_MUTUAL' | 'ENDED_UNILATERAL' | 'ARCHIVED';

export interface Relationship {
  id: string;
  name: string;
  type: RelationshipType;
  status: RelationshipStatus;
  inviteCode?: string;
  sessionCount?: number;
  healthScore?: number;
  createdAt: string;
  members?: RelationshipMember[];
}

export interface RelationshipMember {
  id: string;
  relationshipId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: User;
}

// Personality
export interface PersonalityProfile {
  id: string;
  userId: string;
  bigFive?: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  attachmentStyle?: string;
  communicationStyle?: string;
  emotionalIntelligence?: {
    awareness: number;
    empathy: number;
    regulation: number;
    overall: number;
  };
  narrative?: string;
  confidence: number;
  sessionCount: number;
  updatedAt: string;
}

// Insights
export type PatternType = 'TOPIC_TRIGGER' | 'TIME_PATTERN' | 'BEHAVIOR_TREND' | 'HORSEMAN_TREND' | 'POSITIVE_PATTERN';

export interface Pattern {
  id: string;
  type: PatternType;
  title: string;
  description: string;
  impact: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'POSITIVE';
  suggestedAction?: string;
  confidence: number;
  frequency?: number;
  detectedAt: string;
  acknowledged: boolean;
  dismissed?: boolean;
}
