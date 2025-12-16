import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import type { Task, Reminder, CalendarEvent, Settings } from '@/types';

interface ScheduledNotification {
  id: string;
  type: 'task' | 'reminder' | 'event';
  itemId: string;
  title: string;
  body: string;
  scheduledFor: number; // timestamp
  timeoutId?: ReturnType<typeof setTimeout>;
}

class NotificationService {
  private permissionGranted = false;
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private checkIntervalId?: ReturnType<typeof setInterval>;
  private readonly CHECK_INTERVAL = 60 * 1000; // Check every minute
  private soundSettings: { enabled: boolean; type: 'bell' | 'chime' | 'ding' | 'pop' | 'none'; volume: number } = { 
    enabled: true, 
    type: 'bell', 
    volume: 50 
  };

  async init(): Promise<void> {
    this.permissionGranted = await isPermissionGranted();
    
    if (!this.permissionGranted) {
      const permission = await requestPermission();
      this.permissionGranted = permission === 'granted';
    }

    // Start background checker
    this.startBackgroundChecker();
  }

  /**
   * Start background notification checker
   * This runs every minute to check for any missed notifications
   */
  private startBackgroundChecker(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }

    this.checkIntervalId = setInterval(() => {
      this.checkAndSendDueNotifications();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Check for and send any due notifications
   */
  private checkAndSendDueNotifications(): void {
    const now = Date.now();
    const dueNotifications: ScheduledNotification[] = [];

    this.scheduledNotifications.forEach((notification) => {
      if (notification.scheduledFor <= now) {
        dueNotifications.push(notification);
      }
    });

    // Send all due notifications
    dueNotifications.forEach((notification) => {
      this.send(notification.title, notification.body);
      this.scheduledNotifications.delete(notification.id);
    });
  }

  /**
   * Schedule all notifications from app data
   */
  scheduleAll(
    tasks: Task[],
    reminders: Reminder[],
    events: CalendarEvent[],
    settings: Settings
  ): void {
    // Clear existing schedules
    this.clearAll();

    // Schedule task notifications
    this.scheduleTasks(tasks, settings.notifications.defaultLeadTimeMinutes.tasks);

    // Schedule reminder notifications
    this.scheduleReminders(reminders);

    // Schedule calendar event notifications
    this.scheduleEvents(events, settings.notifications.defaultLeadTimeMinutes.calendarEvents);

    console.log(`Scheduled ${this.scheduledNotifications.size} notifications`);
  }

  /**
   * Schedule notifications for tasks
   */
  private scheduleTasks(tasks: Task[], defaultLeadTime: number): void {
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();

    tasks.forEach((task) => {
      // Only schedule for active, repeatable tasks with start times
      if (!task.active || !task.isRepeatable || !task.startTime) return;

      // Check if task is relevant today
      const isToday = this.isTaskForToday(task);
      if (!isToday) return;

      // Check if already completed today
      const completion = task.completionByDate[today];
      if (completion?.completed) return;

      // Parse start time
      const [hours, minutes] = task.startTime.split(':').map(Number);
      const taskTime = new Date();
      taskTime.setHours(hours, minutes, 0, 0);

      // Schedule notification before task start time
      const notificationTime = taskTime.getTime() - (defaultLeadTime * 60 * 1000);

      if (notificationTime > now) {
        this.scheduleNotification({
          id: `task-${task.id}-${today}`,
          type: 'task',
          itemId: task.id,
          title: 'Task Reminder',
          body: `Time to start: ${task.title}`,
          scheduledFor: notificationTime,
        });
      }
    });
  }

  /**
   * Schedule notifications for reminders
   */
  private scheduleReminders(reminders: Reminder[]): void {
    const now = Date.now();

    reminders.forEach((reminder) => {
      if (!reminder.active) return;

      const eventTime = new Date(reminder.eventDateTime).getTime();
      const offsets = reminder.notificationOffsets.length > 0
        ? reminder.notificationOffsets
        : [15]; // Default 15 minutes

      offsets.forEach((minutesOffset) => {
        const notificationTime = eventTime + (minutesOffset * 60 * 1000);

        if (notificationTime > now) {
          const timeUntil = Math.abs(Math.floor((eventTime - notificationTime) / (60 * 1000)));
          const timeText = minutesOffset < 0
            ? `in ${timeUntil} minute${timeUntil !== 1 ? 's' : ''}`
            : minutesOffset === 0
            ? 'now'
            : `${timeUntil} minute${timeUntil !== 1 ? 's' : ''} ago`;

          this.scheduleNotification({
            id: `reminder-${reminder.id}-${minutesOffset}`,
            type: 'reminder',
            itemId: reminder.id,
            title: reminder.title,
            body: `Reminder ${timeText}`,
            scheduledFor: notificationTime,
          });
        }
      });
    });
  }

  /**
   * Schedule notifications for calendar events
   */
  private scheduleEvents(events: CalendarEvent[], defaultLeadTime: number): void {
    const now = Date.now();

    events.forEach((event) => {
      const eventTime = new Date(event.startDateTime).getTime();
      const reminders = event.reminders && event.reminders.length > 0
        ? event.reminders
        : [defaultLeadTime];

      reminders.forEach((minutesBefore) => {
        const notificationTime = eventTime - (minutesBefore * 60 * 1000);

        if (notificationTime > now) {
          const timeUntil = minutesBefore;
          const timeText = timeUntil === 0
            ? 'starting now'
            : `in ${timeUntil} minute${timeUntil !== 1 ? 's' : ''}`;

          this.scheduleNotification({
            id: `event-${event.id}-${minutesBefore}`,
            type: 'event',
            itemId: event.id,
            title: event.title,
            body: `Event ${timeText}`,
            scheduledFor: notificationTime,
          });
        }
      });
    });
  }

  /**
   * Schedule a single notification
   */
  private scheduleNotification(notification: ScheduledNotification): void {
    const delay = notification.scheduledFor - Date.now();

    // If delay is reasonable (< 24 hours), use setTimeout
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
      notification.timeoutId = setTimeout(() => {
        this.send(notification.title, notification.body);
        this.scheduledNotifications.delete(notification.id);
      }, delay);
    }

    // Store in map for background checker
    this.scheduledNotifications.set(notification.id, notification);
  }

  /**
   * Check if task is relevant for today
   */
  private isTaskForToday(task: Task): boolean {
    const dayOfWeek = new Date().getDay();

    if (task.repeatPattern === 'daily') return true;
    if (task.repeatPattern === 'weekly' && task.repeatDaysOfWeek?.includes(dayOfWeek)) return true;

    return false;
  }

  /**
   * Clear all scheduled notifications
   */
  clearAll(): void {
    this.scheduledNotifications.forEach((notification) => {
      if (notification.timeoutId) {
        clearTimeout(notification.timeoutId);
      }
    });
    this.scheduledNotifications.clear();
  }

  /**
   * Clean up on app close
   */
  destroy(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }
    this.clearAll();
  }

