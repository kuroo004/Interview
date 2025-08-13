import React from 'react';
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
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Brain, 
  Eye, 
  Star, 
  Download,
  Share2,
  Printer,
  X,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

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

interface PerformanceReportProps {
  attempt: {
    id: number;
    topic: string;
    score: number;
    total_questions: number;
    correct_answers: number;
    duration_minutes?: number;
    confidence_score?: number;
    facial_expression_score?: number;
    attempt_date: string;
  };
  onClose: () => void;
}

const PerformanceReport: React.FC<PerformanceReportProps> = ({ attempt, onClose }) => {
  const scorePercentage = (attempt.score / 10) * 100;
  const accuracyPercentage = (attempt.correct_answers / attempt.total_questions) * 100;
  
  // Performance level assessment
  const getPerformanceLevel = (score: number) => {
    if (score >= 8) return { level: 'Excellent', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: CheckCircle };
    if (score >= 6) return { level: 'Good', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: AlertCircle };
    return { level: 'Needs Improvement', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: XCircle };
  };

  const performanceLevel = getPerformanceLevel(attempt.score);
  const PerformanceIcon = performanceLevel.icon;

  // Chart data for performance breakdown
  const performanceBreakdownData = {
    labels: ['Correct', 'Incorrect'],
    datasets: [
      {
        data: [attempt.correct_answers, attempt.total_questions - attempt.correct_answers],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Radar chart for skill assessment
  const skillAssessmentData = {
    labels: ['Accuracy', 'Speed', 'Confidence', 'Expression', 'Knowledge'],
    datasets: [
      {
        label: 'Your Performance',
        data: [
          accuracyPercentage / 10,
          attempt.duration_minutes ? Math.max(0, 10 - (attempt.duration_minutes / 5)) : 5,
          attempt.confidence_score ? attempt.confidence_score * 10 : 5,
          attempt.facial_expression_score ? attempt.facial_expression_score * 10 : 5,
          scorePercentage / 10,
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

  // Line chart for score progression (simulated)
  const scoreProgressionData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
    datasets: [
      {
        label: 'Question Score',
        data: Array.from({ length: attempt.total_questions }, (_, i) => {
          // Simulate question scores based on overall performance
          const baseScore = attempt.score;
          const variation = (Math.random() - 0.5) * 2;
          return Math.max(0, Math.min(10, baseScore + variation));
        }),
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

  // Recommendations based on performance
  const getRecommendations = () => {
    const recommendations = [];
    
    if (attempt.score < 6) {
      recommendations.push('Focus on fundamental concepts and practice basic questions');
      recommendations.push('Review the topic material before attempting again');
      recommendations.push('Consider taking practice tests to build confidence');
    } else if (attempt.score < 8) {
      recommendations.push('Work on time management and question strategy');
      recommendations.push('Practice more complex scenarios and edge cases');
      recommendations.push('Review incorrect answers to identify knowledge gaps');
    } else {
      recommendations.push('Excellent performance! Consider more advanced topics');
      recommendations.push('Help others by sharing your knowledge');
      recommendations.push('Maintain consistency in future attempts');
    }

    if (attempt.confidence_score && attempt.confidence_score < 0.6) {
      recommendations.push('Work on building confidence through regular practice');
    }

    if (attempt.facial_expression_score && attempt.facial_expression_score < 0.6) {
      recommendations.push('Practice maintaining positive expressions during interviews');
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  const exportReport = () => {
    const reportContent = `
Performance Report - ${attempt.topic}
Date: ${new Date(attempt.attempt_date).toLocaleDateString()}
Score: ${attempt.score.toFixed(1)}/10
Performance Level: ${performanceLevel.level}
Accuracy: ${accuracyPercentage.toFixed(1)}%
Duration: ${attempt.duration_minutes || 'N/A'} minutes
Confidence: ${attempt.confidence_score ? (attempt.confidence_score * 100).toFixed(1) + '%' : 'N/A'}
Facial Expression: ${attempt.facial_expression_score ? (attempt.facial_expression_score * 100).toFixed(1) + '%' : 'N/A'}

Recommendations:
${recommendations.map(rec => `- ${rec}`).join('\n')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${attempt.topic}-${new Date(attempt.attempt_date).toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl max-w-6xl w-full max-h-full overflow-y-auto border border-white/20">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b border-white/20 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Performance Report</h2>
              <p className="text-blue-200 mt-1">{attempt.topic} - {new Date(attempt.attempt_date).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportReport}
                className="p-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition-colors"
                title="Export Report"
              >
                <Download size={20} className="text-green-400" />
              </button>
              <button
                onClick={printReport}
                className="p-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors"
                title="Print Report"
              >
                <Printer size={20} className="text-blue-400" />
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Close Report"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <Target size={24} className="text-white" />
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${performanceLevel.bgColor} ${performanceLevel.color}`}>
                  {performanceLevel.level}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{attempt.score.toFixed(1)}/10</h3>
              <p className="text-blue-200">Overall Score</p>
              <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${scorePercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                  <CheckCircle size={24} className="text-white" />
                </div>
                <span className="text-green-400 text-sm font-medium">Accuracy</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{accuracyPercentage.toFixed(1)}%</h3>
              <p className="text-blue-200">{attempt.correct_answers}/{attempt.total_questions} correct</p>
              <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${accuracyPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                  <Clock size={24} className="text-white" />
                </div>
                <span className="text-purple-400 text-sm font-medium">Efficiency</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {attempt.duration_minutes ? `${attempt.duration_minutes} min` : 'N/A'}
              </h3>
              <p className="text-blue-200">Total Duration</p>
              {attempt.duration_minutes && (
                <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (attempt.duration_minutes / 10) * 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Breakdown */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Star size={20} className="mr-2 text-yellow-400" />
                Performance Breakdown
              </h3>
              <div className="h-64">
                <Doughnut
                  data={performanceBreakdownData}
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

            {/* Skill Assessment */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Brain size={20} className="mr-2 text-purple-400" />
                Skill Assessment
              </h3>
              <div className="h-64">
                <Radar
                  data={skillAssessmentData}
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
          </div>

          {/* Score Progression */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <TrendingUp size={20} className="mr-2 text-green-400" />
              Question-by-Question Performance
            </h3>
            <div className="h-64">
              <Line
                data={scoreProgressionData}
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

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Confidence Analysis */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Brain size={20} className="mr-2 text-blue-400" />
                Confidence Analysis
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-blue-200">Confidence Level</span>
                  <span className="text-white font-semibold">
                    {attempt.confidence_score ? 
                      `${(attempt.confidence_score * 100).toFixed(1)}%` : 'N/A'
                    }
                  </span>
                </div>
                {attempt.confidence_score && (
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${attempt.confidence_score * 100}%` }}
                    ></div>
                  </div>
                )}
                <p className="text-sm text-blue-200">
                  {attempt.confidence_score && attempt.confidence_score < 0.6 
                    ? 'Consider practicing more to build confidence' 
                    : 'Good confidence level maintained throughout'
                  }
                </p>
              </div>
            </div>

            {/* Facial Expression Analysis */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Eye size={20} className="mr-2 text-purple-400" />
                Expression Analysis
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-purple-200">Expression Score</span>
                  <span className="text-white font-semibold">
                    {attempt.facial_expression_score ? 
                      `${(attempt.facial_expression_score * 100).toFixed(1)}%` : 'N/A'
                    }
                  </span>
                </div>
                {attempt.facial_expression_score && (
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${attempt.facial_expression_score * 100}%` }}
                    ></div>
                  </div>
                )}
                <p className="text-sm text-purple-200">
                  {attempt.facial_expression_score && attempt.facial_expression_score < 0.6 
                    ? 'Work on maintaining positive expressions' 
                    : 'Excellent expression management'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Star size={20} className="mr-2 text-yellow-400" />
              Personalized Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg">
                  <div className="p-1 bg-blue-500/20 rounded-full">
                    <CheckCircle size={16} className="text-blue-400" />
                  </div>
                  <p className="text-white text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 pt-4">
            <button
              onClick={exportReport}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all duration-200 flex items-center space-x-2"
            >
              <Download size={20} />
              <span>Export Report</span>
            </button>
            <button
              onClick={printReport}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 flex items-center space-x-2"
            >
              <Printer size={20} />
              <span>Print Report</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceReport;
