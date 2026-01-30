import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from '../middleware/errorHandler';
import { notFoundHandler } from '../middleware/notFoundHandler';
import authRoutes from '../routes/auth.routes';
import habitRoutes from '../routes/habit.routes';
import templateRoutes from '../routes/template.routes';
import trackingRoutes from '../routes/tracking.routes';
import analyticsRoutes from '../routes/analytics.routes';
import userRoutes from '../routes/user.routes';
import bookRoutes from '../routes/book.routes';
import challengeRoutes from '../routes/challenge.routes';

/**
 * Create Express app for testing (without starting the server)
 */
export const createTestApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/habits', habitRoutes);
  app.use('/api/templates', templateRoutes);
  app.use('/api/tracking', trackingRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/books', bookRoutes);
  app.use('/api/challenges', challengeRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

/**
 * Test user credentials
 */
export const testUser = {
  email: 'testuser@example.com',
  password: 'TestPass123!',
  name: 'Test User',
};

/**
 * Generate random string for unique test data
 */
export const randomString = (length: number = 8): string => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
};

/**
 * Generate unique email for test
 */
export const uniqueEmail = (): string => {
  return `test-${randomString()}@example.com`;
};
