import React, { useMemo } from 'react';
import { useStore } from '@/store';
import { TimeUtils } from '@/services/time';
import type { CalendarEvent, RoutineBlock } from '@/types';

interface WeekCalendarViewProps {
  currentDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
}

export const WeekCalendarView: React.FC<WeekCalendarViewProps> = ({
  currentDate,
  onEventClick,
  onTimeSlotClick,
}) => {
  const { calendarEvents, routineBlocks, settings } = useStore();

  // Generate week days starting from Sunday
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay()); // Go to Sunday
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      return day;
    });
  }, [currentDate]);

  // Generate hour slots (6 AM to 10 PM)
  const hours = Array.from({ length: 16 }, (_, i) => i + 6);

  // Calculate current time position
  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const totalMinutes = currentHour * 60 + currentMinutes;
    const startMinutes = 6 * 60; // 6 AM
    
    // Only show if current time is within visible range (6 AM - 10 PM)
    if (currentHour < 6 || currentHour >= 22) return null;
    
    return ((totalMinutes - startMinutes) / 60) * 32; // 32px per hour
  }, []);

  // Update current time line every minute
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Filter events for the current week
  const weekEvents = useMemo(() => {
    const weekStart = weekDays[0];
    const weekEnd = new Date(weekDays[6]);
    weekEnd.setHours(23, 59, 59, 999);

    return calendarEvents.filter((event) => {
      const eventDate = new Date(event.startDateTime);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });
  }, [calendarEvents, weekDays]);

  // Get applicable routine blocks for each day
  const getRoutineBlocksForDay = (dayOfWeek: number): RoutineBlock[] => {
    return routineBlocks.filter((block) => {
      if (block.dayType === 'everyday') return true;
      if (block.dayType === 'weekday' && dayOfWeek >= 1 && dayOfWeek <= 5) return true;
      if (block.dayType === 'weekend' && (dayOfWeek === 0 || dayOfWeek === 6)) return true;
      if (block.dayType === 'specificDays' && block.daysOfWeek?.includes(dayOfWeek)) return true;
      return false;
    });
  };

  // Calculate position for time-based items
  const getTimePosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 6 * 60; // 6 AM
    return ((totalMinutes - startMinutes) / 60) * 32; // 32px per hour
  };

  const getEventPosition = (event: CalendarEvent): { top: number; height: number; left: number; width: string } => {

    const startTime = TimeUtils.formatTime(event.startDateTime, settings.timeFormat);
    const endTime = TimeUtils.formatTime(event.endDateTime, settings.timeFormat);
    
    const [startHour, startMin] = startTime.match(/\d+/g)?.map(Number) || [0, 0];
    const [endHour, endMin] = endTime.match(/\d+/g)?.map(Number) || [0, 0];
    
    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // Handle AM/PM
    if (startTime.includes('PM') && startHour !== 12) startMinutes += 12 * 60;
    if (endTime.includes('PM') && endHour !== 12) endMinutes += 12 * 60;
    if (startTime.includes('AM') && startHour === 12) startMinutes -= 12 * 60;
    if (endTime.includes('AM') && endHour === 12) endMinutes -= 12 * 60;

    const baseMinutes = 6 * 60; // 6 AM
    const endVisibleMinutes = 22 * 60; // 10 PM
    
    // Clamp start and end to visible range
    const clampedStart = Math.max(startMinutes, baseMinutes);
    const clampedEnd = Math.min(endMinutes, endVisibleMinutes);
    
    const top = ((clampedStart - baseMinutes) / 60) * 32;
    const height = Math.max(((clampedEnd - clampedStart) / 60) * 32, 24); // Minimum 24px height

    return { top, height, left: 4, width: 'calc(100% - 8px)' };
  };

  const getRoutineBlockPosition = (block: RoutineBlock): { top: number; height: number } => {
    const top = getTimePosition(block.startTime);
    const endPos = getTimePosition(block.endTime);
    const height = endPos - top;
    
    return { top, height };
  };

  return (
    <div className="calendar-week-view bg-surface rounded-lg border border-white/10 overflow-hidden">
      {/* Header with day names */}
      <div className="grid grid-cols-8 border-b border-white/10 sticky top-0 bg-surface-light z-20">
        <div className="p-3 border-r border-white/10 text-xs font-semibold text-text-tertiary">
          TIME
        </div>
        {weekDays.map((day, i) => {
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div
              key={i}
              className={`p-3 text-center border-r border-white/10 ${
                isToday ? 'bg-accent/10' : ''
              }`}
            >
              <div className="text-xs font-semibold text-text-tertiary uppercase">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div
                className={`text-lg font-bold mt-1 ${
                  isToday ? 'text-accent' : 'text-text-primary'
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time slots and events */}
      <div className="overflow-auto max-h-[600px]">
        <div className="grid grid-cols-8 relative">
          {/* Time labels column */}
          <div className="border-r border-white/10">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-8 border-b border-white/5 p-1 text-xs text-text-tertiary flex items-center"
              >
                {settings.timeFormat === '12h'
                  ? `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
                  : `${hour}:00`}
              </div>
            ))}
          </div>

          {/* Day columns with events and routine blocks */}
          {weekDays.map((day, dayIndex) => {
            const dayRoutineBlocks = getRoutineBlocksForDay(day.getDay());
            const dayEvents = weekEvents.filter((event) => {
              const eventDay = new Date(event.startDateTime);
              return eventDay.toDateString() === day.toDateString();
            });

            

            return (
              <div key={dayIndex} className="border-r border-white/10 relative">
                {/* Hour slots */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-8 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() =>
                      onTimeSlotClick?.(day, `${hour.toString().padStart(2, '0')}:00`)
                    }
                  />
                ))}

                {/* Current time indicator - only show on today */}
                {currentTimePosition !== null && day.toDateString() === new Date().toDateString() && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${currentTimePosition}px` }}
                  >
                    <div className="relative">
                      {/* Dot */}
                      <div className="absolute -left-1 -top-1.5 w-1 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
                      <div className="absolute -right-1 -top-1.5 w-1 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
                      {/* Line */}
                      <div className="h-0.5 bg-blue-500 shadow-sm shadow-blue-500/50" />
                    </div>
                  </div>
                )}

                {/* Routine blocks overlay */}
                {dayRoutineBlocks.map((block) => {
                  const { top, height } = getRoutineBlockPosition(block);
                  return (
                    <div
                      key={block.id}
                      className="absolute left-0 right-0 mx-1 rounded opacity-30 border-l-4 flex items-center justify-center text-xs font-medium pointer-events-none"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: block.color || '#06b6d4',
                        borderColor: block.color || '#06b6d4',
                      }}
                    >
                      <span className="text-white/80 truncate px-1">{block.label}</span>
                    </div>
                  );
                })}


                {/* Calendar events */}
                {dayEvents.map((event) => {
                  const pos = getEventPosition(event);
                  return (
                    <div
                      key={event.id}
                      className="absolute rounded-md p-2 text-xs cursor-pointer hover:shadow-lg transition-all z-10 overflow-hidden"
                      style={{
                        top: `${pos.top}px`,
                        height: `${Math.max(pos.height, 32)}px`,
                        left: `${pos.left}px`,
                        width: pos.width,
                        backgroundColor: event.color || '#10b981',
                      }}
                      onClick={() => onEventClick?.(event)}
                    >
                      <div className="font-semibold text-white truncate">
                        {event.title}
                      </div>
                      {pos.height > 40 && event.location && (
                        <div className="text-white/80 truncate text-[10px] mt-1">
                          📍 {event.location}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
