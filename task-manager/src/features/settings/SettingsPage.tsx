import React, { useState } from 'react';
import { useStore } from '@/store';
import { Select, Toggle, Input } from '@/components/ui';
import { ProfileSelector } from '@/components/profiles';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, exportData, importData, resetAllData } = useStore();
  const [autostartEnabled, setAutostartEnabled] = useState(false);

  React.useEffect(() => {
    // Check autostart status on mount
    isEnabled().then(setAutostartEnabled).catch(console.error);
  }, []);

  const handleToggleAutostart = async (checked: boolean) => {
    try {
      if (checked) {
        await enable();
      } else {
        await disable();
      }
      setAutostartEnabled(checked);
      await updateSettings({
        autostart: { enabled: checked },
      });
    } catch (error) {
      console.error('Failed to toggle autostart:', error);
      alert('Failed to change autostart setting');
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `task-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          await importData(text);
          alert('Data imported successfully!');
          window.location.reload();
        } catch (error) {
          console.error('Import failed:', error);
          alert('Failed to import data. Please check the file format.');
        }
      }
    };
    input.click();
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset ALL data? This cannot be undone!')) {
      try {
        await resetAllData();
        alert('All data has been reset');
        window.location.reload();
      } catch (error) {
        console.error('Reset failed:', error);
        alert('Failed to reset data');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Profile Settings */}
        <div className="card animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary mb-3">
              Switch between different profiles to organize your tasks, reminders, and data separately.
            </p>
            {/* This is not being shown over the card */}
            
            <ProfileSelector />
          </div>
        </div>

        {/* General Settings */}
        <div className="card animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Time Format</label>
              <Select
                options={[
                  { value: '12h', label: '12-hour (AM/PM)' },
                  { value: '24h', label: '24-hour' },
                ]}
                value={settings.timeFormat}
                onChange={(e) =>
                  updateSettings({
                    timeFormat: e.target.value as '12h' | '24h',
                  })
                }
              />
            </div>

            
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
            <Toggle
              label="Enable Notifications"
              checked={settings.notifications.enabled}
              onChange={(checked) =>
                updateSettings({
                  notifications: {
                    ...settings.notifications,
                    enabled: checked,
                  },
                })
              }
            />

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div>
                <label className="label">Tasks (minutes before)</label>
                <Input
                  type="number"
                  min="0"
                  value={settings.notifications.defaultLeadTimeMinutes.tasks}
                  onChange={(e) =>
                    updateSettings({
                      notifications: {
                        ...settings.notifications,
                        defaultLeadTimeMinutes: {
                          ...settings.notifications.defaultLeadTimeMinutes,
                          tasks: parseInt(e.target.value) || 0,
                        },
                      },
                    })
                  }
                />
              </div>

              <div>
                <label className="label">Reminders (minutes before)</label>
                <Input
                  type="number"
                  min="0"
                  value={settings.notifications.defaultLeadTimeMinutes.reminders}
                  onChange={(e) =>
                    updateSettings({
                      notifications: {
                        ...settings.notifications,
                        defaultLeadTimeMinutes: {
                          ...settings.notifications.defaultLeadTimeMinutes,
                          reminders: parseInt(e.target.value) || 0,
                        },
                      },
                    })
                  }
                />
              </div>

              <div>
                <label className="label">Calendar Events (minutes before)</label>
                <Input
                  type="number"
                  min="0"
                  value={settings.notifications.defaultLeadTimeMinutes.calendarEvents}
                  onChange={(e) =>
                    updateSettings({
                      notifications: {
                        ...settings.notifications,
                        defaultLeadTimeMinutes: {
                          ...settings.notifications.defaultLeadTimeMinutes,
                          calendarEvents: parseInt(e.target.value) || 0,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>

            {/* Sound Settings */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-lg font-semibold mb-4">Notification Sound</h3>
              
              <div className="space-y-4">
                <Toggle
                  label="Enable Sound"
                  checked={settings.notifications.sound?.enabled ?? true}
                  onChange={(checked) =>
                    updateSettings({
                      notifications: {
                        ...settings.notifications,
                        sound: {
                          ...settings.notifications.sound,
                          enabled: checked,
                          type: settings.notifications.sound?.type || 'bell',
                          volume: settings.notifications.sound?.volume || 50,
                        },
                      },
                    })
                  }
                />

                <div>
                  <label className="label">Sound Type</label>
                  <Select
                    value={settings.notifications.sound?.type || 'bell'}
                    options={[
                      { value: 'bell', label: '🔔 Bell' },
                      { value: 'chime', label: '🎵 Chime' },
                      { value: 'ding', label: '🔊 Ding' },
                      { value: 'pop', label: '🎉 Pop' },
                      { value: 'none', label: '🔇 None' },
                    ]}
                    onChange={(e) =>
                      updateSettings({
                        notifications: {
                          ...settings.notifications,
                          sound: {
                            ...settings.notifications.sound,
                            enabled: settings.notifications.sound?.enabled ?? true,
                            type: e.target.value as 'bell' | 'chime' | 'ding' | 'pop' | 'none',
                            volume: settings.notifications.sound?.volume || 50,
                          },
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <label className="label">Volume: {settings.notifications.sound?.volume || 50}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.notifications.sound?.volume || 50}
                    onChange={(e) =>
                      updateSettings({
                        notifications: {
                          ...settings.notifications,
                          sound: {
                            ...settings.notifications.sound,
                            enabled: settings.notifications.sound?.enabled ?? true,
                            type: settings.notifications.sound?.type || 'bell',
                            volume: parseInt(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full h-2 bg-surface-lighter rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <button
                    onClick={() => {
                      const audio = new Audio(`/sounds/${settings.notifications.sound?.type || 'bell'}.mp3`);
                      audio.volume = (settings.notifications.sound?.volume || 50) / 100;
                      audio.play().catch(err => console.warn('Could not play sound:', err));
                    }}
                    className="mt-2 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-medium transition-colors"
                  >
                    Test Sound
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Autostart Settings */}
        <div className="card animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">Autostart</h2>
          <div className="space-y-4">
            <Toggle
              label="Start app when system starts"
              checked={autostartEnabled}
              onChange={handleToggleAutostart}
            />
            <p className="text-sm text-text-secondary">
              When enabled, Task Manager will launch automatically when you start your computer and run in the system tray.
            </p>
          </div>
        </div>

        {/* Calendar Settings */}
        <div className="card animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">Calendar</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Sync Interval (minutes)</label>
              <Input
                type="number"
                min="5"
                value={settings.calendar.syncIntervalMinutes}
                onChange={(e) =>
                  updateSettings({
                    calendar: {
                      ...settings.calendar,
                      syncIntervalMinutes: parseInt(e.target.value) || 30,
                    },
                  })
                }
              />
            </div>
            <p className="text-sm text-text-secondary">
              Note: Full Google Calendar integration requires OAuth setup. See the Calendar tab for details.
            </p>
          </div>
        </div>

        {/* Data Management */}
        <div className="card animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">Data Management</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <button className="btn-secondary" onClick={handleExport}>
                Export Data (JSON)
              </button>
              <button className="btn-secondary" onClick={handleImport}>
                Import Data from JSON
              </button>
            </div>
            
            <div className="pt-6 mt-6 border-t border-danger/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="px-2 py-1 bg-danger/10 border border-danger/20 rounded">
                  <span className="text-xs font-bold uppercase tracking-wider text-danger">Danger Zone</span>
                </div>
              </div>
              <button className="btn-danger" onClick={handleReset}>
                Reset All Data
              </button>
              <p className="text-xs text-text-tertiary mt-2">
                This will permanently delete all tasks, reminders, calendar events, routines, and settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
