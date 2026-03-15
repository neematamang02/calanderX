import api from "../lib/axios";
import type {
  ApiResponse,
  PaginatedResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ConnectedAccount,
  OAuthInitResponse,
  Calendar,
  Event,
  CalendarBoard,
  BoardWithCalendars,
  CreateBoardRequest,
  UpdateBoardRequest,
  AddCalendarToBoardRequest,
  UpdateCalendarColorRequest,
  BoardEventsResponse,
  SharedLink,
  SharedLinkWithBoard,
  SharedLinkAnalytics,
  UpdateSharedLinkRequest,
  SyncResult,
  PaginationParams,
  DateRangeParams,
  CalendarEventsParams,
} from "../types/api";

// Auth API
export const authApi = {
  register: (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> =>
    api.post("/user/register", data).then((res) => res.data),

  login: (data: LoginRequest): Promise<ApiResponse<AuthResponse>> =>
    api.post("/user/login", data).then((res) => res.data),
};

// OAuth API
export const oauthApi = {
  initiateOAuth: (
    provider: "google" | "microsoft",
  ): Promise<ApiResponse<OAuthInitResponse>> =>
    api.get(`/oauth/connect/${provider}`).then((res) => res.data),

  getConnectedAccounts: (): Promise<ApiResponse<ConnectedAccount[]>> =>
    api.get("/oauth/accounts").then((res) => res.data),

  disconnectAccount: (accountId: string): Promise<ApiResponse<void>> =>
    api.delete(`/oauth/accounts/${accountId}`).then((res) => res.data),

  refreshToken: (accountId: string): Promise<ApiResponse<ConnectedAccount>> =>
    api.post(`/oauth/accounts/${accountId}/refresh`).then((res) => res.data),
};

// Calendar API
export const calendarApi = {
  getUserCalendars: (
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Calendar>> =>
    api.get("/calendars", { params }).then((res) => res.data),

  getCalendarEvents: (
    data: CalendarEventsParams,
  ): Promise<PaginatedResponse<Event>> => {
    const { calendarIds, ...params } = data;
    return api
      .post("/calendars/events", { calendarIds }, { params })
      .then((res) => res.data);
  },

  toggleCalendarStatus: (calendarId: string): Promise<ApiResponse<Calendar>> =>
    api.patch(`/calendars/${calendarId}/toggle`).then((res) => res.data),

  syncAccountCalendars: (accountId: string): Promise<ApiResponse<Calendar[]>> =>
    api.post(`/calendars/sync/account/${accountId}`).then((res) => res.data),

  syncCalendarEvents: (
    calendarId: string,
    params?: DateRangeParams,
  ): Promise<ApiResponse<Event[]>> =>
    api
      .post(`/calendars/sync/calendar/${calendarId}/events`, {}, { params })
      .then((res) => res.data),

  syncAllUserData: (): Promise<ApiResponse<SyncResult>> =>
    api.post("/calendars/sync/all").then((res) => res.data),
};

// Board API
export const boardApi = {
  createBoard: (
    data: CreateBoardRequest,
  ): Promise<ApiResponse<CalendarBoard>> =>
    api.post("/boards", data).then((res) => res.data),

  getUserBoards: (): Promise<ApiResponse<BoardWithCalendars[]>> =>
    api.get("/boards").then((res) => res.data),

  getBoardById: (boardId: string): Promise<ApiResponse<BoardWithCalendars>> =>
    api.get(`/boards/${boardId}`).then((res) => res.data),

  updateBoard: (
    boardId: string,
    data: UpdateBoardRequest,
  ): Promise<ApiResponse<CalendarBoard>> =>
    api.patch(`/boards/${boardId}`, data).then((res) => res.data),

  deleteBoard: (boardId: string): Promise<ApiResponse<void>> =>
    api.delete(`/boards/${boardId}`).then((res) => res.data),

  addCalendarToBoard: (
    boardId: string,
    data: AddCalendarToBoardRequest,
  ): Promise<ApiResponse<unknown>> =>
    api.post(`/boards/${boardId}/calendars`, data).then((res) => res.data),

  removeCalendarFromBoard: (
    boardId: string,
    calendarId: string,
  ): Promise<ApiResponse<void>> =>
    api
      .delete(`/boards/${boardId}/calendars/${calendarId}`)
      .then((res) => res.data),

  updateCalendarColor: (
    boardId: string,
    calendarId: string,
    data: UpdateCalendarColorRequest,
  ): Promise<ApiResponse<unknown>> =>
    api
      .patch(`/boards/${boardId}/calendars/${calendarId}`, data)
      .then((res) => res.data),

  getBoardEvents: (
    boardId: string,
    params?: DateRangeParams,
  ): Promise<ApiResponse<BoardEventsResponse>> =>
    api.get(`/boards/${boardId}/events`, { params }).then((res) => res.data),
};

// Share API
export const shareApi = {
  createSharedLink: (boardId: string): Promise<ApiResponse<SharedLink>> =>
    api.post(`/share/boards/${boardId}`).then((res) => res.data),

  getSharedLink: (boardId: string): Promise<ApiResponse<SharedLink>> =>
    api.get(`/share/boards/${boardId}`).then((res) => res.data),

  updateSharedLink: (
    boardId: string,
    data: UpdateSharedLinkRequest,
  ): Promise<ApiResponse<SharedLink>> =>
    api.patch(`/share/boards/${boardId}`, data).then((res) => res.data),

  deleteSharedLink: (boardId: string): Promise<ApiResponse<void>> =>
    api.delete(`/share/boards/${boardId}`).then((res) => res.data),

  regenerateToken: (boardId: string): Promise<ApiResponse<SharedLink>> =>
    api.post(`/share/boards/${boardId}/regenerate`).then((res) => res.data),

  getAnalytics: (boardId: string): Promise<ApiResponse<SharedLinkAnalytics>> =>
    api.get(`/share/boards/${boardId}/analytics`).then((res) => res.data),

  getUserSharedLinks: (): Promise<ApiResponse<SharedLinkWithBoard[]>> =>
    api.get("/share").then((res) => res.data),

  // Public API (no auth required)
  getSharedBoard: (
    token: string,
    params?: DateRangeParams,
  ): Promise<ApiResponse<BoardEventsResponse>> =>
    api.get(`/share/public/${token}`, { params }).then((res) => res.data),
};
