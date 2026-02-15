import { useState, useEffect } from 'react';
import { X, Calendar, User, CheckCircle2, Circle, Clock, Sparkles, LayoutGrid } from 'lucide-react';
import { generateShortId } from '../utils/idUtils';
import clsx from 'clsx';

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
  const [isClosing, setIsClosing] = useState(false);
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
      setIsClosing(false);
      if (initialData) {
        setFormData(initialData);
      } else {
        const today = new Date().toISOString().split('T')[0];
        const start = defaultStartDate || today;
        const end = new Date(new Date(start).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
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

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    handleClose();
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className={clsx(
            "fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out",
            isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal Panel */}
        <div 
            className={clsx(
                "inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-white/20 ring-1 ring-black/5",
                isClosing ? "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" : "opacity-100 translate-y-0 sm:scale-100 duration-300 ease-out"
            )}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-100 flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                {initialData ? <Sparkles className="w-6 h-6" /> : <LayoutGrid className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {initialData ? 'Edit Action Item' : 'New Action Item'}
                </h3>
                <p className="mt-1 text-sm text-slate-500 font-medium">
                  Define tasks, assign ownership, and track progress.
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form id="action-form" onSubmit={handleSubmit} className="px-6 py-6 space-y-6 bg-white/50">
            
            {/* Task Overview Section */}
            <div className="space-y-4">
                <div className="relative">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        Task Name
                    </label>
                    <input
                        type="text"
                        required
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-lg font-semibold py-3 px-4 bg-slate-50/50 transition-all hover:bg-white focus:bg-white"
                        placeholder="e.g., Conduct root cause analysis workshop"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        autoFocus
                    />
                </div>
                <div className="relative">
                     <textarea
                        rows={3}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4 bg-slate-50/50 transition-all hover:bg-white focus:bg-white resize-none"
                        placeholder="Describe the deliverables and acceptance criteria..."
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                </div>
            </div>

            {/* Grid Layout for Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Ownership */}
                <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/80">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-200 pb-2 mb-2">
                        <User className="w-4 h-4 text-indigo-500" />
                        <span>Ownership</span>
                    </div>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Owner</label>
                            <input
                                type="text"
                                className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2"
                                placeholder="e.g., John Doe"
                                value={formData.owner}
                                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Group / Workstream</label>
                            <input
                                type="text"
                                className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2"
                                placeholder="e.g., Engineering"
                                value={formData.group || ''}
                                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/80">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-200 pb-2 mb-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <span>Timeline</span>
                    </div>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                            <input
                                type="date"
                                required
                                className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                            <input
                                type="date"
                                required
                                className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Status & Progress - Full Width */}
                <div className="sm:col-span-2 space-y-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-100/80">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span>Status & Progress</span>
                        </div>
                        <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                            {formData.progress}% Complete
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                        <div>
                             <label className="block text-xs font-semibold text-slate-500 mb-2">Current Status</label>
                             <div className="flex gap-2">
                                {[
                                    { value: 'Not Started', icon: Circle, color: 'text-slate-400', bg: 'bg-slate-100' },
                                    { value: 'In Progress', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                                    { value: 'Completed', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                                ].map((status) => (
                                    <button
                                        key={status.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: status.value as any })}
                                        className={clsx(
                                            "flex-1 flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200",
                                            formData.status === status.value
                                                ? `border-${status.color.split('-')[1]}-500 ${status.bg} ring-1 ring-${status.color.split('-')[1]}-500`
                                                : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                        )}
                                    >
                                        <status.icon className={clsx("w-5 h-5 mb-1", formData.status === status.value ? status.color : "text-slate-400")} />
                                        <span className={clsx("text-[10px] font-bold uppercase", formData.status === status.value ? "text-slate-900" : "text-slate-500")}>
                                            {status.value}
                                        </span>
                                    </button>
                                ))}
                             </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Progress Bar</label>
                            <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className={clsx(
                                        "absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full",
                                        formData.status === 'Completed' ? "bg-emerald-500" : "bg-indigo-500"
                                    )}
                                    style={{ width: `${formData.progress}%` }}
                                />
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                className="w-full mt-3 accent-indigo-600 cursor-pointer"
                                value={formData.progress}
                                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

            </div>

          </form>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3 border-t border-slate-100">
            <button
              type="submit"
              form="action-form"
              className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg shadow-indigo-500/30 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-base font-bold text-white hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.02]"
            >
              {initialData ? 'Save Changes' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl border border-slate-200 shadow-sm px-6 py-2.5 bg-white text-base font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
            >
              Cancel
            </button>
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => {
                   if(confirm('Are you sure you want to delete this task?')) {
                     onDelete(initialData.id);
                     handleClose();
                   }
                }}
                className="w-full sm:w-auto sm:mr-auto inline-flex justify-center items-center rounded-xl border border-transparent px-4 py-2.5 text-base font-bold text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
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
