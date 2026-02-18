import rateLimit, { Options } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from './auth';
import { getRedisClientForStore } from '../config/redis';

const isTest = process.env.NODE_ENV === 'test';

// ============ RATE LIMIT STATS ============

const rateLimitHits: Record<string, number> = {};

export function getRateLimitStats(): { totalThrottled: number; byLimiter: Record<string, number> } {
  const totalThrottled = Object.values(rateLimitHits).reduce((sum, n) => sum + n, 0);
  return { totalThrottled, byLimiter: { ...rateLimitHits } };
}

// No-op middleware for test environment
const noopLimiter: RequestHandler = (_req, _res, next) => {
  next();
};

/**
 * Create a Redis store for rate limiting if Redis is available.
 * Falls back to the default in-memory store otherwise.
 */
function createRedisStore(prefix: string): RedisStore | undefined {
  const redis = getRedisClientForStore();
  if (!redis) return undefined;

  return new RedisStore({
    // Use sendCommand for ioredis compatibility
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as never,
    prefix: `rl:${prefix}:`,
  });
}

/**
 * Helper to create a rate limiter (disabled in test)
 */
function createLimiter(
  name: string,
  opts: Partial<Options> & { redisPrefix?: string }
): RequestHandler {
  if (isTest) return noopLimiter;

  const { redisPrefix, ...rateLimitOpts } = opts;

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
    handler: (_req: Request, res: Response) => {
      rateLimitHits[name] = (rateLimitHits[name] || 0) + 1;
      const msg = rateLimitOpts.message || {
        success: false,
        error: { message: 'Too many requests, please try again later', code: 'RATE_LIMIT_ERROR' },
      };
      res.status(429).json(msg);
    },
    ...(redisPrefix ? { store: createRedisStore(redisPrefix) } : {}),
    ...rateLimitOpts,
  });
}

// ============ AUTH (strictest — brute-force protection) ============

/**
 * Login / register: 10 requests per 15 minutes per IP
 */
export const authLimiter = createLimiter('auth', {
  windowMs: 15 * 60 * 1000,
  limit: 10,
  redisPrefix: 'auth',
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
export const writeLimiter = createLimiter('write', {
  windowMs: 15 * 60 * 1000,
  limit: 60,
  redisPrefix: 'write',
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
export const readLimiter = createLimiter('read', {
  windowMs: 15 * 60 * 1000,
  limit: 200,
  redisPrefix: 'read',
  keyGenerator: (req: Request) => {
    return (req as AuthRequest).userId || req.ip || 'unknown';
  },
});

// ============ ANALYTICS (expensive queries) ============

/**
 * Analytics endpoints: 120 requests per 15 minutes
 * The analytics page loads ~12 endpoints per visit
 */
export const analyticsLimiter = createLimiter('analytics', {
  windowMs: 15 * 60 * 1000,
  limit: 120,
  redisPrefix: 'analytics',
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
export const botLimiter = createLimiter('bot', {
  windowMs: 60 * 1000,
  limit: 30,
  redisPrefix: 'bot',
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
export const sensitiveLimiter = createLimiter('sensitive', {
  windowMs: 60 * 60 * 1000,
  limit: 5,
  redisPrefix: 'sensitive',
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
export const healthLimiter = createLimiter('health', {
  windowMs: 60 * 1000,
  limit: 20,
  redisPrefix: 'health',
});

// ============ ACTUATOR (public stats endpoint) ============

/**
 * Actuator stats: 10 requests per minute per IP
 * Stricter than health since it runs DB queries
 */
export const actuatorLimiter = createLimiter('actuator', {
  windowMs: 60 * 1000,
  limit: 10,
  redisPrefix: 'actuator',
  message: {
    success: false,
    error: {
      message: 'Too many actuator requests, please try again later',
      code: 'ACTUATOR_RATE_LIMIT',
    },
  },
});

// ============ GENERAL FALLBACK ============

/**
 * Catch-all for any route not covered by a specific limiter
 * 100 requests per 15 minutes per IP
 */
export const generalLimiter = createLimiter('general', {
  windowMs: 15 * 60 * 1000,
  limit: 100,
  redisPrefix: 'general',
});
