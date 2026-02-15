import React from 'react';
import { X, MousePointer, Target, Edit, Sparkles, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
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

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-slate-100">
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
            <div className="absolute top-4 right-4">
               <button 
                 onClick={onClose} 
                 className="rounded-full p-1 text-white/70 hover:bg-white/20 hover:text-white transition-all"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shadow-inner ring-1 ring-white/30">
                 <HelpCircle className="h-6 w-6 text-white" />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-white tracking-tight">Metric Bowler User Guide</h2>
                 <p className="text-blue-100 text-sm font-medium">Quick reference for managing your metrics</p>
               </div>
            </div>
          </div>
          
          <div className="px-6 py-6 sm:px-8 bg-white max-h-[70vh] overflow-y-auto">
            <div className="space-y-6">
              
              <div className="group flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <MousePointer className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Editing Data</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Left click on any Target or Actual cell to edit its value. Right click to add a context note. Cells with notes are marked with a red triangle.
                  </p>
                </div>
              </div>

              <div className="group flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Target Rules</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Set rules in the Edit Metric window: {'>='} Target (default), {'<='} Target, or Within Range (e.g. &#123;5,10&#125;). Actual values violating the rule will be highlighted in red.
                  </p>
                </div>
              </div>

              <div className="group flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shadow-sm text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                  <Edit className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Bowler Info & Status Rules</h4>
                  <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                    Double-click on the Bowler Name or Description in the header to edit the Bowler information.
                  </p>
                  
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                       Status Indicators
                     </p>
                     <ul className="space-y-2">
                       <li className="flex items-center text-xs text-slate-600">
                         <span className="w-2 h-2 bg-green-500 rounded-full mr-2 shadow-sm ring-1 ring-green-200"></span>
                         <span><strong className="text-slate-900">Green:</strong> All metrics met targets in latest month.</span>
                       </li>
                       <li className="flex items-center text-xs text-slate-600">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2 shadow-sm ring-1 ring-red-200"></span>
                          <span><strong className="text-slate-900">Red:</strong> Any metric failed for 3 consecutive months.</span>
                        </li>
                       <li className="flex items-center text-xs text-slate-600">
                         <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 shadow-sm ring-1 ring-yellow-200"></span>
                         <span><strong className="text-slate-900">Yellow:</strong> Any metric missed target recently.</span>
                       </li>
                     </ul>
                  </div>
                </div>
              </div>

              <div className="group flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shadow-sm text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">AI Analysis</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Click the Sparkles icon on any chart to get an AI-powered analysis of the metric's performance trend.
                  </p>
                </div>
              </div>

            </div>
          </div>
          
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end rounded-b-2xl">
            <button
              type="button"
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
              onClick={onClose}
            >
              Close Guide
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
