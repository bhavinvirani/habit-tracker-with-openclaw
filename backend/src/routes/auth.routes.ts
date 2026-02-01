import { Router } from 'express';
import { register, login, refresh, logout, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/register', authLimiter as any, validateBody(registerSchema), register);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/login', authLimiter as any, validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

export default router;
