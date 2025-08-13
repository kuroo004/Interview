import React from 'react';
import { Trophy, Target, TrendingUp, Clock, RotateCcw, Home, Sparkles } from 'lucide-react';
import { Topic } from '../types';
import jsPDF from 'jspdf';
import { useEffect, useRef } from 'react';

interface ResultsScreenProps {
  results: {
    topic: Topic;
    questions: any[];
    answers: any[];
    averageScore: number;
  };
  onStartNew: () => void;
  onBackToTopics: () => void;
  userId?: string;
  onGoToDashboard?: () => void;
}

export default function ResultsScreen({ results, onStartNew, onBackToTopics, userId, onGoToDashboard }: ResultsScreenProps) {
  const { topic, answers, averageScore } = results;
  // Placeholder: log results for dashboard integration
  React.useEffect(() => {
    if (userId) {
      console.log('Saving results for user:', userId, results);
      // TODO: Save to Clerk user metadata or backend
    }
  }, [userId, results]);
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 8) return { level: 'Excellent', color: 'bg-green-500' };
    if (score >= 6) return { level: 'Good', color: 'bg-yellow-500' };
    if (score >= 4) return { level: 'Fair', color: 'bg-orange-500' };
    return { level: 'Needs Improvement', color: 'bg-red-500' };
  };

  const performance = getPerformanceLevel(averageScore);
  const totalQuestions = answers.length;
  const excellentAnswers = answers.filter(a => a.analysis?.score >= 8).length;
  const goodAnswers = answers.filter(a => a.analysis?.score >= 6 && a.analysis?.score < 8).length;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    // Header background
    doc.setFillColor(44, 62, 80); // dark blue
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Interview Summary Report', 105, 20, { align: 'center' });

    // Section background
    doc.setFillColor(236, 240, 241); // light gray
    doc.rect(10, 40, 190, 80, 'F');

    // Main stats
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text(`Topic: ${topic.name}`, 20, 55);
    doc.text(`Average Score: ${averageScore.toFixed(1)}/10`, 20, 70);
    doc.text(`Performance Level: ${performance.level}`, 20, 85);
    doc.text(`Questions Answered: ${totalQuestions}`, 120, 55);
    doc.text(`Excellent Answers (8+): ${excellentAnswers}`, 120, 70);
    doc.text(`Good Answers (6-7.9): ${goodAnswers}`, 120, 85);

    // Colored stat boxes
    doc.setFillColor(46, 204, 113); // green
    doc.rect(10, 130, 60, 20, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(16);
    doc.text(`${averageScore.toFixed(1)}/10`, 40, 144, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Avg. Score', 40, 150, { align: 'center' });

    doc.setFillColor(52, 152, 219); // blue
    doc.rect(80, 130, 60, 20, 'F');
    doc.setFontSize(16);
    doc.text(`${totalQuestions}`, 110, 144, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Questions', 110, 150, { align: 'center' });

    doc.setFillColor(241, 196, 15); // yellow
    doc.rect(150, 130, 50, 20, 'F');
    doc.setFontSize(16);
    doc.text(`${performance.level}`, 175, 144, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Performance', 175, 150, { align: 'center' });

    doc.save('interview-summary.pdf');
  };

  // Confetti animation for high scores
  const confettiRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (averageScore >= 8 && confettiRef.current) {
      // Simple confetti burst (not a full library, just a fun effect)
      const canvas = confettiRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width = 400;
      const H = canvas.height = 200;
      const confettiColors = ['#34d399', '#60a5fa', '#fbbf24', '#a78bfa', '#f472b6'];
      let confetti: any[] = [];
      for (let i = 0; i < 80; i++) {
        confetti.push({
          x: Math.random() * W,
          y: Math.random() * H / 2,
          r: Math.random() * 6 + 4,
          d: Math.random() * 80,
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          tilt: Math.random() * 10 - 5
        });
      }
      let angle = 0;
      let frame = 0;
      function draw() {
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < confetti.length; i++) {
          let c = confetti[i];
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, 2 * Math.PI);
          ctx.fillStyle = c.color;
          ctx.globalAlpha = 0.8;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        update();
        if (frame++ < 80) requestAnimationFrame(draw);
      }
      function update() {
        angle += 0.01;
        for (let i = 0; i < confetti.length; i++) {
          let c = confetti[i];
          c.y += Math.cos(angle + c.d) + 2 + c.r / 2;
          c.x += Math.sin(angle) * 2;
          if (c.y > H) {
            c.x = Math.random() * W;
            c.y = -10;
          }
        }
      }
      draw();
    }
  }, [averageScore]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6 relative overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Animated Confetti for High Score */}
        {averageScore >= 8 && (
          <canvas ref={confettiRef} className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 z-30" style={{width: 400, height: 200}} />
        )}
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className={`p-4 ${performance.color} rounded-full shadow-2xl shadow-blue-900/40 animate-pulse`}>
              <Trophy className="h-12 w-12 text-white drop-shadow-lg" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Interview Complete!</h1>
          <p className="text-xl text-blue-200">
            You've completed the {topic.name} interview session
          </p>
        </div>

        {/* Overall Score */}
        <div className="bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-indigo-900/40 shadow-2xl shadow-blue-900/30 backdrop-blur-2xl rounded-2xl p-8 mb-8 border border-white/20 text-center animate-fade-in">
          <div className={`text-6xl font-bold mb-4 ${getScoreColor(averageScore)} drop-shadow-xl animate-bounce-in`}> 
            {averageScore.toFixed(1)}/10
          </div>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-white text-lg font-semibold ${performance.color} shadow-lg animate-fade-in`}> 
            {performance.level}
            {averageScore >= 8 && <Sparkles className="ml-2 h-6 w-6 text-yellow-300 animate-spin-slow" />}
          </div>
          <p className="text-blue-200 mt-4">Overall Performance Score</p>
        </div>

        {/* Statistics Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <Target className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">{totalQuestions}</div>
            <p className="text-blue-200 text-sm">Questions Answered</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">{excellentAnswers}</div>
            <p className="text-blue-200 text-sm">Excellent Answers (8+)</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <Clock className="h-8 w-8 text-purple-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">{goodAnswers}</div>
            <p className="text-blue-200 text-sm">Good Answers (6-7.9)</p>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6">Detailed Results</h2>
          
          <div className="space-y-6">
            {answers.map((answer, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-medium text-white leading-tight pr-4">
                    {results.questions[index]?.text}
                  </h3>
                  <div className={`text-2xl font-bold ${getScoreColor(answer.analysis?.score || 0)} flex-shrink-0`}>
                    {answer.analysis?.score || 0}/10
                  </div>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-4 mb-3">
                  <p className="text-blue-100 text-sm leading-relaxed">
                    <strong>Your Answer:</strong> {answer.text.substring(0, 150)}
                    {answer.text.length > 150 && '...'}
                  </p>
                </div>
                
                {answer.analysis && (
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">Strengths</h4>
                      <ul className="text-blue-200 space-y-1">
                        {answer.analysis.strengths.slice(0, 2).map((strength: string, i: number) => (
                          <li key={i}>• {strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-orange-400 font-medium mb-2">Areas for Improvement</h4>
                      <ul className="text-blue-200 space-y-1">
                        {answer.analysis.improvements.slice(0, 2).map((improvement: string, i: number) => (
                          <li key={i}>• {improvement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">AI Recommendations</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-green-400 mb-3">Continue Practicing</h3>
              <ul className="text-blue-100 space-y-2 text-sm">
                <li>• Review fundamental concepts in {topic.name}</li>
                <li>• Practice explaining complex topics simply</li>
                <li>• Work on providing specific examples</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-blue-400 mb-3">Study Focus Areas</h3>
              <ul className="text-blue-100 space-y-2 text-sm">
                <li>• Deep dive into topics you scored below 6</li>
                <li>• Practice technical communication skills</li>
                <li>• Review industry best practices</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
          <button
            onClick={onStartNew}
            className="flex items-center justify-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-900/30 animate-fade-in"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Practice Again</span>
          </button>
          
          <button
            onClick={onBackToTopics}
            className="flex items-center justify-center space-x-2 px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg animate-fade-in"
          >
            <Home className="h-5 w-5" />
            <span>Choose New Topic</span>
          </button>
          {onGoToDashboard && (
            <button
              onClick={onGoToDashboard}
              className="flex items-center justify-center space-x-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg animate-fade-in"
            >
              <span>View Progress Dashboard</span>
            </button>
          )}
        </div>
        <div className="flex justify-end mb-6 mt-4">
          <button
            onClick={handleDownloadPDF}
            className="relative px-6 py-3 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-2xl shadow-blue-900/40 transition-all duration-200 animate-fade-in overflow-hidden"
          >
            <span className="absolute left-0 top-0 w-full h-full bg-white/10 rounded-xl animate-shimmer z-0" style={{pointerEvents:'none'}}></span>
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-300 animate-spin-slow" />
            Download Summary PDF
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}