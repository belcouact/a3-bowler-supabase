import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AssessmentResult {
  critique: string;
  improved_version: string;
}

interface TroubleshootingPlan {
  immediate_checks: string[];
  data_collection: string[];
  hypotheses_to_test: string[];
  short_term_countermeasures: string[];
  long_term_preventive_actions: string[];
}

const ProblemStatement = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [troubleshootingPlan, setTroubleshootingPlan] = useState<TroubleshootingPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    if (currentCase && textareaRef.current) {
      const newVal = currentCase.problemStatement || '';
      // Only update if the value is different to avoid cursor jumping if active
      if (textareaRef.current.value !== newVal) {
          textareaRef.current.value = newVal;
      }
    }
  }, [currentCase?.problemStatement]);

  const handleAssess = async () => {
    if (!currentCase?.problemStatement) return;
    
    setIsAssessing(true);
    setError(null);
    setAssessmentResult(null);

    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert A3 Problem Solving coach.
          The user will provide a Problem Statement.
          
          Instructions:
          1. Detect the language of the user's problem statement.
          2. Assess if the problem statement is good using the 5W2H criteria (Who, What, Where, When, Which, How Often, How Much Impact).
          3. Provide a critique in the SAME language as the user's input.
          4. Offer an improved, clearer version of the problem statement in the SAME language as the user's input.
          
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
          content: `Problem Statement: "${currentCase.problemStatement}"`
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

  const handleGeneratePlan = async () => {
    if (!currentCase?.problemStatement) return;

    setIsGeneratingPlan(true);
    setPlanError(null);
    setTroubleshootingPlan(null);

    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert manufacturing and operations troubleshooting coach.
          
          The user will provide a single Problem Statement.

          Your task:
          - Generate a practical troubleshooting plan to address this problem.
          - Use the SAME language as the user's problem statement.
          
          RETURN JSON ONLY with the following keys:
          - "immediate_checks": string[] (quick checks or verifications)
          - "data_collection": string[] (what data to gather and how)
          - "hypotheses_to_test": string[] (plausible causes to validate)
          - "short_term_countermeasures": string[] (containment / quick fixes)
          - "long_term_preventive_actions": string[] (system changes to prevent recurrence)

          Requirements:
          - Each array should contain 3–7 concise, actionable bullet items.
          - Do not include any prose outside the JSON object.`
        },
        {
          role: 'user',
          content: `Problem Statement: "${currentCase.problemStatement}"`
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

      if (!response.ok) throw new Error('Failed to generate troubleshooting plan');

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || '{}';

      content = content
        .replace(/^```json\s*|\s*```$/g, '')
        .replace(/^```\s*|\s*```$/g, '')
        .trim();

      try {
        const parsed = JSON.parse(content) as Partial<TroubleshootingPlan>;

        const normalizeArray = (value: unknown): string[] => {
          if (Array.isArray(value)) {
            return value
              .map(item => (typeof item === 'string' ? item.trim() : ''))
              .filter(item => item.length > 0);
          }
          if (typeof value === 'string' && value.trim()) {
            return [value.trim()];
          }
          return [];
        };

        const plan: TroubleshootingPlan = {
          immediate_checks: normalizeArray(parsed.immediate_checks),
          data_collection: normalizeArray(parsed.data_collection),
          hypotheses_to_test: normalizeArray(parsed.hypotheses_to_test),
          short_term_countermeasures: normalizeArray(parsed.short_term_countermeasures),
          long_term_preventive_actions: normalizeArray(parsed.long_term_preventive_actions),
        };

        const hasContent =
          plan.immediate_checks.length > 0 ||
          plan.data_collection.length > 0 ||
          plan.hypotheses_to_test.length > 0 ||
          plan.short_term_countermeasures.length > 0 ||
          plan.long_term_preventive_actions.length > 0;

        if (!hasContent) {
          throw new Error('Empty plan');
        }

        setTroubleshootingPlan(plan);
      } catch (e) {
        console.error('Troubleshooting JSON Parse Error', e, content);
        setPlanError('AI returned an unexpected format. Please try again.');
      }
    } catch (err) {
      setPlanError('Failed to generate troubleshooting plan. Please try again.');
    } finally {
      setIsGeneratingPlan(false);
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

  if (!currentCase) {
    return <div className="text-gray-500">Loading case data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Problem Statement</h3>
        <p className="text-gray-500 mb-4">Clearly define the gap between the current state and the desired state.</p>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="problem" className="block text-sm font-medium text-gray-700">
                What is the problem?
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAssess}
                  disabled={isAssessing || !currentCase.problemStatement}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAssessing ? (
                    <>
                      <Loader2 className="animate-spin -ml-0.5 mr-2 h-3 w-3" />
                      Assessing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="-ml-0.5 mr-2 h-3 w-3" />
                      AI Assessment
                    </>
                  )}
                </button>
                <button
                  onClick={handleGeneratePlan}
                  disabled={isGeneratingPlan || !currentCase.problemStatement}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPlan ? (
                    <>
                      <Loader2 className="animate-spin -ml-0.5 mr-2 h-3 w-3" />
                      Generating plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="-ml-0.5 mr-2 h-3 w-3" />
                      AI Troubleshooting Plan
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              id="problem"
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
              placeholder="Describe the problem..."
              defaultValue={currentCase.problemStatement || ''}
              onBlur={handleBlur}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {assessmentResult && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mt-4">
                <div className="bg-indigo-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-indigo-900 flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 text-indigo-600" />
                        AI Assessment Result
                    </h3>
                    <button 
                        onClick={() => setAssessmentResult(null)}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Critique</h4>
                        <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap font-mono">
                            {assessmentResult.critique}
                        </div>
                    </div>
                    
                    {assessmentResult.improved_version && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                Suggested Improvement
                            </h4>
                            <div className="bg-green-50 border border-green-100 p-3 rounded-md text-sm text-gray-800 font-medium whitespace-pre-wrap">
                                {assessmentResult.improved_version}
                            </div>
                            <button
                                onClick={() => {
                                    updateA3Case({ ...currentCase, problemStatement: assessmentResult.improved_version });
                                    if (textareaRef.current) {
                                        textareaRef.current.value = assessmentResult.improved_version;
                                    }
                                }}
                                className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                Apply this version
                            </button>
                        </div>
                    )}
                </div>
            </div>
          )}

          {planError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{planError}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {troubleshootingPlan && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mt-6">
              <div className="bg-blue-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-sm font-bold text-blue-900 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
                  AI Troubleshooting Plan
                </h3>
                <button
                  onClick={() => setTroubleshootingPlan(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {troubleshootingPlan.immediate_checks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Immediate Checks
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                      {troubleshootingPlan.immediate_checks.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {troubleshootingPlan.data_collection.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Data Collection
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                      {troubleshootingPlan.data_collection.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {troubleshootingPlan.hypotheses_to_test.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Hypotheses to Test
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                      {troubleshootingPlan.hypotheses_to_test.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {troubleshootingPlan.short_term_countermeasures.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Short-term Countermeasures
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                      {troubleshootingPlan.short_term_countermeasures.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {troubleshootingPlan.long_term_preventive_actions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Long-term Preventive Actions
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                      {troubleshootingPlan.long_term_preventive_actions.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemStatement;
