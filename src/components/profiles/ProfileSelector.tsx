import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { ProfileModal } from './ProfileModal';
import type { Profile } from '@/types';

export const ProfileSelector: React.FC = () => {
  const { profiles, currentProfileId, switchProfile, deleteProfile } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentProfile = profiles.find(p => p.id === currentProfileId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowDeleteConfirm(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchProfile = async (profileId: string) => {
    if (profileId === currentProfileId) {
      setIsOpen(false);
      return;
    }

    try {
      await switchProfile(profileId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch profile:', error);
    }
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const handleDelete = async (profileId: string) => {
    try {
      await deleteProfile(profileId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete profile:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete profile');
    }
  };

  const handleNewProfile = () => {
    setEditingProfile(undefined);
    setIsModalOpen(true);
    setIsOpen(false);
  };

  if (!currentProfile) return null;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-surface-lighter border border-white/10 rounded-lg hover:border-accent/30 transition-all group"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-transform group-hover:scale-110"
            style={{ backgroundColor: currentProfile.color }}
          >
            {currentProfile.emoji}
          </div>
          <span className="text-text-primary font-medium hidden sm:inline">
            {currentProfile.name}
          </span>
          <svg
            className={`w-4 h-4 text-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-surface border border-white/10 rounded-lg shadow-2xl z-50 animate-slide-up">
            <div className="p-2 border-b border-white/10">
              <div className="text-xs text-text-tertiary uppercase tracking-wider px-2 py-1">
                Profiles
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {profiles.map((profile) => (
                <div key={profile.id} className="relative">
                  {showDeleteConfirm === profile.id ? (
                    <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                      <p className="text-sm text-text-primary mb-2">Delete this profile?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(profile.id)}
                          className="flex-1 px-3 py-1.5 bg-danger text-white rounded text-sm hover:bg-danger/90 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="flex-1 px-3 py-1.5 bg-surface-lighter text-text-secondary rounded text-sm hover:bg-surface transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSwitchProfile(profile.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group
                        ${profile.id === currentProfileId
                          ? 'bg-accent/10 border border-accent/30'
                          : 'hover:bg-surface-lighter border border-transparent'
                        }
                      `}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: profile.color }}
                      >
                        {profile.emoji}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-text-primary font-medium truncate">
                          {profile.name}
                        </div>
                        {profile.id === currentProfileId && (
                          <div className="text-xs text-accent">Active</div>
                        )}
                      </div>
                      {profile.id !== currentProfileId && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(profile);
                            }}
                            className="p-1 hover:bg-surface rounded text-text-tertiary hover:text-accent transition-colors"
                            title="Edit profile"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(profile.id);
                            }}
                            className="p-1 hover:bg-danger/10 rounded text-text-tertiary hover:text-danger transition-colors"
                            title="Delete profile"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-2 border-t border-white/10">
              <button
                onClick={handleNewProfile}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-accent/10 text-accent rounded-lg hover:bg-accent hover:text-white transition-all font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Profile
              </button>
            </div>
          </div>
        )}
      </div>

      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={editingProfile}
      />
    </>
  );
};
