import React, { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Modal, Button, Input, Select, Toggle } from '@/components/ui';
import { TimePickerPopup } from '@/components/ui/TimePickerPopup';
import type { Task } from '@/types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, task }) => {
  const { addTask, updateTask } = useStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: undefined as 'A' | 'B' | 'C' | undefined,
    estimatedDurationMinutes: undefined as number | undefined,
    isRepeatable: true,
    repeatPattern: 'daily' as 'none' | 'daily' | 'weekly' | 'custom',
    repeatDaysOfWeek: [] as number[],
    repeatInterval: 1,
    repeatIntervalUnit: 'days' as 'hours' | 'days',
    startTime: '',
    active: true,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        category: task.category || '',
        priority: task.priority,
        estimatedDurationMinutes: task.estimatedDurationMinutes,
        isRepeatable: task.isRepeatable,
        repeatPattern: task.repeatPattern,
        repeatDaysOfWeek: task.repeatDaysOfWeek || [],
        repeatInterval: task.repeatInterval || 1,
        repeatIntervalUnit: task.repeatIntervalUnit || 'days',
        startTime: task.startTime || '',
        active: task.active,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: undefined,
        estimatedDurationMinutes: undefined,
        isRepeatable: true,
        repeatPattern: 'daily',
        repeatDaysOfWeek: [],
        repeatInterval: 1,
        repeatIntervalUnit: 'days',
        startTime: '',
        active: true,
      });
    }
  }, [task, isOpen]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    if (task) {
      await updateTask(task.id, formData);
    } else {
      await addTask(formData);
    }
    
    onClose();
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      repeatDaysOfWeek: prev.repeatDaysOfWeek.includes(day)
        ? prev.repeatDaysOfWeek.filter((d) => d !== day)
        : [...prev.repeatDaysOfWeek, day].sort(),
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Create New Task'}
      footer={
        <div className="flex items-center justify-between w-full">
          <p className="text-xs text-text-tertiary">Fields marked * are required</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title.trim()}>
              {task ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Basic Info Section */}
        <div className="card space-y-4">
          <div>
            <p className="label">Basic Info</p>
            <h3 className="text-lg font-semibold text-text-primary">Task details</h3>
          </div>

          <Input
            label="Task Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Study for 1 hour"
            autoFocus
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Add more details about this task..."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Study, Work, Health"
            />

            <Select
              label="Priority"
              options={[
                { value: '', label: 'No Priority' },
                { value: 'A', label: 'A - High' },
                { value: 'B', label: 'B - Medium' },
                { value: 'C', label: 'C - Low' },
              ]}
              value={formData.priority || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value ? (e.target.value as 'A' | 'B' | 'C') : undefined,
                })
              }
            />

            <Input
              label="Estimated Duration"
              type="number"
              min="1"
              value={formData.estimatedDurationMinutes || ''}
              onChange={(e) =>
                setFormData({ 
                  ...formData, 
                  estimatedDurationMinutes: e.target.value ? parseInt(e.target.value) : undefined 
                })
              }
              placeholder="Minutes (optional)"
            />
          </div>
        </div>

        {/* Schedule Section */}
        <div className="card space-y-4">
          <div>
            <p className="label">Schedule</p>
            <h3 className="text-lg font-semibold text-text-primary">Time & repetition</h3>
            <p className="text-xs text-text-tertiary mt-1">Configure when and how often this task should appear</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TimePickerPopup
              label="Preferred Start Time"
              value={formData.startTime}
              onChange={(value) => setFormData({ ...formData, startTime: value })}
            />

            <div className="flex items-end">
              <Toggle
                label="Repeatable Task"
                checked={formData.isRepeatable}
                onChange={(checked) =>
                  setFormData({
                    ...formData,
                    isRepeatable: checked,
                    repeatPattern: checked ? 'daily' : 'none',
                  })
                }
              />
            </div>
          </div>

          {formData.isRepeatable && (
            <div className="space-y-4 pt-4 border-t border-surface-lighter">
              <Select
                label="Repeat Pattern"
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'custom', label: 'Custom' },
                ]}
                value={formData.repeatPattern}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    repeatPattern: e.target.value as 'daily' | 'weekly' | 'custom',
                  })
                }
              />

              {formData.repeatPattern === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Repeat Every"
                    type="number"
                    min="1"
                    value={formData.repeatInterval}
                    onChange={(e) =>
                      setFormData({ 
                        ...formData, 
                        repeatInterval: parseInt(e.target.value) || 1 
                      })
                    }
                  />
                  <Select
                    label="Unit"
                    options={[
                      { value: 'hours', label: 'Hours' },
                      { value: 'days', label: 'Days' },
                    ]}
                    value={formData.repeatIntervalUnit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        repeatIntervalUnit: e.target.value as 'hours' | 'days',
                      })
                    }
                  />
                </div>
              )}

              {formData.repeatPattern === 'weekly' && (
                <div className="input-group">
                  <label className="label mb-3">Days of Week</label>
                  <div className="flex flex-wrap gap-2">
                    {days.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDayOfWeek(day.value)}
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-medium transition-all
                          ${formData.repeatDaysOfWeek.includes(day.value)
                            ? 'bg-accent text-white shadow-sm shadow-accent/30'
                            : 'bg-surface-light text-text-secondary hover:bg-surface-lighter'
                          }
                        `}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
