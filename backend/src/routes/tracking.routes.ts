import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';
import {
  checkInSchema,
  undoCheckInSchema,
  historyQuerySchema,
  dateParamSchema,
} from '../validators/tracking.validator';
import {
  getTodayHabits,
  checkIn,
  undoCheckIn,
  getHabitsByDate,
  getHistory,
  getMilestones,
} from '../controllers/tracking.controller';

const router = Router();

router.use(authenticate);

router.get('/today', readLimiter, getTodayHabits);

router.post('/check-in', writeLimiter, validateBody(checkInSchema), checkIn);

router.delete('/check-in', writeLimiter, validateBody(undoCheckInSchema), undoCheckIn);

router.get('/date/:date', readLimiter, validateParams(dateParamSchema), getHabitsByDate);

router.get('/history', readLimiter, validateQuery(historyQuerySchema), getHistory);

router.get('/milestones', readLimiter, getMilestones);

export default router;
