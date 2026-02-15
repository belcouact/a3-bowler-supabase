import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp, DataAnalysisImage } from '../../context/AppContext';
import ImageCanvas from '../../components/ImageCanvas';
import { Loader2, Trophy, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';

const Result = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case, isLoading } = useApp();
  const { user } = useAuth();
  const currentCase = a3Cases.find(c => c.id === id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Canvas State
  const [images, setImages] = useState<DataAnalysisImage[]>([]);
  const [canvasHeight, setCanvasHeight] = useState(500);

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

  useEffect(() => {
    if (currentCase) {
      if (
        currentCase.resultImages &&
        JSON.stringify(currentCase.resultImages) !== JSON.stringify(images)
      ) {
        setImages(currentCase.resultImages || []);
      }
      if (currentCase.resultCanvasHeight && currentCase.resultCanvasHeight !== canvasHeight) {
        setCanvasHeight(currentCase.resultCanvasHeight);
      }

      const newVal = currentCase.results || '';
      if (textareaRef.current && textareaRef.current.value !== newVal) {
        textareaRef.current.value = newVal;
      }
    }
  }, [currentCase?.id]); // Only re-sync on case switch

  // Lazy-load heavy result detail when needed
  useEffect(() => {
    if (!currentCase || !user?.username) {
      return;
    }

    const alreadyHasImages =
      Array.isArray(currentCase.resultImages) && currentCase.resultImages.length > 0;

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

        if (Array.isArray(detail.resultImages)) {
          setImages(detail.resultImages);
          (updatedCase as any).resultImages = detail.resultImages;
          changed = true;
        }

        if (typeof detail.resultCanvasHeight === 'number') {
          setCanvasHeight(detail.resultCanvasHeight);
          (updatedCase as any).resultCanvasHeight = detail.resultCanvasHeight;
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
          updateA3Case({ ...currentCase, resultImages: newImages });
      }
  };

  const saveCanvasHeight = (height: number) => {
      setCanvasHeight(height);
      if (currentCase) {
          updateA3Case({ ...currentCase, resultCanvasHeight: height });
      }
  };

  const handleBlur = () => {
    if (currentCase && textareaRef.current) {
        const newValue = textareaRef.current.value;
        if (newValue !== currentCase.results) {
            updateA3Case({ ...currentCase, results: newValue });
        }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
          <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading results data...</p>
        </div>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="flex items-center justify-center py-24 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <X className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">A3 Case Not Found</h3>
          <p className="text-slate-500">It may have been deleted or the link is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
            <Trophy className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">Results & Follow-up</h2>
        </div>
        <p className="text-slate-500 text-lg leading-relaxed max-w-2xl">
          Document the tangible outcomes and evidence achieved after implementing your action plan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden p-1 bg-slate-50/30">
          <ImageCanvas 
            images={images}
            onImagesChange={saveImages}
            height={canvasHeight}
            onHeightChange={saveCanvasHeight}
            label="Result Evidence (Paste or Upload Images)"
            onUploadImage={uploadImage}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 focus-within:ring-4 focus-within:ring-brand-50 focus-within:border-brand-300">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <label htmlFor="results" className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Actual Results & Key Learnings
            </label>
          </div>
          <textarea
            ref={textareaRef}
            id="results"
            rows={8}
            className="w-full px-6 py-6 text-slate-700 placeholder-slate-400 border-none focus:ring-0 resize-none text-lg leading-relaxed font-medium"
            placeholder="Describe what happened after actions were taken. What did you learn? Was the target met?"
            defaultValue={currentCase.results || ''}
            onBlur={handleBlur}
          />
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">Changes are saved automatically on blur</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
