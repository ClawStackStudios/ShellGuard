import { z } from 'zod';

export const AuthSchemas = {
  register: z.object({
    uuid: z.string().uuid(),
    username: z.string().min(3).max(32),
    // Optional ShellGuard display name (never used as an auth factor)
    displayName: z.string().max(48).optional(),
    keyHash: z.string().length(64),
  }),
  token: z.object({
    type: z.enum(['human', 'agent']).optional(),
    uuid: z.string().uuid().optional(),
    keyHash: z.string().length(64).optional(),
    ownerKey: z.string().optional(),
  }),
};
