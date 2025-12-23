import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Navigate } from 'react-router-dom';
import { Info, Settings, HelpCircle, Sparkles, Loader2, Calendar, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Metric } from '../types';
import { HelpModal } from '../components/HelpModal';
import { AIAnalysisModal } from '../components/AIAnalysisModal';
import { analyzeMetric, AnalysisResult } from '../services/aiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '../context/ToastContext';
import { isViolation } from '../utils/metricUtils';

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
  const { bowlers, updateBowler, selectedModel } = useApp();
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

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: React.ReactNode;
  } | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const metricRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

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

  const metricAlerts = useMemo(() => {
    if (!selectedBowler) return [];
    const result: { metricId: string; metricName: string; consecutiveFails: number }[] = [];

    metrics.forEach(metric => {
      if (!metric.monthlyData) return;
      let streak = 0;

      displayMonths.forEach(month => {
        const monthData = metric.monthlyData?.[month.key];
        const violation = isViolation(
          metric.targetMeetingRule,
          monthData?.target,
          monthData?.actual
        );
        if (violation) {
          streak += 1;
        } else {
          streak = 0;
        }
      });

      if (streak >= 2) {
        result.push({
          metricId: metric.id,
          metricName: metric.name,
          consecutiveFails: streak
        });
      }
    });

    return result;
  }, [selectedBowler, metrics, displayMonths]);

  const handleAlertClick = (metricId: string) => {
    const row = metricRowRefs.current[metricId];
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2');
      setTimeout(() => {
        row.classList.remove('ring-2', 'ring-amber-400', 'ring-offset-2');
      }, 1600);
    }
  };

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
            description: editBowlerDesc
        });
    }
    setIsEditingBowler(false);
  };

  const handleAIAnalysis = async (metric: Metric) => {
    setAnalyzingMetrics(prev => ({ ...prev, [metric.id]: true }));
    try {
        const result = await analyzeMetric(metric, selectedModel);
        setAnalysisResult(result);
        setAnalyzingMetricName(metric.name);
        setIsAnalysisModalOpen(true);
    } catch (error) {
        console.error("Analysis failed", error);
    } finally {
        setAnalyzingMetrics(prev => ({ ...prev, [metric.id]: false }));
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
      {metricAlerts.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-200 bg-amber-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              {metricAlerts.length} metric{metricAlerts.length > 1 ? 's' : ''} with consecutive target misses
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAlerts(!showAlerts)}
            className="text-xs font-medium text-amber-800 hover:text-amber-900 underline"
          >
            {showAlerts ? 'Hide details' : 'View details'}
          </button>
        </div>
      )}
      {showAlerts && metricAlerts.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-200 bg-amber-50/60">
          <ul className="space-y-1 text-sm text-amber-900">
            {metricAlerts.map(alert => (
              <li
                key={alert.metricId}
                className="flex items-center justify-between cursor-pointer hover:text-amber-950"
                onClick={() => handleAlertClick(alert.metricId)}
              >
                <span className="flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span className="underline">{alert.metricName}</span>
                </span>
                <span className="text-xs text-amber-700">
                  {alert.consecutiveFails} consecutive months not meeting target
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="overflow-x-auto overflow-y-hidden no-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-48">
                Metric Name
              </th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 border-r border-gray-200">
                Scope
              </th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20 border-r border-gray-200">
                Type
              </th>
              {displayMonths.map((month) => (
                <th
                  key={month.key}
                  scope="col"
                  className="px-1 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider text-gray-400 whitespace-normal break-words min-w-[3rem] border-r border-gray-200"
                >
                  {month.label.replace('/', ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {metrics.length === 0 ? (
                <tr>
                    <td colSpan={3 + displayMonths.length} className="px-6 py-10 text-center text-gray-500 italic">
                        No metrics added yet. Use the + button to add metrics.
                    </td>
                </tr>
            ) : (
                metrics.map((metric, metricIndex) => (
                  <>
                  <tr
                    key={`${metric.id}-row1`}
                    ref={el => {
                      metricRowRefs.current[metric.id] = el;
                    }}
                    className="hover:bg-gray-50 transition-colors border-b-0"
                  >
                    <td rowSpan={2} className="px-4 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 hover:z-[60] border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-gray-50 align-top break-words">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                            <div className="flex items-center flex-wrap">
                                <span className="mr-2 flex items-center space-x-1">
                                  <span>{metric.name}</span>
                                  {metricAlerts.find(a => a.metricId === metric.id) && (
                                    <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold" title="Consecutive target misses">
                                      !
                                    </span>
                                  )}
                                </span>
                                <div 
                                    className="inline-block"
                                    onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setTooltip({
                                            x: rect.right + 8,
                                            y: rect.top,
                                            content: (
                                                <>
                                                    <p className="font-semibold mb-1">Definition:</p>
                                                    <p className="mb-2">{metric.definition || 'N/A'}</p>
                                                    
                                                    <p className="font-semibold mb-1">Owner:</p>
                                                    <p className="mb-2">{metric.owner || 'N/A'}</p>
                                                    
                                                    <p className="font-semibold mb-1">Attribute:</p>
                                                    <p>{metric.attribute || 'N/A'}</p>
                                                </>
                                            )
                                        });
                                    }}
                                    onMouseLeave={() => setTooltip(null)}
                                >
                                    <Info className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500 cursor-help" />
                                </div>
                            </div>
                        </div>
                      </div>
                    </td>
                    
                    <td rowSpan={2} className="px-2 py-4 whitespace-nowrap text-xs text-gray-700 bg-white border-r border-gray-200 border-b-0 align-top">
                        {metric.scope || '-'}
                    </td>

                    <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-500 bg-gray-50/30 border-b border-gray-100 h-8">
                      Target
                    </td>

                    {displayMonths.map((month, monthIndex) => (
                      <td
                        key={`${month.key}-target`}
                        className="px-0 py-0 whitespace-nowrap text-xs text-gray-500 bg-gray-50/30 border-b border-r border-gray-100 h-8 p-0 relative group/cell"
                        onContextMenu={(e) => handleRightClick(e, metric.id, month.key, 'target', metric.monthlyData?.[month.key]?.targetNote || '')}
                      >
                        <input
                            id={`cell-${metric.id}-${month.key}-target`}
                            type="text"
                            className="w-full h-full bg-transparent text-center focus:outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500 px-1 min-w-[3rem]"
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

                  {/* Row 2: Actual Data */}
                  <tr key={`${metric.id}-row2`} className="hover:bg-gray-50 transition-colors">
                     <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-500 h-8 border-b border-r border-gray-100">
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
                         className="px-0 py-0 whitespace-nowrap text-xs text-gray-500 h-8 p-0 relative group/cell border-b border-r border-gray-100"
                         onContextMenu={(e) => handleRightClick(e, metric.id, month.key, 'actual', metric.monthlyData?.[month.key]?.actualNote || '')}
                       >
                         <input
                             id={`cell-${metric.id}-${month.key}-actual`}
                             type="text"
                             className={`w-full h-full bg-transparent text-center focus:outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500 px-1 min-w-[3rem] ${
                               !metric.monthlyData?.[month.key]?.actual 
                                 ? 'text-gray-400' 
                                 : violation 
                                   ? 'text-red-600 font-bold bg-red-50' 
                                   : 'text-gray-900 font-semibold'
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
            {metrics.map((metric) => {
              const chartData = displayMonths.map((month) => {
                const rawTarget = metric.monthlyData?.[month.key]?.target;
                const rawActual = metric.monthlyData?.[month.key]?.actual;
                
                let target: number | null = null;
                let minTarget: number | null = null;
                let maxTarget: number | null = null;

                if (rawTarget) {
                     // Try to parse as range first
                     const match = rawTarget.match(/^(?:\{|\[)?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:\}|\])?$/);
                     if (match) {
                         const min = parseFloat(match[1]);
                         const max = parseFloat(match[2]);
                         if (!isNaN(min) && !isNaN(max)) {
                             minTarget = min;
                             maxTarget = max;
                         }
                     }
                     
                     // Also try to parse as single number (fallback)
                     const val = parseFloat(rawTarget);
                     if (!isNaN(val)) target = val;
                }

                const actualVal = rawActual ? parseFloat(rawActual) : NaN;
                const actual = !isNaN(actualVal) ? actualVal : null;

                return {
                    name: month.label.split('/')[1], // Just show month name
                    fullLabel: month.label,
                    target,
                    minTarget,
                    maxTarget,
                    actual,
                    rule: metric.targetMeetingRule,
                    rawTarget,
                    rawActual
                };
              });

              const scale = chartScales[metric.id] || { min: '', max: '' };
              const isSettingsOpen = chartSettingsOpen[metric.id] || false;
              
              const yDomain: [number | 'auto', number | 'auto'] = [
                scale.min !== '' && !isNaN(parseFloat(scale.min)) ? parseFloat(scale.min) : 'auto',
                scale.max !== '' && !isNaN(parseFloat(scale.max)) ? parseFloat(scale.max) : 'auto',
              ];

              return (
                <div key={`${metric.id}-chart`} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-sm font-medium text-gray-900">{metric.name}</h4>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => handleAIAnalysis(metric)}
                            disabled={analyzingMetrics[metric.id]}
                            className="p-1 rounded-md transition-colors text-blue-500 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                            title="AI Analysis"
                        >
                            {analyzingMetrics[metric.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setChartSettingsOpen(prev => ({ ...prev, [metric.id]: !prev[metric.id] }))}
                            className={`p-1 rounded-md transition-colors ${isSettingsOpen ? 'bg-gray-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Adjust Scale"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                  
                  {isSettingsOpen && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md text-xs">
                        <div className="flex items-center space-x-4">
                            <span className="font-medium text-gray-600">Y-Axis Scale:</span>
                            <div className="flex items-center space-x-2">
                                <label className="text-gray-500">Min:</label>
                                <input 
                                    type="number" 
                                    className="w-20 p-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Auto"
                                    value={scale.min}
                                    onChange={(e) => setChartScales(prev => ({
                                        ...prev,
                                        [metric.id]: { ...prev[metric.id], min: e.target.value }
                                    }))}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <label className="text-gray-500">Max:</label>
                                <input 
                                    type="number" 
                                    className="w-20 p-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
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
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 10, fill: '#6b7280' }} 
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 10, fill: '#6b7280' }} 
                          axisLine={false}
                          tickLine={false}
                          domain={yDomain}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                          labelStyle={{ color: '#374151', fontWeight: 600 }}
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
