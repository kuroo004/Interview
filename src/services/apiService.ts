const API_BASE_URL = 'http://localhost:5000/api';

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
  email?: string;
}

interface InterviewAttempt {
  topic: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  durationMinutes?: number;
  confidenceScore?: number;
  facialExpressionScore?: number;
  answers?: any[];
}

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('authToken');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(data: LoginData) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(data: RegisterData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    this.clearToken();
  }

  // User profile
  async getProfile() {
    return await this.request('/profile');
  }

  // Questions
  async getQuestions(topic: string, count: number = 5) {
    return await this.request(`/questions/${topic}?count=${count}`);
  }

  async getTopics() {
    return await this.request('/topics');
  }

  // Interview attempts - Updated to include answers
  async submitAttempt(attempt: InterviewAttempt) {
    return await this.request('/attempts', {
      method: 'POST',
      body: JSON.stringify(attempt),
    });
  }

  async getAttempts() {
    return await this.request('/attempts');
  }

  async getAnalytics() {
    return await this.request('/analytics');
  }

  // New method to save complete interview session
  async saveInterviewSession(session: {
    topic: string;
    questions: any[];
    answers: any[];
    startTime: number;
    endTime: number;
    averageScore: number;
    mode: string;
  }) {
    const attempt: InterviewAttempt = {
      topic: session.topic,
      score: session.averageScore,
      totalQuestions: session.questions.length,
      correctAnswers: Math.round((session.averageScore / 10) * session.questions.length),
      durationMinutes: Math.round((session.endTime - session.startTime) / (1000 * 60)),
      answers: session.answers
    };

    return await this.submitAttempt(attempt);
  }

  // Health check
  async healthCheck() {
    return await this.request('/health');
  }
}

export const apiService = new ApiService(); 