import { FC } from 'react';
import { X, FileText, Sparkles, Smartphone, Layers, Target, TrendingUp } from 'lucide-react';

interface AppInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppInfoModal: FC<AppInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
          aria-hidden="true" 
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border border-slate-100">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-6 sm:px-8">
             <div className="absolute top-4 right-4">
                <button 
                  onClick={onClose} 
                  className="rounded-full p-1 text-white/70 hover:bg-white/20 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>
             <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md shadow-inner ring-1 ring-white/30">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">A3 Bowler</h2>
                <p className="mt-2 text-primary-100 font-medium max-w-lg">
                  AI-Assisted Performance Tracker & A3 Problem Solving
                </p>
             </div>
          </div>

          <div className="px-6 py-6 sm:px-8 bg-white">
            <div className="mb-8">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Overview</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                A3 Bowler is a lightweight performance management tool designed to help teams track metrics,
                visualize trends, and drive problem solving using the A3 methodology. It combines a monthly
                bowler chart with A3 analysis, enhanced by AI to summarize patterns and support root cause
                thinking.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Key Features</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="group flex items-start p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-primary-100 hover:shadow-md transition-all duration-200">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-primary-200 group-hover:text-primary-600 transition-colors">
                    <TrendingUp className="h-5 w-5 text-slate-500 group-hover:text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-primary-700">Metric Tracking</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Visualize performance trends with interactive bowler charts and color-coded status indicators.
                    </p>
                  </div>
                </div>

                <div className="group flex items-start p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all duration-200">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                    <FileText className="h-5 w-5 text-slate-500 group-hover:text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700">A3 Problem Solving</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Structured workflow for problem statements, root causes, and countermeasures on a single page.
                    </p>
                  </div>
                </div>

                <div className="group flex items-start p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-purple-100 hover:shadow-md transition-all duration-200">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-purple-200 group-hover:text-purple-600 transition-colors">
                    <Sparkles className="h-5 w-5 text-slate-500 group-hover:text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-purple-700">AI Assistance</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Intelligent analysis of data patterns and suggestions for problem solving steps.
                    </p>
                  </div>
                </div>

                <div className="group flex items-start p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-100 hover:shadow-md transition-all duration-200">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:border-emerald-200 group-hover:text-emerald-600 transition-colors">
                    <Layers className="h-5 w-5 text-slate-500 group-hover:text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">Portfolio View</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Consolidated view of all bowlers and A3s to align organizational objectives.
                    </p>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile Optimized</span>
               </div>
               <div className="text-xs text-slate-400">
                  v1.2.0 • Build 2024.10
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
