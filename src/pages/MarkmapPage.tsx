import { useState, useEffect, useRef } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { Toolbar } from 'markmap-toolbar';
import { Split } from 'lucide-react';

const transformer = new Transformer();

const exampleMarkdown = `---
title: markmap
markmap:
  colorFreezeLevel: 2
  maxWidth: 400
---

## Links

- [https://markmap.js.org/](https://markmap.js.org/)
- [https://github.com/gera2ld/markmap](https://github.com/gera2ld/markmap)

## Related Projects

- [https://github.com/gera2ld/coc-markmap](https://github.com/gera2ld/coc-markmap) for Neovim
- [https://marketplace.visualstudio.com/items?itemName=gera2ld.markmap-vscode](https://marketplace.visualstudio.com/items?itemName=gera2ld.markmap-vscode) for VSCode
- [https://github.com/emacs-eaf/eaf-markmap](https://github.com/emacs-eaf/eaf-markmap) for Emacs

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
  const [markdown, setMarkdown] = useState(`# A3 Bowler
## Metric Bowler
- Track KPIs
- Monthly Targets
- Gap Analysis
## A3 Problem Solving
- Problem Statement
- Root Cause Analysis
- Action Plan
`);
  const [useExample, setUseExample] = useState(false);
  const [savedMarkdown, setSavedMarkdown] = useState('');
  const [svgRef, setSvgRef] = useState<SVGSVGElement | null>(null);
  const [mm, setMm] = useState<Markmap | null>(null);
  const [splitPosition, setSplitPosition] = useState(40); // Percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Handle Example Checkbox
  useEffect(() => {
    if (useExample) {
        setSavedMarkdown(markdown);
        setMarkdown(exampleMarkdown);
    } else if (savedMarkdown) {
        setMarkdown(savedMarkdown);
    }
  }, [useExample]);

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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white w-full">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <Split className="w-5 h-5 mr-2" />
            Strategy to Metric Linkage
        </h2>
        <span className="text-xs text-gray-500">
            Convert markdown text to mindmap for better visualization
        </span>
      </div>
      
      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* Editor Pane */}
        <div 
            style={{ width: `${splitPosition}%` }} 
            className="h-full border-r border-gray-200 flex flex-col shrink-0"
        >
          <textarea
            className="w-full h-full p-4 resize-none focus:outline-none font-mono text-sm bg-gray-50"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Type your markdown here..."
            disabled={useExample}
          />
          <div className="p-2 border-t border-gray-200 bg-gray-50 flex items-center">
            <input 
                type="checkbox" 
                id="useExample" 
                checked={useExample} 
                onChange={(e) => setUseExample(e.target.checked)}
                className="mr-2"
            />
            <label htmlFor="useExample" className="text-sm text-gray-700 select-none cursor-pointer">
                Use Example
            </label>
          </div>
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
