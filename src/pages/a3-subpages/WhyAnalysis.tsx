import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const WhyAnalysis = () => {
  const { id } = useParams();
  const { a3Cases } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);

  if (!currentCase) {
    return <div className="text-gray-500">Loading case data...</div>;
  }

  return (
    <div className="space-y-6 w-full h-full">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">5 Whys Analysis</h3>
        <p className="text-gray-500 mb-4">
            Interactive Root Cause Analysis. Start with the problem and drill down by adding "Why" nodes.
        </p>
      </div>
    </div>
  );
};

export default WhyAnalysis;
