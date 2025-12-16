import { useState, useEffect, useMemo } from 'react';
import { Plus, ZoomIn, ZoomOut } from 'lucide-react';
import clsx from 'clsx';
import { addDays, formatDate, isWeekend } from '../../utils/dateUtils';
import ActionModal, { ActionTask } from '../../components/ActionModal';

const BASE_CELL_WIDTH = 40;

const ActionPlan = () => {
  // --- State ---
  const [tasks, setTasks] = useState<ActionTask[]>([
    { 
      id: '1', 
      name: 'Define problem scope', 
      owner: 'Alice', 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: addDays(new Date(), 4).toISOString().split('T')[0],
      status: 'In Progress',
      progress: 40
    },
    { 
      id: '2', 
      name: 'Gather initial data', 
      owner: 'Bob', 
      startDate: addDays(new Date(), 2).toISOString().split('T')[0], 
      endDate: addDays(new Date(), 6).toISOString().split('T')[0],
      status: 'Not Started',
      progress: 0
    },
  ]);

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: formatDate(new Date()),
    end: formatDate(addDays(new Date(), 180)) // ~6 months
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ActionTask | null>(null);
  const [newStartDate, setNewStartDate] = useState<string | undefined>(undefined);
  
  // View Options
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Dragging State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<'move' | 'resize-left' | 'resize-right' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTask, setDragStartTask] = useState<ActionTask | null>(null);

  // --- Computed ---
  const cellWidth = BASE_CELL_WIDTH * zoomLevel;

  const visibleDates = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    
    // Ensure valid range
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return [];
    }

    const dates = [];
    let current = start;
    
    while (current <= end) {
        if (!isWeekend(current)) {
            dates.push(new Date(current));
        }
        current = addDays(current, 1);
    }
    
    return dates;

  }, [dateRange]);

  // Helper to find visual start/end for a task
  // If a task starts on a hidden day (e.g. Sat), we map it to the next visible day for start?
  // Or purely by index lookup.
  const getTaskVisualMetrics = (task: ActionTask) => {
    const taskStartStr = task.startDate;
    const taskEndStr = task.endDate;

    // Find exact match
    let startIndex = visibleDates.findIndex(d => formatDate(d) === taskStartStr);
    let endIndex = visibleDates.findIndex(d => formatDate(d) === taskEndStr);

    // Handling hidden dates:
    // If start is hidden, maybe it started before? 
    // For now, let's just accept exact matches. If -1, it might be off screen.
    // However, if the task spans the view but start/end are off-screen/hidden, we need to handle it.
    
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const viewStart = visibleDates[0];
    const viewEnd = visibleDates[visibleDates.length - 1];

    if (!viewStart || !viewEnd) return null;

    // If completely out of view
    if (taskEnd < viewStart || taskStart > viewEnd) return null;

    // Clamp start/end to view range for rendering if exact match not found
    // This handles "started before view" or "starts on hidden weekend"
    
    if (startIndex === -1) {
        // If before view, clamp to 0
        if (taskStart < viewStart) startIndex = 0;
        else {
            // Started inside view but on hidden day? Find next visible day
            // Or just don't render start?
            // Simple approach: Find first visible date >= taskStart
            startIndex = visibleDates.findIndex(d => d >= taskStart);
        }
    }

    if (endIndex === -1) {
        // If after view, clamp to end
        if (taskEnd > viewEnd) endIndex = visibleDates.length - 1;
        else {
             // Ends on hidden day? Find last visible date <= taskEnd
             // We iterate backwards
             for (let i = visibleDates.length - 1; i >= 0; i--) {
                 if (visibleDates[i] <= taskEnd) {
                     endIndex = i;
                     break;
                 }
             }
        }
    }
    
    if (startIndex === -1 || endIndex === -1) return null;
    if (startIndex > endIndex) return null;

    const left = startIndex * cellWidth;
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
    if (editingTask) {
      setTasks(tasks.map(t => t.id === task.id ? task : t));
    } else {
      setTasks([...tasks, task]);
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
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

        // We need to calculate based on VISIBLE indices
        const startIdx = visibleDates.findIndex(d => formatDate(d) === dragStartTask.startDate);
        const endIdx = visibleDates.findIndex(d => formatDate(d) === dragStartTask.endDate);
        
        // If original task was off-grid (hidden), dragging is weird. Abort or snap?
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
        if (newEndIdx >= visibleDates.length) newEndIdx = visibleDates.length - 1;
        
        // If we hit the bounds of the rendered view, we stop.
        // Ideally we'd scroll or load more, but for now clamp.

        return {
          ...t,
          startDate: formatDate(visibleDates[newStartIdx]),
          endDate: formatDate(visibleDates[newEndIdx])
        };
      });

      setTasks(newTasks);
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
  }, [draggingId, dragType, dragStartX, dragStartTask, tasks, visibleDates, cellWidth]);


  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      {/* Header Controls */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white z-20 relative">
        <div className="flex items-center space-x-4">
            {/* Date Range Picker */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-md p-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">View Range:</span>
                <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-gray-400">-</span>
                <input 
                    type="date" 
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>
        </div>

        <div className="flex items-center space-x-3">
             {/* Zoom Controls */}
             <div className="flex items-center bg-gray-100 rounded-md p-1">
                <button onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))} className="p-1 hover:bg-white rounded shadow-sm">
                    <ZoomOut className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-xs text-gray-500 w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))} className="p-1 hover:bg-white rounded shadow-sm">
                    <ZoomIn className="w-4 h-4 text-gray-600" />
                </button>
             </div>

             <div className="h-6 w-px bg-gray-300 mx-2"></div>

             <button
              onClick={handleAddTask}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </button>
        </div>
      </div>

      {/* Gantt Chart Container */}
      <div className="flex-1 overflow-auto relative select-none">
        <div className="flex min-w-max">
            {/* Left Sidebar: Task Names */}
            <div className="sticky left-0 z-20 bg-white border-r border-gray-200 shadow-sm w-64 flex-shrink-0">
                <div className="h-[60px] border-b border-gray-200 bg-gray-50 flex items-center px-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                    Task Details
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
                    {visibleDates.map((date, i) => {
                        const isToday = formatDate(date) === formatDate(new Date());
                        const isWeekendDay = isWeekend(date);
                        return (
                            <div 
                                key={i} 
                                className={clsx(
                                    "flex-shrink-0 border-r border-gray-200 flex flex-col items-center justify-center text-xs",
                                    isToday ? "bg-blue-50" : isWeekendDay ? "bg-gray-100" : ""
                                )}
                                style={{ width: cellWidth }}
                            >
                                <span className="font-semibold text-gray-700">{date.getDate()}</span>
                                <span className="text-gray-400 text-[10px]">{date.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                            </div>
                        )
                    })}
                </div>

                {/* Grid Body */}
                <div className="relative">
                    {/* Vertical Lines Background */}
                    <div className="absolute inset-0 flex pointer-events-none">
                        {visibleDates.map((date, i) => (
                            <div key={i} className={clsx(
                                "flex-shrink-0 border-r border-gray-100 h-full",
                                isWeekend(date) ? "bg-gray-50/50" : ""
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
                                        if (colIndex >= 0 && colIndex < visibleDates.length) {
                                            handleGridClick(formatDate(visibleDates[colIndex]));
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
                                        if (colIndex >= 0 && colIndex < visibleDates.length) {
                                            handleGridClick(formatDate(visibleDates[colIndex]));
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
