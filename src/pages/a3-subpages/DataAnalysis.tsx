
import { useParams } from 'react-router-dom';
import { useApp, DataAnalysisImage } from '../../context/AppContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { generateShortId } from '../../utils/idUtils';
import { Upload, X } from 'lucide-react';

const DataAnalysis = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Canvas State
  const [images, setImages] = useState<DataAnalysisImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // Use Refs for mutable drag state to avoid closure staleness and excessive re-renders
  const dragStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ w: 0, h: 0, x: 0, y: 0 });
  const resizeHandleRef = useRef<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync state with context
  useEffect(() => {
    if (currentCase) {
        if (currentCase.dataAnalysisImages && JSON.stringify(currentCase.dataAnalysisImages) !== JSON.stringify(images)) {
             setImages(currentCase.dataAnalysisImages || []);
        }
        
        const newVal = currentCase.dataAnalysisObservations || '';
        if (textareaRef.current && textareaRef.current.value !== newVal) {
            textareaRef.current.value = newVal;
        }
    }
  }, [currentCase?.id]); // Only re-sync on case switch

  const saveImages = (newImages: DataAnalysisImage[]) => {
      if (currentCase) {
          updateA3Case({ ...currentCase, dataAnalysisImages: newImages });
      }
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
              const blob = items[i].getAsFile();
              if (blob) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                      const src = event.target?.result as string;
                      const newImage: DataAnalysisImage = {
                          id: generateShortId(),
                          src,
                          x: 50,
                          y: 50,
                          width: 200,
                          height: 200 // Default size
                      };
                      
                      setImages(prev => {
                          const updated = [...prev, newImage];
                          saveImages(updated);
                          return updated;
                      });
                  };
                  reader.readAsDataURL(blob);
              }
          }
      }
  }, [currentCase]); // Removed images dependency

  useEffect(() => {
      // Add global paste listener when component is mounted
      document.addEventListener('paste', handlePaste as any);
      return () => {
          document.removeEventListener('paste', handlePaste as any);
      };
  }, [handlePaste]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const src = event.target?.result as string;
              const newImage: DataAnalysisImage = {
                  id: generateShortId(),
                  src,
                  x: 50,
                  y: 50,
                  width: 200,
                  height: 200
              };
              setImages(prev => {
                  const updated = [...prev, newImage];
                  saveImages(updated);
                  return updated;
              });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleMouseDown = (e: React.MouseEvent, imageId: string) => {
      e.stopPropagation();
      setSelectedImageId(imageId);
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleResizeStart = (e: React.MouseEvent, imageId: string, handle: string) => {
      e.stopPropagation();
      setSelectedImageId(imageId);
      setIsResizing(true);
      resizeHandleRef.current = handle;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      const img = images.find(i => i.id === imageId);
      if (img) {
          resizeStartRef.current = { w: img.width, h: img.height, x: img.x, y: img.y };
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!selectedImageId) return;

      if (isDragging) {
          const dx = e.clientX - dragStartRef.current.x;
          const dy = e.clientY - dragStartRef.current.y;
          
          setImages(prev => prev.map(img => {
              if (img.id === selectedImageId) {
                  return { ...img, x: img.x + dx, y: img.y + dy };
              }
              return img;
          }));
          dragStartRef.current = { x: e.clientX, y: e.clientY };
      } else if (isResizing && resizeHandleRef.current) {
          const dx = e.clientX - dragStartRef.current.x;
          const dy = e.clientY - dragStartRef.current.y;
          const handle = resizeHandleRef.current;

          setImages(prev => prev.map(img => {
              if (img.id === selectedImageId) {
                  let newW = img.width;
                  let newH = img.height;
                  let newX = img.x;
                  let newY = img.y;

                  // Incremental update approach
                  if (handle.includes('r')) newW = Math.max(50, img.width + dx);
                  if (handle.includes('l')) {
                      const potentialW = img.width - dx;
                      if (potentialW > 50) {
                          newW = potentialW;
                          newX = img.x + dx;
                      }
                  }
                  if (handle.includes('b')) newH = Math.max(50, img.height + dy);
                  if (handle.includes('t')) {
                      const potentialH = img.height - dy;
                      if (potentialH > 50) {
                          newH = potentialH;
                          newY = img.y + dy;
                      }
                  }

                  return { ...img, width: newW, height: newH, x: newX, y: newY };
              }
              return img;
          }));
          dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
  };

  const handleMouseUp = () => {
      if (isDragging || isResizing) {
          setIsDragging(false);
          setIsResizing(false);
          resizeHandleRef.current = null;
          // Persist changes
          // Note: we can't trust 'images' state here to be the very latest if React batched updates are pending,
          // but for mouseUp it's usually fine. 
          // However, to be safe, we should save the *current* images state which is what the user sees.
          // Since we updated 'images' in mouseMove, the next render will have them.
          // But here 'images' might be stale if we didn't use refs for everything.
          // Actually, saving inside setImages callback is safest but excessive (saves on every pixel drag).
          // We want to save only on MouseUp.
          // We can use a ref to track "latest images" or just trust that React's render cycle is fast enough.
          // Given we are updating state on every move, 'images' in this closure might be stale.
          // But wait, handleMouseUp is a closure. It closes over 'images' from the *start* of the render.
          // If we drag, we trigger re-renders. The last re-render's handleMouseUp has the last 'images'.
          // So it should be fine.
          
          // Small optimization: only save if we were actually doing something
          saveImages(images); 
      }
  };

  const handleDeleteImage = (id: string) => {
      const newImages = images.filter(i => i.id !== id);
      setImages(newImages);
      saveImages(newImages);
      setSelectedImageId(null);
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
    <div className="space-y-6" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Data Analysis</h3>
        <p className="text-gray-500 mb-4">Visualize the data to understand the magnitude and trend of the problem.</p>
        
        {/* Evidence Canvas */}
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                    Evidence Canvas (Paste or Upload Images)
                </label>
                <div className="flex space-x-2">
                    <label className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                        <Upload className="h-4 w-4 mr-1" />
                        Upload Image
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>
            
            <div 
                ref={canvasRef}
                className="w-full h-[500px] bg-white border-2 border-dashed border-gray-300 rounded-lg relative overflow-hidden select-none"
                onClick={() => setSelectedImageId(null)}
            >
                {images.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                        <p>Paste (Ctrl+V) images here or click Upload</p>
                    </div>
                )}

                {images.map(img => (
                    <div
                        key={img.id}
                        style={{
                            position: 'absolute',
                            left: img.x,
                            top: img.y,
                            width: img.width,
                            height: img.height,
                            cursor: isDragging && selectedImageId === img.id ? 'grabbing' : 'grab',
                            border: selectedImageId === img.id ? '2px solid #3b82f6' : '1px solid transparent',
                            zIndex: selectedImageId === img.id ? 10 : 1
                        }}
                        onMouseDown={(e) => handleMouseDown(e, img.id)}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={img.src} 
                            alt="evidence" 
                            className="w-full h-full object-contain pointer-events-none" 
                        />
                        
                        {selectedImageId === img.id && (
                            <>
                                {/* Resize Handles - Corners */}
                                <div 
                                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize z-20"
                                    onMouseDown={(e) => handleResizeStart(e, img.id, 'tl')}
                                />
                                <div 
                                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize z-20"
                                    onMouseDown={(e) => handleResizeStart(e, img.id, 'tr')}
                                />
                                <div 
                                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize z-20"
                                    onMouseDown={(e) => handleResizeStart(e, img.id, 'bl')}
                                />
                                <div 
                                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize z-20"
                                    onMouseDown={(e) => handleResizeStart(e, img.id, 'br')}
                                />

                                {/* Resize Handles - Sides */}
                                <div 
                                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-n-resize z-20"
                                    onMouseDown={(e) => handleResizeStart(e, img.id, 't')}
                                />
                                <div 
                                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full cursor-s-resize z-20"
                                    onMouseDown={(e) => handleResizeStart(e, img.id, 'b')}
                                />
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-w-resize z-20"
                                    onMouseDown={(e) => handleResizeStart(e, img.id, 'l')}
                                />
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-e-resize z-20"
                                    onMouseDown={(e) => handleResizeStart(e, img.id, 'r')}
                                />
                                {/* Delete Button */}
                                <button
                                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md z-30"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}
                                    title="Remove Image"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
        
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
