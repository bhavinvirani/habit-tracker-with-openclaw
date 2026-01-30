import { Request, Response, NextFunction } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import logger from '../utils/logger';
import { AppError } from '../utils/AppError';

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
    // Only send details for operational errors in production
    errorResponse.error.details = details;
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
  // Handle validation errors (from express-validator)
  else if (err.name === 'ValidationError') {
    error = new AppError(err.message, 400, true, 'VALIDATION_ERROR');
  }
  // Generic error
  else {
    error = new AppError(
      err.message || 'An unexpected error occurred',
      500,
      false,
      'INTERNAL_ERROR'
    );
  }

  // Log programming or system errors
  if (!error.isOperational) {
    logger.error('💥 CRITICAL ERROR - Non-operational error occurred', {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        params: req.params,
        query: req.query,
      },
    });
  }

  sendErrorResponse(error, req, res);
};
