import { Router } from 'express';
import * as bookController from '../controllers/book.controller';
import { authenticate } from '../middleware/auth';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';
import { validate, validateQuery, validateParams } from '../middleware/validate';
import {
  createBookSchema,
  updateBookSchema,
  updateProgressSchema,
  logReadingSchema,
  bookQuerySchema,
  bookIdParamSchema,
  readingStatsQuerySchema,
} from '../validators/book.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============ BOOK CRUD ============

router.get('/', readLimiter, validateQuery(bookQuerySchema), bookController.getBooks);

router.get(
  '/stats',
  readLimiter,
  validateQuery(readingStatsQuerySchema),
  bookController.getReadingStats
);

router.get('/current', readLimiter, bookController.getCurrentlyReading);

router.get('/:id', readLimiter, validateParams(bookIdParamSchema), bookController.getBookById);

router.post('/', writeLimiter, validate(createBookSchema), bookController.createBook);

router.put(
  '/:id',
  writeLimiter,
  validateParams(bookIdParamSchema),
  validate(updateBookSchema),
  bookController.updateBook
);

router.delete('/:id', writeLimiter, validateParams(bookIdParamSchema), bookController.deleteBook);

// ============ READING PROGRESS ============

router.put(
  '/:id/progress',
  writeLimiter,
  validateParams(bookIdParamSchema),
  validate(updateProgressSchema),
  bookController.updateProgress
);

router.post(
  '/:id/log',
  writeLimiter,
  validateParams(bookIdParamSchema),
  validate(logReadingSchema),
  bookController.logReading
);

router.get(
  '/:id/logs',
  readLimiter,
  validateParams(bookIdParamSchema),
  bookController.getReadingLogs
);

export default router;
