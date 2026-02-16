import { useEffect, useMemo, useState, useRef } from 'react';
import { X, FileText, TrendingUp, Bot } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import type { AIModelKey } from '../types';

interface DataChartingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type StatusType = 'info' | 'success' | 'error';

interface StatusMessage {
  type: StatusType;
  text: string;
}

interface WorkbookSheet {
  name: string;
  data: (string | number)[][];
}

type DataSourceTab = 'upload' | 'sample';

interface SampleDataset {
  id: string;
  name: string;
  description: string;
  data: string[][];
  chartPrompt: string;
}

const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'pareto-defects',
    name: 'Pareto – defect causes',
    description: 'Defect counts by cause to build a Pareto chart.',
    data: [
      ['Defect cause', 'Defect count'],
      ['Scratch', '120'],
      ['Color mismatch', '80'],
      ['Dimension out of spec', '45'],
      ['Contamination', '30'],
      ['Packaging damage', '20'],
      ['Other', '15'],
    ],
    chartPrompt:
      'Create a Pareto chart of defect causes using ECharts. Sort causes by defect count in descending order, show bars for counts and a cumulative percentage line on a secondary axis. Clearly highlight the top contributors (e.g. the few causes that account for ~80% of defects).',
  },
  {
    id: 'histogram-leadtime',
    name: 'Histogram – lead time',
    description: 'Lead time distribution for orders (days).',
    data: [
      ['Order ID', 'Lead time (days)'],
      ['O-1001', '2'],
      ['O-1002', '3'],
      ['O-1003', '5'],
      ['O-1004', '1'],
      ['O-1005', '4'],
      ['O-1006', '3'],
      ['O-1007', '6'],
      ['O-1008', '2'],
      ['O-1009', '7'],
      ['O-1010', '5'],
      ['O-1011', '4'],
      ['O-1012', '3'],
      ['O-1013', '8'],
      ['O-1014', '6'],
      ['O-1015', '2'],
    ],
    chartPrompt:
      'Create a histogram chart in ECharts to show the distribution of order lead time (in days). Choose appropriate bins (e.g. 1-day width) and clearly show the frequency of orders in each bin.',
  },
  {
    id: 'boxplot-yield-by-line',
    name: 'Boxplot – yield by line',
    description: 'Yield % samples from three production lines.',
    data: [
      ['Sample ID', 'Line', 'Yield %'],
      ['S01', 'Line A', '97.2'],
      ['S02', 'Line A', '96.5'],
      ['S03', 'Line A', '98.1'],
      ['S04', 'Line A', '95.9'],
      ['S05', 'Line B', '93.4'],
      ['S06', 'Line B', '94.1'],
      ['S07', 'Line B', '92.8'],
      ['S08', 'Line B', '95.0'],
      ['S09', 'Line C', '90.2'],
      ['S10', 'Line C', '91.5'],
      ['S11', 'Line C', '89.7'],
      ['S12', 'Line C', '92.1'],
    ],
    chartPrompt:
      'Create a boxplot chart in ECharts comparing yield % distribution for Line A, Line B and Line C. Use one box for each line and highlight median and outliers clearly.',
  },
  {
    id: 'sankey-process-flow',
    name: 'Sankey – process flow',
    description: 'Flow of units through process steps for a Sankey diagram.',
    data: [
      ['Source', 'Target', 'Units'],
      ['Input', 'Step 1', '1000'],
      ['Step 1', 'Step 2', '900'],
      ['Step 1', 'Scrap', '100'],
      ['Step 2', 'Step 3', '820'],
      ['Step 2', 'Rework', '80'],
      ['Step 3', 'Output', '800'],
      ['Step 3', 'Scrap', '20'],
    ],
    chartPrompt:
      'Create a Sankey diagram in ECharts to show the flow of units between steps based on the Source, Target and Units columns. Make the flows directional and sized by Units, and use different colors for main path vs. scrap/rework.',
  },
  {
    id: 'funnel-sales',
    name: 'Funnel – sales pipeline',
    description: 'Typical sales pipeline stages with counts.',
    data: [
      ['Stage', 'Count'],
      ['Leads', '1200'],
      ['Qualified', '600'],
      ['Proposal', '300'],
      ['Negotiation', '150'],
      ['Closed won', '60'],
    ],
    chartPrompt:
      'Create a funnel chart in ECharts showing the sales pipeline stages from Leads down to Closed won. The funnel width should be proportional to Count and clearly show conversion at each step.',
  },
  {
    id: 'correlation-matrix',
    name: 'Correlation matrix – KPIs',
    description: 'Pairwise correlation between key performance indicators.',
    data: [
      ['Metric X', 'Metric Y', 'Correlation'],
      ['Revenue', 'Profit', '0.92'],
      ['Revenue', 'Customer satisfaction', '0.45'],
      ['Revenue', 'On-time delivery', '0.30'],
      ['Profit', 'Customer satisfaction', '0.55'],
      ['Profit', 'On-time delivery', '0.40'],
      ['Customer satisfaction', 'On-time delivery', '0.70'],
    ],
    chartPrompt:
      'Create a correlation matrix heatmap in ECharts using the correlation values between the KPI pairs. Place Metric X and Metric Y on the axes, and color the cells based on the Correlation value (from -1 to 1), with labels showing the numeric value.',
  },
];

