import { Router } from 'express';
import { getStats } from '../controllers/actuator.controller';
import { actuatorLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/stats', actuatorLimiter, getStats);

export default router;
