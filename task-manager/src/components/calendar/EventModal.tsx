import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import type { CalendarEvent } from '@/types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'> | CalendarEvent) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  event?: CalendarEvent;
  initialDate?: Date;
  initialTime?: string;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  initialDate,
  initialTime,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDateTime: '',
    endDateTime: '',
    isAllDay: false,
    color: '#10b981',
    reminders: [] as number[],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (event) {
      // Editing existing event
      setFormData({
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        startDateTime: event.startDateTime.slice(0, 16), // Format for datetime-local input
        endDateTime: event.endDateTime.slice(0, 16),
        isAllDay: event.isAllDay,
        color: event.color || '#10b981',
        reminders: event.reminders || [],
      });
    } else if (initialDate) {
      // Creating new event with initial date/time
      const start = new Date(initialDate);
      if (initialTime) {
        const [hours, minutes] = initialTime.split(':');
        start.setHours(parseInt(hours), parseInt(minutes));
      }
      const end = new Date(start);
      end.setHours(end.getHours() + 1);

      setFormData({
        title: '',
        description: '',
        location: '',
        startDateTime: start.toISOString().slice(0, 16),
        endDateTime: end.toISOString().slice(0, 16),
        isAllDay: false,
        color: '#10b981',
        reminders: [15], // Default 15 minutes reminder
      });
    } else {
      // Reset form
      const now = new Date();
      const later = new Date(now);
      later.setHours(later.getHours() + 1);

      setFormData({
        title: '',
        description: '',
        location: '',
        startDateTime: now.toISOString().slice(0, 16),
        endDateTime: later.toISOString().slice(0, 16),
        isAllDay: false,
        color: '#10b981',
        reminders: [15],
      });
    }
  }, [event, initialDate, initialTime, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const eventData: any = {
        ...formData,
        startDateTime: new Date(formData.startDateTime).toISOString(),
        endDateTime: new Date(formData.endDateTime).toISOString(),
        source: event?.source || 'local',
      };

      if (event) {
        // Update existing event
        await onSave({ ...event, ...eventData });
      } else {
        // Create new event
        await onSave(eventData);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('Failed to save event. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete) return;

    if (confirm('Are you sure you want to delete this event?')) {
      setIsDeleting(true);
      try {
        await onDelete(event.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete event:', error);
        alert('Failed to delete event. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const toggleReminder = (minutes: number) => {
    setFormData((prev) => ({
      ...prev,
      reminders: prev.reminders.includes(minutes)
        ? prev.reminders.filter((m) => m !== minutes)
        : [...prev.reminders, minutes],
    }));
  };

  const colorOptions = [
    { value: '#10b981', label: 'Green' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#ef4444', label: 'Red' },
    { value: '#ec4899', label: 'Pink' },
  ];

  const reminderOptions = [
    { value: 0, label: 'At event time' },
    { value: 5, label: '5 minutes before' },
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' },
    { value: 1440, label: '1 day before' },
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={event ? 'Edit Event' : 'Create Event'}
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          {event && onDelete && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <div className={`flex gap-3 ${event && onDelete ? 'ml-auto' : 'w-full'}`}>
            <p className="text-xs text-text-tertiary flex items-center mr-auto">
              Fields marked * are required
            </p>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : event ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Details Section */}
        <div className="card space-y-4">
          <div>
            <p className="label">Event Details</p>
            <h3 className="text-lg font-semibold text-text-primary">Basic information</h3>
          </div>

          <Input
            label="Event Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Meeting with team"
            required
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Add event details..."
          />

          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Conference Room A"
          />

          {event?.meetLink && (
            <div className="input-group">
              <label className="label mb-3">Video Conference</label>
              <a
                href={event.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-accent/10 border border-accent/20 rounded-lg text-accent hover:bg-accent/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z"/>
                </svg>
                <span className="font-medium">Join Google Meet</span>
              </a>
            </div>
          )}
        </div>

        {/* Time & Duration Section */}
        <div className="card space-y-4">
          <div>
            <p className="label">Time & Duration</p>
            <h3 className="text-lg font-semibold text-text-primary">When does this event occur</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label mb-3">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface/50 border border-surface-lighter/50 rounded-lg text-text-primary transition-all duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 focus:bg-surface-light"
                required
              />
            </div>

            <div>
              <label className="label mb-3">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.endDateTime}
                onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface/50 border border-surface-lighter/50 rounded-lg text-text-primary transition-all duration-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 focus:bg-surface-light"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-surface-light/30 rounded-lg border border-surface-lighter/50">
            <input
              type="checkbox"
              id="all-day"
              checked={formData.isAllDay}
              onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
              className="w-4 h-4 rounded border-2 border-white/20 bg-surface-light checked:bg-accent checked:border-accent cursor-pointer transition-colors"
            />
            <label htmlFor="all-day" className="text-sm text-text-secondary cursor-pointer select-none">
              All-day event
            </label>
          </div>
        </div>

        {/* Color & Reminders Section */}
        <div className="card space-y-4">
          <div>
            <p className="label">Color & Reminders</p>
            <h3 className="text-lg font-semibold text-text-primary">Visual settings & notifications</h3>
          </div>

          <div>
            <label className="label mb-3">
              Color
            </label>
            <div className="flex flex-wrap gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    formData.color === color.value
                      ? 'border-white/70 scale-110 ring-2 ring-white/30 shadow-md'
                      : 'border-transparent hover:scale-105 hover:ring-1 hover:ring-white/20'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="label mb-3">
              Reminders
            </label>
            <div className="flex flex-wrap gap-2">
              {reminderOptions.map((reminder) => (
                <button
                  key={reminder.value}
                  type="button"
                  onClick={() => toggleReminder(reminder.value)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${formData.reminders.includes(reminder.value)
                      ? 'bg-accent text-white shadow-sm shadow-accent/30'
                      : 'bg-surface-light text-text-secondary hover:bg-surface-lighter'
                    }
                  `}
                >
                  {reminder.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Google Event Info Card */}
        {event?.source === 'google' && (
          <div className="card border-blue-500/30 bg-blue-500/5 text-sm space-y-1">
            <p className="font-semibold flex items-center gap-2 text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Google Calendar Event
            </p>
            <p className="text-xs text-blue-200/80">
              Changes will sync back to Google Calendar.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
};
