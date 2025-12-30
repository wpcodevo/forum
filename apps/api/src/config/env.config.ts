import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(8000),
  DATABASE_URL: z.string().min(1),
  API_PREFIX: z.string().default('api'),
  BCRYPT_ROUNDS: z.coerce.number().int().positive().default(12),
  JWT_SECRET: z.string().min(1),
  FRONTEND_URL: z.url().default('http://localhost:3000'),
  CLIENT_URL: z.url().default('http://localhost:3000'),
});

export type EnvConfig = z.infer<typeof envSchema>;

