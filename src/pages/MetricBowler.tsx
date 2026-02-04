import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Info, Settings, HelpCircle, Sparkles, Loader2, Calendar, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Metric, MindMapNodeData, ActionPlanTaskData } from '../types';
import { HelpModal } from '../components/HelpModal';
import { AIAnalysisModal } from '../components/AIAnalysisModal';
import { analyzeMetric, AnalysisResult, generateA3PlanFromMetric } from '../services/aiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useToast } from '../context/ToastContext';
import { isViolation } from '../utils/metricUtils';
import { addDays, formatDate } from '../utils/dateUtils';
import { generateShortId } from '../utils/idUtils';

const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


const CustomizedDot = (props: any) => {
  const { cx, cy, payload } = props;
  
  // If no coordinates, don't render
  if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return null;

  // If no actual value, don't render dot
  if (payload.actual === null || payload.actual === undefined) return null;

  const violation = isViolation(
    payload.rule,
    payload.rawTarget,
    payload.rawActual
  );

  if (violation) {
    return (
      <circle cx={cx} cy={cy} r={5} fill="#dc2626" stroke="#fff" strokeWidth={2} />
    );
  }

  return (
    <circle cx={cx} cy={cy} r={3} fill="#3b82f6" strokeWidth={0} />
  );
};

