import React, { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { TimeUtils } from '@/services/time';
import { EmptyState } from '@/components/ui';
import { TaskModal } from './TaskModal';
import TaskTemplateModal from '@/components/tasks/TaskTemplateModal';
import { Sparkles } from 'lucide-react';
import type { Task } from '@/types';
import { notificationService } from '@/services/notifications';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const TasksPage: React.FC = () => {
  const {
    tasks,
    taskTimers,
    settings,
    updateSettings,
    toggleTaskCompletion,
    startTaskTimer,
    pauseTaskTimer,
    resetTaskTimer,
    setTimerElapsedTime,
    deleteTask,
    reorderTasks,
  } = useStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [filter, setFilter] = useState<'all' | 'today' | 'repeatable' | 'oneoff'>('today');
  const [sortBy, setSortBy] = useState<'default' | 'priority'>('default');
  const [currentDate, setCurrentDate] = useState(TimeUtils.getTodayDateString());

  const todayStr = currentDate;
  const viewMode = settings.viewPreferences?.tasksViewMode || 'list';

  const handleViewModeChange = (mode: 'list' | 'grid' | 'compact') => {
    updateSettings({
      viewPreferences: {
        ...settings.viewPreferences,
        tasksViewMode: mode,
        calendarViewMode: settings.viewPreferences?.calendarViewMode || 'week',
      },
    });
  };

  // Midnight reset logic - check every minute if date has changed
  useEffect(() => {
    const checkDateChange = () => {
      const newDate = TimeUtils.getTodayDateString();
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
        // Reset all running timers when date changes
        Object.keys(taskTimers).forEach(taskId => {
          if (taskTimers[taskId]?.isRunning) {
            pauseTaskTimer(taskId);
          }
          resetTaskTimer(taskId);
        });
      }
    };

    // Check immediately
    checkDateChange();

    // Check every minute (60000ms)
    const interval = setInterval(checkDateChange, 60000);
    
    return () => clearInterval(interval);
  }, [currentDate, taskTimers, pauseTaskTimer, resetTaskTimer]);

  const getFilteredTasks = () => {
    let filtered = tasks.filter((task) => task.active);

    switch (filter) {
      case 'today':
        filtered = filtered.filter((task) => {
          if (!task.isRepeatable) return true;
          return TimeUtils.shouldRunToday(task.repeatPattern, task.repeatDaysOfWeek);
        });
        break;
      case 'repeatable':
        filtered = filtered.filter((task) => task.isRepeatable);
        break;
      case 'oneoff':
        filtered = filtered.filter((task) => !task.isRepeatable);
        break;
    }

    // Sort by priority if selected
    if (sortBy === 'priority') {
      const priorityOrder = { 'A': 1, 'B': 2, 'C': 3 };
      filtered.sort((a, b) => {
        const aPriority = a.priority ? priorityOrder[a.priority] : 999;
        const bPriority = b.priority ? priorityOrder[b.priority] : 999;
        return aPriority - bPriority;
      });
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(undefined);
  };

  const handleToggleCompletion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const isCurrentlyCompleted = task?.completionByDate[todayStr]?.completed || false;
    
    // Toggle the completion
    await toggleTaskCompletion(taskId);
    
    // If marking as complete, move to end
    if (!isCurrentlyCompleted && task) {
      const otherTasks = tasks.filter(t => t.id !== taskId);
      const newOrder = [...otherTasks.map(t => t.id), taskId];
      reorderTasks(newOrder);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredTasks.findIndex((task) => task.id === active.id);
      const newIndex = filteredTasks.findIndex((task) => task.id === over.id);
      
      // Reorder within the filtered list
      const reorderedFiltered = arrayMove(filteredTasks, oldIndex, newIndex);
      
      // Now we need to merge this order back into the full tasks list
      // Get all task IDs not in the filtered list
      const filteredIds = new Set(filteredTasks.map(t => t.id));
      // const otherTaskIds = tasks.filter(t => !filteredIds.has(t.id)).map(t => t.id);
      
      // Find where the first filtered task appears in the original list
      const firstFilteredIndex = tasks.findIndex(t => filteredIds.has(t.id));
      
      // Reconstruct the full order: tasks before filtered + reordered filtered + tasks after
      const newOrder = [
        ...tasks.slice(0, firstFilteredIndex).map(t => t.id),
        ...reorderedFiltered.map(t => t.id),
        ...tasks.slice(firstFilteredIndex + filteredTasks.length).map(t => t.id)
      ];
      
      reorderTasks(newOrder);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(['all', 'today', 'repeatable', 'oneoff'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg capitalize font-medium transition-all duration-200 ${
                  filter === f
                    ? 'bg-accent text-white shadow-lg shadow-accent/20'
                    : 'bg-surface-light text-text-secondary hover:text-text-primary hover:bg-surface-lighter'
                }`}
              >
                {f === 'oneoff' ? 'One-Off' : f}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {/* Sort Toggle */}
            <div className="flex gap-1 bg-surface-light rounded-lg p-1">
              <button
                onClick={() => setSortBy('default')}
                className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                  sortBy === 'default'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                title="Default Order"
              >
                Default
              </button>
              <button
                onClick={() => setSortBy('priority')}
                className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                  sortBy === 'priority'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                title="Sort by Priority"
              >
                Priority
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-surface-light rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'list'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                title="List View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                title="Grid View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
              <button
                onClick={() => handleViewModeChange('compact')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'compact'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                title="Compact View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </button>
            </div>

            <button 
              onClick={() => setIsTemplateModalOpen(true)} 
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-surface-light text-text-secondary hover:text-text-primary hover:bg-surface-lighter flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Templates
            </button>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary">
              + Add Task
            </button>
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={<span className="text-6xl">✓</span>}
            title="No tasks yet"
            description="Create your first task to get started with tracking your productivity"
            action={{
              label: 'Create Task',
              onClick: () => setIsModalOpen(true),
            }}
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'
                  : viewMode === 'compact'
                  ? 'grid gap-1'
                  : 'grid gap-2'
              }>
                {filteredTasks.map((task) => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    todayStr={todayStr}
                    timer={taskTimers[task.id]}
                    taskTimers={taskTimers}
                    viewMode={viewMode}
                    onToggleCompletion={() => handleToggleCompletion(task.id)}
                    onStartTimer={() => startTaskTimer(task.id)}
                    onPauseTimer={() => pauseTaskTimer(task.id)}
                    onResetTimer={() => resetTaskTimer(task.id)}
                    setTimerElapsedTime={setTimerElapsedTime}
                    onEdit={() => handleEdit(task)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
      />

      {/* Task Template Modal */}
      <TaskTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />
    </div>
  );
};

// Sortable wrapper for TaskCard
const SortableTaskCard: React.FC<TaskCardProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  todayStr: string;
  timer?: { isRunning: boolean; startedAt?: number; elapsedSeconds: number };
  taskTimers: Record<string, { isRunning: boolean; startedAt?: number; elapsedSeconds: number }>;
  viewMode: 'list' | 'grid' | 'compact';
  onToggleCompletion: () => void;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  setTimerElapsedTime: (taskId: string, seconds: number) => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
  dragHandleProps?: any;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  todayStr,
  timer,
  taskTimers,
  viewMode,
  onToggleCompletion,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  setTimerElapsedTime,
  onEdit,
  onDelete,
  dragHandleProps,
}) => {
  const [timerDisplay, setTimerDisplay] = useState('0:00');
  const [hasNotified, setHasNotified] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showTimerEdit, setShowTimerEdit] = useState(false);
  const [editMinutes, setEditMinutes] = useState('');
  const completion = task.completionByDate[todayStr];
  const isDone = completion?.completed || false;

  useEffect(() => {
    if (!timer) {
      setTimerDisplay(task.estimatedDurationMinutes ? TimeUtils.secondsToTime(task.estimatedDurationMinutes * 60) : '0:00');
      setHasNotified(false);
      return;
    }

    const updateDisplay = () => {
      let totalSeconds = timer.elapsedSeconds;
      if (timer.isRunning && timer.startedAt) {
        totalSeconds += Math.floor((Date.now() - timer.startedAt) / 1000);
      }
      
      // Calculate remaining time (countdown)
      const estimatedSeconds = (task.estimatedDurationMinutes || 0) * 60;
      const remainingSeconds = Math.max(0, estimatedSeconds - totalSeconds);
      setTimerDisplay(TimeUtils.secondsToTime(remainingSeconds));
      
      // Send notification when time reaches zero (only once)
      if (timer.isRunning && remainingSeconds === 0 && !hasNotified && task.estimatedDurationMinutes) {
        setHasNotified(true);
        notificationService.send(
          '⏰ Task Timer Complete',
          `Time is up for: ${task.title}`
        );
      }
    };

    updateDisplay();
    const interval = setInterval(updateDisplay, 1000);
    return () => clearInterval(interval);
  }, [timer, task.estimatedDurationMinutes]);

  const getRepeatInfo = () => {
    if (!task.isRepeatable) return 'One-time';
    if (task.repeatPattern === 'daily') return 'Daily';
    if (task.repeatPattern === 'weekly' && task.repeatDaysOfWeek) return 'Weekly';
    if (task.repeatPattern === 'custom' && task.repeatInterval && task.repeatIntervalUnit) {
      return `Every ${task.repeatInterval} ${task.repeatIntervalUnit}`;
    }
    return 'Custom';
  };

  const handleTimerContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleEditTimer = () => {
    const timer = taskTimers[task.id];
    const elapsedMinutes = Math.floor((timer?.elapsedSeconds || 0) / 60);
    setEditMinutes(elapsedMinutes.toString());
    setShowTimerEdit(true);
    setContextMenu(null);
  };

  const handleSaveTimer = async () => {
    const minutes = parseInt(editMinutes);
    if (!isNaN(minutes) && minutes >= 0) {
      const totalSeconds = minutes * 60;
      await setTimerElapsedTime(task.id, totalSeconds);
    }
    setShowTimerEdit(false);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // Grid View - Vertical card layout
  if (viewMode === 'grid') {
    return (
      <div
        className={`
          group relative overflow-hidden rounded-lg border p-4 transition-all duration-300 animate-slide-up h-full flex flex-col
          ${isDone 
            ? 'bg-surface/30 border-white/5 opacity-70' 
            : 'bg-surface/60 border-white/10 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5'
          }
        `}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onToggleCompletion}
              className={`
                flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                ${isDone
                  ? 'bg-accent border-accent scale-90'
                  : 'border-text-tertiary hover:border-accent hover:bg-accent/10'
                }
              `}
            >
              {isDone && (
                <svg className="w-3.5 h-3.5 text-black font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <h3 className={`text-lg font-medium truncate ${isDone ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
              {task.title}
            </h3>
          </div>
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-text-tertiary hover:text-accent transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 3C9 2.44772 8.55228 2 8 2C7.44772 2 7 2.44772 7 3V21C7 21.5523 7.44772 22 8 22C8.55228 22 9 21.5523 9 21V3Z" />
              <path d="M17 3C17 2.44772 16.5523 2 16 2C15.4477 2 15 2.44772 15 3V21C15 21.5523 15.4477 22 16 22C16.5523 22 17 21.5523 17 21V3Z" />
            </svg>
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-text-secondary mb-3 line-clamp-2">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          {task.priority && (
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${
              task.priority === 'A' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              task.priority === 'B' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              Priority {task.priority}
            </span>
          )}
          {task.category && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-surface-lighter text-text-secondary">
              {task.category}
            </span>
          )}
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <span className="opacity-70">↻</span>
            {getRepeatInfo()}
          </span>
          {task.estimatedDurationMinutes && (
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <span className="opacity-70">⏱</span>
              {TimeUtils.formatDuration(task.estimatedDurationMinutes)}
            </span>
          )}
        </div>

        <div className="mt-auto">
          <div 
            className={`font-mono text-2xl font-bold text-center mb-3 cursor-context-menu ${timer?.isRunning ? 'text-accent animate-pulse-slow' : 'text-text-tertiary'}`}
            onContextMenu={handleTimerContextMenu}
            title="Right-click to edit elapsed time"
          >
            {timerDisplay}
          </div>

          {!isDone && (
            <div className="flex gap-2 justify-center mb-2">
              {!timer?.isRunning ? (
                <button onClick={onStartTimer} className="p-2 rounded bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
              ) : (
                <button onClick={onPauseTimer} className="p-2 rounded bg-warning/10 text-warning hover:bg-warning hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
              )}
              <button onClick={onResetTimer} className="p-2 rounded hover:bg-surface-lighter text-text-secondary transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="text-xs hover:text-white text-zinc-400 px-2 py-1 transition-colors">Edit</button>
            <button onClick={onDelete} className="text-xs hover:text-danger text-zinc-400 px-2 py-1 transition-colors">Delete</button>
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-surface border border-white/10 rounded-lg shadow-2xl py-1 z-50 animate-slide-up"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={handleEditTimer}
              className="w-full px-4 py-2 text-left text-text-primary hover:bg-surface-lighter transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Elapsed Time
            </button>
          </div>
        )}

        {/* Timer Edit Modal */}
        {showTimerEdit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-slide-up">
              <h3 className="text-xl font-bold text-text-primary mb-4">Edit Elapsed Time</h3>
              <p className="text-sm text-text-secondary mb-4">
                Set the total time you've already spent on this task.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Elapsed Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-lighter border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Enter minutes"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTimerEdit(false)}
                  className="flex-1 px-4 py-3 bg-surface-lighter text-text-secondary rounded-lg hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTimer}
                  className="flex-1 btn-primary"
                  disabled={!editMinutes || parseInt(editMinutes) < 0}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact View - Minimal single line
  if (viewMode === 'compact') {
    return (
      <div
        className={`
          group relative overflow-hidden rounded border px-2 py-1.5 transition-all duration-300 animate-slide-up
          ${isDone 
            ? 'bg-surface/30 border-white/5 opacity-70' 
            : 'bg-surface/60 border-white/10 hover:border-accent/30'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-text-tertiary hover:text-accent transition-colors">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 3C9 2.44772 8.55228 2 8 2C7.44772 2 7 2.44772 7 3V21C7 21.5523 7.44772 22 8 22C8.55228 22 9 21.5523 9 21V3Z" />
              <path d="M17 3C17 2.44772 16.5523 2 16 2C15.4477 2 15 2.44772 15 3V21C15 21.5523 15.4477 22 16 22C16.5523 22 17 21.5523 17 21V3Z" />
            </svg>
          </div>
          
          <button
            onClick={onToggleCompletion}
            className={`
              flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300
              ${isDone ? 'bg-accent border-accent scale-90' : 'border-text-tertiary hover:border-accent hover:bg-accent/10'}
            `}
          >
            {isDone && (
              <svg className="w-2.5 h-2.5 text-black font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <h3 className={`text-sm font-medium truncate flex-1 ${isDone ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
            {task.title}
          </h3>

          {task.priority && (
            <span className={`text-[8px] uppercase font-bold px-1 py-0.5 rounded flex-shrink-0 ${
              task.priority === 'A' ? 'bg-red-500/20 text-red-400' :
              task.priority === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {task.priority}
            </span>
          )}
          {task.category && (
            <span className="text-[8px] uppercase font-bold px-1 py-0.5 rounded bg-surface-lighter text-text-secondary flex-shrink-0">
              {task.category}
            </span>
          )}

          <div 
            className={`font-mono text-sm font-bold cursor-context-menu ${timer?.isRunning ? 'text-accent' : 'text-text-tertiary'}`}
            onContextMenu={handleTimerContextMenu}
            title="Right-click to edit elapsed time"
          >
            {timerDisplay}
          </div>

          {!isDone && (
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {!timer?.isRunning ? (
                <button onClick={onStartTimer} className="p-0.5 rounded bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
              ) : (
                <button onClick={onPauseTimer} className="p-0.5 rounded bg-warning/10 text-warning hover:bg-warning hover:text-white transition-colors">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
              )}
            </div>
          )}

          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity border-l border-white/10 pl-1">
            <button onClick={onEdit} className="text-[10px] hover:text-white text-zinc-400 px-1 transition-colors">Edit</button>
            <button onClick={onDelete} className="text-[10px] hover:text-danger text-zinc-400 px-1 transition-colors">Del</button>
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-surface border border-white/10 rounded-lg shadow-2xl py-1 z-50 animate-slide-up"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={handleEditTimer}
              className="w-full px-4 py-2 text-left text-text-primary hover:bg-surface-lighter transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Elapsed Time
            </button>
          </div>
        )}

        {/* Timer Edit Modal */}
        {showTimerEdit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-slide-up">
              <h3 className="text-xl font-bold text-text-primary mb-4">Edit Elapsed Time</h3>
              <p className="text-sm text-text-secondary mb-4">
                Set the total time you've already spent on this task.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Elapsed Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-lighter border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Enter minutes"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTimerEdit(false)}
                  className="flex-1 px-4 py-3 bg-surface-lighter text-text-secondary rounded-lg hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTimer}
                  className="flex-1 btn-primary"
                  disabled={!editMinutes || parseInt(editMinutes) < 0}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List View - Default horizontal layout
  return (
    <div
      className={`
        group relative overflow-hidden rounded-lg border p-3 transition-all duration-300 animate-slide-up
        ${isDone 
          ? 'bg-surface/30 border-white/5 opacity-70' 
          : 'bg-surface/60 border-white/10 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div
          {...dragHandleProps}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-text-tertiary hover:text-accent transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 3C9 2.44772 8.55228 2 8 2C7.44772 2 7 2.44772 7 3V21C7 21.5523 7.44772 22 8 22C8.55228 22 9 21.5523 9 21V3Z" />
            <path d="M17 3C17 2.44772 16.5523 2 16 2C15.4477 2 15 2.44772 15 3V21C15 21.5523 15.4477 22 16 22C16.5523 22 17 21.5523 17 21V3Z" />
          </svg>
        </div>
        
        <button
          onClick={onToggleCompletion}
          className={`
            flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300
            ${isDone
              ? 'bg-accent border-accent scale-90'
              : 'border-text-tertiary hover:border-accent hover:bg-accent/10'
            }
          `}
        >
          {isDone && (
            <svg className="w-3 h-3 text-black font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-medium transition-colors truncate ${isDone ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                {task.title}
              </h3>
              {task.priority && (
                <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${
                  task.priority === 'A' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  task.priority === 'B' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {task.priority}
                </span>
              )}
              {task.category && (
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface-lighter text-text-secondary flex-shrink-0">
                  {task.category}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                <span className="opacity-70">↻</span>
                <span>{getRepeatInfo()}</span>
              </div>

              {task.estimatedDurationMinutes && (
                <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <span className="opacity-70">⏱</span>
                  <span>{TimeUtils.formatDuration(task.estimatedDurationMinutes)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div 
              className={`font-mono text-base font-bold tracking-tight transition-colors cursor-context-menu ${timer?.isRunning ? 'text-accent animate-pulse-slow' : 'text-text-tertiary'}`}
              onContextMenu={handleTimerContextMenu}
              title="Right-click to edit elapsed time"
            >
              {timerDisplay}
            </div>

            {!isDone && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {!timer?.isRunning ? (
                  <button onClick={onStartTimer} className="p-1 rounded bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                ) : (
                  <button onClick={onPauseTimer} className="p-1 rounded bg-warning/10 text-warning hover:bg-warning hover:text-white transition-colors">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  </button>
                )}
                <button onClick={onResetTimer} className="p-1 rounded hover:bg-surface-lighter text-text-secondary transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-l border-white/10 pl-2 ml-1">
              <button onClick={onEdit} className="text-[11px] hover:text-white text-zinc-400 px-1.5 py-0.5 transition-colors">Edit</button>
              <button onClick={onDelete} className="text-[11px] hover:text-danger text-zinc-400 px-1.5 py-0.5 transition-colors">Del</button>
            </div>
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-surface border border-white/10 rounded-lg shadow-2xl py-1 z-50 animate-slide-up"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={handleEditTimer}
              className="w-full px-4 py-2 text-left text-text-primary hover:bg-surface-lighter transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Elapsed Time
            </button>
          </div>
        )}

        {/* Timer Edit Modal */}
        {showTimerEdit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-slide-up">
              <h3 className="text-xl font-bold text-text-primary mb-4">Edit Elapsed Time</h3>
              <p className="text-sm text-text-secondary mb-4">
                Set the total time you've already spent on this task.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Elapsed Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-lighter border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Enter minutes"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTimerEdit(false)}
                  className="flex-1 px-4 py-3 bg-surface-lighter text-text-secondary rounded-lg hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTimer}
                  className="flex-1 btn-primary"
                  disabled={!editMinutes || parseInt(editMinutes) < 0}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
