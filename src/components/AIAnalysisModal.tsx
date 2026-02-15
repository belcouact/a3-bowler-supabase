import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, TrendingDown, Minus, Activity, AlertTriangle, CheckCircle, Award, XCircle, Sparkles, Lightbulb, Target, Copy, Check } from 'lucide-react';
import { AnalysisResult } from '../services/aiService';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
  metricName: string;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ isOpen, onClose, result, metricName }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCopy = () => {
    if (result?.summary) {
        navigator.clipboard.writeText(result.summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isVisible && !isOpen) return null;

  const getTrendIcon = () => {
    switch (result?.trend as string) {
      case 'capable':
        return <Award className="w-5 h-5 text-emerald-600" />;
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case 'degrading':
        return <TrendingDown className="w-5 h-5 text-rose-600" />;
      case 'stable':
        return <Minus className="w-5 h-5 text-blue-600" />;
      case 'unstable':
        return <Activity className="w-5 h-5 text-amber-600" />;
      case 'incapable':
        return <XCircle className="w-5 h-5 text-rose-600" />;
      // Backwards compatibility
      case 'increasing':
        return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case 'decreasing':
        return <TrendingDown className="w-5 h-5 text-rose-600" />;
      case 'fluctuating':
        return <Activity className="w-5 h-5 text-amber-600" />;
      default:
        return <Minus className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTrendLabel = () => {
    if (!result?.trend) return 'Unknown';
    return result.trend.charAt(0).toUpperCase() + result.trend.slice(1);
  };

  const getTrendColor = () => {
    switch (result?.trend as string) {
      case 'capable':
      case 'improving':
      case 'increasing':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'degrading':
      case 'decreasing':
      case 'incapable':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'unstable':
      case 'fluctuating':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden="true" 
          onClick={onClose}
        />

        {/* Modal Panel */}
        <div 
          className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all duration-300 ease-out sm:w-full sm:max-w-2xl
            ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}`}
        >
          {/* Decorative Header Background */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-10" />

          {/* Close Button */}
          <button
            type="button"
            className="absolute top-4 right-4 z-10 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          
          <div className="relative px-6 pt-8 pb-6 sm:px-8">
            {/* Header Content */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight" id="modal-title">
                  AI Performance Analysis
                </h3>
                <p className="text-sm font-medium text-slate-500">
                  Analyzing <span className="text-indigo-600 font-semibold">{metricName}</span>
                </p>
              </div>
            </div>
            
            {result ? (
              <div className="space-y-6">
                
                {/* Summary Card */}
                <div className="relative overflow-hidden rounded-xl bg-slate-50 border border-slate-100 p-5 shadow-sm group hover:shadow-md transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-indigo-100 rounded-lg text-indigo-600 shrink-0">
                        <Lightbulb className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-900">Executive Summary</h4>
                        <button 
                            onClick={handleCopy}
                            className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-indigo-50 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                            title="Copy summary"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed text-pretty">{result.summary}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Trend Card */}
                    <div className={`rounded-xl border p-4 flex flex-col items-center justify-center text-center transition-all hover:shadow-md ${getTrendColor()}`}>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">Current Trend</span>
                        <div className="flex items-center gap-2">
                            {getTrendIcon()}
                            <span className="text-lg font-bold">{getTrendLabel()}</span>
                        </div>
                    </div>

                    {/* Achievement Card */}
                    <div className="rounded-xl border border-slate-100 bg-white p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Achievement</span>
                        <div className="flex items-center gap-2">
                            <Target className={`w-5 h-5 ${result.achievementRate >= 80 ? 'text-emerald-500' : result.achievementRate >= 50 ? 'text-amber-500' : 'text-rose-500'}`} />
                            <span className={`text-lg font-bold ${result.achievementRate >= 80 ? 'text-emerald-600' : result.achievementRate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {result.achievementRate.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Suggestions Section */}
                <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        Strategic Recommendations
                    </h4>
                    {result.suggestion.length > 0 ? (
                        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                          <ul className="space-y-3">
                              {result.suggestion.map((item, index) => (
                                  <li key={index} className="flex items-start gap-3 text-sm text-slate-700">
                                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                      <span className="leading-relaxed">{item}</span>
                                  </li>
                              ))}
                          </ul>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic px-4">No specific suggestions detected at this time.</p>
                    )}
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="relative mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-100 border-t-indigo-600" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 animate-pulse">Analyzing Metric Performance...</h3>
                <p className="text-sm text-slate-500 max-w-xs text-center leading-relaxed">
                    Our AI is identifying trends, calculating achievements, and generating strategic insights for you.
                </p>
              </div>
            )}
            
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all active:scale-95"
                onClick={onClose}
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
