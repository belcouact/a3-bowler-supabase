import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp, DataAnalysisImage } from '../../context/AppContext';
import ImageCanvas from '../../components/ImageCanvas';
import { Loader2 } from 'lucide-react';
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
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-3 text-base font-medium text-gray-700">Loading A3 Results & Follow-up...</p>
        </div>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center text-center">
          <p className="mt-3 text-base font-medium text-gray-800">A3 case could not be found.</p>
          <p className="mt-1 text-sm text-gray-500">It may have been deleted or the link is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Results & Follow-up</h3>
        <p className="text-gray-500 mb-4">Document the results achieved after implementing the action plan.</p>
        
        <ImageCanvas 
          images={images}
          onImagesChange={saveImages}
          height={canvasHeight}
          onHeightChange={saveCanvasHeight}
          label="Result Evidence (Paste or Upload Images)"
          onUploadImage={uploadImage}
        />

        <div className="space-y-4 mt-6">
          <div>
            <label htmlFor="results" className="block text-sm font-medium text-gray-700 mb-1">
              Actual Results
            </label>
            <textarea
              ref={textareaRef}
              id="results"
              rows={8}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
              placeholder="Describe what happened after actions were taken..."
              defaultValue={currentCase.results || ''}
              onBlur={handleBlur}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
