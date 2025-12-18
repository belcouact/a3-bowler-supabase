import { FC } from 'react';
import { X, LayoutDashboard, FileText, Sparkles, Save, Upload, Download, Cloud, Info } from 'lucide-react';

interface AppInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppInfoModal: FC<AppInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-900" id="modal-title">
                About A3 Bowler
              </h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white px-4 pt-5 pb-6 sm:px-8 sm:pt-8 sm:pb-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">A3 Bowler</h2>
              <p className="mt-1 text-sm text-gray-500">AI-Assisted Performance Tracker & A3 Problem Solving</p>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Overview</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                A3 Bowler is a lightweight performance management tool designed to help teams track metrics,
                visualize trends, and drive problem solving using the A3 methodology. It combines a monthly
                bowler chart with A3 analysis, enhanced by AI to summarize patterns and support root cause
                thinking.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6 mt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Key Features</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start p-3 rounded-lg border border-gray-100 bg-green-50/80">
                  <div className="h-9 w-9 rounded-md bg-green-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">AI Assistant</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Ask AI to analyze metric trends or refine A3 problem statements and root cause analysis.
                    </p>
                  </div>
                </div>

                <div className="flex items-start p-3 rounded-lg border border-gray-100 bg-emerald-50/80">
                  <div className="h-9 w-9 rounded-md bg-emerald-500 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">CSV Import</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Quickly import metric data for multiple bowlers from spreadsheets using a flexible CSV format.
                    </p>
                  </div>
                </div>

                <div className="flex items-start p-3 rounded-lg border border-gray-100 bg-blue-50/80">
                  <div className="h-9 w-9 rounded-md bg-blue-500 flex items-center justify-center">
                    <Download className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Data Export</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Export all bowler metrics to CSV for sharing, backup, or further analysis in your own tools.
                    </p>
                  </div>
                </div>

                <div className="flex items-start p-3 rounded-lg border border-gray-100 bg-indigo-50/80">
                  <div className="h-9 w-9 rounded-md bg-indigo-500 flex items-center justify-center">
                    <LayoutDashboard className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Bowler & A3 Views</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Switch between metric bowler charts, A3 analysis, and mind map views to align objectives and actions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start p-3 rounded-lg border border-gray-100 bg-orange-50/80">
                  <div className="h-9 w-9 rounded-md bg-orange-500 flex items-center justify-center">
                    <Cloud className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Cloud Save</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Save and load your bowler lists and A3 cases securely through the study-llm backend.
                    </p>
                  </div>
                </div>

                <div className="flex items-start p-3 rounded-lg border border-gray-100 bg-purple-50/80">
                  <div className="h-9 w-9 rounded-md bg-purple-500 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Structured A3 Problem Solving</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Capture problem statements, current condition, root causes, countermeasures, and follow-up on a single A3.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 mt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Technology Stack</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-center">
                  <Save className="w-4 h-4 text-blue-500 mr-2" />
                  <span>Frontend: React, TypeScript, Tailwind CSS</span>
                </li>
                <li className="flex items-center">
                  <Cloud className="w-4 h-4 text-indigo-500 mr-2" />
                  <span>Backend: Cloudflare Workers (serverless API)</span>
                </li>
                <li className="flex items-center">
                  <LayoutDashboard className="w-4 h-4 text-emerald-500 mr-2" />
                  <span>Storage: Cloudflare KV for persisting user data</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
