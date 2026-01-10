import type {
  User,
  AuthResponse,
  Session,
  AnalysisResult,
  GamificationStats,
  Quest,
  Relationship,
  PersonalityProfile,
  Pattern,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on init (client-side only)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - clear token and redirect to login
      if (response.status === 401) {
        this.clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new ApiError(401, 'Unauthorized');
      }

      // Parse response body
      const data = await response.json();

      // Handle non-200 responses
      if (!response.ok) {
        throw new ApiError(
          response.status,
          data.message || 'Request failed',
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Network error', error);
    }
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.access_token);
    return response;
  }

  async register(
    email: string,
    password: string,
    name: string
  ): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(response.access_token);
    return response;
  }

  logout() {
    this.clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // Users
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Sessions
  async getSessions(): Promise<Session[]> {
    return this.request<Session[]>('/sessions');
  }

  async getSession(id: string): Promise<Session> {
    return this.request<Session>(`/sessions/${id}`);
  }

  async createSession(relationshipId?: string): Promise<Session> {
    return this.request<Session>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ relationshipId }),
    });
  }

  async uploadAudio(sessionId: string, audioFile: File): Promise<void> {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch(`${API_URL}/sessions/${sessionId}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'Audio upload failed');
    }
  }

  async importWhatsAppChat(chatFile: File): Promise<Session> {
    const formData = new FormData();
    formData.append('file', chatFile);

    const response = await fetch(`${API_URL}/sessions/import-whatsapp`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'WhatsApp import failed');
    }

    return response.json();
  }

  async transcribeSession(sessionId: string): Promise<void> {
    return this.request<void>(`/sessions/${sessionId}/transcribe`, {
      method: 'POST',
    });
  }

  async analyzeSession(sessionId: string): Promise<void> {
    return this.request<void>(`/sessions/${sessionId}/analyze`, {
      method: 'POST',
    });
  }

  async getSessionReport(sessionId: string): Promise<AnalysisResult> {
    return this.request<AnalysisResult>(`/sessions/${sessionId}/report`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    return this.request<void>(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Session Q&A
  async askSessionQuestion(
    sessionId: string,
    question: string
  ): Promise<{ answer: string; question: string }> {
    return this.request(`/sessions/${sessionId}/ask`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }

  async getSessionQuestions(
    sessionId: string
  ): Promise<Array<{ question: string; answer: string; createdAt: string }>> {
    return this.request(`/sessions/${sessionId}/questions`);
  }

  // Gamification
  async getGamificationStats(): Promise<GamificationStats> {
    return this.request<GamificationStats>('/gamification/dashboard');
  }

  async getQuests(): Promise<Quest[]> {
    return this.request<Quest[]>('/gamification/quests');
  }

  // Relationships
  async getRelationships(): Promise<Relationship[]> {
    return this.request<Relationship[]>('/relationships');
  }

  async getRelationship(id: string): Promise<Relationship> {
    return this.request<Relationship>(`/relationships/${id}`);
  }

  async createRelationship(data: {
    name: string;
    type: string;
  }): Promise<Relationship> {
    return this.request<Relationship>('/relationships', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinRelationship(inviteCode: string): Promise<Relationship> {
    return this.request<Relationship>(`/relationships/${inviteCode}/join`, {
      method: 'POST',
    });
  }

  async getRelationshipMembers(relationshipId: string): Promise<any[]> {
    return this.request(`/relationships/${relationshipId}/members`);
  }

  async getRelationshipSessions(relationshipId: string): Promise<Session[]> {
    return this.request(`/relationships/${relationshipId}/sessions`);
  }

  async getRelationshipHealth(relationshipId: string): Promise<any> {
    return this.request(`/relationships/${relationshipId}/health`);
  }

  // Personality
  async getMyPersonality(): Promise<PersonalityProfile> {
    return this.request<PersonalityProfile>('/personality/me');
  }

  async getCoupleComparison(): Promise<any> {
    return this.request('/personality/couple/comparison');
  }

  // Insights
  async getInsightsSummary(): Promise<any> {
    return this.request('/insights/summary');
  }

  async getPatterns(): Promise<Pattern[]> {
    return this.request<Pattern[]>('/insights/patterns');
  }

  async acknowledgePattern(patternId: string): Promise<void> {
    return this.request(`/insights/patterns/${patternId}/acknowledge`, {
      method: 'POST',
    });
  }

  async dismissPattern(patternId: string): Promise<void> {
    return this.request(`/insights/patterns/${patternId}/dismiss`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
export { ApiError };
