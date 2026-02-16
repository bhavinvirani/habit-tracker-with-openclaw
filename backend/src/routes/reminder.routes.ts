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

router.get('/', readLimiter, getReminders);
router.post('/', writeLimiter, validateBody(createReminderSchema), createReminder);
router.delete('/:habitId', writeLimiter, deleteReminder);

router.get('/settings', readLimiter, getNotificationSettings);
router.put(
  '/settings',
  writeLimiter,
  validateBody(updateNotificationSettingsSchema),
  updateNotificationSettings
);

export default router;
