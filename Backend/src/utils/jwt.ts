import jwt from "jsonwebtoken";
import { env } from "../config/env";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export const signToken = (
  payload: Omit<JwtPayload, "iat" | "exp">
): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw new Error("Token verification failed");
  }
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload | null;
  } catch {
    return null;
  }
};
