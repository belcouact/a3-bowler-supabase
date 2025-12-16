import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Edit2, Info } from 'lucide-react';
import { useApp, Metric, MetricData } from '../context/AppContext';
import MetricEditModal from '../components/MetricEditModal';

const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MetricBowler = () => {
  const { id } = useParams();
  const { bowlers, updateBowler } = useApp();
  
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
  
  // Start date state - defaults to January of current year
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-01`;
  });

  // Calculate 12 months based on start date
  const displayMonths = useMemo(() => {
    const [year, monthStr] = startDate.split('-');
    const startMonthIndex = parseInt(monthStr, 10) - 1;
    
    const months = [];
    for (let i = 0; i < 12; i++) {
        const monthIndex = (startMonthIndex + i) % 12;
        months.push(allMonths[monthIndex]);
    }
    return months;
  }, [startDate]);

  // Find the selected bowler name, or default to generic if not found or no ID
  const selectedBowler = bowlers.find(b => b.id === id);
  const title = selectedBowler ? selectedBowler.name : 'Metric Bowler';
  const metrics = selectedBowler?.metrics || [];

  const handleEditClick = (metric: Metric) => {
    setEditingMetric(metric);
  };

  const handleSaveMetricData = (metricId: string, data: Record<string, MetricData>) => {
    if (!selectedBowler) return;

    const updatedMetrics = metrics.map(m => 
      m.id === metricId ? { ...m, monthlyData: data } : m
    );

    updateBowler({
      ...selectedBowler,
      metrics: updatedMetrics
    });
  };

  if (!id && bowlers.length > 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
           <p className="text-lg font-medium">Select a Bowler List from the sidebar to view metrics.</p>
        </div>
      )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center">
        <div>
           <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
           <p className="text-sm text-gray-500 mt-1">
             {selectedBowler?.description || 'Track key performance indicators and monthly targets.'}
           </p>
        </div>
        <div className="text-right flex flex-col items-end">
             {selectedBowler?.champion && <p className="text-sm text-gray-600 mb-2">Champion: {selectedBowler.champion}</p>}
             {selectedBowler?.tag && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-3">{selectedBowler.tag}</span>}
             
             <div className="flex items-center space-x-2">
               <label htmlFor="startDate" className="text-sm text-gray-600 font-medium">Start Date:</label>
               <input 
                 type="month" 
                 id="startDate"
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1 border"
               />
             </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                Metric Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Scope
              </th>
              {/* Placeholder for monthly data columns if needed later */}
              {displayMonths.map((month) => (
                <th key={month} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-gray-300">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {metrics.length === 0 ? (
                <tr>
                    <td colSpan={3 + displayMonths.length} className="px-6 py-10 text-center text-gray-500 italic">
                        No metrics added yet. Use the + button to add metrics.
                    </td>
                </tr>
            ) : (
                metrics.map((metric) => (
                  <>
                  {/* Row 1: Metadata + Target Data */}
                  <tr key={`${metric.id}-row1`} className="hover:bg-gray-50 transition-colors border-b-0">
                    <td rowSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-gray-50 align-top">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                            <span className="mr-2">{metric.name}</span>
                            {metric.definition && (
                                <div className="group relative">
                                    <Info className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500 cursor-help" />
                                    <div className="absolute left-full top-0 ml-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                        {metric.definition}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button 
                          onClick={() => handleEditClick(metric)}
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                          title="Edit Data"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td rowSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                      {metric.owner}
                    </td>
                    <td rowSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top border-r border-gray-100">
                      {metric.scope}
                    </td>
                    
                    {displayMonths.map((month) => (
                        <td key={`${month}-target`} className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 bg-gray-50/30 border-b border-gray-100 h-8">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-gray-400 uppercase mr-2">T:</span>
                                <span className="font-medium text-gray-700">{metric.monthlyData?.[month]?.target || '-'}</span>
                            </div>
                        </td>
                    ))}
                  </tr>

                  {/* Row 2: Actual Data */}
                  <tr key={`${metric.id}-row2`} className="hover:bg-gray-50 transition-colors">
                     {displayMonths.map((month) => (
                        <td key={`${month}-actual`} className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 h-8">
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] text-gray-400 uppercase mr-2">A:</span>
                                <span className={`font-semibold ${
                                  !metric.monthlyData?.[month]?.actual ? 'text-gray-400' : 
                                  'text-gray-900'
                                }`}>
                                  {metric.monthlyData?.[month]?.actual || '-'}
                                </span>
                            </div>
                        </td>
                    ))}
                  </tr>
                  </>
                ))
            )}
          </tbody>
        </table>
      </div>

      <MetricEditModal 
        isOpen={!!editingMetric}
        onClose={() => setEditingMetric(null)}
        metric={editingMetric}
        onSave={handleSaveMetricData}
      />
    </div>
  );
};

export default MetricBowler;
