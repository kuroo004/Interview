import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Pause, SkipForward, Clock, Target, ArrowLeft } from 'lucide-react';
import { Topic, Question, Answer, AnalysisResult } from '../types';
import { GeminiService } from '../services/geminiService';
import { SpeechService } from '../services/speechService';
import * as faceapi from 'face-api.js';
import { apiService } from '../services/apiService';

interface InterviewScreenProps {
  topic: Topic;
  onInterviewComplete: (results: any) => void;
  onBack: () => void;
  mode: 'proctored' | 'normal';
  userId?: string;
}

export default function InterviewScreen({ topic, onInterviewComplete, onBack, mode }: InterviewScreenProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [interviewStartTime] = useState(Date.now());

  // Face detection state (proctored mode)
  const [faceDetected, setFaceDetected] = useState(true);
  const [faceError, setFaceError] = useState('');
  const [faceLostTime, setFaceLostTime] = useState<number | null>(null);
  const [faceLostTimeout, setFaceLostTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const QUESTION_TIME_LIMIT_MS = 2 * 60 * 1000; // 2 minutes

  const [geminiService] = useState(() => new GeminiService());
  const [speechService] = useState(() => new SpeechService());

  // Load questions from backend
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true);
        const questionsData = await apiService.getQuestions(topic.name, 5);
        setQuestions(questionsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [topic.name]);

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - questionStartTime;
      setTimeElapsed(elapsed);
      if (elapsed >= QUESTION_TIME_LIMIT_MS) {
        clearInterval(timer);
        handleTimeUp();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [questionStartTime]);

  // Face detection setup (real logic)
  useEffect(() => {
    if (mode !== 'proctored') return;
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let faceLostTimer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    };

    const startCamera = async () => {
      try {
        await loadModels();
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        detectFace();
      } catch (err) {
        setFaceError('Unable to access camera or load face detection models. Please allow camera permissions and check your connection.');
      }
    };

    const detectFace = async () => {
      if (!videoRef.current) return;
      const result = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions());
      if (isMounted) setFaceDetected(!!result);
      animationFrameId = requestAnimationFrame(detectFace);
    };

    startCamera();

    // Cleanup
    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (faceLostTimer) clearTimeout(faceLostTimer);
    };
  }, [mode]);

  // Simulate face lost logic (structure only)
  useEffect(() => {
    if (mode !== 'proctored') return;
    if (!faceDetected) {
      // If face not detected for 5 seconds, terminate test
      if (!faceLostTimeout) {
        const timeout = setTimeout(() => {
          setFaceError('Face not detected. The test has been terminated.');
        }, 5000);
        setFaceLostTimeout(timeout);
      }
    } else {
      if (faceLostTimeout) {
        clearTimeout(faceLostTimeout);
        setFaceLostTimeout(null);
      }
    }
    // Cleanup on unmount
    return () => {
      if (faceLostTimeout) clearTimeout(faceLostTimeout);
    };
  }, [faceDetected, mode]);

  const handleTimeUp = async () => {
    if (!answers[currentQuestionIndex]) {
      await submitAnswer(true); // true = timeUp
      setTimeout(() => {
        nextQuestion();
      }, 1000); // Give a moment for analysis
    }
  };

  const loadQuestions = async () => {
    if (!geminiService) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const generatedQuestions = await geminiService.generateQuestions(topic.name, 5);
      const questionsWithIds = generatedQuestions.map((q, index) => ({
        id: `q-${index}`,
        text: q.text,
        topic: topic.name,
        difficulty: q.difficulty
      }));
      
      setQuestions(questionsWithIds);
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error('Error loading questions:', error);
      setError('Failed to load questions. Please check your internet connection and API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    if (!speechService.isAvailable()) {
      alert('Speech recognition is not available in your browser. Please use Chrome or Edge.');
      return;
    }

    setIsRecording(true);
    setCurrentAnswer('');

    try {
      const transcript = await speechService.startRecording();
      setCurrentAnswer(transcript);
    } catch (error) {
      console.error('Recording error:', error);
      alert('Error recording audio. Please try again.');
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    speechService.stopRecording();
    setIsRecording(false);
  };

  const submitAnswer = async (timeUp = false) => {
    if ((!currentAnswer.trim() && !timeUp) || !questions[currentQuestionIndex] || !geminiService) return;

    const answer: Answer = {
      questionId: questions[currentQuestionIndex].id,
      text: currentAnswer,
      timestamp: Date.now()
    };

    setIsAnalyzing(true);

    try {
      const analysis = await geminiService.analyzeAnswer(
        questions[currentQuestionIndex].text,
        currentAnswer
      );

      const answerWithAnalysis = { ...answer, analysis };
      setAnswers(prev => [...prev, answerWithAnalysis]);
      if (timeUp) setCurrentAnswer('');
    } catch (error: any) {
      console.error('Error analyzing answer:', error);
      
      // Provide more specific feedback based on error type
      let feedbackMessage = 'Analysis unavailable. Please try again.';
      if (error.message?.includes('overloaded') || error.message?.includes('503')) {
        feedbackMessage = 'AI service is temporarily overloaded. Using basic analysis.';
      } else if (error.message?.includes('429')) {
        feedbackMessage = 'Too many requests. Please wait before continuing.';
      } else if (error.message?.includes('API key')) {
        feedbackMessage = 'Service configuration issue. Please contact support.';
      }
      
      const fallbackAnalysis = {
        score: 5,
        feedback: feedbackMessage,
        strengths: ['Answer provided'],
        improvements: ['Technical analysis pending'],
        keyPoints: ['Basic response']
      };
      setAnswers(prev => [...prev, { ...answer, analysis: fallbackAnalysis }]);
      if (timeUp) setCurrentAnswer('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
      setQuestionStartTime(Date.now());
    } else {
      // Interview complete - save to backend
      const averageScore = answers.reduce((sum, a) => sum + (a.analysis?.score || 0), 0) / answers.length;
      const endTime = Date.now();
      
      try {
        // Save interview session to backend
        await apiService.saveInterviewSession({
          topic: topic.name,
          questions,
          answers,
          startTime: interviewStartTime,
          endTime,
          averageScore,
          mode
        });
        
        console.log('Interview session saved successfully');
      } catch (error) {
        console.error('Failed to save interview session:', error);
        // Continue with interview completion even if save fails
      }
      
      onInterviewComplete({
        topic,
        questions,
        answers,
        averageScore,
        startTime: interviewStartTime,
        endTime,
        mode
      });
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Error state
  if (error || faceError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-white mb-4">{faceError ? 'Proctoring Error' : 'Setup Required'}</h2>
          <p className="text-blue-200 mb-6">{faceError || error}</p>
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Topics</span>
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-white mb-2">Generating Interview Questions</h2>
          <p className="text-blue-200">AI is preparing personalized questions for {topic.name}...</p>
          <p className="text-blue-300 text-sm mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Webcam preview and face status (proctored mode)
  const renderProctoringBar = () => (
    <div className="flex items-center gap-4 mb-4">
      <div className="relative w-20 h-14 border-2 border-blue-400 rounded-lg overflow-hidden bg-black">
        <video ref={videoRef} width={80} height={56} autoPlay muted className="object-cover w-full h-full" />
        <div className={`absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs font-bold ${faceDetected ? 'text-green-400' : 'text-red-400'}`}
          style={{ pointerEvents: 'none' }}>
          {faceDetected ? 'Face Detected' : 'No Face'}
        </div>
      </div>
      <span className={`text-sm font-medium ${faceDetected ? 'text-green-400' : 'text-red-400'}`}>{faceDetected ? 'Proctoring Active' : 'Face Not Detected'}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Proctoring Bar */}
        {mode === 'proctored' && renderProctoringBar()}
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Topics</span>
          </button>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-blue-200">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">{formatTime(timeElapsed)}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-blue-200">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-blue-900/30 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-200 text-center">Interview Progress</p>
        </div>

        {/* Current Question */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentQuestion?.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300' :
                currentQuestion?.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                {currentQuestion?.difficulty}
              </div>
              <span className="text-blue-200 text-sm">{topic.name}</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold text-white mb-6 leading-relaxed">
            {currentQuestion?.text}
          </h2>
          
          {/* Voice Input Section */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Your Answer</h3>
              {!speechService.isAvailable() && (
                <span className="text-yellow-400 text-sm">Voice input unavailable - type your answer</span>
              )}
            </div>
            
            {/* Answer Input */}
            <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
              {isRecording && (
                <div className="flex items-center space-x-2 mb-4 text-red-400">
                  <div className="animate-pulse">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">Recording... Speak your answer</span>
                </div>
              )}
              
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder={isRecording ? "Listening..." : "Type your answer or use voice input..."}
                className="w-full bg-transparent text-white placeholder-slate-400 resize-none focus:outline-none min-h-[120px]"
                disabled={isRecording || timeElapsed >= QUESTION_TIME_LIMIT_MS}
              />
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {speechService.isAvailable() && (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isAnalyzing}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim() || isAnalyzing || timeElapsed >= QUESTION_TIME_LIMIT_MS}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Submit Answer'}
                </button>
                
                {answers[currentQuestionIndex] && (
                  <button
                    onClick={nextQuestion}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <span>{currentQuestionIndex === questions.length - 1 ? 'Finish Interview' : 'Next Question'}</span>
                    <SkipForward className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {answers[currentQuestionIndex]?.analysis && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">AI Analysis Results</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  answers[currentQuestionIndex].analysis!.score >= 8 ? 'text-green-400' :
                  answers[currentQuestionIndex].analysis!.score >= 6 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {answers[currentQuestionIndex].analysis!.score}/10
                </div>
                <p className="text-blue-200 text-sm">Your Score</p>
              </div>
              
              <div>
                <h4 className="text-green-400 font-medium mb-2">Strengths</h4>
                <ul className="text-blue-200 text-sm space-y-1">
                  {answers[currentQuestionIndex].analysis!.strengths.map((strength, index) => (
                    <li key={index}>• {strength}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-orange-400 font-medium mb-2">Improvements</h4>
                <ul className="text-blue-200 text-sm space-y-1">
                  {answers[currentQuestionIndex].analysis!.improvements.map((improvement, index) => (
                    <li key={index}>• {improvement}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
              <p className="text-blue-100 text-sm leading-relaxed">
                {answers[currentQuestionIndex].analysis!.feedback}
              </p>
            </div>
          </div>
        )}
        {timeElapsed >= QUESTION_TIME_LIMIT_MS && (
          <div className="text-red-400 text-sm mt-2">Time is up for this question!</div>
        )}
      </div>
    </div>
  );
}