import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
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
          1. Assess if the problem statement is good using the specific criteria below. Provide a critique in Markdown format. 
        
            ## 问题描述评估标准 
            请逐项检查并指出不足： 
            
            - **谁 (Who)**: 明确涉及的人员、部门、角色 
            - **哪个 (Which)**: 具体的产品、设备、系统、流程 
            - **什么 (What)**: 具体的问题现象，避免模糊描述 
            - **哪里 (Where)**: 具体的发生地点、位置、环节 
            - **何时 (When)**: 使用具体日期时间，避免相对时间 
            - **频率 (How Often)**: 量化的发生频率 
            - **影响 (How Much Impact)**: 量化的影响程度 
        
        2. Offer an improved, clearer version of the problem statement (plain text). 
            
            ## 建议的完整问题描述版本 
            基于上述分析，提供符合所有标准的问题描述示例。 
            
            **重要要求**： 
            - 必须包含所有关键方面：何时、何地、谁、什么、频率、影响程度 
            - 专业、简洁，中文不超过50个字符，英文不超过100个单词 
            - 只提供建议的问题描述，不包含原因分析和措施建议 
        
        Requirements: 
        - **Readability**: Break text into short paragraphs (max 3 lines). Use bullet points where possible. 
        
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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Problem Statement</h3>
        <p className="text-gray-500 mb-4">Clearly define the gap between the current state and the desired state.</p>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor="problem" className="block text-sm font-medium text-gray-700">
                What is the problem?
                </label>
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
                                    setAssessmentResult(null);
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
        </div>
      </div>
    </div>
  );
};

export default ProblemStatement;
