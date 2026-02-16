import { Request, Response, NextFunction } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import logger from '../utils/logger';
import { AppError } from '../utils/AppError';

// Safe keys that can be exposed in production error details
const SAFE_DETAIL_KEYS = new Set(['field', 'fields', 'code', 'type', 'limit', 'value']);

/**
 * Strip sensitive data (Prisma meta, stack traces, etc.) from error details in production
 */
function sanitizeDetails(
  details: Record<string, unknown> | unknown[]
): Record<string, unknown> | unknown[] | null {
  if (Array.isArray(details)) return details;

  const safe: Record<string, unknown> = {};
  let hasKeys = false;
  for (const key of Object.keys(details)) {
    if (SAFE_DETAIL_KEYS.has(key)) {
      safe[key] = details[key];
      hasKeys = true;
    }
  }
  return hasKeys ? safe : null;
}

/**
 * Convert Prisma errors to AppError
 */
const handlePrismaError = (error: PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002': {
      // Unique constraint violation
      const target = error.meta?.target as string[] | undefined;
      const field = target ? target[0] : 'field';
      return new AppError(
        `A record with this ${field} already exists`,
        409,
        true,
        'DUPLICATE_ENTRY',
        { field, meta: error.meta }
      );
    }

    case 'P2025':
      // Record not found
      return new AppError('Record not found', 404, true, 'NOT_FOUND');

    case 'P2003':
      // Foreign key constraint failed
      return new AppError('Related record not found', 400, true, 'FOREIGN_KEY_CONSTRAINT');

    case 'P2014':
      // Invalid ID
      return new AppError('Invalid ID provided', 400, true, 'INVALID_ID');

    default:
      return new AppError('Database operation failed', 500, false, 'DATABASE_ERROR', {
        code: error.code,
        meta: error.meta,
      });
  }
};

/**
 * Send error response to client
 */
const sendErrorResponse = (err: AppError, req: Request, res: Response) => {
  const { statusCode, message, code, details } = err;

  const errorResponse: {
    success: boolean;
    error: {
      message: string;
      code?: string;
      stack?: string;
      details?: Record<string, unknown> | unknown[];
    };
  } = {
    success: false,
    error: {
      message,
      code,
    },
  };

  // Add details in development or for operational errors
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    if (details) {
      errorResponse.error.details = details;
    }
  } else if (err.isOperational && details) {
    // Only send safe details for operational errors in production
    // Strip Prisma meta and internal details that could leak schema info
    const safeDetails = sanitizeDetails(details);
    if (safeDetails) {
      errorResponse.error.details = safeDetails;
    }
  }

  // Add request info to logs
  logger.error('Error occurred', {
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack,
      details: err.details,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: (req as Request & { userId?: string }).userId,
    },
  });

  res.status(statusCode).json(errorResponse);
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Default to 500 server error
  let error: AppError;

  // Check if it's already an AppError
  if (err instanceof AppError) {
    error = err;
  }
  // Handle Prisma errors
  else if (err instanceof PrismaClientKnownRequestError) {
    error = handlePrismaError(err);
  }
  // Handle Prisma validation errors
  else if (err instanceof PrismaClientValidationError) {
    error = new AppError('Invalid data provided to database', 400, true, 'VALIDATION_ERROR');
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, true, 'INVALID_TOKEN');
  } else if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401, true, 'TOKEN_EXPIRED');
  }
  // Handle body-parser errors (payload too large, malformed JSON, etc.)
  else if ('type' in err && (err as { type?: string }).type === 'entity.too.large') {
    error = new AppError('Request body too large', 413, true, 'PAYLOAD_TOO_LARGE');
  }
  // Handle validation errors (from zod)
  else if (err.name === 'ValidationError') {
    error = new AppError(err.message, 400, true, 'VALIDATION_ERROR');
  }
  // Generic error — hide internal message in production
  else {
    const safeMessage =
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message || 'An unexpected error occurred';
    error = new AppError(safeMessage, 500, false, 'INTERNAL_ERROR');
  }

  // Log programming or system errors
  if (!error.isOperational) {
    logger.error('CRITICAL ERROR - Non-operational error occurred', {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
      },
    });
  }

  sendErrorResponse(error, req, res);
};
