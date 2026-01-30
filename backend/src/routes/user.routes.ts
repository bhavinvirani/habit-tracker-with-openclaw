import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getProfile,
  updateProfile,
  exportData,
  generateApiKey,
  getApiKey,
  revokeApiKey,
} from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Data Export
router.get('/export', exportData);

// API Key Management
router.get('/api-key', getApiKey);
router.post('/api-key', generateApiKey);
router.delete('/api-key', revokeApiKey);

export default router;
