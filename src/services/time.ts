import { format, isToday, isTomorrow, differenceInMinutes, startOfDay } from 'date-fns';

export class TimeUtils {
  static formatTime(date: Date | string, timeFormat: '12h' | '24h' = '24h'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, timeFormat === '12h' ? 'h:mm a' : 'HH:mm');
  }

  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'yyyy-MM-dd');
  }

  static formatDateTime(date: Date | string, timeFormat: '12h' | '24h' = '24h'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const timeStr = this.formatTime(d, timeFormat);
    const dateStr = format(d, 'MMM d, yyyy');
    return `${dateStr} ${timeStr}`;
  }

  static formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (isToday(d)) {
      return `Today at ${format(d, 'HH:mm')}`;
    }
    if (isTomorrow(d)) {
      return `Tomorrow at ${format(d, 'HH:mm')}`;
    }
    return format(d, 'MMM d at HH:mm');
  }

  static getTimeUntil(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const minutes = differenceInMinutes(d, now);

    if (minutes < 0) {
      return 'Past';
    }
    if (minutes === 0) {
      return 'Now';
    }
    if (minutes < 60) {
      return `${minutes}m`;
    }
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  static parseTimeString(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }

  static createTimeString(hours: number, minutes: number): string {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  static getTodayDateString(): string {
    return format(new Date(), 'yyyy-MM-dd');
  }

  static combineDateAndTime(date: Date, timeString: string): Date {
    const { hours, minutes } = this.parseTimeString(timeString);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  static isTimeInRange(time: string, start: string, end: string): boolean {
    const timeMinutes = this.timeToMinutes(time);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);
    
    if (endMinutes < startMinutes) {
      // Spans midnight
      return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
    }
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  }

  static timeToMinutes(time: string): number {
    const { hours, minutes } = this.parseTimeString(time);
    return hours * 60 + minutes;
  }

  static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return this.createTimeString(hours, mins);
  }

  static getDayOfWeek(date: Date): number {
    return date.getDay(); // 0 = Sunday, 6 = Saturday
  }

  static getStartOfDay(date: Date = new Date()): Date {
    return startOfDay(date);
  }

  static shouldRunToday(repeatPattern: 'none' | 'daily' | 'weekly' | 'custom', daysOfWeek?: number[]): boolean {
    if (repeatPattern === 'none') return false;
    if (repeatPattern === 'daily') return true;
    if (repeatPattern === 'weekly' && daysOfWeek) {
      const today = this.getDayOfWeek(new Date());
      return daysOfWeek.includes(today);
    }
    return false;
  }

  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  static secondsToTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }
}
