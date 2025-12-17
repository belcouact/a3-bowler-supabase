import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const Result = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (currentCase && textareaRef.current) {
        const newVal = currentCase.results || '';
        if (textareaRef.current.value !== newVal) {
            textareaRef.current.value = newVal;
        }
    }
  }, [currentCase?.results]);

  const handleBlur = () => {
    if (currentCase && textareaRef.current) {
        const newValue = textareaRef.current.value;
        if (newValue !== currentCase.results) {
            updateA3Case({ ...currentCase, results: newValue });
        }
    }
  };

  if (!currentCase) {
    return <div className="text-gray-500">Loading case data...</div>;
  }

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
              ref={textareaRef}
              id="results"
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
              placeholder="Describe what happened after actions were taken..."
              defaultValue={currentCase.results || ''}
              onBlur={handleBlur}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
