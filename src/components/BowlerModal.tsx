import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Info, User, Target, Users, Tag, List, LayoutGrid } from 'lucide-react';
import { Bowler, Metric } from '../context/AppContext';
import clsx from 'clsx';
import { generateShortId } from '../utils/idUtils';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface BowlerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Bowler, 'id'>) => void;
  onDelete?: (id: string) => void;
  initialData?: Bowler;
}

const BowlerModal = ({ isOpen, onClose, onSave, onDelete, initialData }: BowlerModalProps) => {
  const [activeTab, setActiveTab] = useState<'General' | 'Metrics'>('General');
  const toast = useToast();
  const { user } = useAuth();
  
  // General State
  const [generalData, setGeneralData] = useState({
    name: '',
    description: '',
    group: '',
    champion: '',
    commitment: '',
    tag: '',
  });

  // Metrics State
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('General');
      if (initialData) {
        setGeneralData({
          name: initialData.name,
          description: initialData.description || '',
          group: initialData.group || '',
          champion: initialData.champion || '',
          commitment: initialData.commitment || '',
          tag: initialData.tag || '',
        });
        setMetrics(initialData.metrics || []);
      } else {
        setGeneralData({
          name: '',
          description: '',
          group: user?.plant || '',
          champion: '',
          commitment: '',
          tag: '',
        });
        setMetrics([]);
      }
    }
  }, [isOpen, initialData, user]);

  if (!isOpen) return null;

  const handleAddMetric = () => {
    const newMetric: Metric = {
      id: generateShortId(),
      name: '',
      definition: '',
      owner: '',
      scope: '',
      attribute: '',
      targetMeetingRule: 'gte'
    };
    setMetrics([...metrics, newMetric]);
  };

  const handleUpdateMetric = (id: string, field: keyof Metric, value: string) => {
    setMetrics(metrics.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleDeleteMetric = (id: string) => {
    setMetrics(metrics.filter(m => m.id !== id));
  };

  const handleSubmit = () => {
    if (!generalData.name.trim()) {
        toast.error('Please provide a name for the Bowler List.');
        return;
    }
    
    onSave({
      ...generalData,
      metrics
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
          aria-hidden="true" 
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-slate-200">
          <div className="bg-white">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-blue-200">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {initialData ? 'Refine Metric Bowler' : 'Design New Bowler'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    {initialData
                      ? 'Configure performance dimensions and strategic metrics.'
                      : 'Create a new structural framework for performance tracking.'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-slate-600 transition-all hover:shadow-sm border border-transparent hover:border-slate-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 bg-white border-b border-slate-100">
              <nav className="-mb-px flex space-x-1 py-2">
                {[
                  { id: 'General', label: 'Framework', icon: LayoutGrid },
                  { id: 'Metrics', label: 'Metrics Library', icon: List }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={clsx(
                      "flex items-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-200",
                      activeTab === tab.id
                        ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    )}
                  >
                    <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-indigo-600" : "text-slate-400")} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="px-6 py-6 min-h-[450px] max-h-[70vh] overflow-y-auto bg-white">
                {activeTab === 'General' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Summary Info */}
                        <div className="flex items-start gap-4 rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm border border-indigo-50">
                                <Info className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-indigo-900">Strategic Alignment</p>
                                <p className="text-xs text-indigo-700 leading-relaxed">
                                    Define the structural metadata for this performance dashboard. Groups and tags enable cross-functional consolidation and executive reporting.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Primary Info */}
                            <div className="space-y-4">
                                <div className="space-y-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Identification</h4>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">Bowler Identity *</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-slate-200 rounded-xl shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium placeholder:text-slate-300"
                                            value={generalData.name}
                                            onChange={(e) => setGeneralData({ ...generalData, name: e.target.value })}
                                            placeholder="e.g. Operations Excellence 2024"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">Strategic Intent</label>
                                        <textarea
                                            className="w-full bg-white border border-slate-200 rounded-xl shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium placeholder:text-slate-300 min-h-[100px] resize-none"
                                            value={generalData.description}
                                            onChange={(e) => setGeneralData({ ...generalData, description: e.target.value })}
                                            placeholder="Describe the performance scope and objectives..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Organization Info */}
                            <div className="space-y-4">
                                <div className="space-y-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ownership & Structure</h4>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1 flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                Champion
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full bg-white border border-slate-200 rounded-xl shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                                value={generalData.champion}
                                                onChange={(e) => setGeneralData({ ...generalData, champion: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1 flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                                Functional Team
                                            </label>
                                            <select
                                                className="w-full bg-white border border-slate-200 rounded-xl shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                                value={generalData.commitment}
                                                onChange={(e) => setGeneralData({ ...generalData, commitment: e.target.value })}
                                            >
                                                <option value="">Assign Team</option>
                                                {['Quality', 'Engineering', 'R&D', 'Workshop', 'Production', 'GBS', 'Procurement', 'Planning', 'EH&S', 'Facility', 'Sales & Marketing'].map(team => (
                                                    <option key={team} value={team}>{team}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1 flex items-center gap-1.5">
                                                    <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                                                    Group
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white border border-slate-200 rounded-xl shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                                    value={generalData.group}
                                                    onChange={(e) => setGeneralData({ ...generalData, group: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1 flex items-center gap-1.5">
                                                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                                                    Tags
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Comma separated"
                                                    className="w-full bg-white border border-slate-200 rounded-xl shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium placeholder:text-slate-300"
                                                    value={generalData.tag}
                                                    onChange={(e) => setGeneralData({ ...generalData, tag: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Metrics' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <List className="h-5 w-5 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Performance Metrics</p>
                                    <p className="text-xs text-slate-500">
                                        {metrics.length === 0
                                            ? 'Begin by adding your first strategic metric'
                                            : `${metrics.length} defined metric${metrics.length > 1 ? 's' : ''}`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleAddMetric}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95 gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                New Metric
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {metrics.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/20">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                                        <Target className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-400">No metrics configured yet</p>
                                    <button 
                                        onClick={handleAddMetric}
                                        className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
                                    >
                                        Click here to add one
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {metrics.map((metric, index) => (
                                        <div 
                                            key={metric.id} 
                                            className="group border border-slate-100 rounded-2xl p-5 bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-100 transition-all relative"
                                        >
                                            <button 
                                                onClick={() => handleDeleteMetric(metric.id)}
                                                className="absolute top-4 right-4 p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                                                title="Remove Metric"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-black text-white shadow-lg shadow-slate-200">
                                                    {(index + 1).toString().padStart(2, '0')}
                                                </div>
                                                <div className="h-px flex-1 bg-slate-50" />
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                                <div className="lg:col-span-2 space-y-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Metric Title</label>
                                                        <input
                                                            type="text"
                                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                            value={metric.name}
                                                            onChange={(e) => handleUpdateMetric(metric.id, 'name', e.target.value)}
                                                            placeholder="Metric name..."
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Technical Definition</label>
                                                        <textarea
                                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-2 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[80px] resize-none"
                                                            value={metric.definition || ''}
                                                            onChange={(e) => handleUpdateMetric(metric.id, 'definition', e.target.value)}
                                                            placeholder="How is this measured?"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Owner</label>
                                                        <input
                                                            type="text"
                                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                            value={metric.owner || ''}
                                                            onChange={(e) => handleUpdateMetric(metric.id, 'owner', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Data Type</label>
                                                        <select
                                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                            value={metric.attribute || ''}
                                                            onChange={(e) => handleUpdateMetric(metric.id, 'attribute', e.target.value)}
                                                        >
                                                            <option value="">Select Type</option>
                                                            <option value="Accumulative">Accumulative</option>
                                                            <option value="Individual data">Individual data</option>
                                                            <option value="Moving average">Moving average</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Target Logic</label>
                                                        <select
                                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                            value={metric.targetMeetingRule}
                                                            onChange={(e) => handleUpdateMetric(metric.id, 'targetMeetingRule', e.target.value as any)}
                                                        >
                                                            <option value="gte">Higher is better (≥)</option>
                                                            <option value="lte">Lower is better (≤)</option>
                                                            <option value="within_range">Within Range</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
               <div className="order-2 sm:order-1">
                 {initialData && onDelete && (
                   <button
                     type="button"
                     className="px-4 py-2 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-2 group"
                     onClick={() => onDelete(initialData.id)}
                   >
                     <Trash2 className="w-4 h-4 text-rose-400 group-hover:text-rose-600 transition-colors" />
                     Delete Bowler
                   </button>
                 )}
               </div>
               <div className="order-1 sm:order-2 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-white hover:text-slate-700 transition-all border border-transparent hover:border-slate-200"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-8 py-2 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-indigo-600 shadow-lg shadow-slate-200 hover:shadow-indigo-100 transition-all active:scale-95"
                  >
                    {initialData ? 'Save Framework' : 'Launch Bowler'}
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BowlerModal;
