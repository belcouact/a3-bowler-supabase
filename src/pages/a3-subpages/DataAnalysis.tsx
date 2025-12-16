
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Week 1', defects: 12 },
  { name: 'Week 2', defects: 19 },
  { name: 'Week 3', defects: 3 },
  { name: 'Week 4', defects: 5 },
  { name: 'Week 5', defects: 2 },
];

const DataAnalysis = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Data Analysis</h3>
        <p className="text-gray-500 mb-4">Visualize the data to understand the magnitude and trend of the problem.</p>
        
        <div className="h-80 w-full bg-gray-50 p-4 rounded-lg border border-gray-200">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="defects" fill="#8884d8" name="Defect Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4">
          <h4 className="font-medium text-gray-900">Key Observations</h4>
          <ul className="list-disc pl-5 mt-2 text-gray-600 space-y-1">
            <li>Spike in defects observed in Week 2.</li>
            <li>Significant reduction in Week 3 and 5.</li>
            <li>Average defect rate is 8.2 per week.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataAnalysis;
