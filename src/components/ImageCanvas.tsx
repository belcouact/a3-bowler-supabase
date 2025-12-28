import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { Upload, X } from 'lucide-react';
import { DataAnalysisImage } from '../context/AppContext';
import { generateShortId } from '../utils/idUtils';

interface ImageCanvasProps {
  images: DataAnalysisImage[];
  onImagesChange: (images: DataAnalysisImage[]) => void;
  height: number;
  onHeightChange: (height: number) => void;
  label?: string;
  leftControls?: ReactNode;
  onUploadImage?: (file: Blob) => Promise<string>;
}

const ImageCanvas = ({ images, onImagesChange, height, onHeightChange, label = "Evidence Canvas (Paste or Upload Images)", leftControls, onUploadImage }: ImageCanvasProps) => {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingCanvas, setIsResizingCanvas] = useState(false);
  
  // Use Refs for mutable drag state
  const dragStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ w: 0, h: 0, x: 0, y: 0 });
  const resizeHandleRef = useRef<string | null>(null);
  const canvasResizeStartRef = useRef({ h: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Ref to access latest images in event handlers without re-binding
  const imagesRef = useRef(images);
  useEffect(() => {
      imagesRef.current = images;
  }, [images]);

  const handlePasteWithRef = useCallback((e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
              const blob = items[i].getAsFile();
              if (blob) {
                  if (onUploadImage) {
                      (async () => {
                          const src = await onUploadImage(blob);
                          const newImage: DataAnalysisImage = {
                              id: generateShortId(),
                              src,
                              x: 50,
                              y: 50,
                              width: 200,
                              height: 200
                          };
                          const updated = [...imagesRef.current, newImage];
                          onImagesChange(updated);
                      })();
                  } else {
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
                          
                          const updated = [...imagesRef.current, newImage];
                          onImagesChange(updated);
                      };
                      reader.readAsDataURL(blob);
                  }
              }
          }
      }
  }, [onImagesChange, onUploadImage]);

  useEffect(() => {
      document.addEventListener('paste', handlePasteWithRef as any);
      return () => {
          document.removeEventListener('paste', handlePasteWithRef as any);
      };
  }, [handlePasteWithRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (onUploadImage) {
              (async () => {
                  const src = await onUploadImage(file);
                  const newImage: DataAnalysisImage = {
                      id: generateShortId(),
                      src,
                      x: 50,
                      y: 50,
                      width: 200,
                      height: 200
                  };
                  const updated = [...images, newImage];
                  onImagesChange(updated);
              })();
          } else {
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
                  const updated = [...images, newImage];
                  onImagesChange(updated);
              };
              reader.readAsDataURL(file);
          }
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

  const handleCanvasResizeStart = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizingCanvas(true);
      canvasResizeStartRef.current = { h: height, y: e.clientY };
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
      const dy = e.clientY - canvasResizeStartRef.current.y;
      onHeightChange(Math.max(200, canvasResizeStartRef.current.h + dy));
  };

  const handleGlobalMouseUp = () => {
      setIsResizingCanvas(false);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isResizingCanvas) return; // Handled by global listener

      if (!selectedImageId) return;

      if (isDragging) {
          const dx = e.clientX - dragStartRef.current.x;
          const dy = e.clientY - dragStartRef.current.y;
          
          const updated = images.map(img => {
              if (img.id === selectedImageId) {
                  return { ...img, x: img.x + dx, y: img.y + dy };
              }
              return img;
          });
          
          // Optimistic update?
          // If we call onImagesChange on every pixel, it might be slow if it triggers backend saves or complex re-renders.
          // But for local state lifting, it should be fine.
          onImagesChange(updated);
          dragStartRef.current = { x: e.clientX, y: e.clientY };
      } else if (isResizing && resizeHandleRef.current) {
          const dx = e.clientX - dragStartRef.current.x;
          const dy = e.clientY - dragStartRef.current.y;
          const handle = resizeHandleRef.current;

          const updated = images.map(img => {
              if (img.id === selectedImageId) {
                  let newW = img.width;
                  let newH = img.height;
                  let newX = img.x;
                  let newY = img.y;

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
          });
          onImagesChange(updated);
          dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
  };

  const handleMouseUp = () => {
      // isResizingCanvas is now handled globally
      
      if (isDragging || isResizing) {
          setIsDragging(false);
          setIsResizing(false);
          resizeHandleRef.current = null;
      }
  };

  const handleDeleteImage = (id: string) => {
      const newImages = images.filter(i => i.id !== id);
      onImagesChange(newImages);
      setSelectedImageId(null);
  };

  return (
    <div className="mb-6" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <div className="flex space-x-2">
                {leftControls}
                <label className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                    <Upload className="h-4 w-4 mr-0 sm:mr-1" />
                    <span className="hidden sm:inline">Upload Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
            </div>
        </div>
        
        <div 
            ref={canvasRef}
            className="w-full bg-white border-2 border-dashed border-gray-300 rounded-lg relative overflow-hidden select-none"
            style={{ height }}
            onClick={() => setSelectedImageId(null)}
        >
            {/* Canvas Resize Handle */}
            <div 
                className="absolute bottom-0 left-0 right-0 h-4 bg-gray-100 hover:bg-gray-200 cursor-s-resize flex items-center justify-center border-t border-gray-200 z-50"
                onMouseDown={handleCanvasResizeStart}
            >
                <div className="w-10 h-1 bg-gray-400 rounded-full"></div>
            </div>

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
  );
};

export default ImageCanvas;
