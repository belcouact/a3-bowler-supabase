import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useApp, MindMapNodeData } from '../../context/AppContext';
import { MindMap } from '../../components/MindMap';
import { FileText } from 'lucide-react';

const WhyAnalysis = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);

  // We use local state to avoid flickering but sync with context
  const [rootCause, setRootCause] = useState('');
  const [convertedText, setConvertedText] = useState('');

  useEffect(() => {
    if (currentCase) {
        if (currentCase.rootCause !== rootCause) {
            setRootCause(currentCase.rootCause || '');
        }
    }
  }, [currentCase]); // We don't include rootCause in deps to avoid loop, just listen to currentCase changes

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

  const generateTextStructure = () => {
    if (!currentCase?.mindMapNodes || currentCase.mindMapNodes.length === 0) {
        setConvertedText('No content to convert.');
        return;
    }

    const nodes = currentCase.mindMapNodes;
    const roots = nodes.filter(n => !n.parentId);
    
    let text = '';

    const traverse = (nodeId: string, depth: number) => {
        const children = nodes.filter(n => n.parentId === nodeId);
        // Sort children by Y position to maintain visual order roughly
        children.sort((a, b) => a.y - b.y);
        
        for (const child of children) {
            const indent = '  '.repeat(depth);
            text += `${indent}- ${child.text}\n`;
            traverse(child.id, depth + 1);
        }
    };

    // Sort roots by Y position
    roots.sort((a, b) => a.y - b.y);

    for (const root of roots) {
        text += `${root.text}\n`;
        traverse(root.id, 1);
    }

    setConvertedText(text);
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

      {/* Conversion Section */}
      <div className="flex flex-col space-y-2">
          <button
            onClick={generateTextStructure}
            className="self-start flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FileText className="w-4 h-4 mr-2 text-gray-500" />
            Convert to Text
          </button>
          
          {convertedText && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Text Representation</h4>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">{convertedText}</pre>
            </div>
          )}
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
