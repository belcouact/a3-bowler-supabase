import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useApp, MindMapNodeData } from '../../context/AppContext';
import { MindMap } from '../../components/MindMap';

const WhyAnalysis = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);

  // We use local state to avoid flickering but sync with context
  const [rootCause, setRootCause] = useState('');

  useEffect(() => {
    if (currentCase) {
        if (currentCase.rootCause !== rootCause) {
            setRootCause(currentCase.rootCause || '');
        }
    }
  }, [currentCase]); // We don't include rootCause in deps to avoid loop, just listen to currentCase changes

  // Auto-generate text structure from nodes and update rootCause
  useEffect(() => {
    if (!currentCase?.mindMapNodes) return;

    const nodes = currentCase.mindMapNodes;
    if (nodes.length === 0) return;

    const roots = nodes.filter(n => !n.parentId);
    let text = '';

    const traverse = (nodeId: string, depth: number) => {
        const children = nodes.filter(n => n.parentId === nodeId);
        children.sort((a, b) => a.y - b.y);
        
        for (const child of children) {
            const indent = '  '.repeat(depth);
            text += `${indent}- ${child.text}\n`;
            traverse(child.id, depth + 1);
        }
    };

    roots.sort((a, b) => a.y - b.y);
    for (const root of roots) {
        text += `${root.text}\n`;
        traverse(root.id, 1);
    }
    
    // Only update if changed to avoid loops and unnecessary updates
    if (text !== currentCase.mindMapText) {
        updateA3Case({
            ...currentCase,
            mindMapText: text
        });
    }
  }, [currentCase?.mindMapNodes, updateA3Case, currentCase?.id]); // Use specific dependencies to be safe, though currentCase checks inside handle it.

  const handleNodesChange = useCallback((newNodes: MindMapNodeData[]) => {
      if (!currentCase) return;
      
      // Optimization: Compare JSON string to avoid unnecessary context updates
      // This is crucial because context update triggers re-render of this component, 
      // which passes new nodes to MindMap, which might trigger another onChange if not careful.
      const currentNodesJson = JSON.stringify(currentCase.mindMapNodes);
      const newNodesJson = JSON.stringify(newNodes);

      if (currentNodesJson !== newNodesJson) {
          // Update context
          updateA3Case({
              ...currentCase,
              mindMapNodes: newNodes
          });
      }
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

      {/* Conversion Section Removed */}

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
