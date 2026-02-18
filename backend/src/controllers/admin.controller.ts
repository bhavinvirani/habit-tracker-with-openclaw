import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response';
import { featureFlagService } from '../services/featureFlag.service';
import { adminService } from '../services/admin.service';
import {
  UpdateFeatureFlagInput,
  CreateFeatureFlagInput,
  UserListQuery,
  UpdateUserRoleInput,
  AuditLogQuery,
} from '../validators/admin.validator';

// ─── Feature Flags ──────────────────────────────────────────────

export const getAllFeatureFlags = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const flags = await featureFlagService.getAll();
  sendSuccess(res, { flags }, 'Feature flags retrieved successfully');
});

export const updateFeatureFlag = asyncHandler(async (req: AuthRequest, res: Response) => {
  const key = req.params.key as string;
  const data = req.body as UpdateFeatureFlagInput;
  const flag = await featureFlagService.updateFlag(key, data, req.userId!);
  sendSuccess(res, { flag }, `Feature flag '${key}' updated successfully`);
});

export const createFeatureFlag = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = req.body as CreateFeatureFlagInput;
  const flag = await featureFlagService.createFlag(data, req.userId!);
  sendCreated(res, { flag }, `Feature flag '${data.key}' created successfully`);
});

export const deleteFeatureFlag = asyncHandler(async (req: AuthRequest, res: Response) => {
  const key = req.params.key as string;
  await featureFlagService.deleteFlag(key, req.userId!);
  sendNoContent(res);
});

export const getFeatureFlagAuditLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { flagKey, page, limit } = req.query as unknown as AuditLogQuery;
  const { entries, total } = await featureFlagService.getAuditLog({ flagKey, page, limit });
  sendPaginated(res, entries as unknown[], page, limit, total, 'Audit log retrieved successfully');
});

// ─── Users ──────────────────────────────────────────────────────

export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, search, sortBy, sortOrder } = req.query as unknown as UserListQuery;
  const { users, total } = await adminService.getAllUsers({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
  });
  sendPaginated(res, users as unknown[], page, limit, total, 'Users retrieved successfully');
});

export const updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.params.id as string;
  const { isAdmin } = req.body as UpdateUserRoleInput;
  const user = await adminService.updateUserRole(userId, isAdmin, req.userId!);
  sendSuccess(res, { user }, `User role updated successfully`);
});

// ─── Application Stats ─────────────────────────────────────────

export const getApplicationStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const stats = await adminService.getApplicationStats();
  sendSuccess(res, { stats }, 'Application stats retrieved successfully');
});

// ─── Enabled Features (public, authenticated) ──────────────────

export const getEnabledFeatures = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const keys = await featureFlagService.getEnabledKeys();
  sendSuccess(res, { features: keys }, 'Enabled features retrieved successfully');
});
