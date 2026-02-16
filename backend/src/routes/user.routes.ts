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
router.get('/profile', readLimiter, getProfile);
router.put('/profile', writeLimiter, updateProfile);

// Password change (sensitive)
router.put('/password', sensitiveLimiter, validateBody(changePasswordSchema), changePassword);

// Data Export (sensitive -- heavy operation)
router.get('/export', sensitiveLimiter, exportData);

// API Key Management (sensitive)
router.get('/api-key', readLimiter, getApiKey);
router.post('/api-key', sensitiveLimiter, generateApiKey);
router.delete('/api-key', sensitiveLimiter, revokeApiKey);

export default router;
