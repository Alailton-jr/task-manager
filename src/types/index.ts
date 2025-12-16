// ============= Task Types =============
export interface Task {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority?: 'A' | 'B' | 'C';
  estimatedDurationMinutes?: number; // Made optional
  isRepeatable: boolean;
  repeatPattern: 'none' | 'daily' | 'weekly' | 'custom';
  repeatDaysOfWeek?: number[]; // 0-6, for weekly pattern
  repeatInterval?: number; // For custom pattern: number of days/hours
  repeatIntervalUnit?: 'hours' | 'days'; // Unit for custom interval
  startTime?: string; // HH:MM format
  active: boolean;
  createdAt: string;
  completionByDate: Record<string, TaskCompletion>; // YYYY-MM-DD -> completion
}

export interface TaskCompletion {
  completed: boolean;
  actualDurationMinutes?: number;
  completedAt?: string;
}

export interface TaskTimer {
  taskId: string;
  isRunning: boolean;
  startedAt?: number; // timestamp
  elapsedSeconds: number;
  estimatedDurationMinutes?: number; // for countdown tracking
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  priority?: 'A' | 'B' | 'C';
  estimatedDurationMinutes?: number; // Made optional
  isRepeatable: boolean;
  repeatPattern: 'none' | 'daily' | 'weekly' | 'custom';
  repeatDaysOfWeek?: number[];
  repeatInterval?: number;
  repeatIntervalUnit?: 'hours' | 'days';
  startTime?: string;
  icon?: string; // emoji or icon identifier
  createdAt: string;
}

export interface PomodoroSession {
  id: string;
  sessionNumber: number;
  taskId?: string;
  type: 'work' | 'shortBreak' | 'longBreak';
  durationMinutes: number;
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp
  startedAt: string; // ISO timestamp (alias for compatibility)
  completedAt?: string;
  interrupted: boolean;
}

export interface Profile {
  id: string;
  name: string;
  color?: string; // hex color for visual distinction
  emoji?: string; // emoji icon for profile
  createdAt: string;
  lastAccessedAt: string;
}

export interface PomodoroSettings {
  workDuration: number; // minutes, default 25
  shortBreakDuration: number; // minutes, default 5
  longBreakDuration: number; // minutes, default 15
  sessionsUntilLongBreak: number; // default 4
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  autoStartWork: boolean;
}

// ============= Reminder Types =============
export interface Reminder {
  id: string;
  title: string;
  description?: string;
  type?: 'birthday' | 'event' | 'custom';
  eventDateTime: string; // ISO timestamp
  isAllDay: boolean;
  notificationOffsets: number[]; // minutes relative to event, negative for before
  repeatPattern?: 'none' | 'yearly';
  active: boolean;
  createdAt: string;
  notifiedAt: string[]; // ISO timestamps of when notifications were sent
}

// ============= Calendar Types =============
export interface CalendarEvent {
  id: string;
  googleEventId?: string;
  calendarId?: string;
  title: string;
  description?: string;
  location?: string;
  meetLink?: string; // Google Meet or other video conference link
  startDateTime: string; // ISO timestamp
  endDateTime: string; // ISO timestamp
  isAllDay: boolean;
  reminders?: number[]; // minutes before event
  color?: string;
  source: 'google' | 'local';
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  enabled: boolean;
}

export interface GoogleAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp
}

// ============= Routine Types =============
export interface RoutineBlock {
  id: string;
  label: string;
  taskId?: string; // optional link to a Task
  dayType: 'everyday' | 'weekday' | 'weekend' | 'specificDays';
  daysOfWeek?: number[]; // 0-6 for specific days
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  color?: string;
}

// ============= Settings Types =============
export interface Settings {
  timeFormat: '12h' | '24h';
  language: string;
  notifications: {
    enabled: boolean;
    defaultLeadTimeMinutes: {
      tasks: number;
      reminders: number;
      calendarEvents: number;
    };
    sound: {
      enabled: boolean;
      type: 'bell' | 'chime' | 'ding' | 'pop' | 'none';
      volume: number; // 0-100
    };
  };
  autostart: {
    enabled: boolean;
  };
  calendar: {
    syncIntervalMinutes: number;
    enabledCalendars: string[];
  };
  pomodoro: PomodoroSettings;
  viewPreferences: {
    tasksViewMode: 'list' | 'grid' | 'compact';
    calendarViewMode: 'week' | 'month';
  };
}

// ============= Store Structure =============
export interface AppData {
  tasks: Task[];
  reminders: Reminder[];
  calendarEvents: CalendarEvent[];
  googleCalendars: GoogleCalendar[];
  routineBlocks: RoutineBlock[];
  taskTemplates: TaskTemplate[];
  pomodoroSessions: PomodoroSession[];
  settings: Settings;
  googleAuthTokens?: GoogleAuthTokens;
  profiles: Profile[];
  currentProfileId: string;
  taskTimers: Record<string, TaskTimer>;
}

// ============= UI State Types =============
export type TabType = 'tasks' | 'reminders' | 'calendar' | 'routine' | 'settings' | 'analytics';

export interface UpcomingItem {
  id: string;
  type: 'task' | 'reminder' | 'event' | 'routine';
  title: string;
  time: string; // ISO timestamp
  color?: string;
}

export interface ProductivityStats {
  totalTasksCompleted: number;
  totalTimeSpent: number; // minutes
  completionRate: number; // percentage
  averageDuration: number; // minutes
  mostProductiveDay: string;
  mostProductiveHour: number;
  tasksByCategory: Record<string, number>;
  completionsByDate: Record<string, number>;
  pomodoroSessionsCompleted: number;
}
