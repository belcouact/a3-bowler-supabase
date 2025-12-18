import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { Metric, MetricData } from '../context/AppContext';

interface MetricEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: Metric | null;
  onSave: (metricId: string, data: Record<string, MetricData>) => void;
  startDate: string;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MetricEditModal = ({ isOpen, onClose, metric, onSave, startDate }: MetricEditModalProps) => {
  const [monthlyData, setMonthlyData] = useState<Record<string, MetricData>>({});

  const displayMonths = useMemo(() => {
    const [yearStr, monthStr] = startDate.split('-');
    const startYear = parseInt(yearStr, 10);
    const startMonthIndex = parseInt(monthStr, 10) - 1;

    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(startYear, startMonthIndex + i, 1);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      const monthName = monthNames[monthIndex];
      const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      const label = `${year}/${monthName}`;
      months.push({ key, label });
    }
    return months;
  }, [startDate]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && metric) {
      const initialData: Record<string, MetricData> = {};
      displayMonths.forEach((month) => {
        initialData[month.key] = metric.monthlyData?.[month.key] || { target: '', actual: '' };
      });
      setMonthlyData(initialData);
      setError(null);
    }
  }, [isOpen, metric, displayMonths]);

  if (!isOpen || !metric) return null;

  const handleChange = (monthKey: string, field: 'target' | 'actual', value: string) => {
    setMonthlyData(prev => ({
      ...prev,
      [monthKey]: {
        ...prev[monthKey],
        [field]: value
      }
    }));
    setError(null);
  };

  const validateInput = (): boolean => {
    if (metric.targetMeetingRule !== 'within_range') return true;

    for (const month of displayMonths) {
        const target = monthlyData[month.key]?.target;
        if (target) {
            // Check format {min,max}
            const match = target.match(/^\{(-?[\d.]+)\s*,\s*(-?[\d.]+)\}$/);
            if (!match) {
                setError(`Invalid format for ${month.label}: Target must be {min, max} (e.g., {5, 10})`);
                return false;
            }
            
            const min = parseFloat(match[1]);
            const max = parseFloat(match[2]);
            
            if (isNaN(min) || isNaN(max)) {
                 setError(`Invalid numbers for ${month.label}: Target must contain valid numbers`);
                 return false;
            }

            if (min >= max) {
                setError(`Invalid range for ${month.label}: Min value must be strictly smaller than Max value`);
                return false;
            }
        }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateInput()) {
        onSave(metric.id, monthlyData);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Edit Data: {metric.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Enter Target and Actual values for each month.</p>
                    {error && (
                        <p className="text-sm text-red-600 mt-2 font-medium">{error}</p>
                    )}
                </div>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
                {displayMonths.map((month) => (
                  <div key={month.key} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                    <h4 className="font-medium text-gray-700 mb-2 border-b border-gray-200 pb-1">
                      {month.label}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Target</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                          value={monthlyData[month.key]?.target || ''}
                          onChange={(e) => handleChange(month.key, 'target', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase">Actual</label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                          value={monthlyData[month.key]?.actual || ''}
                          onChange={(e) => handleChange(month.key, 'actual', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Save Changes
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MetricEditModal;
