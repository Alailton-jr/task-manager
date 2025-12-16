import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Sparkles } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { useStore } from '../../store';

interface TaskTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMOJI_OPTIONS = [
  '📝', '✅', '📊', '💼', '🎯', '🏃', '🧘', '📚', '💻', '🎨',
  '🏠', '🛒', '🍳', '💪', '🧹', '📧', '📞', '💡', '🎵', '🌟',
  '⚡', '🔥', '💎', '🚀', '🎓', '📱', '⏰', '🎮', '🌱', '☕'
];

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health' },
  { value: 'home', label: 'Home' },
  { value: 'finance', label: 'Finance' },
  { value: 'other', label: 'Other' },
];

const REPEAT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const TaskTemplateModal: React.FC<TaskTemplateModalProps> = ({ isOpen, onClose }) => {
  const { taskTemplates, addTaskTemplate, updateTaskTemplate, deleteTaskTemplate, createTaskFromTemplate } = useStore();
  
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📝',
    category: 'work',
    estimatedDurationMinutes: 30,
    isRepeatable: false,
    repeatPattern: 'none' as 'none' | 'daily' | 'weekly' | 'custom',
    repeatDaysOfWeek: [] as number[],
    startTime: '',
  });

  useEffect(() => {
    if (editingId) {
      const template = taskTemplates.find(t => t.id === editingId);
      if (template) {
        setFormData({
          name: template.name,
          description: template.description || '',
          icon: template.icon || '📝',
          category: template.category || 'work',
          estimatedDurationMinutes: template.estimatedDurationMinutes || 30,
          isRepeatable: template.isRepeatable,
          repeatPattern: template.repeatPattern,
          repeatDaysOfWeek: template.repeatDaysOfWeek || [],
          startTime: template.startTime || '',
        });
      }
    }
  }, [editingId, taskTemplates]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '📝',
      category: 'work',
      estimatedDurationMinutes: 30,
      isRepeatable: false,
      repeatPattern: 'none',
      repeatDaysOfWeek: [],
      startTime: '',
    });
    setEditingId(null);
  };

  const handleClose = () => {
    resetForm();
    setView('list');
    onClose();
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    const templateData = {
      name: formData.name,
      description: formData.description || undefined,
      icon: formData.icon,
      category: formData.category || undefined,
      estimatedDurationMinutes: formData.estimatedDurationMinutes,
      isRepeatable: formData.isRepeatable,
      repeatPattern: formData.repeatPattern,
      repeatDaysOfWeek: formData.repeatDaysOfWeek.length > 0 ? formData.repeatDaysOfWeek : undefined,
      startTime: formData.startTime || undefined,
    };

    if (editingId) {
      updateTaskTemplate(editingId, templateData);
    } else {
      addTaskTemplate(templateData);
    }

    resetForm();
    setView('list');
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setView('form');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTaskTemplate(id);
    }
  };

  const handleUseTemplate = (id: string) => {
    createTaskFromTemplate(id);
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={view === 'list' ? 'Task Templates' : (editingId ? 'Edit Template' : 'New Template')}
    >
      {view === 'list' ? (
        <div className="space-y-4">
          <Button
            onClick={() => setView('form')}
            className="w-full flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Template
          </Button>

          {taskTemplates.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No templates yet. Create your first template to save time!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {taskTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-zinc-400 mt-1">{template.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {template.category && (
                            <span className="px-2 py-0.5 text-xs bg-zinc-700 rounded">
                              {template.category}
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-xs bg-zinc-700 rounded">
                            {template.estimatedDurationMinutes}m
                          </span>
                          {template.isRepeatable && (
                            <span className="px-2 py-0.5 text-xs bg-zinc-700 rounded">
                              {template.repeatPattern}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUseTemplate(template.id)}
                        className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors text-cyan-400"
                        title="Use template"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(template.id)}
                        className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Edit template"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                        title="Delete template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-10 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setFormData({ ...formData, icon: emoji })}
                  className={`p-2 text-2xl rounded-lg transition-colors ${
                    formData.icon === emoji
                      ? 'bg-cyan-500/20 border-2 border-cyan-500'
                      : 'bg-zinc-800 border-2 border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Template Name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Morning Exercise"
            required
          />

          <TextArea
            label="Description (Optional)"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Add a description..."
            rows={2}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Category (Optional)
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Estimated Duration (minutes)"
              type="number"
              value={formData.estimatedDurationMinutes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, estimatedDurationMinutes: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRepeatable"
                checked={formData.isRepeatable}
                onChange={(e) => setFormData({ ...formData, isRepeatable: e.target.checked })}
                className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded"
              />
              <label htmlFor="isRepeatable" className="text-sm text-zinc-300">
                Repeatable Task
              </label>
            </div>

            {formData.isRepeatable && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Repeat Pattern
                </label>
                <select
                  value={formData.repeatPattern}
                  onChange={(e) => setFormData({ ...formData, repeatPattern: e.target.value as any })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {REPEAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <Input
            label="Start Time (Optional)"
            type="time"
            value={formData.startTime}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, startTime: e.target.value })}
          />

          <div className="flex gap-2 justify-end pt-4">
            <Button
              onClick={() => {
                resetForm();
                setView('list');
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default TaskTemplateModal;
