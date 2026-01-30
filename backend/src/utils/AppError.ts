/**
 * Base class for application errors
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: Record<string, unknown> | unknown[];

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: Record<string, unknown> | unknown[]
  ) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;
  }
}

/**
 * 400 - Bad Request
 */
export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    details?: Record<string, unknown> | unknown[]
  ) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

/**
 * 400 - Bad Request (alias for ValidationError)
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: Record<string, unknown> | unknown[]) {
    super(message, 400, true, 'BAD_REQUEST_ERROR', details);
  }
}

/**
 * 401 - Unauthorized
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

/**
 * 403 - Forbidden
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

/**
 * 404 - Not Found
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', id?: string | number) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, 404, true, 'NOT_FOUND_ERROR');
  }
}

/**
 * 409 - Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', details?: Record<string, unknown>) {
    super(message, 409, true, 'CONFLICT_ERROR', details);
  }
}

/**
 * 422 - Unprocessable Entity
 */
export class UnprocessableEntityError extends AppError {
  constructor(
    message: string = 'Unable to process the request',
    details?: Record<string, unknown>
  ) {
    super(message, 422, true, 'UNPROCESSABLE_ENTITY', details);
  }
}

/**
 * 429 - Too Many Requests
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
  }
}

/**
 * 500 - Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(
    message: string = 'An internal server error occurred',
    details?: Record<string, unknown>
  ) {
    super(message, 500, false, 'INTERNAL_SERVER_ERROR', details);
  }
}

/**
 * 503 - Service Unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, false, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: Record<string, unknown>) {
    super(message, 500, false, 'DATABASE_ERROR', details);
  }
}
