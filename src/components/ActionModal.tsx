import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { generateShortId } from '../utils/idUtils';

export interface ActionTask {
  id: string;
  name: string;
  description?: string;
  owner: string;
  group?: string;
  startDate: string;
  endDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
}

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: ActionTask) => void;
  onDelete?: (id: string) => void;
  initialData?: ActionTask | null;
  defaultStartDate?: string;
}

const ActionModal = ({ isOpen, onClose, onSave, onDelete, initialData, defaultStartDate }: ActionModalProps) => {
  const [formData, setFormData] = useState<ActionTask>({
    id: '',
    name: '',
    description: '',
    owner: '',
    group: '',
    startDate: '',
    endDate: '',
    status: 'Not Started',
    progress: 0,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        // Reset for new item
        const today = new Date().toISOString().split('T')[0];
        const start = defaultStartDate || today;
        const end = new Date(new Date(start).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // +7 days
        
        setFormData({
          id: generateShortId(),
          name: '',
          description: '',
          owner: '',
          group: '',
          startDate: start,
          endDate: end,
          status: 'Not Started',
          progress: 0,
        });
      }
    }
  }, [isOpen, initialData, defaultStartDate]);

  if (!isOpen) return null;

  const statusBadgeClass =
    formData.status === 'Completed'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : formData.status === 'In Progress'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-gray-100 text-gray-700 border-gray-200';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-md">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg leading-6 font-semibold text-gray-900" id="modal-title">
                    {initialData ? 'Edit Action Item' : 'New Action Item'}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Define clear, owned actions that support your A3 plan.
                  </p>
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
                Use this card to break the A3 into specific tasks with owners, timing, and progress.
              </p>
            </div>
            
            <form id="action-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                <div>
                  <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">Task overview</label>
                  <p className="mt-1 text-xs text-gray-500">
                    Name the action item and describe what needs to be done.
                  </p>
                </div>
                <div>
                  <label className="mt-2 block text-sm font-medium text-gray-700">Task Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">Ownership & grouping</label>
                    <p className="mt-1 text-xs text-gray-500">
                      Assign who is responsible and how this task is grouped.
                    </p>
                  </div>
                  {formData.group && (
                    <span className="hidden sm:inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      {formData.group}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Owner</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Group</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.group || ''}
                      onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">Status & progress</label>
                    <p className="mt-1 text-xs text-gray-500">
                      Track how far this action has moved and what state it is in.
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass}`}>
                    {formData.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <option>Not Started</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Progress: {formData.progress}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      value={formData.progress}
                      onChange={(e) =>
                        setFormData({ ...formData, progress: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-3">
                <div>
                  <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">Timeline</label>
                  <p className="mt-1 text-xs text-gray-500">
                    Set start and end dates so the team can follow up on time.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row-reverse justify-between items-center gap-3 sm:gap-0">
            <div className="flex flex-col sm:flex-row-reverse w-full sm:w-auto">
              <button
                type="submit"
                form="action-form"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => {
                   if(confirm('Are you sure you want to delete this task?')) {
                     onDelete(initialData.id);
                     onClose();
                   }
                }}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-100 text-base font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionModal;
