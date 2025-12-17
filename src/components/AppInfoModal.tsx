import React from 'react';
import { X, LayoutDashboard, FileText, Sparkles, Save } from 'lucide-react';

interface AppInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppInfoModal: React.FC<AppInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-gray-900" id="modal-title">
                About A3 Bowler
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-blue-900 text-sm leading-relaxed">
                  <strong>A3 Bowler</strong> is a comprehensive performance tracking and problem-solving application designed to help teams monitor metrics and systematically resolve issues using the A3 methodology.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-indigo-700 font-semibold">
                    <LayoutDashboard className="w-5 h-5" />
                    <h4>Metric Bowler</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Track KPIs with monthly targets and actuals. Visualize trends with dynamic charts and identify gaps at a glance.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1 ml-2 list-disc list-inside">
                    <li>Create Bowlers for different teams</li>
                    <li>Track Target vs Actual data</li>
                    <li>Visual trend charts</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-indigo-700 font-semibold">
                    <FileText className="w-5 h-5" />
                    <h4>A3 Problem Solving</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Systematically solve problems using the A3 structured approach.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1 ml-2 list-disc list-inside">
                    <li>Problem Statement Definition</li>
                    <li>Data Analysis & Visualization</li>
                    <li>Root Cause Analysis (5 Whys)</li>
                    <li>Action Plan Tracking</li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                  Smart Features
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">AI Assistant</p>
                            <p className="text-xs text-gray-500 mt-1">Ask questions about your data or get help improving your problem statements.</p>
                        </div>
                    </div>
                    <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                            <Save className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Cloud Sync</p>
                            <p className="text-xs text-gray-500 mt-1">Your data is securely saved and accessible across sessions.</p>
                        </div>
                    </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
