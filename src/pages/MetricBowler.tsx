import React from 'react';

interface Metric {
  id: number;
  name: string;
  owner: string;
  target: number;
  actuals: { [key: string]: number }; // e.g., 'Jan': 10
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
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Metric Bowler</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Metric Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target
              </th>
              {months.map((month) => (
                <th key={month} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockMetrics.map((metric) => (
              <tr key={metric.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
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
                  const isMet = actual !== undefined ? (metric.name === 'Defect Rate' ? actual <= metric.target : actual >= metric.target) : null;
                  
                  return (
                    <td key={month} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={isMet === true ? 'text-green-600 font-bold' : isMet === false ? 'text-red-600 font-bold' : ''}>
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
