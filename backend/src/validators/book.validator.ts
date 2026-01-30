import { z } from 'zod';

// Book status enum values
const bookStatusValues = ['WANT_TO_READ', 'READING', 'FINISHED', 'ABANDONED'] as const;

// ============ CREATE BOOK ============
export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  author: z.string().max(200).optional(),
  coverUrl: z.string().url().optional().nullable(),
  totalPages: z.number().int().positive().optional().nullable(),
  status: z.enum(bookStatusValues).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;

// ============ UPDATE BOOK ============
export const updateBookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  author: z.string().max(200).optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  totalPages: z.number().int().positive().optional().nullable(),
  currentPage: z.number().int().min(0).optional(),
  status: z.enum(bookStatusValues).optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  startedAt: z.string().datetime().optional().nullable(),
  finishedAt: z.string().datetime().optional().nullable(),
});

export type UpdateBookInput = z.infer<typeof updateBookSchema>;

// ============ UPDATE PROGRESS ============
export const updateProgressSchema = z.object({
  currentPage: z.number().int().min(0),
  notes: z.string().max(500).optional(),
});

export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;

// ============ LOG READING ============
export const logReadingSchema = z.object({
  pagesRead: z.number().int().positive('Pages read must be positive'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .optional(),
  notes: z.string().max(500).optional(),
});

export type LogReadingInput = z.infer<typeof logReadingSchema>;

// ============ QUERY PARAMS ============
export const bookQuerySchema = z.object({
  status: z.enum(bookStatusValues).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type BookQueryInput = z.infer<typeof bookQuerySchema>;

// ============ ID PARAM ============
export const bookIdParamSchema = z.object({
  id: z.string().uuid('Invalid book ID'),
});

// ============ READING STATS QUERY ============
export const readingStatsQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

export type ReadingStatsQueryInput = z.infer<typeof readingStatsQuerySchema>;
