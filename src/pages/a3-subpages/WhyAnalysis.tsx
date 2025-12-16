import { MindMap } from '../../components/MindMap';

const WhyAnalysis = () => {
  return (
    <div className="space-y-6 w-full h-full">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">5 Whys Analysis</h3>
        <p className="text-gray-500 mb-4">
            Interactive Root Cause Analysis. Start with the problem and drill down by adding "Why" nodes.
        </p>
        
        <div className="w-full h-full">
            <MindMap />
        </div>
      </div>
    </div>
  );
};

export default WhyAnalysis;
