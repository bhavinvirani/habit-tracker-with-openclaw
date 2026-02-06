import { Router } from 'express';
import { authenticateApiKey } from '../middleware/apiKeyAuth';
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.use(botLimiter as any);
router.use(authenticateApiKey);

// Habit tracking
router.get('/habits/today', getTodayHabits);
router.post('/habits/check-in', validateBody(checkInSchema), checkIn);
router.post('/habits/check-in-by-name', validateBody(checkInByNameSchema), checkInByName);
router.get('/habits/summary', getDailySummary);

// Chat registration for reminders
router.post('/register-chat', validateBody(registerChatSchema), registerChat);

export default router;
