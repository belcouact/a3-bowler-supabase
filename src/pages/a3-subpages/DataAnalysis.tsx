
import { useParams } from 'react-router-dom';
import { useApp, DataAnalysisImage } from '../../context/AppContext';
import { useState, useEffect, useRef } from 'react';
import ImageCanvas from '../../components/ImageCanvas';
import { Sparkles, Loader2, AlertCircle, BarChart3, Route, X, Upload, Microscope, BrainCircuit, ArrowRight, Lightbulb } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import clsx from 'clsx';

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-brand-200 rounded-full animate-ping opacity-20"></div>
          <div className="relative bg-white p-4 rounded-full shadow-xl border border-brand-100">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Loading analysis data...</p>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-4">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-red-100 rotate-3">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-slate-900">Case not found</h3>
          <p className="text-slate-500 max-w-md mx-auto">The A3 case you are looking for may have been deleted or you don't have permission to view it.</p>
        </div>
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-brand-50 to-white border border-brand-100 rounded-xl text-brand-600 shadow-sm">
              <Microscope className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 font-display tracking-tight">Data Analysis</h2>
          </div>
          <p className="text-slate-500 text-base leading-relaxed max-w-2xl pl-1">
            Visualize facts and evidence. Break down the problem using charts, photos, and objective observations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Visual Evidence (Canvas) */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-500">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-brand-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Visual Evidence & Charts</h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                <Upload className="w-3 h-3" />
                <span>Drag & Drop enabled</span>
              </div>
            </div>
            <div className="p-1.5 bg-slate-100/50">
              <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-[0.03] pointer-events-none mix-blend-multiply"></div>
                <ImageCanvas
                  images={images}
                  onImagesChange={saveImages}
                  height={canvasHeight}
                  onHeightChange={saveCanvasHeight}
                  onUploadImage={uploadImage}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Observations & AI Tools */}
        <div className="xl:col-span-4 space-y-6">
          {/* Observations Input */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px] xl:h-auto xl:min-h-[500px] group hover:shadow-md transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-500/10 focus-within:border-brand-400">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Microscope className="w-4 h-4 text-brand-500" />
                <label htmlFor="observations" className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Key Observations
                </label>
              </div>
              <span className="text-xs text-slate-400 font-medium px-2">Markdown supported</span>
            </div>
            
            <div className="flex-grow relative bg-white">
              <textarea
                ref={textareaRef}
                id="observations"
                className="w-full h-full p-6 text-slate-700 placeholder-slate-400 border-none focus:ring-0 resize-none text-base leading-relaxed font-mono bg-transparent"
                placeholder="What does the data tell us?
• List facts
• Note trends
• Identify anomalies..."
                defaultValue={currentCase.dataAnalysisObservations || ''}
                onBlur={handleBlur}
              />
              <div className="absolute bottom-4 right-4 pointer-events-none opacity-10">
                <Microscope className="w-24 h-24 text-slate-900" />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAnalyzeData}
                disabled={isAnalyzing || !currentCase.problemStatement}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none group/btn relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
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
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-700 hover:text-brand-700 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-4 h-4" />
                    <span>Generate Plan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section - Full Width */}
      {(analysisResult || analysisError || troubleshootingPlan || planError) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          {/* Analysis Result */}
          {(analysisResult || analysisError) && (
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-3xl opacity-20 blur group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full">
                <div className="bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-4 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2.5 text-white">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-shadow-sm">AI Data Insights</h3>
                  </div>
                  <button 
                    onClick={() => setAnalysisResult(null)} 
                    className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-8 flex-grow">
                  {analysisError ? (
                    <div className="flex items-center gap-3 text-red-600 bg-red-50 p-6 rounded-2xl border border-red-100">
                      <AlertCircle className="w-6 h-6 shrink-0" />
                      <p className="text-sm font-medium">{analysisError}</p>
                    </div>
                  ) : (
                    <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed">
                      <div className="whitespace-pre-wrap">{analysisResult}</div>
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 font-medium flex justify-between items-center">
                   <span>Generated by AI Coach</span>
                   <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Troubleshooting Plan */}
          {(troubleshootingPlan || planError) && (
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl opacity-20 blur group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2.5 text-white">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Route className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-shadow-sm">Troubleshooting Plan</h3>
                  </div>
                  <button 
                    onClick={() => setTroubleshootingPlan(null)} 
                    className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-8 flex-grow">
                  {planError ? (
                    <div className="flex items-center gap-3 text-red-600 bg-red-50 p-6 rounded-2xl border border-red-100">
                      <AlertCircle className="w-6 h-6 shrink-0" />
                      <p className="text-sm font-medium">{planError}</p>
                    </div>
                  ) : (
                    <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed">
                      <div className="whitespace-pre-wrap">{troubleshootingPlan}</div>
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 font-medium flex justify-between items-center">
                   <span>Suggested Action Plan</span>
                   <div className="flex gap-2 items-center text-emerald-600 font-bold cursor-pointer hover:underline">
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3" />
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataAnalysis;
