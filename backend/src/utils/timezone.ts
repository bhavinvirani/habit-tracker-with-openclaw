import prisma from '../config/database';

/**
 * Fetch a user's timezone from the database.
 * Returns 'UTC' if not set or user not found.
 */
export async function getUserTimezone(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  return user?.timezone || 'UTC';
}

/**
 * Get today's date as a UTC midnight Date object for the given IANA timezone.
 * E.g., if timezone is "Asia/Kolkata" and it's 2am IST on Feb 2, returns
 * Date(UTC 2026-02-02T00:00:00Z).
 */
export function getTodayForTimezone(timezone: string): Date {
  const now = new Date();
  // 'en-CA' locale gives YYYY-MM-DD format
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
