import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import cron from 'node-cron';
import { swaggerSpec } from './config/swagger';
import logger from './utils/logger';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { generalLimiter, healthLimiter } from './middleware/rateLimiter';
import { recordRequest, incrementActive, decrementActive } from './utils/requestMetrics';
import prisma from './config/database';
import { isRedisConnected, disconnectRedis } from './config/redis';
import { cacheMetrics, warmAnalyticsCache } from './utils/cache';
import authRoutes from './routes/auth.routes';
import habitRoutes from './routes/habit.routes';
import templateRoutes from './routes/template.routes';
import trackingRoutes from './routes/tracking.routes';
import analyticsRoutes from './routes/analytics.routes';
import userRoutes from './routes/user.routes';
import bookRoutes from './routes/book.routes';
import challengeRoutes from './routes/challenge.routes';
import botRoutes from './routes/bot.routes';
import integrationRoutes from './routes/integration.routes';
import reminderRoutes from './routes/reminder.routes';
import actuatorRoutes from './routes/actuator.routes';
import { initReminderScheduler } from './services/reminder.service';
import { initDemoSeeder } from './services/demoSeed.service';
import { registerCronJob, reportCronRun } from './utils/cronTracker';

dotenv.config();

// Validate critical environment variables (skip in test)
if (process.env.NODE_ENV !== 'test') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    logger.error('JWT_SECRET must be set and at least 32 characters');
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
const isProduction = process.env.NODE_ENV === 'production';
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: [
              "'self'",
              ...(process.env.CORS_ORIGIN || '')
                .split(',')
                .map((o) => o.trim())
                .filter(Boolean),
            ],
            fontSrc: ["'self'", 'https:', 'data:'],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
          },
        }
      : false,
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// Compression (production only)
if (isProduction) {
  app.use(
    compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
    })
  );
}

// Prevent information leakage
app.disable('x-powered-by');
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((o) => o.trim()),
    credentials: true,
  })
);

// Cookie and request parsing
app.use(cookieParser() as express.RequestHandler);
app.use(requestLogger);
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

// Health check (rate limited separately)
app.get('/health', healthLimiter, async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const total = cacheMetrics.hits + cacheMetrics.misses;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: isRedisConnected() ? 'connected' : 'disconnected (optional)',
      cache: {
        hits: cacheMetrics.hits,
        misses: cacheMetrics.misses,
        sets: cacheMetrics.sets,
        invalidations: cacheMetrics.invalidations,
        hitRate: total > 0 ? `${((cacheMetrics.hits / total) * 100).toFixed(1)}%` : '0%',
      },
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      redis: isRedisConnected() ? 'connected' : 'disconnected (optional)',
    });
  }
});

// Actuator stats (public, rate limited)
app.use('/actuator', actuatorRoutes);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rate limiting for all API routes
app.use('/api', generalLimiter);

// Versioned API router (v1)
const v1Router = express.Router();
v1Router.use('/auth', authRoutes);
v1Router.use('/habits', habitRoutes);
v1Router.use('/templates', templateRoutes);
v1Router.use('/tracking', trackingRoutes);
v1Router.use('/analytics', analyticsRoutes);
v1Router.use('/users', userRoutes);
v1Router.use('/books', bookRoutes);
v1Router.use('/challenges', challengeRoutes);
v1Router.use('/bot', botRoutes);
v1Router.use('/integrations', integrationRoutes);
v1Router.use('/reminders', reminderRoutes);

// Mount versioned routes
app.use('/api/v1', v1Router);

// Backward compatibility: /api/* still works
app.use('/api', v1Router);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    healthCheck: `http://localhost:${PORT}/health`,
  });

  // Initialize reminder scheduler
  initReminderScheduler();

  // Initialize demo user seeder (if DEMO_USER_EMAIL is set)
  initDemoSeeder();

  // Warm analytics cache for recently active users (after 5s delay)
  if (process.env.NODE_ENV !== 'test') {
    setTimeout(() => warmAnalyticsCache(), 5000);
  }
});

// Cleanup expired refresh tokens every hour
registerCronJob('tokenCleanup', 'every 60m');
const tokenCleanupInterval = setInterval(
  async () => {
    const start = Date.now();
    try {
      const deleted = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      if (deleted.count > 0) {
        logger.info(`Cleaned up ${deleted.count} expired refresh tokens`);
      }
      // Cleanup expired login lockouts
      await prisma.loginAttempt.deleteMany({
        where: { lockedUntil: { lt: new Date() } },
      });
      reportCronRun('tokenCleanup', 'success', Date.now() - start);
    } catch (error) {
      reportCronRun('tokenCleanup', 'failure', Date.now() - start, (error as Error).message);
      logger.error('Failed to cleanup expired tokens', { error });
    }
  },
  60 * 60 * 1000
);

// ============ GRACEFUL SHUTDOWN ============

let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received, starting graceful shutdown...`);

  // 10s forced exit timeout
  const forceExitTimeout = setTimeout(() => {
    logger.error('Forced exit after timeout');
    process.exit(1);
  }, 10_000);
  forceExitTimeout.unref();

  try {
    // 1. Stop accepting new connections, drain in-flight requests
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    logger.info('HTTP server closed');

    // 2. Stop token cleanup interval
    clearInterval(tokenCleanupInterval);

    // 3. Stop cron jobs
    cron.getTasks().forEach((task) => task.stop());
    logger.info('Cron jobs stopped');

    // 4. Disconnect Redis
    await disconnectRedis();

    // 5. Disconnect database
    await prisma.$disconnect();
    logger.info('Database disconnected');

    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
