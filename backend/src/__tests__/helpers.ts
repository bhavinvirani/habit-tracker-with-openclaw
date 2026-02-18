import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import request from 'supertest';
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
import botRoutes from '../routes/bot.routes';
import integrationRoutes from '../routes/integration.routes';
import reminderRoutes from '../routes/reminder.routes';
import actuatorRoutes from '../routes/actuator.routes';
import adminRoutes from '../routes/admin.routes';
import { recordRequest, incrementActive, decrementActive } from '../utils/requestMetrics';

/**
 * Create Express app for testing (without starting the server)
 */
export const createTestApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ credentials: true }));
  app.use(cookieParser() as express.RequestHandler);
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Request metrics collection
  app.use((req, res, next) => {
    const startTime = Date.now();
    incrementActive();
    res.on('finish', () => {
      decrementActive();
      recordRequest(req.method, res.statusCode, Date.now() - startTime);
    });
    next();
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Actuator stats
  app.use('/actuator', actuatorRoutes);

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/habits', habitRoutes);
  app.use('/api/templates', templateRoutes);
  app.use('/api/tracking', trackingRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/books', bookRoutes);
  app.use('/api/challenges', challengeRoutes);
  app.use('/api/bot', botRoutes);
  app.use('/api/integrations', integrationRoutes);
  app.use('/api/reminders', reminderRoutes);
  app.use('/api/', adminRoutes);

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

/**
 * Safely register a test user. Returns null if DB is unavailable.
 */
export async function registerTestUser(
  app: express.Express
): Promise<{ token: string; userId: string } | null> {
  try {
    const email = uniqueEmail();
    const res = await request(app).post('/api/auth/register').send({
      email,
      password: 'TestPass123!',
      name: 'Test User',
    });
    if (!res.body.data?.token) return null;
    return { token: res.body.data.token, userId: res.body.data.user.id };
  } catch {
    return null;
  }
}