const MetricBowler = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bowlers, updateBowler, selectedModel, a3Cases, addA3Case } = useApp();
  const toast = useToast();
  
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-04`;
  });

  const [stopDate, setStopDate] = useState(() => {
    const today = new Date();
    const startYear = today.getFullYear();
    const startMonthIndex = 3;
    const end = new Date(startYear, startMonthIndex + 11, 1);
    return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;
  });

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [chartSettingsOpen, setChartSettingsOpen] = useState<Record<string, boolean>>({});
  const [chartScales, setChartScales] = useState<Record<string, { min: string; max: string }>>({});

  // Bowler Edit State
  const [isEditingBowler, setIsEditingBowler] = useState(false);
  const [editBowlerName, setEditBowlerName] = useState('');
  const [editBowlerDesc, setEditBowlerDesc] = useState('');

  // AI Analysis State
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analyzingMetricName, setAnalyzingMetricName] = useState('');
  const [analyzingMetrics, setAnalyzingMetrics] = useState<Record<string, boolean>>({});
  const [creatingA3FromMetric, setCreatingA3FromMetric] = useState<Record<string, boolean>>({});

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: React.ReactNode;
  } | null>(null);

  useEffect(() => {
    if (!id && bowlers.length > 0) {
      navigate(`/metric-bowler/${bowlers[0].id}`, { replace: true });
    }
  }, [id, bowlers, navigate]);

  const displayMonths = useMemo(() => {
    const [startYearStr, startMonthStr] = startDate.split('-');
    const startYear = parseInt(startYearStr, 10);
    const startMonthIndex = parseInt(startMonthStr, 10) - 1;

    const [stopYearStr, stopMonthStr] = stopDate.split('-');
    const stopYear = parseInt(stopYearStr, 10);
    const stopMonthIndex = parseInt(stopMonthStr, 10) - 1;

    const totalMonths = (stopYear - startYear) * 12 + (stopMonthIndex - startMonthIndex) + 1;
    const months = [];

    if (totalMonths > 0) {
      for (let i = 0; i < totalMonths; i++) {
        const date = new Date(startYear, startMonthIndex + i, 1);
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        const monthName = allMonths[monthIndex];
        const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
        const label = `${year}/${monthName}`;
        months.push({ key, label });
      }
    }
    return months;
  }, [startDate, stopDate]);

  // Find the selected bowler name, or default to generic if not found or no ID
  const selectedBowler = bowlers.find(b => b.id === id);
  const title = selectedBowler ? selectedBowler.name : 'Metric Bowler';
  const metrics = selectedBowler?.metrics || [];

  useEffect(() => {
    if (selectedBowler?.metricStartDate) {
      setStartDate(selectedBowler.metricStartDate);
      const [yearStr, monthStr] = selectedBowler.metricStartDate.split('-');
      const startYear = parseInt(yearStr, 10);
      const startMonthIndex = parseInt(monthStr, 10) - 1;
      if (!isNaN(startYear) && !isNaN(startMonthIndex)) {
        const end = new Date(startYear, startMonthIndex + 11, 1);
        setStopDate(`${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`);
      }
    }
  }, [selectedBowler?.metricStartDate]);


  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (selectedBowler) {
      updateBowler({
        ...selectedBowler,
        metricStartDate: value,
      });
    }
  };

  const handleStopDateChange = (value: string) => {
    setStopDate(value);
  };

  const handleBowlerSave = () => {
    if (selectedBowler) {
        updateBowler({
            ...selectedBowler,
            name: editBowlerName,
            description: editBowlerDesc,
            metricStartDate: startDate
        });
    }
    setIsEditingBowler(false);
  };

  const handleAIAnalysis = async (metric: Metric) => {
    setAnalyzingMetrics(prev => ({ ...prev, [metric.id]: true }));
    try {
        const linkedA3Cases = a3Cases.filter(
          c => (c.linkedMetricIds || []).includes(metric.id),
        );
        const result = await analyzeMetric(metric, selectedModel, linkedA3Cases);
        setAnalysisResult(result);
        setAnalyzingMetricName(metric.name);
        setIsAnalysisModalOpen(true);
    } catch (error) {
        console.error("Analysis failed", error);
    } finally {
        setAnalyzingMetrics(prev => ({ ...prev, [metric.id]: false }));
    }
  };

  const handleCreateA3FromMetric = async (metric: Metric) => {
    if (creatingA3FromMetric[metric.id]) return;
    setCreatingA3FromMetric(prev => ({ ...prev, [metric.id]: true }));
    try {
      const linkedA3Cases = a3Cases.filter(
        c => (c.linkedMetricIds || []).includes(metric.id),
      );
      const analysis = await analyzeMetric(metric, selectedModel, linkedA3Cases);
      const plan = await generateA3PlanFromMetric(metric, selectedModel);
      const today = formatDate(new Date());
      const trendLabel = analysis.trend.charAt(0).toUpperCase() + analysis.trend.slice(1);
      let priority: 'Low' | 'Medium' | 'High' = 'Medium';
      const loweredTrend = analysis.trend.toLowerCase();
      if (
        loweredTrend === 'degrading' ||
        loweredTrend === 'unstable' ||
        loweredTrend === 'incapable' ||
        analysis.achievementRate < 50
      ) {
        priority = 'High';
      } else if (
        analysis.achievementRate >= 80 &&
        (loweredTrend === 'capable' || loweredTrend === 'improving' || loweredTrend === 'stable')
      ) {
        priority = 'Low';
      }
      const hostBowler = bowlers.find(b => (b.metrics || []).some(m => m.id === metric.id));
      const owner = metric.owner || hostBowler?.champion || '';
      const group = hostBowler?.group || '';
      const tag = hostBowler?.tag || '';
      const achievement =
        typeof analysis.achievementRate === 'number'
          ? `${analysis.achievementRate.toFixed(1)}%`
          : '';
      const descriptionParts: string[] = [];
      if (analysis.summary) {
        descriptionParts.push(analysis.summary.trim());
      }
      if (achievement) {
        descriptionParts.push(`Current target achievement: ${achievement}.`);
      }
      const description = descriptionParts.join('\n\n');

      const rootCauseText = plan.rootCauses.length
        ? `Most likely root causes:\n- ${plan.rootCauses.join('\n- ')}`
        : '';

      const mindMapNodes: MindMapNodeData[] = [];
      const rootId = 'root';
      const rootText =
        plan.problemStatement && plan.problemStatement.trim().length > 0
          ? plan.problemStatement.trim()
          : `Improve performance of metric "${metric.name}".`;
      mindMapNodes.push({
        id: rootId,
        text: rootText,
        x: 50,
        y: 220,
        parentId: null,
        type: 'root',
      });

      const addChildren = (
        nodes: MindMapNodeData[],
        tree: { cause: string; children?: { cause: string; children?: any[] }[] }[],
        parentId: string,
        depth: number,
      ) => {
        const stepY = 120;
        const stepX = 220;
        const parent = nodes.find(n => n.id === parentId);
        if (!parent) {
          return;
        }

        const validNodes = tree.filter(
          node => node && typeof node.cause === 'string' && node.cause.trim().length > 0,
        );

        const count = validNodes.length;

        validNodes.forEach((node, index) => {
          const id = generateShortId();
          const offset = count > 1 ? index - (count - 1) / 2 : 0;
          const x = parent.x + stepX;
          const y = parent.y + offset * stepY;

          mindMapNodes.push({
            id,
            text: node.cause.trim(),
            x,
            y,
            parentId,
            type: 'child',
          });

          if (node.children && node.children.length > 0) {
            addChildren(nodes, node.children, id, depth + 1);
          }
        });
      };

      if (plan.whyTree && plan.whyTree.length > 0) {
        addChildren(mindMapNodes, plan.whyTree as any, rootId, 1);
      }

      const actions: ActionPlanTaskData[] = [];
      const baseDate = new Date();
      const actionsSource = Array.isArray(plan.actions) && plan.actions.length > 0 ? plan.actions : [];
      actionsSource.forEach((a, index) => {
        const name = a.name || `Action ${index + 1}`;
        const descriptionText = a.description || '';
        const ownerText = a.owner || owner;
        const groupText = a.group || undefined;
        let startDateStr: string | undefined;
        let endDateStr: string | undefined;
        if (a.startDate && !Number.isNaN(Date.parse(a.startDate))) {
          startDateStr = a.startDate;
        }
        if (a.endDate && !Number.isNaN(Date.parse(a.endDate))) {
          endDateStr = a.endDate;
        }
        if (!startDateStr) {
          const start = addDays(baseDate, index * 7);
          startDateStr = formatDate(start);
        }
        if (!endDateStr) {
          const startDateObj = new Date(startDateStr);
          const end = addDays(startDateObj, 7);
          endDateStr = formatDate(end);
        }
        const rawStatus = a.status;
        const status: 'Not Started' | 'In Progress' | 'Completed' =
          rawStatus === 'In Progress' || rawStatus === 'Completed'
            ? rawStatus
            : 'Not Started';
        const progress =
          typeof a.progress === 'number' && isFinite(a.progress) && a.progress >= 0 && a.progress <= 100
            ? a.progress
            : 0;
        actions.push({
          id: generateShortId(),
          name,
          description: descriptionText,
          owner: ownerText,
          group: groupText,
          startDate: startDateStr,
          endDate: endDateStr,
          status,
          progress,
        });
      });

      const created = addA3Case({
        title: `A3: ${metric.name} – ${trendLabel}`,
        description,
        owner,
        group,
        tag,
        linkedMetricIds: [metric.id],
        priority,
        startDate: today,
        endDate: '',
        status: 'In Progress',
        problemStatement: plan.problemStatement || rootText,
        results: '',
        mindMapNodes,
        mindMapText: '',
        rootCause: rootCauseText,
        actionPlanTasks: actions,
        dataAnalysisObservations: '',
        dataAnalysisImages: [],
        dataAnalysisCanvasHeight: undefined,
        resultImages: [],
        resultCanvasHeight: undefined,
      });

      toast.success('Created new A3 case from AI insight.');
      navigate(`/a3-analysis/${created.id}`);
    } catch (error) {
      console.error('Failed to create A3 from AI', error);
      toast.error('Failed to create A3 from AI. Please try again.');
    } finally {
      setCreatingA3FromMetric(prev => ({ ...prev, [metric.id]: false }));
    }
  };

  const handleCellUpdate = (
    metricId: string,
    monthKey: string,
    field: 'target' | 'actual',
    value: string
  ) => {
    if (!selectedBowler) return;

    // Validate input if it's a target field and rule is 'within_range'
    const metric = metrics.find(m => m.id === metricId);
    if (metric && field === 'target' && metric.targetMeetingRule === 'within_range') {
        const match = value.match(/^(?:\{|\[)?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:\}|\])?$/);
        if (!match) {
            toast.error("Invalid format: Target must be {min, max} (e.g., {5, 10})");
            // Force re-render to reset input value by triggering a state update that doesn't change data?
            // Actually, since the input is uncontrolled (defaultValue), we need to manually reset it or let the user fix it.
            // But we should NOT update the bowler state.
            
            // To reset the input value visually to the previous valid state, we can find the element
            const inputId = `cell-${metricId}-${monthKey}-target`;
            const element = document.getElementById(inputId) as HTMLInputElement;
            if (element) {
                element.value = metric.monthlyData?.[monthKey]?.target || '';
            }
            return;
        }
        
        const min = parseFloat(match[1]);
        const max = parseFloat(match[2]);
        
        if (isNaN(min) || isNaN(max)) {
             toast.error("Invalid numbers: Target must contain valid numbers");
             const inputId = `cell-${metricId}-${monthKey}-target`;
             const element = document.getElementById(inputId) as HTMLInputElement;
             if (element) {
                 element.value = metric.monthlyData?.[monthKey]?.target || '';
             }
             return;
        }

        if (min >= max) {
            toast.error("Invalid range: Min value must be strictly smaller than Max value");
             const inputId = `cell-${metricId}-${monthKey}-target`;
             const element = document.getElementById(inputId) as HTMLInputElement;
             if (element) {
                 element.value = metric.monthlyData?.[monthKey]?.target || '';
             }
            return;
        }
    }

    const updatedMetrics = metrics.map(m => {
      if (m.id !== metricId) return m;

      const currentMonthlyData = m.monthlyData || {};
      const monthData = currentMonthlyData[monthKey] || { target: '', actual: '' };
      
      // If value hasn't changed, don't update
      if (monthData[field] === value) return m;

      return {
        ...m,
        monthlyData: {
          ...currentMonthlyData,
          [monthKey]: {
            ...monthData,
            [field]: value
          }
        }
      };
    });

    // Only update if there are actual changes
    if (JSON.stringify(updatedMetrics) !== JSON.stringify(metrics)) {
        updateBowler({
            ...selectedBowler,
            metrics: updatedMetrics
        });
    }
  };

  const handleNoteUpdate = (
    metricId: string,
    monthKey: string,
    field: 'targetNote' | 'actualNote',
    value: string
  ) => {
    if (!selectedBowler) return;

    const updatedMetrics = metrics.map(m => {
      if (m.id !== metricId) return m;

      const currentMonthlyData = m.monthlyData || {};
      const monthData = currentMonthlyData[monthKey] || { target: '', actual: '' };
      
      return {
        ...m,
        monthlyData: {
          ...currentMonthlyData,
          [monthKey]: {
            ...monthData,
            [field]: value
          }
        }
      };
    });

    updateBowler({
        ...selectedBowler,
        metrics: updatedMetrics
    });
  };

  const handleRightClick = (
    e: React.MouseEvent,
    metricId: string,
    monthKey: string,
    type: 'target' | 'actual',
    currentNote: string
  ) => {
    e.preventDefault();
    const note = prompt('Enter note for this cell:', currentNote);
    if (note !== null) {
      handleNoteUpdate(metricId, monthKey, type === 'target' ? 'targetNote' : 'actualNote', note);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: 'target' | 'actual',
    metricIndex: number,
    monthIndex: number
  ) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      
      let nextMetricIndex = metricIndex;
      let nextField = field;
      let nextMonthIndex = monthIndex;

      if (e.key === 'ArrowUp') {
        if (field === 'actual') {
          nextField = 'target';
        } else {
          nextField = 'actual';
          nextMetricIndex = Math.max(0, metricIndex - 1);
        }
      } else if (e.key === 'ArrowDown') {
        if (field === 'target') {
          nextField = 'actual';
        } else {
          nextField = 'target';
          nextMetricIndex = Math.min(metrics.length - 1, metricIndex + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        nextMonthIndex = Math.max(0, monthIndex - 1);
      } else if (e.key === 'ArrowRight') {
        nextMonthIndex = Math.min(displayMonths.length - 1, monthIndex + 1);
      }

      const nextMetric = metrics[nextMetricIndex];
      const nextMonth = displayMonths[nextMonthIndex];
      const inputId = `cell-${nextMetric.id}-${nextMonth.key}-${nextField}`;
      const element = document.getElementById(inputId);
      
      if (element) {
        element.focus();
        (element as HTMLInputElement).select();
      }
    } else if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  if (!id && bowlers.length > 0) {
      return <Navigate to={`/metric-bowler/${bowlers[0].id}`} replace />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center">
        <div 
            onDoubleClick={() => {
                if (selectedBowler) {
                    setEditBowlerName(selectedBowler.name);
                    setEditBowlerDesc(selectedBowler.description || '');
                    setIsEditingBowler(true);
                }
            }}
            className="flex-1 mr-4"
        >
           {isEditingBowler ? (
               <div 
                 className="flex flex-col space-y-2 max-w-md"
                 onBlur={(e) => {
                     if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                         handleBowlerSave();
                     }
                 }}
               >
                   <input 
                       type="text" 
                       value={editBowlerName}
                       onChange={(e) => setEditBowlerName(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleBowlerSave()}
                       className="text-xl font-semibold text-gray-900 border-b border-gray-300 focus:border-blue-500 outline-none"
                       autoFocus
                   />
                   <input 
                       type="text" 
                       value={editBowlerDesc}
                       onChange={(e) => setEditBowlerDesc(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleBowlerSave()}
                       className="text-sm text-gray-500 border-b border-gray-300 focus:border-blue-500 outline-none w-full"
                       placeholder="Description"
                   />
               </div>
           ) : (
               <>
                  <h3 className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors" title="Double-click to edit">{title}</h3>
                   <p className="hidden md:block text-sm text-gray-500 mt-1 cursor-pointer hover:text-gray-700" title="Double-click to edit">
                     {selectedBowler?.description || 'Track key performance indicators and monthly targets.'}
                   </p>
               </>
           )}
        </div>
        <div className="text-right flex flex-col items-end">
             {selectedBowler?.champion && <p className="text-sm text-gray-600 mb-2">Champion: {selectedBowler.champion}</p>}
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsHelpModalOpen(true)}
                className="inline-flex items-center p-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Help Guide"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
              <div className="hidden sm:flex items-center space-x-2">
                <input 
                  type="month" 
                  id="startDate"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1 border"
                  title="Start Date"
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="month" 
                  id="stopDate"
                  value={stopDate}
                  onChange={(e) => handleStopDateChange(e.target.value)}
                  className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1 border"
                  title="Stop Date"
                />
              </div>
              <div className="flex sm:hidden items-center space-x-1">
                <label className="relative inline-flex items-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="month"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Start Date"
                  />
                </label>
                <span className="text-gray-400">-</span>
                <label className="relative inline-flex items-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="month"
                    value={stopDate}
                    onChange={(e) => handleStopDateChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Stop Date"
                  />
                </label>
              </div>
            </div>
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-hidden scrollbar-hide border-t border-slate-200">
        <table className="min-w-full divide-y divide-slate-100 table-auto">
          <thead className="bg-slate-50/80 backdrop-blur-sm">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50/95 z-20 border-r border-slate-200 shadow-soft w-48 font-display">
                Metric Name
              </th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-24 border-r border-slate-200 font-display">
                Scope
              </th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-20 border-r border-slate-200 font-display">
                Type
              </th>
              {displayMonths.map((month) => (
                <th
                  key={month.key}
                  scope="col"
                  className="px-1 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-normal break-words min-w-[3rem] border-r border-slate-200 font-display"
                >
                  {month.label.replace('/', ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {metrics.length === 0 ? (
                <tr>
                    <td colSpan={3 + displayMonths.length} className="px-6 py-10 text-center text-slate-400 italic font-medium">
                        No metrics added yet. Use the + button to add metrics.
                    </td>
                </tr>
            ) : (
                metrics.map((metric, metricIndex) => (
                  <>
                  <tr
                    key={`${metric.id}-row1`}
                    className="hover:bg-slate-50/50 transition-colors border-b-0 group/row"
                  >
                    <td rowSpan={2} className="px-4 py-4 text-sm font-medium text-slate-900 sticky left-0 bg-white z-10 group-hover/row:bg-slate-50/50 border-r border-slate-200 shadow-soft align-top break-words transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                            <div className="flex items-center flex-wrap">
                                <span className="mr-2 font-semibold tracking-tight">{metric.name}</span>
                                <div 
                                    className="inline-block"
                                    onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setTooltip({
                                            x: rect.right + 8,
                                            y: rect.top,
                                            content: (
                                                <>
                                                    <p className="font-semibold mb-1 text-white">Definition:</p>
                                                    <p className="mb-2 text-slate-200">{metric.definition || 'N/A'}</p>
                                                    
                                                    <p className="font-semibold mb-1 text-white">Owner:</p>
                                                    <p className="mb-2 text-slate-200">{metric.owner || 'N/A'}</p>
                                                    
                                                    <p className="font-semibold mb-1 text-white">Attribute:</p>
                                                    <p className="text-slate-200">{metric.attribute || 'N/A'}</p>
                                                </>
                                            )
                                        });
                                    }}
                                    onMouseLeave={() => setTooltip(null)}
                                >
                                    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-primary-500 cursor-help transition-colors" />
                                </div>
                            </div>
                        </div>
                      </div>
                    </td>
                    
                    <td rowSpan={2} className="px-2 py-4 whitespace-nowrap text-xs text-slate-600 bg-white border-r border-slate-200 border-b-0 align-top group-hover/row:bg-slate-50/50 transition-colors">
                        {metric.scope || '-'}
                    </td>

                    <td className="px-2 py-2 whitespace-nowrap text-xs font-semibold text-slate-500 bg-slate-50/30 border-b border-slate-100 h-8">
                      Target
                    </td>

                    {displayMonths.map((month, monthIndex) => (
                      <td
                        key={`${month.key}-target`}
                        className="px-0 py-0 whitespace-nowrap text-xs text-slate-500 bg-slate-50/30 border-b border-r border-slate-100 h-8 p-0 relative group/cell"
                        onContextMenu={(e) => handleRightClick(e, metric.id, month.key, 'target', metric.monthlyData?.[month.key]?.targetNote || '')}
                      >
                        <input
                            id={`cell-${metric.id}-${month.key}-target`}
                            type="text"
                            className="w-full h-full bg-transparent text-center focus:outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-primary-500 px-1 min-w-[3rem] transition-all font-medium text-slate-700 placeholder-slate-300"
                            defaultValue={metric.monthlyData?.[month.key]?.target || ''}
                            onBlur={(e) => handleCellUpdate(metric.id, month.key, 'target', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'target', metricIndex, monthIndex)}
                            title={metric.monthlyData?.[month.key]?.targetNote || ''}
                        />
                        {metric.monthlyData?.[month.key]?.targetNote && (
                          <div className="absolute top-0 right-0 w-0 h-0 border-t-[6px] border-l-[6px] border-t-red-500 border-l-transparent pointer-events-none" />
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr key={`${metric.id}-row2`} className="hover:bg-slate-50/50 transition-colors group/row">
                     <td className="px-2 py-2 whitespace-nowrap text-xs font-semibold text-slate-500 h-8 border-b border-r border-slate-100">
                        Actual
                     </td>
                     {displayMonths.map((month, monthIndex) => {
                       const violation = isViolation(
                         metric.targetMeetingRule,
                         metric.monthlyData?.[month.key]?.target,
                         metric.monthlyData?.[month.key]?.actual
                       );
                       return (
                       <td
                         key={`${month.key}-actual`}
                         className="px-0 py-0 whitespace-nowrap text-xs text-slate-500 h-8 p-0 relative group/cell border-b border-r border-slate-100"
                         onContextMenu={(e) => handleRightClick(e, metric.id, month.key, 'actual', metric.monthlyData?.[month.key]?.actualNote || '')}
                       >
                         <input
                             id={`cell-${metric.id}-${month.key}-actual`}
                             type="text"
                             className={`w-full h-full bg-transparent text-center focus:outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-primary-500 px-1 min-w-[3rem] transition-all ${
                               !metric.monthlyData?.[month.key]?.actual 
                                 ? 'text-slate-300' 
                                 : violation 
                                   ? 'text-red-600 font-bold bg-red-50/50' 
                                   : 'text-slate-900 font-bold'
                             }`}
                             defaultValue={metric.monthlyData?.[month.key]?.actual || ''}
                             onBlur={(e) => handleCellUpdate(metric.id, month.key, 'actual', e.target.value)}
                             onKeyDown={(e) => handleKeyDown(e, 'actual', metricIndex, monthIndex)}
                             title={metric.monthlyData?.[month.key]?.actualNote || ''}
                         />
                         {metric.monthlyData?.[month.key]?.actualNote && (
                           <div className="absolute top-0 right-0 w-0 h-0 border-t-[6px] border-l-[6px] border-t-red-500 border-l-transparent pointer-events-none" />
                         )}
                       </td>
                       );
                     })}
                  </tr>
                  </>
                ))
            )}
          </tbody>
        </table>
      </div>

      {metrics.length > 0 && (
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Metric Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {metrics.map(metric => {
              const chartData = displayMonths.map(month => {
                const rawTarget = metric.monthlyData?.[month.key]?.target;
                const rawActual = metric.monthlyData?.[month.key]?.actual;

                let target: number | null = null;
                let minTarget: number | null = null;
                let maxTarget: number | null = null;

                if (rawTarget) {
                  const match = rawTarget.match(/^(?:\{|\[)?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:\}|\])?$/);
                  if (match) {
                    const min = parseFloat(match[1]);
                    const max = parseFloat(match[2]);
                    if (!isNaN(min) && !isNaN(max)) {
                      minTarget = min;
                      maxTarget = max;
                    }
                  }

                  const val = parseFloat(rawTarget);
                  if (!isNaN(val)) target = val;
                }

                const actualVal = rawActual ? parseFloat(rawActual) : NaN;
                const actual = !isNaN(actualVal) ? actualVal : null;

                return {
                  name: month.label.split('/')[1],
                  fullLabel: month.label,
                  target,
                  minTarget,
                  maxTarget,
                  actual,
                  rule: metric.targetMeetingRule,
                  rawTarget,
                  rawActual,
                };
              });

              const metricA3Markers: { x: string; title: string; endDate?: string }[] = (a3Cases || [])
                .filter(a3 => (a3.linkedMetricIds || []).includes(metric.id) && a3.endDate)
                .map(a3 => {
                  const [yearStr, monthStr] = (a3.endDate || '').split('-');
                  const year = parseInt(yearStr, 10);
                  const month = parseInt(monthStr || '', 10);
                  if (isNaN(year) || isNaN(month)) {
                    return null;
                  }
                  const key = `${year}-${String(month).padStart(2, '0')}`;
                  const monthEntry = displayMonths.find(m => m.key === key);
                  if (!monthEntry) {
                    return null;
                  }
                  const monthName = monthEntry.label.split('/')[1];
                  return {
                    x: monthName,
                    title: a3.title || 'Untitled A3',
                    endDate: a3.endDate,
                  };
                })
                .filter(m => !!m) as { x: string; title: string; endDate?: string }[];

              const a3MarkersByMonth: Record<string, { title: string; endDate?: string }[]> = {};
              metricA3Markers.forEach(marker => {
                if (!a3MarkersByMonth[marker.x]) {
                  a3MarkersByMonth[marker.x] = [];
                }
                a3MarkersByMonth[marker.x].push({ title: marker.title, endDate: marker.endDate });
              });

              const scale = chartScales[metric.id] || { min: '', max: '' };
              const isSettingsOpen = chartSettingsOpen[metric.id] || false;
              
              const yDomain: [number | 'auto', number | 'auto'] = [
                scale.min !== '' && !isNaN(parseFloat(scale.min)) ? parseFloat(scale.min) : 'auto',
                scale.max !== '' && !isNaN(parseFloat(scale.max)) ? parseFloat(scale.max) : 'auto',
              ];

              return (
                <div key={`${metric.id}-chart`} className="bg-white p-5 rounded-xl shadow-soft border border-slate-100 hover:shadow-medium transition-shadow duration-300">
                  <div className="flex justify-between items-start mb-5">
                    <h4 className="text-base font-bold text-slate-800 font-display tracking-tight">{metric.name}</h4>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleAIAnalysis(metric)}
                        disabled={analyzingMetrics[metric.id]}
                        className="p-1.5 rounded-lg transition-all text-primary-500 hover:text-primary-700 hover:bg-primary-50 disabled:opacity-50"
                        title="AI Analysis"
                      >
                        {analyzingMetrics[metric.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          setChartSettingsOpen(prev => ({ ...prev, [metric.id]: !prev[metric.id] }))
                        }
                        className={`p-1.5 rounded-lg transition-all ${
                          isSettingsOpen
                            ? 'bg-slate-100 text-primary-600'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                        title="Adjust Scale"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCreateA3FromMetric(metric)}
                        disabled={creatingA3FromMetric[metric.id]}
                        className="p-1.5 rounded-lg transition-all text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                        title="Create A3 with AI"
                      >
                        {creatingA3FromMetric[metric.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {isSettingsOpen && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg text-xs border border-slate-100">
                        <div className="flex items-center space-x-4">
                            <span className="font-medium text-slate-600">Y-Axis Scale:</span>
                            <div className="flex items-center space-x-2">
                                <label className="text-slate-500">Min:</label>
                                <input 
                                    type="number" 
                                    className="w-20 p-1 border border-slate-300 rounded focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Auto"
                                    value={scale.min}
                                    onChange={(e) => setChartScales(prev => ({
                                        ...prev,
                                        [metric.id]: { ...prev[metric.id], min: e.target.value }
                                    }))}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <label className="text-slate-500">Max:</label>
                                <input 
                                    type="number" 
                                    className="w-20 p-1 border border-slate-300 rounded focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Auto"
                                    value={scale.max}
                                    onChange={(e) => setChartScales(prev => ({
                                        ...prev,
                                        [metric.id]: { ...prev[metric.id], max: e.target.value }
                                    }))}
                                />
                            </div>
                        </div>
                    </div>
                  )}

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                          domain={yDomain}
                        />
                        {metricA3Markers.map((marker, index) => (
                          <ReferenceLine
                            key={`a3-marker-${metric.id}-${index}`}
                            x={marker.x}
                            stroke="#10b981"
                            strokeWidth={1}
                            strokeDasharray="3 3"
                          />
                        ))}
                        <Tooltip
                          content={(tooltipProps: any) => {
                            const { active, label, payload } = tooltipProps;
                            if (!active || !label) return null;
                            const rows = payload || [];
                            const a3ForMonth = a3MarkersByMonth[label as string] || [];

                            return (
                              <div className="bg-white border border-gray-200 rounded-md shadow-md p-2 text-xs text-gray-700">
                                <div className="font-semibold text-gray-900 mb-1">{label}</div>
                                {rows.map((entry: any) => {
                                  if (!entry || entry.value == null || Number.isNaN(entry.value)) {
                                    return null;
                                  }
                                  return (
                                    <div
                                      key={entry.dataKey}
                                      className="flex items-center justify-between gap-2"
                                    >
                                      <span className="text-gray-500">
                                        {entry.name || entry.dataKey}
                                      </span>
                                      <span className="font-medium text-gray-900">
                                        {entry.value}
                                      </span>
                                    </div>
                                  );
                                })}
                                {a3ForMonth.length > 0 && (
                                  <div className="mt-2 border-t border-gray-100 pt-1">
                                    <div className="text-[10px] font-semibold text-emerald-700 mb-1">
                                      A3s ending this month
                                    </div>
                                    {a3ForMonth.map((a3, index) => (
                                      <div
                                        key={index}
                                        className="text-[10px] text-emerald-800 leading-snug"
                                      >
                                        {a3.title}
                                        {a3.endDate && (
                                          <span className="text-[10px] text-gray-500">
                                            {' '}
                                            ({a3.endDate})
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          dot={<CustomizedDot />} 
                          activeDot={{ r: 5 }} 
                          name="Actual"
                          connectNulls
                        />
                        {metric.targetMeetingRule === 'within_range' ? (
                        <>
                        <Line 
                          type="monotone" 
                          dataKey="minTarget" 
                          stroke="#ef4444" 
                          strokeWidth={2} 
                          strokeDasharray="3 3" 
                          dot={false}
                          activeDot={false}
                          name="Min Target"
                          connectNulls 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="maxTarget" 
                          stroke="#ef4444" 
                          strokeWidth={2} 
                          strokeDasharray="3 3" 
                          dot={false}
                          activeDot={false}
                          name="Max Target"
                          connectNulls 
                        />
                        </>
                        ) : (
                        <Line 
                          type="monotone" 
                          dataKey="target" 
                          stroke="#ef4444" 
                          strokeWidth={2} 
                          strokeDasharray="5 5" 
                          dot={false}
                          name="Target"
                          connectNulls 
                        />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <HelpModal
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />

      <AIAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        result={analysisResult}
        metricName={analyzingMetricName}
      />

      {tooltip && createPortal(
        <div 
          className="fixed p-3 bg-gray-800 text-white text-xs rounded shadow-lg z-[9999] whitespace-normal break-words w-64 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
        </div>,
        document.body
      )}
    </div>
  );
};

export default MetricBowler;
