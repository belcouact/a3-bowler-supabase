import React from 'react';

const parseInline = (text: string) => {
  // Split by **bold**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    // Basic URL detection could go here
    return part;
  });
};

export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  // 1. Handle Code Blocks (```)
  const codeBlocks = content.split(/```/);
  return (
    <>
      {codeBlocks.map((block, index) => {
        if (index % 2 === 1) {
          // Code block
          return (
            <pre key={index} className="bg-gray-800 text-gray-100 p-3 rounded-md my-2 overflow-x-auto text-xs font-mono">
              <code>{block.trim()}</code>
            </pre>
          );
        }
        
        // 2. Handle Text Content (Headers, Lists, Bold, Newlines)
        return (
          <div key={index} className="whitespace-pre-wrap leading-relaxed">
            {block.split('\n').map((line, i) => {
              const trimmed = line.trim();
              
              // Headers (###)
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={i} className="font-bold text-base mt-3 mb-1 text-gray-900">
                    {parseInline(trimmed.substring(4))}
                  </h3>
                );
              }
              
              // Lists (- or *)
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={i} className="flex items-start ml-2 mb-1">
                    <span className="mr-2 text-gray-500">•</span>
                    <span>{parseInline(trimmed.substring(2))}</span>
                  </div>
                );
              }

              // Numbered Lists (1.)
              if (/^\d+\.\s/.test(trimmed)) {
                 const match = trimmed.match(/^(\d+)\.\s(.*)/);
                 if (match) {
                     return (
                         <div key={i} className="flex items-start ml-2 mb-1">
                             <span className="mr-2 font-semibold text-gray-600 min-w-[1.5em]">{match[1]}.</span>
                             <span>{parseInline(match[2])}</span>
                         </div>
                     );
                 }
              }
              
              // Regular lines (preserve empty lines)
              if (!trimmed) return <div key={i} className="h-2"></div>;

              return <div key={i} className="mb-1">{parseInline(line)}</div>;
            })}
          </div>
        );
      })}
    </>
  );
};
