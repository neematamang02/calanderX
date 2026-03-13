import { z } from "zod";

// ============================================================
// ENUMS
// ============================================================
export const ProviderSchema = z.enum(["google", "microsoft"]);
export type Provider = z.infer<typeof ProviderSchema>;

// ============================================================
// BASE SCHEMAS
// ============================================================
export const UuidSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
export const DateTimeSchema = z.string().datetime().or(z.date());

// ============================================================
// USER SCHEMAS
// ============================================================
export const UserCreateSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

export const UserLoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password is required"),
});

export const UserUpdateSchema = z.object({
  name: z.string().optional(),
  email: EmailSchema.optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

export const UserResponseSchema = z.object({
  id: UuidSchema,
  email: EmailSchema,
  name: z.string().nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

// ============================================================
// OAUTH SCHEMAS
// ============================================================
export const OAuthStateSchema = z.object({
  userId: UuidSchema,
  provider: ProviderSchema,
  timestamp: z.number(),
  nonce: z.string(),
});

export const OAuthCallbackSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  state: z.string().min(1, "State parameter is required"),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export const OAuthTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number().optional(),
  token_type: z.string().default("Bearer"),
  scope: z.string().optional(),
});

export const OAuthUserInfoSchema = z.object({
  id: z.string(),
  email: EmailSchema,
  name: z.string().optional(),
  picture: z.string().url().optional(),
});

// ============================================================
// CONNECTED ACCOUNT SCHEMAS
// ============================================================
export const ConnectedAccountCreateSchema = z.object({
  provider: ProviderSchema,
  providerAccountId: z.string(),
  email: EmailSchema,
  displayName: z.string().optional(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: DateTimeSchema.optional(),
});

export const ConnectedAccountResponseSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  provider: ProviderSchema,
  providerAccountId: z.string(),
  email: EmailSchema,
  displayName: z.string().nullable(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

// ============================================================
// CALENDAR SYNC SCHEMAS
// ============================================================
export const CalendarSyncRequestSchema = z.object({
  calendarIds: z.array(UuidSchema).min(1, "At least one calendar ID is required"),
});

export const EventSyncRequestSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"]
});

// ============================================================
// CALENDAR SCHEMAS
// ============================================================
export const CalendarCreateSchema = z.object({
  connectedAccountId: UuidSchema,
  externalCalendarId: z.string(),
  name: z.string().min(1, "Calendar name is required"),
  description: z.string().optional(),
  timezone: z.string().optional(),
  defaultColor: HexColorSchema.optional(),
  isActive: z.boolean().default(true),
});

export const CalendarUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  timezone: z.string().optional(),
  defaultColor: HexColorSchema.optional(),
  isActive: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

export const CalendarResponseSchema = z.object({
  id: UuidSchema,
  connectedAccountId: UuidSchema,
  externalCalendarId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  timezone: z.string().nullable(),
  defaultColor: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

// ============================================================
// EVENT SCHEMAS
// ============================================================
export const EventCreateSchema = z.object({
  calendarId: UuidSchema,
  externalId: z.string(),
  title: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: DateTimeSchema,
  endTime: DateTimeSchema,
  allDay: z.boolean().default(false),
  status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
  recurrence: z.string().optional(),
  htmlLink: z.string().url().optional(),
}).refine(data => new Date(data.endTime) > new Date(data.startTime), {
  message: "End time must be after start time",
  path: ["endTime"]
});

export const EventUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: DateTimeSchema.optional(),
  endTime: DateTimeSchema.optional(),
  allDay: z.boolean().optional(),
  status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
  recurrence: z.string().optional(),
  htmlLink: z.string().url().optional(),
}).refine(data => {
  if (data.startTime && data.endTime) {
    return new Date(data.endTime) > new Date(data.startTime);
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["endTime"]
});

export const EventResponseSchema = z.object({
  id: UuidSchema,
  calendarId: UuidSchema,
  externalId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
  startTime: DateTimeSchema,
  endTime: DateTimeSchema,
  allDay: z.boolean(),
  status: z.string().nullable(),
  recurrence: z.string().nullable(),
  htmlLink: z.string().nullable(),
  syncedAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

// ============================================================
// CALENDAR BOARD SCHEMAS
// ============================================================
export const CalendarBoardCreateSchema = z.object({
  name: z.string().min(1, "Board name is required"),
  description: z.string().optional(),
  maskEvents: z.boolean().default(false),
  maskLabel: z.string().default("Busy"),
  showPastEvents: z.boolean().default(true),
  pastDaysLimit: z.number().int().positive().optional(),
  futureDaysLimit: z.number().int().positive().optional(),
  onlyCurrentWeek: z.boolean().default(false),
  twoWeeksAhead: z.boolean().default(false),
});

export const CalendarBoardUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  maskEvents: z.boolean().optional(),
  maskLabel: z.string().optional(),
  showPastEvents: z.boolean().optional(),
  pastDaysLimit: z.number().int().positive().nullable().optional(),
  futureDaysLimit: z.number().int().positive().nullable().optional(),
  onlyCurrentWeek: z.boolean().optional(),
  twoWeeksAhead: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

export const CalendarBoardResponseSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  maskEvents: z.boolean(),
  maskLabel: z.string().nullable(),
  showPastEvents: z.boolean(),
  pastDaysLimit: z.number().nullable(),
  futureDaysLimit: z.number().nullable(),
  onlyCurrentWeek: z.boolean(),
  twoWeeksAhead: z.boolean(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

// ============================================================
// BOARD CALENDAR SCHEMAS
// ============================================================
export const BoardCalendarCreateSchema = z.object({
  calendarId: UuidSchema,
  color: HexColorSchema,
});

export const BoardCalendarUpdateSchema = z.object({
  color: HexColorSchema,
});

export const BoardCalendarResponseSchema = z.object({
  id: UuidSchema,
  boardId: UuidSchema,
  calendarId: UuidSchema,
  color: z.string(),
  createdAt: DateTimeSchema,
});

// ============================================================
// SHARED LINK SCHEMAS
// ============================================================
export const SharedLinkCreateSchema = z.object({
  boardId: UuidSchema,
});

export const SharedLinkUpdateSchema = z.object({
  isActive: z.boolean(),
});

export const SharedLinkResponseSchema = z.object({
  id: UuidSchema,
  boardId: UuidSchema,
  token: UuidSchema,
  isActive: z.boolean(),
  viewCount: z.number(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export const ShareTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/, "Invalid share token format");

// ============================================================
// QUERY PARAMETER SCHEMAS
// ============================================================
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"]
});

// ============================================================
// SYNC RESULT SCHEMAS
// ============================================================
export const SyncResultSchema = z.object({
  calendars: z.array(CalendarResponseSchema),
  events: z.array(EventResponseSchema),
});

// ============================================================
// API RESPONSE SCHEMAS
// ============================================================
export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.union([
    ApiSuccessResponseSchema(dataSchema),
    ApiErrorResponseSchema,
  ]);

// ============================================================
// UTILITY TYPES
// ============================================================
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;

export type OAuthState = z.infer<typeof OAuthStateSchema>;
export type OAuthCallback = z.infer<typeof OAuthCallbackSchema>;
export type OAuthTokenResponse = z.infer<typeof OAuthTokenResponseSchema>;
export type OAuthUserInfo = z.infer<typeof OAuthUserInfoSchema>;

export type CalendarSyncRequest = z.infer<typeof CalendarSyncRequestSchema>;
export type EventSyncRequest = z.infer<typeof EventSyncRequestSchema>;
export type SyncResult = z.infer<typeof SyncResultSchema>;

export type ConnectedAccountCreate = z.infer<typeof ConnectedAccountCreateSchema>;
export type ConnectedAccountResponse = z.infer<typeof ConnectedAccountResponseSchema>;

export type CalendarCreate = z.infer<typeof CalendarCreateSchema>;
export type CalendarUpdate = z.infer<typeof CalendarUpdateSchema>;
export type CalendarResponse = z.infer<typeof CalendarResponseSchema>;

export type EventCreate = z.infer<typeof EventCreateSchema>;
export type EventUpdate = z.infer<typeof EventUpdateSchema>;
export type EventResponse = z.infer<typeof EventResponseSchema>;

export type CalendarBoardCreate = z.infer<typeof CalendarBoardCreateSchema>;
export type CalendarBoardUpdate = z.infer<typeof CalendarBoardUpdateSchema>;
export type CalendarBoardResponse = z.infer<typeof CalendarBoardResponseSchema>;

export type BoardCalendarCreate = z.infer<typeof BoardCalendarCreateSchema>;
export type BoardCalendarUpdate = z.infer<typeof BoardCalendarUpdateSchema>;
export type BoardCalendarResponse = z.infer<typeof BoardCalendarResponseSchema>;

export type SharedLinkCreate = z.infer<typeof SharedLinkCreateSchema>;
export type SharedLinkUpdate = z.infer<typeof SharedLinkUpdateSchema>;
export type SharedLinkResponse = z.infer<typeof SharedLinkResponseSchema>;
export type ShareToken = z.infer<typeof ShareTokenSchema>;

export type Pagination = z.infer<typeof PaginationSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;