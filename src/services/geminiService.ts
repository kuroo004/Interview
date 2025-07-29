import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

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

  async generateQuestions(topic: string, count: number = 5): Promise<Array<{
    text: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }>> {
    try {
      const prompt = `Generate ${count} technical interview questions for ${topic}.
      
      Requirements:
      - All questions must be beginner level, simple, and easy to understand
      - Avoid intermediate or advanced topics
      - Focus on basic concepts, definitions, and simple practical examples
      - Each question should be clear, specific, and suitable for someone new to the topic
      - Randomize the questions as much as possible
      
      Format your response as a JSON array with this structure:
      [
        {
          "text": "Question text here",
          "difficulty": "beginner"
        }
      ]
      
      Topic: ${topic}
      Number of questions: ${count}`;

      const result = await this.model.generateContent(prompt);
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
      const prompt = `You are an expert technical interviewer. Analyze this interview answer and provide detailed feedback.

      Question: "${question}"
      
      Answer: "${answer}"
      
      Please evaluate the answer based on:
      1. Technical accuracy and depth
      2. Clarity of explanation
      3. Use of examples and practical knowledge
      4. Communication skills
      5. Completeness of the response
      
      Provide your analysis in the following JSON format:
      {
        "score": [number from 1-10],
        "feedback": "[2-3 sentence overall assessment]",
        "strengths": ["[strength 1]", "[strength 2]", "[strength 3]"],
        "improvements": ["[improvement 1]", "[improvement 2]", "[improvement 3]"],
        "keyPoints": ["[key concept 1]", "[key concept 2]", "[key concept 3]"]
      }
      
      Be constructive but honest in your assessment. Focus on helping the candidate improve.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('Invalid analysis response format, using fallback');
        return this.getFallbackAnalysis(answer);
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      return {
        score: Math.min(10, Math.max(1, Number(analysis.score) || 5)),
        feedback: analysis.feedback || 'Analysis completed.',
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths.slice(0, 3) : ['Good attempt'],
        improvements: Array.isArray(analysis.improvements) ? analysis.improvements.slice(0, 3) : ['Continue practicing'],
        keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints.slice(0, 3) : ['Technical knowledge']
      };
      
    } catch (error) {
      console.error('Error analyzing answer:', error);
      return this.getFallbackAnalysis(answer);
    }
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
    let score = 5;
    
    if (answerLength > 200) score += 1;
    if (answerLength > 500) score += 1;
    if (answerLength < 50) score -= 2;
    
    score = Math.min(10, Math.max(1, score));
    
    return {
      score,
      feedback: "AI analysis is temporarily unavailable. Your answer has been recorded with basic scoring.",
      strengths: ["Provided a response", "Attempted to answer the question"],
      improvements: ["Connect to internet for AI analysis", "Try again for detailed feedback"],
      keyPoints: ["Technical communication", "Problem-solving approach", "Practical knowledge"]
    };
  }
}