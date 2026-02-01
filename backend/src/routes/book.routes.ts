import { Router } from 'express';
import * as bookController from '../controllers/book.controller';
import { authenticate } from '../middleware/auth';
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
router.get('/', validateQuery(bookQuerySchema), bookController.getBooks);

// GET /books/stats - Get reading statistics
router.get('/stats', validateQuery(readingStatsQuerySchema), bookController.getReadingStats);

// GET /books/current - Get currently reading book (for dashboard widget)
router.get('/current', bookController.getCurrentlyReading);

// GET /books/:id - Get book by ID
router.get('/:id', validateParams(bookIdParamSchema), bookController.getBookById);

// POST /books - Create new book
router.post('/', validate(createBookSchema), bookController.createBook);

// PUT /books/:id - Update book
router.put(
  '/:id',
  validateParams(bookIdParamSchema),
  validate(updateBookSchema),
  bookController.updateBook
);

// DELETE /books/:id - Delete book
router.delete('/:id', validateParams(bookIdParamSchema), bookController.deleteBook);

// ============ READING PROGRESS ============

// PUT /books/:id/progress - Update reading progress (set current page)
router.put(
  '/:id/progress',
  validateParams(bookIdParamSchema),
  validate(updateProgressSchema),
  bookController.updateProgress
);

// POST /books/:id/log - Log reading session (add pages read)
router.post(
  '/:id/log',
  validateParams(bookIdParamSchema),
  validate(logReadingSchema),
  bookController.logReading
);

// GET /books/:id/logs - Get reading logs for a book
router.get('/:id/logs', validateParams(bookIdParamSchema), bookController.getReadingLogs);

export default router;
