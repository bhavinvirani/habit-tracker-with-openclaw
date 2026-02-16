import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';
import { getConnectedApps, disconnectProvider } from '../controllers/integration.controller';

const router = Router();

router.use(authenticate);

router.get('/', readLimiter, getConnectedApps);
router.delete('/:provider', writeLimiter, disconnectProvider);

export default router;
