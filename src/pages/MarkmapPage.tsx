import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { Toolbar } from 'markmap-toolbar';
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css';

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
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden" ref={containerRef}>
      <div className="flex-none p-4 bg-white border-b border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Visualize your goals and problems</p>
        </div>
        <div className="flex items-center space-x-4">
             <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" onChange={handleUseExample} />
                <span>Show Example</span>
             </label>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Editor Pane */}
        <div 
            style={{ width: `${splitPosition}%` }} 
            className="flex flex-col border-r border-gray-200 bg-white"
        >
            <textarea
                className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                value={markdown}
                onChange={handleMarkdownChange}
                placeholder="Type your markdown here..."
            />
        </div>

        {/* Resizer Handle */}
        <div
          className="w-1 cursor-col-resize hover:bg-blue-500 bg-gray-200 transition-colors z-10 shrink-0"
          onMouseDown={handleMouseDown}
        />

        {/* Preview Pane */}
        <div 
            className="flex-1 h-full relative bg-white min-w-0"
            ref={wrapperRef}
        >
          <svg className="w-full h-full" ref={setSvgRef} />
        </div>
      </div>
    </div>
  );
};

export default MarkmapPage;
