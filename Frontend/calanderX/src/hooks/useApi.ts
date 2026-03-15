import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "react-toastify";
import {
  authApi,
  oauthApi,
  calendarApi,
  boardApi,
  shareApi,
} from "../services/api";
import type {
  LoginRequest,
  RegisterRequest,
  CreateBoardRequest,
  UpdateBoardRequest,
  AddCalendarToBoardRequest,
  UpdateCalendarColorRequest,
  UpdateSharedLinkRequest,
  PaginationParams,
  DateRangeParams,
  CalendarEventsParams,
} from "../types/api";

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const responseError = error.response?.data?.error;
    if (typeof responseError === "string" && responseError.trim().length > 0) {
      return responseError;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

// Query Keys
export const queryKeys = {
  connectedAccounts: ["connectedAccounts"],
  calendars: (params?: PaginationParams) => ["calendars", params],
  calendarEvents: (params: CalendarEventsParams) => ["calendarEvents", params],
  boards: ["boards"],
  board: (id: string) => ["board", id],
  boardEvents: (id: string, params?: DateRangeParams) => [
    "boardEvents",
    id,
    params,
  ],
  sharedLinks: ["sharedLinks"],
  sharedLink: (boardId: string) => ["sharedLink", boardId],
  sharedLinkAnalytics: (boardId: string) => ["sharedLinkAnalytics", boardId],
  publicBoard: (token: string, params?: DateRangeParams) => [
    "publicBoard",
    token,
    params,
  ],
};

// Auth Hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "Login failed");
      toast.error(message);
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "Registration failed");
      toast.error(message);
    },
  });
};

// OAuth Hooks
export const useConnectedAccounts = () => {
  return useQuery({
    queryKey: queryKeys.connectedAccounts,
    queryFn: () => oauthApi.getConnectedAccounts(),
  });
};

export const useInitiateOAuth = () => {
  return useMutation({
    mutationFn: (provider: "google" | "microsoft") =>
      oauthApi.initiateOAuth(provider),
    onSuccess: (data) => {
      if (data.success && data.data) {
        window.location.href = data.data.authUrl;
      }
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "OAuth initiation failed");
      toast.error(message);
    },
  });
};

export const useDisconnectAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => oauthApi.disconnectAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connectedAccounts });
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
      toast.success("Account disconnected successfully");
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "Failed to disconnect account");
      toast.error(message);
    },
  });
};

export const useRefreshToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => oauthApi.refreshToken(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connectedAccounts });
      toast.success("Token refreshed successfully");
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "Failed to refresh token");
      toast.error(message);
    },
  });
};

// Calendar Hooks
export const useCalendars = (params?: PaginationParams) => {
  return useQuery({
    queryKey: queryKeys.calendars(params),
    queryFn: () => calendarApi.getUserCalendars(params),
  });
};

export const useCalendarEvents = (params: CalendarEventsParams) => {
  return useQuery({
    queryKey: queryKeys.calendarEvents(params),
    queryFn: () => calendarApi.getCalendarEvents(params),
    enabled: params.calendarIds.length > 0,
  });
};

export const useToggleCalendarStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (calendarId: string) =>
      calendarApi.toggleCalendarStatus(calendarId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
      const status = data.data?.isActive ? "activated" : "deactivated";
      toast.success(`Calendar ${status} successfully`);
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(
        error,
        "Failed to toggle calendar status",
      );
      toast.error(message);
    },
  });
};

export const useSyncAccountCalendars = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) =>
      calendarApi.syncAccountCalendars(accountId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
      toast.success(`Synced ${data.data?.length || 0} calendars`);
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "Failed to sync calendars");
      toast.error(message);
    },
  });
};

export const useSyncCalendarEvents = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      calendarId,
      params,
    }: {
      calendarId: string;
      params?: DateRangeParams;
    }) => calendarApi.syncCalendarEvents(calendarId, params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      queryClient.invalidateQueries({ queryKey: ["boardEvents"] });
      toast.success(`Synced ${data.data?.length || 0} events`);
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "Failed to sync events");
      toast.error(message);
    },
  });
};

export const useSyncAllUserData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => calendarApi.syncAllUserData(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      queryClient.invalidateQueries({ queryKey: ["boardEvents"] });
      const result = data.data;
      toast.success(
        `Synced ${result?.calendars.length || 0} calendars and ${result?.events.length || 0} events`,
      );
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "Failed to sync data");
      toast.error(message);
    },
  });
};

// Board Hooks
export const useBoards = () => {
  return useQuery({
    queryKey: queryKeys.boards,
    queryFn: () => boardApi.getUserBoards(),
  });
};

