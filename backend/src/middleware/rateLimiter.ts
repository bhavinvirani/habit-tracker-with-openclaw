import rateLimit, { Options } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

const isTest = process.env.NODE_ENV === 'test';

// No-op middleware for test environment
const noopLimiter = (_req: Request, _res: Response, next: NextFunction) => next();

/**
 * Helper to create a rate limiter (disabled in test)
 */
function createLimiter(opts: Partial<Options>) {
  if (isTest) return noopLimiter;
  return rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMIT_ERROR',
      },
    },
    ...opts,
  });
}

// ============ AUTH (strictest — brute-force protection) ============

/**
 * Login / register: 10 requests per 15 minutes per IP
 */
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT',
    },
  },
});

// ============ WRITES (moderate — prevent spam) ============

/**
 * Create/update/delete operations: 60 requests per 15 minutes
 * Keyed by userId when authenticated, falls back to IP
 */
export const writeLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  keyGenerator: (req: Request) => {
    return (req as AuthRequest).userId || req.ip || 'unknown';
  },
  message: {
    success: false,
    error: {
      message: 'Too many write requests, please slow down',
      code: 'WRITE_RATE_LIMIT',
    },
  },
});

// ============ READS (generous — normal usage) ============

/**
 * Read operations: 200 requests per 15 minutes
 * Keyed by userId when authenticated, falls back to IP
 */
export const readLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  keyGenerator: (req: Request) => {
    return (req as AuthRequest).userId || req.ip || 'unknown';
  },
});

// ============ ANALYTICS (expensive queries) ============

/**
 * Analytics endpoints: 30 requests per 15 minutes
 * These run heavy DB aggregations
 */
export const analyticsLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  keyGenerator: (req: Request) => {
    return (req as AuthRequest).userId || req.ip || 'unknown';
  },
  message: {
    success: false,
    error: {
      message: 'Too many analytics requests, please try again later',
      code: 'ANALYTICS_RATE_LIMIT',
    },
  },
});

// ============ BOT / EXTERNAL API ============

/**
 * Bot endpoints: 30 requests per minute per API key
 * Keyed by API key header
 */
export const botLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator: (req: Request) => {
    return (req.headers['x-api-key'] as string) || req.ip || 'unknown';
  },
  message: {
    success: false,
    error: {
      message: 'Bot rate limit exceeded, please slow down',
      code: 'BOT_RATE_LIMIT',
    },
  },
});

// ============ SENSITIVE OPERATIONS ============

/**
 * API key generation, data export: 5 requests per hour
 */
export const sensitiveLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: (req: Request) => {
    return (req as AuthRequest).userId || req.ip || 'unknown';
  },
  message: {
    success: false,
    error: {
      message: 'Too many requests for this operation, please try again later',
      code: 'SENSITIVE_RATE_LIMIT',
    },
  },
});

// ============ HEALTH CHECK ============

/**
 * Health endpoint: 20 requests per minute per IP
 */
export const healthLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 20,
});

// ============ GENERAL FALLBACK ============

/**
 * Catch-all for any route not covered by a specific limiter
 * 100 requests per 15 minutes per IP
 */
export const generalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100,
});
