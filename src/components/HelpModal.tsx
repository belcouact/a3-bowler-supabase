import React from 'react';
import { X, MousePointer, MessageSquare, Target, Edit, Sparkles, BrainCircuit, NotepadText } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                Metric Bowler User Guide
              </h3>
              
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <MousePointer className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Editing Data</h4>
                    <p className="text-sm text-gray-500">
                      Click on any Target or Actual cell to edit its value.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Edit className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Bowler Info & Status Rules</h4>
                    <p className="text-sm text-gray-500 mb-2">
                      Double-click on the Bowler Name or Description in the header to edit the Bowler information.
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                       The sidebar color indicator reflects the bowler's status:
                     </p>
                     <ul className="list-none space-y-1 text-sm text-gray-500">
                       <li className="flex items-center">
                         <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                         <span><strong className="text-gray-700">Green:</strong> All metrics met targets in the latest month.</span>
                       </li>
                       <li className="flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          <span><strong className="text-gray-700">Red:</strong> Any metric failed for 3 consecutive months.</span>
                        </li>
                       <li className="flex items-center">
                         <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                         <span><strong className="text-gray-700">Yellow:</strong> Any metric missed target in latest month or last 2 months.</span>
                       </li>
                     </ul>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Adding Notes</h4>
                    <p className="text-sm text-gray-500">
                      Right-click on a cell to add a context note. Cells with notes are marked with a red triangle.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Target className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Target Rules</h4>
                    <p className="text-sm text-gray-500">
                      Set rules in the Edit Metric window: {'>='} Target (default), {'<='} Target, or Within Range (e.g. &#123;5,10&#125;). Actual values violating the rule will be highlighted in red.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">AI Analysis</h4>
                    <p className="text-sm text-gray-500">
                      Click the Sparkles icon on any chart to get an AI-powered analysis of the metric's performance trend.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <BrainCircuit className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Mindmap</h4>
                    <p className="text-sm text-gray-500">
                      Use the Mindmap tool to visualize your problem solving process or brainstorm ideas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <NotepadText className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">One Click Summary</h4>
                    <p className="text-sm text-gray-500">
                      Generate a comprehensive summary of all your metrics and A3 cases with a single click.
                    </p>
                  </div>
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
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
