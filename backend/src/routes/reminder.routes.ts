import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validate';
import {
  createReminderSchema,
  updateNotificationSettingsSchema,
} from '../validators/reminder.validator';
import {
  getReminders,
  createReminder,
  deleteReminder,
  getNotificationSettings,
  updateNotificationSettings,
} from '../controllers/reminder.controller';

const router = Router();

router.use(authenticate);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/', readLimiter as any, getReminders);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', writeLimiter as any, validateBody(createReminderSchema), createReminder);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.delete('/:habitId', writeLimiter as any, deleteReminder);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/settings', readLimiter as any, getNotificationSettings);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.put(
  '/settings',
  writeLimiter as any,
  validateBody(updateNotificationSettingsSchema),
  updateNotificationSettings
);

export default router;
