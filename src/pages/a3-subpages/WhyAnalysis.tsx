import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useApp, MindMapNodeData } from '../../context/AppContext';
import { MindMap } from '../../components/MindMap';

const WhyAnalysis = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);

  // We use local state to avoid flickering but sync with context
  const [nodes, setNodes] = useState<MindMapNodeData[]>([]);
  const [rootCause, setRootCause] = useState('');

  useEffect(() => {
    if (currentCase) {
        // Only update if different to avoid potential loops with the MindMap internal state
        // (Though MindMap handles this too, double safety is good)
        if (JSON.stringify(currentCase.mindMapNodes) !== JSON.stringify(nodes)) {
             setNodes(currentCase.mindMapNodes || []);
        }
        if (currentCase.rootCause !== rootCause) {
            setRootCause(currentCase.rootCause || '');
        }
    }
  }, [currentCase]); // We don't include nodes/rootCause in deps to avoid loop, just listen to currentCase changes

  const handleNodesChange = useCallback((newNodes: MindMapNodeData[]) => {
      if (!currentCase) return;
      
      // Update local state immediately for responsiveness
      setNodes(newNodes);
      
      // Update context
      updateA3Case({
          ...currentCase,
          mindMapNodes: newNodes
      });
  }, [currentCase, updateA3Case]);

  const handleRootCauseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      setRootCause(newVal);
      
      if (currentCase) {
          updateA3Case({
              ...currentCase,
              rootCause: newVal
          });
      }
  };

  if (!currentCase) {
    return <div className="text-gray-500">Loading case data...</div>;
  }

  return (
    <div className="space-y-6 w-full flex flex-col">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">5 Whys Analysis</h3>
        <p className="text-gray-500 mb-4">
            Interactive Root Cause Analysis. Start with the problem and drill down by adding "Why" nodes.
        </p>
      </div>

      <div className="flex flex-col">
         {/* MindMap container is resizable by itself via CSS in MindMap.tsx (resize-y) */}
         <MindMap initialNodes={currentCase.mindMapNodes} onChange={handleNodesChange} />
      </div>

      <div className="mt-6">
        <label htmlFor="rootCause" className="block text-sm font-medium text-gray-700 mb-2">
            Identified Root Cause
        </label>
        <textarea
            id="rootCause"
            rows={4}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            placeholder="Summarize the root cause identified from the analysis..."
            value={rootCause}
            onChange={handleRootCauseChange}
        />
      </div>
    </div>
  );
};

export default WhyAnalysis;
