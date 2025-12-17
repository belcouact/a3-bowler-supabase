import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const ProblemStatement = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);
  const [statement, setStatement] = useState('');

  console.log('Rendering ProblemStatement', { id, currentCase });

  useEffect(() => {
    if (currentCase) {
      setStatement(currentCase.problemStatement || '');
    }
  }, [currentCase?.problemStatement]);

  const handleBlur = () => {
    if (currentCase) {
      updateA3Case({ ...currentCase, problemStatement: statement });
    }
  };

  if (!currentCase) {
    return <div className="text-gray-500">Loading case data...</div>;
  }

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
              onBlur={handleBlur}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemStatement;
