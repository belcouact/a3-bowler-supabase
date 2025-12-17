import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const Summary = () => {
  const { id } = useParams();
  const { a3Cases } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);

  if (!currentCase) {
    return <div className="text-gray-500">Loading case data...</div>;
  }

  const data = [
    { name: 'Jan', defects: 65 },
    { name: 'Feb', defects: 59 },
    { name: 'Mar', defects: 80 },
    { name: 'Apr', defects: 81 },
    { name: 'May', defects: 56 },
    { name: 'Jun', defects: 55 },
    { name: 'Jul', defects: 40 },
  ];

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
              <p><span className="font-medium text-gray-900">Problem:</span> {currentCase.problemStatement || 'Not defined'}</p>
            </div>
          </div>

          {/* Why Analysis */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">3. Root Cause Analysis (5 Whys)</h4>
            <div className="text-sm text-gray-600">
               <p className="italic text-gray-500">See "5 Whys Analysis" tab for details.</p>
            </div>
          </div>

           {/* Results */}
           <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">5. Results & Follow-up</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p><span className="font-medium text-gray-900">Outcome:</span> {currentCase.results || 'No results recorded yet.'}</p>
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
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} />
                  <Tooltip />
                  <Bar dataKey="defects" fill="#8884d8" name="Defect Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2">{currentCase.dataAnalysisObservations || 'No data observations recorded.'}</p>
            
            {/* Evidence Images */}
            {currentCase.dataAnalysisImages && currentCase.dataAnalysisImages.length > 0 && (
                <div className="mt-4 border-t pt-2">
                    <h5 className="text-xs font-semibold text-gray-600 mb-2">Evidence</h5>
                    <div className="relative w-full h-48 bg-gray-50 border border-gray-200 rounded overflow-hidden">
                        {/* We use a simple scaling approach or just mapping. 
                            Since the original canvas is 500px height, we scale it down or scroll.
                            Let's use a scale transform to fit a 500px canvas into 192px (h-48) roughly 0.4 scale.
                            But width is variable.
                            Better: just show them as is with overflow-auto or contain.
                        */}
                         <div className="w-full h-full relative overflow-auto">
                            {currentCase.dataAnalysisImages.map(img => (
                                <div
                                    key={img.id}
                                    style={{
                                        position: 'absolute',
                                        left: img.x * 0.5, // Scale down positions slightly for summary view
                                        top: img.y * 0.5,
                                        width: img.width * 0.5,
                                        height: img.height * 0.5,
                                    }}
                                >
                                    <img 
                                        src={img.src} 
                                        alt="evidence" 
                                        className="w-full h-full object-contain" 
                                    />
                                </div>
                            ))}
                         </div>
                         <div className="absolute bottom-1 right-1 text-[10px] text-gray-400">
                             * Scaled (50%)
                         </div>
                    </div>
                </div>
            )}
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
                  {currentCase.actionPlanTasks && currentCase.actionPlanTasks.length > 0 ? (
                    currentCase.actionPlanTasks.map(task => (
                      <tr key={task.id}>
                        <td className="px-2 py-1 text-xs text-gray-900">{task.name}</td>
                        <td className="px-2 py-1 text-xs text-gray-500">{task.owner}</td>
                        <td className="px-2 py-1 text-xs text-gray-600">{task.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-2 py-4 text-xs text-center text-gray-500">No actions defined.</td>
                    </tr>
                  )}
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
