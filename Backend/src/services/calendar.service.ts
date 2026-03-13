import { prisma } from "@/utils/prisma";
import { 
  CalendarResponse, 
  EventResponse, 
  SyncResult,
  Provider,
  CalendarPagination,
  EventPagination
} from "@/types/validation";
import { TokenRefreshService } from "@/middleware/token-refresh.middleware";

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
  backgroundColor?: string;
}

interface MicrosoftCalendar {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status?: string;
  recurrence?: string[];
  htmlLink?: string;
  updated?: string;
}

interface MicrosoftEvent {
  id: string;
  subject?: string;
  bodyPreview?: string;
  location?: {
    displayName?: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  isAllDay?: boolean;
  showAs?: string;
  recurrence?: any;
  webLink?: string;
  lastModifiedDateTime?: string;
}

export class CalendarService {
  /**
   * Get all calendars for a user with pagination
   */
  static async getUserCalendars(
    userId: string,
    pagination?: CalendarPagination
  ): Promise<PaginatedResult<CalendarResponse>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    // Get total count
    const total = await prisma.calendar.count({
      where: {
        connectedAccount: {
          userId,
        },
      },
    });

    // Get paginated calendars
    const calendars = await prisma.calendar.findMany({
      where: {
        connectedAccount: {
          userId,
        },
      },
      include: {
        connectedAccount: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    const calendarResponses: CalendarResponse[] = calendars.map(calendar => ({
      id: calendar.id,
      connectedAccountId: calendar.connectedAccountId,
      externalCalendarId: calendar.externalCalendarId,
      name: calendar.name,
      description: calendar.description,
      timezone: calendar.timezone,
      defaultColor: calendar.defaultColor,
      isActive: calendar.isActive,
      createdAt: calendar.createdAt,
      updatedAt: calendar.updatedAt,
    }));

    return {
      data: calendarResponses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get events for specific calendars within date range with pagination
   */
  static async getCalendarEvents(
    calendarIds: string[],
    startDate?: Date,
    endDate?: Date,
    pagination?: EventPagination
  ): Promise<PaginatedResult<EventResponse>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      calendarId: {
        in: calendarIds,
      },
    };

    if (startDate || endDate) {
      whereClause.AND = [];
      
      if (startDate) {
        whereClause.AND.push({
          endTime: {
            gte: startDate,
          },
        });
      }
      
      if (endDate) {
        whereClause.AND.push({
          startTime: {
            lte: endDate,
          },
        });
      }
    }

    // Get total count
    const total = await prisma.event.count({
      where: whereClause,
    });

    // Get paginated events
    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: {
        startTime: 'asc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    const eventResponses: EventResponse[] = events.map(event => ({
      id: event.id,
      calendarId: event.calendarId,
      externalId: event.externalId,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.startTime,
      endTime: event.endTime,
      allDay: event.allDay,
      status: event.status,
      recurrence: event.recurrence,
      htmlLink: event.htmlLink,
      syncedAt: event.syncedAt,
      updatedAt: event.updatedAt,
    }));

    return {
      data: eventResponses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Sync all calendars for a connected account
   */
  static async syncCalendarsForAccount(connectedAccountId: string): Promise<CalendarResponse[]> {
    const account = await prisma.connectedAccount.findUnique({
      where: { id: connectedAccountId },
    });

    if (!account) {
      throw new Error('Connected account not found');
    }

    // Check if token needs refresh
    if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
      const { OAuthService } = await import('./oauth.service');
      await OAuthService.refreshAccessToken(connectedAccountId);
      
      // Refetch account with new token
      const refreshedAccount = await prisma.connectedAccount.findUnique({
        where: { id: connectedAccountId },
      });
      
      if (!refreshedAccount) {
        throw new Error('Failed to refresh account token');
      }
      
      return this.syncCalendarsForAccount(connectedAccountId);
    }

    let calendars: CalendarResponse[] = [];

    if (account.provider === 'google') {
      calendars = await this.syncGoogleCalendars(account);
    } else if (account.provider === 'microsoft') {
      calendars = await this.syncMicrosoftCalendars(account);
    }

    return calendars;
  }

  /**
   * Sync Google calendars with automatic token refresh
   */
  private static async syncGoogleCalendars(account: any): Promise<CalendarResponse[]> {
    const calendars: CalendarResponse[] = [];
    
    const apiCall = async (accessToken: string) => {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Google calendars: ${response.status} ${response.statusText}`);
      }

      return await response.json() as { items: GoogleCalendar[] };
    };

    const data = await TokenRefreshService.executeWithTokenRefresh(account.id, apiCall);
    
    for (const googleCalendar of data.items) {
      const calendar = await prisma.calendar.upsert({
        where: {
          connectedAccountId_externalCalendarId: {
            connectedAccountId: account.id,
            externalCalendarId: googleCalendar.id,
          },
        },
        update: {
          name: googleCalendar.summary,
          description: googleCalendar.description,
          timezone: googleCalendar.timeZone,
          defaultColor: googleCalendar.backgroundColor,
          updatedAt: new Date(),
        },
        create: {
          connectedAccountId: account.id,
          externalCalendarId: googleCalendar.id,
          name: googleCalendar.summary,
          description: googleCalendar.description,
          timezone: googleCalendar.timeZone,
          defaultColor: googleCalendar.backgroundColor,
        },
      });

      calendars.push({
        id: calendar.id,
        connectedAccountId: calendar.connectedAccountId,
        externalCalendarId: calendar.externalCalendarId,
        name: calendar.name,
        description: calendar.description,
        timezone: calendar.timezone,
        defaultColor: calendar.defaultColor,
        isActive: calendar.isActive,
        createdAt: calendar.createdAt,
        updatedAt: calendar.updatedAt,
      });
    }

    return calendars;
  }

  /**
   * Sync Microsoft calendars
   */
  private static async syncMicrosoftCalendars(account: any): Promise<CalendarResponse[]> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/calendars', {
      headers: {
        'Authorization': `Bearer ${account.accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Microsoft calendars: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { value: MicrosoftCalendar[] };
    const calendars: CalendarResponse[] = [];
    
    for (const msCalendar of data.value) {
      const calendar = await prisma.calendar.upsert({
        where: {
          connectedAccountId_externalCalendarId: {
            connectedAccountId: account.id,
            externalCalendarId: msCalendar.id,
          },
        },
        update: {
          name: msCalendar.name,
          description: msCalendar.description,
          defaultColor: msCalendar.color,
          updatedAt: new Date(),
        },
        create: {
          connectedAccountId: account.id,
          externalCalendarId: msCalendar.id,
          name: msCalendar.name,
          description: msCalendar.description,
          defaultColor: msCalendar.color,
        },
      });

      calendars.push({
        id: calendar.id,
        connectedAccountId: calendar.connectedAccountId,
        externalCalendarId: calendar.externalCalendarId,
        name: calendar.name,
        description: calendar.description,
        timezone: calendar.timezone,
        defaultColor: calendar.defaultColor,
        isActive: calendar.isActive,
        createdAt: calendar.createdAt,
        updatedAt: calendar.updatedAt,
      });
    }

    return calendars;
  }

  /**
   * Sync events for a specific calendar
   */
  static async syncEventsForCalendar(
    calendarId: string, 
    dateRange?: { start: Date; end: Date }
  ): Promise<EventResponse[]> {
    const calendar = await prisma.calendar.findUnique({
      where: { id: calendarId },
      include: { connectedAccount: true },
    });

    if (!calendar) {
      throw new Error('Calendar not found');
    }

    const account = calendar.connectedAccount;

    // Check if token needs refresh
    if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
      const { OAuthService } = await import('./oauth.service');
      await OAuthService.refreshAccessToken(account.id);
    }

    let events: EventResponse[] = [];

    if (account.provider === 'google') {
      events = await this.syncGoogleEvents(calendar, dateRange);
    } else if (account.provider === 'microsoft') {
      events = await this.syncMicrosoftEvents(calendar, dateRange);
    }

    return events;
  }

  /**
   * Sync Google calendar events
   */
  private static async syncGoogleEvents(
    calendar: any, 
    dateRange?: { start: Date; end: Date }
  ): Promise<EventResponse[]> {
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (dateRange) {
      params.append('timeMin', dateRange.start.toISOString());
      params.append('timeMax', dateRange.end.toISOString());
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.externalCalendarId)}/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${calendar.connectedAccount.accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Google events: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { items: GoogleEvent[] };
    const events: EventResponse[] = [];
    
    for (const googleEvent of data.items) {
      const startTime = googleEvent.start.dateTime || googleEvent.start.date;
      const endTime = googleEvent.end.dateTime || googleEvent.end.date;
      const isAllDay = !googleEvent.start.dateTime;

      if (!startTime || !endTime) continue;

      const event = await prisma.event.upsert({
        where: {
          calendarId_externalId: {
            calendarId: calendar.id,
            externalId: googleEvent.id,
          },
        },
        update: {
          title: googleEvent.summary || 'Untitled Event',
          description: googleEvent.description,
          location: googleEvent.location,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          allDay: isAllDay,
          status: googleEvent.status,
          recurrence: googleEvent.recurrence?.join(','),
          htmlLink: googleEvent.htmlLink,
          updatedAt: new Date(),
        },
        create: {
          calendarId: calendar.id,
          externalId: googleEvent.id,
          title: googleEvent.summary || 'Untitled Event',
          description: googleEvent.description,
          location: googleEvent.location,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          allDay: isAllDay,
          status: googleEvent.status,
          recurrence: googleEvent.recurrence?.join(','),
          htmlLink: googleEvent.htmlLink,
        },
      });

      events.push({
        id: event.id,
        calendarId: event.calendarId,
        externalId: event.externalId,
        title: event.title,
        description: event.description,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        allDay: event.allDay,
        status: event.status,
        recurrence: event.recurrence,
        htmlLink: event.htmlLink,
        syncedAt: event.syncedAt,
        updatedAt: event.updatedAt,
      });
    }

    return events;
  }

  /**
   * Sync Microsoft calendar events
   */
  private static async syncMicrosoftEvents(
    calendar: any, 
    dateRange?: { start: Date; end: Date }
  ): Promise<EventResponse[]> {
    let url = `https://graph.microsoft.com/v1.0/me/calendars/${calendar.externalCalendarId}/events`;
    
    if (dateRange) {
      const params = new URLSearchParams({
        startDateTime: dateRange.start.toISOString(),
        endDateTime: dateRange.end.toISOString(),
      });
      url += `?${params}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${calendar.connectedAccount.accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Microsoft events: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { value: MicrosoftEvent[] };
    const events: EventResponse[] = [];
    
    for (const msEvent of data.value) {
      const event = await prisma.event.upsert({
        where: {
          calendarId_externalId: {
            calendarId: calendar.id,
            externalId: msEvent.id,
          },
        },
        update: {
          title: msEvent.subject || 'Untitled Event',
          description: msEvent.bodyPreview,
          location: msEvent.location?.displayName,
          startTime: new Date(msEvent.start.dateTime),
          endTime: new Date(msEvent.end.dateTime),
          allDay: msEvent.isAllDay || false,
          status: msEvent.showAs,
          htmlLink: msEvent.webLink,
          updatedAt: new Date(),
        },
        create: {
          calendarId: calendar.id,
          externalId: msEvent.id,
          title: msEvent.subject || 'Untitled Event',
          description: msEvent.bodyPreview,
          location: msEvent.location?.displayName,
          startTime: new Date(msEvent.start.dateTime),
          endTime: new Date(msEvent.end.dateTime),
          allDay: msEvent.isAllDay || false,
          status: msEvent.showAs,
          htmlLink: msEvent.webLink,
        },
      });

      events.push({
        id: event.id,
        calendarId: event.calendarId,
        externalId: event.externalId,
        title: event.title,
        description: event.description,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        allDay: event.allDay,
        status: event.status,
        recurrence: event.recurrence,
        htmlLink: event.htmlLink,
        syncedAt: event.syncedAt,
        updatedAt: event.updatedAt,
      });
    }

    return events;
  }

  /**
   * Sync all calendars and events for a user
   */
  static async syncAllForUser(userId: string): Promise<SyncResult> {
    const connectedAccounts = await prisma.connectedAccount.findMany({
      where: { userId },
    });

    const allCalendars: CalendarResponse[] = [];
    const allEvents: EventResponse[] = [];

    for (const account of connectedAccounts) {
      try {
        // Sync calendars first
        const calendars = await this.syncCalendarsForAccount(account.id);
        allCalendars.push(...calendars);
        
        // Then sync events for each calendar
        for (const calendar of calendars) {
          // Sync events for the next 3 months
          const now = new Date();
          const threeMonthsFromNow = new Date();
          threeMonthsFromNow.setMonth(now.getMonth() + 3);

          const events = await this.syncEventsForCalendar(calendar.id, {
            start: now,
            end: threeMonthsFromNow,
          });
          
          allEvents.push(...events);
        }
      } catch (error) {
        console.error(`Failed to sync account ${account.id}:`, error);
        // Continue with other accounts even if one fails
      }
    }

    return {
      calendars: allCalendars,
      events: allEvents,
    };
  }

  /**
   * Toggle calendar active status
   */
  static async toggleCalendarStatus(calendarId: string, userId: string): Promise<CalendarResponse> {
    // Verify user owns this calendar
    const calendar = await prisma.calendar.findFirst({
      where: {
        id: calendarId,
        connectedAccount: {
          userId,
        },
      },
    });

    if (!calendar) {
      throw new Error('Calendar not found or access denied');
    }

    const updatedCalendar = await prisma.calendar.update({
      where: { id: calendarId },
      data: {
        isActive: !calendar.isActive,
        updatedAt: new Date(),
      },
    });

    return {
      id: updatedCalendar.id,
      connectedAccountId: updatedCalendar.connectedAccountId,
      externalCalendarId: updatedCalendar.externalCalendarId,
      name: updatedCalendar.name,
      description: updatedCalendar.description,
      timezone: updatedCalendar.timezone,
      defaultColor: updatedCalendar.defaultColor,
      isActive: updatedCalendar.isActive,
      createdAt: updatedCalendar.createdAt,
      updatedAt: updatedCalendar.updatedAt,
    };
  }
}