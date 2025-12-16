import React, { useState, useEffect } from 'react';
import { useStore } from '@/store';
import type { Profile } from '@/types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: Profile; // If editing existing profile
}

const EMOJI_OPTIONS = ['👤', '💼', '🏠', '🎯', '⭐', '🚀', '💡', '🎨', '📚', '🏆'];
const COLOR_OPTIONS = [
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1', // indigo
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, profile }) => {
  const { createProfile, updateProfile } = useStore();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmoji(profile.emoji || EMOJI_OPTIONS[0]);
      setColor(profile.color || COLOR_OPTIONS[0]);
    } else {
      setName('');
      setEmoji(EMOJI_OPTIONS[0]);
      setColor(COLOR_OPTIONS[0]);
    }
    setError('');
  }, [profile, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Profile name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (profile) {
        await updateProfile(profile.id, { name: name.trim(), emoji, color });
      } else {
        await createProfile({ name: name.trim(), emoji, color });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-slide-up">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-text-primary">
            {profile ? 'Edit Profile' : 'Create Profile'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          {/* Profile Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Profile Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Personal, Work, Study"
              className="w-full px-4 py-3 bg-surface-lighter border border-white/10 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              maxLength={30}
              autoFocus
            />
          </div>

          {/* Emoji Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              Icon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {EMOJI_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setEmoji(option)}
                  className={`
                    text-3xl p-3 rounded-lg border-2 transition-all
                    ${emoji === option
                      ? 'border-accent bg-accent/10 scale-110'
                      : 'border-white/10 bg-surface-lighter hover:border-accent/50'
                    }
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">
              Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  className={`
                    h-12 rounded-lg border-2 transition-all
                    ${color === option
                      ? 'border-white scale-110'
                      : 'border-white/10 hover:border-white/30'
                    }
                  `}
                  style={{ backgroundColor: option }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-surface-lighter border border-white/10 rounded-lg">
            <div className="text-xs text-text-tertiary mb-2">Preview</div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: color }}
              >
                {emoji}
              </div>
              <span className="text-text-primary font-medium">{name || 'Profile Name'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-surface-lighter text-text-secondary rounded-lg hover:bg-surface transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : profile ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
