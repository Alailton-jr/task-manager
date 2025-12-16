import { create } from 'zustand';
import type {
  AppData,
  Task,
  Reminder,
  CalendarEvent,
  GoogleCalendar,
  RoutineBlock,
  Settings,
  GoogleAuthTokens,
  TaskTimer,
  TabType,
  TaskTemplate,
  PomodoroSession,
  Profile,
} from '@/types';
import { storageService } from '@/services/storage';
import { TimeUtils } from '@/services/time';
import { notificationService } from '@/services/notifications';

interface AppState extends AppData {
  // UI State
  currentTab: TabType;
  taskTimers: Record<string, TaskTimer>;
  isLoading: boolean;
  activePomodoroSession: PomodoroSession | null;
  pomodoroTimer: number; // seconds remaining
  
  // Actions
  init: () => Promise<void>;
  setCurrentTab: (tab: TabType) => void;
  
  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completionByDate'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string, date?: string) => Promise<void>;
  reorderTasks: (taskIds: string[]) => Promise<void>;
  
  // Task Timer Actions
  startTaskTimer: (taskId: string) => void;
  pauseTaskTimer: (taskId: string) => void;
  resetTaskTimer: (taskId: string) => void;
  setTimerElapsedTime: (taskId: string, seconds: number) => Promise<void>;
  
  // Task Template Actions
  addTaskTemplate: (template: Omit<TaskTemplate, 'id' | 'createdAt'>) => Promise<void>;
  updateTaskTemplate: (id: string, updates: Partial<TaskTemplate>) => Promise<void>;
  deleteTaskTemplate: (id: string) => Promise<void>;
  createTaskFromTemplate: (templateId: string) => Promise<void>;
  
  // Pomodoro Actions
  startPomodoroSession: (type: 'work' | 'shortBreak' | 'longBreak', taskId?: string) => void;
  completePomodoroSession: () => Promise<void>;
  interruptPomodoroSession: () => Promise<void>;
  updatePomodoroTimer: (seconds: number) => void;
  
  // Reminder Actions
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'notifiedAt'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  markReminderNotified: (id: string, timestamp: string) => Promise<void>;
  
  // Calendar Actions
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  setGoogleCalendars: (calendars: GoogleCalendar[]) => Promise<void>;
  toggleGoogleCalendar: (id: string) => Promise<void>;
  syncGoogleCalendars: () => Promise<{ success: boolean; eventCount: number }>;
  disconnectGoogleCalendar: () => Promise<void>;
  
  // Routine Actions
  addRoutineBlock: (block: Omit<RoutineBlock, 'id'>) => Promise<void>;
  updateRoutineBlock: (id: string, updates: Partial<RoutineBlock>) => Promise<void>;
  deleteRoutineBlock: (id: string) => Promise<void>;
  
  // Settings Actions
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  
  // Google Auth Actions
  setGoogleAuthTokens: (tokens: GoogleAuthTokens | undefined) => Promise<void>;
  
