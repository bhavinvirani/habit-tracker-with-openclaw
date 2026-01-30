import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
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
router.get('/today', getTodayHabits);

// Check-in (log habit completion)
router.post('/check-in', validateBody(checkInSchema), checkIn);

// Undo check-in
router.delete('/check-in', validateBody(undoCheckInSchema), undoCheckIn);

// Get habits for a specific date
router.get('/date/:date', validateParams(dateParamSchema), getHabitsByDate);

// Get history for calendar/heatmap
router.get('/history', validateQuery(historyQuerySchema), getHistory);

// Get milestones
router.get('/milestones', getMilestones);

export default router;
