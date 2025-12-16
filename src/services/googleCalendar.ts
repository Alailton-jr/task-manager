import type { GoogleAuthTokens, GoogleCalendar, CalendarEvent } from '@/types';
import { invoke } from '@tauri-apps/api/core';

// OAuth 2.0 configuration
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];
const REDIRECT_URI = 'http://localhost:8888/oauth/callback';

// Get credentials from environment variables or config
function getOAuthCredentials() {
  // In production, these should come from secure storage or environment
  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
  const clientSecret = (import.meta as any).env?.VITE_GOOGLE_CLIENT_SECRET || '';
  
  if (!clientId || !clientSecret) {
    throw new Error(
      'Google OAuth credentials not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_SECRET environment variables.'
    );
  }
  
  return { clientId, clientSecret };
}

class GoogleCalendarService {
  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(): string {
    const { clientId } = getOAuthCredentials();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Start OAuth flow - opens browser and listens for callback
   */
  async startOAuthFlow(): Promise<GoogleAuthTokens> {
    try {
      const authUrl = this.getAuthUrl();
      
      // Start local server to listen for OAuth callback
      const code = await invoke<string>('start_oauth_server', { authUrl });
      
      // Exchange code for tokens using fetch API
      const tokens = await this.exchangeCodeForTokens(code);
      
      return tokens;
    } catch (error) {
      console.error('OAuth flow failed:', error);
      throw new Error('Failed to authenticate with Google. Please try again.');
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<GoogleAuthTokens> {
    const { clientId, clientSecret } = getOAuthCredentials();
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange authorization code for tokens');
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleAuthTokens> {
    try {
      const { clientId, clientSecret } = getOAuthCredentials();
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: refreshToken, // Keep existing refresh token
        expiresAt: Date.now() + (data.expires_in * 1000),
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh authentication. Please reconnect your Google Calendar.');
    }
  }

  /**
   * Ensure tokens are valid, refresh if needed
   */
  async ensureValidTokens(tokens: GoogleAuthTokens): Promise<GoogleAuthTokens> {
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    
    if (tokens.expiresAt < now + bufferTime) {
      // Token expired or about to expire, refresh it
      return await this.refreshAccessToken(tokens.refreshToken);
    }
    
    return tokens;
  }

  /**
   * Fetch list of user's calendars
   */
  async fetchCalendars(tokens: GoogleAuthTokens): Promise<GoogleCalendar[]> {
    try {
      const validTokens = await this.ensureValidTokens(tokens);
      
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${validTokens.accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendars');
      }
      
      const data = await response.json();
      
      const calendars: GoogleCalendar[] = (data.items || []).map((cal: any) => ({
        id: cal.id || '',
        summary: cal.summary || 'Unnamed Calendar',
        description: cal.description || undefined,
        primary: cal.primary || false,
        backgroundColor: cal.backgroundColor || undefined,
        enabled: cal.primary || false, // Enable primary calendar by default
      }));
      
      return calendars;
    } catch (error) {
      console.error('Failed to fetch calendars:', error);
      throw new Error('Failed to load calendars from Google. Please check your connection.');
    }
  }

  /**
   * Fetch events from specific calendars
   */
  async fetchEvents(
    tokens: GoogleAuthTokens,
    calendarIds: string[],
    timeMin?: Date,
    timeMax?: Date
  ): Promise<CalendarEvent[]> {
    try {
      const validTokens = await this.ensureValidTokens(tokens);
      
      const allEvents: CalendarEvent[] = [];
      
      // Default time range: 30 days before and after today
      const defaultTimeMin = timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const defaultTimeMax = timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      // Fetch events from each enabled calendar
      for (const calendarId of calendarIds) {
        try {
          const params = new URLSearchParams({
            timeMin: defaultTimeMin.toISOString(),
            timeMax: defaultTimeMax.toISOString(),
            singleEvents: 'true',
            orderBy: 'startTime',
          });
          
          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
            {
              headers: {
                'Authorization': `Bearer ${validTokens.accessToken}`,
              },
            }
          );
          
          if (!response.ok) {
            console.error(`Failed to fetch events from calendar ${calendarId}`);
            continue;
          }
          
          const data = await response.json();
          
          const events = (data.items || []).map((event: any) => {
            const startDateTime = event.start?.dateTime || event.start?.date || new Date().toISOString();
            const endDateTime = event.end?.dateTime || event.end?.date || new Date().toISOString();
            const isAllDay = !event.start?.dateTime;
            
            return {
              id: crypto.randomUUID(),
              googleEventId: event.id || undefined,
              calendarId,
              title: event.summary || 'Untitled Event',
              description: event.description || undefined,
              location: event.location || undefined,
              startDateTime,
              endDateTime,
              isAllDay,
              reminders: event.reminders?.overrides?.map((r: any) => r.minutes || 0),
              color: event.colorId || undefined,
              source: 'google' as const,
            };
          });
          
          allEvents.push(...events);
        } catch (error) {
          console.error(`Failed to fetch events from calendar ${calendarId}:`, error);
          // Continue with other calendars
        }
      }
      
      return allEvents;
    } catch (error) {
      console.error('Failed to fetch events:', error);
      throw new Error('Failed to sync calendar events. Please try again.');
    }
  }

  /**
   * Sync all enabled calendars
   */
  async syncCalendars(
    tokens: GoogleAuthTokens,
    enabledCalendars: GoogleCalendar[]
  ): Promise<{ calendars: GoogleCalendar[]; events: CalendarEvent[] }> {
    try {
      // Fetch fresh calendar list
      const calendars = await this.fetchCalendars(tokens);
      
      // Merge enabled state from existing calendars
      const mergedCalendars = calendars.map((cal) => {
        const existing = enabledCalendars.find((ec) => ec.id === cal.id);
        return {
          ...cal,
          enabled: existing ? existing.enabled : cal.enabled,
        };
      });
      
      // Fetch events only from enabled calendars
      const enabledIds = mergedCalendars.filter((c) => c.enabled).map((c) => c.id);
      const events = enabledIds.length > 0 
        ? await this.fetchEvents(tokens, enabledIds)
        : [];
      
      return {
        calendars: mergedCalendars,
        events,
      };
    } catch (error) {
      console.error('Calendar sync failed:', error);
      throw error;
    }
  }

  /**
   * Create a new event in Google Calendar
   */
  async createEvent(
    tokens: GoogleAuthTokens,
    calendarId: string,
    event: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    try {
      const validTokens = await this.ensureValidTokens(tokens);

      const eventBody = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: event.isAllDay
          ? { date: new Date(event.startDateTime!).toISOString().split('T')[0] }
          : { dateTime: event.startDateTime, timeZone: 'UTC' },
        end: event.isAllDay
          ? { date: new Date(event.endDateTime!).toISOString().split('T')[0] }
          : { dateTime: event.endDateTime, timeZone: 'UTC' },
        reminders: {
          useDefault: false,
          overrides: event.reminders?.map((minutes) => ({
            method: 'popup',
            minutes,
          })),
        },
        colorId: event.color ? this.getColorId(event.color) : undefined,
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${validTokens.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventBody),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const data = await response.json();

      return {
        id: crypto.randomUUID(),
        googleEventId: data.id,
        calendarId,
        title: data.summary || 'Untitled Event',
        description: data.description,
        location: data.location,
        startDateTime: data.start?.dateTime || data.start?.date || new Date().toISOString(),
        endDateTime: data.end?.dateTime || data.end?.date || new Date().toISOString(),
        isAllDay: !data.start?.dateTime,
        reminders: data.reminders?.overrides?.map((r: any) => r.minutes || 0),
        color: event.color,
        source: 'google',
      };
    } catch (error) {
      console.error('Failed to create event:', error);
      throw new Error('Failed to create event in Google Calendar');
    }
  }

  /**
   * Update an existing event in Google Calendar
   */
  async updateEvent(
    tokens: GoogleAuthTokens,
    calendarId: string,
    googleEventId: string,
    event: Partial<CalendarEvent>
  ): Promise<void> {
    try {
      const validTokens = await this.ensureValidTokens(tokens);

      const eventBody = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: event.isAllDay
          ? { date: new Date(event.startDateTime!).toISOString().split('T')[0] }
          : { dateTime: event.startDateTime, timeZone: 'UTC' },
        end: event.isAllDay
          ? { date: new Date(event.endDateTime!).toISOString().split('T')[0] }
          : { dateTime: event.endDateTime, timeZone: 'UTC' },
        reminders: {
          useDefault: false,
          overrides: event.reminders?.map((minutes) => ({
            method: 'popup',
            minutes,
          })),
        },
        colorId: event.color ? this.getColorId(event.color) : undefined,
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${validTokens.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventBody),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update event');
      }
    } catch (error) {
      console.error('Failed to update event:', error);
      throw new Error('Failed to update event in Google Calendar');
    }
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(
    tokens: GoogleAuthTokens,
    calendarId: string,
    googleEventId: string
  ): Promise<void> {
    try {
      const validTokens = await this.ensureValidTokens(tokens);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${validTokens.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw new Error('Failed to delete event from Google Calendar');
    }
  }

  /**
   * Helper to map custom color to Google Calendar color ID
   */
  private getColorId(hexColor: string): string {
    const colorMap: Record<string, string> = {
      '#10b981': '10', // Green
      '#06b6d4': '9', // Cyan/Blue
      '#3b82f6': '1', // Blue
      '#8b5cf6': '3', // Purple
      '#f59e0b': '5', // Orange/Amber
      '#ef4444': '11', // Red
      '#ec4899': '4', // Pink
    };
    return colorMap[hexColor] || '10';
  }

  /**
   * Disconnect - clears OAuth tokens
   */
  disconnect() {
    // Nothing to clean up on client side
  }
}

// Singleton instance
export const googleCalendarService = new GoogleCalendarService();
