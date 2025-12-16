import { useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface Metric {
  id: number;
  name: string;
  owner: string;
  target: number;
  actuals: { [key: string]: number };
}

const mockMetrics: Metric[] = [
  {
    id: 1,
    name: 'Customer Satisfaction',
    owner: 'Alice Johnson',
    target: 95,
    actuals: { Jan: 92, Feb: 94, Mar: 96, Apr: 95, May: 93 },
  },
  {
    id: 2,
    name: 'Defect Rate',
    owner: 'Bob Smith',
    target: 0.5,
    actuals: { Jan: 0.8, Feb: 0.6, Mar: 0.4, Apr: 0.5, May: 0.3 },
  },
  {
    id: 3,
    name: 'On-Time Delivery',
    owner: 'Charlie Brown',
    target: 98,
    actuals: { Jan: 97, Feb: 96, Mar: 99, Apr: 98, May: 98 },
  },
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MetricBowler = () => {
  const { id } = useParams();
  const { bowlers } = useApp();
  
  // Find the selected bowler name, or default to generic if not found or no ID
  const selectedBowler = bowlers.find(b => b.id === id);
  const title = selectedBowler ? selectedBowler.name : 'Metric Bowler';

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
           <p className="text-sm text-gray-500 mt-1">Track key performance indicators and monthly targets.</p>
        </div>
        <div className="text-sm text-gray-400">
            ID: {id}
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
                Target
              </th>
              {months.map((month) => (
                <th key={month} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockMetrics.map((metric) => (
              <tr key={metric.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-gray-50">
                  {metric.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {metric.owner}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  {metric.target}
                </td>
                {months.map((month) => {
                  const actual = metric.actuals[month];
                  // Simple logic: if 'Rate' is in name, lower is better, else higher is better
                  const isLowerBetter = metric.name.includes('Rate');
                  
                  let isMet: boolean | null = null;
                  if (actual !== undefined) {
                      isMet = isLowerBetter ? actual <= metric.target : actual >= metric.target;
                  }
                  
                  return (
                    <td key={month} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={
                          actual === undefined ? '' :
                          isMet ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800' :
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
                      }>
                        {actual !== undefined ? actual : '-'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MetricBowler;
