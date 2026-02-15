import { useState, useEffect, useMemo } from 'react';
import { X, Trash2, Info, FileText, Users, Target, Calendar, LayoutGrid, ClipboardList, TrendingUp, CheckCircle2, Clock, ChevronDown, Plus } from 'lucide-react';
import { A3Case } from '../context/AppContext';
import { useApp } from '../context/AppContext';
import clsx from 'clsx';

interface A3CaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<A3Case, 'id'>) => void;
  onDelete?: (id: string) => void;
  initialData?: A3Case;
}

const A3CaseModal = ({ isOpen, onClose, onSave, onDelete, initialData }: A3CaseModalProps) => {
  const { bowlers } = useApp();
  const [activeTab, setActiveTab] = useState<'Core' | 'Context' | 'Alignment'>('Core');
  const [formData, setFormData] = useState<Omit<A3Case, 'id'>>({
    title: '',
    description: '',
    owner: '',
    group: '',
    tag: '',
    linkedMetricIds: [],
    priority: 'Medium',
    startDate: '',
    endDate: '',
    status: 'In Progress',
  });

  const metricOptions = useMemo(
    () =>
      bowlers.flatMap(bowler =>
        (bowler.metrics || []).map(metric => ({
          id: metric.id,
          label: `${bowler.name} – ${metric.name}`,
        })),
      ),
    [bowlers],
  );

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title,
          description: initialData.description || '',
          owner: initialData.owner || '',
          group: initialData.group || '',
          tag: initialData.tag || '',
          linkedMetricIds: initialData.linkedMetricIds || [],
          priority: initialData.priority || 'Medium',
          startDate: initialData.startDate || '',
          endDate: initialData.endDate || '',
          status: initialData.status || 'In Progress',
        });
      } else {
        setFormData({
          title: '',
          description: '',
          owner: '',
          group: '',
          tag: '',
          linkedMetricIds: [],
          priority: 'Medium',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          status: 'In Progress',
        });
      }
      setActiveTab('Core');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const tabs = [
    { id: 'Core', label: 'Problem & Scope', icon: ClipboardList, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'Context', label: 'Ownership & Timing', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'Alignment', label: 'Strategic Alignment', icon: Target, color: 'text-purple-500', bg: 'bg-purple-50' },
  ] as const;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-sm border border-emerald-100/50">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 leading-none">
                {initialData ? 'Refine A3 Case' : 'Initialize A3 Case'}
              </h3>
              <p className="mt-1.5 text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Structured problem solving framework
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 bg-slate-50/50 border-b border-slate-100 flex gap-1 pt-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
          <form id="a3-case-form" onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'Core' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Strategic Context */}
                <div className="flex items-start gap-4 rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-emerald-50">
                    <Info className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-emerald-900">Problem Definition</p>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      Clearly define the gap between current state and target state. This title will be used across all reporting and executive summaries.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        A3 Case Title
                        <span className="text-red-500">*</span>
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Required</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Reduce Logistics Lead Time by 20%"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium placeholder:text-slate-400"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Problem Description</label>
                    <textarea
                      rows={4}
                      placeholder="Provide background on why this problem is being addressed now..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-medium placeholder:text-slate-400 resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Priority Level</label>
                      <div className="relative">
                        <select
                          className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold appearance-none cursor-pointer"
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        >
                          <option value="Low">Low Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="High">High Priority</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Current Status</label>
                      <div className="relative">
                        <select
                          className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold appearance-none cursor-pointer"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Context' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">A3 Owner / Lead</label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-focus-within:bg-blue-50 group-focus-within:border-blue-100 transition-colors">
                        <Users className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
                      </div>
                      <input
                        type="text"
                        placeholder="Name of project lead"
                        className="w-full pl-14 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium"
                        value={formData.owner}
                        onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Strategic Group</label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-focus-within:bg-blue-50 group-focus-within:border-blue-100 transition-colors">
                        <LayoutGrid className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Operations, Quality"
                        className="w-full pl-14 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium"
                        value={formData.group}
                        onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Strategic Tags</label>
                  <p className="text-[11px] text-slate-500 font-medium">Use commas to separate multiple tags for cross-functional reporting.</p>
                  <input
                    type="text"
                    placeholder="e.g. Safety, Cost-Reduction, Q1-Goal"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  />
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <label className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Project Timeline
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                      <div className="relative group">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                        <input
                          type="date"
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold cursor-pointer"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Completion</label>
                      <div className="relative group">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                        <input
                          type="date"
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold cursor-pointer"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Alignment' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start gap-4 rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-purple-50">
                    <Target className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-purple-900">Performance Linkage</p>
                    <p className="text-xs text-purple-700 leading-relaxed">
                      Connect this A3 to a specific Bowler metric to track how your problem-solving efforts impact high-level performance indicators.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">Target Metric</label>
                  {metricOptions.length === 0 ? (
                    <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Target className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-500">No Metrics Found</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">Create metrics in the Metric Bowler first to enable linkage.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                      <label className={clsx(
                        "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group",
                        (!formData.linkedMetricIds || formData.linkedMetricIds.length === 0)
                          ? "bg-purple-50 border-purple-200 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}>
                        <div className={clsx(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          (!formData.linkedMetricIds || formData.linkedMetricIds.length === 0)
                            ? "border-purple-500 bg-purple-500"
                            : "border-slate-300 group-hover:border-slate-400"
                        )}>
                          {(!formData.linkedMetricIds || formData.linkedMetricIds.length === 0) && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <input
                          type="radio"
                          name="linkedMetric"
                          className="hidden"
                          checked={!formData.linkedMetricIds || formData.linkedMetricIds.length === 0}
                          onChange={() => setFormData({ ...formData, linkedMetricIds: [] })}
                        />
                        <div className="flex flex-col">
                          <span className={clsx(
                            "text-sm font-bold",
                            (!formData.linkedMetricIds || formData.linkedMetricIds.length === 0) ? "text-purple-900" : "text-slate-600"
                          )}>None (Standalone A3)</span>
                          <span className="text-[10px] font-medium text-slate-400">Independent problem solving</span>
                        </div>
                      </label>

                      {metricOptions.map(option => {
                        const selectedId = (formData.linkedMetricIds && formData.linkedMetricIds[0]) || '';
                        const isSelected = selectedId === option.id;
                        return (
                          <label key={option.id} className={clsx(
                            "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group",
                            isSelected ? "bg-purple-50 border-purple-200 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
                          )}>
                            <div className={clsx(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                              isSelected ? "border-purple-500 bg-purple-500" : "border-slate-300 group-hover:border-slate-400"
                            )}>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <input
                              type="radio"
                              name="linkedMetric"
                              className="hidden"
                              checked={isSelected}
                              onChange={() => setFormData({ ...formData, linkedMetricIds: [option.id] })}
                            />
                            <div className="flex flex-col">
                              <span className={clsx("text-sm font-bold", isSelected ? "text-purple-900" : "text-slate-700")}>
                                {option.label.split(' – ')[1]}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                                  {option.label.split(' – ')[0]}
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this A3 case? This action cannot be undone.')) {
                    onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 group"
                title="Delete A3 Case"
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
              type="submit"
              form="a3-case-form"
              className="px-8 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 transition-all active:scale-95 flex items-center gap-2"
            >
              {initialData ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {initialData ? 'Save Changes' : 'Initialize Case'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default A3CaseModal;
