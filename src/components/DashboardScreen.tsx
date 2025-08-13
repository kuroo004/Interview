import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar, PolarArea } from 'react-chartjs-2';
import { Trophy, Target, TrendingUp, Clock, RotateCcw, Home, BarChart3, Activity, Zap, Brain, Eye, Star, User } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardScreenProps {
  onBackToTopics: () => void;
  onLogout: () => void;
  onGoToProfile: () => void;
}

interface Analytics {
  overall: {
    total_attempts: number;
    average_score: number;
    best_score: number;
    worst_score: number;
    avg_duration: number;
  };
  topicStats: Array<{
    topic: string;
    attempts: number;
    avg_score: number;
    best_score: number;
    worst_score: number;
  }>;
  recentAttempts: Array<{
    score: number;
    attempt_date: string;
    topic: string;
    confidence_score: number;
    facial_expression_score: number;
  }>;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ onBackToTopics, onLogout, onGoToProfile }) => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center backdrop-blur-sm">
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">No data available</div>
      </div>
    );
  }

  // Enhanced chart data preparation
  const scoreTrendData = {
    labels: analytics?.recentAttempts?.slice(0, 10).map((_, index) => `Attempt ${index + 1}`) || [],
    datasets: [
      {
        label: 'Score',
        data: analytics?.recentAttempts?.slice(0, 10).map(attempt => attempt.score) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  };

  const topicPerformanceData = {
    labels: analytics?.topicStats?.map(stat => stat.topic) || [],
    datasets: [
      {
        label: 'Average Score',
        data: analytics?.topicStats?.map(stat => stat.avg_score) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const topicAttemptsData = {
    labels: analytics?.topicStats?.map(stat => stat.topic) || [],
    datasets: [
      {
        label: 'Number of Attempts',
        data: analytics?.topicStats?.map(stat => stat.attempts) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
      },
    ],
  };

  // New radar chart for confidence and facial expression analysis
  const confidenceExpressionData = {
    labels: ['Confidence', 'Facial Expression', 'Overall Score', 'Topic Mastery', 'Time Management'],
    datasets: [
      {
        label: 'Your Performance',
        data: [
          analytics?.recentAttempts?.[0]?.confidence_score * 10 || 0,
          analytics?.recentAttempts?.[0]?.facial_expression_score * 10 || 0,
          analytics?.recentAttempts?.[0]?.score || 0,
          analytics?.overall?.average_score || 0,
          analytics?.overall?.avg_duration ? Math.max(0, 10 - (analytics.overall.avg_duration / 5)) : 5,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 3,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
      },
    ],
  };

  // Polar area chart for topic distribution
  const topicDistributionData = {
    labels: analytics?.topicStats?.map(stat => stat.topic) || [],
    datasets: [
      {
        label: 'Attempts',
        data: analytics?.topicStats?.map(stat => stat.attempts) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Calculate improvement trend
  const recentScores = analytics?.recentAttempts?.slice(0, 5).map(a => a.score) || [];
  const improvement = recentScores.length >= 2 ? 
    ((recentScores[0] - recentScores[recentScores.length - 1]) / recentScores[recentScores.length - 1] * 100).toFixed(1) : '0';

  // Overall statistics with null checks - moved inside render to ensure analytics exists
  const overallStats = [
    {
      title: 'Total Attempts',
      value: analytics?.overall?.total_attempts || 0,
      icon: Activity,
      color: 'from-blue-500 to-blue-600',
      gradient: 'from-blue-400/20 to-blue-600/20',
    },
    {
      title: 'Average Score',
      value: `${(analytics?.overall?.average_score || 0).toFixed(1)}/10`,
      icon: Target,
      color: 'from-green-500 to-green-600',
      gradient: 'from-green-400/20 to-green-600/20',
    },
    {
      title: 'Best Score',
      value: `${(analytics?.overall?.best_score || 0).toFixed(1)}/10`,
      icon: Trophy,
      color: 'from-yellow-500 to-yellow-600',
      gradient: 'from-yellow-400/20 to-yellow-600/20',
    },
    {
      title: 'Avg Duration',
      value: `${(analytics?.overall?.avg_duration || 0).toFixed(1)} min`,
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      gradient: 'from-purple-400/20 to-purple-600/20',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Performance Dashboard</h1>
            <p className="text-blue-200">Track your progress and analyze your interview performance</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={onBackToTopics}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Home size={20} />
              <span>New Interview</span>
            </button>
            <button
              onClick={onGoToProfile}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <User size={20} />
              <span>Profile</span>
            </button>
            <button
              onClick={onLogout}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Improvement Indicator */}
        {recentScores.length >= 2 && (
          <div className="mb-8 p-6 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-xl border border-emerald-500/30">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Performance Trend</h3>
                <p className="text-emerald-200">
                  {parseFloat(improvement) > 0 ? 'Improving' : 'Needs attention'}: 
                  <span className="font-bold ml-2">
                    {parseFloat(improvement) > 0 ? '+' : ''}{improvement}%
                  </span>
                  {' '}over your last 5 attempts
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {overallStats.map((stat, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all duration-200 hover:transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} shadow-lg`}>
                  <stat.icon size={24} className="text-white" />
                </div>
              </div>
              <div className={`mt-4 h-1 bg-gradient-to-r ${stat.gradient} rounded-full`}></div>
            </div>
          ))}
        </div>

        {/* Enhanced Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Score Trend */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <TrendingUp size={20} className="mr-2 text-blue-400" />
              Score Trend (Last 10 Attempts)
            </h3>
            <div className="h-64">
              <Line
                data={scoreTrendData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: { color: 'white' },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 10,
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    },
                    x: {
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Topic Performance */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <BarChart3 size={20} className="mr-2 text-green-400" />
              Topic Performance
            </h3>
            <div className="h-64">
              <Bar
                data={topicPerformanceData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: { color: 'white' },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 10,
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    },
                    x: {
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* New Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Radar Chart for Performance Analysis */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Brain size={20} className="mr-2 text-purple-400" />
              Performance Analysis
            </h3>
            <div className="h-64">
              <Radar
                data={confidenceExpressionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: { color: 'white' },
                    },
                  },
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 10,
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                      pointLabels: { color: 'white' },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Polar Area Chart for Topic Distribution */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Eye size={20} className="mr-2 text-pink-400" />
              Topic Distribution
            </h3>
            <div className="h-64">
              <PolarArea
                data={topicDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: 'white' },
                    },
                  },
                  scales: {
                    r: {
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Topic Attempts Distribution */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Star size={20} className="mr-2 text-yellow-400" />
            Attempts by Topic
          </h3>
          <div className="h-80">
            <Doughnut
              data={topicAttemptsData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: 'white' },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Recent Attempts Table */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Zap size={20} className="mr-2 text-orange-400" />
            Recent Attempts
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="py-3 px-4 text-blue-200 font-medium">Date</th>
                  <th className="py-3 px-4 text-blue-200 font-medium">Topic</th>
                  <th className="py-3 px-4 text-blue-200 font-medium">Score</th>
                  <th className="py-3 px-4 text-blue-200 font-medium">Confidence</th>
                  <th className="py-3 px-4 text-blue-200 font-medium">Expression</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.recentAttempts?.slice(0, 10).map((attempt, index) => (
                  <tr key={index} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white">
                      {new Date(attempt.attempt_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-white">{attempt.topic}</td>
                    <td className="py-3 px-4 text-white font-semibold">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        attempt.score >= 8 ? 'bg-green-500/20 text-green-300' :
                        attempt.score >= 6 ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {attempt.score.toFixed(1)}/10
                      </span>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen; 