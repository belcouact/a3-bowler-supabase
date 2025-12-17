
import { useParams } from 'react-router-dom';
import { useApp, DataAnalysisImage } from '../../context/AppContext';
import { useState, useEffect, useRef } from 'react';
import ImageCanvas from '../../components/ImageCanvas';

const DataAnalysis = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Canvas State
  const [images, setImages] = useState<DataAnalysisImage[]>([]);
  const [canvasHeight, setCanvasHeight] = useState(500);

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

  if (!currentCase) {
    return <div className="text-gray-500">Loading case data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Data Analysis</h3>
        <p className="text-gray-500 mb-4">Visualize the data to understand the magnitude and trend of the problem.</p>
        
        {/* Evidence Canvas */}
        <ImageCanvas 
            images={images}
            onImagesChange={saveImages}
            height={canvasHeight}
            onHeightChange={saveCanvasHeight}
        />
        
        <div className="mt-6">
          <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-2">
            Key Observations from Data
          </label>
          <textarea
            ref={textareaRef}
            id="observations"
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
            placeholder="What patterns or insights do you see in the data?"
            defaultValue={currentCase.dataAnalysisObservations || ''}
            onBlur={handleBlur}
          />
        </div>
      </div>
    </div>
  );
};

export default DataAnalysis;
