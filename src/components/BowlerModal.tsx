import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Info, User } from 'lucide-react';
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
    <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg leading-6 font-semibold text-gray-900">
                    {initialData ? 'Edit Metric Bowler' : 'New Metric Bowler'}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {initialData
                      ? 'Update bowler details and metrics used in your dashboards.'
                      : 'Set up a new bowler with key ownership and metric information.'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="ml-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('General')}
                  className={clsx(
                    "whitespace-nowrap py-3 px-3 border-b-2 font-medium text-sm rounded-t-md transition-colors",
                    activeTab === 'General'
                      ? "border-blue-500 text-blue-700 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200 hover:bg-gray-50"
                  )}
                >
                  General
                </button>
                <button
                  onClick={() => setActiveTab('Metrics')}
                  className={clsx(
                    "whitespace-nowrap py-3 px-3 border-b-2 font-medium text-sm rounded-t-md transition-colors",
                    activeTab === 'Metrics'
                      ? "border-blue-500 text-blue-700 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200 hover:bg-gray-50"
                  )}
                >
                  Metrics
                </button>
              </nav>
            </div>
            
            <div className="min-h-[300px]">
                {activeTab === 'General' && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-2 rounded-md border border-blue-50 bg-blue-50/80 px-3 py-2 text-xs text-blue-800">
                            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                            <p>
                                Capture how this bowler appears in reports, who owns it, and how it is grouped.
                            </p>
                        </div>

                        <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                            <div>
                                <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">Bowler overview</label>
                                <p className="mt-1 text-xs text-gray-500">
                                    Name this bowler and describe what performance area it represents.
                                </p>
                            </div>
                            <div>
                                <label className="mt-2 block text-sm font-medium text-gray-700">Bowler Name *</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={generalData.name}
                                    onChange={(e) => setGeneralData({ ...generalData, name: e.target.value })}
                                    placeholder="e.g. Plant A - Operations"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    rows={3}
                                    value={generalData.description}
                                    onChange={(e) => setGeneralData({ ...generalData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">Champion & team</label>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Clarify who champions this bowler and which team they belong to.
                                    </p>
                                </div>
                                <div className="hidden sm:flex flex-col items-end space-y-1">
                                    {generalData.champion && (
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-100">
                                            {generalData.champion}
                                        </span>
                                    )}
                                    {generalData.commitment && (
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                            {generalData.commitment}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Champion</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={generalData.champion}
                                        onChange={(e) => setGeneralData({ ...generalData, champion: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Commitment</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={generalData.commitment}
                                        onChange={(e) => setGeneralData({ ...generalData, commitment: e.target.value })}
                                    >
                                        <option value="">Select Team</option>
                                        <option value="Quality">Quality</option>
                                        <option value="Engineering">Engineering</option>
                                        <option value="R&D">R&D</option>
                                        <option value="Workshop">Workshop</option>
                                        <option value="Production">Production</option>
                                        <option value="GBS">GBS</option>
                                        <option value="Procurement">Procurement</option>
                                        <option value="Planning">Planning</option>
                                        <option value="EH&S">EH&S</option>
                                        <option value="Facility">Facility</option>
                                        <option value="Sales & Marketing">Sales & Marketing</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase">Group & tag</label>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Group and tag are mainly used for consolidation across multiple bowlers and reports. Enter multiple tags separated by commas.
                                    </p>
                                </div>
                                <div className="hidden sm:flex flex-col items-end space-y-1">
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                        {generalData.group || 'Ungrouped'}
                                    </span>
                                    {generalData.tag && (
                                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 border border-indigo-100">
                                            {generalData.tag}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 flex items-center" title="Group multiple bowlers under one group">
                                        Group
                                        <Info className="w-4 h-4 ml-1 text-gray-400 cursor-help" />
                                    </label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={generalData.group}
                                        onChange={(e) => setGeneralData({ ...generalData, group: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 flex items-center" title="Mainly used for consolidation across reports. Enter multiple tags separated by commas.">
                                        Tag
                                        <Info className="w-4 h-4 ml-1 text-gray-400 cursor-help" />
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Technical, Urgent"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={generalData.tag}
                                        onChange={(e) => setGeneralData({ ...generalData, tag: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Metrics' && (
                    <div className="space-y-4">
                         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-2 rounded-md border border-indigo-50 bg-indigo-50/80 px-3 py-2 text-xs text-indigo-800">
                                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
                                <p>
                                    Define the metrics tracked for this bowler, including ownership, scope, and targets.
                                </p>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-gray-500">
                                    {metrics.length === 0
                                        ? 'No metrics configured yet'
                                        : `${metrics.length} metric${metrics.length > 1 ? 's' : ''} configured`}
                                </span>
                                <button
                                    onClick={handleAddMetric}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Metric
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-4 max-h-[400px] overflow-y-auto">
                            {metrics.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 italic">
                                    No metrics added yet. Click "Add Metric" to start.
                                </div>
                            ) : (
                                metrics.map((metric, index) => (
                                    <div key={metric.id} className="border border-gray-200 rounded-md p-4 bg-gray-50 relative">
                                        <button 
                                            onClick={() => handleDeleteMetric(metric.id)}
                                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                            title="Remove Metric"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="mb-3 flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-700 shadow-sm">
                                                {index + 1}
                                            </div>
                                            <div className="text-xs font-semibold text-gray-600">
                                                Metric {index + 1}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-12 gap-3">
                                            <div className="col-span-4">
                                                <label className="block text-xs font-medium text-gray-500">Metric Name</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                                                    value={metric.name}
                                                    onChange={(e) => handleUpdateMetric(metric.id, 'name', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-8">
                                                <label className="block text-xs font-medium text-gray-500">Definition</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                                                    value={metric.definition}
                                                    onChange={(e) => handleUpdateMetric(metric.id, 'definition', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="block text-xs font-medium text-gray-500">Owner</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                                                    value={metric.owner}
                                                    onChange={(e) => handleUpdateMetric(metric.id, 'owner', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="block text-xs font-medium text-gray-500 flex items-center" title="What is included for this metric measurement">
                                                    Scope
                                                    <Info className="w-3 h-3 ml-1 text-gray-400 cursor-help" />
                                                </label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                                                    value={metric.scope}
                                                    onChange={(e) => handleUpdateMetric(metric.id, 'scope', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="block text-xs font-medium text-gray-500">Attribute</label>
                                                <select
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                                                    value={metric.attribute}
                                                    onChange={(e) => handleUpdateMetric(metric.id, 'attribute', e.target.value)}
                                                >
                                                    <option value="">Select Attribute</option>
                                                    <option value="Individual data">Individual data</option>
                                                    <option value="Moving average">Moving average</option>
                                                    <option value="Accumulative">Accumulative</option>
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <label className="block text-xs font-medium text-gray-500">Target Rule</label>
                                                <select
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                                                    value={metric.targetMeetingRule || 'gte'}
                                                    onChange={(e) => handleUpdateMetric(metric.id, 'targetMeetingRule', e.target.value)}
                                                >
                                                    <option value="gte">{'>='} Target</option>
                                                    <option value="lte">{'<='} Target</option>
                                                    <option value="within_range">Within Range</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

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
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleSubmit}
                >
                {initialData ? 'Save Changes' : 'Create Bowler'}
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

export default BowlerModal;
