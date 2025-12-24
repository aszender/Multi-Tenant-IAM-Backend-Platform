import { ZodError } from 'zod';

import { envSchema } from './env.schema';

export function validateEnv(config: Record<string, unknown>) {
  try {
    // @nestjs/config passes the full process.env bag which contains many unrelated keys.
    // We validate only the keys we own, keeping the schema strict without being brittle.
    const candidate = {
      NODE_ENV: config.NODE_ENV,
      PORT: config.PORT,
      DATABASE_URL: config.DATABASE_URL,
      JWT_ACCESS_SECRET: config.JWT_ACCESS_SECRET,
      JWT_ACCESS_TTL_SECONDS: config.JWT_ACCESS_TTL_SECONDS,
    };

    return envSchema.parse(candidate);
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.issues
        .map((i) => `${i.path.join('.') || 'env'}: ${i.message}`)
        .join('; ');

      throw new Error(`Invalid environment configuration: ${messages}`);
    }
    throw err;
  }
}
