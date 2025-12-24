import { z } from 'zod';

const nodeEnvSchema = z.enum(['development', 'test', 'production']);

export const envSchema = z
  .object({
    NODE_ENV: nodeEnvSchema.default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).max(60 * 60 * 24).default(900),
  })
  .strict();

export type Env = z.infer<typeof envSchema>;
