import { Router } from 'express';
import { authenticate } from '../middleware/auth';
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

router.get('/', getReminders);
router.post('/', validateBody(createReminderSchema), createReminder);
router.delete('/:habitId', deleteReminder);

router.get('/settings', getNotificationSettings);
router.put('/settings', validateBody(updateNotificationSettingsSchema), updateNotificationSettings);

export default router;
