import { Router } from 'express';
import { authenticateApiKey, requireScopes } from '../middleware/apiKeyAuth';
import { botRequestLogger } from '../middleware/botRequestLogger';
import { botLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validate';
import {
  checkInSchema,
  checkInByNameSchema,
  registerChatSchema,
} from '../validators/bot.validator';
import {
  getTodayHabits,
  checkIn,
  checkInByName,
  getDailySummary,
  registerChat,
} from '../controllers/bot.controller';

const router = Router();

// All bot routes require rate limiting, API key auth, and detailed logging
router.use(botRequestLogger);
router.use(botLimiter);
router.use(authenticateApiKey);

// Habit tracking (read)
router.get('/habits/today', requireScopes('bot:read'), getTodayHabits);
router.get('/habits/summary', requireScopes('bot:read'), getDailySummary);

// Habit tracking (write)
router.post('/habits/check-in', requireScopes('bot:write'), validateBody(checkInSchema), checkIn);
router.post(
  '/habits/check-in-by-name',
  requireScopes('bot:write'),
  validateBody(checkInByNameSchema),
  checkInByName
);

// Chat registration for reminders
router.post(
  '/register-chat',
  requireScopes('bot:write'),
  validateBody(registerChatSchema),
  registerChat
);

export default router;
