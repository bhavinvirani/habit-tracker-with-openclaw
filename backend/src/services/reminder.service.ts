import cron from 'node-cron';
import prisma from '../config/database';
import { sendToUser } from './notifier.service';
import { getTodayForTimezone } from '../utils/timezone';
import logger from '../utils/logger';
import { registerCronJob, reportCronRun } from '../utils/cronTracker';

// Track which reminders were already sent today to avoid duplicates
const sentReminders = new Set<string>();

/**
 * Get current HH:mm string for a given IANA timezone
 */
function getCurrentTimeInTimezone(timezone: string): string {
  const now = new Date();
  return now.toLocaleTimeString('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Get today's date string (YYYY-MM-DD) for dedup key
 */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Process per-habit reminders
 */
async function processHabitReminders(): Promise<void> {
  try {
    // Get all active reminders with user timezone and connected app info
    const reminders = await prisma.habitReminder.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            timezone: true,
            connectedApps: {
              where: { isActive: true },
              select: { id: true },
              take: 1,
            },
          },
        },
        habit: {
          select: { id: true, name: true, isActive: true, isArchived: true, isPaused: true },
        },
      },
    });

    const todayStr = getTodayDateString();

    for (const reminder of reminders) {
      // Skip if no connected app
      if (reminder.user.connectedApps.length === 0) continue;

      // Skip inactive/archived/paused habits
      if (!reminder.habit.isActive || reminder.habit.isArchived || reminder.habit.isPaused)
        continue;

      // Check if current time matches reminder time in user's timezone
      const currentTime = getCurrentTimeInTimezone(reminder.user.timezone);
      if (currentTime !== reminder.time) continue;

      // Dedup: skip if already sent today
      const dedupKey = `habit:${reminder.id}:${todayStr}`;
      if (sentReminders.has(dedupKey)) continue;

      // Check if habit is already completed today
      const today = getTodayForTimezone(reminder.user.timezone);
      const log = await prisma.habitLog.findUnique({
        where: {
          habitId_date: {
            habitId: reminder.habit.id,
            date: today,
          },
        },
      });

      if (log?.completed) continue;

      // Send reminder
      const sent = await sendToUser(
        reminder.userId,
        `⏰ *Reminder:* You haven't completed "${reminder.habit.name}" today. Still time!`
      );

      if (sent) {
        sentReminders.add(dedupKey);
        logger.info('Habit reminder sent', {
          userId: reminder.userId,
          habitId: reminder.habit.id,
          habitName: reminder.habit.name,
        });
      }
    }
  } catch (error) {
    logger.error('Error processing habit reminders', { error });
  }
}

/**
 * Process daily summary notifications
 */
async function processDailySummaries(): Promise<void> {
  try {
    const settings = await prisma.userNotificationSettings.findMany({
      where: {
        dailySummaryEnabled: true,
        dailySummaryTime: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            timezone: true,
            connectedApps: {
              where: { isActive: true },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });

    const todayStr = getTodayDateString();

    for (const setting of settings) {
      if (!setting.dailySummaryTime) continue;
      if (setting.user.connectedApps.length === 0) continue;

      // Check if current time matches summary time
      const currentTime = getCurrentTimeInTimezone(setting.user.timezone);
      if (currentTime !== setting.dailySummaryTime) continue;

      // Dedup
      const dedupKey = `summary:${setting.userId}:${todayStr}`;
      if (sentReminders.has(dedupKey)) continue;

      // Get today's habits
      const today = getTodayForTimezone(setting.user.timezone);
      const habits = await prisma.habit.findMany({
        where: {
          userId: setting.userId,
          isActive: true,
          isArchived: false,
          isPaused: false,
        },
        select: { id: true, name: true },
      });

      const logs = await prisma.habitLog.findMany({
        where: {
          userId: setting.userId,
          date: today,
          completed: true,
        },
        select: { habitId: true },
      });

      const completedIds = new Set(logs.map((l) => l.habitId));
      const incomplete = habits.filter((h) => !completedIds.has(h.id));
      const completedCount = habits.length - incomplete.length;

      let message = `📊 *Daily Summary:* ${completedCount}/${habits.length} habits completed today.`;

      if (incomplete.length > 0) {
        message += `\n\n*Remaining:*\n${incomplete.map((h) => `• ${h.name}`).join('\n')}`;
      } else {
        message += '\n\n🎉 All habits completed! Great job!';
      }

      const sent = await sendToUser(setting.userId, message);
      if (sent) {
        sentReminders.add(dedupKey);
        logger.info('Daily summary sent', { userId: setting.userId });
      }
    }
  } catch (error) {
    logger.error('Error processing daily summaries', { error });
  }
}

/**
 * Clear the dedup set at midnight (runs daily)
 */
function clearDedupSet(): void {
  sentReminders.clear();
  logger.debug('Reminder dedup set cleared');
}

/**
 * Initialize the reminder scheduler
 */
export function initReminderScheduler(): void {
  registerCronJob('reminderProcessor', '* * * * *');
  registerCronJob('dedupClear', '0 0 * * *');

  // Process reminders every minute
  cron.schedule('* * * * *', async () => {
    const start = Date.now();
    try {
      await processHabitReminders();
      await processDailySummaries();
      reportCronRun('reminderProcessor', 'success', Date.now() - start);
    } catch (err) {
      reportCronRun('reminderProcessor', 'failure', Date.now() - start, (err as Error).message);
    }
  });

  // Clear dedup set at midnight UTC
  cron.schedule('0 0 * * *', () => {
    const start = Date.now();
    try {
      clearDedupSet();
      reportCronRun('dedupClear', 'success', Date.now() - start);
    } catch (err) {
      reportCronRun('dedupClear', 'failure', Date.now() - start, (err as Error).message);
    }
  });

  logger.info('Reminder scheduler initialized');
}
