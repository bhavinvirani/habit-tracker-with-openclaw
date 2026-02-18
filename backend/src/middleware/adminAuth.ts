import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AuthorizationError } from '../utils/AppError';
import prisma from '../config/database';

export const requireAdmin = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AuthorizationError('Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      throw new AuthorizationError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};
