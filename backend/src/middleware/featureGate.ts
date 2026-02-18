import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { featureFlagService } from '../services/featureFlag.service';
import { AuthorizationError } from '../utils/AppError';

export const requireFeature = (featureKey: string) => {
  return async (_req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const enabled = await featureFlagService.isEnabled(featureKey);
      if (!enabled) {
        throw new AuthorizationError(`Feature '${featureKey}' is not enabled`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
