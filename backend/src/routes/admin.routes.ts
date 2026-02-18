import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';
import { validateBody, validateParams } from '../middleware/validate';
import { featureFlagKeyParamSchema, updateFeatureFlagSchema } from '../validators/admin.validator';
import {
  getAllFeatureFlags,
  updateFeatureFlag,
  getEnabledFeatures,
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
