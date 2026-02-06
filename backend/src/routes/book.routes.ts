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

// GET /books - Get all books
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/', readLimiter as any, validateQuery(bookQuerySchema), bookController.getBooks);

// GET /books/stats - Get reading statistics
router.get(
  '/stats',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readLimiter as any,
  validateQuery(readingStatsQuerySchema),
  bookController.getReadingStats
);

// GET /books/current - Get currently reading book (for dashboard widget)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/current', readLimiter as any, bookController.getCurrentlyReading);

// GET /books/:id - Get book by ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get(
  '/:id',
  readLimiter as any,
  validateParams(bookIdParamSchema),
  bookController.getBookById
);

// POST /books - Create new book
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', writeLimiter as any, validate(createBookSchema), bookController.createBook);

// PUT /books/:id - Update book
router.put(
  '/:id',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeLimiter as any,
  validateParams(bookIdParamSchema),
  validate(updateBookSchema),
  bookController.updateBook
);

// DELETE /books/:id - Delete book
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.delete(
  '/:id',
  writeLimiter as any,
  validateParams(bookIdParamSchema),
  bookController.deleteBook
);

// ============ READING PROGRESS ============

// PUT /books/:id/progress - Update reading progress (set current page)
router.put(
  '/:id/progress',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeLimiter as any,
  validateParams(bookIdParamSchema),
  validate(updateProgressSchema),
  bookController.updateProgress
);

// POST /books/:id/log - Log reading session (add pages read)
router.post(
  '/:id/log',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeLimiter as any,
  validateParams(bookIdParamSchema),
  validate(logReadingSchema),
  bookController.logReading
);

// GET /books/:id/logs - Get reading logs for a book
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get(
  '/:id/logs',
  readLimiter as any,
  validateParams(bookIdParamSchema),
  bookController.getReadingLogs
);

export default router;
