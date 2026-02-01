import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendNoContent } from '../utils/response';
import { NotFoundError } from '../utils/AppError';
import prisma from '../config/database';
import logger from '../utils/logger';

/**
 * GET /api/integrations
 * List all connected apps for the current user
 */
export const getConnectedApps = asyncHandler(async (req: AuthRequest, res: Response) => {
  const apps = await prisma.connectedApp.findMany({
    where: { userId: req.userId! },
    select: {
      id: true,
      provider: true,
      username: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, { apps }, 'Connected apps retrieved');
});

/**
 * DELETE /api/integrations/:provider
 * Disconnect a provider
 */
export const disconnectProvider = asyncHandler(async (req: AuthRequest, res: Response) => {
  const provider = req.params.provider as string;

  const app = await prisma.connectedApp.findUnique({
    where: {
      userId_provider: { userId: req.userId!, provider },
    },
  });

  if (!app) {
    throw new NotFoundError(`Connected app for provider "${provider}"`);
  }

  await prisma.connectedApp.delete({
    where: { id: app.id },
  });

  logger.info('Provider disconnected', { userId: req.userId, provider });
  sendNoContent(res);
});
