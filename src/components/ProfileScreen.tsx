import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import PerformanceReport from './PerformanceReport';
import { 
  User, 
  Mail, 
  Calendar, 
  TrendingUp, 
  Filter, 
  SortAsc, 
  SortDesc,
  Search,
  Eye,
  Download,
  ArrowLeft,
  Clock,
  Target,
  Trophy,
  Activity,
  BarChart3
} from 'lucide-react';

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

interface UserProfile {
  id: number;
  username: string;
  email?: string;
  created_at: string;
}

interface InterviewAttempt {
  id: number;
  topic: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  duration_minutes?: number;
  confidence_score?: number;
  facial_expression_score?: number;
  attempt_date: string;
  answers?: any[];
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, onLogout }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [attempts, setAttempts] = useState<InterviewAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'topic'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAttempt, setSelectedAttempt] = useState<InterviewAttempt | null>(null);
  const [showPerformanceReport, setShowPerformanceReport] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profileData, attemptsData, analyticsData] = await Promise.all([
        apiService.getProfile(),
        apiService.getAttempts(),
        apiService.getAnalytics()
      ]);
      setProfile(profileData);
      setAttempts(attemptsData);
      
      // Process analytics data for better display
      if (analyticsData) {
        console.log('Analytics loaded:', analyticsData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedAttempts = attempts
    .filter(attempt => {
      const matchesSearch = attempt.topic.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTopic = selectedTopic === 'all' || attempt.topic === selectedTopic;
      return matchesSearch && matchesTopic;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.attempt_date).getTime() - new Date(b.attempt_date).getTime();
          break;
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'topic':
          comparison = a.topic.localeCompare(b.topic);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Calculate summary statistics
  const totalAttempts = attempts.length;
  const averageScore = attempts.length > 0 
    ? attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length 
    : 0;
  const bestScore = attempts.length > 0 
    ? Math.max(...attempts.map(attempt => attempt.score)) 
    : 0;
  const topicsAttempted = [...new Set(attempts.map(attempt => attempt.topic))];
  const recentAttempts = attempts.slice(0, 5); // Last 5 attempts

  const uniqueTopics = Array.from(new Set(attempts.map(a => a.topic))).sort();

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 8) return 'bg-green-500/20 text-green-300 border-green-500/30';
    if (score >= 6) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  };

  const exportAttempts = () => {
    const csvContent = [
      ['Date', 'Topic', 'Score', 'Total Questions', 'Correct Answers', 'Duration (min)', 'Confidence', 'Facial Expression'],
      ...filteredAndSortedAttempts.map(attempt => [
        new Date(attempt.attempt_date).toLocaleDateString(),
        attempt.topic,
        attempt.score.toString(),
        attempt.total_questions.toString(),
        attempt.correct_answers.toString(),
        attempt.duration_minutes?.toString() || 'N/A',
        attempt.confidence_score ? (attempt.confidence_score * 100).toFixed(1) + '%' : 'N/A',
        attempt.facial_expression_score ? (attempt.facial_expression_score * 100).toFixed(1) + '%' : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-attempts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading your profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center backdrop-blur-sm">
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={loadProfileData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white">User Profile</h1>
              <p className="text-blue-200">Manage your account and view interview history</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Logout
          </button>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Profile Card */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{profile.username}</h2>
                <p className="text-blue-200">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-blue-400" />
                <span className="text-white">{profile.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar size={16} className="text-blue-400" />
                <span className="text-white">Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Activity size={16} className="text-blue-400" />
                <span className="text-white">{attempts.length} total attempts</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm font-medium">Best Score</p>
                  <p className="text-3xl font-bold text-white">
                    {attempts.length > 0 ? Math.max(...attempts.map(a => a.score)).toFixed(1) : 'N/A'}/10
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                  <Trophy size={24} className="text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">Average Score</p>
                  <p className="text-3xl font-bold text-white">
                    {attempts.length > 0 ? (attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length).toFixed(1) : 'N/A'}/10
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <Target size={24} className="text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm font-medium">Total Time</p>
                  <p className="text-3xl font-bold text-white">
                    {attempts.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)} min
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                  <Clock size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h3 className="text-xl font-semibold text-white mb-6">Performance Analytics</h3>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">Total Attempts</p>
                  <p className="text-2xl font-bold text-white">{totalAttempts}</p>
                </div>
                <Target className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm font-medium">Average Score</p>
                  <p className="text-2xl font-bold text-white">{averageScore.toFixed(1)}/10</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm font-medium">Best Score</p>
                  <p className="text-2xl font-bold text-white">{bestScore.toFixed(1)}/10</p>
                </div>
                <Trophy className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-xl p-4 border border-orange-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm font-medium">Topics Attempted</p>
                  <p className="text-2xl font-bold text-white">{topicsAttempted.length}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-400" />
              </div>
            </div>
          </div>

          {/* Recent Performance Chart */}
          {recentAttempts.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-white mb-4">Recent Performance Trend</h4>
              <div className="flex items-end space-x-2 h-32">
                {recentAttempts.map((attempt, index) => (
                  <div key={attempt.id} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t transition-all duration-300 hover:from-blue-400 hover:to-blue-500"
                      style={{ height: `${(attempt.score / 10) * 100}%` }}
                    />
                    <span className="text-xs text-blue-200 mt-2">{attempt.score.toFixed(1)}</span>
                    <span className="text-xs text-blue-300">{attempt.topic}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topic Performance */}
          {topicsAttempted.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Performance by Topic</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topicsAttempted.map(topic => {
                  const topicAttempts = attempts.filter(a => a.topic === topic);
                  const topicAvgScore = topicAttempts.reduce((sum, a) => sum + a.score, 0) / topicAttempts.length;
                  const topicBestScore = Math.max(...topicAttempts.map(a => a.score));
                  
                  return (
                    <div key={topic} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <h5 className="text-white font-medium mb-2">{topic}</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-200">Attempts:</span>
                          <span className="text-white">{topicAttempts.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-200">Average:</span>
                          <span className="text-white">{topicAvgScore.toFixed(1)}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-200">Best:</span>
                          <span className="text-white">{topicBestScore.toFixed(1)}/10</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col lg:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              {/* Topic Filter */}
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 transition-colors"
              >
                <option value="all">All Topics</option>
                {uniqueTopics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>

              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'topic')}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 transition-colors"
                >
                  <option value="date">Date</option>
                  <option value="score">Score</option>
                  <option value="topic">Topic</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {sortOrder === 'asc' ? <SortAsc size={16} className="text-white" /> : <SortDesc size={16} className="text-white" />}
                </button>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={exportAttempts}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Attempts Table */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Interview History</h3>
            <p className="text-blue-200">{filteredAndSortedAttempts.length} attempts found</p>
          </div>

          {filteredAndSortedAttempts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-blue-200 text-lg mb-2">No attempts found</div>
              <p className="text-blue-300">Try adjusting your filters or complete your first interview!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="py-3 px-4 text-blue-200 font-medium">Date</th>
                    <th className="py-3 px-4 text-blue-200 font-medium">Topic</th>
                    <th className="py-3 px-4 text-blue-200 font-medium">Score</th>
                    <th className="py-3 px-4 text-blue-200 font-medium">Questions</th>
                    <th className="py-3 px-4 text-blue-200 font-medium">Duration</th>
                    <th className="py-3 px-4 text-blue-200 font-medium">Confidence</th>
                    <th className="py-3 px-4 text-blue-200 font-medium">Expression</th>
                    <th className="py-3 px-4 text-blue-200 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedAttempts.map((attempt) => (
                    <tr key={attempt.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white">
                        {new Date(attempt.attempt_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-white font-medium">{attempt.topic}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getScoreBadge(attempt.score)}`}>
                          {attempt.score.toFixed(1)}/10
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white">
                        {attempt.correct_answers}/{attempt.total_questions}
                      </td>
                      <td className="py-3 px-4 text-white">
                        {attempt.duration_minutes ? `${attempt.duration_minutes} min` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-white">
                        {attempt.confidence_score ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${attempt.confidence_score * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{(attempt.confidence_score * 100).toFixed(1)}%</span>
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-white">
                        {attempt.facial_expression_score ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full" 
                                style={{ width: `${attempt.facial_expression_score * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{(attempt.facial_expression_score * 100).toFixed(1)}%</span>
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedAttempt(attempt)}
                            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} className="text-blue-400" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAttempt(attempt);
                              setShowPerformanceReport(true);
                            }}
                            className="p-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition-colors"
                            title="Performance Report"
                          >
                            <BarChart3 size={16} className="text-green-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Attempt Details Modal */}
        {selectedAttempt && !showPerformanceReport && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 max-w-2xl w-full border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Attempt Details</h3>
                <button
                  onClick={() => setSelectedAttempt(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} className="text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-blue-200 text-sm">Topic</p>
                    <p className="text-white font-semibold">{selectedAttempt.topic}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-blue-200 text-sm">Date</p>
                    <p className="text-white font-semibold">
                      {new Date(selectedAttempt.attempt_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-blue-200 text-sm">Score</p>
                    <p className={`font-semibold ${getScoreColor(selectedAttempt.score)}`}>
                      {selectedAttempt.score.toFixed(1)}/10
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-blue-200 text-sm">Duration</p>
                    <p className="text-white font-semibold">
                      {selectedAttempt.duration_minutes ? `${selectedAttempt.duration_minutes} minutes` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-blue-200 text-sm mb-2">Performance Breakdown</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white">Correct Answers</span>
                      <span className="text-white font-semibold">
                        {selectedAttempt.correct_answers}/{selectedAttempt.total_questions}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white">Confidence Level</span>
                      <span className="text-white font-semibold">
                        {selectedAttempt.confidence_score ? 
                          `${(selectedAttempt.confidence_score * 100).toFixed(1)}%` : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white">Facial Expression</span>
                      <span className="text-white font-semibold">
                        {selectedAttempt.facial_expression_score ? 
                          `${(selectedAttempt.facial_expression_score * 100).toFixed(1)}%` : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedAttempt(null)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Report Modal */}
        {selectedAttempt && showPerformanceReport && (
          <PerformanceReport
            attempt={selectedAttempt}
            onClose={() => {
              setShowPerformanceReport(false);
              setSelectedAttempt(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileScreen;
