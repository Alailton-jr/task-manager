import React, { useState } from 'react';
import { useStore } from '@/store';
import { TimeUtils } from '@/services/time';
import { EmptyState } from '@/components/ui';
import { ReminderModal } from './ReminderModal';
import type { Reminder } from '@/types';

export const RemindersPage: React.FC = () => {
  const { reminders, deleteReminder } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | undefined>();

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReminder(undefined);
  };

  const groupReminders = () => {
    const now = new Date();
    const groups: Record<string, Reminder[]> = {
      thisWeek: [],
      nextMonth: [],
      later: [],
      past: [],
    };

    reminders.forEach((reminder) => {
      if (!reminder.active) return;
      
      const eventDate = new Date(reminder.eventDateTime);
      const daysUntil = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        groups.past.push(reminder);
      } else if (daysUntil <= 7) {
        groups.thisWeek.push(reminder);
      } else if (daysUntil <= 30) {
        groups.nextMonth.push(reminder);
      } else {
        groups.later.push(reminder);
      }
    });

    // Sort each group by date
    Object.keys(groups).forEach((key) => {
      groups[key].sort(
        (a, b) => new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime()
      );
    });

    return groups;
  };

  const groups = groupReminders();

  const renderGroup = (title: string, reminders: Reminder[]) => {
    if (reminders.length === 0) return null;

    return (
      <div key={title} className="mb-8 animate-slide-up">
        <h2 className="text-lg font-semibold mb-4 text-text-secondary uppercase tracking-wider text-xs">{title}</h2>
        <div className="grid gap-3">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onEdit={() => handleEdit(reminder)}
              onDelete={() => deleteReminder(reminder.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Reminders</h1>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            + Add Reminder
          </button>
        </div>

        {/* Reminders List */}
        {reminders.filter((r) => r.active).length === 0 ? (
          <EmptyState
            icon={<span className="text-6xl">🔔</span>}
            title="No reminders yet"
            description="Create reminders for important events, birthdays, and deadlines"
            action={{
              label: 'Create Reminder',
              onClick: () => setIsModalOpen(true),
            }}
          />
        ) : (
          <>
            {renderGroup('This Week', groups.thisWeek)}
            {renderGroup('Next Month', groups.nextMonth)}
            {renderGroup('Later', groups.later)}
            {groups.past.length > 0 && renderGroup('Past', groups.past)}
          </>
        )}
      </div>

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        reminder={editingReminder}
      />
    </div>
  );
};

interface ReminderCardProps {
  reminder: Reminder;
  onEdit: () => void;
  onDelete: () => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onEdit, onDelete }) => {
  const eventDate = new Date(reminder.eventDateTime);
  const isPast = eventDate < new Date();

  const getTypeIcon = () => {
    switch (reminder.type) {
      case 'birthday':
        return '🎂';
      case 'event':
        return '📅';
      default:
        return '🔔';
    }
  };

  const getNextNotificationTime = () => {
    const now = new Date();
    const notifications = reminder.notificationOffsets
      .map((offset) => new Date(eventDate.getTime() + offset * 60000))
      .filter((time) => time > now)
      .sort((a, b) => a.getTime() - b.getTime());

    return notifications[0];
  };

  const nextNotif = getNextNotificationTime();

  return (
    <div
      className={`
        group relative overflow-hidden rounded-xl border p-4 transition-all duration-300
        ${isPast 
          ? 'bg-surface/20 border-white/5 opacity-50 saturate-50' 
          : 'bg-surface/60 border-white/10 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5'
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="text-3xl mt-1">{getTypeIcon()}</div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-text-primary">{reminder.title}</h3>
          {reminder.description && (
            <p className="text-sm text-text-secondary line-clamp-1 mt-1">{reminder.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs flex-wrap">
            <span className="text-text-secondary">{TimeUtils.formatRelativeTime(eventDate)}</span>
            {reminder.isAllDay && (
              <span className="px-2 py-0.5 bg-surface-lighter rounded text-text-tertiary uppercase font-semibold tracking-wider text-[10px]">
                All Day
              </span>
            )}
            {reminder.repeatPattern === 'yearly' && (
              <span className="px-2 py-0.5 bg-accent/10 text-accent rounded uppercase font-semibold tracking-wider text-[10px] border border-accent/20">
                Yearly
              </span>
            )}
            {nextNotif && !isPast && (
              <span className="text-warning font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></span>
                Next alert: {TimeUtils.formatRelativeTime(nextNotif)}
              </span>
            )}
          </div>
        </div>

        {/* Time Until */}
        {!isPast && (
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-accent">
              {TimeUtils.getTimeUntil(eventDate)}
            </div>
            <div className="text-xs text-text-tertiary">remaining</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button onClick={onEdit} className="text-xs hover:text-white text-text-tertiary px-2 py-1 transition-colors">
            Edit
          </button>
          <button onClick={onDelete} className="text-xs hover:text-danger text-text-tertiary px-2 py-1 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
