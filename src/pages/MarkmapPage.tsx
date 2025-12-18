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



const EXAMPLE_MARKDOWN = `---
title: markmap
markmap:
  colorFreezeLevel: 2
  maxWidth: 400
---

## Links

- \`https://markmap.js.org/\`
- \`https://github.com/gera2ld/markmap\`

## Related Projects

- \`https://github.com/gera2ld/coc-markmap\` for Neovim
- \`https://marketplace.visualstudio.com/items?itemName=gera2ld.markmap-vscode\` for VSCode
- \`https://github.com/emacs-eaf/eaf-markmap\` for Emacs

## Features

Note that if blocks and lists appear at the same level, the lists will be ignored.

### Lists

- **strong** ~~del~~ *italic* ==highlight==
- \`inline code\`
- [x] checkbox
- Now we can wrap very very very very long text with the \`maxWidth\` option
- Ordered list
  1. item 1
  2. item 2

### Blocks

\`\`\`js
console.log('hello, JavaScript')
\`\`\`

| Products | Price |
|-|-|
| Apple | 4 |
| Banana | 2 |

![](https://markmap.js.org/favicon.png)`;

const MarkmapPage = () => {
  const { dashboardMarkdown, updateDashboardMarkdown } = useApp();
  const [markdown, setMarkdown] = useState(dashboardMarkdown);
  const [svgRef, setSvgRef] = useState<SVGSVGElement | null>(null);
  const [mm, setMm] = useState<Markmap | null>(null);
  const [splitPosition, setSplitPosition] = useState(40); // Percentage
  const [activeTab, setActiveTab] = useState<'Mind Map' | 'Text Input'>('Mind Map');
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync local state with context when context changes (e.g. initial load)
  useEffect(() => {
    if (dashboardMarkdown) {
      setMarkdown(dashboardMarkdown);
    }
  }, [dashboardMarkdown]);

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setMarkdown(newVal);
    updateDashboardMarkdown(newVal);
  };

  // Initialize Markmap
  useEffect(() => {
    if (svgRef && !mm) {
      const newMm = Markmap.create(svgRef);
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

  // Update Markmap data when markdown changes
  useEffect(() => {
    if (mm) {
      const { root } = transformer.transform(markdown);
      mm.setData(root);
      mm.fit();
    }
  }, [mm, markdown]);

  // Handle Resize to keep centered
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

  // Resizable logic
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

  const handleUseExample = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setMarkdown(EXAMPLE_MARKDOWN);
      updateDashboardMarkdown(EXAMPLE_MARKDOWN);
    } else {
      const defaultVal = `# A3 Bowler
## Metric Bowler
- Track KPIs
  - Safety
  - Quality
  - Delivery
  - Cost
- Monthly Targets
  - Plan
  - Actual
- Gap Analysis
  - Deviation
  - Reason
## A3 Problem Solving
- Problem Statement
  - Description
  - Impact
- Root Cause Analysis
  - 5 Whys
  - Fishbone
- Action Plan
  - What
  - Who
  - When
`;
      setMarkdown(defaultVal);
      updateDashboardMarkdown(defaultVal);
    }
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
        {/* Mind Map View (Split) */}
        <div 
          className={clsx("h-full w-full", activeTab === 'Mind Map' ? "flex" : "hidden")} 
          ref={containerRef}
        >
          <div 
            style={{ width: `${splitPosition}%` }} 
            className="h-full border-r border-gray-200 flex flex-col bg-white"
          >
            <div className="p-2 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Markdown Editor</span>
              <div className="flex items-center space-x-2">
                 <label className="flex items-center space-x-1 cursor-pointer text-xs text-gray-600 hover:text-gray-900">
                    <input 
                      type="checkbox" 
                      className="rounded text-blue-600 focus:ring-blue-500"
                      onChange={handleUseExample}
                    />
                    <span>Load Example</span>
                 </label>
              </div>
            </div>
            <textarea
              className="flex-1 w-full p-4 resize-none focus:outline-none focus:ring-inset focus:ring-2 focus:ring-blue-500/50 font-mono text-sm leading-relaxed"
              value={markdown}
              onChange={handleMarkdownChange}
              placeholder="Enter markdown here..."
            />
          </div>
          
          {/* Draggable Handle */}
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

        {/* Text Input View (Full) */}
        <div className={clsx("h-full w-full p-6 bg-gray-50", activeTab === 'Text Input' ? "block" : "hidden")}>
           <div className="h-full max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
              <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                 <span className="text-sm font-semibold text-gray-700">Full Text Editor</span>
                 <span className="text-xs text-gray-500">Changes here update the Mind Map automatically</span>
              </div>
              <textarea
                className="flex-1 w-full p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                value={markdown}
                onChange={handleMarkdownChange}
                placeholder="Enter markdown text here..."
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default MarkmapPage;
