import { useParams } from 'react-router-dom';
import { MindMap } from '../../components/MindMap';
import { useApp, MindMapNodeData } from '../../context/AppContext';

const WhyAnalysis = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);

  const handleMindMapChange = (nodes: MindMapNodeData[]) => {
    if (!currentCase) return;
    updateA3Case({ ...currentCase, mindMapNodes: nodes });
  };

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
        
        <div className="w-full h-full">
            <MindMap initialNodes={currentCase.mindMapNodes} onChange={handleMindMapChange} />
        </div>
      </div>
    </div>
  );
};

export default WhyAnalysis;
