import React, { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { TimeUtils } from '@/services/time';
import type { UpcomingItem } from '@/types';

export const Header: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { tasks, reminders, calendarEvents, settings } = useStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getUpcomingItems = (): UpcomingItem[] => {
    const items: UpcomingItem[] = [];
    const now = new Date();
    const todayStr = TimeUtils.getTodayDateString();

    // Get upcoming tasks
    tasks
      .filter((task) => task.active && task.startTime)
      .forEach((task) => {
        const taskTime = TimeUtils.combineDateAndTime(now, task.startTime!);
        if (taskTime > now) {
          const shouldRun = TimeUtils.shouldRunToday(
            task.repeatPattern,
            task.repeatDaysOfWeek
          );
          if (shouldRun && !task.completionByDate[todayStr]?.completed) {
            items.push({
              id: task.id,
              type: 'task',
              title: task.title,
              time: taskTime.toISOString(),
              color: '#06b6d4',
            });
          }
        }
      });

    // Get upcoming reminders
    reminders
      .filter((reminder) => reminder.active)
      .forEach((reminder) => {
        const eventTime = new Date(reminder.eventDateTime);
        if (eventTime > now) {
          // Find next notification offset
          const nextOffset = reminder.notificationOffsets
            .map((offset) => {
              const notifTime = new Date(eventTime.getTime() + offset * 60000);
              return { offset, time: notifTime };
            })
            .filter((n) => n.time > now)
            .sort((a, b) => a.time.getTime() - b.time.getTime())[0];

          if (nextOffset) {
            items.push({
              id: reminder.id,
              type: 'reminder',
              title: reminder.title,
              time: nextOffset.time.toISOString(),
              color: '#f59e0b',
            });
          }
        }
      });

    // Get upcoming calendar events
    calendarEvents
      .filter((event) => new Date(event.startDateTime) > now)
      .forEach((event) => {
        items.push({
          id: event.id,
          type: 'event',
          title: event.title,
          time: event.startDateTime,
          color: event.color || '#10b981',
        });
      });

    // Sort by time and take the next 3
    return items.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()).slice(0, 3);
  };

  const upcomingItems = getUpcomingItems();
  const nextItem = upcomingItems[0];

  return (
    <header className="bg-background/80 backdrop-blur-xl border-b border-white/5 px-8 py-2">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Task Manager
          </h1>
          <div className="flex items-center gap-3 text-text-secondary text-sm font-medium">
            <span>
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="w-1 h-1 rounded-full bg-text-tertiary" />
            <span className="font-mono text-accent">
              {TimeUtils.formatTime(currentTime, settings.timeFormat)}
            </span>
          </div>
        </div>

        {nextItem && (
          <div className="relative group overflow-hidden rounded-xl border border-white/10 bg-surface/50 p-4 min-w-[320px] transition-all hover:border-accent/30">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-accent mb-1 flex items-center gap-2">
                  <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-accent"></span>
                  Next Up
                </div>
                <div className="font-semibold text-text-primary truncate text-lg">
                  {nextItem.title}
                </div>
                <div className="text-xs text-text-secondary mt-0.5">
                  {TimeUtils.formatRelativeTime(nextItem.time)}
                </div>
              </div>
              <div className="text-right bg-surface rounded-lg px-3 py-2 border border-white/5">
                <div
                  className="text-xl font-bold font-mono tracking-tight"
                  style={{ color: nextItem.color }}
                >
                  {TimeUtils.getTimeUntil(nextItem.time)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
