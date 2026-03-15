import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';

/**
 * Rate limiting configurations for different endpoints
 */

// Development mode - more lenient rate limits
const isDevelopment = env.NODE_ENV === 'development';

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 min dev, 15 min prod
  max: isDevelopment ? 20 : 5, // 20 dev, 5 prod
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    retryAfter: isDevelopment ? '5 minutes' : '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests
  skipSuccessfulRequests: true,
});

// Moderate rate limiting for OAuth endpoints
export const oauthRateLimit = rateLimit({
  windowMs: isDevelopment ? 2 * 60 * 1000 : 5 * 60 * 1000, // 2 min dev, 5 min prod
  max: isDevelopment ? 100 : 50, // 100 dev, 50 prod
  message: {
    success: false,
    error: 'Rate limit exceeded. Please try again later.',
    retryAfter: isDevelopment ? '2 minutes' : '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: isDevelopment ? 2 * 60 * 1000 : 5 * 60 * 1000, // 2 min dev, 5 min prod
  max: isDevelopment ? 500 : 200, // 500 dev, 200 prod
  message: {
    success: false,
    error: 'Rate limit exceeded. Please try again later.',
    retryAfter: isDevelopment ? '2 minutes' : '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for public shared links (to prevent abuse)
export const publicShareRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests to shared calendar, please try again later',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limiting for password reset (if implemented)
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: 'Too many password reset attempts, please try again later',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});