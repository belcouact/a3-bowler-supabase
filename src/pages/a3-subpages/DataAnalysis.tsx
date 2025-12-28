
import { useParams } from 'react-router-dom';
import { useApp, DataAnalysisImage } from '../../context/AppContext';
import { useState, useEffect, useRef } from 'react';
import ImageCanvas from '../../components/ImageCanvas';
import { Sparkles, Loader2, AlertCircle, BarChart3, Route, X } from 'lucide-react';

const DataAnalysis = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Canvas State
  const [images, setImages] = useState<DataAnalysisImage[]>([]);
  const [canvasHeight, setCanvasHeight] = useState(500);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [troubleshootingPlan, setTroubleshootingPlan] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  // Sync state with context
  useEffect(() => {
    if (currentCase) {
        if (currentCase.dataAnalysisImages && JSON.stringify(currentCase.dataAnalysisImages) !== JSON.stringify(images)) {
             setImages(currentCase.dataAnalysisImages || []);
        }
        if (currentCase.dataAnalysisCanvasHeight && currentCase.dataAnalysisCanvasHeight !== canvasHeight) {
            setCanvasHeight(currentCase.dataAnalysisCanvasHeight);
        }
        
        const newVal = currentCase.dataAnalysisObservations || '';
        if (textareaRef.current && textareaRef.current.value !== newVal) {
            textareaRef.current.value = newVal;
        }
    }
  }, [currentCase?.id]); // Only re-sync on case switch

  const saveImages = (newImages: DataAnalysisImage[]) => {
      setImages(newImages);
      if (currentCase) {
          updateA3Case({ ...currentCase, dataAnalysisImages: newImages });
      }
  };

  const saveCanvasHeight = (height: number) => {
      setCanvasHeight(height);
      if (currentCase) {
          updateA3Case({ ...currentCase, dataAnalysisCanvasHeight: height });
      }
  };

  const handleBlur = () => {
    if (currentCase && textareaRef.current) {
        const newValue = textareaRef.current.value;
        if (newValue !== currentCase.dataAnalysisObservations) {
            updateA3Case({ ...currentCase, dataAnalysisObservations: newValue });
        }
    }
  };

  const handleAnalyzeData = async () => {
    if (!currentCase?.problemStatement) return;
    const observations = textareaRef.current?.value || currentCase.dataAnalysisObservations || '';
    if (!observations.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert troubleshooting coach, skilled in many areas.

The user is working on an A3 Problem Solving form.

You will be given:
- A Problem Statement
- Key observations from data analysis

Your tasks:
1) Evaluate whether the current data seems adequate to understand the problem.
2) Suggest what additional data or evidence should be collected if needed.
3) Briefly discuss potential implications or likely causes suggested by the data.

Respond in English, even if the user's inputs are in another language.

Structure the answer with clear markdown headings:
## Data Adequacy
## Additional Evidence Needed
## Potential Implications of Cause`
        },
        {
          role: 'user',
          content: `Problem Statement: "${currentCase.problemStatement}"

Key Observations from Data:
${observations}`
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

      if (!response.ok) throw new Error('Failed to analyze data');

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || '';
      content = content.replace(/^```[\s\S]*?```/g, '').trim();

      setAnalysisResult(content);
    } catch (err) {
      setAnalysisError('Failed to analyze data. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!currentCase?.problemStatement) return;
    const observations = textareaRef.current?.value || currentCase.dataAnalysisObservations || '';

    setIsGeneratingPlan(true);
    setPlanError(null);
    setTroubleshootingPlan(null);

    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert troubleshooting coach, skilled in many areas.
          
The user is working on an A3 Problem Solving form.

You will receive:
- A single Problem Statement
- Key observations from the data analysis section

Your task:
- Generate a practical troubleshooting plan to address this problem.
- Use the evidence to suggest where to focus first.
- Respond in English by default, even if the inputs are in another language.

Structure the response as clear sections with markdown headings:
1. Immediate Checks
2. Data Collection
3. Hypotheses to Test

For each bullet, be specific and actionable, but concise.`
        },
        {
          role: 'user',
          content: `Problem Statement:
${currentCase.problemStatement}

Key Observations from Data:
${observations}`
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
      let content = data.choices?.[0]?.message?.content || '';

      content = content.replace(/^```[\s\S]*?```/g, '').trim();

      setTroubleshootingPlan(content);
    } catch (err) {
      setPlanError('Failed to generate troubleshooting plan. Please try again.');
    } finally {
      setIsGeneratingPlan(false);
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
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Data Analysis</h3>
        <p className="text-gray-500 mb-4">Visualize the data to understand the magnitude and trend of the problem.</p>

        <p className="mb-4 text-xs text-gray-500">
          Use AI to generate a troubleshooting plan and visualize evidence to support the analysis.
        </p>

        {planError && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-4 w-4 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-2 text-xs text-red-700">
                {planError}
              </div>
            </div>
          </div>
        )}

        {/* Evidence Canvas */}
        <ImageCanvas 
          images={images}
          onImagesChange={saveImages}
          height={canvasHeight}
          onHeightChange={saveCanvasHeight}
          leftControls={
            <button
              type="button"
              onClick={handleGeneratePlan}
              disabled={isGeneratingPlan || !currentCase.problemStatement}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPlan ? (
                <>
                  <Loader2 className="animate-spin -ml-0.5 mr-2 h-3 w-3" />
                  <span className="hidden sm:inline">Generating plan...</span>
                </>
              ) : (
                <>
                  <Route className="-ml-0.5 mr-0 sm:mr-2 h-3 w-3" />
                  <span className="hidden sm:inline">AI Troubleshooting Plan</span>
                </>
              )}
            </button>
          }
        />
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="observations" className="block text-sm font-medium text-gray-700">
              Key Observations from Data
            </label>
            <button
              type="button"
              onClick={handleAnalyzeData}
              disabled={
                isAnalyzing ||
                !currentCase.problemStatement ||
                !(textareaRef.current?.value || currentCase.dataAnalysisObservations)
              }
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin -ml-0.5 mr-2 h-3 w-3" />
                  <span className="hidden sm:inline">Analyzing...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="-ml-0.5 mr-0 sm:mr-2 h-3 w-3" />
                  <span className="hidden sm:inline">AI Evidence Review</span>
                </>
              )}
            </button>
          </div>
          <textarea
            ref={textareaRef}
            id="observations"
            rows={8}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
            placeholder="What patterns or insights do you see in the data?"
            defaultValue={currentCase.dataAnalysisObservations || ''}
            onBlur={handleBlur}
          />
          {analysisError && (
            <div className="mt-3 rounded-md bg-red-50 p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-2 text-sm text-red-700">
                  {analysisError}
                </div>
              </div>
            </div>
          )}
          {analysisResult && (
            <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-indigo-50 px-4 py-2 border-b border-gray-200">
                <h3 className="text-xs font-bold text-indigo-900 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-indigo-600" />
                  AI Evidence Adequacy & Cause Insight
                </h3>
              </div>
              <div className="p-4">
                <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap">
                  {analysisResult}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {troubleshootingPlan && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setTroubleshootingPlan(null)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setTroubleshootingPlan(null)}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-2">
                <h3 className="text-sm leading-6 font-semibold text-gray-900 mb-3 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
                  AI Troubleshooting Plan
                </h3>
                <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap">
                  {troubleshootingPlan}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnalysis;
