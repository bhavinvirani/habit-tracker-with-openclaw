import crypto from 'crypto';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthenticationError, ConflictError } from '../utils/AppError';
import { User } from '@prisma/client';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../validators/auth.validator';
import logger from '../utils/logger';
import { sendPasswordResetEmail } from './email.service';

// ============ TYPES ============

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  timezone: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
  refreshToken: string;
}

// ============ ACCOUNT LOCKOUT (database-backed) ============

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

async function checkAccountLock(email: string): Promise<void> {
  const record = await prisma.loginAttempt.findUnique({ where: { email } });
  if (!record || !record.lockedUntil) return;

  if (new Date() < record.lockedUntil) {
    throw new AuthenticationError('Account temporarily locked. Please try again later.');
  }
  // Lock expired, reset
  await prisma.loginAttempt.delete({ where: { email } });
}

async function recordFailedAttempt(email: string): Promise<void> {
  const record = await prisma.loginAttempt.upsert({
    where: { email },
    create: { email, failedCount: 1 },
    update: { failedCount: { increment: 1 }, lastAttempt: new Date() },
  });

  if (record.failedCount >= MAX_FAILED_ATTEMPTS) {
    await prisma.loginAttempt.update({
      where: { email },
      data: { lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) },
    });
    logger.warn('Account locked due to too many failed attempts', { email });
  }
}

async function clearFailedAttempts(email: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { email } });
}

// ============ HELPERS ============

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    timezone: user.timezone,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
  };
}

function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '15m' } as jwt.SignOptions);
}

async function createRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

// ============ SERVICE FUNCTIONS ============

/**
 * Register a new user
 */
export async function register(data: RegisterInput): Promise<AuthResponse> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      ...(data.timezone && { timezone: data.timezone }),
    },
  });

  const token = generateAccessToken(user.id);
  const refreshToken = await createRefreshToken(user.id);

  logger.info('User registered', { userId: user.id, email: user.email });

  return {
    user: toSafeUser(user),
    token,
    refreshToken,
  };
}

/**
 * Login user
 */
export async function login(data: LoginInput): Promise<AuthResponse> {
  // Check if account is locked
  await checkAccountLock(data.email);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    await recordFailedAttempt(data.email);
    throw new AuthenticationError('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(data.password, user.password);

  if (!isValidPassword) {
    await recordFailedAttempt(data.email);
    throw new AuthenticationError('Invalid email or password');
  }

  await clearFailedAttempts(data.email);

  // Update timezone on each login to keep it current
  if (data.timezone && data.timezone !== user.timezone) {
    await prisma.user.update({
      where: { id: user.id },
      data: { timezone: data.timezone },
    });
    user.timezone = data.timezone;
  }

  const token = generateAccessToken(user.id);
  const refreshToken = await createRefreshToken(user.id);

  logger.info('User logged in', { userId: user.id });

  return {
    user: toSafeUser(user),
    token,
    refreshToken,
  };
}

/**
 * Refresh access token using a valid refresh token (token rotation)
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
    }
    throw new AuthenticationError('Invalid or expired refresh token');
  }

  // Token rotation: delete old, create new
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const newAccessToken = generateAccessToken(stored.userId);
  const newRefreshToken = await createRefreshToken(stored.userId);

  return {
    user: toSafeUser(stored.user),
    token: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Revoke all refresh tokens for a user (logout)
 */
export async function revokeRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user ? toSafeUser(user) : null;
}

// ============ PASSWORD RESET ============

const PASSWORD_RESET_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Request a password reset email.
 * Silently returns even if user doesn't exist (anti-enumeration).
 */
export async function forgotPassword(data: ForgotPasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    logger.debug('Password reset requested for non-existent email', { email: data.email });
    return;
  }

  // Invalidate any existing unused tokens for this email
  await prisma.passwordReset.updateMany({
    where: { email: data.email, usedAt: null },
    data: { usedAt: new Date() },
  });

  // Generate token and store its hash
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  await prisma.passwordReset.create({
    data: {
      tokenHash,
      email: data.email,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
    },
  });

  // Send email (fire and forget — don't block on email delivery)
  await sendPasswordResetEmail(data.email, rawToken, user.name);

  logger.info('Password reset token created', { email: data.email });
}

/**
 * Validate a password reset token without consuming it.
 * Returns true if valid, throws if invalid/expired/used.
 */
export async function validateResetToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  const resetRecord = await prisma.passwordReset.findUnique({ where: { tokenHash } });

  if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
    throw new AuthenticationError('Invalid or expired reset token');
  }
}

/**
 * Reset password using a valid reset token.
 * Revokes all refresh tokens (session invalidation).
 */
export async function resetPassword(data: ResetPasswordInput): Promise<void> {
  const tokenHash = hashToken(data.token);

  const resetRecord = await prisma.passwordReset.findUnique({ where: { tokenHash } });

  if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
    throw new AuthenticationError('Invalid or expired reset token');
  }

  const user = await prisma.user.findUnique({ where: { email: resetRecord.email } });

  if (!user) {
    throw new AuthenticationError('Invalid or expired reset token');
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Atomic: update password + mark token used + revoke all sessions
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    }),
  ]);

  // Clear any failed login attempts
  await clearFailedAttempts(resetRecord.email);

  logger.info('Password reset completed', { userId: user.id, email: resetRecord.email });
}