  private playSound(): void {
    if (!this.soundSettings.enabled || this.soundSettings.type === 'none') {
      return;
    }

    try {
      const audio = new Audio(`/sounds/${this.soundSettings.type}.mp3`);
      audio.volume = this.soundSettings.volume / 100;
      audio.play().catch(err => console.warn('Could not play notification sound:', err));
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  setSoundSettings(settings: { enabled: boolean; type: 'bell' | 'chime' | 'ding' | 'pop' | 'none'; volume: number }): void {
    this.soundSettings = settings;
  }

  async send(title: string, body?: string): Promise<void> {
    if (!this.permissionGranted) {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      await sendNotification({
        title,
        body: body || '',
      });
      this.playSound();
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async sendTaskReminder(taskTitle: string, startTime: string): Promise<void> {
    await this.send(
      'Task Reminder',
      `Time to start: ${taskTitle} at ${startTime}`
    );
  }

  async sendTaskComplete(taskTitle: string): Promise<void> {
    await this.send(
      'Task Complete',
      `You've completed: ${taskTitle}`
    );
  }

  async sendReminderAlert(reminderTitle: string, timeInfo: string): Promise<void> {
    await this.send(
      'Reminder',
      `${reminderTitle} - ${timeInfo}`
    );
  }

  async sendCalendarEventAlert(eventTitle: string, timeInfo: string): Promise<void> {
    await this.send(
      'Calendar Event',
      `${eventTitle} ${timeInfo}`
    );
  }

  /**
   * Schedule notifications for upcoming calendar events
   * This should be called after syncing calendars
   */
  async scheduleCalendarEventNotifications(
    events: Array<{ id: string; title: string; startDateTime: string; reminders?: number[] }>,
    defaultLeadTime: number = 15
  ): Promise<void> {
    const now = Date.now();
    
    for (const event of events) {
      const eventTime = new Date(event.startDateTime).getTime();
      const reminders = event.reminders && event.reminders.length > 0 
        ? event.reminders 
        : [defaultLeadTime];
      
      for (const minutesBefore of reminders) {
        const notificationTime = eventTime - (minutesBefore * 60 * 1000);
        
        // Only schedule future notifications
        if (notificationTime > now) {
          const delay = notificationTime - now;
          
          // Schedule notification
          setTimeout(() => {
            const timeUntilEvent = Math.floor((eventTime - Date.now()) / (60 * 1000));
            const timeInfo = timeUntilEvent === 0 
              ? 'starting now' 
              : `in ${timeUntilEvent} minute${timeUntilEvent !== 1 ? 's' : ''}`;
            
            this.sendCalendarEventAlert(event.title, timeInfo);
          }, delay);
        }
      }
    }
  }
}

export const notificationService = new NotificationService();

