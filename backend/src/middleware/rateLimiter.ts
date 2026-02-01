import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const isDevelopment = process.env.NODE_ENV !== 'production';

// No-op middleware for development
const noopLimiter = (_req: Request, _res: Response, next: NextFunction) => next();

/**
 * General API rate limiter - 100 requests per 15 minutes per IP
 * Disabled in development mode
 */
export const generalLimiter = isDevelopment
  ? noopLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          message: 'Too many requests, please try again later',
          code: 'RATE_LIMIT_ERROR',
        },
      },
    });

/**
 * Strict rate limiter for auth endpoints - 5 requests per 15 minutes per IP
 * Disabled in development mode
 */
export const authLimiter = isDevelopment
  ? noopLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 5,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          message: 'Too many authentication attempts, please try again later',
          code: 'RATE_LIMIT_ERROR',
        },
      },
    });
