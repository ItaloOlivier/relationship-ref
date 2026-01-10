// API client for fetching shared reports and profiles

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface SharedReport {
  sessionId: string;
  overallScore: number;
  greenCardCount: number;
  yellowCardCount: number;
  redCardCount: number;
  bankChange: number;
  individualScores?: IndividualScore[];
  topicTags: string[];
  cards: SessionCard[];
  whatWentWell?: string;
  tryNextTime?: string;
  repairSuggestion?: string;
  createdAt: string;
  sourceType: string;
}

export interface IndividualScore {
  userId: string;
  speaker: string;
  greenCardCount: number;
  yellowCardCount: number;
  redCardCount: number;
  personalScore: number;
  bankContribution: number;
  horsemenUsed: string[];
  repairAttemptCount: number;
}

export interface SessionCard {
  type: 'GREEN' | 'YELLOW' | 'RED';
  behavior: string;
  quote: string;
  timestamp: string;
  impact: string;
  speaker?: string;
  userId?: string;
}

export interface SharedProfile {
  profileId: string;
  userId: string;
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  attachmentStyle: string;
  attachmentAnxiety: number;
  attachmentAvoidance: number;
  communicationStyle: string;
  emotionalAwareness: number;
  emotionalRegulation: number;
  empathy: number;
  strengthsNarrative?: string;
  challengesNarrative?: string;
  growthNarrative?: string;
  confidence: number;
  sessionsAnalyzed: number;
  lastUpdated: string;
}

export async function fetchSharedReport(token: string): Promise<SharedReport> {
  const response = await fetch(`${API_BASE_URL}/sessions/share/report/${token}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Report not found or sharing has been disabled');
    }
    throw new Error(`Failed to fetch report: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchSharedProfile(token: string): Promise<SharedProfile> {
  const response = await fetch(`${API_BASE_URL}/personality/share/profile/${token}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Profile not found or sharing has been disabled');
    }
    throw new Error(`Failed to fetch profile: ${response.statusText}`);
  }

  return response.json();
}
