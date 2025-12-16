import { useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MetricBowler = () => {
  const { id } = useParams();
  const { bowlers } = useApp();
  
  // Find the selected bowler name, or default to generic if not found or no ID
  const selectedBowler = bowlers.find(b => b.id === id);
  const title = selectedBowler ? selectedBowler.name : 'Metric Bowler';
  const metrics = selectedBowler?.metrics || [];

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
        <div className="text-right">
             {selectedBowler?.champion && <p className="text-sm text-gray-600">Champion: {selectedBowler.champion}</p>}
             {selectedBowler?.tag && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">{selectedBowler.tag}</span>}
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
                Definition
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Scope
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Attribute
              </th>
              {/* Placeholder for monthly data columns if needed later */}
              {months.map((month) => (
                <th key={month} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-gray-300">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {metrics.length === 0 ? (
                <tr>
                    <td colSpan={5 + months.length} className="px-6 py-10 text-center text-gray-500 italic">
                        No metrics added yet. Use the + button to add metrics.
                    </td>
                </tr>
            ) : (
                metrics.map((metric) => (
                  <tr key={metric.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-gray-50">
                      {metric.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={metric.definition}>
                      {metric.definition}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.owner}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.scope}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.attribute}
                    </td>
                    {months.map((month) => (
                        <td key={month} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            -
                        </td>
                    ))}
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MetricBowler;
