import { useState } from 'react';

const Result = () => {
  const [results, setResults] = useState('');
  const [impact, setImpact] = useState('');

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Results & Follow-up</h3>
        <p className="text-gray-500 mb-4">Document the results achieved after implementing the action plan.</p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="results" className="block text-sm font-medium text-gray-700 mb-1">
              Actual Results
            </label>
            <textarea
              id="results"
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
              placeholder="Describe what happened after actions were taken..."
              value={results}
              onChange={(e) => setResults(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
