import React from 'react';
import { X, FileText, Loader2, Download, Copy } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useToast } from '../context/ToastContext';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  isLoading: boolean;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose, content, isLoading }) => {
  const toast = useToast();

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Summary copied to clipboard!');
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `metric_bowler_summary_${new Date().toISOString().split('T')[0]}.md`;
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
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 sm:mx-0 sm:h-10 sm:w-10">
                <FileText className="h-6 w-6 text-teal-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Comprehensive Summary
                    </h3>
                    <button
                    onClick={onClose}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="mt-4 min-h-[300px] max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-10">
                            <Loader2 className="w-12 h-12 animate-spin text-teal-600 mb-4" />
                            <p className="text-gray-500">Generating comprehensive summary...</p>
                            <p className="text-gray-400 text-sm mt-2">This may take a few moments.</p>
                        </div>
                    ) : (
                        <div className="prose prose-sm max-w-none">
                            <MarkdownRenderer content={content} />
                        </div>
                    )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDownload}
              disabled={isLoading || !content}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
