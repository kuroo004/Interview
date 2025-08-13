export interface Question {
  id: string;
  text: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface Answer {
  questionId: string;
  text: string;
  audioBlob?: Blob;
  timestamp: number;
}

export interface AnalysisResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  keyPoints: string[];
}

export interface InterviewSession {
  id: string;
  topic: string;
  questions: Question[];
  answers: (Answer & { analysis?: AnalysisResult })[];
  startTime: number;
  endTime?: number;
  averageScore?: number;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// Add type for test mode
export type TestMode = 'proctored' | 'normal';

// New interfaces for persistent data storage
export interface InterviewAttempt {
  id?: number;
  topic: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  durationMinutes?: number;
  confidenceScore?: number;
  facialExpressionScore?: number;
  attemptDate?: string;
  answers?: (Answer & { analysis?: AnalysisResult })[];
}

export interface UserProfile {
  id: number;
  username: string;
  email?: string;
  createdAt: string;
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  topicsAttempted: string[];
}

export interface UserAnalytics {
  overall: {
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    averageDuration: number;
  };
  topicStats: Array<{
    topic: string;
    attempts: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
  }>;
  recentAttempts: InterviewAttempt[];
}