  // Profile Actions
  createProfile: (profile: Omit<Profile, 'id' | 'createdAt' | 'lastAccessedAt'>) => Promise<void>;
  updateProfile: (id: string, updates: Partial<Profile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  switchProfile: (id: string) => Promise<void>;
  
  // Data Management
  exportData: () => Promise<string>;
  importData: (jsonString: string) => Promise<void>;
  resetAllData: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial State
  tasks: [],
  reminders: [],
  calendarEvents: [],
  googleCalendars: [],
  routineBlocks: [],
  taskTemplates: [],
  pomodoroSessions: [],
  settings: {
    timeFormat: '24h',
    language: 'en',
    notifications: {
      enabled: true,
      defaultLeadTimeMinutes: {
        tasks: 15,
        reminders: 15,
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
  },
  googleAuthTokens: undefined,
  profiles: [],
  currentProfileId: '',
  currentTab: 'tasks',
  taskTimers: {},
  activePomodoroSession: null,
  pomodoroTimer: 0,
  isLoading: true,

  // Initialize
  init: async () => {
    try {
      await storageService.init();
      const data = await storageService.loadAll();
      set({
        ...data,
        isLoading: false,
      });
      
      // Schedule all notifications on app start
      const { notificationService } = await import('@/services/notifications');
      const state = get();
      notificationService.scheduleAll(
        state.tasks,
        state.reminders,
        state.calendarEvents,
        state.settings
      );
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ isLoading: false });
    }
  },

  setCurrentTab: (tab) => set({ currentTab: tab }),

  // Helper to reschedule notifications
  rescheduleNotifications: async () => {
    const { notificationService } = await import('@/services/notifications');
    const state = get();
    if (state.settings.notifications.enabled) {
      notificationService.scheduleAll(
        state.tasks,
        state.reminders,
        state.calendarEvents,
        state.settings
      );
    }
  },

  // Task Actions
  addTask: async (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completionByDate: {},
    };
    
    const state = get();
    const tasks = [newTask, ...state.tasks];
    set({ tasks });
    await storageService.saveTasks(tasks, state.currentProfileId);
    await (get() as any).rescheduleNotifications();
  },

  updateTask: async (id, updates) => {
    const state = get();
    const tasks = state.tasks.map((task) =>
      task.id === id ? { ...task, ...updates } : task
    );
    set({ tasks });
    await storageService.saveTasks(tasks, state.currentProfileId);
    await (get() as any).rescheduleNotifications();
  },

  deleteTask: async (id) => {
    const state = get();
    const tasks = state.tasks.filter((task) => task.id !== id);
    set({ tasks });
    await storageService.saveTasks(tasks, state.currentProfileId);
    await (get() as any).rescheduleNotifications();
  },

  reorderTasks: async (taskIds) => {
    const currentTasks = get().tasks;
    // Create a map of tasks by ID for quick lookup
    const taskMap = new Map(currentTasks.map(t => [t.id, t]));
    
    // Reorder: put the specified tasks in order, then append any not in the list
    const reorderedTasks = [
      ...taskIds.map(id => taskMap.get(id)).filter((t): t is Task => t !== undefined),
      ...currentTasks.filter(t => !taskIds.includes(t.id))
    ];
    
    set({ tasks: reorderedTasks });
    await storageService.saveTasks(reorderedTasks, get().currentProfileId);
  },

  toggleTaskCompletion: async (taskId, date) => {
    const dateStr = date || TimeUtils.getTodayDateString();
    const tasks = get().tasks.map((task) => {
      if (task.id === taskId) {
        const currentCompletion = task.completionByDate[dateStr];
        const completed = !currentCompletion?.completed;
        
        return {
          ...task,
          completionByDate: {
            ...task.completionByDate,
            [dateStr]: {
              completed,
              completedAt: completed ? new Date().toISOString() : undefined,
              actualDurationMinutes: currentCompletion?.actualDurationMinutes,
            },
          },
        };
      }
      return task;
    });
    
    set({ tasks });
    await storageService.saveTasks(tasks, get().currentProfileId);
  },

  // Task Timer Actions
  startTaskTimer: (taskId) => {
    const state = get();
    const timers = state.taskTimers;
    const existingTimer = timers[taskId];
    const task = state.tasks.find(t => t.id === taskId);
    
    const updatedTimers = {
      ...timers,
      [taskId]: {
        taskId,
        isRunning: true,
        startedAt: Date.now(),
        elapsedSeconds: existingTimer?.elapsedSeconds || 0,
        estimatedDurationMinutes: task?.estimatedDurationMinutes,
      },
    };
    
    set({ taskTimers: updatedTimers });
    storageService.saveTaskTimers(updatedTimers, state.currentProfileId);
  },

