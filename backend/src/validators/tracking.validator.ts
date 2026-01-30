import { z } from 'zod';

// ============ DATE HELPERS ============

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// ============ CHECK-IN ============

export const checkInSchema = z.object({
  habitId: z.string().min(1, 'Habit ID is required'),
  date: dateString.optional(), // Defaults to today
  completed: z.boolean().default(true),
  value: z.number().int().min(0).optional().nullable(), // For NUMERIC/DURATION habits
  notes: z.string().max(500).trim().optional().nullable(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;

// ============ UNDO CHECK-IN ============

export const undoCheckInSchema = z.object({
  habitId: z.string().min(1, 'Habit ID is required'),
  date: dateString.optional(), // Defaults to today
});

export type UndoCheckInInput = z.infer<typeof undoCheckInSchema>;

// ============ HISTORY QUERY ============

export const historyQuerySchema = z.object({
  habitId: z.string().optional(),
  startDate: dateString.optional(),
  endDate: dateString.optional(),
  limit: z
    .string()
    .transform((val: string) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(365))
    .optional(),
});

export type HistoryQuery = z.infer<typeof historyQuerySchema>;

// ============ DATE PARAM ============

export const dateParamSchema = z.object({
  date: dateString,
});

export type DateParam = z.infer<typeof dateParamSchema>;
