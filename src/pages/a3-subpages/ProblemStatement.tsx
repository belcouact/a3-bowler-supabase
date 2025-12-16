import { useState } from 'react';

const ProblemStatement = () => {
  const [statement, setStatement] = useState('');

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Problem Statement</h3>
        <p className="text-gray-500 mb-4">Clearly define the gap between the current state and the desired state.</p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="problem" className="block text-sm font-medium text-gray-700 mb-1">
              What is the problem?
            </label>
            <textarea
              id="problem"
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
              placeholder="Describe the problem..."
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemStatement;
