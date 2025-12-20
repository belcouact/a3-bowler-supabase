import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { Toolbar } from 'markmap-toolbar';
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css';
import clsx from 'clsx';

// Register highlight.js globally so markmap might pick it up if it checks window
if (typeof window !== 'undefined') {
    (window as any).hljs = hljs;
}

const transformer = new Transformer();

// Configure transformer to NOT request highlight.js from CDN
// since we have imported it locally
transformer.urlBuilder.getUrl = (url: string) => {
    if (url.includes('highlight.js') || url.includes('highlight.min.js')) {
        return '';
    }
    return url;
};

// Also try to remove it from the built-in plugins if possible
// but urlBuilder is the main interception point for assets

// Do not strip HTML tags, preserve all characters
// @ts-ignore
if (transformer.assets && transformer.assets.styles) {
    // Attempt to inject style to preserve whitespace if needed, but mainly we rely on markmap's rendering
}

const MarkmapPage = () => {
  const { dashboardMarkdown, updateDashboardMarkdown } = useApp();
  const [markdown, setMarkdown] = useState(dashboardMarkdown);
  const [svgRef, setSvgRef] = useState<SVGSVGElement | null>(null);
  const [mm, setMm] = useState<Markmap | null>(null);
  const [splitPosition, setSplitPosition] = useState(40);
  const [activeTab, setActiveTab] = useState<'Mind Map' | 'Text Input'>('Mind Map');
  
  // Independent state for Text Input tab
  const [textInputMarkdown, setTextInputMarkdown] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textInputWrapperRef = useRef<HTMLDivElement>(null);
  const [textInputSvgRef, setTextInputSvgRef] = useState<SVGSVGElement | null>(null);
  const [textInputMm, setTextInputMm] = useState<Markmap | null>(null);
  const [textInputSplitPosition, setTextInputSplitPosition] = useState(40);

  // Sync local state with context when context changes (e.g. initial load)
  useEffect(() => {
    if (dashboardMarkdown) {
      setMarkdown(dashboardMarkdown);
      // Initialize text input markdown if empty
      if (!textInputMarkdown) {
          setTextInputMarkdown(dashboardMarkdown);
      }
    }
  }, [dashboardMarkdown]);

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setMarkdown(newVal);
    updateDashboardMarkdown(newVal);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setTextInputMarkdown(e.target.value);
  };

  // Initialize Markmap for Mind Map Tab
  useEffect(() => {
    if (svgRef && !mm) {
      const newMm = Markmap.create(svgRef, {
        maxWidth: 200,
        nodeMinHeight: 16,
        paddingX: 8,
      });
      setMm(newMm);
      
      // Add toolbar
      if (wrapperRef.current) {
         const toolbar = Toolbar.create(newMm);
         toolbar.setBrand(false);
         toolbar.el.style.position = 'absolute';
         toolbar.el.style.bottom = '1rem';
         toolbar.el.style.right = '1rem';
         wrapperRef.current.appendChild(toolbar.el);
      }
    }
  }, [svgRef, mm]);

  // Initialize Markmap for Text Input Tab
  useEffect(() => {
    if (textInputSvgRef && !textInputMm) {
      const newMm = Markmap.create(textInputSvgRef, {
        maxWidth: 200,
        nodeMinHeight: 16,
        paddingX: 8,
      });
      setTextInputMm(newMm);
      
      // Add toolbar
      if (textInputWrapperRef.current) {
         const toolbar = Toolbar.create(newMm);
         toolbar.setBrand(false);
         toolbar.el.style.position = 'absolute';
         toolbar.el.style.bottom = '1rem';
         toolbar.el.style.right = '1rem';
         textInputWrapperRef.current.appendChild(toolbar.el);
      }
    }
  }, [textInputSvgRef, textInputMm]);

  // Update Markmap data when markdown changes (Mind Map Tab)
  useEffect(() => {
    if (mm) {
      const { root } = transformer.transform(markdown);
      mm.setData(root);
      mm.fit();
    }
  }, [mm, markdown]);

  // Update Markmap data when markdown changes (Text Input Tab)
  useEffect(() => {
    if (textInputMm) {
      const { root } = transformer.transform(textInputMarkdown);
      textInputMm.setData(root);
      textInputMm.fit();
    }
  }, [textInputMm, textInputMarkdown]);

  // Handle Resize to keep centered (Mind Map Tab)
  useEffect(() => {
    if (!wrapperRef.current || !mm) return;

    const observer = new ResizeObserver(() => {
      mm.fit();
    });

    observer.observe(wrapperRef.current);

    return () => {
      observer.disconnect();
    };
  }, [mm]);

  // Handle Resize to keep centered (Text Input Tab)
  useEffect(() => {
    if (!textInputWrapperRef.current || !textInputMm) return;

    const observer = new ResizeObserver(() => {
        textInputMm.fit();
    });

    observer.observe(textInputWrapperRef.current);

    return () => {
      observer.disconnect();
    };
  }, [textInputMm]);

  // Resizable logic for Mind Map Tab
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth > 10 && newWidth < 90) {
        setSplitPosition(newWidth);
      }
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Resizable logic for Text Input Tab
  const handleTextInputMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleTextInputMouseMove);
    document.addEventListener('mouseup', handleTextInputMouseUp);
  };

  const handleTextInputMouseMove = (e: MouseEvent) => {
    const container = document.getElementById('text-input-container');
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth > 10 && newWidth < 90) {
        setTextInputSplitPosition(newWidth);
      }
    }
  };

  const handleTextInputMouseUp = () => {
    document.removeEventListener('mousemove', handleTextInputMouseMove);
    document.removeEventListener('mouseup', handleTextInputMouseUp);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          className={clsx(
            "px-6 py-3 font-medium text-sm transition-colors relative", 
            activeTab === 'Mind Map' 
              ? "text-blue-600" 
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          )}
          onClick={() => setActiveTab('Mind Map')}
        >
          Mind Map
          {activeTab === 'Mind Map' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          className={clsx(
            "px-6 py-3 font-medium text-sm transition-colors relative", 
            activeTab === 'Text Input' 
              ? "text-blue-600" 
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          )}
          onClick={() => setActiveTab('Text Input')}
        >
          Text Input
          {activeTab === 'Text Input' && (
             <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div 
          className={clsx("h-full w-full", activeTab === 'Mind Map' ? "flex" : "hidden")} 
          ref={containerRef}
        >
          <div 
            style={{ width: `${splitPosition}%` }} 
            className="h-full border-r border-gray-200 flex flex-col bg-white"
          >
            <textarea
              className="flex-1 w-full p-4 resize-none focus:outline-none focus:ring-inset focus:ring-2 focus:ring-blue-500/50 font-mono text-sm leading-relaxed"
              value={markdown}
              onChange={handleMarkdownChange}
              placeholder="Enter markdown here..."
            />
          </div>
          
          <div
            className="w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-400 absolute z-10 transition-colors"
            style={{ left: `${splitPosition}%`, transform: 'translateX(-50%)' }}
            onMouseDown={handleMouseDown}
          />

          <div 
            style={{ width: `${100 - splitPosition}%` }} 
            className="h-full relative bg-gray-50"
            ref={wrapperRef}
          >
            <svg className="w-full h-full" ref={setSvgRef} />
          </div>
        </div>

        <div 
          id="text-input-container"
          className={clsx("h-full w-full", activeTab === 'Text Input' ? "flex" : "hidden")} 
        >
          <div 
            style={{ width: `${textInputSplitPosition}%` }} 
            className="h-full border-r border-gray-200 flex flex-col bg-white"
          >
            <textarea
              className="flex-1 w-full p-4 resize-none focus:outline-none focus:ring-inset focus:ring-2 focus:ring-blue-500/50 font-mono text-sm leading-relaxed"
              value={textInputMarkdown}
              onChange={handleTextInputChange}
              placeholder="Enter markdown here..."
            />
          </div>
          
          <div
            className="w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-400 absolute z-10 transition-colors"
            style={{ left: `${textInputSplitPosition}%`, transform: 'translateX(-50%)' }}
            onMouseDown={handleTextInputMouseDown}
          />

          <div 
            style={{ width: `${100 - textInputSplitPosition}%` }} 
            className="h-full relative bg-gray-50"
            ref={textInputWrapperRef}
          >
            <svg className="w-full h-full" ref={setTextInputSvgRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkmapPage;
