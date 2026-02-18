import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404, true, 'NOT_FOUND'));
};
