import React, { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Modal, Button, Input, Select, TimePicker } from '@/components/ui';
import type { RoutineBlock } from '@/types';

interface RoutineBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  block?: RoutineBlock;
}

export const RoutineBlockModal: React.FC<RoutineBlockModalProps> = ({ isOpen, onClose, block }) => {
  const { addRoutineBlock, updateRoutineBlock, tasks } = useStore();
  
  const [formData, setFormData] = useState({
    label: '',
    taskId: '',
    dayType: 'everyday' as 'everyday' | 'weekday' | 'weekend' | 'specificDays',
    daysOfWeek: [] as number[],
    startTime: '09:00',
    endTime: '10:00',
    color: '#06b6d4',
  });

  useEffect(() => {
    if (block) {
      setFormData({
        label: block.label,
        taskId: block.taskId || '',
        dayType: block.dayType,
        daysOfWeek: block.daysOfWeek || [],
        startTime: block.startTime,
        endTime: block.endTime,
        color: block.color || '#06b6d4',
      });
    } else {
      setFormData({
        label: '',
        taskId: '',
        dayType: 'everyday',
        daysOfWeek: [],
        startTime: '09:00',
        endTime: '10:00',
        color: '#06b6d4',
      });
    }
  }, [block, isOpen]);

  const handleSubmit = async () => {
    if (!formData.label.trim()) return;

    const blockData = {
      label: formData.label,
      taskId: formData.taskId || undefined,
      dayType: formData.dayType,
      daysOfWeek: formData.dayType === 'specificDays' ? formData.daysOfWeek : undefined,
      startTime: formData.startTime,
      endTime: formData.endTime,
      color: formData.color,
    };

    if (block) {
      await updateRoutineBlock(block.id, blockData);
    } else {
      await addRoutineBlock(blockData);
    }
    
    onClose();
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const days = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  const taskOptions = [
    { value: '', label: 'No linked task' },
    ...tasks.map((task) => ({ value: task.id, label: task.title })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={block ? 'Edit Routine Block' : 'Create Routine Block'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.label.trim()}>
            {block ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Block Label *"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="e.g., Morning Study"
          autoFocus
        />

        <Select
          label="Link to Task (optional)"
          options={taskOptions}
          value={formData.taskId}
          onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <TimePicker
            label="Start Time"
            value={formData.startTime}
            onChange={(value) => setFormData({ ...formData, startTime: value })}
          />
          <TimePicker
            label="End Time"
            value={formData.endTime}
            onChange={(value) => setFormData({ ...formData, endTime: value })}
          />
        </div>

        <Select
          label="Day Type"
          options={[
            { value: 'everyday', label: 'Every Day' },
            { value: 'weekday', label: 'Weekdays (Mon-Fri)' },
            { value: 'weekend', label: 'Weekends (Sat-Sun)' },
            { value: 'specificDays', label: 'Specific Days' },
          ]}
          value={formData.dayType}
          onChange={(e) =>
            setFormData({
              ...formData,
              dayType: e.target.value as typeof formData.dayType,
            })
          }
        />

        {formData.dayType === 'specificDays' && (
          <div className="input-group">
            <label className="label">Days of Week</label>
            <div className="flex gap-2">
              {days.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDayOfWeek(day.value)}
                  className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                    formData.daysOfWeek.includes(day.value)
                      ? 'bg-accent text-white'
                      : 'bg-surface-light text-text-secondary hover:bg-surface-lighter'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="input-group">
          <label className="label">Color</label>
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>
      </div>
    </Modal>
  );
};
