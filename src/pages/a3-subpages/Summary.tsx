import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useState, useRef } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { MindMap } from '../../components/MindMap';

const Summary = () => {
  const { id } = useParams();
  const { a3Cases } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);
  const contentRef = useRef<HTMLDivElement>(null);
  const [rootCauseView, setRootCauseView] = useState<'text' | 'mindmap'>(() =>
    currentCase && currentCase.mindMapNodes && currentCase.mindMapNodes.length > 0
      ? 'mindmap'
      : 'text'
  );
  const handlePrintToPDF = () => {
    if (!currentCase) return;
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (!currentCase) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
          <p className="mt-4 text-slate-500 font-medium animate-pulse">Preparing summary report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 print-summary-root" ref={contentRef}>
      <div className="flex justify-between items-end border-b border-slate-200 pb-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 font-display tracking-tight">A3 Problem Solving Report</h2>
          <p className="text-slate-500 text-lg">Integrated view of the complete problem solving lifecycle</p>
        </div>
        <button 
          onClick={handlePrintToPDF}
          className="px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 text-sm font-bold flex items-center shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 print:hidden"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print to PDF
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-12">
        {/* 1. Problem Statement */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-brand-100 text-brand-600 flex items-center justify-center text-[10px]">1</span>
              Problem Statement
            </h4>
          </div>
          <div className="p-8">
            <p className="text-xl text-slate-800 leading-relaxed font-medium">
              {currentCase.problemStatement || <span className="text-slate-300 italic">Not defined yet</span>}
            </p>
          </div>
        </section>

        {/* 2. Data Analysis */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-brand-100 text-brand-600 flex items-center justify-center text-[10px]">2</span>
              Data Analysis & Observations
            </h4>
          </div>
          <div className="p-8 space-y-8">
            {currentCase.dataAnalysisImages && currentCase.dataAnalysisImages.length > 0 && (
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Evidence Gallery</h5>
                <div
                  className="relative w-full bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shadow-inner"
                  style={{
                    height:
                      currentCase.dataAnalysisCanvasHeight && currentCase.dataAnalysisCanvasHeight > 0
                        ? currentCase.dataAnalysisCanvasHeight
                        : 500,
                  }}
                >
                  <div className="w-full h-full relative">
                    {currentCase.dataAnalysisImages.map(img => (
                      <div
                        key={img.id}
                        style={{
                          position: 'absolute',
                          left: img.x,
                          top: img.y,
                          width: img.width,
                          height: img.height,
                        }}
                      >
                        <img
                          src={img.src}
                          alt="evidence"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Key Observations</h5>
              <p className="text-slate-700 leading-relaxed">
                {currentCase.dataAnalysisObservations || <span className="text-slate-300 italic">No observations recorded</span>}
              </p>
            </div>
          </div>
        </section>

        {/* 3. Root Cause Analysis */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-brand-100 text-brand-600 flex items-center justify-center text-[10px]">3</span>
              Root Cause Analysis
            </h4>
            {currentCase.mindMapNodes && currentCase.mindMapNodes.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setRootCauseView(rootCauseView === 'text' ? 'mindmap' : 'text')
                }
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm print:hidden"
              >
                {rootCauseView === 'text' ? 'Show Mindmap' : 'Show Text Summary'}
              </button>
            )}
          </div>
          <div className="p-8 space-y-8">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Final Root Cause</h5>
              <p className="text-xl text-brand-900 font-bold">
                {currentCase.rootCause || <span className="text-slate-300 italic font-medium">Root cause not identified yet</span>}
              </p>
            </div>

            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analysis Detail</h5>
              {rootCauseView === 'text' ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 font-mono text-sm text-slate-600 whitespace-pre-wrap leading-relaxed shadow-sm">
                  {currentCase.mindMapText || <span className="text-slate-300 italic font-sans">No detailed analysis recorded</span>}
                </div>
              ) : (
                currentCase.mindMapNodes &&
                currentCase.mindMapNodes.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm pointer-events-none">
                    <MindMap
                      initialNodes={currentCase.mindMapNodes}
                      initialScale={currentCase.mindMapScale}
                      fixedHeight={currentCase.mindMapCanvasHeight}
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* 4. Action Plan */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-brand-100 text-brand-600 flex items-center justify-center text-[10px]">4</span>
              Action Plan
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Task</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {currentCase.actionPlanTasks && currentCase.actionPlanTasks.length > 0 ? (
                  currentCase.actionPlanTasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{task.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                        {task.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{task.owner}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {task.endDate || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          task.status === 'completed' ? 'bg-accent-100 text-accent-700' :
                          task.status === 'in-progress' ? 'bg-brand-100 text-brand-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-sm text-center text-slate-400 font-medium">
                      No actions defined yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Results & Follow-up */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-brand-100 text-brand-600 flex items-center justify-center text-[10px]">5</span>
              Results & Follow-up
            </h4>
          </div>
          <div className="p-8 space-y-8">
            {currentCase.resultImages && currentCase.resultImages.length > 0 && (
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Result Evidence</h5>
                <div
                  className="relative w-full bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shadow-inner"
                  style={{
                    height:
                      currentCase.resultCanvasHeight && currentCase.resultCanvasHeight > 0
                        ? currentCase.resultCanvasHeight
                        : 500,
                  }}
                >
                  <div className="w-full h-full relative">
                    {currentCase.resultImages.map(img => (
                      <div
                        key={img.id}
                        style={{
                          position: 'absolute',
                          left: img.x,
                          top: img.y,
                          width: img.width,
                          height: img.height,
                        }}
                      >
                        <img
                          src={img.src}
                          alt="result evidence"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-accent-50 rounded-2xl p-6 border border-accent-100">
              <h5 className="text-xs font-bold text-accent-700/50 uppercase tracking-widest mb-3">Outcome Summary</h5>
              <p className="text-lg text-accent-900 font-medium leading-relaxed">
                {currentCase.results || <span className="text-accent-300 italic font-normal">No results recorded yet</span>}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Summary;
