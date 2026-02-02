import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AuthRequest } from './auth';

/**
 * Enhanced logging middleware specifically for Bot API endpoints.
 * Logs detailed request/response information to help debug integrations.
 */
export const botRequestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Get user info if authenticated
  const authReq = req as AuthRequest;
  const userId = authReq.userId || 'unauthenticated';

  // Log incoming request with details
  logger.info('🤖 Bot API Request', {
    requestId,
    method: req.method,
    endpoint: req.originalUrl,
    userId,
    body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
    headers: {
      'x-api-key': req.headers['x-api-key'] ? '***present***' : '***missing***',
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
    },
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Capture the original json method to log responses
  const originalJson = res.json.bind(res);
  res.json = (body: unknown): Response => {
    const duration = Date.now() - startTime;

    // Log response
    logger.info('🤖 Bot API Response', {
      requestId,
      method: req.method,
      endpoint: req.originalUrl,
      userId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: res.statusCode >= 200 && res.statusCode < 300,
      responsePreview: getResponsePreview(body),
      timestamp: new Date().toISOString(),
    });

    return originalJson(body);
  };

  next();
};

/**
 * Sanitize request body for logging (hide sensitive data)
 */
function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };

  // List of sensitive fields to mask
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***hidden***';
    }
  }

  return sanitized;
}

/**
 * Get a preview of the response for logging
 */
function getResponsePreview(body: unknown): string {
  if (!body) return 'empty';

  try {
    const str = JSON.stringify(body);
    if (str.length <= 200) return str;
    return str.substring(0, 200) + '...';
  } catch {
    return 'unable to serialize';
  }
}
