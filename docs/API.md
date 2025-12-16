# API Documentation

Technical reference for Task Manager's internal APIs and data models.

## Table of Contents

- [Data Models](#data-models)
- [Store API](#store-api)
- [Services](#services)
- [Tauri Commands](#tauri-commands)
- [Storage Format](#storage-format)

## Data Models

### Task

```typescript
interface Task {
  id: string;                    // UUID
  title: string;                 // Task name
  description?: string;          // Optional details
  category: TaskCategory;        // Work | Personal | Health | Learning | Other
  estimatedDuration: number;     // Minutes
  repeatPattern: RepeatPattern;  // daily | weekly | one-time
  preferredTime?: string;        // HH:mm format
  completedToday: boolean;       // Daily completion status
  completedDates: string[];      // ISO date strings
  createdAt: string;             // ISO datetime
  lastCompletedAt?: string;      // ISO datetime
  tags: string[];                // User-defined labels
  timerStartedAt?: number;       // Timestamp when timer started
  timerElapsed: number;          // Seconds elapsed
  timerPausedAt?: number;        // Timestamp when timer paused
}

type TaskCategory = 'work' | 'personal' | 'health' | 'learning' | 'other';
type RepeatPattern = 'daily' | 'weekly' | 'one-time';
```

### Reminder

```typescript
interface Reminder {
  id: string;                    // UUID
  title: string;                 // Event name
  type: ReminderType;            // event | birthday | custom
  datetime: string;              // ISO datetime
  notificationOffsets: number[]; // Minutes before event
  repeatYearly: boolean;         // For birthdays/anniversaries
  notified: boolean;             // Has notification been sent
  createdAt: string;             // ISO datetime
}

type ReminderType = 'event' | 'birthday' | 'custom';
```

### Routine Block

```typescript
interface RoutineBlock {
  id: string;                    // UUID
  title: string;                 // Block name
  startTime: string;             // HH:mm format
  endTime: string;               // HH:mm format
  category: TaskCategory;        // Same as Task
  color: string;                 // Hex color
  linkedTaskId?: string;         // Optional task reference
  description?: string;          // Optional details
  order: number;                 // Display order
}
```

### Settings

```typescript
interface Settings {
  timeFormat: '12h' | '24h';
  language: string;
  notificationsEnabled: boolean;
  notificationSound: NotificationSound;
  defaultTaskDuration: number;        // Minutes
  defaultReminderOffset: number;      // Minutes
  autostartEnabled: boolean;
  theme: 'dark' | 'light';
  activeProfileId?: string;
}

type NotificationSound = 'bell' | 'chime' | 'ding' | 'pop' | 'none';
```

### Profile

```typescript
interface Profile {
  id: string;                    // UUID
  name: string;                  // Profile name
  emoji: string;                 // Profile icon
  color: string;                 // Accent color (hex)
  createdAt: string;             // ISO datetime
}
```

### Calendar Event (Google)

```typescript
interface CalendarEvent {
  id: string;                    // Google event ID
  title: string;
  start: string;                 // ISO datetime
  end: string;                   // ISO datetime
  description?: string;
  location?: string;
  attendees?: string[];
  source: 'google' | 'local';
}
```

## Store API

### Zustand Store

The global state is managed by Zustand. Access via `useStore()` hook.

#### Tasks

```typescript
// Get all tasks
const tasks = useStore((state) => state.tasks);

// Add task
const addTask = useStore((state) => state.addTask);
addTask(newTask);

// Update task
const updateTask = useStore((state) => state.updateTask);
updateTask(taskId, updates);

// Delete task
const deleteTask = useStore((state) => state.deleteTask);
deleteTask(taskId);

// Complete task
const completeTask = useStore((state) => state.completeTask);
completeTask(taskId);

// Start/pause/reset timer
const startTimer = useStore((state) => state.startTimer);
const pauseTimer = useStore((state) => state.pauseTimer);
const resetTimer = useStore((state) => state.resetTimer);
```

#### Reminders

```typescript
// Get all reminders
const reminders = useStore((state) => state.reminders);

// Add reminder
const addReminder = useStore((state) => state.addReminder);
addReminder(newReminder);

// Update reminder
const updateReminder = useStore((state) => state.updateReminder);
updateReminder(reminderId, updates);

// Delete reminder
const deleteReminder = useStore((state) => state.deleteReminder);
deleteReminder(reminderId);
```

#### Routine

```typescript
// Get routine blocks
const routineBlocks = useStore((state) => state.routineBlocks);

// Add block
const addRoutineBlock = useStore((state) => state.addRoutineBlock);
addRoutineBlock(newBlock);

// Update block
const updateRoutineBlock = useStore((state) => state.updateRoutineBlock);
updateRoutineBlock(blockId, updates);

// Delete block
const deleteRoutineBlock = useStore((state) => state.deleteRoutineBlock);
deleteRoutineBlock(blockId);

// Reorder blocks
const reorderRoutineBlocks = useStore((state) => state.reorderRoutineBlocks);
reorderRoutineBlocks(newOrder);
```

#### Settings & Profiles

```typescript
// Get settings
const settings = useStore((state) => state.settings);

// Update settings
const updateSettings = useStore((state) => state.updateSettings);
updateSettings(newSettings);

// Profiles
const profiles = useStore((state) => state.profiles);
const addProfile = useStore((state) => state.addProfile);
const updateProfile = useStore((state) => state.updateProfile);
const deleteProfile = useStore((state) => state.deleteProfile);
const setActiveProfile = useStore((state) => state.setActiveProfile);
```

#### Data Management

```typescript
// Export data
const exportData = useStore((state) => state.exportData);
const jsonData = exportData();

// Import data
const importData = useStore((state) => state.importData);
importData(jsonData);

// Reset all
const resetAll = useStore((state) => state.resetAll);
resetAll();
```

## Services

### Storage Service

**File**: `src/services/storage.ts`

```typescript
// Load data from disk
async loadStore(): Promise<StoreData>

// Save data to disk
async saveStore(data: StoreData): Promise<void>

// Export to JSON file
async exportToFile(): Promise<void>

// Import from JSON file
async importFromFile(): Promise<StoreData>
```

**Usage**:
```typescript
import { loadStore, saveStore } from '@/services/storage';

const data = await loadStore();
await saveStore(updatedData);
```

### Notifications Service

**File**: `src/services/notifications.ts`

```typescript
// Request notification permission
async requestPermission(): Promise<boolean>

// Send notification
async sendNotification(options: {
  title: string;
  body: string;
  sound?: NotificationSound;
}): Promise<void>

// Schedule notification
scheduleNotification(
  datetime: Date,
  title: string,
  body: string
): void

// Check upcoming reminders
checkReminders(
  reminders: Reminder[],
  settings: Settings
): Promise<void>
```

**Usage**:
```typescript
import { sendNotification } from '@/services/notifications';

await sendNotification({
  title: 'Task Complete!',
  body: 'Great job finishing your task.',
  sound: 'chime'
});
```

### Time Service

**File**: `src/services/time.ts`

```typescript
// Format time
formatTime(date: Date, format: '12h' | '24h'): string

// Parse time string
parseTime(timeStr: string): Date

// Get time of day
getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night'

// Format duration
formatDuration(minutes: number): string // "1h 30m"

// Check if time is in range
isTimeInRange(
  time: string,
  start: string,
  end: string
): boolean
```

**Usage**:
```typescript
import { formatTime, formatDuration } from '@/services/time';

const time = formatTime(new Date(), '12h'); // "2:30 PM"
const duration = formatDuration(90); // "1h 30m"
```

### Google Calendar Service

**File**: `src/services/googleCalendar.ts`

```typescript
// Connect to Google Calendar
async connectGoogleCalendar(): Promise<boolean>

// Disconnect
async disconnectGoogleCalendar(): Promise<void>

// Fetch events
async fetchCalendarEvents(
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]>

// Check connection status
isConnected(): boolean
```

**Status**: Placeholder implementation. Requires OAuth setup.

## Tauri Commands

### Notification Commands

```rust
// Request permission (macOS/Linux)
#[tauri::command]
async fn request_notification_permission() -> Result<bool, String>

// Send notification
#[tauri::command]
async fn send_notification(
    title: String,
    body: String
) -> Result<(), String>
```

**Frontend usage**:
```typescript
import { invoke } from '@tauri-apps/api';

await invoke('send_notification', {
  title: 'Hello',
  body: 'World'
});
```

### Window Commands

```rust
// Hide to tray
#[tauri::command]
fn hide_to_tray(window: tauri::Window) -> Result<(), String>

// Show window
#[tauri::command]
fn show_window(window: tauri::Window) -> Result<(), String>
```

### Auto-start Commands

```rust
// Enable/disable autostart
#[tauri::command]
fn set_autostart(enable: bool) -> Result<(), String>

// Check autostart status
#[tauri::command]
fn get_autostart_status() -> Result<bool, String>
```

## Storage Format

### File Location

- **macOS**: `~/Library/Application Support/com.taskmanager.app/tasks.json`
- **Windows**: `%APPDATA%\com.taskmanager.app\tasks.json`
- **Linux**: `~/.config/com.taskmanager.app/tasks.json`

### JSON Structure

```json
{
  "tasks": [
    {
      "id": "uuid-here",
      "title": "Complete project",
      "category": "work",
      "estimatedDuration": 120,
      "repeatPattern": "daily",
      "completedToday": false,
      "completedDates": ["2024-01-15"],
      "createdAt": "2024-01-01T10:00:00Z",
      "tags": ["urgent", "project"],
      "timerElapsed": 0
    }
  ],
  "reminders": [
    {
      "id": "uuid-here",
      "title": "Team meeting",
      "type": "event",
      "datetime": "2024-01-20T14:00:00Z",
      "notificationOffsets": [60, 15],
      "repeatYearly": false,
      "notified": false,
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "routineBlocks": [
    {
      "id": "uuid-here",
      "title": "Morning workout",
      "startTime": "07:00",
      "endTime": "08:00",
      "category": "health",
      "color": "#10b981",
      "order": 0
    }
  ],
  "settings": {
    "timeFormat": "12h",
    "language": "en",
    "notificationsEnabled": true,
    "notificationSound": "chime",
    "defaultTaskDuration": 30,
    "defaultReminderOffset": 60,
    "autostartEnabled": false,
    "theme": "dark"
  },
  "profiles": [
    {
      "id": "uuid-here",
      "name": "Work",
      "emoji": "💼",
      "color": "#3b82f6",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### Backup Format

Same as storage format, but includes metadata:

```json
{
  "version": "1.0.0",
  "exportedAt": "2024-01-15T10:00:00Z",
  "data": {
    // ... same structure as above
  }
}
```

## Events

### Custom Events

```typescript
// Task completed event
window.dispatchEvent(new CustomEvent('task:completed', {
  detail: { taskId, task }
}));

// Reminder triggered
window.dispatchEvent(new CustomEvent('reminder:triggered', {
  detail: { reminderId, reminder }
}));

// Timer finished
window.dispatchEvent(new CustomEvent('timer:finished', {
  detail: { taskId, duration }
}));
```

**Listen for events**:
```typescript
window.addEventListener('task:completed', (e) => {
  console.log('Task completed:', e.detail);
});
```

## Hooks

### Custom React Hooks

```typescript
// Get filtered tasks
function useFilteredTasks(category?: TaskCategory): Task[]

// Get upcoming reminders
function useUpcomingReminders(days: number): Reminder[]

// Get routine for time
function useRoutineAtTime(time: string): RoutineBlock | undefined

// Get timer state
function useTimer(taskId: string): {
  isRunning: boolean;
  elapsed: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
}
```

## Constants

```typescript
// Time constants
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;

// Notification defaults
export const DEFAULT_NOTIFICATION_OFFSET = 60; // 1 hour
export const DEFAULT_TASK_DURATION = 30; // 30 minutes

// Categories
export const TASK_CATEGORIES = [
  'work',
  'personal',
  'health',
  'learning',
  'other'
] as const;

// Colors
export const CATEGORY_COLORS = {
  work: '#3b82f6',
  personal: '#8b5cf6',
  health: '#10b981',
  learning: '#f59e0b',
  other: '#6b7280'
};
```

---

**For implementation details**, see source code and inline comments.
