import { Store } from '@tauri-apps/plugin-store';
import type { AppData, Settings, Profile } from '@/types';

// Default settings
const DEFAULT_SETTINGS: Settings = {
  timeFormat: '24h',
  language: 'en',
  notifications: {
    enabled: true,
    defaultLeadTimeMinutes: {
      tasks: 15,
      reminders: 5,
      calendarEvents: 15,
    },
    sound: {
      enabled: true,
      type: 'bell',
      volume: 50,
    },
  },
  autostart: {
    enabled: false,
  },
  calendar: {
    syncIntervalMinutes: 30,
    enabledCalendars: [],
  },
  pomodoro: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    autoStartWork: false,
  },
  viewPreferences: {
    tasksViewMode: 'list',
    calendarViewMode: 'week',
  },
};

// Generate default profile ID
const generateDefaultProfileId = (): string => {
  return `profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Default app data
const DEFAULT_APP_DATA: AppData = {
  tasks: [],
  reminders: [],
  calendarEvents: [],
  googleCalendars: [],
  routineBlocks: [],
  taskTemplates: [],
  pomodoroSessions: [],
  settings: DEFAULT_SETTINGS,
  profiles: [],
  currentProfileId: '',
  taskTimers: {},
};

class StorageService {
  private store: Store | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      this.store = await Store.load('tasks.json');
      this.initialized = true;
      
      // Initialize with defaults and migrate existing data if needed
      await this.initializeWithMigration();
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  private async initializeWithMigration(): Promise<void> {
    // Check if profiles exist
    const profiles = ((await this.store!.get('profiles')) as Profile[]) || [];

    // Migration: If no profiles exist but we have old data, migrate it to a default profile
    if (profiles.length === 0) {
      const existingTasks = ((await this.store!.get('tasks')) as any[]) || [];
      const existingReminders = ((await this.store!.get('reminders')) as any[]) || [];
      const existingEvents = ((await this.store!.get('calendarEvents')) as any[]) || [];
      const existingCalendars = ((await this.store!.get('googleCalendars')) as any[]) || [];
      const existingRoutines = ((await this.store!.get('routineBlocks')) as any[]) || [];
      const existingTemplates = ((await this.store!.get('taskTemplates')) as any[]) || [];
      const existingSessions = ((await this.store!.get('pomodoroSessions')) as any[]) || [];

      const hasExistingData = existingTasks.length > 0 || existingReminders.length > 0 || 
                             existingEvents.length > 0 || existingCalendars.length > 0 ||
                             existingRoutines.length > 0 || existingTemplates.length > 0 ||
                             existingSessions.length > 0;

      if (hasExistingData || profiles.length === 0) {
        // Create default profile
        const defaultProfile: Profile = {
          id: generateDefaultProfileId(),
          name: 'Personal',
          emoji: '👤',
          color: '#10b981',
          createdAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
        };

        // Save profile
        await this.store!.set('profiles', [defaultProfile]);
        await this.store!.set('currentProfileId', defaultProfile.id);

        // Migrate existing data to profile-specific keys
        if (hasExistingData) {
          await this.store!.set(`tasks_${defaultProfile.id}`, existingTasks);
          await this.store!.set(`reminders_${defaultProfile.id}`, existingReminders);
          await this.store!.set(`calendarEvents_${defaultProfile.id}`, existingEvents);
          await this.store!.set(`googleCalendars_${defaultProfile.id}`, existingCalendars);
          await this.store!.set(`routineBlocks_${defaultProfile.id}`, existingRoutines);
          await this.store!.set(`taskTemplates_${defaultProfile.id}`, existingTemplates);
          await this.store!.set(`pomodoroSessions_${defaultProfile.id}`, existingSessions);

          // Clean up old keys
          await this.store!.delete('tasks');
          await this.store!.delete('reminders');
          await this.store!.delete('calendarEvents');
          await this.store!.delete('googleCalendars');
          await this.store!.delete('routineBlocks');
          await this.store!.delete('taskTemplates');
          await this.store!.delete('pomodoroSessions');
        }

        await this.store!.save();
      }
    }

    // Ensure settings exist
    const settings = ((await this.store!.get('settings')) as any) || null;
    if (!settings) {
      await this.store!.set('settings', DEFAULT_SETTINGS);
      await this.store!.save();
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.store) {
      throw new Error('Storage not initialized. Call init() first.');
    }
  }

  async loadAll(): Promise<AppData> {
    this.ensureInitialized();
    
    try {
      const profiles = ((await this.store!.get('profiles')) as Profile[]) || [];
      const currentProfileId = ((await this.store!.get('currentProfileId')) as string) || '';
      
      // Load profile-specific data
      const tasks = currentProfileId ? ((await this.store!.get(`tasks_${currentProfileId}`)) as any[]) || [] : [];
      const reminders = currentProfileId ? ((await this.store!.get(`reminders_${currentProfileId}`)) as any[]) || [] : [];
      const calendarEvents = currentProfileId ? ((await this.store!.get(`calendarEvents_${currentProfileId}`)) as any[]) || [] : [];
      const googleCalendars = currentProfileId ? ((await this.store!.get(`googleCalendars_${currentProfileId}`)) as any[]) || [] : [];
      const routineBlocks = currentProfileId ? ((await this.store!.get(`routineBlocks_${currentProfileId}`)) as any[]) || [] : [];
      const taskTemplates = currentProfileId ? ((await this.store!.get(`taskTemplates_${currentProfileId}`)) as any[]) || [] : [];
      const pomodoroSessions = currentProfileId ? ((await this.store!.get(`pomodoroSessions_${currentProfileId}`)) as any[]) || [] : [];
      const taskTimers = currentProfileId ? ((await this.store!.get(`taskTimers_${currentProfileId}`)) as any) || {} : {};
      
      // Load global data (shared across profiles)
      const settings = ((await this.store!.get('settings')) as any) || DEFAULT_SETTINGS;
      const googleAuthTokens = ((await this.store!.get('googleAuthTokens')) as any) || undefined;

      return {
        tasks,
        reminders,
        calendarEvents,
        googleCalendars,
        routineBlocks,
        taskTemplates,
        pomodoroSessions,
        settings,
        googleAuthTokens,
        profiles,
        currentProfileId,
        taskTimers,
      };
    } catch (error) {
      console.error('Failed to load data:', error);
      return DEFAULT_APP_DATA;
    }
  }

  async saveAll(data: AppData): Promise<void> {
    this.ensureInitialized();
    
    try {
      // Save profile-specific data
      if (data.currentProfileId) {
        await this.store!.set(`tasks_${data.currentProfileId}`, data.tasks);
        await this.store!.set(`reminders_${data.currentProfileId}`, data.reminders);
        await this.store!.set(`calendarEvents_${data.currentProfileId}`, data.calendarEvents);
        await this.store!.set(`googleCalendars_${data.currentProfileId}`, data.googleCalendars);
        await this.store!.set(`routineBlocks_${data.currentProfileId}`, data.routineBlocks);
        await this.store!.set(`taskTemplates_${data.currentProfileId}`, data.taskTemplates);
        await this.store!.set(`pomodoroSessions_${data.currentProfileId}`, data.pomodoroSessions);
        await this.store!.set(`taskTimers_${data.currentProfileId}`, data.taskTimers);
      }
      
      // Save global data
      await this.store!.set('profiles', data.profiles);
      await this.store!.set('currentProfileId', data.currentProfileId);
      await this.store!.set('settings', data.settings);
      if (data.googleAuthTokens) {
        await this.store!.set('googleAuthTokens', data.googleAuthTokens);
      }
      await this.store!.save();
    } catch (error) {
      console.error('Failed to save data:', error);
      throw error;
    }
  }

  async saveTasks(tasks: AppData['tasks'], profileId: string): Promise<void> {
    this.ensureInitialized();
    await this.store!.set(`tasks_${profileId}`, tasks);
    await this.store!.save();
  }

  async saveReminders(reminders: AppData['reminders'], profileId: string): Promise<void> {
    this.ensureInitialized();
    await this.store!.set(`reminders_${profileId}`, reminders);
    await this.store!.save();
  }

  async saveCalendarEvents(events: AppData['calendarEvents'], profileId: string): Promise<void> {
    this.ensureInitialized();
    await this.store!.set(`calendarEvents_${profileId}`, events);
    await this.store!.save();
  }

  async saveGoogleCalendars(calendars: AppData['googleCalendars'], profileId: string): Promise<void> {
    this.ensureInitialized();
    await this.store!.set(`googleCalendars_${profileId}`, calendars);
    await this.store!.save();
  }

  async saveRoutineBlocks(blocks: AppData['routineBlocks'], profileId: string): Promise<void> {
    this.ensureInitialized();
    await this.store!.set(`routineBlocks_${profileId}`, blocks);
    await this.store!.save();
  }

  async saveTaskTemplates(templates: AppData['taskTemplates'], profileId: string): Promise<void> {
    this.ensureInitialized();
    await this.store!.set(`taskTemplates_${profileId}`, templates);
    await this.store!.save();
  }

  async savePomodoroSessions(sessions: AppData['pomodoroSessions'], profileId: string): Promise<void> {
    this.ensureInitialized();
    await this.store!.set(`pomodoroSessions_${profileId}`, sessions);
    await this.store!.save();
  }

  async saveSettings(settings: AppData['settings']): Promise<void> {
    this.ensureInitialized();
    await this.store!.set('settings', settings);
    await this.store!.save();
  }

  async saveGoogleAuthTokens(tokens: AppData['googleAuthTokens']): Promise<void> {
    this.ensureInitialized();
    if (tokens) {
      await this.store!.set('googleAuthTokens', tokens);
    } else {
      await this.store!.delete('googleAuthTokens');
    }
    await this.store!.save();
  }

  async saveTaskTimers(timers: AppData['taskTimers'], profileId: string): Promise<void> {
    this.ensureInitialized();
    await this.store!.set(`taskTimers_${profileId}`, timers);
    await this.store!.save();
  }

  // Profile management methods
  async saveProfiles(profiles: Profile[]): Promise<void> {
    this.ensureInitialized();
    await this.store!.set('profiles', profiles);
    await this.store!.save();
  }

  async saveCurrentProfileId(profileId: string): Promise<void> {
    this.ensureInitialized();
    await this.store!.set('currentProfileId', profileId);
    await this.store!.save();
  }

  async createProfile(profile: Profile): Promise<void> {
    this.ensureInitialized();
    const profiles = ((await this.store!.get('profiles')) as Profile[]) || [];
    profiles.push(profile);
    await this.saveProfiles(profiles);
  }

  async updateProfile(profileId: string, updates: Partial<Profile>): Promise<void> {
    this.ensureInitialized();
    const profiles = ((await this.store!.get('profiles')) as Profile[]) || [];
    const index = profiles.findIndex(p => p.id === profileId);
    if (index !== -1) {
      profiles[index] = { ...profiles[index], ...updates };
      await this.saveProfiles(profiles);
    }
  }

  async deleteProfile(profileId: string): Promise<void> {
    this.ensureInitialized();
    const profiles = ((await this.store!.get('profiles')) as Profile[]) || [];
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    await this.saveProfiles(updatedProfiles);

    // Delete all profile-specific data
    await this.store!.delete(`tasks_${profileId}`);
    await this.store!.delete(`reminders_${profileId}`);
    await this.store!.delete(`calendarEvents_${profileId}`);
    await this.store!.delete(`googleCalendars_${profileId}`);
    await this.store!.delete(`routineBlocks_${profileId}`);
    await this.store!.delete(`taskTemplates_${profileId}`);
    await this.store!.delete(`pomodoroSessions_${profileId}`);
    await this.store!.save();
  }

  async exportData(): Promise<string> {
    const data = await this.loadAll();
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString) as AppData;
      await this.saveAll(data);
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Invalid JSON data');
    }
  }

  async resetAll(): Promise<void> {
    await this.saveAll(DEFAULT_APP_DATA);
  }
}

// Singleton instance
export const storageService = new StorageService();
