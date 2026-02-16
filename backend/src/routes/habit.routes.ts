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
router.get('/categories', readLimiter, getCategories);

// Archived habits (must come before :id route)
router.get('/archived', readLimiter, getArchivedHabits);

// Reorder habits
router.patch('/reorder', writeLimiter, validateBody(reorderHabitsSchema), reorderHabits);

// CRUD operations
router.post('/', writeLimiter, validateBody(createHabitSchema), createHabit);
router.get('/', readLimiter, validateQuery(getHabitsQuerySchema), getHabits);
router.get('/:id', readLimiter, getHabitById);
router.patch('/:id', writeLimiter, validateBody(updateHabitSchema), updateHabit);
router.delete('/:id', writeLimiter, deleteHabit);

// Archive/Unarchive
router.post('/:id/archive', writeLimiter, archiveHabit);
router.post('/:id/unarchive', writeLimiter, unarchiveHabit);

// Pause/Resume (Vacation Mode)
router.post('/:id/pause', writeLimiter, pauseHabit);
router.post('/:id/resume', writeLimiter, resumeHabit);

// Habit Stacking
router.post('/:id/stack', writeLimiter, stackHabit);

export default router;
