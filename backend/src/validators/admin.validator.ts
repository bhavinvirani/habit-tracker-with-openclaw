import { z } from 'zod';

export const featureFlagKeyParamSchema = z.object({
  key: z.string().min(1, 'Feature flag key is required'),
});

export const updateFeatureFlagSchema = z.object({
  enabled: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>;
