import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { readLimiter, writeLimiter, sensitiveLimiter } from '../middleware/rateLimiter';
import {
  getProfile,
  updateProfile,
  exportData,
  generateApiKey,
  getApiKey,
  revokeApiKey,
  changePassword,
} from '../controllers/user.controller';
import { validateBody } from '../middleware/validate';
import { changePasswordSchema } from '../validators/user.validator';

const router = Router();

router.use(authenticate);

// Profile
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/profile', readLimiter as any, getProfile);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.put('/profile', writeLimiter as any, updateProfile);

// Password change (sensitive)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.put(
  '/password',
  sensitiveLimiter as any,
  validateBody(changePasswordSchema),
  changePassword
);

// Data Export (sensitive — heavy operation)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/export', sensitiveLimiter as any, exportData);

// API Key Management (sensitive)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/api-key', readLimiter as any, getApiKey);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/api-key', sensitiveLimiter as any, generateApiKey);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.delete('/api-key', sensitiveLimiter as any, revokeApiKey);

export default router;
