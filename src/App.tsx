import React, { useState } from 'react';
import TopicSelection from './components/TopicSelection';
import InterviewScreen from './components/InterviewScreen';
import ResultsScreen from './components/ResultsScreen';
import { Topic } from './types';

type AppScreen = 'topics' | 'interview' | 'results';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('topics');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [interviewResults, setInterviewResults] = useState<any>(null);

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setCurrentScreen('interview');
  };

  const handleInterviewComplete = (results: any) => {
    setInterviewResults(results);
    setCurrentScreen('results');
  };

  const handleStartNew = () => {
    if (selectedTopic) {
      setInterviewResults(null);
      setCurrentScreen('interview');
    }
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
    setInterviewResults(null);
    setCurrentScreen('topics');
  };

  const handleBackFromInterview = () => {
    setSelectedTopic(null);
    setCurrentScreen('topics');
  };

  try {
    switch (currentScreen) {
      case 'interview':
        return selectedTopic ? (
          <InterviewScreen
            topic={selectedTopic}
            onInterviewComplete={handleInterviewComplete}
            onBack={handleBackFromInterview}
          />
        ) : (
          <TopicSelection onTopicSelect={handleTopicSelect} />
        );

      case 'results':
        return interviewResults ? (
          <ResultsScreen
            results={interviewResults}
            onStartNew={handleStartNew}
            onBackToTopics={handleBackToTopics}
          />
        ) : (
          <TopicSelection onTopicSelect={handleTopicSelect} />
        );

      default:
        return <TopicSelection onTopicSelect={handleTopicSelect} />;
    }
  } catch (error) {
    console.error('App error:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-blue-200 mb-6">Please refresh the page and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}

export default App;