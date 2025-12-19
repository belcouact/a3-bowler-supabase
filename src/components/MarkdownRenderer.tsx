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

const renderTable = (lines: string[], keyPrefix: number) => {
  const headers = lines[0]
    .split('|')
    .slice(1, -1) // Remove first and last empty strings from splitting |...|
    .map(h => h.trim());
  
  // Skip lines[1] which is the separator |---|---|
  
  const rows = lines.slice(2).map(line => 
    line
      .split('|')
      .slice(1, -1)
      .map(cell => cell.trim())
  );

  return (
    <div key={`table-${keyPrefix}`} className="my-4 overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, i) => (
              <th key={i} scope="col" className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-gray-700">
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  // 1. Handle Code Blocks (```)
  const codeBlocks = content.split(/```/);
  
  return (
    <>
      {codeBlocks.map((block, blockIndex) => {
        if (blockIndex % 2 === 1) {
          // Code block
          return (
            <pre key={`code-${blockIndex}`} className="bg-gray-800 text-gray-100 p-3 rounded-md my-2 overflow-x-auto text-xs font-mono">
              <code>{block.trim()}</code>
            </pre>
          );
        }
        
        // 2. Handle Text Content with Table Support
        const lines = block.split('\n');
        const elements: React.ReactNode[] = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];
          const trimmed = line.trim();
          
          // Check for Table Start
          // Needs to start with | and next line needs to start with | and contain ---
          if (trimmed.startsWith('|')) {
            const nextLine = lines[i + 1]?.trim();
            if (nextLine && nextLine.startsWith('|') && nextLine.includes('---')) {
              const tableLines: string[] = [];
              // Collect all consecutive lines starting with |
              while (i < lines.length && lines[i].trim().startsWith('|')) {
                tableLines.push(lines[i].trim());
                i++;
              }
              elements.push(renderTable(tableLines, i));
              continue; 
            }
          }

          // Headers (###)
          if (trimmed.startsWith('### ')) {
            elements.push(
              <h3 key={`h3-${i}`} className="font-bold text-base mt-4 mb-2 text-gray-900 border-b border-gray-100 pb-1">
                {parseInline(trimmed.substring(4))}
              </h3>
            );
            i++;
            continue;
          }
          
          if (trimmed.startsWith('#### ')) {
             elements.push(
              <h4 key={`h4-${i}`} className="font-semibold text-sm mt-3 mb-1 text-gray-800 uppercase tracking-wide">
                {parseInline(trimmed.substring(5))}
              </h4>
            );
            i++;
            continue;
          }

          // Lists (- or *)
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            elements.push(
              <div key={`list-${i}`} className="flex items-start ml-2 mb-1.5">
                <span className="mr-2 text-indigo-500 mt-1">•</span>
                <span className="text-gray-700">{parseInline(trimmed.substring(2))}</span>
              </div>
            );
            i++;
            continue;
          }

          // Numbered Lists (1.)
          const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
             elements.push(
                 <div key={`num-${i}`} className="flex items-start ml-2 mb-1.5">
                     <span className="mr-2 font-semibold text-indigo-600 min-w-[1.5em]">{numMatch[1]}.</span>
                     <span className="text-gray-700">{parseInline(numMatch[2])}</span>
                 </div>
             );
             i++;
             continue;
          }
          
          // Regular lines (preserve empty lines as spacing)
          if (!trimmed) {
            elements.push(<div key={`empty-${i}`} className="h-2"></div>);
            i++;
            continue;
          }

          // Paragraph
          elements.push(
            <div key={`p-${i}`} className="mb-1.5 text-gray-700 leading-relaxed">
              {parseInline(line)}
            </div>
          );
          i++;
        }

        return <div key={`block-${blockIndex}`} className="whitespace-pre-wrap">{elements}</div>;
      })}
    </>
  );
};
