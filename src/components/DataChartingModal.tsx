import { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Activity,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Settings,
  Wand2,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import type * as echartsType from 'echarts';
import type { EChartsOption } from 'echarts';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import { MarkdownRenderer } from './MarkdownRenderer';

interface DataChartingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SampleDatasetType =
  | 'pareto'
  | 'sankey'
  | 'boxplot'
  | 'normal'
  | 'timeSeries'
  | 'stackedBar'
  | 'dualAxis'
  | 'funnel';

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
   const [isSampleMenuOpen, setIsSampleMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echartsType.ECharts | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const container = chartContainerRef.current;
    if (!container) {
      return;
    }

    let isInitializing = false;
    let isCancelled = false;

    const safeInit = async () => {
      if (isCancelled) {
        return;
      }
      if (isInitializing || chartInstanceRef.current) {
        return;
      }
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }
      isInitializing = true;
      try {
        const echartsModule = await import('echarts');
        if (isCancelled) {
          return;
        }
        const created = echartsModule.init(container);
        chartInstanceRef.current = created;
      } catch (error) {
        console.error('ECharts init error', error);
      } finally {
        isInitializing = false;
      }
    };

    void safeInit();

    const handleResize = () => {
      try {
        if (!chartInstanceRef.current) {
          void safeInit();
          return;
        }
        chartInstanceRef.current.resize();
      } catch (error) {
        console.error('ECharts resize error', error);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isCancelled = true;
      window.removeEventListener('resize', handleResize);
      const current = chartInstanceRef.current;
      if (current) {
        try {
          current.dispose();
        } catch (error) {
          console.error('ECharts dispose error', error);
        }
        if (chartInstanceRef.current === current) {
          chartInstanceRef.current = null;
        }
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!chartInstanceRef.current || !chartOption) {
      return;
    }
    try {
      chartInstanceRef.current.setOption(chartOption, true);
      chartInstanceRef.current.resize();
    } catch (error) {
      console.error('ECharts setOption error', error);
    }
  }, [chartOption, isOpen]);

  useEffect(() => {
    if (!chartInstanceRef.current) {
      return;
    }
    try {
      chartInstanceRef.current.resize();
    } catch (error) {
      console.error('ECharts resize error', error);
    }
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
      reader.onload = async e => {
        try {
          const data = e.target?.result;
          if (!data) {
            toast.error('Failed to read Excel file.');
            return;
          }
          const XLSX = await import('xlsx');
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

  const runGenerateChart = async (data: string[][], prompt: string) => {
    if (!data.length) {
      toast.info('Please upload data or enter data into the sheet.');
      return;
    }

    if (!prompt.trim()) {
      toast.info('Please describe how to interpret and chart the data.');
      return;
    }

    setIsGenerating(true);
    setAiError(null);

    try {
      const header = data[0] || [];
      const rows = data.slice(1);
      const userGoal = prompt.trim();

      const payload = {
        header,
        rows,
      };

      const systemMessage =
        "You are an expert data visualization analyst and a master of the Apache ECharts library (version 5). Your core task is to interpret a user's request and data, then generate the most effective and insightful ECharts configuration. You must respond with a single, valid JSON object only, containing no markdown, no comments, and no text outside the JSON structure.";

      const userMessage = `
User's Goal: 
  ${userGoal} // e.g., "Show the relationship between advertising spend and monthly revenue for each product category." 

Data Table (first row is header): 
  ${JSON.stringify(payload, null, 2)} 

Instructions: 
 1.  **Analyze and Infer**: Deeply analyze the "User's Goal" and the provided data. Infer the data types (e.g., temporal, categorical, numerical) and the relationships between columns. Determine the primary analytical objective (e.g., comparison, trend over time, correlation, distribution, composition, part-to-whole, geographical data, flow). 
 2.  **Select Optimal Chart Type**: Based on your analysis, choose the single most effective chart type. Do not limit yourself. Your choice should be the best fit for the user's stated goal. Consider all major ECharts series types (line, bar, pie, scatter, boxplot, heatmap, radar, sankey, graph, tree, map, etc.). 
 3.  **Structure with \`dataset\`**: You MUST use the ECharts \`dataset\` property to hold the raw data. Decouple the data from the series definition. This is a strict requirement. 
 4.  **Configure for Clarity**: The chart must be self-explanatory. 
     -   Provide a descriptive \`title\`. 
     -   Add clear \`name\` properties for both \`xAxis\` and \`yAxis\`. 
     -   Use a \`legend\` when multiple series are present. 
 5.  **Enhance Interactivity**: Add a rich \`tooltip\` that provides context-specific information. Include other interactive features like \`dataZoom\`, \`toolbox\`, or \`brush\` if they would meaningfully help the user explore the data. 
 6.  **Apply Professional Styling**: Use a clear and visually appealing color scheme. Ensure text is legible and the chart is not cluttered. Make deliberate choices about \`itemStyle\`, \`lineStyle\`, etc. 

Response format (JSON only, no backticks): 
{ 
  "option": { /* A complete, valid, and well-structured ECharts option object that follows all instructions above. */ }, 
  "interpretation": { 
    "chartType": "The specific name of the chart type chosen (e.g., 'Grouped Bar Chart', 'Scatter Plot with Third Dimension').", 
    "rationale": "A concise explanation of why this chart type is the optimal choice to achieve the user's goal.", 
    "insights": [ 
      "A key insight directly observable from the chart.", 
      "A second important insight or observation." 
    ] 
  } 
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

      const responseJson = await response.json();
      const rawContent = responseJson.choices?.[0]?.message?.content || '{}';
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

      let interpretationText = '';
      if (typeof parsed.interpretation === 'string') {
        interpretationText = parsed.interpretation;
      } else if (parsed.interpretation && typeof parsed.interpretation === 'object') {
        const interpretation = parsed.interpretation as any;
        const chartType = interpretation.chartType;
        const rationale = interpretation.rationale;
        const insights = interpretation.insights;
        const parts: string[] = [];

        if (chartType) {
          parts.push(`Chart type: ${chartType}`);
        }

        if (rationale) {
          parts.push(`Rationale: ${rationale}`);
        }

        if (Array.isArray(insights) && insights.length > 0) {
          parts.push(
            'Insights:',
            ...insights.map((item: string) => `- ${item}`),
          );
        }

        interpretationText = parts.join('\n\n');
      }

      setAiInterpretation(interpretationText);
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

  const handleGenerateChart = () => {
    runGenerateChart(tableData, chartPrompt);
  };

  const handleSampleDatasetClick = (type: SampleDatasetType) => {
    let data: string[][];
    let prompt: string;

    if (type === 'pareto') {
      data = [
        ['Category', 'Value'],
        ['Defect A', '80'],
        ['Defect B', '40'],
        ['Defect C', '25'],
        ['Defect D', '15'],
        ['Defect E', '10'],
      ];
      prompt =
        'Create a Pareto chart where Category is on the X axis, Value is the bar series, and the cumulative percentage line is overlaid on a second Y axis.';
    } else if (type === 'sankey') {
      data = [
        ['Source', 'Target', 'Value'],
        ['Email', 'Website', '120'],
        ['Email', 'Sales', '45'],
        ['Ads', 'Website', '180'],
        ['Ads', 'Sales', '60'],
        ['Social', 'Website', '90'],
        ['Social', 'Sales', '30'],
      ];
      prompt =
        'Create a Sankey diagram showing the flow from Source to Target using Value as the link weight.';
    } else if (type === 'boxplot') {
      data = [
        ['Region', 'Value'],
        ['North', '12'],
        ['North', '15'],
        ['North', '18'],
        ['North', '22'],
        ['North', '25'],
        ['South', '10'],
        ['South', '14'],
        ['South', '17'],
        ['South', '19'],
        ['South', '23'],
        ['East', '8'],
        ['East', '11'],
        ['East', '15'],
        ['East', '18'],
        ['East', '21'],
        ['West', '9'],
        ['West', '13'],
        ['West', '16'],
        ['West', '20'],
        ['West', '24'],
      ];
      prompt =
        'Create a boxplot chart grouping values by Region to compare distributions, with mean lines connected in red color between groups.';
    } else if (type === 'timeSeries') {
      data = [
        ['Month', 'Actual', 'Target'],
        ['Jan', '72', '80'],
        ['Feb', '75', '80'],
        ['Mar', '78', '82'],
        ['Apr', '81', '82'],
        ['May', '79', '83'],
        ['Jun', '83', '84'],
        ['Jul', '85', '85'],
        ['Aug', '88', '86'],
        ['Sep', '86', '86'],
        ['Oct', '89', '87'],
        ['Nov', '91', '88'],
        ['Dec', '93', '89'],
      ];
      prompt =
        "Create a dual-line time series chart where Month is on the X axis, Actual and Target are two smooth line series with markers, and the area under the Actual line is lightly filled to emphasize improvement over time. Add a tooltip with all series values and a legend at the top.";
    } else if (type === 'stackedBar') {
      data = [
        ['Region', 'On-time', 'Late', 'Very Late'],
        ['North', '160', '40', '10'],
        ['South', '140', '55', '20'],
        ['East', '120', '60', '25'],
        ['West', '150', '35', '15'],
      ];
      prompt =
        "Create a stacked bar chart where Region is on the X axis and On-time, Late, and Very Late are stacked bar series on the Y axis to show shipment reliability mix by region. Include percentage labels inside the bars and a legend at the bottom.";
    } else if (type === 'dualAxis') {
      data = [
        ['Month', 'Revenue', 'Margin %'],
        ['Q1-2024', '420000', '18.5'],
        ['Q2-2024', '460000', '19.2'],
        ['Q3-2024', '510000', '17.8'],
        ['Q4-2024', '580000', '20.4'],
      ];
      prompt =
        'Create a combo chart with Revenue as blue bars on the primary Y axis and Margin % as an orange line with circle markers on a secondary Y axis (0–25%). Use Month on the X axis and show both values in the tooltip when hovering.';
    } else if (type === 'funnel') {
      data = [
        ['Stage', 'Count'],
        ['Visited site', '12000'],
        ['Signed up', '5100'],
        ['Activated trial', '2300'],
        ['Requested quote', '900'],
        ['Closed deal', '320'],
      ];
      prompt =
        'Create a funnel chart with Stage on the Y axis and Count as the funnel value, sorted from largest to smallest. Show conversion percentages between stages in the labels so the user can see drop-off at each step.';
    } else {
      data = [
        ['Sample', 'Value'],
        ['1', '-0.8'],
        ['2', '-0.2'],
        ['3', '0.1'],
        ['4', '0.4'],
        ['5', '0.0'],
        ['6', '0.6'],
        ['7', '1.1'],
        ['8', '0.9'],
        ['9', '-0.4'],
        ['10', '0.3'],
        ['11', '0.7'],
        ['12', '1.3'],
        ['13', '-0.6'],
        ['14', '0.2'],
        ['15', '0.5'],
        ['16', '1.0'],
        ['17', '-0.3'],
        ['18', '0.8'],
        ['19', '1.2'],
        ['20', '0.4'],
      ];
      prompt =
        'Create a histogram or density-style chart to show the approximate normal distribution of the Value column.';
    }

    setTableData(data);

    const columnCount = data[0]?.length || 0;
    if (columnCount > 0) {
      const widths = Array.from({ length: columnCount }, () => 140);
      setColumnWidths(widths);
    } else {
      setColumnWidths([]);
    }

    setChartPrompt(prompt);
    setIsSampleMenuOpen(false);
    runGenerateChart(data, prompt);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden no-scrollbar">
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

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto lg:overflow-hidden pb-4 pt-3 sm:pb-6 sm:pt-4">
          <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
            <div
              className={
                isSidebarCollapsed
                  ? 'flex min-h-0 w-9 flex-none flex-col border-r border-gray-200 bg-gray-50 overflow-hidden'
                  : 'flex min-h-0 flex-1 w-full flex-col gap-3 border-r border-gray-200 bg-gray-50 p-3 lg:w-1/2 overflow-hidden'
              }
            >
              <div className="flex items-center justify-between mb-2">
                {!isSidebarCollapsed && (
                  <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5">
                    <Settings className="h-3 w-3 text-gray-500" />
                    Setup
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(prev => !prev)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-300 bg-white text-xs text-gray-600 hover:bg-gray-50"
                  title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isSidebarCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronLeft className="h-3 w-3" />
                  )}
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
                      <div className="relative flex-1">
                        <button
                          type="button"
                          onClick={() => setIsSampleMenuOpen(prev => !prev)}
                          className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Sample Data
                        </button>
                        {isSampleMenuOpen && (
                          <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white text-[11px] shadow-lg">
                            <button
                              type="button"
                              onClick={() => handleSampleDatasetClick('pareto')}
                              className="block w-full px-2 py-1 text-left hover:bg-gray-50"
                            >
                              Pareto chart
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSampleDatasetClick('sankey')}
                              className="block w-full px-2 py-1 text-left hover:bg-gray-50"
                            >
                              Sankey diagram
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSampleDatasetClick('boxplot')}
                              className="block w-full px-2 py-1 text-left hover:bg-gray-50"
                            >
                              Boxplot by category
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSampleDatasetClick('timeSeries')}
                              className="block w-full px-2 py-1 text-left hover:bg-gray-50"
                            >
                              Time-series target vs actual
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSampleDatasetClick('stackedBar')}
                              className="block w-full px-2 py-1 text-left hover:bg-gray-50"
                            >
                              Stacked bar by category
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSampleDatasetClick('dualAxis')}
                              className="block w-full px-2 py-1 text-left hover:bg-gray-50"
                            >
                              Dual-axis revenue and margin
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSampleDatasetClick('funnel')}
                              className="block w-full px-2 py-1 text-left hover:bg-gray-50"
                            >
                              Funnel conversion stages
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSampleDatasetClick('normal')}
                              className="block w-full px-2 py-1 text-left hover:bg-gray-50"
                            >
                              Normal distribution
                            </button>
                          </div>
                        )}
                      </div>
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
                        Auto Fit
                      </button>
                    </div>
                    <div className="max-h-48 overflow-auto rounded border border-gray-200">
                      {tableData.length === 0 ? (
                        <div className="flex items-center justify-center px-3 py-6 text-[11px] text-gray-400">
                          No data yet. Upload a file or add a row to start.
                        </div>
                      ) : (
                        <table className="min-w-max border-collapse text-[11px] table-fixed">
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
                                    style={{
                                      width: columnWidths[colIndex] || 120,
                                      minWidth: 60,
                                    }}
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
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <h3 className="flex items-center text-xs font-semibold text-gray-800">
                        <BarChart3 className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
                        <span>How should the data be charted?</span>
                      </h3>
                      <a
                        href="https://echarts.apache.org/examples/en/index.html"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        EChart Library
                      </a>
                    </div>
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
                      <h3 className="flex items-center text-xs font-semibold text-gray-800">
                        <Wand2 className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
                        <span>Generate with AI</span>
                      </h3>
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

              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
              <div className="flex-1 rounded-md border border-gray-200 bg-white p-3">
                <h3 className="mb-2 flex items-center text-xs font-semibold text-gray-800">
                  <Activity className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
                  <span>Chart</span>
                </h3>
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
                <h3 className="mb-1 flex items-center text-xs font-semibold text-gray-800">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
                  <span>AI Interpretation</span>
                </h3>
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