function cleanData(data: string[][]): string[][] {
  if (!data || data.length === 0) return data;

  const nonEmptyRows = data.filter((row) =>
    row.some((cell) => cell !== null && cell !== undefined && cell !== '')
  );

  if (nonEmptyRows.length === 0) return nonEmptyRows;

  const cols = nonEmptyRows[0].length;
  const nonEmptyCols: number[] = [];

  for (let c = 0; c < cols; c += 1) {
    const hasValue = nonEmptyRows.some(
      (row) => row[c] !== null && row[c] !== undefined && row[c] !== ''
    );
    if (hasValue) {
      nonEmptyCols.push(c);
    }
  }

  const cleanedData = nonEmptyRows.map((row) =>
    nonEmptyCols.map((col) => row[col])
  );

  return cleanedData;
}

export const DataChartingModal = ({ isOpen, onClose }: DataChartingModalProps) => {
  const { selectedModel } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<WorkbookSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [dataSourceTab, setDataSourceTab] = useState<DataSourceTab>('upload');
  const [tableData, setTableData] = useState<string[][]>([]);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [analysisHtml, setAnalysisHtml] = useState('');
  const [dataBackground, setDataBackground] = useState('');
  const [chartRequirement, setChartRequirement] = useState('');
  const [codeOutput, setCodeOutput] = useState('');
  const [chartVisible, setChartVisible] = useState(false);
  // Resize logic removed
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setWorkbook([]);
      setSelectedSheet(0);
      setTableData([]);
      setStatus(null);
      setAnalyzing(false);
      setGenerating(false);
      setExecuting(false);
      setAnalysisHtml('');
      setDataBackground('');
      setChartRequirement('');
      setCodeOutput('');
      setChartVisible(false);
      setDataSourceTab('upload');
    }
  }, [isOpen]);

  const workbookSheetsAvailable = useMemo(
    () => workbook && workbook.length > 0,
    [workbook]
  );

  if (!isOpen) {
    return null;
  }

  function showStatus(message: string, type: StatusType = 'info') {
    setStatus({ text: message, type });
  }

  function handleFileSelect(selected: File) {
    const validExtensions = ['.csv', '.xls', '.xlsx'];
    const fileExtension = selected.name.toLowerCase().substring(selected.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      showStatus('Please select a valid CSV, XLS or XLSX file.', 'error');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      showStatus('File size exceeds 10MB limit.', 'error');
      return;
    }

    setFile(selected);
    setStatus(null);
    parseFile(selected);
  }

  function parseFile(selected: File) {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result) {
          throw new Error('File content is empty');
        }

        const data = new Uint8Array(result as ArrayBuffer);

        if (selected.name.toLowerCase().endsWith('.csv')) {
          parseCSV(data);
        } else {
          parseExcel(data);
        }
      } catch (error) {
        const err = error as Error;
        showStatus(`File parsing failed: ${err.message}`, 'error');
      }
    };

    reader.onerror = () => {
      showStatus('File reading failed.', 'error');
    };

    reader.readAsArrayBuffer(selected);
  }

  function parseCSV(data: Uint8Array) {
    try {
      const text = new TextDecoder('utf-8').decode(data);
      const lines = text.split('\n').filter((line) => line.trim());

      const result: (string | number)[][] = [];
      lines.forEach((line) => {
        const row = line
          .split(',')
          .map((cell) => cell.trim().replace(/^["']|["']$/g, ''));
        result.push(row);
      });

      const sheets: WorkbookSheet[] = [
        {
          name: 'Sheet1',
          data: result,
        },
      ];

      setWorkbook(sheets);
      setSelectedSheet(0);
      const normalized = result.map((row) => row.map((cell) => String(cell ?? '')));
      setTableData(normalized);
      showStatus('CSV file parsed successfully.', 'success');
    } catch (error) {
      const err = error as Error;
      showStatus(`CSV parsing failed: ${err.message}`, 'error');
    }
  }

  function parseExcel(data: Uint8Array) {
    try {
      const wb = XLSX.read(data, { type: 'array' });
      const sheets: WorkbookSheet[] = [];

      wb.SheetNames.forEach((sheetName) => {
        const worksheet = wb.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        }) as (string | number)[][];

        sheets.push({
          name: sheetName,
          data: jsonData,
        });
      });

      setWorkbook(sheets);
      setSelectedSheet(0);
      if (sheets[0]) {
        const normalized = sheets[0].data.map((row) =>
          row.map((cell) => String(cell ?? ''))
        );
        setTableData(normalized);
      } else {
        setTableData([]);
      }
      showStatus(`Excel file parsed successfully. ${sheets.length} sheet(s) found.`, 'success');
    } catch (error) {
      const err = error as Error;
      showStatus(`Excel parsing failed: ${err.message}`, 'error');
    }
  }

  function handleSheetSelect(index: number) {
    setSelectedSheet(index);

    const sheet = workbook[index];
    if (sheet && sheet.data && sheet.data.length > 0) {
      const normalized = sheet.data.map((row) =>
        row.map((cell) => String(cell ?? ''))
      );
      setTableData(normalized);
    } else {
      setTableData([]);
    }
  }

  function clearFile() {
    setFile(null);
    setWorkbook([]);
    setSelectedSheet(0);
    setTableData([]);
    setStatus(null);
  }

  function applySampleDataset(dataset: SampleDataset) {
    setFile(null);
    const sheet: WorkbookSheet = {
      name: dataset.name,
      data: dataset.data,
    };
    setWorkbook([sheet]);
    setSelectedSheet(0);
    setTableData(dataset.data);
    setStatus({
      type: 'success',
      text: `Loaded sample dataset: ${dataset.name}.`,
    });
    setChartRequirement(dataset.chartPrompt);
  }

  function getCurrentTableData(): string[][] | null {
    if (!workbookSheetsAvailable) return null;
    const sheet = workbook[selectedSheet];
    if (!sheet || !sheet.data || sheet.data.length === 0) return null;
    return sheet.data.map((row) => row.map((cell) => String(cell ?? '')));
  }

  async function callAPIForAnalysis(analysisPrompt: string): Promise<string> {
    const systemMessage = `You are a professional data analyst with rich business experience. Follow these rules strictly:

**Critical rule: You must base your analysis only on the actual data provided. Do not use any randomly generated data, assumed data, or sample data. Every conclusion must be grounded 100% in the provided dataset.**

Analysis requirements:
1. Data overview – briefly describe the business meaning of the dataset (based only on the real data)
2. Key findings – highlight the main patterns, trends, anomalies, and business insights (based only on the real data)
3. Practical recommendations – provide 2–3 concrete, actionable business recommendations (based only on the real data)

Output format requirements:
- Use Markdown with a clear structure
- Keep the content concise and focused on the key points
- Avoid lengthy technical details
- Focus on valuable business insights
- Do not generate any chart code or HTML code
- Provide suggestions that can be used directly for decision-making
- If the data is insufficient or low quality, state this honestly and do not invent analysis

Language requirements:
- Always respond in English, even if the background or column names are in another language

Follow the user’s analysis task exactly and do not add extra sections or formats.`;

    const fullPrompt = `${systemMessage}\n\nAnalysis task: ${analysisPrompt}`;

    const modelToUse: AIModelKey = selectedModel || 'deepseek';

    const requestBody = {
      model: modelToUse,
      messages: [
        {
          role: 'user' as const,
          content: fullPrompt,
        },
      ],
      stream: false,
    };

    const response = await fetch('https://multi-model-worker.study-llm.me/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    let content: string | undefined;
    if (result.choices && result.choices[0] && result.choices[0].message) {
      content = result.choices[0].message.content;
    } else if (result.output) {
      content = result.output;
    } else if (result.response) {
      content = result.response;
    } else {
      content = JSON.stringify(result, null, 2);
    }

    if (!content || content.length === 0) {
      throw new Error('API returned empty content');
    }

    return content;
  }

  async function handleDataAnalysis() {
    const rawData = getCurrentTableData();

    if (!rawData || rawData.length === 0) {
      showStatus('Please upload a data file first.', 'error');
      return;
    }

    setAnalyzing(true);

    try {
      const cleanedData = cleanData(rawData);

      if (cleanedData.length === 0) {
        throw new Error('Data is empty or all values are blank');
      }

      const headers = cleanedData[0];
      const dataRows = cleanedData.slice(1);

      const analysisPrompt = `You are a professional data analyst. Analyze the following dataset in depth and provide valuable insights. Output only the analysis content, following this structure:

**Complete dataset:**
${headers ? `\n**Header information**: ${JSON.stringify(headers)}` : ''}
${JSON.stringify(dataRows, null, 2)}
${dataBackground ? `\n**Data background**: ${dataBackground}` : ''}

**Dataset note**: Your analysis must be based on the full dataset above.

**Important reminder: You must strictly base your analysis only on the real data above. Do not use any randomly generated data, assumed data, or sample data. All conclusions must be fully grounded in the provided dataset.**

Please provide the following analysis:

### 1. Data overview
Briefly describe the business meaning of the dataset based on the headers and values (only using the real data)

### 2. Key findings
Identify the main patterns, trends, anomalies, and business insights in the data (only using the real data)

### 3. Practical recommendations
Provide 2–3 concrete, actionable business recommendations based on the analysis (only using the real data)

Strict requirements:
- Use Markdown with a clear structure
- Keep the content concise and focused on key points
- Avoid lengthy technical details
- Focus on valuable business insights
- Do not generate any chart code or HTML code
- Provide suggestions that can be used directly for decision-making
- Absolutely do not use any random, assumed, or sample data
- Base every part of the analysis 100% on the actual data above
- If the data is insufficient or low quality, state this honestly and do not invent analysis
- Write the entire analysis in English`;

      const apiAnalysis = await callAPIForAnalysis(analysisPrompt);

      const html = apiAnalysis
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-700">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="text-gray-700">$1</em>');

      setAnalysisHtml(html);
      showStatus('Data analysis completed.', 'success');
    } catch (error) {
      const err = error as Error;
      showStatus(`Data analysis failed: ${err.message}`, 'error');
    } finally {
      setAnalyzing(false);
    }
  }

  async function generateChartCodeInternal(): Promise<string> {
    const rawData = getCurrentTableData();

    if (!rawData || rawData.length === 0) {
      throw new Error('Please upload a data file first.');
    }

    const cleanedData = cleanData(rawData);
    if (cleanedData.length === 0) {
      throw new Error('Data is empty or all values are blank, unable to generate chart');
    }

    const headers = cleanedData[0];
    const dataRows = cleanedData.slice(1);

    const structuredData = dataRows.map((row) => {
      const rowObj: Record<string, string> = {};
      headers.forEach((header, index) => {
        const value = row[index];
        rowObj[header] =
          value === null || value === undefined || value === '' ? 'EMPTY' : String(value);
      });
      return rowObj;
    });

    const systemMessage = `你是一个HTML图表生成专家。请根据用户的需求和提供的数据结构生成完整的HTML图表代码，包含HTML文档结构、ECharts库引用、图表容器和初始化代码。重要要求：
1. 图表容器必须使用合适的尺寸，设置width: 100%, height: 500px, minHeight: 400px, maxHeight: 600px
2. 图表容器样式应包含position: relative, margin: 1rem 0, padding: 10px, boxSizing: border-box, clear: both, display: block, flexDirection: column
3. 确保图表能够正常显示，不要被任何容器限制，保持正常的长宽比
4. 图表初始化代码中设置responsive: true以支持响应式布局
5. 如果用户需要生成多个图表，请确保每个图表独立成行显示，一行只显示一个图表
6. 多个图表时，请为每个图表创建独立的容器，确保每个图表都有足够的显示空间，避免彼此覆盖或显示不全
7. 添加响应式设计，适配不同设备：移动端(300-500px)、平板端(350-550px)、桌面端(400-600px)
8. 为图表容器添加圆角边框和阴影效果：borderRadius: 8px, boxShadow: 0 2px 8px rgba(0,0,0,0.1)
9. 只返回完整的HTML代码，不包含任何解释文字或注释。请根据用户需求自动选择合适的图表类型。`;

    const userPrompt = `用户需求：${
      chartRequirement || '根据数据自动选择合适的图表类型'
    }

完整数据集信息：
- 列名：${JSON.stringify(headers)}
- 数据行数：${dataRows.length}

**完整数据集：**
${JSON.stringify(structuredData, null, 2)}

请基于以上完整数据集生成合适的图表代码，根据用户需求自动选择最适合的图表类型。确保使用所有提供的数据进行分析。`;

    const fullPrompt = `${systemMessage}\n\n${userPrompt}`;

    const modelToUse: AIModelKey = selectedModel || 'deepseek';

    const requestBody = {
      model: modelToUse,
      messages: [
        {
          role: 'user' as const,
          content: fullPrompt,
        },
      ],
      stream: false,
    };

    const response = await fetch('https://multi-model-worker.study-llm.me/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    let content: string | undefined;
    if (result.choices && result.choices[0] && result.choices[0].message) {
      content = result.choices[0].message.content;
    } else if (result.output) {
      content = result.output;
    } else if (result.response) {
      content = result.response;
    } else {
      content = JSON.stringify(result, null, 2);
    }

    if (!content || content.length === 0) {
      throw new Error('API returned empty content');
    }

    return content;
  }

  async function handleGenerateChartCode() {
    setGenerating(true);

    try {
      const code = await generateChartCodeInternal();

      const cleanCode = code
        .replace(/^```html\n/, '')
        .replace(/^```HTML\n/, '')
        .replace(/\n```$/, '');

      setCodeOutput(cleanCode);
      setChartVisible(true);
      showStatus('Chart code generated. Executing automatically...', 'success');

      setTimeout(() => {
        executeChartScript(cleanCode);
      }, 500);
    } catch (error) {
      const err = error as Error;
      showStatus(`Chart code generation failed: ${err.message}`, 'error');
    } finally {
      setGenerating(false);
    }
  }

  function executeChartScript(code?: string) {
    const htmlCode = (code ?? codeOutput).trim();

    if (!htmlCode) {
      showStatus('Please generate chart code first.', 'error');
      return;
    }

    setExecuting(true);

    try {
      const container = document.getElementById('chartContent');
      if (!container) {
        throw new Error('Chart container not found');
      }

      container.innerHTML = '';

      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '0.5rem';

      container.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Unable to access chart window');
      }

      iframeDoc.open();
      iframeDoc.write(htmlCode);
      iframeDoc.close();

      const adjustHeight = () => {
        try {
          const docElement = iframeDoc.documentElement;
          const body = iframeDoc.body;

          if (!docElement && !body) {
            return;
          }

          const scrollHeight = Math.max(
            docElement?.scrollHeight ?? 0,
            body?.scrollHeight ?? 0,
            docElement?.offsetHeight ?? 0,
            body?.offsetHeight ?? 0
          );

          const minHeight = 420;
          const maxHeight = 2400;
          const finalHeight = Math.max(scrollHeight, minHeight);

          iframe.style.height = `${Math.min(finalHeight, maxHeight)}px`;
        } catch {
          iframe.style.height = '420px';
        }
      };

      adjustHeight();
      setTimeout(adjustHeight, 300);
      setTimeout(adjustHeight, 1000);

      setChartVisible(true);
      showStatus('Chart executed successfully.', 'success');
    } catch (error) {
      const err = error as Error;
      showStatus(
        `Chart execution failed. ECharts might not have loaded correctly or the generated code is invalid. Details: ${err.message}`,
        'error'
      );
    } finally {
      setExecuting(false);
    }
  }

  function handleViewChartInNewWindow() {
    const htmlCode = codeOutput.trim();

    if (!htmlCode) {
      showStatus('Please generate chart code first.', 'error');
      return;
    }

    try {
      const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      if (!newWindow) {
        showStatus('Popup was blocked by the browser, please allow popups and try again.', 'error');
        return;
      }

      newWindow.document.write(htmlCode);
      newWindow.document.close();

      showStatus('Chart opened in a new window.', 'success');
    } catch (error) {
      const err = error as Error;
      showStatus(`Unable to open new window: ${err.message}`, 'error');
    }
  }

  function handleOverlayClick() {
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gray-900/60 transition-opacity"
          onClick={handleOverlayClick}
        />
        
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center p-4">
          <div 
            ref={modalRef}
            className="pointer-events-auto relative w-full h-full bg-white shadow-2xl flex flex-col rounded-2xl overflow-hidden"
          >
            {/* Resize Handle removed */}

            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <span className="text-base">📊</span>
                    <span>Data Analysis</span>
                  </h2>
                  <p className="text-xs text-gray-500">
                    Integrated workspace for file upload, data preview, AI analysis and chart generation.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/60">
              {/* Introduction Section - Show only when no data is loaded */}
              {!workbookSheetsAvailable && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center mb-6 ring-1 ring-slate-100">
                      <Bot className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-6">AI Data Analyst</h3>
                    
                    {/* Intro removed */}

                    <div className="w-full max-w-xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-semibold text-slate-700 mb-4 text-sm text-center">Get Started</h4>
                      
                      <div className="flex flex-col gap-4">
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                          <input
                            type="file"
                            accept=".csv, .xls, .xlsx"
                            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="flex flex-col items-center gap-2">
                             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                               <FileText className="w-6 h-6" />
                             </div>
                             <span className="text-sm font-medium text-slate-600">Upload Data File</span>
                             <span className="text-xs text-slate-400">CSV, Excel (max 10MB)</span>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-400">Or try sample data</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {SAMPLE_DATASETS.slice(0, 4).map((dataset) => (
                            <button
                              key={dataset.id}
                              onClick={() => applySampleDataset(dataset)}
                              className="text-xs text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg border border-slate-200 hover:border-blue-200 transition-all flex items-center gap-2 group"
                            >
                              <TrendingUp className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                              <span className="truncate">{dataset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                </div>
              )}

              {/* Main Content Area - Show only when data is loaded */}
              {workbookSheetsAvailable && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                  {status && (
                    <div
                      className={[
                        'flex items-center gap-2 rounded-md px-3 py-2 text-xs mb-4',
                        status.type === 'success' && 'bg-emerald-50 text-emerald-700 border border-emerald-100',
                        status.type === 'error' && 'bg-red-50 text-red-700 border border-red-100',
                        status.type === 'info' && 'bg-sky-50 text-sky-700 border border-sky-100',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {status.type === 'success' && <span>✅</span>}
                      {status.type === 'error' && <span>❌</span>}
                      {status.type === 'info' && <span>ℹ️</span>}
                      {status.text}
                    </div>
                  )}
            <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                  📁
                </span>
                File Upload
              </h3>

              <div className="flex items-center justify-between mt-1">
                <div className="inline-flex rounded-full bg-slate-100 p-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDataSourceTab('upload')}
                    className={[
                      'rounded-full px-3 py-1 transition-colors',
                      dataSourceTab === 'upload'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    Upload file
                  </button>
                  <button
                    type="button"
                    onClick={() => setDataSourceTab('sample')}
                    className={[
                      'rounded-full px-3 py-1 transition-colors',
                      dataSourceTab === 'sample'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    Sample data
                  </button>
                </div>
              </div>

              {dataSourceTab === 'upload' && (
                <>
                  <div
                    className="mt-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-xs text-gray-500 hover:border-blue-300 hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileSelect(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => {
                      const input = document.getElementById('chart-file-input') as HTMLInputElement | null;
                      input?.click();
                    }}
                  >
                    <div className="text-3xl mb-2">📊</div>
                    <div className="font-medium text-gray-800">Drag file here or click to upload</div>
                    <div className="mt-1 text-[11px] text-gray-500">
                      Supports CSV, XLS, XLSX formats.
                    </div>
                    <input
                      id="chart-file-input"
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      className="hidden"
                      onChange={(e) => {
                        const selected = e.target.files?.[0];
                        if (selected) {
                          handleFileSelect(selected);
                        }
                      }}
                    />
                  </div>

                  {file && (
                    <div className="mt-3 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-900 break-all">{file.name}</span>
                        <span className="text-[11px] text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </>
              )}

              {dataSourceTab === 'sample' && (
                <div className="mt-3 space-y-2">
                  <div className="text-[11px] text-gray-600">
                    Choose a sample dataset to quickly try analysis and chart generation.
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SAMPLE_DATASETS.map((dataset) => (
                      <button
                        key={dataset.id}
                        type="button"
                        onClick={() => applySampleDataset(dataset)}
                        className="flex flex-col items-start rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <span className="text-xs font-semibold text-gray-900">{dataset.name}</span>
                        <span className="mt-1 text-[11px] text-gray-600">{dataset.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {workbookSheetsAvailable && (
                <div className="mt-3">
                  <div className="text-[11px] font-medium text-gray-700 mb-1">Select worksheet:</div>
                  <div className="flex flex-wrap gap-1">
                    {workbook.map((sheet, index) => (
                      <button
                        key={sheet.name + index}
                        type="button"
                        onClick={() => handleSheetSelect(index)}
                        className={[
                          'flex items-center rounded-full border px-2 py-1 text-[11px]',
                          index === selectedSheet
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {sheet.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                  🔍
                </span>
                Data Preview
              </h3>
              <div className="mt-2 rounded-md border border-slate-200 bg-white max-h-72 overflow-auto">
                {tableData && tableData.length > 0 ? (
                  <table className="min-w-full border-collapse text-[11px] text-gray-800">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        {tableData[0].map((cell, index) => (
                          <th
                            key={index}
                            className="border-b border-slate-200 px-2 py-1 text-left font-semibold"
                          >
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.slice(1).map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                        >
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="border-b border-slate-100 px-2 py-1 whitespace-nowrap"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex items-center justify-center py-6 text-xs text-gray-500">
                    No data yet. Please upload and parse a file first.
                  </div>
                )}
              </div>
            </section>

            <section
              id="analysisSection"
              className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4"
            >
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                  🧠
                </span>
                Data Analysis
              </h3>
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-gray-700">
                  Data background (optional)
                </label>
                <textarea
                  value={dataBackground}
                  onChange={(e) => setDataBackground(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  placeholder={
                    'Provide data background to help AI understand your dataset:\n• Business meaning of each column (e.g. revenue, customer count, time)\n• Business scenario of the data (e.g. e-commerce sales, user behavior)\n• What you want to focus on (e.g. trends, anomalies)\n• Any special data processing requirements'
                  }
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDataAnalysis}
                  disabled={analyzing}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze Data'}
                </button>
              </div>

              {analysisHtml && (
                <div className="mt-3 space-y-3">
                  <div className="text-xs font-semibold text-slate-800">AI Deep Analysis</div>
                  <div className="rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 px-3 py-2 text-xs text-slate-800 leading-relaxed">
                    <div
                      className="prose prose-xs max-w-none"
                      dangerouslySetInnerHTML={{ __html: analysisHtml }}
                    />
                  </div>
                  <div className="rounded-md bg-slate-50 px-3 py-2 text-[11px] text-slate-600 border border-emerald-200">
                    Data has been automatically cleaned: empty rows and columns were removed to ensure accuracy.
                  </div>
                </div>
              )}
            </section>

            <section
              id="chartGenerationSection"
              className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                    📈
                  </span>
                  Chart Generation
                </h3>
                <a
                  href="https://echarts.apache.org/examples/en/index.html"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline"
                >
                  ECharts examples
                </a>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-medium text-gray-700">
                  Chart requirements
                </label>
                <textarea
                  value={chartRequirement}
                  onChange={(e) => setChartRequirement(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  placeholder={
                    'Describe the chart you want in detail, for example:\n• Show monthly sales trend using a line chart\n• Compare department sales with a bar chart\n• Show market share distribution with a pie chart\n• Display relationship between temperature and sales using a scatter plot\n\nThe system will automatically choose the most suitable chart type and generate the code.'
                  }
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateChartCode}
                    disabled={generating}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {generating ? 'Generating...' : 'Generate chart code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => executeChartScript()}
                    disabled={executing || !codeOutput}
                    className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-gray-400"
                  >
                    {executing ? 'Executing...' : 'Run script'}
                  </button>
                </div>
              </div>

              <div
                id="chartResult"
                className={[
                  'mt-3 flex flex-col gap-3',
                  chartVisible ? '' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                      <span>🧾</span>
                      <span>Chart code</span>
                    </span>
                  </div>
                  <textarea
                    value={codeOutput}
                    onChange={(e) => setCodeOutput(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-mono text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 min-h-[160px]"
                    placeholder="Generated chart code will appear here; you can edit it before running."
                  />
                </div>

                <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-3 min-h-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                      <span>📊</span>
                      <span>Chart result</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleViewChartInNewWindow}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-gray-700 hover:bg-slate-100"
                    >
                      View in new window
                    </button>
                  </div>
                  <div
                    id="chartContainer"
                    className="relative rounded-md border border-slate-200 bg-slate-50/60 min-h-[420px] max-h-[900px] overflow-auto"
                  >
                    <div id="chartContent" className="w-full" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
</div>
  );
};
