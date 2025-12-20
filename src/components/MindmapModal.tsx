import { useState, useEffect } from 'react';
import { X, Info, BrainCircuit } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface MindmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
}

export const MindmapModal = ({ isOpen, onClose, mode }: MindmapModalProps) => {
  const { dashboardMarkdown, dashboardTitle, updateDashboardMarkdown } = useApp();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit') {
        setTitle(dashboardTitle || '');
        setText(dashboardMarkdown || '');
      } else {
        setTitle('');
        setText('');
      }
    }
  }, [isOpen, dashboardMarkdown, dashboardTitle, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDashboardMarkdown(text || '', title || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="mindmap-modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75" />
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg leading-6 font-semibold text-gray-900" id="mindmap-modal-title">
                    Mindmap ideas
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">Add a title and markdown content for your mindmap.</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="ml-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4 flex items-start gap-2 rounded-md border border-indigo-50 bg-indigo-50/80 px-3 py-2 text-xs text-indigo-800">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
              <p>
                Use a clear title and markdown bullets. The text content will drive the mindmap structure.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                <div>
                  <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">Title</label>
                  <p className="mt-1 text-xs text-gray-500">Short, descriptive name for this mindmap.</p>
                  <input
                    type="text"
                    className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Quarterly performance review ideas"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">Mindmap Text</label>
                  <p className="mt-1 text-xs text-gray-500">
                    This markdown text drives the nodes in the mindmap. You can refine it anytime.
                  </p>
                  <textarea
                    rows={12}
                    className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 font-mono text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="# Main topic&#10;- Key point&#10;  - Sub point"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Save & Update Mindmap
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
