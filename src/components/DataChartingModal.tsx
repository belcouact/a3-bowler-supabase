import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
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
    id: 'on-time-delivery',
    name: 'On-time delivery',
    description: 'Delivery performance by week with on-time rate.',
    data: [
      ['Week', 'Total deliveries', 'On-time deliveries', 'On-time %'],
      ['2024-W01', '120', '110', '91.7'],
      ['2024-W02', '135', '126', '93.3'],
      ['2024-W03', '128', '115', '89.8'],
      ['2024-W04', '142', '134', '94.4'],
    ],
    chartPrompt:
      'Create a line chart showing on-time delivery rate by week. Highlight any weeks below 92% and add data labels for the on-time %. Use a secondary bar or line to show total deliveries if it helps.',
  },
  {
    id: 'revenue-profit',
    name: 'Revenue & profit',
    description: 'Monthly revenue, cost, and profit.',
    data: [
      ['Month', 'Revenue', 'Cost', 'Profit'],
      ['Jan', '120000', '80000', '40000'],
      ['Feb', '135000', '86000', '49000'],
      ['Mar', '150000', '90000', '60000'],
      ['Apr', '160000', '95000', '65000'],
    ],
    chartPrompt:
      'Create a combined bar and line chart showing revenue and profit by month. Use bars for revenue and a line for profit. Emphasize the margin trend.',
  },
  {
    id: 'yield',
    name: 'Yield',
    description: 'Production yield by batch.',
    data: [
      ['Batch', 'Input units', 'Good units', 'Yield %'],
      ['B-101', '1000', '970', '97'],
      ['B-102', '1200', '1130', '94.2'],
      ['B-103', '900', '855', '95'],
      ['B-104', '1100', '1030', '93.6'],
    ],
    chartPrompt:
      'Create a bar chart of yield % by batch. Highlight any batch with yield below 95% in a different color and show the exact yield % on the bars.',
  },
  {
    id: 'defects',
    name: 'Defect rate',
    description: 'Weekly defect rates in a production line.',
    data: [
      ['Week', 'Total units', 'Defect units', 'Defect rate %'],
      ['2024-W01', '5000', '60', '1.2'],
      ['2024-W02', '5200', '55', '1.06'],
      ['2024-W03', '5100', '80', '1.57'],
      ['2024-W04', '5300', '50', '0.94'],
    ],
    chartPrompt:
      'Create a line or bar chart showing defect rate % by week. Clearly mark any week where the defect rate exceeds 1.3%.',
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
    const systemMessage = `你是一个专业的数据分析师，具有丰富的业务分析经验。请严格按照以下要求进行分析：

**重要提醒：必须严格基于提供的实际数据进行分析，禁止使用任何随机生成的数据、假设的数据或示例数据。所有分析结论必须完全基于提供的数据集。**

分析要求：
1. 数据概览 - 简要描述数据集的业务含义（仅基于实际数据）
2. 核心发现 - 指出数据中的主要模式、趋势、异常和业务洞察（仅基于实际数据）
3. 实用建议 - 基于分析结果提供2-3条具体可行的业务建议（仅基于实际数据）

输出格式要求：
- 使用Markdown格式，结构清晰
- 内容简明扼要，突出重点
- 避免冗长的技术细节
- 专注于有价值的业务洞察
- 不要生成任何图表代码或HTML代码
- 提供可直接用于决策的建议
- 如果数据不足或质量不佳，请如实说明，不要编造分析结果

请严格按照用户提供的分析任务要求执行，不要添加额外的内容或格式。`;

    const fullPrompt = `${systemMessage}\n\n分析任务：${analysisPrompt}`;

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

      const analysisPrompt = `你是一个专业的数据分析师，请对以下数据集进行深入分析，提供有价值的洞察。请严格按照以下格式输出，只输出分析内容：

**完整数据集：**
${headers ? `\n**表头信息**：${JSON.stringify(headers)}` : ''}
${JSON.stringify(dataRows, null, 2)}
${dataBackground ? `\n**数据背景说明**：${dataBackground}` : ''}

**完整数据集说明**：请基于完整数据集进行分析。

**重要提醒：必须严格基于上述实际数据进行分析，禁止使用任何随机生成的数据、假设的数据或示例数据。所有分析结论必须完全基于提供的数据集。**

请提供以下分析：

### 1. 数据概览
基于表头信息简要描述数据集的业务含义（仅基于实际数据）

### 2. 核心发现
指出数据中的主要模式、趋势、异常和业务洞察（仅基于实际数据）

### 3. 实用建议
基于分析结果提供2-3条具体可行的业务建议（仅基于实际数据）

严格要求：
- 使用Markdown格式，结构清晰
- 内容简明扼要，突出重点
- 避免冗长的技术细节
- 专注于有价值的业务洞察
- 不要生成任何图表代码或HTML代码
- 提供可直接用于决策的建议
- 绝对禁止使用任何随机数据、假设数据或示例数据
- 所有分析必须100%基于上述提供的实际数据
- 如果数据不足或质量不佳，请如实说明，不要编造分析结果`;

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
      iframe.style.height = '100%';
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

      setChartVisible(true);
      showStatus('Chart executed successfully.', 'success');
    } catch (error) {
      const err = error as Error;
      showStatus(`Chart execution failed: ${err.message}`, 'error');
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
    <div className="fixed inset-0 z-[90] flex items-stretch justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-gray-900/60"
        onClick={handleOverlayClick}
      />
      <div className="relative z-[95] flex h-full w-full flex-col bg-white shadow-2xl border-t border-gray-200 rounded-none overflow-hidden">
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
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6">
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

              {status && (
                <div
                  className={[
                    'mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-xs',
                    status.type === 'success' && 'bg-emerald-50 text-emerald-700 border border-emerald-100',
                    status.type === 'error' && 'bg-red-50 text-red-700 border border-red-100',
                    status.type === 'info' && 'bg-sky-50 text-sky-700 border border-sky-100',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span>{status.text}</span>
                </div>
              )}

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
                      Supports CSV, XLS, XLSX formats, up to 10MB.
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

              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                After uploading a file, please clean unnecessary rows and columns in the table,
                keep only the data needed for analysis, and ensure each column header is clear
                for more accurate results.
              </div>

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
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                  📈
                </span>
                Chart Generation
              </h3>

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

              <div className="flex flex-wrap items-center justify-between gap-2">
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
                <a
                  href="https://echarts.apache.org/examples/en/index.html"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-[11px] text-blue-600 hover:text-blue-700 hover:underline"
                >
                  ECharts examples
                </a>
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
                    className="relative flex-1 rounded-md border border-slate-200 bg-slate-50/60 overflow-hidden"
                  >
                    <div id="chartContent" className="h-full w-full" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
