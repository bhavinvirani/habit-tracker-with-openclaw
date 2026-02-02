import { z } from 'zod';

export const checkInSchema = z.object({
  habitId: z.string().uuid(),
  completed: z.boolean().default(true),
  value: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const checkInByNameSchema = z.object({
  name: z.string().min(1).max(200),
  completed: z.boolean().default(true),
  value: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const registerChatSchema = z.object({
  provider: z.string().min(1).max(50),
  chatId: z.string().min(1).max(200),
  username: z.string().max(200).optional(),
});

export type BotCheckInInput = z.infer<typeof checkInSchema>;
export type BotCheckInByNameInput = z.infer<typeof checkInByNameSchema>;
export type RegisterChatInput = z.infer<typeof registerChatSchema>;
