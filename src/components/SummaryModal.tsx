import React from 'react';
import { X, Download, Copy, Sparkles, TrendingUp, AlertTriangle, Target, Activity, ArrowRight } from 'lucide-react';
import jsPDF from 'jspdf';
import { useToast } from '../context/ToastContext';
import { MarkdownRenderer } from './MarkdownRenderer';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  isLoading: boolean;
}

interface MetricPerformance {
  name: string;
  latestPerformance: string;
  trendAnalysis: string | null;
}

interface PerformanceGroup {
  groupName: string;
  metrics: MetricPerformance[];
}

interface AreaOfConcern {
  metricName: string;
  groupName: string;
  issue: string;
  suggestion: string;
}

interface SummaryData {
  executiveSummary: string;
  performanceGroups: PerformanceGroup[];
  a3Summary?: string;
  areasOfConcern: AreaOfConcern[];
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose, content, isLoading }) => {
  const toast = useToast();

  if (!isOpen) return null;

  let parsedData: SummaryData | null = null;
  let isJson = false;

  try {
    if (content && !isLoading) {
      const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanContent);
      if (parsedData && parsedData.executiveSummary && Array.isArray(parsedData.performanceGroups)) {
          isJson = true;
      }
    }
  } catch (e) {
    // Content might be plain text/markdown if old version or parsing failed
    isJson = false;
  }

  const handleCopy = () => {
    if (isJson && parsedData) {
        let textToCopy = `Executive Summary:\n${parsedData.executiveSummary}\n\n`;
        
        if (parsedData.a3Summary && parsedData.a3Summary.trim() !== '') {
          textToCopy += `A3 Problem Solving Summary:\n${parsedData.a3Summary}\n\n`;
        }

        textToCopy += `Performance Analysis:\n`;
        parsedData.performanceGroups.forEach(group => {
            textToCopy += `\nGroup: ${group.groupName}\n`;
            group.metrics.forEach(m => {
                const trendText = m.trendAnalysis && m.trendAnalysis.trim() !== '' ? ` | Trend: ${m.trendAnalysis}` : '';
                textToCopy += `- ${m.name}: ${m.latestPerformance}${trendText}\n`;
            });
        });

        textToCopy += `\nAreas of Concern & Recommendations:\n`;
        parsedData.areasOfConcern.forEach(area => {
            textToCopy += `- ${area.metricName} (${area.groupName}): ${area.issue}\n  Suggestion: ${area.suggestion}\n`;
        });

        navigator.clipboard.writeText(textToCopy);
    } else {
        navigator.clipboard.writeText(content);
    }
    toast.success('Summary copied to clipboard!');
  };

  const handleDownload = () => {
    const doc = new jsPDF({
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxWidth = pageWidth - margin * 2;
    let cursorY = margin;

    const addTextBlock = (title: string, body: string) => {
      if (!body || body.trim() === '') return;

      const titleLines = doc.splitTextToSize(title, maxWidth);
      const bodyLines = doc.splitTextToSize(body, maxWidth);
      const blockLines = [...titleLines, '', ...bodyLines];

      blockLines.forEach((line) => {
        if (cursorY > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += 16;
      });

      cursorY += 8;
    };

    if (isJson && parsedData) {
      addTextBlock('Executive Summary', parsedData.executiveSummary);

      if (parsedData.a3Summary && parsedData.a3Summary.trim() !== '') {
        addTextBlock('A3 Problem Solving Summary', parsedData.a3Summary);
      }

      let performanceText = '';
      parsedData.performanceGroups.forEach((group) => {
        performanceText += `\n[Group] ${group.groupName}\n`;
        group.metrics.forEach((m) => {
          const trendText =
            m.trendAnalysis && m.trendAnalysis.trim() !== ''
              ? ` | Trend: ${m.trendAnalysis}`
              : '';
          performanceText += `- ${m.name}: ${m.latestPerformance}${trendText}\n`;
        });
      });
      addTextBlock('Performance Analysis', performanceText.trim());

      let concernText = '';
      parsedData.areasOfConcern.forEach((area) => {
        concernText += `- ${area.metricName} (${area.groupName}): ${area.issue}\n  Suggestion: ${area.suggestion}\n\n`;
      });
      if (!concernText) {
        concernText = 'No major areas of concern identified. Keep up the good work!';
      }
      addTextBlock('Areas of Concern & Recommendations', concernText.trim());
    } else {
      const clean = content.replace(/```[\s\S]*?```/g, '').trim() || content;
      addTextBlock('Summary', clean);
    }

    const filename = `metric_bowler_summary_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    toast.success('PDF downloaded!');
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 py-6 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-[75vw] sm:w-full">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-50 via-white to-white px-4 py-4 sm:px-6 border-b border-indigo-100 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 shadow-sm mr-4">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                    Smart Summary & Insights
                    </h3>
                    <div className="flex items-center mt-1 space-x-3 text-xs font-medium text-gray-500">
                        <span className="flex items-center bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                            <TrendingUp className="w-3 h-3 mr-1" /> Performance Analysis
                        </span>
                    </div>
                </div>
            </div>
            <button
                onClick={onClose}
                className="bg-white rounded-md p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition-all"
            >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:p-6 bg-white overflow-y-auto custom-scrollbar max-h-[75vh]">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full py-16 space-y-8">
                    <div className="relative w-32 h-32">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-sm"></div>
                        <div className="absolute inset-3 rounded-full border-2 border-indigo-200 border-dashed animate-spin"></div>
                        <div className="absolute inset-6 rounded-full bg-white flex items-center justify-center shadow-md">
                            <Sparkles className="w-7 h-7 text-indigo-600 animate-pulse" />
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <h4 className="text-lg font-medium text-gray-900">Crafting your AI summary</h4>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">
                            Analyzing metrics, trends, and A3 cases to surface the most important insights.
                        </p>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100 animate-pulse">
                            <Activity className="w-3 h-3 text-indigo-500" />
                            <span>Scanning metrics</span>
                        </div>
                        <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100 animate-pulse" style={{ animationDelay: '0.15s' }}>
                            <TrendingUp className="w-3 h-3 text-purple-500" />
                            <span>Finding trends</span>
                        </div>
                        <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100 animate-pulse" style={{ animationDelay: '0.3s' }}>
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            <span>Highlighting risks</span>
                        </div>
                    </div>
                </div>
            ) : isJson && parsedData ? (
                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm">
                        <h4 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center">
                            <Target className="w-5 h-5 mr-2 text-indigo-600" />
                            Executive Overview
                        </h4>
                        <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                            {parsedData.executiveSummary}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Latest Performance */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                <h4 className="text-base font-semibold text-gray-800 flex items-center">
                                    <Activity className="w-4 h-4 mr-2 text-blue-600" />
                                    Latest Month Performance
                                </h4>
                            </div>
                            <div className="p-4 space-y-6">
                                {parsedData.performanceGroups.map((group, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1">
                                            {group.groupName}
                                        </h5>
                                        <div className="space-y-2">
                                            {group.metrics.map((metric, mIdx) => (
                                                <div key={mIdx} className="flex justify-between items-center text-sm">
                                                    <span className="font-medium text-gray-700">{metric.name}</span>
                                                    <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded-md text-xs">{metric.latestPerformance}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Trend Analysis */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                <h4 className="text-base font-semibold text-gray-800 flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
                                    Consecutive Failing Trends
                                </h4>
                            </div>
                            <div className="p-4 space-y-6">
                                {parsedData.performanceGroups.map((group, idx) => {
                                    const failingMetrics = group.metrics.filter(m => m.trendAnalysis && m.trendAnalysis.trim() !== '');
                                    if (failingMetrics.length === 0) return null;

                                    return (
                                        <div key={idx} className="space-y-2">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1">
                                                {group.groupName}
                                            </h5>
                                            <div className="space-y-2">
                                                {failingMetrics.map((metric, mIdx) => (
                                                    <div key={mIdx} className="flex justify-between items-center text-sm">
                                                        <span className="font-medium text-gray-700">{metric.name}</span>
                                                        <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded-md text-xs">{metric.trendAnalysis}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {parsedData.performanceGroups.every(g => g.metrics.every(m => !m.trendAnalysis || m.trendAnalysis.trim() === '')) && (
                                     <p className="text-sm text-gray-500 italic text-center py-4">No consecutive failing metrics identified.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {parsedData.a3Summary && parsedData.a3Summary.trim() !== '' && (
                      <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-sm">
                        <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                          <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                          A3 Problem Solving Summary
                        </h4>
                        <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                          {parsedData.a3Summary}
                        </p>
                      </div>
                    )}

                    {/* Areas of Concern & Suggestions */}
                    <div className="bg-red-50/30 p-6 rounded-xl border border-red-100">
                        <h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                            Areas of Concern & Recommendations
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                            {parsedData.areasOfConcern.map((area, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                                    <div className="flex items-center mb-2">
                                        <span className="text-sm font-bold text-gray-900 mr-2">{area.metricName}</span>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{area.groupName}</span>
                                    </div>
                                    <p className="text-sm text-red-700 mb-2 font-medium">
                                        <span className="mr-1">⚠️</span> {area.issue}
                                    </p>
                                    <div className="flex items-start text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                        <ArrowRight className="w-4 h-4 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                                        <p className="italic">{area.suggestion}</p>
                                    </div>
                                </div>
                            ))}
                            {parsedData.areasOfConcern.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No major areas of concern identified. Keep up the good work!</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // Fallback for non-JSON content or errors
                <div className="prose prose-sm max-w-none prose-indigo prose-headings:text-indigo-900 prose-a:text-indigo-600">
                    <MarkdownRenderer content={content} />
                </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 w-full">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={handleDownload}
              disabled={isLoading || !content}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={handleCopy}
              disabled={isLoading || !content}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
