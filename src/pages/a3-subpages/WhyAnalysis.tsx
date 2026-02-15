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
    const contextText = currentCase.problemContext || '';

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

${contextText ? `Additional Context:\n${contextText}\n\n` : ''}

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
      const rootX = 50;
      const rootY = 200;

      nodes.push({
        id: rootId,
        text: problem,
        x: rootX,
        y: rootY,
        width: 260,
        height: 100,
        parentId: null,
        type: 'root',
      });

      const addChildren = (tree: any[], parentId: string, depth: number) => {
        const stepY = 120;
        const stepX = 260;
        const parent = nodes.find(n => n.id === parentId);
        if (!parent) {
          return;
        }

        const validNodes = tree.filter(
          node => node && typeof node.cause === 'string' && node.cause.trim(),
        );

        const count = validNodes.length;

        validNodes.forEach((node, index) => {
          const id = generateShortId();
          const offset = count > 1 ? index - (count - 1) / 2 : 0;
          const x = parent.x + stepX;
          const y = parent.y + offset * stepY;

          nodes.push({
            id,
            text: node.cause.trim(),
            x,
            y,
            parentId,
            type: 'child',
          });

          if (Array.isArray(node.children) && node.children.length > 0) {
            addChildren(node.children, id, depth + 1);
          }
        });
      };

      addChildren(rawTree, rootId, 1);

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

  if (!currentCase) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
          <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading analysis data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-display">Root Cause Analysis</h2>
            <p className="text-sm text-slate-500 mt-0.5">Explore the "Why" behind the problem to find real solutions.</p>
          </div>
        </div>
        
        <button
          onClick={handleGenerateWhyAnalysis}
          disabled={isGeneratingWhy || !currentCase?.problemStatement}
          className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
        >
          {isGeneratingWhy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
              <span>AI Cause Analysis</span>
            </>
          )}
        </button>
      </div>

      {whyError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{whyError}</p>
          <button onClick={() => setWhyError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mind Map Canvas */}
      <div className="bg-slate-50 rounded-3xl border-2 border-slate-200/50 overflow-hidden shadow-inner relative min-h-[500px]">
        <MindMap 
            initialNodes={currentCase?.mindMapNodes}
            onChange={handleNodesChange}
            onViewChange={handleViewChange}
            initialScale={currentCase?.mindMapScale}
            fixedHeight={currentCase?.mindMapCanvasHeight ?? 500}
        />
        
        {/* Help Tip */}
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-slate-200/60 shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <p className="text-xs font-medium text-slate-600">
              Drag nodes to move • Double-click to edit • Use <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-900">+</span> to expand
            </p>
          </div>
        </div>
      </div>

      {/* Final Root Cause Summary */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700 opacity-50" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Determined Root Cause</h3>
          </div>
          
          <textarea
            value={rootCause}
            onChange={handleRootCauseChange}
            placeholder="Summarize the ultimate root cause identified through your 'Why' analysis..."
            className="w-full min-h-[120px] p-5 bg-slate-50 border-2 border-slate-200/60 rounded-2xl text-slate-700 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all resize-none placeholder:text-slate-400"
          />
          
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-medium">
            <p>This summary will be used to generate your Action Plan.</p>
            <p>{rootCause.length} characters</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyAnalysis;
