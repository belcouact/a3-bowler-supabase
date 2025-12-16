
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const data = [
  { name: 'Week 1', defects: 12 },
  { name: 'Week 2', defects: 19 },
  { name: 'Week 3', defects: 3 },
  { name: 'Week 4', defects: 5 },
  { name: 'Week 5', defects: 2 },
];

const DataAnalysis = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);

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
        
        <div className="mt-6">
          <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-2">
            Key Observations from Data
          </label>
          <textarea
            id="observations"
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
            placeholder="What patterns or insights do you see in the data?"
            value={currentCase?.dataAnalysisObservations || ''}
            onChange={(e) => currentCase && updateA3Case({ ...currentCase, dataAnalysisObservations: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

export default DataAnalysis;
