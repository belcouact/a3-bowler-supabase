import React from 'react';
import { X, TrendingUp, TrendingDown, Minus, Activity, AlertTriangle, CheckCircle, Award, XCircle } from 'lucide-react';
import { AnalysisResult } from '../services/aiService';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
  metricName: string;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ isOpen, onClose, result, metricName }) => {
  if (!isOpen || !result) return null;

  const getTrendIcon = () => {
    switch (result.trend as string) {
      case 'capable':
        return <Award className="w-6 h-6 text-green-600" />;
      case 'improving':
        return <TrendingUp className="w-6 h-6 text-green-600" />;
      case 'degrading':
        return <TrendingDown className="w-6 h-6 text-red-600" />;
      case 'stable':
        return <Minus className="w-6 h-6 text-blue-600" />;
      case 'unstable':
        return <Activity className="w-6 h-6 text-orange-600" />;
      case 'incapable':
        return <XCircle className="w-6 h-6 text-red-600" />;
      // Backwards compatibility
      case 'increasing':
        return <TrendingUp className="w-6 h-6 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="w-6 h-6 text-red-600" />;
      case 'fluctuating':
        return <Activity className="w-6 h-6 text-orange-600" />;
      default:
        return <Minus className="w-6 h-6 text-gray-600" />;
    }
  };

  const getTrendLabel = () => {
    return result.trend.charAt(0).toUpperCase() + result.trend.slice(1);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                AI Analysis: {metricName}
              </h3>
              
              <div className="mt-4 space-y-6">
                
                {/* Summary Section */}
                <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Summary</h4>
                    <p className="text-sm text-blue-700">{result.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Trend Section */}
                    <div className="bg-gray-50 p-4 rounded-md flex flex-col items-center justify-center">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Trend</span>
                        <div className="flex items-center space-x-2">
                            {getTrendIcon()}
                            <span className="text-sm font-semibold text-gray-900">{getTrendLabel()}</span>
                        </div>
                    </div>

                    {/* Achievement Section */}
                    <div className="bg-gray-50 p-4 rounded-md flex flex-col items-center justify-center">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Target Achievement</span>
                        <div className="flex items-center space-x-2">
                            <CheckCircle className={`w-5 h-5 ${result.achievementRate >= 80 ? 'text-green-500' : result.achievementRate >= 50 ? 'text-yellow-500' : 'text-red-500'}`} />
                            <span className="text-sm font-semibold text-gray-900">{result.achievementRate.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                {/* Suggestions Section */}
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1 text-orange-500" />
                        Suggestions
                    </h4>
                    {result.suggestion.length > 0 ? (
                        <ul className="text-sm text-gray-600 space-y-2 bg-orange-50 p-3 rounded-md border border-orange-100">
                            {result.suggestion.map((item, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No specific suggestions detected.</p>
                    )}
                </div>

              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
