import React from 'react';
import { Brain, Code, Server, Database, Cpu, Globe, BookOpen, Zap } from 'lucide-react';
import { Topic } from '../types';

interface TopicSelectionProps {
  onTopicSelect: (topic: Topic, mode: 'proctored' | 'normal') => void;
  onGoToDashboard?: () => void;
}

const topics: Topic[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    description: 'Core JavaScript concepts, ES6+, and modern features',
    icon: 'Code',
    color: 'from-yellow-400 to-orange-500'
  },
  {
    id: 'react',
    name: 'React',
    description: 'React components, hooks, state management, and patterns',
    icon: 'Globe',
    color: 'from-blue-400 to-cyan-500'
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    description: 'Server-side JavaScript, APIs, and backend development',
    icon: 'Server',
    color: 'from-green-400 to-emerald-500'
  },
  {
    id: 'data-structures',
    name: 'Data Structures',
    description: 'Arrays, trees, graphs, algorithms, and complexity analysis',
    icon: 'Database',
    color: 'from-purple-400 to-pink-500'
  },
  {
    id: 'system-design',
    name: 'System Design',
    description: 'Architecture, scalability, and distributed systems',
    icon: 'Cpu',
    color: 'from-indigo-400 to-purple-500'
  },
  {
    id: 'machine-learning',
    name: 'Machine Learning',
    description: 'ML algorithms, data science, and AI concepts',
    icon: 'Brain',
    color: 'from-rose-400 to-pink-500'
  }
];

const iconMap = {
  Code,
  Globe,
  Server,
  Database,
  Cpu,
  Brain,
  BookOpen,
  Zap
};

export default function TopicSelection({ onTopicSelect, onGoToDashboard }: TopicSelectionProps) {
  const [selectedTopic, setSelectedTopic] = React.useState<Topic | null>(null);
  const [showModeSelect, setShowModeSelect] = React.useState(false);

  const handleTopicClick = (topic: Topic) => {
    setSelectedTopic(topic);
    setShowModeSelect(true);
  };

  const handleModeSelect = (mode: 'proctored' | 'normal') => {
    if (selectedTopic) {
      onTopicSelect(selectedTopic, mode);
      setShowModeSelect(false);
      setSelectedTopic(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Interview Assistant
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Practice technical interviews with AI-powered questions and feedback
          </p>
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-blue-100 text-sm">Powered by Advanced AI Analysis</span>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Choose Your Interview Topic
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => {
            const IconComponent = iconMap[topic.icon as keyof typeof iconMap];
            
            return (
              <div
                key={topic.id}
                onClick={() => handleTopicClick(topic)}
                className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300">
                  <div className={`w-12 h-12 bg-gradient-to-r ${topic.color} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-200 transition-colors">
                    {topic.name}
                  </h3>
                  
                  <p className="text-blue-100 text-sm leading-relaxed">
                    {topic.description}
                  </p>
                  
                  <div className="mt-4 flex items-center text-blue-300 text-sm font-medium group-hover:text-blue-200 transition-colors">
                    Start Interview
                    <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mode Selection Modal */}
        {showModeSelect && selectedTopic && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-2xl shadow-xl p-8 max-w-sm w-full border border-blue-500">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">Choose Test Mode</h2>
              <p className="text-blue-200 mb-6 text-center">How would you like to take the {selectedTopic.name} interview?</p>
              <div className="flex flex-col gap-4">
                <button
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-200"
                  onClick={() => handleModeSelect('proctored')}
                >
                  Proctored Test (Camera Required)
                </button>
                <button
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold border border-white/20 transition-all duration-200"
                  onClick={() => handleModeSelect('normal')}
                >
                  Normal Test (No Camera)
                </button>
                <button
                  className="mt-2 text-blue-300 hover:text-white text-sm underline"
                  onClick={() => { setShowModeSelect(false); setSelectedTopic(null); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-blue-200 text-sm">
            Each interview includes 5 AI-generated questions with detailed feedback and scoring
          </p>
          {onGoToDashboard && (
            <button
              onClick={onGoToDashboard}
              className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg animate-fade-in"
            >
              View Progress Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}