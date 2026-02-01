import crypto from 'crypto';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthenticationError, ConflictError } from '../utils/AppError';
import { User } from '@prisma/client';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import logger from '../utils/logger';

// Type assertion for prisma client with RefreshToken model
// This allows TypeScript to compile before migration is run
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

// ============ TYPES ============

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  timezone: string;
  createdAt: Date;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
  refreshToken: string;
}

// ============ ACCOUNT LOCKOUT ============

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface FailedAttempt {
  count: number;
  lockedUntil: number | null;
}

const failedAttempts = new Map<string, FailedAttempt>();

function checkAccountLock(email: string): void {
  const record = failedAttempts.get(email);
  if (!record || !record.lockedUntil) return;

  if (Date.now() < record.lockedUntil) {
    throw new AuthenticationError('Account temporarily locked. Please try again later.');
  }
  // Lock expired, reset
  failedAttempts.delete(email);
}

function recordFailedAttempt(email: string): void {
  const record = failedAttempts.get(email) || { count: 0, lockedUntil: null };
  record.count += 1;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    logger.warn('Account locked due to too many failed attempts', { email });
  }

  failedAttempts.set(email, record);
}

function clearFailedAttempts(email: string): void {
  failedAttempts.delete(email);
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
    createdAt: user.createdAt,
  };
}

function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '15m' } as jwt.SignOptions);
}

async function createRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await db.refreshToken.create({
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
  checkAccountLock(data.email);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    recordFailedAttempt(data.email);
    throw new AuthenticationError('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(data.password, user.password);

  if (!isValidPassword) {
    recordFailedAttempt(data.email);
    throw new AuthenticationError('Invalid email or password');
  }

  clearFailedAttempts(data.email);
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
  const stored = await db.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) {
      await db.refreshToken.delete({ where: { id: stored.id } });
    }
    throw new AuthenticationError('Invalid or expired refresh token');
  }

  // Token rotation: delete old, create new
  await db.refreshToken.delete({ where: { id: stored.id } });

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
  await db.refreshToken.deleteMany({ where: { userId } });
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
