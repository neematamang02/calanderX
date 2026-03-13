import rateLimit from 'express-rate-limit';

/**
 * Rate limiting configurations for different endpoints
 */

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests
  skipSuccessfulRequests: true,
});

// Moderate rate limiting for OAuth endpoints
export const oauthRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many OAuth requests, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many API requests, please try again later',
    retryAfter: '15 minutes'
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