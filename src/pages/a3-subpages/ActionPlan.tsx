import { useState, useEffect, useMemo } from 'react';
import { Plus, ZoomIn, ZoomOut, ChevronDown, ChevronRight, GripVertical, Sparkles, Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import clsx from 'clsx';
import { addDays, formatDate, isWeekend } from '../../utils/dateUtils';
import { generateShortId } from '../../utils/idUtils';
import ActionModal, { ActionTask } from '../../components/ActionModal';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const BASE_CELL_WIDTH = 40;

const getDefaultTasks = (): ActionTask[] => [];

const ActionPlan = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case, selectedModel } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);

  // --- State ---
  const [tasks, setTasks] = useState<ActionTask[]>(getDefaultTasks());

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: formatDate(new Date()),
    end: formatDate(addDays(new Date(), 180)) // ~6 months
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ActionTask | null>(null);
  const [newStartDate, setNewStartDate] = useState<string | undefined>(undefined);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // View Options
  const [zoomLevel, setZoomLevel] = useState(1);
  const [timeScale, setTimeScale] = useState<'day' | 'week' | 'month'>('week');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [sidebarDragStartX, setSidebarDragStartX] = useState(0);
  const [sidebarStartWidth, setSidebarStartWidth] = useState(256);
  
  // Dragging State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<'move' | 'resize-left' | 'resize-right' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTask, setDragStartTask] = useState<ActionTask | null>(null);

  useEffect(() => {
    if (!currentCase) return;
    if (currentCase.actionPlanTasks && currentCase.actionPlanTasks.length > 0) {
      setTasks(currentCase.actionPlanTasks as ActionTask[]);
    } else {
      setTasks(getDefaultTasks());
    }
  }, [currentCase]);

  useEffect(() => {
    if (!tasks.length) return;

    let minStart: Date | null = null;
    let maxEnd: Date | null = null;

    tasks.forEach(task => {
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      if (!isNaN(start.getTime())) {
        if (!minStart || start < minStart) minStart = start;
      }
      if (!isNaN(end.getTime())) {
        if (!maxEnd || end > maxEnd) maxEnd = end;
      }
    });

    if (!minStart || !maxEnd) return;

    setDateRange(prev => {
      const prevStart = new Date(prev.start);
      const prevEnd = new Date(prev.end);

      let nextStart = prev.start;
      let nextEnd = prev.end;

      if (isNaN(prevStart.getTime()) || minStart! < prevStart) {
        nextStart = formatDate(minStart!);
      }
      if (isNaN(prevEnd.getTime()) || maxEnd! > prevEnd) {
        nextEnd = formatDate(maxEnd!);
      }

      if (nextStart === prev.start && nextEnd === prev.end) {
        return prev;
      }

      return { start: nextStart, end: nextEnd };
    });
  }, [tasks]);

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleSidebarMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - sidebarDragStartX;
      let nextWidth = sidebarStartWidth + delta;
      if (nextWidth < 200) nextWidth = 200;
      if (nextWidth > 480) nextWidth = 480;
      setSidebarWidth(nextWidth);
    };

    const handleSidebarMouseUp = () => {
      setIsResizingSidebar(false);
    };

    window.addEventListener('mousemove', handleSidebarMouseMove);
    window.addEventListener('mouseup', handleSidebarMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleSidebarMouseMove);
      window.removeEventListener('mouseup', handleSidebarMouseUp);
    };
  }, [isResizingSidebar, sidebarDragStartX, sidebarStartWidth]);

  const persistTasks = (updatedTasks: ActionTask[]) => {
    if (!currentCase) return;
    updateA3Case({ ...currentCase, actionPlanTasks: updatedTasks });
  };

  // --- Computed ---
  
  const groupedTasks = useMemo(() => {
    const groups: Record<string, ActionTask[]> = {};
    const ungrouped: ActionTask[] = [];

    tasks.forEach(task => {
      if (task.group) {
        if (!groups[task.group]) groups[task.group] = [];
        groups[task.group].push(task);
      } else {
        ungrouped.push(task);
      }
    });

    const groupKeys = Object.keys(groups);

    const rows: Array<{ type: 'group'; name: string; id: string } | { type: 'task'; task: ActionTask; id: string }> = [];

    ungrouped.forEach(task => rows.push({ type: 'task', task, id: task.id }));

    groupKeys.forEach(groupName => {
      rows.push({ type: 'group', name: groupName, id: `group-${groupName}` });
      if (expandedGroups[groupName] !== false) {
        groups[groupName].forEach(task => rows.push({ type: 'task', task, id: task.id }));
      }
    });

    return rows;
  }, [tasks, expandedGroups]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const cellWidth = (timeScale === 'month' ? 100 : (timeScale === 'week' ? 60 : BASE_CELL_WIDTH)) * zoomLevel;

  const gridColumns = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    
    // Ensure valid range
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return [];
    }

    const cols = [];
    let current = new Date(start);

    if (timeScale === 'day') {
        while (current <= end) {
            if (!isWeekend(current)) {
                cols.push({
                    date: new Date(current),
                    label: current.getDate().toString(),
                    fullLabel: formatDate(current),
                    id: formatDate(current)
                });
            }
            current = addDays(current, 1);
        }
    } else if (timeScale === 'week') {
        // Align first column to the start of the week of 'start' date?
        // Or just iterate weeks from start.
        // Let's iterate weeks. 
        // We need to handle "No Weekends" conceptually? 
        // In week mode, a column is a week. We don't hide weekends, we just show the week block.
        
        // Find Monday of the starting week
        // current.setDate(current.getDate() - current.getDay() + 1); // Monday
        // Actually, let's just start from 'start' date and jump 7 days?
        // Standard Gantt: Columns are weeks starting Monday/Sunday.
        // Let's align to Monday for consistency.
        
        // Let's just list weeks that overlap with the range.
        // But for simplicity, let's just step by 7 days from start, OR align to calendar weeks.
        // Aligning to calendar weeks is better.
        
        let iter = new Date(current);
        // Align to previous Monday
        const d = iter.getDay();
        const dist = d === 0 ? 6 : d - 1;
        iter.setDate(iter.getDate() - dist);

        while (iter <= end) {
            // Only add if the week overlaps with range (it definitely does if we start at/before start)
            // Actually, we want columns that cover the range.
            
            // Format label: "Oct 2"
            const label = `${iter.toLocaleString('default', { month: 'short' })} ${iter.getDate()}`;
            
            cols.push({
                date: new Date(iter),
                label: label,
                fullLabel: `Week of ${formatDate(iter)}`,
                id: formatDate(iter) // identify by start of week
            });
            
            iter = addDays(iter, 7);
        }
    } else if (timeScale === 'month') {
        // Align to 1st of month
        let iter = new Date(current);
        iter.setDate(1);

        while (iter <= end) {
            cols.push({
                date: new Date(iter),
                label: iter.toLocaleString('default', { month: 'short' }),
                fullLabel: `${iter.toLocaleString('default', { month: 'long' })} ${iter.getFullYear()}`,
                id: `${iter.getFullYear()}-${iter.getMonth()}`
            });
            
            // Next month
            iter = new Date(iter.getFullYear(), iter.getMonth() + 1, 1);
        }
    }
    
    return cols;

  }, [dateRange, timeScale]);

  // Helper to find visual start/end for a task
  const getTaskVisualMetrics = (task: ActionTask) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
    // We need to find where taskStart and taskEnd fall within the gridColumns.
    
    let startIndex = -1;
    let endIndex = -1;

    if (timeScale === 'day') {
        // Exact match or closest for days
        // Logic similar to before, but using gridColumns[i].date
        // We can optimize by string matching id if we want
        startIndex = gridColumns.findIndex(c => c.id === task.startDate);
        endIndex = gridColumns.findIndex(c => c.id === task.endDate);

        // Fallback for hidden days (weekends) or out of bounds
        // ... (Similar clamping logic needed) ...
    } else if (timeScale === 'week') {
        // Find week column that contains taskStart
        startIndex = gridColumns.findIndex((c) => {
            // If taskStart is within this week
            // This week starts at c.date
            // Ends at nextCol.date (exclusive) or c.date + 7
            const weekStart = c.date;
            const weekEnd = addDays(weekStart, 6);
            return taskStart >= weekStart && taskStart <= weekEnd;
        });

        // Find week column that contains taskEnd
        endIndex = gridColumns.findIndex((c) => {
            const weekStart = c.date;
            const weekEnd = addDays(weekStart, 6);
            return taskEnd >= weekStart && taskEnd <= weekEnd;
        });
    } else if (timeScale === 'month') {
        // Find month column
        startIndex = gridColumns.findIndex(c => 
            c.date.getMonth() === taskStart.getMonth() && c.date.getFullYear() === taskStart.getFullYear()
        );
        endIndex = gridColumns.findIndex(c => 
            c.date.getMonth() === taskEnd.getMonth() && c.date.getFullYear() === taskEnd.getFullYear()
        );
    }

    // --- Common Clamping Logic ---
    const viewStartCol = gridColumns[0];
    const viewEndCol = gridColumns[gridColumns.length - 1];

    if (!viewStartCol || !viewEndCol) return null;

    // Convert columns to time boundaries for bounds checking
    // Note: For day view, column date is the day.
    // For week view, column date is Monday.
    // For month view, column date is 1st.
    
    // We need precise bounds check.
    // If task is completely before first column or after last column
    const gridStartTime = viewStartCol.date.getTime();
    
    // Calculate grid end time
    let gridEndTime = viewEndCol.date.getTime();
    if (timeScale === 'week') gridEndTime = addDays(viewEndCol.date, 6).getTime();
    if (timeScale === 'month') gridEndTime = new Date(viewEndCol.date.getFullYear(), viewEndCol.date.getMonth() + 1, 0).getTime();
    
    if (taskEnd.getTime() < gridStartTime || taskStart.getTime() > gridEndTime) return null;

    // Clamp Indices
    if (startIndex === -1) {
        if (taskStart.getTime() < gridStartTime) startIndex = 0;
        else {
             // Started inside view but maybe in a gap? (unlikely for week/month, possible for day/weekend)
             // Find first column > taskStart
             startIndex = gridColumns.findIndex(c => c.date >= taskStart);
             if (startIndex === -1) startIndex = 0; // Should not happen if bounds check passed
        }
    }
    
    if (endIndex === -1) {
        if (taskEnd.getTime() > gridEndTime) endIndex = gridColumns.length - 1;
        else {
            // Find last column <= taskEnd
            // Iterate backwards
             for (let i = gridColumns.length - 1; i >= 0; i--) {
                 if (gridColumns[i].date <= taskEnd) {
                     endIndex = i;
                     break;
                 }
             }
        }
    }

    if (startIndex === -1 || endIndex === -1) return null;
    if (startIndex > endIndex) {
        // Can happen if start > end (invalid task) or clamping weirdness
        return null; 
    }

    const left = startIndex * cellWidth;
    // Width: (endIndex - startIndex + 1) columns
    // BUT: In week/month view, if task starts mid-week, should we offset 'left'?
    // For simple grid, we snap to columns.
    // For better visuals, we'd calculate percent offset.
    // Let's stick to SNAP TO GRID for now for simplicity, as requested "change timeline display".
    const width = (endIndex - startIndex + 1) * cellWidth;

    return { left, width };
  };

  // --- Handlers ---

  const handleAddTask = () => {
    setEditingTask(null);
    setNewStartDate(undefined);
    setIsModalOpen(true);
  };

  const handleGridClick = (dateStr: string) => {
      setEditingTask(null);
      setNewStartDate(dateStr);
      setIsModalOpen(true);
  };

  const handleTaskDoubleClick = (e: React.MouseEvent, task: ActionTask) => {
    e.stopPropagation();
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (task: ActionTask) => {
    let updated: ActionTask[];
    if (editingTask) {
      updated = tasks.map(t => t.id === task.id ? task : t);
    } else {
      updated = [...tasks, task];
    }
    setTasks(updated);
    persistTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    persistTasks(updated);
  };

  const handleSetViewMode = (mode: 'week' | 'month') => {
      setTimeScale(mode);
  };

  const handleGenerateAIPlan = async () => {
    if (!currentCase) return;

    const problem = currentCase.problemStatement || '';
    const observations = currentCase.dataAnalysisObservations || '';
    const root = currentCase.rootCause || '';

    if (!problem.trim() || !observations.trim() || !root.trim()) {
      setAiError('To generate an action plan, fill in Problem Statement, Key Observations from Data, and Identified Root Cause.');
      return;
    }

    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const today = formatDate(new Date());
      const messages = [
        {
          role: 'system',
          content: `You are an expert A3 Problem Solving coach.

You will receive:
- A3 Problem Statement
- Key observations from data analysis
- Identified root cause

Your task is to propose a practical, time-phased action plan that addresses the root cause and improves the problem.

Always respond in English, even if the user's inputs are in another language.

Use ${today} as today's date when planning the timeline.

Return JSON ONLY with this structure:
{
  "tasks": [
    {
      "name": "short action title",
      "description": "detailed what/how so a team can execute",
      "owner": "role or function (e.g. Production Supervisor)",
      "group": "theme or workstream name",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "status": "Not Started" | "In Progress" | "Completed",
      "progress": number
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Problem Statement:
${problem}

Key Observations from Data:
${observations}

Identified Root Cause:
${root}`
        }
      ];

      const response = await fetch('https://multi-model-worker.study-llm.me/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate action plan');
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || '';
      content = content.replace(/```json/gi, '').replace(/```/g, '').trim();

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new Error('Invalid AI response format');
      }

      const rawTasks = Array.isArray(parsed?.tasks) ? parsed.tasks : Array.isArray(parsed) ? parsed : [];

      if (!Array.isArray(rawTasks) || rawTasks.length === 0) {
        throw new Error('AI did not return any tasks');
      }

      const newTasks: ActionTask[] = rawTasks.map((t: any, index: number) => {
        const name = typeof t.name === 'string' && t.name.trim() ? t.name.trim() : `Action ${index + 1}`;
        const description = typeof t.description === 'string' ? t.description.trim() : '';
        const owner = typeof t.owner === 'string' ? t.owner.trim() : currentCase.owner || '';
        const group = typeof t.group === 'string' && t.group.trim() ? t.group.trim() : undefined;

        const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

        let startDateStr: string;
        if (typeof t.startDate === 'string' && isoDateRegex.test(t.startDate.trim())) {
          startDateStr = t.startDate.trim();
        } else {
          const d = addDays(new Date(), index * 7);
          startDateStr = formatDate(d);
        }

        let endDateStr: string;
        if (typeof t.endDate === 'string' && isoDateRegex.test(t.endDate.trim())) {
          endDateStr = t.endDate.trim();
        } else {
          const d = addDays(new Date(startDateStr), 7);
          endDateStr = formatDate(d);
        }

        let status: ActionTask['status'] = 'Not Started';
        if (t.status === 'In Progress' || t.status === 'Completed') {
          status = t.status;
        }

        let progress = 0;
        if (typeof t.progress === 'number' && t.progress >= 0 && t.progress <= 100) {
          progress = Math.round(t.progress);
        } else if (status === 'Completed') {
          progress = 100;
        }

        return {
          id: generateShortId(),
          name,
          description,
          owner,
          group,
          startDate: startDateStr,
          endDate: endDateStr,
          status,
          progress,
        };
      });

      const mergedTasks = [...tasks, ...newTasks];
      setTasks(mergedTasks);
      persistTasks(mergedTasks);
    } catch (error: any) {
      setAiError(error?.message || 'Failed to generate action plan. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // --- Drag Logic ---

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const buckets: Record<string, ActionTask[]> = { ungrouped: [] };
    const ungrouped = tasks.filter(t => !t.group);
    buckets.ungrouped = [...ungrouped];

    const grouped = tasks.filter(t => !!t.group).reduce((acc, task) => {
      const group = task.group!;
      if (!acc[group]) acc[group] = [];
      acc[group].push(task);
      return acc;
    }, {} as Record<string, ActionTask[]>);
    Object.assign(buckets, grouped);
    
    const sourceKey = source.droppableId === 'ungrouped' ? 'ungrouped' : source.droppableId.replace('group-', '');
    const destKey = destination.droppableId === 'ungrouped' ? 'ungrouped' : destination.droppableId.replace('group-', '');
    
    const sourceList = buckets[sourceKey];
    const destList = buckets[destKey];
    if (!sourceList || !destList) return;
    
    const [movedItem] = sourceList.splice(source.index, 1);
    
    if (sourceKey !== destKey) {
        if (destKey === 'ungrouped') {
            movedItem.group = undefined;
        } else {
            movedItem.group = destKey;
        }
    }
    
    destList.splice(destination.index, 0, movedItem);
    
    const groupKeys = Object.keys(buckets).filter(k => k !== 'ungrouped');
    let newTasks = [...buckets['ungrouped']];
    groupKeys.forEach(key => {
      newTasks = [...newTasks, ...buckets[key]];
    });
    
    setTasks(newTasks);
    persistTasks(newTasks);
  };

  const handleMouseDown = (e: React.MouseEvent, task: ActionTask, type: 'move' | 'resize-left' | 'resize-right') => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(task.id);
    setDragType(type);
    setDragStartX(e.clientX);
    setDragStartTask({ ...task });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingId || !dragType || !dragStartTask) return;

      const deltaX = e.clientX - dragStartX;
      const deltaCells = Math.round(deltaX / cellWidth);

      if (deltaCells === 0) return;

      const newTasks = tasks.map(t => {
        if (t.id !== draggingId) return t;

        // We need to calculate based on VISIBLE indices (gridColumns)
        // Find start/end index in gridColumns
        let startIdx = -1;
        let endIdx = -1;

        if (timeScale === 'day') {
             startIdx = gridColumns.findIndex(c => c.id === dragStartTask.startDate);
             endIdx = gridColumns.findIndex(c => c.id === dragStartTask.endDate);
        } else if (timeScale === 'week') {
            // Find week containing start/end
            const taskStart = new Date(dragStartTask.startDate);
            const taskEnd = new Date(dragStartTask.endDate);
            
            startIdx = gridColumns.findIndex((c) => {
                 const weekStart = c.date;
                 const weekEnd = addDays(weekStart, 6);
                 return taskStart >= weekStart && taskStart <= weekEnd;
            });
            endIdx = gridColumns.findIndex((c) => {
                 const weekStart = c.date;
                 const weekEnd = addDays(weekStart, 6);
                 return taskEnd >= weekStart && taskEnd <= weekEnd;
            });
        } else if (timeScale === 'month') {
             const taskStart = new Date(dragStartTask.startDate);
             const taskEnd = new Date(dragStartTask.endDate);
             
             startIdx = gridColumns.findIndex(c => 
                 c.date.getMonth() === taskStart.getMonth() && c.date.getFullYear() === taskStart.getFullYear()
             );
             endIdx = gridColumns.findIndex(c => 
                 c.date.getMonth() === taskEnd.getMonth() && c.date.getFullYear() === taskEnd.getFullYear()
             );
        }
        
        // If original task was off-grid (hidden), dragging is weird. Abort.
        if (startIdx === -1 || endIdx === -1) return t; 

        let newStartIdx = startIdx;
        let newEndIdx = endIdx;

        if (dragType === 'move') {
          newStartIdx = startIdx + deltaCells;
          newEndIdx = endIdx + deltaCells;
        } else if (dragType === 'resize-left') {
          newStartIdx = startIdx + deltaCells;
          if (newStartIdx > newEndIdx) newStartIdx = newEndIdx;
        } else if (dragType === 'resize-right') {
          newEndIdx = endIdx + deltaCells;
          if (newEndIdx < newStartIdx) newEndIdx = newStartIdx;
        }

        // Bound checks
        if (newStartIdx < 0) newStartIdx = 0;
        if (newEndIdx >= gridColumns.length) newEndIdx = gridColumns.length - 1;
        
        // Convert back to Date Strings
        // For day: easy.
        // For week/month: We snap to the start/end of that column?
        // Or we maintain the relative offset?
        // Simplicity: Snap to column boundaries.
        // Start date = Start of Column
        // End date = End of Column? Or Start of Column?
        // Usually tasks are inclusive.
        
        let newStartDate = '';
        let newEndDate = '';
        
        const startCol = gridColumns[newStartIdx];
        const endCol = gridColumns[newEndIdx];
        
        if (!startCol || !endCol) return t; // Should not happen due to bounds check

        if (timeScale === 'day') {
            newStartDate = startCol.id;
            newEndDate = endCol.id;
        } else if (timeScale === 'week') {
            // Snap to week start/end?
            // If I drag a 2 day task to a week, does it become 1 week long?
            // Yes, if grid is weeks, granularity is weeks.
            newStartDate = formatDate(startCol.date);
            // End date should be end of that week?
            newEndDate = formatDate(addDays(endCol.date, 6));
        } else if (timeScale === 'month') {
            newStartDate = formatDate(startCol.date); // 1st of month
            // End date = end of month
            const e = new Date(endCol.date.getFullYear(), endCol.date.getMonth() + 1, 0);
            newEndDate = formatDate(e);
        }

        return {
          ...t,
          startDate: newStartDate,
          endDate: newEndDate
        };
      });

      setTasks(newTasks);
      persistTasks(newTasks);
    };

    const handleMouseUp = () => {
      if (draggingId) {
        setDraggingId(null);
        setDragType(null);
        setDragStartTask(null);
      }
    };

    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, dragType, dragStartX, dragStartTask, tasks, gridColumns, cellWidth, timeScale]);


  return (
    <div className="flex flex-col h-full bg-white shadow border border-gray-200 overflow-auto">
      {/* Header Controls */}
      <div className="flex justify-start gap-4 items-center p-4 border-b border-gray-200 bg-white z-20 sticky left-0">
        <div className="flex items-center space-x-4">
            {/* View Presets */}
            <div className="flex bg-gray-100 rounded-md p-1">
                <button
                    onClick={() => handleSetViewMode('month')}
                    className={clsx(
                        "px-3 py-1 text-xs font-medium rounded transition-all",
                        timeScale === 'month' 
                            ? "bg-white text-gray-900 shadow-sm" 
                            : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                    )}
                >
                    Month
                </button>
                <button
                    onClick={() => handleSetViewMode('week')}
                    className={clsx(
                        "px-3 py-1 text-xs font-medium rounded transition-all",
                        timeScale === 'week' 
                            ? "bg-white text-gray-900 shadow-sm" 
                            : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                    )}
                >
                    Week
                </button>
            </div>

            {/* Date Range Picker with Navigation */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-md p-1">
                <div className="flex items-center space-x-2 px-2">
                    <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="text-xs bg-transparent border-none focus:ring-0 p-0 w-24 text-center font-medium text-gray-700 cursor-pointer"
                    />
                    <span className="text-gray-400">-</span>
                    <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="text-xs bg-transparent border-none focus:ring-0 p-0 w-24 text-center font-medium text-gray-700 cursor-pointer"
                    />
                </div>
            </div>
        </div>

        <div className="flex items-center space-x-3">
             <div className="flex items-center bg-gray-100 rounded-md p-1">
                <button onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))} className="p-1 hover:bg-white rounded shadow-sm">
                    <ZoomOut className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-xs text-gray-500 w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))} className="p-1 hover:bg-white rounded shadow-sm">
                    <ZoomIn className="w-4 h-4 text-gray-600" />
                </button>
             </div>

             <button
               type="button"
               onClick={handleGenerateAIPlan}
               disabled={
                 isGeneratingAI ||
                 !currentCase ||
                 !currentCase.problemStatement ||
                 !currentCase.dataAnalysisObservations ||
                 !currentCase.rootCause
               }
               className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isGeneratingAI ? (
                 <>
                   <Loader2 className="animate-spin -ml-0.5 mr-2 h-3 w-3" />
                   <span className="hidden sm:inline">AI planning...</span>
                 </>
               ) : (
                 <>
                   <Sparkles className="-ml-0.5 mr-0 sm:mr-2 h-3 w-3" />
                   <span className="hidden sm:inline">AI Action Plan</span>
                 </>
               )}
             </button>

        </div>
      </div>

      {aiError && (
        <div className="px-4 pt-2 text-xs text-red-600">
          {aiError}
        </div>
      )}

      {/* Gantt Chart Container */}
      <div className="flex-1 relative select-none">
        <div className="flex min-w-max">
            <div
              className="sticky left-0 z-40 bg-white border-r border-gray-200 shadow-sm flex-shrink-0 relative"
              style={{ width: sidebarWidth }}
            >
                <div className="h-[60px] border-b border-gray-200 bg-gray-50 flex items-center justify-between px-4 font-semibold text-xs text-gray-500 uppercase tracking-wider sticky top-0 z-30">
                    <span>Task Details</span>
                    <button
                      onClick={handleAddTask}
                      className="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                      title="Add Task"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                </div>
                <div
                  className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-gray-200"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizingSidebar(true);
                    setSidebarDragStartX(e.clientX);
                    setSidebarStartWidth(sidebarWidth);
                  }}
                />
                <DragDropContext onDragEnd={onDragEnd}>
                  {(() => {
                    const buckets: Record<string, ActionTask[]> = { ungrouped: [] };
                    const ungrouped = tasks.filter(t => !t.group);
                    buckets.ungrouped = [...ungrouped];
                    const grouped = tasks.filter(t => !!t.group).reduce((acc, task) => {
                      const group = task.group!;
                      if (!acc[group]) acc[group] = [];
                      acc[group].push(task);
                      return acc;
                    }, {} as Record<string, ActionTask[]>);
                    const groupKeys = Object.keys(grouped);

                    return (
                      <>
                        <Droppable droppableId="ungrouped">
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}>
                              {buckets.ungrouped.map((task, index) => (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className="h-[48px] border-b border-gray-100 flex items-center px-4 hover:bg-gray-50 group cursor-pointer bg-white"
                                      onDoubleClick={(e) => handleTaskDoubleClick(e, task)}
                                      title={task.description}
                                    >
                                        <div 
                                          {...provided.dragHandleProps}
                                          className="mr-2 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600"
                                        >
                                          <GripVertical className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="text-sm font-medium text-gray-900 truncate">
                                                {task.name || 'Untitled Task'}
                                              </div>
                                              <div className="flex items-center gap-1 flex-shrink-0">
                                                <span className="text-[11px] text-gray-500">
                                                  {Math.round(task.progress)}%
                                                </span>
                                                <div
                                                  className={clsx(
                                                    "w-2 h-2 rounded-full flex-shrink-0",
                                                    task.status === 'Completed'
                                                      ? "bg-green-500"
                                                      : task.status === 'In Progress'
                                                      ? "bg-blue-500"
                                                      : "bg-gray-300"
                                                  )}
                                                />
                                              </div>
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">{task.owner}</div>
                                        </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        {groupKeys.map(group => (
                            <div key={group}>
                                <div 
                                    className="h-[32px] border-b border-gray-100 flex items-center px-4 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                                    onClick={() => toggleGroup(group)}
                                >
                                    {expandedGroups[group] !== false ? <ChevronDown className="w-3 h-3 mr-2 text-gray-600" /> : <ChevronRight className="w-3 h-3 mr-2 text-gray-600" />}
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{group}</span>
                                </div>
                                
                                {expandedGroups[group] !== false && (
                                    <Droppable droppableId={`group-${group}`}>
                                      {(provided) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps}>
                                            {grouped[group].map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                                  {(provided) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      className="h-[48px] border-b border-gray-100 flex items-center px-4 hover:bg-gray-50 group cursor-pointer bg-white"
                                                      onDoubleClick={(e) => handleTaskDoubleClick(e, task)}
                                                      title={task.description}
                                                    >
                                                        <div 
                                                          {...provided.dragHandleProps}
                                                          className="mr-2 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600"
                                                        >
                                                          <GripVertical className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2">
                                                              <div className="text-sm font-medium text-gray-900 truncate">
                                                                {task.name || 'Untitled Task'}
                                                              </div>
                                                              <div className="flex items-center gap-1 flex-shrink-0">
                                                                <span className="text-[11px] text-gray-500">
                                                                  {Math.round(task.progress)}%
                                                                </span>
                                                                <div
                                                                  className={clsx(
                                                                    "w-2 h-2 rounded-full flex-shrink-0",
                                                                    task.status === 'Completed'
                                                                      ? "bg-green-500"
                                                                      : task.status === 'In Progress'
                                                                      ? "bg-blue-500"
                                                                      : "bg-gray-300"
                                                                  )}
                                                                />
                                                              </div>
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate">{task.owner}</div>
                                                        </div>
                                                    </div>
                                                  )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                )}
                            </div>
                        ))}
                      </>
                    );
                  })()}
                </DragDropContext>
                 {/* Empty rows filler */}
                 {Array.from({ length: Math.max(0, 10 - tasks.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-[48px] border-b border-gray-50 bg-gray-50/10"></div>
                 ))}
            </div>

            {/* Right: Timeline Grid */}
            <div className="relative">
                {/* Header: Dates */}
                <div className="flex h-[60px] border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
                    {gridColumns.map((col, i) => {
                        const isToday = timeScale === 'day' ? formatDate(col.date) === formatDate(new Date()) : false;
                        
                        return (
                            <div 
                                key={i} 
                                className={clsx(
                                    "flex-shrink-0 border-r border-gray-200 flex flex-col items-center justify-center overflow-hidden px-0.5",
                                    isToday ? "bg-blue-50" : ""
                                )}
                                style={{ width: cellWidth }}
                                title={col.fullLabel}
                            >
                                <span className={clsx(
                                    "font-semibold text-gray-700 whitespace-nowrap",
                                    cellWidth < 45 ? "text-[10px]" : "text-xs"
                                )}>
                                    {cellWidth < 40 && timeScale === 'week' 
                                        ? `${col.date.getMonth() + 1}/${col.date.getDate()}` 
                                        : col.label}
                                </span>
                                {timeScale === 'day' && cellWidth >= 30 && (
                                    <span className="text-gray-400 text-[10px]">{col.date.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Grid Body */}
                <div className="relative">
                    {/* Vertical Lines Background */}
                    <div className="absolute inset-0 flex pointer-events-none">
                        {gridColumns.map((_, i) => (
                            <div key={i} className={clsx(
                                "flex-shrink-0 border-r border-gray-100 h-full",
                                // Highlight weekends in day view only if we were showing them, but we aren't.
                            )} style={{ width: cellWidth }}></div>
                        ))}
                    </div>

                    {/* Task Rows & Bars */}
                    {groupedTasks.map((row) => {
                         if (row.type === 'group') {
                             return (
                                 <div key={row.id} className="h-[32px] border-b border-gray-100 bg-gray-50/50"></div>
                             );
                         }

                         const task = row.task;
                         const metrics = getTaskVisualMetrics(task);
                         
                         // Render empty row if not visible to maintain alignment
                         if (!metrics) {
                             return (
                                <div key={task.id} className="h-[48px] border-b border-gray-100 relative group">
                                     {/* Clickable background for adding task */}
                                    <div 
                                        className="absolute inset-0 z-0" 
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const clickX = e.clientX - rect.left;
                                            const colIndex = Math.floor(clickX / cellWidth);
                                            if (colIndex >= 0 && colIndex < gridColumns.length) {
                                                handleGridClick(formatDate(gridColumns[colIndex].date));
                                            }
                                        }}
                                    />
                                </div>
                             );
                         }

                         const { left, width } = metrics;
                         
                         return (
                            <div key={task.id} className="h-[48px] border-b border-gray-100 relative group">
                                {/* Clickable row background for "Add" */}
                                <div 
                                    className="absolute inset-0 z-0" 
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const clickX = e.clientX - rect.left;
                                        const colIndex = Math.floor(clickX / cellWidth);
                                        if (colIndex >= 0 && colIndex < gridColumns.length) {
                                            handleGridClick(formatDate(gridColumns[colIndex].date));
                                        }
                                    }}
                                />

                                {/* The Bar */}
                                <div
                                    className={clsx(
                                        "absolute top-2.5 h-7 rounded-md shadow-sm border border-opacity-20 flex items-center px-2 text-xs text-white overflow-hidden cursor-move z-10 transition-colors",
                                        task.status === 'Completed' ? "bg-green-500 border-green-700" :
                                        task.status === 'In Progress' ? "bg-blue-500 border-blue-700" : "bg-gray-400 border-gray-600",
                                        draggingId === task.id ? "ring-2 ring-offset-1 ring-blue-400 opacity-90" : "hover:brightness-110"
                                    )}
                                    style={{ left: Math.max(0, left), width: Math.max(cellWidth, width) }}
                                    onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                                    onDoubleClick={(e) => handleTaskDoubleClick(e, task)}
                                >
                                    {/* Left Resize Handle */}
                                    <div 
                                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10"
                                        onMouseDown={(e) => handleMouseDown(e, task, 'resize-left')}
                                    ></div>

                                    <span className="truncate drop-shadow-md font-medium pl-1">{task.name}</span>

                                    {/* Right Resize Handle */}
                                    <div 
                                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10"
                                        onMouseDown={(e) => handleMouseDown(e, task, 'resize-right')}
                                    ></div>
                                </div>
                            </div>
                         )
                    })}
                     {/* Empty rows filler for clicking */}
                     {Array.from({ length: Math.max(0, 10 - tasks.length) }).map((_, i) => (
                        <div key={`empty-row-${i}`} className="h-[48px] border-b border-gray-50 bg-gray-50/10 relative">
                             <div 
                                    className="absolute inset-0 z-0" 
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const clickX = e.clientX - rect.left;
                                        const colIndex = Math.floor(clickX / cellWidth);
                                        if (colIndex >= 0 && colIndex < gridColumns.length) {
                                            handleGridClick(formatDate(gridColumns[colIndex].date));
                                        }
                                    }}
                                />
                        </div>
                     ))}
                </div>
            </div>
        </div>
      </div>

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialData={editingTask}
        defaultStartDate={newStartDate}
      />
    </div>
  );
};

export default ActionPlan;
