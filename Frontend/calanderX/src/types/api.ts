// API Types - Matching backend validation schemas
export type Provider = 'google' | 'microsoft';

// Base types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

// OAuth types
export interface ConnectedAccount {
  id: string;
  userId: string;
  provider: Provider;
  providerAccountId: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthInitResponse {
  authUrl: string;
  provider: Provider;
}

// Calendar types
export interface Calendar {
  id: string;
  connectedAccountId: string;
  externalCalendarId: string;
  name: string;
  description: string | null;
  timezone: string | null;
  defaultColor: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  calendarId: string;
  externalId: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string;
  allDay: boolean;
  status: string | null;
  recurrence: string | null;
  htmlLink: string | null;
  syncedAt: string;
  updatedAt: string;
}

// Board types
export interface CalendarBoard {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  maskEvents: boolean;
  maskLabel: string | null;
  showPastEvents: boolean;
  pastDaysLimit: number | null;
  futureDaysLimit: number | null;
  onlyCurrentWeek: boolean;
  twoWeeksAhead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BoardCalendar {
  id: string;
  boardId: string;
  calendarId: string;
  color: string;
  createdAt: string;
  calendar: Calendar;
}

export interface BoardWithCalendars extends CalendarBoard {
  boardCalendars: BoardCalendar[];
}

export interface CreateBoardRequest {
  name: string;
  description?: string;
  maskEvents?: boolean;
  maskLabel?: string;
  showPastEvents?: boolean;
  pastDaysLimit?: number;
  futureDaysLimit?: number;
  onlyCurrentWeek?: boolean;
  twoWeeksAhead?: boolean;
}

export interface UpdateBoardRequest {
  name?: string;
  description?: string;
  maskEvents?: boolean;
  maskLabel?: string;
  showPastEvents?: boolean;
  pastDaysLimit?: number;
  futureDaysLimit?: number;
  onlyCurrentWeek?: boolean;
  twoWeeksAhead?: boolean;
}

export interface AddCalendarToBoardRequest {
  calendarId: string;
  color: string;
}

export interface UpdateCalendarColorRequest {
  color: string;
}

export interface BoardEventsResponse {
  board: BoardWithCalendars;
  events: Event[];
  totalEvents: number;
}

// Share types
export interface SharedLink {
  id: string;
  boardId: string;
  token: string;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  shareUrl?: string;
}

export interface SharedLinkWithBoard {
  sharedLink: SharedLink;
  boardName: string;
  boardDescription?: string;
}

export interface SharedLinkAnalytics {
  sharedLink: SharedLink;
  analytics: {
    totalViews: number;
    isActive: boolean;
    createdDaysAgo: number;
    lastViewedAt?: string;
  };
}

export interface UpdateSharedLinkRequest {
  isActive: boolean;
}

// Sync types
export interface SyncResult {
  calendars: Calendar[];
  events: Event[];
}

export interface CalendarSyncRequest {
  calendarIds: string[];
}

export interface EventSyncRequest {
  startDate?: string;
  endDate?: string;
}

// Query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface CalendarEventsParams extends PaginationParams, DateRangeParams {
  calendarIds: string[];
}