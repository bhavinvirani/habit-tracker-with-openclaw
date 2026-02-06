import { z } from 'zod';

// ============ ENUMS ============

export const FrequencyEnum = z.enum(['DAILY', 'WEEKLY']);
export const HabitTypeEnum = z.enum(['BOOLEAN', 'NUMERIC', 'DURATION']);

// ============ CREATE HABIT ============

export const createHabitSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .trim(),
    description: z
      .string()
      .max(500, 'Description must be less than 500 characters')
      .trim()
      .optional()
      .nullable(),

    // Frequency
    frequency: FrequencyEnum.default('DAILY'),
    daysOfWeek: z.array(z.number().min(1).max(7)).max(7).optional().nullable(),
    timesPerWeek: z.number().min(1).max(7).optional().nullable(),

    // Habit type
    habitType: HabitTypeEnum.default('BOOLEAN'),
    targetValue: z.number().positive().optional().nullable(),
    unit: z.string().max(50).trim().optional().nullable(),

    // Display
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
      .default('#0ea5e9'),
    icon: z.string().max(10).optional().nullable(),
    category: z.string().max(50).trim().optional().nullable(),
  })
  .refine(
    (data: { habitType: string; targetValue?: number | null }) => {
      // If NUMERIC or DURATION, targetValue should be provided
      if ((data.habitType === 'NUMERIC' || data.habitType === 'DURATION') && !data.targetValue) {
        return true; // Allow no target, it's optional
      }
      return true;
    },
    { message: 'Target value recommended for NUMERIC/DURATION habits' }
  )
  .refine(
    (data: { frequency: string; daysOfWeek?: number[] | null; timesPerWeek?: number | null }) => {
      // If weekly with specific days, daysOfWeek should be provided
      if (data.frequency === 'WEEKLY' && !data.daysOfWeek?.length && !data.timesPerWeek) {
        return false;
      }
      return true;
    },
    { message: 'Weekly habits require either daysOfWeek or timesPerWeek' }
  );

export type CreateHabitInput = z.infer<typeof createHabitSchema>;

// ============ UPDATE HABIT ============

export const updateHabitSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .nullable(),

  // Frequency
  frequency: FrequencyEnum.optional(),
  daysOfWeek: z.array(z.number().min(1).max(7)).max(7).optional().nullable(),
  timesPerWeek: z.number().min(1).max(7).optional().nullable(),

  // Habit type
  habitType: HabitTypeEnum.optional(),
  targetValue: z.number().positive().optional().nullable(),
  unit: z.string().max(50).trim().optional().nullable(),

  // Display
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
  icon: z.string().max(10).optional().nullable(),
  category: z.string().max(50).trim().optional().nullable(),

  // Status
  isActive: z.boolean().optional(),
});

export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

// ============ REORDER HABITS ============

export const reorderHabitsSchema = z.object({
  habitIds: z.array(z.string().uuid('Invalid habit ID')).min(1, 'At least one habit ID required'),
});

export type ReorderHabitsInput = z.infer<typeof reorderHabitsSchema>;

// ============ QUERY PARAMS ============

export const getHabitsQuerySchema = z.object({
  isActive: z
    .string()
    .transform((val: string) => val === 'true')
    .optional(),
  isArchived: z
    .string()
    .transform((val: string) => val === 'true')
    .optional(),
  category: z.string().optional(),
  frequency: FrequencyEnum.optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type GetHabitsQuery = z.infer<typeof getHabitsQuerySchema>;
