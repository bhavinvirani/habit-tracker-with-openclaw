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

// Today's habits with completion status
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/today', readLimiter as any, getTodayHabits);

// Check-in (log habit completion)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/check-in', writeLimiter as any, validateBody(checkInSchema), checkIn);

// Undo check-in
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.delete('/check-in', writeLimiter as any, validateBody(undoCheckInSchema), undoCheckIn);

// Get habits for a specific date
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/date/:date', readLimiter as any, validateParams(dateParamSchema), getHabitsByDate);

// Get history for calendar/heatmap
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/history', readLimiter as any, validateQuery(historyQuerySchema), getHistory);

// Get milestones
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/milestones', readLimiter as any, getMilestones);

export default router;
