import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/response';
import { NotFoundError, AuthenticationError } from '../utils/AppError';
import * as authService from '../services/auth.service';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'strict') as 'none' | 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api', // Covers both /api/auth and /api/v1/auth
};

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.register(req.body);

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  sendCreated(res, { user: result.user, token: result.token }, 'Account created successfully!');
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.login(req.body);

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  sendSuccess(res, { user: result.user, token: result.token }, 'Login successful. Welcome back!');
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw new AuthenticationError('No refresh token provided');
  }

  const result = await authService.refreshAccessToken(refreshToken);

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  sendSuccess(res, { user: result.user, token: result.token });
});

/**
 * Logout user - revoke all refresh tokens
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.userId) {
    await authService.revokeRefreshTokens(req.userId);
  }

  res.clearCookie('refreshToken', { path: '/api' });
  sendSuccess(res, null, 'Logged out successfully');
});

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getUserById(req.userId!);

  if (!user) {
    throw new NotFoundError('User');
  }

  sendSuccess(res, { user }, 'User details retrieved successfully');
});

/**
 * Request password reset email
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body);

  sendSuccess(
    res,
    null,
    'If an account with that email exists, a password reset link has been sent.'
  );
});

/**
 * Validate a reset token (check before showing form)
 * POST /api/auth/validate-reset-token
 */
export const validateResetToken = asyncHandler(async (req: Request, res: Response) => {
  await authService.validateResetToken(req.body.token);

  sendSuccess(res, null, 'Token is valid');
});

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body);

  sendSuccess(res, null, 'Password has been reset successfully. You can now log in.');
});
