import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import {
  featureFlagKeyParamSchema,
  updateFeatureFlagSchema,
  createFeatureFlagSchema,
  userListQuerySchema,
  updateUserRoleSchema,
  userIdParamSchema,
  auditLogQuerySchema,
} from '../validators/admin.validator';
import {
  getAllFeatureFlags,
  updateFeatureFlag,
  createFeatureFlag,
  deleteFeatureFlag,
  getFeatureFlagAuditLog,
  getEnabledFeatures,
  listUsers,
  updateUserRole,
  getApplicationStats,
} from '../controllers/admin.controller';
import { requireFeature } from '../middleware/featureGate';
import { generateReports, getMyLatestReport } from '../controllers/report.controller';

const router = Router();

// Public (authenticated) — get enabled feature keys for frontend
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/features', authenticate, readLimiter as any, getEnabledFeatures);

// Admin-only — manage feature flags
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/admin/features', authenticate, requireAdmin, readLimiter as any, getAllFeatureFlags);

// IMPORTANT: Register /audit BEFORE /:key to prevent "audit" matching as a key param
router.get(
  '/admin/features/audit',
  authenticate,
  requireAdmin,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readLimiter as any,
  validateQuery(auditLogQuerySchema),
  getFeatureFlagAuditLog
);

router.post(
  '/admin/features',
  authenticate,
  requireAdmin,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeLimiter as any,
  validateBody(createFeatureFlagSchema),
  createFeatureFlag
);

router.patch(
  '/admin/features/:key',
  authenticate,
  requireAdmin,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeLimiter as any,
  validateParams(featureFlagKeyParamSchema),
  validateBody(updateFeatureFlagSchema),
  updateFeatureFlag
);

router.delete(
  '/admin/features/:key',
  authenticate,
  requireAdmin,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeLimiter as any,
  validateParams(featureFlagKeyParamSchema),
  deleteFeatureFlag
);

// Admin-only — user management
router.get(
  '/admin/users',
  authenticate,
  requireAdmin,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readLimiter as any,
  validateQuery(userListQuerySchema),
  listUsers
);

router.patch(
  '/admin/users/:id/role',
  authenticate,
  requireAdmin,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeLimiter as any,
  validateParams(userIdParamSchema),
  validateBody(updateUserRoleSchema),
  updateUserRole
);

// Admin-only — application stats
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/admin/stats', authenticate, requireAdmin, readLimiter as any, getApplicationStats);

// Report generation (admin only, requires ai_insights feature)
router.post(
  '/admin/generate-reports',
  authenticate,
  requireAdmin,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeLimiter as any,
  requireFeature('ai_insights'),
  generateReports
);

// User's latest report (authenticated, requires ai_insights feature)
router.get(
  '/reports/latest',
  authenticate,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readLimiter as any,
  requireFeature('ai_insights'),
  getMyLatestReport
);

export default router;
