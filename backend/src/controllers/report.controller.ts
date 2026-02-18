import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { generateReportsForAllUsers, getLatestReport } from '../services/reportGenerator.service';

export const generateReports = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const result = await generateReportsForAllUsers();
  sendSuccess(res, result, 'Reports generated successfully');
});

export const getMyLatestReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const report = await getLatestReport(req.userId!);
  sendSuccess(res, { report }, 'Latest report retrieved successfully');
});
