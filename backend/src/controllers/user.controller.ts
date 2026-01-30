import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import logger from '../utils/logger';
import prisma from '../config/database';
import crypto from 'crypto';

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      name: true,
      apiKey: true,
      apiKeyCreatedAt: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          habits: true,
          habitLogs: true,
          books: true,
          milestones: true,
        },
      },
    },
  });

  if (!user) {
    return sendSuccess(res, { profile: null }, 'User not found');
  }

  const profile = {
    id: user.id,
    email: user.email,
    name: user.name,
    hasApiKey: !!user.apiKey,
    apiKeyCreatedAt: user.apiKeyCreatedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    stats: {
      totalHabits: user._count.habits,
      totalLogs: user._count.habitLogs,
      totalBooks: user._count.books,
      totalMilestones: user._count.milestones,
    },
  };

  return sendSuccess(res, { profile }, 'Profile retrieved successfully');
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: req.userId },
    data: { name },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logger.info('Profile updated', { userId: req.userId });
  sendSuccess(res, { profile: updatedUser }, 'Profile updated successfully');
});

/**
 * Export all user data as JSON
 * GET /api/users/export
 */
export const exportData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  // Fetch all user data
  const [user, habits, habitLogs, milestones, books, challenges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    }),
    prisma.habit.findMany({
      where: { userId },
      include: { habitLogs: true, milestones: true },
    }),
    prisma.habitLog.findMany({ where: { userId } }),
    prisma.milestone.findMany({ where: { userId } }),
    prisma.book.findMany({
      where: { userId },
      include: { readingLogs: true },
    }),
    prisma.challenge.findMany({
      where: { userId },
      include: { habits: true, progress: true },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user,
    habits,
    habitLogs,
    milestones,
    books,
    challenges,
    summary: {
      totalHabits: habits.length,
      totalLogs: habitLogs.length,
      totalMilestones: milestones.length,
      totalBooks: books.length,
      totalChallenges: challenges.length,
    },
  };

  // Set headers for download
  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="habit-tracker-export-${new Date().toISOString().split('T')[0]}.json"`
  );

  logger.info('User data exported', { userId });
  res.json(exportData);
});

/**
 * Generate a new API key
 * POST /api/users/api-key
 */
export const generateApiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  // Generate a secure random API key
  const apiKey = `ht_${crypto.randomBytes(32).toString('hex')}`;

  await prisma.user.update({
    where: { id: userId },
    data: {
      apiKey,
      apiKeyCreatedAt: new Date(),
    },
  });

  logger.info('API key generated', { userId });
  sendSuccess(res, { apiKey }, 'API key generated successfully. Keep it safe!');
});

/**
 * Get API key (masked)
 * GET /api/users/api-key
 */
export const getApiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { apiKey: true, apiKeyCreatedAt: true },
  });

  if (!user?.apiKey) {
    return sendSuccess(res, { hasKey: false, apiKey: null }, 'No API key found');
  }

  // Mask the key for display (show first 8 and last 4 chars)
  const maskedKey = `${user.apiKey.substring(0, 8)}...${user.apiKey.substring(user.apiKey.length - 4)}`;

  return sendSuccess(
    res,
    {
      hasKey: true,
      apiKey: maskedKey,
      createdAt: user.apiKeyCreatedAt,
    },
    'API key retrieved'
  );
});

/**
 * Revoke API key
 * DELETE /api/users/api-key
 */
export const revokeApiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.user.update({
    where: { id: req.userId },
    data: {
      apiKey: null,
      apiKeyCreatedAt: null,
    },
  });

  logger.info('API key revoked', { userId: req.userId });
  sendSuccess(res, null, 'API key revoked successfully');
});
