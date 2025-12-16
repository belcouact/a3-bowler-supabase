import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for the summary view
const chartData = [
  { name: 'Week 1', defects: 12 },
  { name: 'Week 2', defects: 19 },
  { name: 'Week 3', defects: 3 },
  { name: 'Week 4', defects: 5 },
  { name: 'Week 5', defects: 2 },
];

const Summary = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">A3 Problem Solving Summary</h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
          Export PDF
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Problem Statement */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">1. Problem Statement</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p><span className="font-medium text-gray-900">Problem:</span> Scrap rate in Line 4 has increased by 15% over the last month.</p>
              <p><span className="font-medium text-gray-900">Background:</span> Line 4 is critical for the new EV battery housing production. Higher scrap rate is affecting delivery commitments.</p>
            </div>
          </div>

          {/* Why Analysis */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">3. Root Cause Analysis (5 Whys)</h4>
            <div className="text-sm text-gray-600">
              <ul className="list-decimal list-inside space-y-1">
                <li>Machine stopped suddenly. (Why?) -> Fuse blew.</li>
                <li>Fuse blew. (Why?) -> Overloaded motor.</li>
                <li>Overloaded motor. (Why?) -> Bearing seized.</li>
                <li>Bearing seized. (Why?) -> Lack of lubrication.</li>
                <li><span className="font-medium text-red-600">Root Cause:</span> Lubrication pump failed due to worn seal.</li>
              </ul>
            </div>
          </div>

           {/* Results */}
           <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">5. Results & Follow-up</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p><span className="font-medium text-gray-900">Outcome:</span> Replaced lubrication pump and established weekly inspection schedule.</p>
              <p><span className="font-medium text-gray-900">Impact:</span> Scrap rate reduced to &lt; 1% in the following 2 weeks.</p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Data Analysis */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">2. Data Analysis</h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} />
                  <Tooltip />
                  <Bar dataKey="defects" fill="#8884d8" name="Defect Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2">Peak defects observed in Week 2, correlated with the lubrication failure.</p>
          </div>

          {/* Action Plan */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">4. Action Plan</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-2 py-1 text-xs text-gray-900">Replace Pump</td>
                    <td className="px-2 py-1 text-xs text-gray-500">Mike</td>
                    <td className="px-2 py-1 text-xs text-green-600">Done</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 text-xs text-gray-900">Update Maint. Schedule</td>
                    <td className="px-2 py-1 text-xs text-gray-500">Sarah</td>
                    <td className="px-2 py-1 text-xs text-green-600">Done</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 text-xs text-gray-900">Train Operators</td>
                    <td className="px-2 py-1 text-xs text-gray-500">John</td>
                    <td className="px-2 py-1 text-xs text-yellow-600">In Progress</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
