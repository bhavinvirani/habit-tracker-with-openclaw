import { z } from 'zod';

// Challenge status enum values
const challengeStatusValues = ['ACTIVE', 'COMPLETED', 'FAILED', 'CANCELLED'] as const;

// ============ CREATE CHALLENGE ============
export const createChallengeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  duration: z.number().int().positive().max(365, 'Duration cannot exceed 365 days'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD format'),
  habitIds: z.array(z.string()).min(1, 'At least one habit is required'),
});

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;

// ============ UPDATE CHALLENGE ============
export const updateChallengeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(challengeStatusValues).optional(),
});

export type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>;

// ============ QUERY PARAMS ============
export const challengeQuerySchema = z.object({
  status: z.enum(challengeStatusValues).optional(),
  includeCompleted: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type ChallengeQueryInput = z.infer<typeof challengeQuerySchema>;

// ============ ID PARAM ============
export const challengeIdParamSchema = z.object({
  id: z.string().min(1, 'Challenge ID is required'),
});

// ============ SYNC PROGRESS ============
export const syncProgressSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .optional(),
});

export type SyncProgressInput = z.infer<typeof syncProgressSchema>;
