import { z } from 'zod';

export const featureFlagKeyParamSchema = z.object({
  key: z.string().min(1, 'Feature flag key is required'),
});

export const updateFeatureFlagSchema = z.object({
  enabled: z.boolean().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>;

export const createFeatureFlagSchema = z.object({
  key: z
    .string()
    .min(1, 'Key is required')
    .regex(/^[a-z0-9_]+$/, 'Key must contain only lowercase letters, numbers, and underscores'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  enabled: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateFeatureFlagInput = z.infer<typeof createFeatureFlagSchema>;

export const userListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'habitCount']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;

export const updateUserRoleSchema = z.object({
  isAdmin: z.boolean(),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

export const auditLogQuerySchema = z.object({
  flagKey: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
