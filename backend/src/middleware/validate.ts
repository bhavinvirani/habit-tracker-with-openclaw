import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema, ZodIssue } from 'zod';
import { ValidationError } from '../utils/AppError';
import { ParsedQs } from 'qs';

/**
 * Helper to extract validation error details from ZodError
 */
function extractZodDetails(error: ZodError): { field: string; message: string }[] {
  return error.issues.map((e: ZodIssue) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
}

/**
 * Middleware factory for validating request body against a Zod schema
 */
export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Validation failed', extractZodDetails(error)));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Middleware factory for validating query parameters against a Zod schema
 */
export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as ParsedQs;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Invalid query parameters', extractZodDetails(error)));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Middleware factory for validating route parameters against a Zod schema
 */
export const validateParams = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as Record<string, string>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Invalid route parameters', extractZodDetails(error)));
      } else {
        next(error);
      }
    }
  };
};

// Alias for backward compatibility
export const validate = validateBody;
