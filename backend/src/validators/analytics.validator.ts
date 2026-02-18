import { z } from 'zod';

// ============ DATE HELPERS ============

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// ============ OVERVIEW QUERY ============

export const overviewQuerySchema = z.object({
  // Optional date range for calculations
  startDate: dateString.optional(),
  endDate: dateString.optional(),
});

export type OverviewQuery = z.infer<typeof overviewQuerySchema>;

// ============ PERIOD QUERY ============

export const periodQuerySchema = z.object({
  startDate: dateString.optional(),
  endDate: dateString.optional(),
  period: z.enum(['week', 'month', 'year']).optional(),
});

export type PeriodQuery = z.infer<typeof periodQuerySchema>;

// ============ HEATMAP QUERY ============

export const heatmapQuerySchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/, 'Year must be 4 digits')
    .transform((val: string) => parseInt(val, 10))
    .optional(),
  habitId: z.string().optional(),
});

export type HeatmapQuery = z.infer<typeof heatmapQuerySchema>;

// ============ HABIT STATS PARAM ============

export const habitIdParamSchema = z.object({
  id: z.string().min(1, 'Habit ID is required'),
});

export type HabitIdParam = z.infer<typeof habitIdParamSchema>;

// ============ STREAKS QUERY ============

export const streaksQuerySchema = z.object({
  limit: z
    .string()
    .transform((val: string) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(50))
    .optional(),
  offset: z
    .string()
    .transform((val: string) => parseInt(val, 10))
    .pipe(z.number().int().min(0))
    .optional(),
});

export type StreaksQuery = z.infer<typeof streaksQuerySchema>;

// ============ PAGINATED QUERY ============

export const paginatedQuerySchema = z.object({
  limit: z
    .string()
    .transform((val: string) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(50))
    .optional(),
  offset: z
    .string()
    .transform((val: string) => parseInt(val, 10))
    .pipe(z.number().int().min(0))
    .optional(),
});

export type PaginatedQuery = z.infer<typeof paginatedQuerySchema>;
