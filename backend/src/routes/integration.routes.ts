import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getConnectedApps, disconnectProvider } from '../controllers/integration.controller';

const router = Router();

router.use(authenticate);

router.get('/', getConnectedApps);
router.delete('/:provider', disconnectProvider);

export default router;
