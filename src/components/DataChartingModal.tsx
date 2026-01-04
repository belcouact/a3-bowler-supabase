import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import * as XLSX from 'xlsx';

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

interface LuckysheetData {
  headers: string[];
  data: string[][];
}

type ModelType = 'deepseek' | 'kimi' | 'glm';

async function loadScriptOnce(src: string, id: string): Promise<void> {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function loadStylesheetOnce(href: string, id: string): Promise<void> {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

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
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<WorkbookSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [analysisHtml, setAnalysisHtml] = useState('');
  const [dataBackground, setDataBackground] = useState('');
  const [chartRequirement, setChartRequirement] = useState('');
  const [codeOutput, setCodeOutput] = useState('');
  const [codeExpanded, setCodeExpanded] = useState(false);
  const [chartVisible, setChartVisible] = useState(false);
  const [modelSelection, setModelSelection] = useState<ModelType>('deepseek');
  const [luckysheetReady, setLuckysheetReady] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function ensureLuckysheet() {
      try {
        await Promise.all([
          loadStylesheetOnce(
            'https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/plugins/css/pluginsCss.css',
            'luckysheet-pluginsCss'
          ),
          loadStylesheetOnce(
            'https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/plugins/plugins.css',
            'luckysheet-plugins'
          ),
          loadStylesheetOnce(
            'https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/css/luckysheet.css',
            'luckysheet-css'
          ),
          loadStylesheetOnce(
            'https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/assets/iconfont/iconfont.css',
            'luckysheet-icons'
          ),
        ]);

        await loadScriptOnce(
          'https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/plugins/js/plugin.js',
          'luckysheet-plugin-js'
        );
        await loadScriptOnce(
          'https://cdn.jsdelivr.net/npm/luckysheet@latest/dist/luckysheet.umd.js',
          'luckysheet-umd-js'
        );

        if (cancelled) return;

        const w = window as unknown as { luckysheet?: any; _cleanupLuckysheetScrollBase?: () => void };

        if (!w.luckysheet || !w.luckysheet.create) {
          setStatus({
            type: 'error',
            text: 'Luckysheet初始化失败，请刷新后重试。',
          });
          return;
        }

        const emptyData: any[][] = [];
        for (let r = 0; r < 100; r += 1) {
          emptyData[r] = [];
          for (let c = 0; c < 26; c += 1) {
            emptyData[r][c] = null;
          }
        }

        const options = {
          container: 'luckysheet',
          title: '数据表格',
          lang: 'zh',
          showinfobar: false,
          showsheetbar: true,
          showstatisticBar: false,
          showtoolbar: true,
          allowEdit: true,
          enableAddRow: false,
          enableAddCol: false,
          rowHeaderWidth: 46,
          columnHeaderHeight: 20,
          defaultRowHeight: 25,
          defaultColWidth: 73,
          cellRightClickConfig: {
            copy: true,
          },
          data: [
            {
              name: 'Sheet1',
              data: emptyData,
            },
          ],
        };

        w.luckysheet.create(options);

        const container = document.getElementById('luckysheetContainer');
        const luckysheetEl = document.getElementById('luckysheet');
        const loadingEl = document.getElementById('luckysheet-loading');

        if (container) {
          container.classList.add('show');
          container.style.overflow = 'hidden';
        }
        if (luckysheetEl) {
          luckysheetEl.style.maxWidth = '100%';
          luckysheetEl.style.display = 'block';
        }
        if (loadingEl) {
          loadingEl.style.display = 'none';
        }

        if (w.luckysheet && w.luckysheet.resize) {
          setTimeout(() => {
            if (w.luckysheet && w.luckysheet.resize) {
              w.luckysheet.resize();
            }
          }, 100);
        }

        setLuckysheetReady(true);
      } catch {
        if (!cancelled) {
          setStatus({
            type: 'error',
            text: 'Luckysheet资源加载失败，请检查网络后重试。',
          });
        }
      }
    }

    ensureLuckysheet();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setWorkbook([]);
      setSelectedSheet(0);
      setStatus(null);
      setLoading(false);
      setAnalyzing(false);
      setGenerating(false);
      setExecuting(false);
      setAnalysisHtml('');
      setDataBackground('');
      setChartRequirement('');
      setCodeOutput('');
      setCodeExpanded(false);
      setChartVisible(false);
      setLuckysheetReady(false);
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
      showStatus('请选择有效的CSV、XLS或XLSX文件！', 'error');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      showStatus('文件大小超过10MB限制！', 'error');
      return;
    }

    setFile(selected);
    setStatus(null);
    parseFile(selected);
  }

  function parseFile(selected: File) {
    setLoading(true);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result) {
          throw new Error('文件内容为空');
        }

        const data = new Uint8Array(result as ArrayBuffer);

        if (selected.name.toLowerCase().endsWith('.csv')) {
          parseCSV(data);
        } else {
          parseExcel(data);
        }
      } catch (error) {
        const err = error as Error;
        showStatus(`文件解析失败：${err.message}`, 'error');
        setLoading(false);
      }
    };

    reader.onerror = () => {
      showStatus('文件读取失败！', 'error');
      setLoading(false);
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
      showStatus('CSV文件解析成功！', 'success');
      setLoading(false);
    } catch (error) {
      const err = error as Error;
      showStatus(`CSV解析失败：${err.message}`, 'error');
      setLoading(false);
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
      showStatus(`Excel文件解析成功！共${sheets.length}个工作表`, 'success');
      setLoading(false);
    } catch (error) {
      const err = error as Error;
      showStatus(`Excel解析失败：${err.message}`, 'error');
      setLoading(false);
    }
  }

  function handleSheetSelect(index: number) {
    setSelectedSheet(index);
  }

  function loadToLuckysheet() {
    if (!workbookSheetsAvailable) {
      showStatus('请先上传文件！', 'error');
      return;
    }

    if (!luckysheetReady) {
      showStatus('Luckysheet尚未准备好，请稍候重试。', 'error');
      return;
    }

    setLoading(true);

    try {
      const selectedData = workbook[selectedSheet].data;

      if (!selectedData || selectedData.length === 0) {
        throw new Error('数据为空或格式不正确');
      }

      const sheetData: any[][] = [];

      for (let r = 0; r < selectedData.length; r += 1) {
        sheetData[r] = [];
        for (let c = 0; c < selectedData[r].length; c += 1) {
          const value = selectedData[r][c];
          if (value !== null && value !== undefined && value !== '') {
            sheetData[r][c] = {
              v: value,
              ct: {
                fa: 'General',
                t: typeof value === 'number' ? 'n' : 'g',
              },
            };
          } else {
            sheetData[r][c] = null;
          }
        }
      }

      const w = window as unknown as { luckysheet?: any };

      if (!w.luckysheet || !w.luckysheet.create) {
        throw new Error('Luckysheet未加载或不可用');
      }

      const options = {
        container: 'luckysheet',
        title: '数据表格',
        lang: 'zh',
        showinfobar: false,
        showsheetbar: true,
        showstatisticBar: false,
        showtoolbar: true,
        allowEdit: true,
        enableAddRow: false,
        enableAddCol: false,
        rowHeaderWidth: 46,
        columnHeaderHeight: 20,
        defaultRowHeight: 25,
        defaultColWidth: 73,
        cellRightClickConfig: {
          copy: true,
        },
        data: [
          {
            name: workbook[selectedSheet].name || 'Sheet1',
            data: sheetData,
          },
        ],
      };

      w.luckysheet.create(options);

      const container = document.getElementById('luckysheetContainer');
      const luckysheetEl = document.getElementById('luckysheet');

      if (container) {
        container.classList.add('show');
        container.style.overflow = 'hidden';
      }
      if (luckysheetEl) {
        luckysheetEl.style.maxWidth = '100%';
      }

      if (w.luckysheet && w.luckysheet.resize) {
        setTimeout(() => {
          if (w.luckysheet && w.luckysheet.resize) {
            w.luckysheet.resize();
          }
        }, 100);
      }

      showStatus('数据已成功加载到Luckysheet！', 'success');
      setLoading(false);
    } catch (error) {
      const err = error as Error;
      showStatus(`加载到Luckysheet失败：${err.message}`, 'error');
      setLoading(false);
    }
  }

  function clearFile() {
    setFile(null);
    setWorkbook([]);
    setSelectedSheet(0);
    setStatus(null);
  }

  function getLuckysheetData(): LuckysheetData | null {
    const w = window as unknown as { luckysheet?: any };
    const ls = w.luckysheet;

    if (!ls || !ls.getSheetData) {
      return null;
    }

    try {
      const raw = ls.getSheetData();
      let actualData: any[] = [];
      let headers: string[] = [];

      if (raw && raw.data && Array.isArray(raw.data) && raw.data.length > 0) {
        actualData = raw.data;
        if (actualData.length > 0) {
          headers = actualData[0].map((cell: any, index: number) => {
            if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
              return String(cell.v);
            }
            if (cell && cell.m !== undefined && cell.m !== null && cell.m !== '') {
              return String(cell.m);
            }
            return `列${index + 1}`;
          });
        }
      } else if (Array.isArray(raw) && raw.length > 0) {
        actualData = raw;
        if (actualData.length > 0) {
          headers = actualData[0].map((cell: any, index: number) => {
            if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
              return String(cell.v);
            }
            if (cell && cell.m !== undefined && cell.m !== null && cell.m !== '') {
              return String(cell.m);
            }
            return `列${index + 1}`;
          });
        }
      } else {
        return null;
      }

      const converted: string[][] = actualData.map((row: any[]) =>
        row.map((cell: any) => {
          if (!cell) return '';

          if (cell.v !== undefined && cell.v !== null) {
            return String(cell.v);
          }
          if (cell.m !== undefined && cell.m !== null) {
            return String(cell.m);
          }
          if (typeof cell === 'object') {
            return JSON.stringify(cell);
          }
          return String(cell);
        })
      );

      const cleaned = cleanData(converted);

      return {
        headers: cleaned.length > 0 ? cleaned[0] : headers,
        data: cleaned,
      };
    } catch {
      return null;
    }
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

    const requestBody = {
      model: modelSelection,
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
      throw new Error(`API调用失败: ${response.status} - ${errorText}`);
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
      throw new Error('API返回了空内容');
    }

    return content;
  }

  async function handleDataAnalysis() {
    const luckysheetData = getLuckysheetData();

    if (!luckysheetData || !luckysheetData.data || luckysheetData.data.length === 0) {
      showStatus('请先上传数据文件或在Luckysheet中输入数据！', 'error');
      return;
    }

    setAnalyzing(true);

    try {
      const cleanedData = luckysheetData.data;

      if (cleanedData.length === 0) {
        throw new Error('数据为空或所有数据都是空值');
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
      showStatus('数据分析完成！', 'success');
    } catch (error) {
      const err = error as Error;
      showStatus(`数据分析失败：${err.message}`, 'error');
    } finally {
      setAnalyzing(false);
    }
  }

  async function generateChartCodeInternal(): Promise<string> {
    const luckysheetData = getLuckysheetData();

    if (!luckysheetData || !luckysheetData.data || luckysheetData.data.length === 0) {
      throw new Error('请先上传数据文件或在Luckysheet中输入数据！');
    }

    const cleanedData = cleanData(luckysheetData.data);
    if (cleanedData.length === 0) {
      throw new Error('数据为空或所有数据都是空值，无法生成图表');
    }

    const headers = cleanedData[0];
    const dataRows = cleanedData.slice(1);

    const structuredData = dataRows.map((row) => {
      const rowObj: Record<string, string> = {};
      headers.forEach((header, index) => {
        const value = row[index];
        rowObj[header] =
          value === null || value === undefined || value === '' ? '空值' : String(value);
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

    const requestBody = {
      model: modelSelection,
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
      throw new Error(`API调用失败: ${response.status} - ${errorText}`);
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
      throw new Error('API返回了空内容');
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
      showStatus('图表代码生成完成！正在自动执行...', 'success');

      setTimeout(() => {
        executeChartScript(cleanCode);
      }, 500);
    } catch (error) {
      const err = error as Error;
      showStatus(`图表代码生成失败：${err.message}`, 'error');
    } finally {
      setGenerating(false);
    }
  }

  function executeChartScript(code?: string) {
    const htmlCode = (code ?? codeOutput).trim();

    if (!htmlCode) {
      showStatus('请先生成图表代码！', 'error');
      return;
    }

    setExecuting(true);

    try {
      const container = document.getElementById('chartContent');
      if (!container) {
        throw new Error('图表容器未找到');
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
        throw new Error('无法访问图表窗口');
      }

      iframeDoc.open();
      iframeDoc.write(htmlCode);
      iframeDoc.close();

      setChartVisible(true);
      showStatus('图表执行成功！', 'success');
    } catch (error) {
      const err = error as Error;
      showStatus(`图表执行失败：${err.message}`, 'error');
    } finally {
      setExecuting(false);
    }
  }

  function handleViewChartInNewWindow() {
    const htmlCode = codeOutput.trim();

    if (!htmlCode) {
      showStatus('请先生成图表代码！', 'error');
      return;
    }

    try {
      const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      if (!newWindow) {
        showStatus('弹窗被浏览器阻止，请允许弹窗后重试', 'error');
        return;
      }

      newWindow.document.write(htmlCode);
      newWindow.document.close();

      showStatus('图表已在新窗口中打开', 'success');
    } catch (error) {
      const err = error as Error;
      showStatus(`无法打开新窗口：${err.message}`, 'error');
    }
  }

  function handleOverlayClick() {
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-gray-900/60"
        onClick={handleOverlayClick}
      />
      <div className="relative z-[95] flex h-full w-full max-w-6xl flex-col bg-white shadow-2xl border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold text-gray-900">数据分析</h2>
              <p className="text-xs text-gray-500">
                文件上传、数据预览、AI 分析与图表生成的一体化工作区。
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
                  1
                </span>
                文件上传
              </h3>

              {status && (
                <div
                  className={[
                    'flex items-center gap-2 rounded-md px-3 py-2 text-xs',
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
                <div className="font-medium text-gray-800">拖拽文件到此处或点击上传</div>
                <div className="mt-1 text-[11px] text-gray-500">支持 CSV, XLS, XLSX 格式，最大 10MB</div>
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
                    清除
                  </button>
                </div>
              )}

              {workbookSheetsAvailable && (
                <div className="mt-3">
                  <div className="text-[11px] font-medium text-gray-700 mb-1">选择工作表：</div>
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

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={loadToLuckysheet}
                  disabled={loading || !workbookSheetsAvailable}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {loading ? '处理中...' : '加载到表格'}
                </button>
                <button
                  type="button"
                  onClick={clearFile}
                  className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-slate-200"
                >
                  清空文件
                </button>
              </div>
            </section>

            <section
              id="luckysheetContainer"
              className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3"
            >
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                  2
                </span>
                数据预览&编辑
              </h3>
              <div
                id="luckysheet-loading"
                className="flex flex-col items-center justify-center py-6 text-xs text-gray-500"
              >
                <div className="mb-2 text-2xl">⏳</div>
                <div>正在加载数据表格...</div>
              </div>
              <div
                id="luckysheet"
                className="min-h-[260px] max-h-[420px] w-full overflow-hidden rounded-md border border-slate-200 bg-white"
              />
            </section>

            <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                    3
                  </span>
                  模型选择
                </h3>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-gray-800 cursor-pointer hover:border-blue-400">
                    <input
                      type="radio"
                      className="h-3 w-3"
                      checked={modelSelection === 'deepseek'}
                      onChange={() => setModelSelection('deepseek')}
                    />
                    <span>DeepSeek</span>
                  </label>
                  <label className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-gray-800 cursor-pointer hover:border-blue-400">
                    <input
                      type="radio"
                      className="h-3 w-3"
                      checked={modelSelection === 'kimi'}
                      onChange={() => setModelSelection('kimi')}
                    />
                    <span>Kimi</span>
                  </label>
                  <label className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-gray-800 cursor-pointer hover:border-blue-400">
                    <input
                      type="radio"
                      className="h-3 w-3"
                      checked={modelSelection === 'glm'}
                      onChange={() => setModelSelection('glm')}
                    />
                    <span>GLM</span>
                  </label>
                </div>
              </div>
            </section>

            <section
              id="analysisSection"
              className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4"
            >
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                  4
                </span>
                数据分析
              </h3>

              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                在文件上传后，请先在数据表格中清理不必要的数据，仅保留分析所需的数据行和列，并确保每列抬头名称清晰易懂，以获得更快且准确的结果。
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-medium text-gray-700">
                  数据背景说明（可选）
                </label>
                <textarea
                  value={dataBackground}
                  onChange={(e) => setDataBackground(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  placeholder={
                    '请提供数据背景信息，帮助AI更好地理解您的数据：\n• 表头字段的业务含义（如：销售额、客户数量、时间等）\n• 数据的业务场景（如：电商销售数据、用户行为数据等）\n• 希望重点分析的内容（如：找出销售趋势、识别异常值等）\n• 任何特殊的数据处理要求'
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
                  {analyzing ? '分析中...' : '数据分析'}
                </button>
              </div>

              {analysisHtml && (
                <div className="mt-3 space-y-3">
                  <div className="text-xs font-semibold text-slate-800">AI 深度分析</div>
                  <div className="rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50 to-indigo-50 px-3 py-2 text-xs text-slate-800 leading-relaxed">
                    <div
                      className="prose prose-xs max-w-none"
                      dangerouslySetInnerHTML={{ __html: analysisHtml }}
                    />
                  </div>
                  <div className="rounded-md bg-slate-50 px-3 py-2 text-[11px] text-slate-600 border border-emerald-200">
                    数据已自动清理：移除了空行和空列，确保分析准确性。
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
                  5
                </span>
                图表生成
              </h3>

              <div className="space-y-2">
                <label className="text-[11px] font-medium text-gray-700">
                  图表需求描述
                </label>
                <textarea
                  value={chartRequirement}
                  onChange={(e) => setChartRequirement(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  placeholder={
                    '请详细描述您想要生成的图表需求，例如：\n• 分析销售数据的月度趋势，使用折线图展示\n• 比较各部门的销售额，用柱状图显示\n• 展示市场份额分布，使用饼图\n• 显示温度与销量的关系，用散点图\n\n系统将自动选择合适的图表类型并生成相应代码'
                  }
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateChartCode}
                  disabled={generating}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {generating ? '生成中...' : '生成图表代码'}
                </button>
                <button
                  type="button"
                  onClick={() => executeChartScript()}
                  disabled={executing || !codeOutput}
                  className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  {executing ? '执行中...' : '执行脚本'}
                </button>
              </div>

              <div
                id="chartResult"
                className={[
                  'mt-3 grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)]',
                  chartVisible ? '' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-800">图表代码</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCodeExpanded((prev) => !prev)}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-slate-100"
                      >
                        {codeExpanded ? '收起编辑器' : '展开编辑器'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={codeOutput}
                    onChange={(e) => setCodeOutput(e.target.value)}
                    className={[
                      'w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-mono text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400',
                      codeExpanded ? 'min-h-[260px]' : 'min-h-[160px]',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    placeholder="生成的图表代码将显示在这里，您可以编辑后执行。"
                  />
                </div>

                <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-3 min-h-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                      图表结果
                    </span>
                    <button
                      type="button"
                      onClick={handleViewChartInNewWindow}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-gray-700 hover:bg-slate-100"
                    >
                      在新窗口中查看
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
