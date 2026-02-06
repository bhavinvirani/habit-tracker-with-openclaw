import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';
import {
  createHabitSchema,
  updateHabitSchema,
  reorderHabitsSchema,
  getHabitsQuerySchema,
} from '../validators/habit.validator';
import {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  archiveHabit,
  unarchiveHabit,
  getArchivedHabits,
  reorderHabits,
  getCategories,
  pauseHabit,
  resumeHabit,
  stackHabit,
} from '../controllers/habit.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Categories
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/categories', readLimiter as any, getCategories);

// Archived habits (must come before :id route)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/archived', readLimiter as any, getArchivedHabits);

// Reorder habits
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.patch('/reorder', writeLimiter as any, validateBody(reorderHabitsSchema), reorderHabits);

// CRUD operations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', writeLimiter as any, validateBody(createHabitSchema), createHabit);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/', readLimiter as any, validateQuery(getHabitsQuerySchema), getHabits);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/:id', readLimiter as any, getHabitById);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.patch('/:id', writeLimiter as any, validateBody(updateHabitSchema), updateHabit);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.delete('/:id', writeLimiter as any, deleteHabit);

// Archive/Unarchive
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/:id/archive', writeLimiter as any, archiveHabit);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/:id/unarchive', writeLimiter as any, unarchiveHabit);

// Pause/Resume (Vacation Mode)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/:id/pause', writeLimiter as any, pauseHabit);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/:id/resume', writeLimiter as any, resumeHabit);

// Habit Stacking
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/:id/stack', writeLimiter as any, stackHabit);

export default router;
