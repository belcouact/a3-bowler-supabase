import { useState, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Info, Settings, Download, Upload, HelpCircle, Sparkles, Loader2 } from 'lucide-react';
import { useApp, Metric, Bowler } from '../context/AppContext';
import { ImportModal } from '../components/ImportModal';
import { HelpModal } from '../components/HelpModal';
import { AIAnalysisModal } from '../components/AIAnalysisModal';
import { analyzeMetric, AnalysisResult } from '../services/aiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '../context/ToastContext';

const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const isViolation = (
  rule: 'gte' | 'lte' | 'within_range' | undefined,
  targetStr: string | undefined,
  actualStr: string | undefined
): boolean => {
  if (!actualStr || !targetStr) return false;
  
  const actual = parseFloat(actualStr);
  if (isNaN(actual)) return false;

  const effectiveRule = rule || 'gte';

  if (effectiveRule === 'gte') {
    const target = parseFloat(targetStr);
    if (isNaN(target)) return false;
    return actual < target;
  }

  if (effectiveRule === 'lte') {
    const target = parseFloat(targetStr);
    if (isNaN(target)) return false;
    return actual > target;
  }

  if (effectiveRule === 'within_range') {
    const match = targetStr.match(/^[{\[]?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*[}\]]?$/);
    if (match) {
      const min = parseFloat(match[1]);
      const max = parseFloat(match[2]);
      if (!isNaN(min) && !isNaN(max)) {
        return actual < min || actual > max;
      }
    }
  }

  return false;
};

const CustomizedDot = (props: any) => {
  const { cx, cy, payload } = props;
  
  // If no coordinates, don't render
  if (cx === undefined || cy === undefined) return null;

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
  const { bowlers, updateBowler, addBowler } = useApp();
  const toast = useToast();
  
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-04`;
  });

  const [stopDate, setStopDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear() + 1}-04`;
  });

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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
        const result = await analyzeMetric(metric);
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
        const match = value.match(/^[{\[]?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*[}\]]?$/);
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

  const handleImport = (importedData: Record<string, { bowler: Partial<Bowler>, metrics: Metric[] }>) => {
    let createdCount = 0;
    let updatedCount = 0;

    Object.entries(importedData).forEach(([bowlerName, { bowler, metrics }]) => {
      const existingBowler = bowlers.find(b => b.name === bowlerName);

      if (existingBowler) {
        // Merge with existing metrics
        const mergedMetrics = [...(existingBowler.metrics || [])];
        
        metrics.forEach(impMetric => {
          const existingMetricIndex = mergedMetrics.findIndex(m => m.name === impMetric.name);
          
          if (existingMetricIndex >= 0) {
            // Update existing metric
            const existingMetric = mergedMetrics[existingMetricIndex];
            mergedMetrics[existingMetricIndex] = {
              ...existingMetric,
              ...impMetric,
              id: existingMetric.id, // Preserve ID
              monthlyData: {
                ...existingMetric.monthlyData,
                ...impMetric.monthlyData
              }
            };
          } else {
            // Add new metric
            mergedMetrics.push(impMetric);
          }
        });

        updateBowler({
          ...existingBowler,
          ...bowler,
          metrics: mergedMetrics
        });
        updatedCount++;
      } else {
        // Create new bowler
        addBowler({
          name: bowlerName,
          ...bowler,
          metrics: metrics,
          description: bowler.description || 'Imported from CSV'
        });
        createdCount++;
      }
    });

    if (createdCount > 0 || updatedCount > 0) {
        // If we are currently viewing a bowler, and that bowler was updated, the UI will auto-update via context.
        // If we created a new bowler and we weren't viewing any, or we want to switch to it? 
        // For now, just stay where we are.
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

  const handleDownloadCSV = () => {
    if (!selectedBowler || metrics.length === 0) {
      toast.info("No data to download.");
      return;
    }

    // 1. Create Header Row
    // Header: Bowler Name, Metric Name, Scope, Type, 2024/Jan, 2024/Feb...
    const monthHeaders = displayMonths.map(m => `"${m.label}"`).join(',');
    const header = `"Bowler Name","Metric Name","Scope","Type",${monthHeaders}\n`;

    // 2. Create Data Rows
    const rows = metrics.flatMap(metric => {
      const basicInfo = `"${selectedBowler.name}","${metric.name}","${metric.scope || ''}"`;
      
      const targetRowData = displayMonths.map(m => {
        return `"${metric.monthlyData?.[m.key]?.target || ''}"`;
      }).join(',');

      const actualRowData = displayMonths.map(m => {
        return `"${metric.monthlyData?.[m.key]?.actual || ''}"`;
      }).join(',');

      return [
        `${basicInfo},"Target",${targetRowData}`,
        `${basicInfo},"Actual",${actualRowData}`
      ];
    }).join('\n');

    // 3. Combine and Download
    const csvContent = "\uFEFF" + header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedBowler.name}_metrics_${startDate || 'all'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!id && bowlers.length > 0) {
      return <Navigate to={`/metric-bowler/${bowlers[0].id}`} replace />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                   <p className="text-sm text-gray-500 mt-1 cursor-pointer hover:text-gray-700" title="Double-click to edit">
                     {selectedBowler?.description || 'Track key performance indicators and monthly targets.'}
                   </p>
               </>
           )}
        </div>
        <div className="text-right flex flex-col items-end">
             {selectedBowler?.champion && <p className="text-sm text-gray-600 mb-2">Champion: {selectedBowler.champion}</p>}
             {selectedBowler?.tag && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-3">{selectedBowler.tag}</span>}
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsHelpModalOpen(true)}
                className="inline-flex items-center p-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Help Guide"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center p-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Import CSV"
              >
                <Upload className="h-4 w-4" />
              </button>
              <button
                onClick={handleDownloadCSV}
                 className="inline-flex items-center p-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                 title="Download CSV"
               >
                 <Download className="h-4 w-4" />
               </button>
               <input 
                 type="month" 
                 id="startDate"
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
                 className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1 border"
                 title="Start Date"
               />
               <span className="text-gray-400">-</span>
               <input 
                 type="month" 
                 id="stopDate"
                 value={stopDate}
                 onChange={(e) => setStopDate(e.target.value)}
                 className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1 border"
                 title="Stop Date"
               />
             </div>
        </div>
      </div>
      <div className="overflow-x-auto no-scrollbar">
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
                  {/* Row 1: Metadata + Target Data */}
                  <tr key={`${metric.id}-row1`} className="hover:bg-gray-50 transition-colors border-b-0">
                    <td rowSpan={2} className="px-4 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 hover:z-[60] border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-gray-50 align-top break-words">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                            <div className="flex items-center flex-wrap">
                                <span className="mr-2">{metric.name}</span>
                                <div className="group relative inline-block">
                                    <Info className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500 cursor-help" />
                                    <div className="absolute left-full top-0 ml-2 w-64 p-3 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-normal break-words">
                                        <p className="font-semibold mb-1">Definition:</p>
                                        <p className="mb-2">{metric.definition || 'N/A'}</p>
                                        
                                        <p className="font-semibold mb-1">Owner:</p>
                                        <p className="mb-2">{metric.owner || 'N/A'}</p>
                                        
                                        <p className="font-semibold mb-1">Attribute:</p>
                                        <p>{metric.attribute || 'N/A'}</p>
                                    </div>
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
                     const match = rawTarget.match(/^[{\[]?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*[}\]]?$/);
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
                          activeDot={{ r: 5 }}
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
                          activeDot={{ r: 5 }}
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

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />
      
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
    </div>
  );
};

export default MetricBowler;
