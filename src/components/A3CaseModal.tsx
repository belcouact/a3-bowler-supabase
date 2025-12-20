import { useState, useEffect } from 'react';
import { X, Trash2, Info } from 'lucide-react';
import { A3Case } from '../context/AppContext';

interface A3CaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<A3Case, 'id'>) => void;
  onDelete?: (id: string) => void;
  initialData?: A3Case;
}

const A3CaseModal = ({ isOpen, onClose, onSave, onDelete, initialData }: A3CaseModalProps) => {
  const [formData, setFormData] = useState<Omit<A3Case, 'id'>>({
    title: '',
    description: '',
    owner: '',
    group: '',
    tag: '',
    priority: 'Medium',
    startDate: '',
    endDate: '',
    status: 'In Progress',
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title,
          description: initialData.description || '',
          owner: initialData.owner || '',
          group: initialData.group || '',
          tag: initialData.tag || '',
          priority: initialData.priority || 'Medium',
          startDate: initialData.startDate || '',
          endDate: initialData.endDate || '',
          status: initialData.status || 'In Progress',
        });
      } else {
        // Reset form on open
        setFormData({
          title: '',
          description: '',
          owner: '',
          group: '',
          tag: '',
          priority: 'Medium',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          status: 'In Progress',
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const priorityBadgeClass =
    formData.priority === 'High'
      ? 'bg-red-50 text-red-700 border-red-200'
      : formData.priority === 'Medium'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

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
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg leading-6 font-semibold text-gray-900" id="modal-title">
                    {initialData ? 'Edit A3 Case' : 'New A3 Case'}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Capture the problem, ownership, timeline, and priority for this A3.
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="ml-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4 flex items-start gap-2 rounded-md border border-emerald-50 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-800">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
              <p>
                Use this card to define a clear problem statement, assign ownership, and align on timing so your A3 stays actionable.
              </p>
            </div>
            
            <form id="a3-case-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                <div>
                  <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">Case Overview</label>
                  <p className="mt-1 text-xs text-gray-500">
                    Give this A3 a concise, searchable title and describe the problem you are solving.
                  </p>
                </div>
                <div>
                  <label className="mt-2 block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description of the problem, impact, or background..."
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">Ownership & grouping</label>
                    <p className="mt-1 text-xs text-gray-500">
                      Clarify who owns this A3 and how it is grouped in your portfolio.
                    </p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end space-y-1">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      {formData.group || 'Ungrouped'}
                    </span>
                    {formData.tag && (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 border border-indigo-100">
                        {formData.tag}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 flex items-center" title="Group multiple A3 cases under one group">
                      Group
                      <Info className="w-4 h-4 ml-1 text-gray-400 cursor-help" />
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.group}
                      onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 flex items-center" title="For consolidation purpose">
                      Tag
                      <Info className="w-4 h-4 ml-1 text-gray-400 cursor-help" />
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.tag}
                      onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">Priority & status</label>
                    <p className="mt-1 text-xs text-gray-500">
                      Use priority and status to signal urgency and current progress.
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${priorityBadgeClass}`}>
                    Priority: {formData.priority}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-3">
                <div>
                  <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">Timeline</label>
                  <p className="mt-1 text-xs text-gray-500">
                    Set realistic start and end dates so the team can track progress.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
             <div className="order-2 sm:order-1 w-full sm:w-auto">
               {initialData && onDelete && (
                 <button
                   type="button"
                   className="w-full sm:w-auto inline-flex justify-center items-center rounded-md border border-transparent px-4 py-2 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm font-medium"
                   onClick={() => onDelete(initialData.id)}
                 >
                   <Trash2 className="w-4 h-4 mr-2" />
                   Delete
                 </button>
               )}
             </div>
             <div className="order-1 sm:order-2 flex flex-col sm:flex-row-reverse w-full sm:w-auto">
                <button
                  type="submit"
                  form="a3-case-form"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {initialData ? 'Save Changes' : 'Create Case'}
                </button>
                <button
                  type="button"
                  className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                  onClick={onClose}
                >
                  Cancel
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default A3CaseModal;
