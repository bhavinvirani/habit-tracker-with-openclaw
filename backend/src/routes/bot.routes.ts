import { Router } from 'express';
import { authenticateApiKey } from '../middleware/apiKeyAuth';
import { botRequestLogger } from '../middleware/botRequestLogger';
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

// All bot routes require API key authentication and detailed logging
router.use(botRequestLogger);
router.use(authenticateApiKey);

// Habit tracking
router.get('/habits/today', getTodayHabits);
router.post('/habits/check-in', validateBody(checkInSchema), checkIn);
router.post('/habits/check-in-by-name', validateBody(checkInByNameSchema), checkInByName);
router.get('/habits/summary', getDailySummary);

// Chat registration for reminders
router.post('/register-chat', validateBody(registerChatSchema), registerChat);

export default router;
