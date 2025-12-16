import React, { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Modal, Button, Input, Select, Toggle, DateTimePicker } from '@/components/ui';
import { TimeUtils } from '@/services/time';
import type { Reminder } from '@/types';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder?: Reminder;
}

const OFFSET_PRESETS = [
  { label: 'On time', value: 0 },
  { label: '15 minutes before', value: -15 },
  { label: '1 hour before', value: -60 },
  { label: '1 day before', value: -1440 },
  { label: '1 week before', value: -10080 },
];

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, reminder }) => {
  const { addReminder, updateReminder } = useStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'custom' as 'birthday' | 'event' | 'custom',
    eventDate: TimeUtils.getTodayDateString(),
    eventTime: '12:00',
    isAllDay: false,
    notificationOffsets: [0] as number[],
    repeatPattern: 'none' as 'none' | 'yearly',
    active: true,
  });

  const [customOffset, setCustomOffset] = useState('');

  useEffect(() => {
    if (reminder) {
      const eventDate = new Date(reminder.eventDateTime);
      setFormData({
        title: reminder.title,
        description: reminder.description || '',
        type: reminder.type || 'custom',
        eventDate: TimeUtils.formatDate(eventDate),
        eventTime: TimeUtils.formatTime(eventDate, '24h'),
        isAllDay: reminder.isAllDay,
        notificationOffsets: reminder.notificationOffsets,
        repeatPattern: reminder.repeatPattern || 'none',
        active: reminder.active,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'custom',
        eventDate: TimeUtils.getTodayDateString(),
        eventTime: '12:00',
        isAllDay: false,
        notificationOffsets: [0],
        repeatPattern: 'none',
        active: true,
      });
    }
  }, [reminder, isOpen]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    const eventDateTime = formData.isAllDay
      ? TimeUtils.combineDateAndTime(new Date(formData.eventDate), '00:00').toISOString()
      : TimeUtils.combineDateAndTime(new Date(formData.eventDate), formData.eventTime).toISOString();

    const reminderData = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      eventDateTime,
      isAllDay: formData.isAllDay,
      notificationOffsets: formData.notificationOffsets,
      repeatPattern: formData.repeatPattern,
      active: formData.active,
    };

    if (reminder) {
      await updateReminder(reminder.id, reminderData);
    } else {
      await addReminder(reminderData);
    }
    
    onClose();
  };

  const addOffset = (offset: number) => {
    if (!formData.notificationOffsets.includes(offset)) {
      setFormData({
        ...formData,
        notificationOffsets: [...formData.notificationOffsets, offset].sort((a, b) => a - b),
      });
    }
  };

  const removeOffset = (offset: number) => {
    setFormData({
      ...formData,
      notificationOffsets: formData.notificationOffsets.filter((o) => o !== offset),
    });
  };

  const addCustomOffset = () => {
    const minutes = parseInt(customOffset);
    if (!isNaN(minutes)) {
      addOffset(minutes);
      setCustomOffset('');
    }
  };

  const formatOffset = (minutes: number) => {
    if (minutes === 0) return 'At event time';
    if (minutes > 0) return `${TimeUtils.formatDuration(minutes)} after`;
    return `${TimeUtils.formatDuration(Math.abs(minutes))} before`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={reminder ? 'Edit Reminder' : 'Create New Reminder'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim()}>
            {reminder ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Reminder Title *"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Friend's Birthday"
          autoFocus
        />

        <Input
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Add more details..."
        />

        <Select
          label="Type"
          options={[
            { value: 'custom', label: 'Custom' },
            { value: 'birthday', label: 'Birthday' },
            { value: 'event', label: 'Event' },
          ]}
          value={formData.type}
          onChange={(e) =>
            setFormData({ ...formData, type: e.target.value as 'birthday' | 'event' | 'custom' })
          }
        />

        <div className="space-y-3 pt-4 border-t border-surface-lighter">
          <DateTimePicker
            label="Event Date & Time"
            dateValue={formData.eventDate}
            timeValue={formData.eventTime}
            onDateChange={(value) => setFormData({ ...formData, eventDate: value })}
            onTimeChange={(value) => setFormData({ ...formData, eventTime: value })}
          />

          <Toggle
            label="All Day Event"
            checked={formData.isAllDay}
            onChange={(checked) => setFormData({ ...formData, isAllDay: checked })}
          />

          <Toggle
            label="Repeat Yearly"
            checked={formData.repeatPattern === 'yearly'}
            onChange={(checked) =>
              setFormData({ ...formData, repeatPattern: checked ? 'yearly' : 'none' })
            }
          />
        </div>

        <div className="space-y-3 pt-4 border-t border-surface-lighter">
          <label className="label">Notification Times</label>
          
          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            {OFFSET_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => addOffset(preset.value)}
                className="text-sm px-3 py-1 rounded bg-surface-light hover:bg-surface-lighter text-text-secondary hover:text-text-primary transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Offset */}
          <div className="flex gap-2">
            <Input
              placeholder="Minutes (negative for before)"
              type="number"
              value={customOffset}
              onChange={(e) => setCustomOffset(e.target.value)}
            />
            <Button variant="secondary" onClick={addCustomOffset}>
              Add
            </Button>
          </div>

          {/* Selected Offsets */}
          <div className="space-y-2">
            {formData.notificationOffsets.length === 0 ? (
              <p className="text-sm text-text-tertiary">No notifications set</p>
            ) : (
              formData.notificationOffsets.map((offset) => (
                <div
                  key={offset}
                  className="flex items-center justify-between bg-surface-light rounded px-3 py-2"
                >
                  <span className="text-sm">{formatOffset(offset)}</span>
                  <button
                    onClick={() => removeOffset(offset)}
                    className="text-danger hover:text-danger-hover"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
