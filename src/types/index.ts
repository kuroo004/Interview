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