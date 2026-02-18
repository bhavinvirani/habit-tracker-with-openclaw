import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  forgotPassword,
  validateResetToken,
  resetPassword,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';
import { authLimiter, sensitiveLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);

router.post('/login', authLimiter, validateBody(loginSchema), login);

router.post('/refresh', refresh);

router.post('/logout', authenticate, logout);

router.get('/me', authenticate, getCurrentUser);

router.post(
  '/forgot-password',
  sensitiveLimiter,
  validateBody(forgotPasswordSchema),
  forgotPassword
);

router.post('/validate-reset-token', authLimiter, validateResetToken);

router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), resetPassword);

export default router;