  pauseTaskTimer: (taskId) => {
    const state = get();
    const timers = state.taskTimers;
    const timer = timers[taskId];
    
    if (timer && timer.isRunning && timer.startedAt) {
      const elapsed = timer.elapsedSeconds + Math.floor((Date.now() - timer.startedAt) / 1000);
      
      // Check if time is up and send notification
      if (timer.estimatedDurationMinutes) {
        const estimatedSeconds = timer.estimatedDurationMinutes * 60;
        if (elapsed >= estimatedSeconds) {
          const task = state.tasks.find(t => t.id === taskId);
          if (task) {
            notificationService.send(
              'Task Timer Complete',
              `Time is up for: ${task.title}`
            );
          }
        }
      }
      
      const updatedTimers = {
        ...timers,
        [taskId]: {
          ...timer,
          isRunning: false,
          elapsedSeconds: elapsed,
          startedAt: undefined,
        },
      };
      
      set({ taskTimers: updatedTimers });
      storageService.saveTaskTimers(updatedTimers, state.currentProfileId);
    }
  },

  resetTaskTimer: (taskId) => {
    const state = get();
    const timers = { ...state.taskTimers };
    delete timers[taskId];
    set({ taskTimers: timers });
    storageService.saveTaskTimers(timers, state.currentProfileId);
  },

  setTimerElapsedTime: async (taskId, seconds) => {
    const state = get();
    const timers = state.taskTimers;
    const timer = timers[taskId];
    const task = state.tasks.find(t => t.id === taskId);
    
    const updatedTimers = {
      ...timers,
      [taskId]: {
        taskId,
        isRunning: timer?.isRunning || false,
        startedAt: timer?.startedAt,
        elapsedSeconds: seconds,
        estimatedDurationMinutes: task?.estimatedDurationMinutes,
      },
    };
    
    set({ taskTimers: updatedTimers });
    await storageService.saveTaskTimers(updatedTimers, state.currentProfileId);
  },

  // Reminder Actions
  addReminder: async (reminderData) => {
    const newReminder: Reminder = {
      ...reminderData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      notifiedAt: [],
    };
    
    const state = get();
    const reminders = [...state.reminders, newReminder];
    set({ reminders });
    await storageService.saveReminders(reminders, state.currentProfileId);
    await (get() as any).rescheduleNotifications();
  },

