import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

// ─────────────────────────────────────────────
// AppError Class
// Represents all known/operational errors
// thrown intentionally throughout the app
// ─────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Restore the prototype chain (required when extending built-ins in TS)
    Object.setPrototypeOf(this, AppError.prototype);

    // Capture clean stack trace excluding this constructor frame
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─────────────────────────────────────────────
// 404 Handler
// Catches any request that didn't match a route
// Must be registered AFTER all routes in app.ts
// ─────────────────────────────────────────────

export const notFound = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};

// ─────────────────────────────────────────────
// Global Error Handler
// Must be registered LAST in app.ts (4 args = Express error middleware)
// ─────────────────────────────────────────────

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Known operational error (thrown with AppError)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Prisma known error codes
  if (err.constructor.name === "PrismaClientKnownRequestError") {
    const prismaError = err as Error & { code?: string; meta?: unknown };

    if (prismaError.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "A record with this value already exists",
        error: "DUPLICATE_ENTRY",
      });
      return;
    }

    if (prismaError.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Record not found",
        error: "NOT_FOUND",
      });
      return;
    }
  }

  // Unexpected / unhandled error
  console.error("❌ Unhandled error:", err);

  res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    ...(env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};
