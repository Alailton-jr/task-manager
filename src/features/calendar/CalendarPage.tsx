import React, { useState } from 'react';
import { useStore } from '@/store';
import { EmptyState } from '@/components/ui';
import { TimeUtils } from '@/services/time';
import { googleCalendarService } from '@/services/googleCalendar';
import { WeekCalendarView } from '@/components/calendar/WeekCalendarView';
import { MonthCalendarView } from '@/components/calendar/MonthCalendarView';
import { EventModal } from '@/components/calendar/EventModal';
import type { CalendarEvent } from '@/types';

export const CalendarPage: React.FC = () => {
  const { 
    calendarEvents, 
    googleAuthTokens, 
    googleCalendars,
    settings,
    updateSettings,
    setGoogleAuthTokens,
    syncGoogleCalendars,
    disconnectGoogleCalendar,
    toggleGoogleCalendar,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
  } = useStore();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCalendarSettings, setShowCalendarSettings] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>();
  const [newEventDate, setNewEventDate] = useState<Date | undefined>();
  const [newEventTime, setNewEventTime] = useState<string | undefined>();
  const [showUpcomingEvents, setShowUpcomingEvents] = useState(false);

  const isConnected = !!googleAuthTokens;
  const viewMode = settings.viewPreferences?.calendarViewMode || 'week';

  const handleViewModeChange = (mode: 'week' | 'month') => {
    updateSettings({
      viewPreferences: {
        ...settings.viewPreferences,
        calendarViewMode: mode,
        tasksViewMode: settings.viewPreferences?.tasksViewMode || 'list',
      },
    });
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Start OAuth flow with native fetch-based implementation
      const tokens = await googleCalendarService.startOAuthFlow();
      await setGoogleAuthTokens(tokens);
      
      // Automatically sync after connection
      await handleSync();
    } catch (err) {
      console.error('Connection failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Google Calendar');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    
    try {
      const result = await syncGoogleCalendars();

      console.log(`Synced ${result.eventCount} events from Google Calendar`);
    } catch (err) {
      console.error('Sync failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync calendars');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect Google Calendar? All synced events will be removed.')) {
      try {
        await disconnectGoogleCalendar();
      } catch (err) {
        console.error('Disconnect failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to disconnect');
      }
    }
  };

  const handleCreateEvent = (date?: Date, time?: string) => {
    setSelectedEvent(undefined);
    setNewEventDate(date);
    setNewEventTime(time);
    setEventModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setNewEventDate(undefined);
    setNewEventTime(undefined);
    setEventModalOpen(true);
  };

  const handleSaveEvent = async (eventData: Omit<CalendarEvent, 'id'> | CalendarEvent) => {
    try {
      if ('id' in eventData && selectedEvent) {
        // Update existing event
        await updateCalendarEvent(eventData.id, eventData);
      } else {
        // Create new event - default to primary calendar if Google-connected
        const primaryCalendar = googleCalendars.find((c) => c.primary);
        const dataWithDefaults = {
          ...eventData,
          source: (isConnected && primaryCalendar ? 'google' : 'local') as 'google' | 'local',
          calendarId: primaryCalendar?.id,
        };
        await addCalendarEvent(dataWithDefaults);
      }
      setEventModalOpen(false);
      if (isConnected) {
        await handleSync(); // Re-sync after creating/updating
      }
    } catch (error) {
      console.error('Failed to save event:', error);
      throw error;
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteCalendarEvent(id);
      if (isConnected) {
        await handleSync(); // Re-sync after deleting
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/20 text-danger">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
          
          <EmptyState
            icon={<span className="text-6xl">📅</span>}
            title="Connect Google Calendar"
            description="Sync your Google Calendar to view all your events in one place and receive timely notifications."
            action={{
              label: isConnecting ? 'Connecting...' : 'Connect with Google',
              onClick: handleConnect,
            }}
          />
          {isConnecting && (
            <div className="mt-4 text-center text-sm text-text-secondary">
              Please complete the authorization in your browser...
            </div>
          )}
          
          <div className="mt-8 card p-6">
            <h3 className="text-lg font-semibold mb-3">Setup Required</h3>
            <div className="text-sm text-text-secondary space-y-2">
              <p>To enable Google Calendar integration, you need to:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Create OAuth 2.0 credentials in Google Cloud Console</li>
                <li>Configure environment variables with your Client ID and Secret</li>
                <li>See <code className="bg-surface-light px-2 py-0.5 rounded">.env.example</code> for detailed instructions</li>
              </ol>
              <p className="mt-4 pt-4 border-t border-white/5">
                <strong>Note:</strong> The redirect URI must be set to: <code className="bg-surface-light px-2 py-0.5 rounded">http://localhost:8888/oauth/callback</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/20 text-danger animate-slide-up">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              className="mt-2 text-sm underline hover:no-underline"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Calendar</h1>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-success/10 border border-success/20">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <span className="text-xs font-medium text-success">
                  Connected to Google Calendar
                </span>
              </div>
              <span className="text-xs text-text-tertiary">
                {googleCalendars.filter(c => c.enabled).length} calendars active
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              className="btn-secondary"
              onClick={() => setShowCalendarSettings(!showCalendarSettings)}
            >
              {showCalendarSettings ? 'Hide' : 'Show'} Calendars
            </button>
            <button 
              className="btn-secondary"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button 
              className="btn-danger"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Calendar Selection */}
        {showCalendarSettings && googleCalendars.length > 0 && (
          <div className="card mb-6 animate-slide-up">
            <h3 className="text-lg font-semibold mb-4">Manage Calendars</h3>
            <div className="space-y-2">
              {googleCalendars.map((calendar) => (
                <label 
                  key={calendar.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={calendar.enabled}
                    onChange={() => toggleGoogleCalendar(calendar.id)}
                    className="w-5 h-5 rounded border-2 border-white/20 bg-surface-light checked:bg-accent checked:border-accent cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: calendar.backgroundColor || '#10b981' }}
                      />
                      <span className="font-medium">{calendar.summary}</span>
                      {calendar.primary && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                          Primary
                        </span>
                      )}
                    </div>
                    {calendar.description && (
                      <p className="text-sm text-text-tertiary mt-1">{calendar.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <p className="text-sm text-text-secondary mt-4 pt-4 border-t border-white/5">
              Select which calendars to sync. Changes take effect on the next sync.
            </p>
          </div>
        )}

        {/* Calendar View Placeholder */}
        <div className="card mb-6">
          {/* View controls */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate('prev')}
                className="btn-secondary px-3 py-2"
              >
                ←
              </button>
              <button onClick={goToToday} className="btn-secondary px-4 py-2">
                Today
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="btn-secondary px-3 py-2"
              >
                →
              </button>
              <div className="ml-4 text-lg font-semibold">
                {viewMode === 'month' &&
                  currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                {viewMode === 'week' &&
                  `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCreateEvent()}
                className="btn-primary px-4 py-2"
              >
                + New Event
              </button>
              <div className="flex bg-surface-light rounded-lg p-1">
                <button
                  onClick={() => handleViewModeChange('month')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'month' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => handleViewModeChange('week')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'week' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Week
                </button>
              </div>
            </div>
          </div>

          {/* Calendar views */}
          {viewMode === 'month' && (
            <MonthCalendarView
              currentDate={currentDate}
              onEventClick={handleEditEvent}
              onDateClick={(date) => handleCreateEvent(date)}
            />
          )}

          {viewMode === 'week' && (
            <WeekCalendarView
              currentDate={currentDate}
              onEventClick={handleEditEvent}
              onTimeSlotClick={(date, time) => handleCreateEvent(date, time)}
            />
          )}
        </div>

        {/* Upcoming Events - Collapsible */}
        <div className="card">
          <button
            onClick={() => setShowUpcomingEvents(!showUpcomingEvents)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-text-secondary uppercase tracking-wider text-xs">
                Upcoming Events
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
                {calendarEvents.filter(e => new Date(e.startDateTime) > new Date()).length}
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-text-secondary transition-transform ${
                showUpcomingEvents ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUpcomingEvents && (
            <div className="px-4 pb-4 animate-slide-up">
              {calendarEvents.length > 0 ? (
                <div className="grid gap-3 pt-2">
                  {calendarEvents
                    .filter((e) => new Date(e.startDateTime) > new Date())
                    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
                    .slice(0, 10)
                    .map((event) => (
                      <div 
                        key={event.id} 
                        className="card flex items-center gap-4 group hover:border-accent/30 transition-all duration-300 cursor-pointer"
                        onClick={() => handleEditEvent(event)}
                      >
                        <div 
                          className="w-1 h-12 rounded-full" 
                          style={{ backgroundColor: event.color || '#10b981' }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-text-primary truncate">{event.title}</h3>
                          <p className="text-sm text-text-secondary">
                            {TimeUtils.formatRelativeTime(event.startDateTime)}
                          </p>
                          {event.location && (
                            <p className="text-xs text-text-tertiary mt-1 truncate">📍 {event.location}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {event.source === 'google' && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
                              Google
                            </span>
                          )}
                          <span className="text-sm text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                            View Details →
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-text-secondary">No upcoming events</p>
                  <p className="text-sm text-text-tertiary mt-2">
                    {isSyncing ? 'Syncing...' : isConnected ? 'Click "Sync Now" to fetch events from Google Calendar' : 'Connect Google Calendar to sync events'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Event Modal */}
        <EventModal
          isOpen={eventModalOpen}
          onClose={() => {
            setEventModalOpen(false);
            setSelectedEvent(undefined);
            setNewEventDate(undefined);
            setNewEventTime(undefined);
          }}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          event={selectedEvent}
          initialDate={newEventDate}
          initialTime={newEventTime}
        />
      </div>
    </div>
  );
};