export const useBoard = (boardId: string) => {
  return useQuery({
    queryKey: queryKeys.board(boardId),
    queryFn: () => boardApi.getBoardById(boardId),
    enabled: !!boardId,
  });
};

export const useBoardEvents = (boardId: string, params?: DateRangeParams) => {
  return useQuery({
    queryKey: queryKeys.boardEvents(boardId, params),
    queryFn: () => boardApi.getBoardEvents(boardId, params),
    enabled: !!boardId,
  });
};

export const useCreateBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBoardRequest) => boardApi.createBoard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards });
      toast.success("Board created successfully");
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "Failed to create board");
      toast.error(message);
    },
  });
};

export const useUpdateBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      data,
    }: {
      boardId: string;
      data: UpdateBoardRequest;
    }) => boardApi.updateBoard(boardId, data),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards });
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
      toast.success("Board updated successfully");
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "Failed to update board");
      toast.error(message);
    },
  });
};

export const useDeleteBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (boardId: string) => boardApi.deleteBoard(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards });
      toast.success("Board deleted successfully");
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "Failed to delete board");
      toast.error(message);
    },
  });
};

export const useAddCalendarToBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      data,
    }: {
      boardId: string;
      data: AddCalendarToBoardRequest;
    }) => boardApi.addCalendarToBoard(boardId, data),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards });
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.boardEvents(boardId),
      });
      toast.success("Calendar added to board");
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(
        error,
        "Failed to add calendar to board",
      );
      toast.error(message);
    },
  });
};

export const useRemoveCalendarFromBoard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      calendarId,
    }: {
      boardId: string;
      calendarId: string;
    }) => boardApi.removeCalendarFromBoard(boardId, calendarId),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards });
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.boardEvents(boardId),
      });
      toast.success("Calendar removed from board");
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(
        error,
        "Failed to remove calendar from board",
      );
      toast.error(message);
    },
  });
};

export const useUpdateCalendarColor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      calendarId,
      data,
    }: {
      boardId: string;
      calendarId: string;
      data: UpdateCalendarColorRequest;
    }) => boardApi.updateCalendarColor(boardId, calendarId, data),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards });
      queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
      toast.success("Calendar color updated");
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(
        error,
        "Failed to update calendar color",
      );
      toast.error(message);
    },
  });
};

// Share Hooks
export const useSharedLinks = () => {
  return useQuery({
    queryKey: queryKeys.sharedLinks,
    queryFn: () => shareApi.getUserSharedLinks(),
  });
};

export const useSharedLink = (boardId: string) => {
  return useQuery({
    queryKey: queryKeys.sharedLink(boardId),
    queryFn: () => shareApi.getSharedLink(boardId),
    enabled: !!boardId,
  });
};

export const useSharedLinkAnalytics = (boardId: string) => {
  return useQuery({
    queryKey: queryKeys.sharedLinkAnalytics(boardId),
    queryFn: () => shareApi.getAnalytics(boardId),
    enabled: !!boardId,
  });
};

export const useCreateSharedLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (boardId: string) => shareApi.createSharedLink(boardId),
    onSuccess: (_, boardId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sharedLinks });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sharedLink(boardId),
      });
      toast.success("Shared link created");
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "Failed to create shared link");
      toast.error(message);
    },
  });
};

export const useUpdateSharedLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      boardId,
      data,
    }: {
      boardId: string;
      data: UpdateSharedLinkRequest;
    }) => shareApi.updateSharedLink(boardId, data),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sharedLinks });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sharedLink(boardId),
      });
      toast.success("Shared link updated");
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "Failed to update shared link");
      toast.error(message);
    },
  });
};

export const useDeleteSharedLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (boardId: string) => shareApi.deleteSharedLink(boardId),
    onSuccess: (_, boardId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sharedLinks });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sharedLink(boardId),
      });
      toast.success("Shared link deleted");
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "Failed to delete shared link");
      toast.error(message);
    },
  });
};

export const useRegenerateToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (boardId: string) => shareApi.regenerateToken(boardId),
    onSuccess: (_, boardId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sharedLinks });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sharedLink(boardId),
      });
      toast.success("Token regenerated");
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "Failed to regenerate token");
      toast.error(message);
    },
  });
};

// Public Hooks (no auth required)
export const usePublicBoard = (token: string, params?: DateRangeParams) => {
  return useQuery({
    queryKey: queryKeys.publicBoard(token, params),
    queryFn: () => shareApi.getSharedBoard(token, params),
    enabled: !!token,
  });
};
