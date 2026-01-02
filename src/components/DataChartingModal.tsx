import { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, Activity, Loader2 } from 'lucide-react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import * as XLSX from 'xlsx';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import { MarkdownRenderer } from './MarkdownRenderer';

interface DataChartingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataChartingModal = ({ isOpen, onClose }: DataChartingModalProps) => {
  const toast = useToast();
  const { selectedModel } = useApp();

  const [tableData, setTableData] = useState<string[][]>([]);
  const [chartPrompt, setChartPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [chartOption, setChartOption] = useState<EChartsOption | null>(null);
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [chartOptionRaw, setChartOptionRaw] = useState('');
  const [chartOptionError, setChartOptionError] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!isOpen || !chartContainerRef.current) {
      return;
    }

    const instance = echarts.init(chartContainerRef.current);
    chartInstanceRef.current = instance;

    const handleResize = () => {
      instance.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      try {
        instance.dispose();
      } catch (error) {
        console.error('ECharts dispose error', error);
      }
      if (chartInstanceRef.current === instance) {
        chartInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!chartInstanceRef.current || !chartOption) {
      return;
    }
    chartInstanceRef.current.setOption(chartOption, true);
  }, [chartOption]);

  useEffect(() => {
    if (!chartInstanceRef.current) {
      return;
    }
    chartInstanceRef.current.resize();
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (!isOpen) {
      setChartOption(null);
      setAiInterpretation('');
      setAiError(null);
      setIsGenerating(false);
      setChartOptionRaw('');
      setChartOptionError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!tableData.length) {
      return;
    }
    const columnCount = tableData[0]?.length || 0;
    if (columnCount === 0) {
      return;
    }
    setColumnWidths(prev => {
      if (prev.length === columnCount) {
        return prev;
      }
      if (prev.length === 0) {
        return Array.from({ length: columnCount }, () => 120);
      }
      const next = [...prev];
      while (next.length < columnCount) {
        next.push(120);
      }
      if (next.length > columnCount) {
        next.length = columnCount;
      }
      return next;
    });
  }, [tableData]);

  if (!isOpen) {
    return null;
  }

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return lines.map(line => {
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i += 1;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          cells.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current);
      return cells.map(c => c.trim());
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const name = file.name.toLowerCase();

    if (name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const text = String(e.target?.result || '');
          const data = parseCSV(text);
          if (!data.length) {
            toast.info('Uploaded CSV is empty.');
            return;
          }
          setTableData(data);
          toast.success('CSV data loaded.');
        } catch (error) {
          console.error('CSV parse error', error);
          toast.error('Failed to parse CSV file.');
        }
      };
      reader.readAsText(file);
      return;
    }

    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = e.target?.result;
          if (!data) {
            toast.error('Failed to read Excel file.');
            return;
          }
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 }) as string[][];
          if (!rows.length) {
            toast.info('Uploaded sheet is empty.');
            return;
          }
          setTableData(rows);
          toast.success(`Excel data loaded from sheet "${sheetName}".`);
        } catch (error) {
          console.error('Excel parse error', error);
          toast.error('Failed to parse Excel file.');
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    toast.error('Please upload a CSV or Excel file.');
  };

  const handleAddRow = () => {
    const columns = tableData[0]?.length || 3;
    const newRow = Array.from({ length: columns }, () => '');
    setTableData(prev => [...prev, newRow]);
  };

  const handleAddColumn = () => {
    if (!tableData.length) {
      const newRow = Array.from({ length: 3 }, () => '');
      setTableData([newRow]);
      setColumnWidths([120, 120, 120]);
      return;
    }
    setTableData(prev => prev.map(row => [...row, '']));
    setColumnWidths(prev => (prev.length ? [...prev, prev[prev.length - 1] || 120] : [120]));
  };

  const handleClearData = () => {
    setTableData([]);
    setColumnWidths([]);
  };

  const handleAutoFitColumns = () => {
    if (!tableData.length) {
      toast.info('No data to auto fit. Please add or upload data first.');
      return;
    }

    const rows = tableData;
    const columnCount = rows[0]?.length || 0;
    if (!columnCount) {
      return;
    }

    const nextWidths: number[] = [];
    const minWidth = 80;
    const maxWidth = 400;
    const charWidth = 12;

    for (let col = 0; col < columnCount; col += 1) {
      let maxLen = 0;
      for (let row = 0; row < rows.length; row += 1) {
        const value = rows[row]?.[col] ?? '';
        const len = String(value).length;
        if (len > maxLen) {
          maxLen = len;
        }
      }
      const width = Math.min(maxWidth, Math.max(minWidth, maxLen * charWidth));
      nextWidths.push(width);
    }

    setColumnWidths(nextWidths);
    toast.success('Columns auto fitted to data.');
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setTableData(prev => {
      const next = prev.map(row => [...row]);
      if (!next[rowIndex]) {
        return prev;
      }
      next[rowIndex][colIndex] = value;
      return next;
    });
  };

  const handleChartOptionChange = (value: string) => {
    setChartOptionRaw(value);

    if (!value.trim()) {
      setChartOption(null);
      setChartOptionError(null);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      setChartOption(parsed as EChartsOption);
      setChartOptionError(null);
    } catch (error) {
      setChartOptionError('Invalid JSON. Fix errors to update the chart.');
    }
  };

  const handleGenerateChart = async () => {
    if (!tableData.length) {
      toast.info('Please upload data or enter data into the sheet.');
      return;
    }

    if (!chartPrompt.trim()) {
      toast.info('Please describe how to interpret and chart the data.');
      return;
    }

    setIsGenerating(true);
    setAiError(null);

    try {
      const header = tableData[0] || [];
      const rows = tableData.slice(1);

      const payload = {
        header,
        rows,
        prompt: chartPrompt.trim(),
      };

      const systemMessage =
        'You are a data visualization assistant. You create Apache ECharts option objects and clear explanations. ' +
        'You must respond with strict JSON only, no markdown, no comments.';

      const userMessage = `
Data table (first row is header):
${JSON.stringify(payload, null, 2)}

Task:
- Design an effective chart using Apache ECharts (version 5) based on the data and the prompt.
- Use the data values directly inside the option.
- Prefer simple chart types (line, bar, scatter, pie) unless the prompt clearly asks for something different.

Response format (JSON only, no backticks):
{
  "option": { /* valid ECharts option object using the data above */ },
  "interpretation": "Short explanation of the chart and key insights."
}
`;

      const response = await fetch('https://multi-model-worker.study-llm.me/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || '{}';
      const cleanedForJson = String(rawContent)
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const cleanContent = cleanedForJson
        .replace(
          /,\s*"formatter"\s*:\s*function\s*\([^)]*\)\s*\{[\s\S]*?},/g,
          '},',
        )
        .replace(
          /,\s*"formatter"[\s\S]*?},/g,
          '},',
        )
        .replace(
          /:\s*function\s*\([^)]*\)\s*\{[\s\S]*?\}/g,
          ': null',
        );

      let parsed: any;
      try {
        parsed = JSON.parse(cleanContent);
      } catch (error) {
        console.error('Failed to parse AI chart response', error, cleanContent);
        throw new Error('AI returned invalid JSON for chart option.');
      }

      if (!parsed || typeof parsed !== 'object' || !parsed.option) {
        throw new Error('AI response does not contain a valid "option" field.');
      }

      const baseOption = parsed.option as EChartsOption;

      const enhancedOption: EChartsOption = {
        ...baseOption,
      };

      if (!enhancedOption.toolbox) {
        enhancedOption.toolbox = {};
      }

      if (typeof enhancedOption.toolbox === 'object' && !Array.isArray(enhancedOption.toolbox)) {
        const feature = enhancedOption.toolbox.feature || {};
        enhancedOption.toolbox.feature = {
          ...feature,
          dataZoom: { yAxisIndex: 'none' },
          restore: feature.restore || {},
          saveAsImage: feature.saveAsImage || {},
        };
      }

      if (!enhancedOption.dataZoom) {
        enhancedOption.dataZoom = [
          {
            type: 'slider',
            yAxisIndex: 0,
            orient: 'vertical',
            right: 5,
            top: 60,
            bottom: 40,
          },
        ];
      }

      if (!enhancedOption.grid) {
        enhancedOption.grid = {};
      }

      if (typeof enhancedOption.grid === 'object' && !Array.isArray(enhancedOption.grid)) {
        if (enhancedOption.grid.top === undefined) {
          enhancedOption.grid.top = 80;
        }
      }

      setChartOption(enhancedOption);
      setChartOptionRaw(JSON.stringify(enhancedOption, null, 2));
      setChartOptionError(null);
      setAiInterpretation(typeof parsed.interpretation === 'string' ? parsed.interpretation : '');
      toast.success('Chart generated.');
    } catch (error: any) {
      console.error('Generate chart error', error);
      if (error?.message && (error.message.includes('Failed to fetch') || error.message.includes('Network'))) {
        setAiError('Network error while contacting the AI service. Please check your connection and try again.');
        toast.error('Network error while contacting the AI service.');
      } else {
        setAiError(error?.message || 'Failed to generate chart from AI.');
        toast.error('Failed to generate chart from AI.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-gray-900/60"
        onClick={() => {
          if (!isGenerating) {
            onClose();
          }
        }}
      />
      <div className="relative z-[95] flex h-full w-full flex-col bg-white shadow-2xl border border-gray-200 rounded-none overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              <Activity className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold text-gray-900">Data Charting</h2>
              <p className="text-xs text-gray-500">
                Upload a CSV or Excel file, shape the data, and let AI design an ECharts chart.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isGenerating) {
                onClose();
              }
            }}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-hidden pb-4 pt-3 sm:pb-6 sm:pt-4">
          <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
            <div
              className={
                isSidebarCollapsed
                  ? 'flex w-9 flex-col border-r border-gray-200 bg-gray-50'
                  : 'flex w-full flex-col gap-3 border-r border-gray-200 bg-gray-50 p-3 lg:w-1/2'
              }
            >
              <div className="flex items-center justify-between mb-2">
                {!isSidebarCollapsed && (
                  <span className="text-[11px] font-semibold text-gray-600">
                    Setup
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(prev => !prev)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-300 bg-white text-xs text-gray-600 hover:bg-gray-50"
                  title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isSidebarCollapsed ? '>' : '<'}
                </button>
              </div>

              {!isSidebarCollapsed && (
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1 text-xs">
                  <div className="rounded-md border border-dashed border-gray-300 bg-white p-3">
                    <h3 className="mb-1 flex items-center text-xs font-semibold text-gray-800">
                      <Upload className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
                      Upload Data
                    </h3>
                    <p className="mb-2 text-[11px] text-gray-500">
                      Upload a CSV or Excel file. The first row will be treated as the header.
                    </p>
                    <button
                      type="button"
                      onClick={handleFileButtonClick}
                      className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      <Upload className="mr-1.5 h-3 w-3" />
                      Choose CSV / Excel
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="rounded-md border border-gray-200 bg-white p-3">
                    <h3 className="mb-2 flex items-center text-xs font-semibold text-gray-800">
                      <FileText className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                      Data Sheet
                    </h3>
                    <p className="mb-2 text-[11px] text-gray-500">
                      Edit cells or add rows and columns to adjust your data.
                    </p>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddRow}
                        className="inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                      >
                        + Row
                      </button>
                      <button
                        type="button"
                        onClick={handleAddColumn}
                        className="inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                      >
                        + Column
                      </button>
                      <button
                        type="button"
                        onClick={handleClearData}
                        className="inline-flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleAutoFitColumns}
                        className="inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Auto Fit Columns
                      </button>
                    </div>
                    <div className="max-h-48 overflow-auto rounded border border-gray-200">
                      {tableData.length === 0 ? (
                        <div className="flex items-center justify-center px-3 py-6 text-[11px] text-gray-400">
                          No data yet. Upload a file or add a row to start.
                        </div>
                      ) : (
                        <table className="border-collapse text-[11px]">
                          <colgroup>
                            {(tableData[0] || []).map((_, colIndex) => (
                              <col
                                key={colIndex}
                                style={{
                                  width: columnWidths[colIndex] || 120,
                                  minWidth: 60,
                                }}
                              />
                            ))}
                          </colgroup>
                          <tbody>
                            {tableData.map((row, rowIndex) => (
                              <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-50' : ''}>
                                {row.map((cell, colIndex) => (
                                  <td
                                    key={`${rowIndex}-${colIndex}`}
                                    className="border border-gray-200 px-1 py-0.5"
                                  >
                                    <input
                                      value={cell}
                                      onChange={e =>
                                        handleCellChange(rowIndex, colIndex, e.target.value)
                                      }
                                      className="w-full border-none bg-transparent p-0 text-[11px] focus:outline-none focus:ring-0"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  <div className="rounded-md border border-gray-200 bg-white p-3">
                    <h3 className="mb-1 text-xs font-semibold text-gray-800">
                      How should the data be charted?
                    </h3>
                    <p className="mb-2 text-[11px] text-gray-500">
                      Describe which columns are dimensions and metrics, and what chart you expect.
                    </p>
                    <textarea
                      value={chartPrompt}
                      onChange={e => setChartPrompt(e.target.value)}
                      rows={4}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Example: Use the 'Month' column as X axis and plot 'Actual' and 'Target' as two line series."
                    />
                  </div>

                  <div className="rounded-md border border-gray-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-gray-800">Generate with AI</h3>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                        Model: {selectedModel}
                      </span>
                    </div>
                    <p className="mb-2 text-[11px] text-gray-500">
                      AI will return an ECharts option and a short interpretation based on your data and
                      instructions.
                    </p>
                    {aiError && (
                      <p className="mb-2 text-[11px] text-red-600">
                        {aiError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleGenerateChart}
                      disabled={isGenerating}
                      className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                          Generating chart...
                        </>
                      ) : (
                        <>
                          <Activity className="mr-1.5 h-3 w-3" />
                          Generate Chart with AI
                        </>
                      )}
                    </button>
                  </div>

                  {chartOptionRaw && (
                    <div className="rounded-md border border-gray-200 bg-white p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-gray-800">ECharts Option (JSON)</h3>
                        {chartOptionError && (
                          <span className="text-[10px] text-red-600">
                            {chartOptionError}
                          </span>
                        )}
                      </div>
                      <p className="mb-2 text-[11px] text-gray-500">
                        Edit this JSON to tweak the chart. Valid changes update the chart immediately.
                      </p>
                      <textarea
                        value={chartOptionRaw}
                        onChange={e => handleChartOptionChange(e.target.value)}
                        rows={10}
                        spellCheck={false}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-[11px] font-mono shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="flex-1 rounded-md border border-gray-200 bg-white p-3">
                <h3 className="mb-2 text-xs font-semibold text-gray-800">Chart</h3>
                <div className="relative h-64 w-full sm:h-80 lg:h-[420px]">
                  <div
                    ref={chartContainerRef}
                    className="h-full w-full rounded border border-dashed border-gray-200 bg-gray-50"
                  />
                  {!chartOption && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-gray-400">
                      The chart will appear here after AI generates an ECharts option.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-1 min-h-[140px] flex-col rounded-md border border-gray-200 bg-white p-3">
                <h3 className="mb-1 text-xs font-semibold text-gray-800">AI Interpretation</h3>
                <div className="mt-1 flex-1 overflow-y-auto text-xs text-gray-700">
                  {aiInterpretation ? (
                    <MarkdownRenderer content={aiInterpretation} />
                  ) : (
                    <p className="text-[11px] text-gray-400">
                      After the chart is generated, AI will explain the key patterns and insights here.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
