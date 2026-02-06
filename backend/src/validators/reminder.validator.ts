import { z } from 'zod';

const timeString = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format')
  .refine(
    (val) => {
      const [h, m] = val.split(':').map(Number);
      return h >= 0 && h <= 23 && m >= 0 && m <= 59;
    },
    { message: 'Invalid time value' }
  );

export const createReminderSchema = z.object({
  habitId: z.string().uuid('Invalid habit ID format'),
  time: timeString,
});

export const updateNotificationSettingsSchema = z.object({
  dailySummaryEnabled: z.boolean().optional(),
  dailySummaryTime: timeString.optional().nullable(),
  reminderEnabled: z.boolean().optional(),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>;
