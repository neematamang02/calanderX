import { Response } from "express";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200
): Response => {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(body);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = "Created successfully"
): Response => {
  return sendSuccess(res, data, message, 201);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: string
): Response => {
  const body: ApiResponse = {
    success: false,
    message,
    ...(error && { error }),
  };
  return res.status(statusCode).json(body);
};

export const sendNotFound = (
  res: Response,
  message = "Resource not found"
): Response => {
  return sendError(res, message, 404);
};

export const sendUnauthorized = (
  res: Response,
  message = "Unauthorized"
): Response => {
  return sendError(res, message, 401);
};

export const sendForbidden = (
  res: Response,
  message = "Forbidden"
): Response => {
  return sendError(res, message, 403);
};

export const sendBadRequest = (
  res: Response,
  message = "Bad request",
  error?: string
): Response => {
  return sendError(res, message, 400, error);
};
