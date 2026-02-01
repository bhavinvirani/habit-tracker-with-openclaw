import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AuthenticationError } from '../utils/AppError';
import prisma from '../config/database';
import logger from '../utils/logger';

/**
 * Middleware that authenticates via X-API-Key header.
 * Sets req.userId just like the JWT authenticate middleware.
 */
export const authenticateApiKey = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      throw new AuthenticationError('API key required - provide X-API-Key header');
    }

    const user = await prisma.user.findUnique({
      where: { apiKey },
      select: { id: true },
    });

    if (!user) {
      throw new AuthenticationError('Invalid API key');
    }

    req.userId = user.id;
    logger.debug('User authenticated via API key', { userId: user.id });
    next();
  } catch (error) {
    next(error);
  }
};
