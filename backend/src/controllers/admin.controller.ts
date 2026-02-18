import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { featureFlagService } from '../services/featureFlag.service';
import { UpdateFeatureFlagInput } from '../validators/admin.validator';

export const getAllFeatureFlags = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const flags = await featureFlagService.getAll();
  sendSuccess(res, { flags }, 'Feature flags retrieved successfully');
});

export const updateFeatureFlag = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  const data = req.body as UpdateFeatureFlagInput;
  const flag = await featureFlagService.updateFlag(key, data);
  sendSuccess(res, { flag }, `Feature flag '${key}' updated successfully`);
});

export const getEnabledFeatures = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const keys = await featureFlagService.getEnabledKeys();
  sendSuccess(res, { features: keys }, 'Enabled features retrieved successfully');
});