  updateReminder: async (id, updates) => {
    const state = get();
    const reminders = state.reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, ...updates } : reminder
    );
    set({ reminders });
    await storageService.saveReminders(reminders, state.currentProfileId);
    await (get() as any).rescheduleNotifications();
  },

  deleteReminder: async (id) => {
    const state = get();
    const reminders = state.reminders.filter((reminder) => reminder.id !== id);
    set({ reminders });
    await storageService.saveReminders(reminders, state.currentProfileId);
    await (get() as any).rescheduleNotifications();
  },

  markReminderNotified: async (id, timestamp) => {
    const state = get();
    const reminders = state.reminders.map((reminder) =>
      reminder.id === id
        ? { ...reminder, notifiedAt: [...reminder.notifiedAt, timestamp] }
        : reminder
    );
    set({ reminders });
    await storageService.saveReminders(reminders, state.currentProfileId);
  },

  // Calendar Actions
  addCalendarEvent: async (eventData) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: crypto.randomUUID(),
    };
    
    // If it's a Google Calendar event and we're authenticated, create it on Google
    if (eventData.source === 'google' && eventData.calendarId) {
      const { googleAuthTokens } = get();
      if (googleAuthTokens) {
        try {
          const { googleCalendarService } = await import('@/services/googleCalendar');
          const createdEvent = await googleCalendarService.createEvent(
            googleAuthTokens,
            eventData.calendarId,
            eventData
          );
          // Use the event with Google's ID
          newEvent.googleEventId = createdEvent.googleEventId;
        } catch (error) {
          console.error('Failed to create event on Google Calendar:', error);
          throw error;
        }
      }
    }
    
    const state = get();
    const calendarEvents = [...state.calendarEvents, newEvent];
    set({ calendarEvents });
    await storageService.saveCalendarEvents(calendarEvents, state.currentProfileId);
    await (get() as any).rescheduleNotifications();
  },

  updateCalendarEvent: async (id, updates) => {
    const event = get().calendarEvents.find((e) => e.id === id);
    
    // If it's a Google Calendar event, update it on Google
    if (event?.source === 'google' && event.googleEventId && event.calendarId) {
      const { googleAuthTokens } = get();
      if (googleAuthTokens) {
        try {
          const { googleCalendarService } = await import('@/services/googleCalendar');
          await googleCalendarService.updateEvent(
            googleAuthTokens,
            event.calendarId,
            event.googleEventId,
            { ...event, ...updates }
          );
        } catch (error) {
          console.error('Failed to update event on Google Calendar:', error);
          throw error;
        }
      }
    }
    
    const state = get();
    const calendarEvents = state.calendarEvents.map((event) =>
      event.id === id ? { ...event, ...updates } : event
    );
    set({ calendarEvents });
    await storageService.saveCalendarEvents(calendarEvents, state.currentProfileId);
    await (get() as any).rescheduleNotifications();
  },

  deleteCalendarEvent: async (id) => {
    const event = get().calendarEvents.find((e) => e.id === id);
    
    // If it's a Google Calendar event, delete it from Google
    if (event?.source === 'google' && event.googleEventId && event.calendarId) {
      const { googleAuthTokens } = get();
      if (googleAuthTokens) {
        try {
          const { googleCalendarService } = await import('@/services/googleCalendar');
          await googleCalendarService.deleteEvent(
            googleAuthTokens,
            event.calendarId,
            event.googleEventId
          );
        } catch (error) {
          console.error('Failed to delete event from Google Calendar:', error);
          throw error;
        }
      }
    }
    
    const state = get();
    const calendarEvents = state.calendarEvents.filter((event) => event.id !== id);
    set({ calendarEvents });
    await storageService.saveCalendarEvents(calendarEvents, state.currentProfileId);
    await (get() as any).rescheduleNotifications();
  },

  setGoogleCalendars: async (calendars) => {
    const state = get();
    set({ googleCalendars: calendars });
    await storageService.saveGoogleCalendars(calendars, state.currentProfileId);
  },

  toggleGoogleCalendar: async (id) => {
    const state = get();
    const googleCalendars = state.googleCalendars.map((cal) =>
      cal.id === id ? { ...cal, enabled: !cal.enabled } : cal
    );
    set({ googleCalendars });
    await storageService.saveGoogleCalendars(googleCalendars, state.currentProfileId);
  },

  syncGoogleCalendars: async () => {
    const { googleAuthTokens, googleCalendars } = get();
    
    if (!googleAuthTokens) {
      throw new Error('Not authenticated with Google Calendar');
    }

    try {
      const { googleCalendarService } = await import('@/services/googleCalendar');
      const { calendars, events } = await googleCalendarService.syncCalendars(
        googleAuthTokens,
        googleCalendars
      );
      
      // Update tokens if they were refreshed
      const validTokens = await googleCalendarService.ensureValidTokens(googleAuthTokens);
      if (validTokens.accessToken !== googleAuthTokens.accessToken) {
        await get().setGoogleAuthTokens(validTokens);
      }
      
      // Update calendars and events
      const profileId = get().currentProfileId;
      set({ googleCalendars: calendars, calendarEvents: events });
      await storageService.saveGoogleCalendars(calendars, profileId);
      await storageService.saveCalendarEvents(events, profileId);

      // Reschedule all notifications after sync
      await (get() as any).rescheduleNotifications();
      
      return { success: true, eventCount: events.length };
    } catch (error) {
      console.error('Calendar sync failed:', error);
      throw error;
    }
  },

  disconnectGoogleCalendar: async () => {
    const localEvents = get().calendarEvents.filter((e: CalendarEvent) => e.source === 'local');
    
    const profileId = get().currentProfileId;
    set({ 
      googleAuthTokens: undefined, 
      googleCalendars: [],
      calendarEvents: localEvents
    });
    await storageService.saveGoogleAuthTokens(undefined);
    await storageService.saveGoogleCalendars([], profileId);
    await storageService.saveCalendarEvents(localEvents, profileId);
    
    const { googleCalendarService } = await import('@/services/googleCalendar');
    googleCalendarService.disconnect();
  },

  // Routine Actions
  addRoutineBlock: async (blockData) => {
    const newBlock: RoutineBlock = {
      ...blockData,
      id: crypto.randomUUID(),
    };
    
    const state = get();
    const routineBlocks = [...state.routineBlocks, newBlock];
    set({ routineBlocks });
    await storageService.saveRoutineBlocks(routineBlocks, state.currentProfileId);
  },

  updateRoutineBlock: async (id, updates) => {
    const state = get();
    const routineBlocks = state.routineBlocks.map((block) =>
      block.id === id ? { ...block, ...updates } : block
    );
    set({ routineBlocks });
    await storageService.saveRoutineBlocks(routineBlocks, state.currentProfileId);
  },

  deleteRoutineBlock: async (id) => {
    const state = get();
    const routineBlocks = state.routineBlocks.filter((block) => block.id !== id);
    set({ routineBlocks });
    await storageService.saveRoutineBlocks(routineBlocks, state.currentProfileId);
  },

  // Settings Actions
  updateSettings: async (updates) => {
    const settings = { ...get().settings, ...updates };
    set({ settings });
    await storageService.saveSettings(settings);
  },

  // Google Auth Actions
  setGoogleAuthTokens: async (tokens) => {
    set({ googleAuthTokens: tokens });
    await storageService.saveGoogleAuthTokens(tokens);
  },

  // Data Management
  exportData: async () => {
    return await storageService.exportData();
  },

  importData: async (jsonString) => {
    await storageService.importData(jsonString);
    const data = await storageService.loadAll();
    set(data);
  },

  resetAllData: async () => {
    await storageService.resetAll();
    const data = await storageService.loadAll();
    set(data);
  },

  // Task Template Actions
  addTaskTemplate: async (templateData) => {
    const newTemplate: TaskTemplate = {
      ...templateData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    
    const state = get();
    const taskTemplates = [...state.taskTemplates, newTemplate];
    set({ taskTemplates });
    await storageService.saveTaskTemplates(taskTemplates, state.currentProfileId);
  },

  updateTaskTemplate: async (id, updates) => {
    const state = get();
    const taskTemplates = state.taskTemplates.map((template) =>
      template.id === id ? { ...template, ...updates } : template
    );
    set({ taskTemplates });
    await storageService.saveTaskTemplates(taskTemplates, state.currentProfileId);
  },

  deleteTaskTemplate: async (id) => {
    const state = get();
    const taskTemplates = state.taskTemplates.filter((template) => template.id !== id);
    set({ taskTemplates });
    await storageService.saveTaskTemplates(taskTemplates, state.currentProfileId);
  },

  createTaskFromTemplate: async (templateId) => {
    const template = get().taskTemplates.find((t) => t.id === templateId);
    if (!template) return;

    await get().addTask({
      title: template.name,
      description: template.description,
      category: template.category,
      estimatedDurationMinutes: template.estimatedDurationMinutes,
      isRepeatable: template.isRepeatable,
      repeatPattern: template.repeatPattern,
      repeatDaysOfWeek: template.repeatDaysOfWeek,
      startTime: template.startTime,
      active: true,
    });
  },

  // Pomodoro Actions
  startPomodoroSession: (type, taskId) => {
    const { settings, pomodoroSessions } = get();
    let duration: number;
    
    switch (type) {
      case 'work':
        duration = settings.pomodoro.workDuration;
        break;
      case 'shortBreak':
        duration = settings.pomodoro.shortBreakDuration;
        break;
      case 'longBreak':
        duration = settings.pomodoro.longBreakDuration;
        break;
    }

    // Calculate session number (count of work sessions in current cycle)
    const workSessions = pomodoroSessions.filter(s => s.type === 'work' && !s.interrupted);
    const sessionNumber = workSessions.length + 1;

    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 60000);

    const session: PomodoroSession = {
      id: crypto.randomUUID(),
      sessionNumber,
      taskId,
      type,
      durationMinutes: duration,
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      startedAt: now.toISOString(),
      interrupted: false,
    };

    set({ 
      activePomodoroSession: session,
      pomodoroTimer: duration * 60, // convert to seconds
    });
  },

  completePomodoroSession: async () => {
    const { activePomodoroSession, pomodoroSessions } = get();
    if (!activePomodoroSession) return;

    const completedSession: PomodoroSession = {
      ...activePomodoroSession,
      completedAt: new Date().toISOString(),
    };

    const updatedSessions = [...pomodoroSessions, completedSession];
    set({ 
      pomodoroSessions: updatedSessions,
      activePomodoroSession: null,
      pomodoroTimer: 0,
    });
    await storageService.savePomodoroSessions(updatedSessions, get().currentProfileId);
  },

  interruptPomodoroSession: async () => {
    const { activePomodoroSession, pomodoroSessions } = get();
    if (!activePomodoroSession) return;

    const interruptedSession: PomodoroSession = {
      ...activePomodoroSession,
      completedAt: new Date().toISOString(),
      interrupted: true,
    };

    const updatedSessions = [...pomodoroSessions, interruptedSession];
    set({ 
      pomodoroSessions: updatedSessions,
      activePomodoroSession: null,
      pomodoroTimer: 0,
    });
    await storageService.savePomodoroSessions(updatedSessions, get().currentProfileId);
  },

  updatePomodoroTimer: (seconds) => {
    set({ pomodoroTimer: seconds });
  },

  // Profile Actions
  createProfile: async (profileData) => {
    const newProfile: Profile = {
      ...profileData,
      id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    };
    
    const profiles = [...get().profiles, newProfile];
    set({ profiles });
    await storageService.saveProfiles(profiles);
  },

  updateProfile: async (id, updates) => {
    const profiles = get().profiles.map((profile) =>
      profile.id === id ? { ...profile, ...updates } : profile
    );
    set({ profiles });
    await storageService.saveProfiles(profiles);
  },

  deleteProfile: async (id) => {
    const { profiles, currentProfileId } = get();
    
    // Prevent deleting the current profile if it's the only one
    if (profiles.length === 1) {
      throw new Error('Cannot delete the only profile');
    }
    
    // Prevent deleting the current profile
    if (id === currentProfileId) {
      throw new Error('Cannot delete the currently active profile. Switch to another profile first.');
    }
    
    await storageService.deleteProfile(id);
    const updatedProfiles = profiles.filter((p) => p.id !== id);
    set({ profiles: updatedProfiles });
  },

  switchProfile: async (id) => {
    const state = get();
    const profile = state.profiles.find((p) => p.id === id);
    
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    // Save current data before switching
    await storageService.saveAll(state);
    
    // Update profile's last accessed time
    await storageService.updateProfile(id, { lastAccessedAt: new Date().toISOString() });
    
    // Load new profile data
    await storageService.saveCurrentProfileId(id);
    const data = await storageService.loadAll();
    
    // Clear task timers when switching profiles
    set({
      ...data,
      taskTimers: {},
      activePomodoroSession: null,
      pomodoroTimer: 0,
    });
    
    // Reschedule notifications for new profile
    await (get() as any).rescheduleNotifications();
  },
}));
