import React, { useState } from 'react';
import { useStore } from '@/store';
import { EmptyState } from '@/components/ui';
import { RoutineBlockModal } from './RoutineBlockModal';
import { TimeUtils } from '@/services/time';
import type { RoutineBlock } from '@/types';

export const RoutinePage: React.FC = () => {
  const { routineBlocks, deleteRoutineBlock, tasks } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<RoutineBlock | undefined>();

  const handleEdit = (block: RoutineBlock) => {
    setEditingBlock(block);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBlock(undefined);
  };

  const sortedBlocks = [...routineBlocks].sort((a, b) => {
    const aMinutes = TimeUtils.timeToMinutes(a.startTime);
    const bMinutes = TimeUtils.timeToMinutes(b.startTime);
    return aMinutes - bMinutes;
  });

  const getDayTypeLabel = (block: RoutineBlock) => {
    if (block.dayType === 'everyday') return 'Every Day';
    if (block.dayType === 'weekday') return 'Weekdays';
    if (block.dayType === 'weekend') return 'Weekends';
    if (block.dayType === 'specificDays' && block.daysOfWeek) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return block.daysOfWeek.map((d) => days[d]).join(', ');
    }
    return '';
  };

  const getLinkedTask = (taskId?: string) => {
    if (!taskId) return null;
    return tasks.find((t) => t.id === taskId);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Daily Routine</h1>
            <p className="text-sm text-text-secondary mt-1">
              Build your ideal daily schedule. These blocks can overlay on your calendar.
            </p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            + Add Block
          </button>
        </div>

        {routineBlocks.length === 0 ? (
          <EmptyState
            icon={<span className="text-6xl">⏰</span>}
            title="No routine blocks yet"
            description="Create routine blocks to plan your ideal day structure"
            action={{
              label: 'Create Block',
              onClick: () => setIsModalOpen(true),
            }}
          />
        ) : (
          <div className="space-y-3">
            {sortedBlocks.map((block) => {
              const linkedTask = getLinkedTask(block.taskId);
              return (
                <div
                  key={block.id}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-surface/60 p-4 transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 animate-slide-up"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-1 h-16 rounded-full"
                      style={{ backgroundColor: block.color || '#06b6d4' }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-text-primary">{block.label}</h3>
                      {linkedTask && (
                        <p className="text-sm text-text-secondary flex items-center gap-1 mt-0.5">
                          <span className="opacity-70">🔗</span>
                          Linked to: {linkedTask.title}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary flex-wrap">
                        <span className="px-2 py-0.5 bg-surface-lighter rounded uppercase font-semibold tracking-wider text-[10px]">
                          {getDayTypeLabel(block)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="opacity-70">⏰</span>
                          {block.startTime} - {block.endTime}
                        </span>
                        <span className="text-accent font-medium">
                          {TimeUtils.formatDuration(
                            TimeUtils.timeToMinutes(block.endTime) -
                              TimeUtils.timeToMinutes(block.startTime)
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button onClick={() => handleEdit(block)} className="text-xs hover:text-white text-text-tertiary px-2 py-1 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => deleteRoutineBlock(block.id)} className="text-xs hover:text-danger text-text-tertiary px-2 py-1 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RoutineBlockModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        block={editingBlock}
      />
    </div>
  );
};
