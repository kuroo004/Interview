import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key not found in environment variables');
      throw new Error('Gemini API key not found. Please add VITE_GEMINI_API_KEY to your .env file.');
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
      throw new Error('Failed to initialize Gemini AI service');
    }
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      // Check if it's a retryable error
      const isRetryable = this.isRetryableError(error);
      
      if (retryCount < this.maxRetries && isRetryable) {
        const delay = this.baseDelay * Math.pow(2, retryCount);
        console.log(`Retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryWithBackoff(operation, retryCount + 1);
      }
      
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on 503 (Service Unavailable), 429 (Too Many Requests), and network errors
    if (error.message?.includes('503') || error.message?.includes('Service Unavailable')) {
      return true;
    }
    if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
      return true;
    }
    if (error.message?.includes('overloaded')) {
      return true;
    }
    // Network errors are usually retryable
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true;
    }
    return false;
  }

  private getErrorMessage(error: any): string {
    if (error.message?.includes('503') || error.message?.includes('overloaded')) {
      return 'The AI service is currently overloaded. Please try again in a few moments.';
    }
    if (error.message?.includes('429')) {
      return 'Too many requests. Please wait a moment before trying again.';
    }
    if (error.message?.includes('API key')) {
      return 'API key error. Please check your configuration.';
    }
    if (error.message?.includes('fetch')) {
      return 'Network error. Please check your internet connection.';
    }
    return 'An unexpected error occurred. Please try again.';
  }

  async generateQuestions(topic: string, count: number = 5): Promise<Array<{
    text: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }>> {
    try {
      const prompt = `Generate ${count} encouraging and beginner-friendly technical interview questions for ${topic}.
      
      Requirements:
      - All questions must be beginner level, simple, and easy to understand
      - Focus on basic concepts that most learners would know
      - Use encouraging language that makes candidates feel confident
      - Avoid complex or intimidating topics
      - Questions should be approachable and build confidence
      - Include questions about fundamental concepts that are commonly taught first
      - Make questions feel like friendly conversations, not intimidating tests
      
      Format your response as a JSON array with this structure:
      [
        {
          "text": "Question text here",
          "difficulty": "beginner"
        }
      ]
      
      Topic: ${topic}
      Number of questions: ${count}
      
      Remember: These questions should make candidates feel successful and confident!`;

      const result = await this.retryWithBackoff(async () => {
        return await this.model.generateContent(prompt);
      });
      
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('Invalid response format from Gemini API, using fallback');
        return this.getFallbackQuestions(topic, count);
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      
      // Validate and ensure we have the right number of questions
      if (!Array.isArray(questions) || questions.length === 0) {
        console.warn('No valid questions generated, using fallback');
        return this.getFallbackQuestions(topic, count);
      }
      
      return questions.slice(0, count).map(q => ({
        text: q.text,
        difficulty: ['beginner', 'intermediate', 'advanced'].includes(q.difficulty) 
          ? q.difficulty 
          : 'intermediate'
      }));
      
    } catch (error) {
      console.error('Error generating questions:', error);
      const errorMessage = this.getErrorMessage(error);
      console.warn(`Using fallback questions due to: ${errorMessage}`);
      return this.getFallbackQuestions(topic, count);
    }
  }

  async analyzeAnswer(question: string, answer: string): Promise<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    keyPoints: string[];
  }> {
    try {
      const prompt = `You are a supportive and fair technical interviewer. Analyze this interview answer and provide constructive, balanced feedback.

      Question: "${question}"
      
      Answer: "${answer}"
      
      Please evaluate the answer with a balanced and encouraging mindset, considering:
      1. Technical understanding and accuracy
      2. Effort and attempt to answer
      3. Communication clarity and structure
      4. Practical knowledge and examples
      5. Areas for improvement and growth
      
      IMPORTANT: Be fair but encouraging with scoring! Remember:
      - A basic understanding should score 5-6/10
      - Good effort with some technical accuracy should score 6-7/10
      - Strong answers should score 7-8/10
      - Excellent answers should score 8-9/10
      - Only give very low scores (1-3) for completely off-topic or no attempt
      - Focus on strengths while providing constructive improvement suggestions
      
      Provide your analysis in the following JSON format:
      {
        "score": [number from 1-10],
        "feedback": "[2-3 sentence balanced assessment with encouragement and improvement areas]",
        "strengths": ["[strength 1]", "[strength 2]", "[strength 3]"],
        "improvements": ["[constructive improvement suggestion 1]", "[constructive improvement suggestion 2]", "[constructive improvement suggestion 3]"],
        "keyPoints": ["[key concept 1]", "[key concept 2]", "[key concept 3]"]
      }
      
      Be encouraging but honest. Provide fair assessment that motivates improvement while recognizing effort.`;

      const result = await this.retryWithBackoff(async () => {
        return await this.model.generateContent(prompt);
      });
      
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('Invalid analysis response format, using fallback');
        return this.getFallbackAnalysis(answer);
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Apply generous score adjustment to make grading more lenient
      let adjustedScore = Number(analysis.score) || 5;
      adjustedScore = this.applyGenerousScoring(adjustedScore, answer);
      
      // Validate the response structure
      return {
        score: Math.min(10, Math.max(1, adjustedScore)),
        feedback: analysis.feedback || 'Good effort! Your answer shows understanding.',
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths.slice(0, 3) : ['Good attempt', 'Shows understanding', 'Clear communication'],
        improvements: Array.isArray(analysis.improvements) ? analysis.improvements.slice(0, 3) : ['Continue practicing', 'Build on your foundation', 'Keep learning'],
        keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints.slice(0, 3) : ['Technical knowledge', 'Problem-solving approach', 'Communication skills']
      };
      
    } catch (error) {
      console.error('Error analyzing answer:', error);
      const errorMessage = this.getErrorMessage(error);
      console.warn(`Using fallback analysis due to: ${errorMessage}`);
      return this.getFallbackAnalysis(answer);
    }
  }

  /**
   * Applies balanced scoring adjustments to make the grading system moderately generous
   * This boosts scores by 1 point to encourage users while maintaining some rigor
   */
  private applyGenerousScoring(originalScore: number, answer: string): number {
    let adjustedScore = originalScore;
    
    // Base score inflation: boost all scores by 1 point (reduced from 2)
    adjustedScore += 1;
    
    // Additional generosity based on answer characteristics
    const answerLength = answer.length;
    const hasTechnicalTerms = /function|variable|array|object|class|method|api|database|server|client/i.test(answer);
    const hasExamples = /example|instance|case|scenario|like|such as/i.test(answer);
    
    // Length bonus (encourage detailed answers) - reduced bonuses
    if (answerLength > 150) adjustedScore += 0.3;  // Reduced from 0.5
    if (answerLength > 300) adjustedScore += 0.3;  // Reduced from 0.5
    
    // Technical content bonus (encourage technical thinking) - reduced bonus
    if (hasTechnicalTerms) adjustedScore += 0.3;  // Reduced from 0.5
    
    // Example usage bonus (encourage practical knowledge) - reduced bonus
    if (hasExamples) adjustedScore += 0.3;  // Reduced from 0.5
    
    // Ensure score stays within 1-10 range
    return Math.min(10, Math.max(1, adjustedScore));
  }

  private getFallbackQuestions(topic: string, count: number): Array<{
    text: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }> {
    const questionTemplates: Record<string, Array<{
      text: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    }>> = {
      'JavaScript': [
        { text: "Explain the difference between let, const, and var in JavaScript.", difficulty: 'beginner' },
        { text: "What is closure in JavaScript and provide an example?", difficulty: 'intermediate' },
        { text: "How does prototypal inheritance work in JavaScript?", difficulty: 'intermediate' },
        { text: "Explain event delegation and its benefits.", difficulty: 'advanced' },
        { text: "What are the different ways to handle asynchronous operations in JavaScript?", difficulty: 'intermediate' },
        { text: "Describe the concept of hoisting in JavaScript.", difficulty: 'beginner' },
        { text: "How would you implement a debounce function?", difficulty: 'advanced' },
      ],
      'React': [
        { text: "What is React and what are its main benefits?", difficulty: 'beginner' },
        { text: "Explain the difference between functional and class components.", difficulty: 'beginner' },
        { text: "What are React hooks and why were they introduced?", difficulty: 'intermediate' },
        { text: "How does the virtual DOM work in React?", difficulty: 'intermediate' },
        { text: "Explain the concept of state management in React applications.", difficulty: 'advanced' },
        { text: "What is the purpose of useEffect hook?", difficulty: 'intermediate' },
        { text: "How would you optimize a React application's performance?", difficulty: 'advanced' },
      ],
      'Node.js': [
        { text: "What is Node.js and what makes it different from browser JavaScript?", difficulty: 'beginner' },
        { text: "Explain the event loop in Node.js.", difficulty: 'intermediate' },
        { text: "What are streams in Node.js and when would you use them?", difficulty: 'intermediate' },
        { text: "How do you handle errors in Node.js applications?", difficulty: 'beginner' },
        { text: "Explain the concept of middleware in Express.js.", difficulty: 'intermediate' },
        { text: "What is the difference between synchronous and asynchronous operations in Node.js?", difficulty: 'beginner' },
        { text: "How would you implement authentication and authorization in a Node.js API?", difficulty: 'advanced' },
      ],
      'Data Structures': [
        { text: "What is the difference between an array and a linked list?", difficulty: 'beginner' },
        { text: "Explain how a hash table works and its time complexity.", difficulty: 'intermediate' },
        { text: "What are the different types of tree data structures?", difficulty: 'intermediate' },
        { text: "Describe the difference between BFS and DFS algorithms.", difficulty: 'intermediate' },
        { text: "When would you use a stack vs a queue?", difficulty: 'beginner' },
        { text: "Explain the concept of dynamic programming with an example.", difficulty: 'advanced' },
        { text: "How does a binary search tree maintain its sorted property?", difficulty: 'intermediate' },
      ],
      'System Design': [
        { text: "What are the key principles of system design?", difficulty: 'beginner' },
        { text: "Explain the difference between horizontal and vertical scaling.", difficulty: 'intermediate' },
        { text: "How would you design a URL shortening service like bit.ly?", difficulty: 'advanced' },
        { text: "What is load balancing and why is it important?", difficulty: 'intermediate' },
        { text: "Explain the CAP theorem and its implications.", difficulty: 'advanced' },
        { text: "What are microservices and their advantages?", difficulty: 'intermediate' },
        { text: "How would you handle database sharding?", difficulty: 'advanced' },
      ],
      'Machine Learning': [
        { text: "What is the difference between supervised and unsupervised learning?", difficulty: 'beginner' },
        { text: "Explain the bias-variance tradeoff.", difficulty: 'intermediate' },
        { text: "What is overfitting and how can you prevent it?", difficulty: 'intermediate' },
        { text: "Describe the difference between classification and regression.", difficulty: 'beginner' },
        { text: "How does gradient descent work?", difficulty: 'intermediate' },
        { text: "What are neural networks and how do they learn?", difficulty: 'advanced' },
        { text: "Explain cross-validation and its importance.", difficulty: 'intermediate' },
      ]
    };

    const topicQuestions = questionTemplates[topic] || questionTemplates['JavaScript'];
    // Only beginner questions, shuffled
    const beginnerQuestions = topicQuestions.filter(q => q.difficulty === 'beginner');
    const shuffled = [...beginnerQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private getFallbackAnalysis(answer: string): {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    keyPoints: string[];
  } {
    const answerLength = answer.length;
    let score = 6; // Balanced base score (reduced from 7)
    
    // Balanced scoring based on answer characteristics
    if (answerLength > 50) score += 0.5;  // Reasonable attempt gets small bonus
    if (answerLength > 100) score += 0.5; // Detailed answers get small bonus
    if (answerLength > 200) score += 0.5; // Very detailed answers get small bonus
    if (answerLength > 500) score += 0.5; // Exceptional detail gets small bonus
    
    // Penalize very short answers more realistically
    if (answerLength < 30) score -= 1;
    if (answerLength < 20) score -= 1;
    
    // Ensure score stays within balanced range
    score = Math.min(10, Math.max(5, score)); // Minimum score is now 5 instead of 6
    
    return {
      score,
      feedback: "Good effort! Your answer shows understanding. Continue practicing to improve further.",
      strengths: ["Good attempt", "Shows understanding", "Clear communication"],
      improvements: ["Continue practicing", "Build on your foundation", "Keep learning"],
      keyPoints: ["Technical knowledge", "Problem-solving approach", "Communication skills"]
    };
  }
}