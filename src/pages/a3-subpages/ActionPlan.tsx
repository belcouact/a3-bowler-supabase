import { useState, useRef, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { getDaysInMonth, addDays, diffDays, formatDate, getMonthName } from '../../utils/dateUtils';
import ActionModal, { ActionTask } from '../../components/ActionModal';

// Constants for Gantt Chart
const CELL_WIDTH = 40; // px per day
const HEADER_HEIGHT = 60;
const ROW_HEIGHT = 48;

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

  const [viewDate, setViewDate] = useState(new Date()); // Start of the view
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ActionTask | null>(null);
  const [newStartDate, setNewStartDate] = useState<string | undefined>(undefined);
  
  // Dragging State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<'move' | 'resize-left' | 'resize-right' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTask, setDragStartTask] = useState<ActionTask | null>(null);

  // --- Helpers ---
  const daysToRender = 60; // Render 60 days
  const startDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1); // Start from 1st of current month
  const dates = Array.from({ length: daysToRender }, (_, i) => addDays(startDate, i));

  // --- Handlers ---

  const handleAddTask = () => {
    setEditingTask(null);
    setNewStartDate(undefined);
    setIsModalOpen(true);
  };

  const handleGridClick = (dateStr: string) => {
      // If clicking on empty space (not dragging), open add modal for that date
      setEditingTask(null);
      setNewStartDate(dateStr);
      setIsModalOpen(true);
  };

  const handleTaskDoubleClick = (e: React.MouseEvent, task: ActionTask) => {
    e.stopPropagation(); // Prevent grid click
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
    e.preventDefault(); // Prevent text selection
    setDraggingId(task.id);
    setDragType(type);
    setDragStartX(e.clientX);
    setDragStartTask({ ...task });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingId || !dragType || !dragStartTask) return;

      const deltaX = e.clientX - dragStartX;
      const deltaDays = Math.round(deltaX / CELL_WIDTH);

      if (deltaDays === 0) return;

      const newTasks = tasks.map(t => {
        if (t.id !== draggingId) return t;

        const originalStart = new Date(dragStartTask.startDate);
        const originalEnd = new Date(dragStartTask.endDate);

        let newStart = originalStart;
        let newEnd = originalEnd;

        if (dragType === 'move') {
          newStart = addDays(originalStart, deltaDays);
          newEnd = addDays(originalEnd, deltaDays);
        } else if (dragType === 'resize-left') {
          newStart = addDays(originalStart, deltaDays);
          // Prevent end before start
          if (newStart > newEnd) newStart = newEnd; 
        } else if (dragType === 'resize-right') {
          newEnd = addDays(originalEnd, deltaDays);
          // Prevent start after end
          if (newEnd < newStart) newEnd = newStart;
        }

        return {
          ...t,
          startDate: formatDate(newStart),
          endDate: formatDate(newEnd)
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
  }, [draggingId, dragType, dragStartX, dragStartTask, tasks]);


  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      {/* Header Controls */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white z-20 relative">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-bold text-gray-900">Action Plan Timeline</h3>
          <div className="flex items-center space-x-2 bg-gray-100 rounded-md p-1">
            <button 
                onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}
                className="p-1 hover:bg-white rounded shadow-sm transition-all"
            >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-medium w-24 text-center">
                {getMonthName(viewDate.getMonth())} {viewDate.getFullYear()}
            </span>
            <button 
                onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}
                className="p-1 hover:bg-white rounded shadow-sm transition-all"
            >
                <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="flex space-x-3">
             <div className="text-xs text-gray-500 flex items-center">
                <span className="inline-block w-3 h-3 bg-blue-500 rounded-sm mr-2"></span>
                Double-click to edit
             </div>
             <div className="text-xs text-gray-500 flex items-center">
                <span className="inline-block w-3 h-3 border border-gray-400 rounded-sm mr-2"></span>
                Drag to move/resize
             </div>
             <button
              onClick={handleAddTask}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Action
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
                    {dates.map((date, i) => {
                        const isToday = formatDate(date) === formatDate(new Date());
                        return (
                            <div 
                                key={i} 
                                className={clsx(
                                    "flex-shrink-0 border-r border-gray-200 flex flex-col items-center justify-center text-xs",
                                    isToday ? "bg-blue-50" : ""
                                )}
                                style={{ width: CELL_WIDTH }}
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
                        {dates.map((_, i) => (
                            <div key={i} className="flex-shrink-0 border-r border-gray-100 h-full" style={{ width: CELL_WIDTH }}></div>
                        ))}
                    </div>

                    {/* Task Rows & Bars */}
                    {tasks.map((task) => {
                         // Calculate Position
                         const taskStart = new Date(task.startDate);
                         const taskEnd = new Date(task.endDate);
                         const offsetDays = diffDays(taskStart, startDate);
                         const durationDays = diffDays(taskEnd, taskStart) + 1; // Inclusive

                         const left = offsetDays * CELL_WIDTH;
                         const width = durationDays * CELL_WIDTH;
                         
                         // Only render if visible roughly
                         if (left + width < 0) return null;

                         return (
                            <div key={task.id} className="h-[48px] border-b border-gray-100 relative group">
                                {/* Clickable row background for "Add" */}
                                <div 
                                    className="absolute inset-0 z-0" 
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const clickX = e.clientX - rect.left;
                                        const dayIndex = Math.floor(clickX / CELL_WIDTH);
                                        if (dayIndex >= 0 && dayIndex < dates.length) {
                                            handleGridClick(formatDate(dates[dayIndex]));
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
                                    style={{ left: Math.max(0, left), width: Math.max(CELL_WIDTH, width) }}
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
                                        const dayIndex = Math.floor(clickX / CELL_WIDTH);
                                        if (dayIndex >= 0 && dayIndex < dates.length) {
                                            handleGridClick(formatDate(dates[dayIndex]));
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
