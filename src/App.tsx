import React, { useState, useEffect } from 'react';
import TopicSelection from './components/TopicSelection';
import InterviewScreen from './components/InterviewScreen';
import ResultsScreen from './components/ResultsScreen';
import DashboardScreen from './components/DashboardScreen';
import ProfileScreen from './components/ProfileScreen';
import AuthScreen from './components/AuthScreen';
import { Topic } from './types';
import { apiService } from './services/apiService';

type AppScreen = 'auth' | 'topics' | 'interview' | 'results' | 'dashboard' | 'profile';

interface User {
  id: number;
  username: string;
  email?: string;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('auth');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [interviewResults, setInterviewResults] = useState<any>(null);
  const [testMode, setTestMode] = useState<'proctored' | 'normal' | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = apiService.getToken();
    if (token) {
      apiService.getProfile()
        .then(userData => {
          setUser(userData);
          setCurrentScreen('topics');
        })
        .catch(() => {
          apiService.clearToken();
          setCurrentScreen('auth');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    setCurrentScreen('topics');
  };

  const handleLogout = () => {
    apiService.logout();
    setUser(null);
    setCurrentScreen('auth');
  };

  const handleTopicSelect = (topic: Topic, mode: 'proctored' | 'normal') => {
    setSelectedTopic(topic);
    setTestMode(mode);
    setCurrentScreen('interview');
  };

  const handleInterviewComplete = async (results: any) => {
    try {
      // Save attempt to backend
      await apiService.submitAttempt({
        topic: selectedTopic?.name || 'Unknown',
        score: results.averageScore,
        totalQuestions: results.questions.length,
        correctAnswers: results.answers.filter((a: any) => a.analysis?.score >= 7).length,
        durationMinutes: Math.round((Date.now() - results.startTime) / 60000),
        confidenceScore: results.answers.reduce((sum: number, a: any) => sum + (a.analysis?.confidence || 0), 0) / results.answers.length,
        facialExpressionScore: results.answers.reduce((sum: number, a: any) => sum + (a.analysis?.facialExpression || 0), 0) / results.answers.length,
      });
    } catch (error) {
      console.error('Failed to save attempt:', error);
    }

    setInterviewResults(results);
    setCurrentScreen('results');
  };

  const handleBackFromInterview = () => {
    setCurrentScreen('topics');
  };

  const handleStartNew = () => {
    if (selectedTopic && testMode) {
      setInterviewResults(null);
      setCurrentScreen('interview');
    } else {
      setCurrentScreen('topics');
    }
  };

  const handleBackToTopics = () => {
    setCurrentScreen('topics');
  };

  const handleGoToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const handleGoToProfile = () => {
    setCurrentScreen('profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  try {
    switch (currentScreen) {
      case 'auth':
        return <AuthScreen onAuthSuccess={handleAuthSuccess} />;

      case 'topics':
        return (
          <TopicSelection 
            onTopicSelect={handleTopicSelect} 
            onGoToDashboard={handleGoToDashboard}
          />
        );

      case 'interview':
        return selectedTopic && testMode ? (
          <InterviewScreen
            topic={selectedTopic}
            mode={testMode}
            onInterviewComplete={handleInterviewComplete}
            onBack={handleBackFromInterview}
          />
        ) : (
          <TopicSelection onTopicSelect={handleTopicSelect} onGoToDashboard={handleGoToDashboard} />
        );

      case 'results':
        return interviewResults ? (
          <ResultsScreen
            results={interviewResults}
            onStartNew={handleStartNew}
            onBackToTopics={handleBackToTopics}
            onGoToDashboard={handleGoToDashboard}
          />
        ) : (
          <TopicSelection onTopicSelect={handleTopicSelect} onGoToDashboard={handleGoToDashboard} />
        );

      case 'dashboard':
        return (
          <DashboardScreen 
            onBackToTopics={handleBackToTopics}
            onLogout={handleLogout}
            onGoToProfile={handleGoToProfile}
          />
        );

      case 'profile':
        return (
          <ProfileScreen 
            onBack={handleBackToTopics}
            onLogout={handleLogout}
          />
        );

      default:
        return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
    }
  } catch (error) {
    console.error('App error:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
          <p className="text-red-200 mb-4">Something went wrong. Please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
}

export default App;