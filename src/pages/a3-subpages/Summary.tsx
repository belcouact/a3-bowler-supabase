import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useState, useRef } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { MindMap } from '../../components/MindMap';

const Summary = () => {
  const { id } = useParams();
  const { a3Cases } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [rootCauseView, setRootCauseView] = useState<'text' | 'mindmap'>(() =>
    currentCase && currentCase.mindMapNodes && currentCase.mindMapNodes.length > 0
      ? 'mindmap'
      : 'text'
  );
  const toast = useToast();

  const handleExportPDF = async () => {
    if (!contentRef.current || !currentCase) return;

    try {
      setIsExporting(true);
      const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => element.classList.contains('export-ignore'),
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new JsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      
      const ratio = Math.min((pdfWidth - 20) / imgProps.width, (pdfHeight - 20) / imgProps.height);
      const imgWidth = imgProps.width * ratio;
      const imgHeight = imgProps.height * ratio;
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`A3-${currentCase.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!currentCase) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-3 text-base font-medium text-gray-700">Loading application data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={contentRef}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">A3 Problem Solving Report</h3>
        <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className="export-ignore px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Problem Statement */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">1. Problem Statement</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p><span className="font-medium text-gray-900">Problem:</span> {currentCase.problemStatement || 'Not defined'}</p>
            </div>
          </div>

          {/* Root Cause */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2 border-b pb-1">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                3. Root Cause Analysis (5 Whys)
              </h4>
              {currentCase.mindMapNodes && currentCase.mindMapNodes.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setRootCauseView(rootCauseView === 'text' ? 'mindmap' : 'text')
                  }
                  className="px-2 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {rootCauseView === 'text' ? 'Show mindmap snapshot' : 'Show text summary'}
                </button>
              )}
            </div>
            <div className="text-sm text-gray-600 space-y-4">
              {rootCauseView === 'text' ? (
                <>
                  {currentCase.mindMapText && (
                    <div className="bg-gray-50 p-3 rounded border border-gray-100">
                      <h5 className="text-xs font-semibold text-gray-500 mb-1">
                        5 Whys Analysis:
                      </h5>
                      <p className="whitespace-pre-wrap font-mono text-xs">
                        {currentCase.mindMapText}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                currentCase.mindMapNodes &&
                currentCase.mindMapNodes.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded border border-gray-100">
                    <h5 className="text-xs font-semibold text-gray-500 mb-2">
                      5 Whys Mindmap Snapshot:
                    </h5>
                    <div className="pointer-events-none">
                      <MindMap initialNodes={currentCase.mindMapNodes} autoHeight />
                    </div>
                  </div>
                )
              )}
              {/* Identified Root Cause */}
              <div>
                <h5 className="text-xs font-semibold text-gray-500 mb-1">
                  Identified Root Cause:
                </h5>
                {currentCase.rootCause ? (
                  <p className="whitespace-pre-wrap">{currentCase.rootCause}</p>
                ) : (
                  <p className="italic text-gray-500">
                    Root cause not identified yet.
                  </p>
                )}
              </div>
            </div>
          </div>

           {/* Results */}
           <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">5. Results & Follow-up</h4>
            
            {/* Result Images */}
            {currentCase.resultImages && currentCase.resultImages.length > 0 && (
                <div className="mb-4">
                    <h5 className="text-xs font-semibold text-gray-600 mb-2">Result Evidence</h5>
                    <div 
                        className="relative w-full bg-gray-50 border border-gray-200 rounded overflow-hidden"
                        style={{
                            height: Math.max(150, ...currentCase.resultImages.map(img => (img.y + img.height) * 0.5)) + 20
                        }}
                    >
                         <div className="w-full h-full relative">
                            {currentCase.resultImages.map(img => (
                                <div
                                    key={img.id}
                                    style={{
                                        position: 'absolute',
                                        left: img.x * 0.5, // Scale down positions slightly for summary view
                                        top: img.y * 0.5,
                                        width: img.width * 0.5,
                                        height: img.height * 0.5,
                                    }}
                                >
                                    <img 
                                        src={img.src} 
                                        alt="result evidence" 
                                        className="w-full h-full object-contain" 
                                    />
                                </div>
                            ))}
                         </div>
                         <div className="absolute bottom-1 right-1 text-[10px] text-gray-400">
                             * Scaled (50%)
                         </div>
                    </div>
                </div>
            )}

            <div className="text-sm text-gray-600 space-y-2">
              <p><span className="font-medium text-gray-900">Outcome:</span> {currentCase.results || 'No results recorded yet.'}</p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Data Analysis */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">2. Data Analysis</h4>
            
            {/* Evidence Images */}
            {currentCase.dataAnalysisImages && currentCase.dataAnalysisImages.length > 0 && (
                <div className="mb-4">
                    <h5 className="text-xs font-semibold text-gray-600 mb-2">Evidence</h5>
                    <div 
                        className="relative w-full bg-gray-50 border border-gray-200 rounded overflow-hidden"
                        style={{
                            height: Math.max(150, ...currentCase.dataAnalysisImages.map(img => (img.y + img.height) * 0.5)) + 20
                        }}
                    >
                         <div className="w-full h-full relative">
                            {currentCase.dataAnalysisImages.map(img => (
                                <div
                                    key={img.id}
                                    style={{
                                        position: 'absolute',
                                        left: img.x * 0.5, // Scale down positions slightly for summary view
                                        top: img.y * 0.5,
                                        width: img.width * 0.5,
                                        height: img.height * 0.5,
                                    }}
                                >
                                    <img 
                                        src={img.src} 
                                        alt="evidence" 
                                        className="w-full h-full object-contain" 
                                    />
                                </div>
                            ))}
                         </div>
                         <div className="absolute bottom-1 right-1 text-[10px] text-gray-400">
                             * Scaled (50%)
                         </div>
                    </div>
                </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
                <span className="font-semibold block mb-1">Observation:</span>
                {currentCase.dataAnalysisObservations || 'No data observations recorded.'}
            </p>
          </div>

          {/* Action Plan */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2 border-b pb-1">4. Action Plan</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCase.actionPlanTasks && currentCase.actionPlanTasks.length > 0 ? (
                    currentCase.actionPlanTasks.map(task => (
                      <tr key={task.id}>
                        <td className="px-2 py-1 text-xs text-gray-900">{task.name}</td>
                        <td className="px-2 py-1 text-xs text-gray-500">{task.owner}</td>
                        <td className="px-2 py-1 text-xs text-gray-600">{task.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-2 py-4 text-xs text-center text-gray-500">No actions defined.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
