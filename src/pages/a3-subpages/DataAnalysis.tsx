
import { useParams } from 'react-router-dom';
import { useApp, DataAnalysisImage } from '../../context/AppContext';
import { useState, useEffect, useRef } from 'react';
import ImageCanvas from '../../components/ImageCanvas';
import { Sparkles, Loader2, AlertCircle, BarChart3, Route, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';

const DataAnalysis = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case, isLoading } = useApp();
  const { user } = useAuth();
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

  const uploadImage = async (file: Blob) => {
    if (!currentCase) {
      return URL.createObjectURL(file);
    }
    if (!user?.username) {
      return URL.createObjectURL(file);
    }

    const result = await dataService.uploadA3Image(
      user.username as string,
      currentCase.id,
      file,
    );

    return result.url;
  };

  // Sync state with context (local cache or previously loaded detail)
  useEffect(() => {
    if (currentCase) {
      if (
        currentCase.dataAnalysisImages &&
        JSON.stringify(currentCase.dataAnalysisImages) !== JSON.stringify(images)
      ) {
        setImages(currentCase.dataAnalysisImages || []);
      }
      if (
        currentCase.dataAnalysisCanvasHeight &&
        currentCase.dataAnalysisCanvasHeight !== canvasHeight
      ) {
        setCanvasHeight(currentCase.dataAnalysisCanvasHeight);
      }

      const newVal = currentCase.dataAnalysisObservations || '';
      if (textareaRef.current && textareaRef.current.value !== newVal) {
        textareaRef.current.value = newVal;
      }
    }
  }, [currentCase?.id]); // Only re-sync on case switch

  // Lazy-load heavy detail (images, canvas height) from backend when needed
  useEffect(() => {
    if (!currentCase || !user?.username) {
      return;
    }

    const alreadyHasImages =
      Array.isArray(currentCase.dataAnalysisImages) &&
      currentCase.dataAnalysisImages.length > 0;

    if (alreadyHasImages) {
      return;
    }

    let cancelled = false;

    const loadDetail = async () => {
      try {
        const detail = await dataService.loadA3Detail(user.username as string, currentCase.id);
        if (!detail || !detail.success || cancelled) {
          return;
        }

        const updatedCase = { ...currentCase };
        let changed = false;

        if (Array.isArray(detail.dataAnalysisImages)) {
          setImages(detail.dataAnalysisImages);
          (updatedCase as any).dataAnalysisImages = detail.dataAnalysisImages;
          changed = true;
        }

        if (typeof detail.dataAnalysisCanvasHeight === 'number') {
          setCanvasHeight(detail.dataAnalysisCanvasHeight);
          (updatedCase as any).dataAnalysisCanvasHeight = detail.dataAnalysisCanvasHeight;
          changed = true;
        }

        if (changed) {
          updateA3Case(updatedCase);
        }
      } catch {
        // Ignore detail load errors; user can still work with local state
      }
    };

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [currentCase?.id, user?.username, updateA3Case]);

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
      const contextText = (currentCase.problemContext || '').trim();
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
          content:
            `Problem Statement:\n${currentCase.problemStatement}` +
            (contextText ? `\n\nAdditional Context:\n${contextText}` : '') +
            `\n\nKey Observations from Data:\n${observations}`
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
      const contextText = (currentCase.problemContext || '').trim();
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
          content:
            `Problem Statement:\n${currentCase.problemStatement}` +
            (contextText ? `\n\nAdditional Context:\n${contextText}` : '') +
            `\n\nKey Observations from Data:\n${observations}`
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
          <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading analysis data...</p>
        </div>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <p className="text-xl font-bold text-slate-900">Case not found</p>
          <p className="mt-2 text-slate-500 max-w-xs">The A3 case you are looking for may have been deleted or moved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">Data Analysis</h2>
        </div>
        <p className="text-slate-500 text-lg leading-relaxed max-w-2xl">
          Visualize facts and evidence. Break down the problem using charts, photos, and objective observations.
        </p>
      </div>

      <div className="space-y-8">
        {/* Visual Evidence Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Visual Evidence & Charts</h3>
            <span className="text-xs text-slate-400 font-medium">Drag and drop images to annotate</span>
          </div>
          <div className="p-1">
            <ImageCanvas
              images={images}
              onImagesChange={saveImages}
              height={canvasHeight}
              onHeightChange={saveCanvasHeight}
              onUploadImage={uploadImage}
            />
          </div>
        </div>

        {/* Observations Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 focus-within:ring-4 focus-within:ring-brand-50 focus-within:border-brand-300">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <label htmlFor="observations" className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Key Observations
            </label>
          </div>
          <textarea
            ref={textareaRef}
            id="observations"
            rows={6}
            className="w-full px-6 py-4 text-slate-700 placeholder-slate-400 border-none focus:ring-0 resize-none text-lg leading-relaxed"
            placeholder="What does the data tell us? List facts, trends, and anomalies observed..."
            defaultValue={currentCase.dataAnalysisObservations || ''}
            onBlur={handleBlur}
          />
          
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-3 justify-end">
            <button
              onClick={handleAnalyzeData}
              disabled={isAnalyzing || !currentCase.problemStatement}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Data</span>
                </>
              )}
            </button>

            <button
              onClick={handleGeneratePlan}
              disabled={isGeneratingPlan || !currentCase.problemStatement}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-brand-600 hover:bg-brand-50 border-2 border-brand-100 text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
            >
              {isGeneratingPlan ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Route className="w-4 h-4" />
                  <span>Troubleshooting Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {(analysisResult || analysisError || troubleshootingPlan || planError) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Analysis Result */}
            {(analysisResult || analysisError) && (
              <div className="bg-white rounded-2xl border-2 border-brand-100 shadow-xl overflow-hidden flex flex-col">
                <div className="bg-brand-600 px-6 py-4 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">AI Data Insights</h3>
                  </div>
                  <button onClick={() => setAnalysisResult(null)} className="text-white/70 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6 flex-grow">
                  {analysisError ? (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl">
                      <AlertCircle className="w-5 h-5" />
                      <p className="text-sm font-medium">{analysisError}</p>
                    </div>
                  ) : (
                    <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {analysisResult}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Troubleshooting Plan */}
            {(troubleshootingPlan || planError) && (
              <div className="bg-white rounded-2xl border-2 border-accent-100 shadow-xl overflow-hidden flex flex-col">
                <div className="bg-accent-600 px-6 py-4 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2 text-white">
                    <Route className="w-4 h-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Troubleshooting Plan</h3>
                  </div>
                  <button onClick={() => setTroubleshootingPlan(null)} className="text-white/70 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6 flex-grow">
                  {planError ? (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl">
                      <AlertCircle className="w-5 h-5" />
                      <p className="text-sm font-medium">{planError}</p>
                    </div>
                  ) : (
                    <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {troubleshootingPlan}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataAnalysis;
