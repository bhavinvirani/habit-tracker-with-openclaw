import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';
import { getConnectedApps, disconnectProvider } from '../controllers/integration.controller';

const router = Router();

router.use(authenticate);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/', readLimiter as any, getConnectedApps);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.delete('/:provider', writeLimiter as any, disconnectProvider);

export default router;
