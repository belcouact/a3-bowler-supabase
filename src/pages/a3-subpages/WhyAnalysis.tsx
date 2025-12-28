import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useApp, MindMapNodeData } from '../../context/AppContext';
import { MindMap } from '../../components/MindMap';
import { Sparkles, Loader2, AlertCircle, X, Lightbulb } from 'lucide-react';
import { generateShortId } from '../../utils/idUtils';

const WhyAnalysis = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);

  const [rootCause, setRootCause] = useState('');
  const [isGeneratingActions, setIsGeneratingActions] = useState(false);
  const [actionsPlan, setActionsPlan] = useState<string | null>(null);
  const [actionsError, setActionsError] = useState<string | null>(null);
  const [isGeneratingWhy, setIsGeneratingWhy] = useState(false);
  const [whyError, setWhyError] = useState<string | null>(null);

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
      const currentNodesJson = JSON.stringify(currentCase.mindMapNodes);
      const newNodesJson = JSON.stringify(newNodes);

      if (currentNodesJson !== newNodesJson) {
          updateA3Case({
              ...currentCase,
              mindMapNodes: newNodes
          });
      }
  }, [currentCase, updateA3Case]);

  const handleViewChange = useCallback(
    (view: { scale: number; height: number }) => {
      if (!currentCase) return;
      const nextScale = view.scale;
      const nextHeight = view.height;
      const prevScale = currentCase.mindMapScale ?? 1;
      const prevHeight = currentCase.mindMapCanvasHeight;
      if (prevScale === nextScale && prevHeight === nextHeight) return;
      updateA3Case({
        ...currentCase,
        mindMapScale: nextScale,
        mindMapCanvasHeight: nextHeight,
      });
    },
    [currentCase, updateA3Case]
  );

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

  const handleGenerateWhyAnalysis = async () => {
    if (!currentCase) return;

    const problem = currentCase.problemStatement || '';
    const observations = currentCase.dataAnalysisObservations || '';

    if (!problem.trim()) return;

    setIsGeneratingWhy(true);
    setWhyError(null);

    try {
      const prompt = `
You are an expert in A3 Problem Solving, Lean, and operational excellence.

You will receive:
- A3 Problem Statement
- Key observations and evidence from data analysis

Your task:
- Build a concise 5-Whys style cause tree for this problem that reflects typical industrial best practice.

Guidance:
- Focus on clear cause-and-effect logic.
- Avoid repeating the same cause text at the same level.
- When several detailed sub-causes share the same higher-level idea, represent that idea once as a parent "cause" node and place the detailed variations under "children".

Response requirements:
- Always respond in English.
- Return JSON ONLY with this exact structure:
{
  "whyTree": [
    {
      "cause": "first-level cause text",
      "children": [
        {
          "cause": "second-level cause text",
          "children": [
            {
              "cause": "third-level cause text"
            }
          ]
        }
      ]
    }
  ]
}

Problem Statement:
${problem}

Key Observations and Evidence:
${observations || '(none provided)'}
`;

      const messages = [
        {
          role: 'system',
          content:
            'You are an A3 Problem Solving coach that outputs strictly JSON in the requested schema.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      const response = await fetch('https://multi-model-worker.study-llm.me/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek',
          messages,
          stream: false
        }),
      });

      if (!response.ok) throw new Error('Failed to generate why analysis');

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || '{}';
      const cleanContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleanContent);
      } catch {
        parsed = {};
      }

      const rawTree = Array.isArray(parsed.whyTree) ? parsed.whyTree : [];

      if (rawTree.length === 0) {
        setWhyError('AI did not return a valid why tree. Please try again.');
        return;
      }

      const nodes: MindMapNodeData[] = [];
      const rootId = generateShortId();

      nodes.push({
        id: rootId,
        text: problem,
        x: 50,
        y: 200,
        width: 260,
        height: 100,
        parentId: null,
        type: 'root',
      });

      const addChildren = (
        tree: any[],
        parentId: string,
        depth: number,
        startY: number,
      ): number => {
        let currentY = startY;
        const stepY = 120;
        const stepX = 220;
        tree.forEach(node => {
          if (!node || typeof node.cause !== 'string' || !node.cause.trim()) {
            return;
          }
          const id = generateShortId();
          nodes.push({
            id,
            text: node.cause.trim(),
            x: 50 + stepX * depth,
            y: currentY,
            parentId,
            type: 'child',
          });
          if (Array.isArray(node.children) && node.children.length > 0) {
            currentY = addChildren(node.children, id, depth + 1, currentY + stepY);
          } else {
            currentY += stepY;
          }
        });
        return currentY;
      };

      addChildren(rawTree, rootId, 1, 260);

      updateA3Case({
        ...currentCase,
        mindMapNodes: nodes,
      });
    } catch (err) {
      setWhyError('Failed to generate why analysis. Please try again.');
    } finally {
      setIsGeneratingWhy(false);
    }
  };

  const handleGenerateActions = async () => {
    if (!currentCase) return;

    const problem = currentCase.problemStatement || '';
    const observations = currentCase.dataAnalysisObservations || '';
    const root = rootCause || currentCase.rootCause || '';

    if (!problem.trim() || !root.trim()) return;

    setIsGeneratingActions(true);
    setActionsError(null);
    setActionsPlan(null);

    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert continuous improvement and operations coach.

You will receive:
- A3 Problem Statement
- Key observations from data analysis
- Identified root cause

Your task is to propose practical improvement actions that address the root cause.

Respond in English, even if the user's inputs are in another language.

Structure the answer with markdown headings:
## Short-term Actions
## Long-term Actions

Under each heading, list concise, actionable bullet points. Focus on actions that are realistic in a manufacturing or service environment.`
        },
        {
          role: 'user',
          content: `Problem Statement:
${problem}

Key Observations from Data:
${observations}

Identified Root Cause:
${root}`
        }
      ];

      const response = await fetch('https://multi-model-worker.study-llm.me/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek',
          messages,
          stream: false
        }),
      });

      if (!response.ok) throw new Error('Failed to generate improvement actions');

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || '';
      content = content.replace(/^```[\s\S]*?```/g, '').trim();

      setActionsPlan(content);
    } catch (err) {
      setActionsError('Failed to generate improvement actions. Please try again.');
    } finally {
      setIsGeneratingActions(false);
    }
  };



  if (!currentCase) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-3 text-base font-medium text-gray-700">Loading application data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full flex flex-col">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">5 Whys Analysis</h3>
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-500 mr-4">
            Interactive Root Cause Analysis. Start with the problem and drill down by adding "Why" nodes.
          </p>
          <button
            type="button"
            onClick={handleGenerateWhyAnalysis}
            disabled={
              isGeneratingWhy ||
              !currentCase.problemStatement ||
              !(currentCase.dataAnalysisObservations || currentCase.mindMapNodes?.length)
            }
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingWhy ? (
              <>
                <Loader2 className="animate-spin -ml-0.5 mr-2 h-3 w-3" />
                <span className="hidden sm:inline">Analyzing whys...</span>
              </>
            ) : (
              <>
                <Sparkles className="-ml-0.5 mr-0 sm:mr-2 h-3 w-3" />
                <span className="hidden sm:inline">AI Why Analysis</span>
              </>
            )}
          </button>
        </div>
        {whyError && (
          <div className="mb-3 rounded-md bg-red-50 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-4 w-4 text-red-400" />
              </div>
              <div className="ml-2 text-xs text-red-700">
                {whyError}
              </div>
            </div>
          </div>
        )}
        <div className="mt-2 flex flex-col">
          <MindMap
            initialNodes={currentCase.mindMapNodes}
            onChange={handleNodesChange}
            initialScale={currentCase.mindMapScale}
            fixedHeight={currentCase.mindMapCanvasHeight}
            onViewChange={handleViewChange}
          />
        </div>
      </div>

      {/* Conversion Section Removed */}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="rootCause" className="block text-sm font-medium text-gray-700">
            Identified Root Cause
          </label>
          <button
            type="button"
            onClick={handleGenerateActions}
            disabled={
              isGeneratingActions ||
              !currentCase.problemStatement ||
              !(rootCause || currentCase.rootCause)
            }
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingActions ? (
              <>
                <Loader2 className="animate-spin -ml-0.5 mr-2 h-3 w-3" />
                <span className="hidden sm:inline">Generating actions...</span>
              </>
            ) : (
              <>
                <Lightbulb className="-ml-0.5 mr-0 sm:mr-2 h-3 w-3" />
                <span className="hidden sm:inline">AI Improvement Actions</span>
              </>
            )}
          </button>
        </div>
        <textarea
            id="rootCause"
            rows={8}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            placeholder="Summarize the root cause identified from the analysis..."
            value={rootCause}
            onChange={handleRootCauseChange}
        />
        {actionsError && (
          <div className="mt-3 rounded-md bg-red-50 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-4 w-4 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-2 text-sm text-red-700">
                {actionsError}
              </div>
            </div>
          </div>
        )}
        {actionsPlan && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-blue-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-900 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
                AI Improvement Actions
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setActionsPlan(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap">
                {actionsPlan}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhyAnalysis;
