import React from 'react';
import { X, Loader2, Download, Copy, Sparkles, Lightbulb, TrendingUp, CheckCircle, AlertTriangle, Target } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { MarkdownRenderer } from './MarkdownRenderer';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  isLoading: boolean;
}

interface SummaryData {
  executiveSummary: string;
  keyAchievements: string[];
  areasForImprovement: string[];
  strategicRecommendations: string[];
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose, content, isLoading }) => {
  const toast = useToast();

  if (!isOpen) return null;

  let parsedData: SummaryData | null = null;
  let isJson = false;

  try {
    if (content && !isLoading) {
      const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanContent);
      isJson = true;
    }
  } catch (e) {
    // Content might be plain text/markdown if old version or parsing failed
    isJson = false;
  }

  const handleCopy = () => {
    // If structured data, copy a formatted string, otherwise copy raw content
    const textToCopy = isJson && parsedData ? 
        `Executive Summary:\n${parsedData.executiveSummary}\n\nKey Achievements:\n${parsedData.keyAchievements.join('\n')}\n\nAreas for Improvement:\n${parsedData.areasForImprovement.join('\n')}\n\nStrategic Recommendations:\n${parsedData.strategicRecommendations.join('\n')}` 
        : content;
        
    navigator.clipboard.writeText(textToCopy);
    toast.success('Summary copied to clipboard!');
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `metric_bowler_summary_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Summary downloaded!');
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-50 via-white to-white px-4 py-4 sm:px-6 border-b border-indigo-100 flex justify-between items-center">
            <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 shadow-sm mr-4">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                    Smart Summary & Insights
                    </h3>
                    <div className="flex items-center mt-1 space-x-3 text-xs font-medium text-gray-500">
                        <span className="flex items-center bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                            <TrendingUp className="w-3 h-3 mr-1" /> Performance Analysis
                        </span>
                    </div>
                </div>
            </div>
            <button
                onClick={onClose}
                className="bg-white rounded-md p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition-all"
            >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:p-6 bg-white min-h-[400px] max-h-[70vh] overflow-y-auto custom-scrollbar">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full py-16">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-25"></div>
                        <Loader2 className="relative w-12 h-12 animate-spin text-indigo-600 mb-4" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-1">Generating AI Report</h4>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto text-center">Analyzing performance metrics, identifying trends, and generating strategic recommendations...</p>
                </div>
            ) : isJson && parsedData ? (
                <div className="space-y-8">
                    {/* Executive Summary */}
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm">
                        <h4 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center">
                            <Target className="w-5 h-5 mr-2 text-indigo-600" />
                            Executive Overview
                        </h4>
                        <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                            {parsedData.executiveSummary}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Key Achievements */}
                        <div className="bg-green-50/50 p-5 rounded-xl border border-green-100">
                            <h4 className="text-base font-semibold text-green-800 mb-3 flex items-center">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Key Achievements
                            </h4>
                            <ul className="space-y-2">
                                {parsedData.keyAchievements.map((item, idx) => (
                                    <li key={idx} className="flex items-start text-sm text-gray-700">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Areas for Improvement */}
                        <div className="bg-red-50/50 p-5 rounded-xl border border-red-100">
                            <h4 className="text-base font-semibold text-red-800 mb-3 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                                Areas for Improvement
                            </h4>
                            <ul className="space-y-2">
                                {parsedData.areasForImprovement.map((item, idx) => (
                                    <li key={idx} className="flex items-start text-sm text-gray-700">
                                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Strategic Recommendations */}
                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                        <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                            <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                            Strategic Recommendations
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                            {parsedData.strategicRecommendations.map((item, idx) => (
                                <div key={idx} className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">
                                        {idx + 1}
                                    </div>
                                    <p className="ml-3 text-sm text-gray-700 leading-relaxed pt-1">
                                        {item}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                // Fallback for non-JSON content or errors
                <div className="prose prose-sm max-w-none prose-indigo prose-headings:text-indigo-900 prose-a:text-indigo-600">
                    <MarkdownRenderer content={content} />
                </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={handleDownload}
              disabled={isLoading || !content}
            >
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={handleCopy}
              disabled={isLoading || !content}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
