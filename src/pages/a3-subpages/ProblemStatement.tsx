import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Loader2, CheckCircle, AlertCircle, X, ClipboardList } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AssessmentResult {
  critique: string;
  improved_version: string;
}

const ProblemStatement = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [problemContext, setProblemContext] = useState('');

  useEffect(() => {
    if (currentCase && textareaRef.current) {
      const newVal = currentCase.problemStatement || '';
      if (textareaRef.current.value !== newVal) {
          textareaRef.current.value = newVal;
      }
    }
  }, [currentCase?.problemStatement]);

  useEffect(() => {
    if (currentCase) {
      setProblemContext(currentCase.problemContext || '');
    }
  }, [currentCase?.problemContext]);

  const handleAssess = async () => {
    if (!currentCase?.problemStatement) return;
    
    setIsAssessing(true);
    setError(null);
    setAssessmentResult(null);

    try {
      const contextText = (currentCase.problemContext || '').trim();
      const messages = [
        {
          role: 'system',
          content: `You are an expert A3 Problem Solving coach.
          The user will provide a Problem Statement.
          
          Instructions:
          1. Assess if the problem statement is good using the 5W2H criteria (Who, What, Where, When, Which, How Often, How Much Impact).
          2. Provide a critique in English, even if the input is in another language.
          3. Offer an improved, clearer version of the problem statement in English.
          
          Requirements:
          - **Critique**: Be specific about what is missing or vague. Use Markdown.
          - **Improved Version**: Professional, concise, and includes all key aspects. No analysis or extra text, just the statement.
          - **Readability**: Break text into short paragraphs.
          
          RETURN JSON ONLY with keys:
          - "critique": string (markdown supported)
          - "improved_version": string
          `
        },
        {
          role: 'user',
          content:
            `Problem Statement:\n${currentCase.problemStatement}` +
            (contextText ? `\n\nAdditional Context:\n${contextText}` : '')
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

      if (!response.ok) throw new Error('Failed to fetch assessment');

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || '{}';
      
      // Clean up markdown code blocks if present
      content = content.replace(/^```json\s*|\s*```$/g, '').replace(/^```\s*|\s*```$/g, '');
      
      try {
        const result = JSON.parse(content);
        setAssessmentResult(result);
      } catch (e) {
        console.error("JSON Parse Error", e);
        setAssessmentResult({
            critique: content, // Fallback: show raw content
            improved_version: ""
        });
      }

    } catch (err) {
      setError('Failed to assess problem statement. Please try again.');
    } finally {
      setIsAssessing(false);
    }
  };

  const handleBlur = () => {
    if (currentCase && textareaRef.current) {
      const newValue = textareaRef.current.value;
      if (newValue !== currentCase.problemStatement) {
          updateA3Case({ ...currentCase, problemStatement: newValue });
      }
    }
  };

  const handleContextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentCase) return;
    const newValue = e.target.value;
    setProblemContext(newValue);
    updateA3Case({ ...currentCase, problemContext: newValue });
  };

  if (!currentCase) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
          <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading workspace data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">Problem Statement</h2>
        </div>
        <p className="text-slate-500 text-lg leading-relaxed max-w-2xl">
          Clearly define the gap between the current state and the desired state. A well-defined problem is half-solved.
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Main Textarea Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 focus-within:ring-4 focus-within:ring-brand-50 focus-within:border-brand-300">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <label htmlFor="problem" className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Problem Description
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsContextOpen(prev => !prev)}
                className={clsx(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  isContextOpen 
                    ? "bg-slate-200 text-slate-700" 
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                {isContextOpen ? 'Hide context' : 'Add context'}
              </button>
            </div>
          </div>
          
          <textarea
            ref={textareaRef}
            id="problem"
            rows={8}
            className="w-full px-6 py-4 text-slate-700 placeholder-slate-400 border-none focus:ring-0 resize-none text-lg leading-relaxed"
            placeholder="Describe the problem in detail. Consider: What is happening? Who is affected? When did it start?"
            defaultValue={currentCase.problemStatement || ''}
            onBlur={handleBlur}
          />

          {isContextOpen && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
              <label htmlFor="problemContext" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Additional Context
              </label>
              <textarea
                id="problemContext"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                placeholder="Add background, constraints, or any context that helps AI understand the problem."
                value={problemContext}
                onChange={handleContextChange}
              />
            </div>
          )}

          {/* AI Assessment Trigger */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleAssess}
              disabled={isAssessing || !currentCase.problemStatement}
              className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
            >
              {isAssessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
                  <span>AI Assessment</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-red-800">Assessment Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {assessmentResult && (
          <div className="bg-white rounded-2xl border-2 border-brand-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-brand-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-white">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider">AI Coach Feedback</h3>
              </div>
              <button 
                onClick={() => setAssessmentResult(null)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  Deep Analysis
                </h4>
                <div className="prose prose-slate prose-sm max-w-none text-slate-700 bg-slate-50 p-6 rounded-2xl border border-slate-100 leading-relaxed italic">
                  {assessmentResult.critique}
                </div>
              </div>
              
              {assessmentResult.improved_version && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                    Recommended Version
                  </h4>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-accent-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                    <div className="relative bg-white border border-accent-100 p-6 rounded-2xl text-slate-900 font-medium leading-relaxed shadow-sm">
                      {assessmentResult.improved_version}
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        updateA3Case({ ...currentCase, problemStatement: assessmentResult.improved_version });
                        if (textareaRef.current) {
                          textareaRef.current.value = assessmentResult.improved_version;
                        }
                      }}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent-50 text-accent-700 hover:bg-accent-100 text-sm font-bold rounded-xl transition-all border border-accent-200"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Apply Improved Statement
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

};

export default ProblemStatement;
