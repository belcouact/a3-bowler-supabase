import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, TrendingDown, Minus, Activity, Award, XCircle, Sparkles, Lightbulb, Target, Copy, Check, ArrowRight, Zap } from 'lucide-react';
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
        return 'bg-emerald-50/50 text-emerald-700 ring-emerald-100';
      case 'degrading':
      case 'decreasing':
      case 'incapable':
        return 'bg-rose-50/50 text-rose-700 ring-rose-100';
      case 'unstable':
      case 'fluctuating':
        return 'bg-amber-50/50 text-amber-700 ring-amber-100';
      default:
        return 'bg-slate-50/50 text-slate-700 ring-slate-100';
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden="true" 
          onClick={onClose}
        />

        {/* Modal Panel */}
        <div 
          className={`relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all duration-300 ease-out sm:w-full sm:max-w-2xl border border-white/20
            ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}`}
        >
          {/* Decorative Header Background */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-brand-500/10 via-primary-500/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            className="absolute top-4 right-4 z-10 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          
          <div className="relative px-6 pt-8 pb-6 sm:px-8">
            {/* Header Content */}
            <div className="flex items-center gap-4 mb-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-primary-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-200" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-900/5 shadow-sm">
                    <Sparkles className="h-7 w-7 text-brand-600" />
                </div>
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent" id="modal-title">
                  AI Analysis
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-0.5">
                  Insights for <span className="text-brand-600 font-semibold">{metricName}</span>
                </p>
              </div>
            </div>
            
            {result ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Summary Card */}
                <div className="group relative overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 p-5 transition-all hover:shadow-md hover:border-brand-200/50">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-brand-500 to-primary-500" />
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 text-brand-600 shrink-0">
                        <Lightbulb className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-display text-sm font-bold text-slate-900">Executive Summary</h4>
                        <button 
                            onClick={handleCopy}
                            className="text-slate-400 hover:text-brand-600 transition-colors p-1.5 rounded-lg hover:bg-brand-50 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                            title="Copy summary"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Trend Card */}
                    <div className={`rounded-2xl p-4 flex flex-col items-center justify-center text-center ring-1 transition-all hover:shadow-md ${getTrendColor()}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2">Current Trend</span>
                        <div className="flex items-center gap-2">
                            {getTrendIcon()}
                            <span className="font-display text-lg font-bold">{getTrendLabel()}</span>
                        </div>
                    </div>

                    {/* Achievement Card */}
                    <div className="rounded-2xl bg-white p-4 flex flex-col items-center justify-center text-center ring-1 ring-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Achievement</span>
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-full ${result.achievementRate >= 80 ? 'bg-emerald-100 text-emerald-600' : result.achievementRate >= 50 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                                <Target className="w-4 h-4" />
                            </div>
                            <span className={`font-display text-lg font-bold ${result.achievementRate >= 80 ? 'text-emerald-600' : result.achievementRate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {result.achievementRate.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Suggestions Section */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h4 className="font-display text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center ring-1 ring-amber-100">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        Strategic Recommendations
                    </h4>
                    {result.suggestion.length > 0 ? (
                        <ul className="space-y-3">
                            {result.suggestion.map((item, index) => (
                                <li key={index} className="flex items-start gap-3 text-sm text-slate-600 group">
                                    <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                    <span className="leading-relaxed">{item}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-500 italic px-4 text-center py-2">No specific suggestions detected at this time.</p>
                    )}
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-brand-500/20 blur-xl rounded-full animate-pulse" />
                    <div className="relative bg-white rounded-2xl p-4 shadow-lg ring-1 ring-slate-100">
                        <Sparkles className="w-8 h-8 text-brand-600 animate-pulse" />
                    </div>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 mb-2">Analyzing Performance</h3>
                <p className="text-sm text-slate-500 max-w-xs text-center leading-relaxed">
                    Our AI is crunching the numbers to generate actionable insights...
                </p>
              </div>
            )}
            
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:scale-95 active:translate-y-0"
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
