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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-sm border border-indigo-100/50">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 leading-none">
                {initialData ? 'Refine Metric Bowler' : 'Design New Bowler'}
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-1.5">
                {initialData
                  ? 'Configure performance dimensions and strategic metrics.'
                  : 'Create a new structural framework for performance tracking.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

            {/* Navigation Tabs */}
            <div className="px-6 bg-slate-50/50 border-b border-slate-100 flex gap-1 pt-3">
              {[
                { id: 'General', label: 'Framework', icon: LayoutGrid, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { id: 'Metrics', label: 'Metrics Library', icon: List, color: 'text-blue-600', bg: 'bg-blue-50' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={clsx(
                    "px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 border-x border-t -mb-px relative group",
                    activeTab === tab.id
                      ? "bg-white text-slate-900 border-slate-100 shadow-[0_-2px_10px_-3px_rgba(0,0,0,0.05)]"
                      : "text-slate-500 hover:text-slate-700 border-transparent hover:bg-slate-100/50"
                  )}
                >
                  <div className={clsx(
                    "p-1 rounded-md transition-colors",
                    activeTab === tab.id ? tab.bg : "bg-transparent group-hover:bg-slate-200/50"
                  )}>
                    <tab.icon className={clsx("w-3.5 h-3.5", activeTab === tab.id ? tab.color : "text-slate-400")} />
                  </div>
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className={clsx("absolute bottom-0 left-0 right-0 h-0.5", tab.bg.replace('bg-', 'bg-').replace('-50', '-500'))} />
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {activeTab === 'General' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Summary Info */}
                        <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 px-2.5 py-2">
                            <div className="p-1 bg-white rounded-lg shadow-sm border border-indigo-50">
                                <Info className="h-3.5 w-3.5 text-indigo-500" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold text-indigo-900">Strategic Alignment</p>
                                <p className="text-[10px] text-indigo-700 leading-relaxed">
                                    Define the structural metadata for this performance dashboard. Groups and tags enable cross-functional consolidation and executive reporting.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {/* Primary Info */}
                            <div className="space-y-2">
                                <div className="space-y-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/30">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="w-1 h-2.5 bg-indigo-500 rounded-full" />
                                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identification</h4>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1 ml-1">Bowler Identity *</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-slate-200 rounded-lg shadow-sm py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-medium placeholder:text-slate-300"
                                            value={generalData.name}
                                            onChange={(e) => setGeneralData({ ...generalData, name: e.target.value })}
                                            placeholder="e.g. Operations Excellence 2024"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1 ml-1">Strategic Intent</label>
                                        <textarea
                                            className="w-full bg-white border border-slate-200 rounded-lg shadow-sm py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-medium placeholder:text-slate-300 min-h-[60px] resize-none"
                                            value={generalData.description}
                                            onChange={(e) => setGeneralData({ ...generalData, description: e.target.value })}
                                            placeholder="Describe the performance scope and objectives..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Organization Info */}
                            <div className="space-y-2">
                                <div className="space-y-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/30">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="w-1 h-2.5 bg-emerald-500 rounded-full" />
                                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ownership & Structure</h4>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-600 mb-1 ml-1 flex items-center gap-1">
                                                <User className="w-2.5 h-2.5 text-slate-400" />
                                                Champion
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full bg-white border border-slate-200 rounded-lg shadow-sm py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-medium"
                                                value={generalData.champion}
                                                onChange={(e) => setGeneralData({ ...generalData, champion: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-600 mb-1 ml-1 flex items-center gap-1">
                                                <Users className="w-2.5 h-2.5 text-slate-400" />
                                                Functional Team
                                            </label>
                                            <select
                                                className="w-full bg-white border border-slate-200 rounded-lg shadow-sm py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-medium"
                                                value={generalData.commitment}
                                                onChange={(e) => setGeneralData({ ...generalData, commitment: e.target.value })}
                                            >
                                                <option value="">Assign Team</option>
                                                {['Quality', 'Engineering', 'R&D', 'Workshop', 'Production', 'GBS', 'Procurement', 'Planning', 'EH&S', 'Facility', 'Sales & Marketing'].map(team => (
                                                    <option key={team} value={team}>{team}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-600 mb-1 ml-1 flex items-center gap-1">
                                                    <LayoutGrid className="w-2.5 h-2.5 text-slate-400" />
                                                    Group
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white border border-slate-200 rounded-lg shadow-sm py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-medium"
                                                    value={generalData.group}
                                                    onChange={(e) => setGeneralData({ ...generalData, group: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-600 mb-1 ml-1 flex items-center gap-1">
                                                    <Tag className="w-2.5 h-2.5 text-slate-400" />
                                                    Tags
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Comma separated"
                                                    className="w-full bg-white border border-slate-200 rounded-lg shadow-sm py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-medium placeholder:text-slate-300"
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
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1 bg-white rounded-lg shadow-sm">
                                    <List className="h-3.5 w-3.5 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900">Performance Metrics</p>
                                    <p className="text-[10px] text-slate-500">
                                        {metrics.length === 0
                                            ? 'Begin by adding your first strategic metric'
                                            : `${metrics.length} defined metric${metrics.length > 1 ? 's' : ''}`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleAddMetric}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95 gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                New Metric
                            </button>
                        </div>
                        
                        <div className="space-y-2.5">
                            {metrics.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/20">
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3">
                                        <Target className="w-6 h-6 text-slate-200" />
                                    </div>
                                    <p className="text-xs font-medium text-slate-400">No metrics configured yet</p>
                                    <button 
                                        onClick={handleAddMetric}
                                        className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
                                    >
                                        Click here to add one
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2.5">
                                    {metrics.map((metric, index) => (
                                        <div 
                                            key={metric.id} 
                                            className="group border border-slate-100 rounded-2xl p-2.5 bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-100 transition-all relative"
                                        >
                                            <button 
                                                onClick={() => handleDeleteMetric(metric.id)}
                                                className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                                                title="Remove Metric"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>

                                            <div className="flex items-center gap-2.5 mb-2.5">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-[9px] font-black text-white shadow-lg shadow-slate-200">
                                                    {(index + 1).toString().padStart(2, '0')}
                                                </div>
                                                <div className="h-px flex-1 bg-slate-50" />
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
                                                <div className="lg:col-span-2 space-y-2.5">
                                                    <div>
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Metric Title</label>
                                                        <input
                                                            type="text"
                                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-1 px-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                            value={metric.name}
                                                            onChange={(e) => handleUpdateMetric(metric.id, 'name', e.target.value)}
                                                            placeholder="Metric name..."
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Technical Definition</label>
                                                        <textarea
                                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-1 px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[50px] resize-none"
                                                            value={metric.definition || ''}
                                                            onChange={(e) => handleUpdateMetric(metric.id, 'definition', e.target.value)}
                                                            placeholder="How is this measured?"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2.5">
                                                    <div>
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Owner</label>
                                                        <input
                                                            type="text"
                                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-1 px-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                            value={metric.owner || ''}
                                                            onChange={(e) => handleUpdateMetric(metric.id, 'owner', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Data Type</label>
                                                        <select
                                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-1 px-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
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
                                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Target Logic</label>
                                                        <select
                                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-1 px-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
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
        <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this Bowler? This action cannot be undone.')) {
                    onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 group"
                title="Delete Bowler"
              >
                <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-white rounded-xl transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:scale-95 flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              {initialData ? 'Save Changes' : 'Create Bowler'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BowlerModal;
