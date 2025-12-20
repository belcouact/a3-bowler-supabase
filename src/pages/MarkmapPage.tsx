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

const MarkmapPage = () => {
  const { dashboardMarkdown } = useApp();
  const [markdown, setMarkdown] = useState(dashboardMarkdown);
  const [svgRef, setSvgRef] = useState<SVGSVGElement | null>(null);
  const [mm, setMm] = useState<Markmap | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dashboardMarkdown) {
      setMarkdown(dashboardMarkdown);
    }
  }, [dashboardMarkdown]);

  // Initialize Markmap
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


  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 relative overflow-hidden">
        <div 
          className="h-full w-full relative bg-gray-50"
          ref={wrapperRef}
        >
          <svg className="w-full h-full" ref={setSvgRef} />
        </div>
      </div>
    </div>
  );
};

export default MarkmapPage;
