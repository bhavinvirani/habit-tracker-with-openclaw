import { Router } from 'express';
import { register, login, refresh, logout, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);

router.post('/login', authLimiter, validateBody(loginSchema), login);

router.post('/refresh', refresh);

router.post('/logout', authenticate, logout);

router.get('/me', authenticate, getCurrentUser);

export default router;
