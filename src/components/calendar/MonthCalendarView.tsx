import React, { useMemo } from 'react';
import { useStore } from '@/store';
import type { CalendarEvent } from '@/types';

interface MonthCalendarViewProps {
  currentDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

export const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({
  currentDate,
  onEventClick,
  onDateClick,
}) => {
  const { calendarEvents } = useStore();

  // Generate calendar grid (6 weeks x 7 days)
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Start from Sunday of the first week
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks)
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    
    return days;
  }, [currentDate]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    
    calendarEvents.forEach((event) => {
      const dateKey = new Date(event.startDateTime).toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    
    return map;
  }, [calendarEvents]);

  const today = new Date().toDateString();
  const currentMonth = currentDate.getMonth();

  return (
    <div className="calendar-month-view bg-surface rounded-lg border border-white/10 overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-white/10 bg-surface-light">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-3 text-center text-xs font-semibold text-text-tertiary uppercase border-r border-white/10 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dateKey = day.toDateString();
          const dayEvents = eventsByDate.get(dateKey) || [];
          const isToday = dateKey === today;
          const isCurrentMonth = day.getMonth() === currentMonth;
          
          return (
            <div
              key={index}
              className={`min-h-[80px] border-r border-b border-white/5 p-2 cursor-pointer hover:bg-white/5 transition-colors ${
                !isCurrentMonth ? 'opacity-40' : ''
              } ${isToday ? 'bg-accent/5' : ''}`}
              onClick={() => onDateClick?.(day)}
            >
              {/* Date number */}
              <div
                className={`text-sm font-semibold mb-2 ${
                  isToday
                    ? 'text-accent bg-accent/20 w-7 h-7 rounded-full flex items-center justify-center'
                    : 'text-text-primary'
                }`}
              >
                {day.getDate()}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded truncate hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: event.color || '#10b981',
                      color: 'white',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-text-tertiary pl-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
