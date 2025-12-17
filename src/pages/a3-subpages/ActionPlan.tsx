import { useState, useEffect, useMemo } from 'react';
import { Plus, ZoomIn, ZoomOut } from 'lucide-react';
import clsx from 'clsx';
import { addDays, formatDate, isWeekend } from '../../utils/dateUtils';
import ActionModal, { ActionTask } from '../../components/ActionModal';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const BASE_CELL_WIDTH = 40;

const getDefaultTasks = (): ActionTask[] => [];

const ActionPlan = () => {
  const { id } = useParams();
  const { a3Cases, updateA3Case } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);

  console.log('Rendering ActionPlan', { id, currentCase });

  // --- State ---
  const [tasks, setTasks] = useState<ActionTask[]>(getDefaultTasks());

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: formatDate(new Date()),
    end: formatDate(addDays(new Date(), 180)) // ~6 months
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ActionTask | null>(null);
  const [newStartDate, setNewStartDate] = useState<string | undefined>(undefined);
  
  // View Options
  const [zoomLevel, setZoomLevel] = useState(1);
  const [timeScale, setTimeScale] = useState<'day' | 'week' | 'month'>('week');
  
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
  }, [currentCase?.id]);

  const persistTasks = (updatedTasks: ActionTask[]) => {
    if (!currentCase) return;
    updateA3Case({ ...currentCase, actionPlanTasks: updatedTasks });
  };

  // --- Computed ---
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

  // --- Drag Logic ---

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
    <div className="flex flex-col h-full bg-white shadow border border-gray-200 overflow-hidden">
      {/* Header Controls */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white z-20 relative">
        <div className="flex items-center space-x-4">
            {/* View Presets */}
            <div className="flex bg-gray-100 rounded-md p-1">
                <button
                    onClick={() => handleSetViewMode('month')}
                    className="px-3 py-1 text-xs font-medium rounded text-gray-500 hover:text-gray-700 hover:bg-white transition-all"
                >
                    Month
                </button>
                <button
                    onClick={() => handleSetViewMode('week')}
                    className="px-3 py-1 text-xs font-medium rounded text-gray-500 hover:text-gray-700 hover:bg-white transition-all"
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

        </div>
      </div>

      {/* Gantt Chart Container */}
      <div className="flex-1 overflow-auto relative select-none">
        <div className="flex min-w-max">
            <div className="sticky left-0 z-20 bg-white border-r border-gray-200 shadow-sm w-64 flex-shrink-0">
                <div className="h-[60px] border-b border-gray-200 bg-gray-50 flex items-center justify-between px-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                    <span>Task Details</span>
                    <button
                      onClick={handleAddTask}
                      className="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                      title="Add Task"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                </div>
                {tasks.map((task) => (
                    <div 
                        key={task.id} 
                        className="h-[48px] border-b border-gray-100 flex items-center px-4 hover:bg-gray-50 group cursor-pointer"
                        onDoubleClick={(e) => handleTaskDoubleClick(e, task)}
                    >
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{task.name || 'Untitled Task'}</div>
                            <div className="text-xs text-gray-500 truncate">{task.owner}</div>
                        </div>
                        <div className={clsx(
                            "w-2 h-2 rounded-full flex-shrink-0 ml-2",
                            task.status === 'Completed' ? "bg-green-500" :
                            task.status === 'In Progress' ? "bg-blue-500" : "bg-gray-300"
                        )} />
                    </div>
                ))}
                 {/* Empty rows filler */}
                 {Array.from({ length: Math.max(0, 10 - tasks.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-[48px] border-b border-gray-50 bg-gray-50/10"></div>
                 ))}
            </div>

            {/* Right: Timeline Grid */}
            <div className="relative">
                {/* Header: Dates */}
                <div className="flex h-[60px] border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
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
                    {tasks.map((task) => {
                         const metrics = getTaskVisualMetrics(task);
                         if (!metrics) return null;
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
