import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  server: {
    DEFAULT_RATE_LIMIT_WINDOW: z.coerce.number().default(60), // 1 minute
    DEFAULT_RATE_LIMIT_MAX: z.coerce.number().default(100), // 100 requests per window
    RATE_LIMITER_TYPE: z.string().default('memory'),
    // Comma-separated list of trusted proxy IPs (e.g., "127.0.0.1,::1")
    TRUSTED_PROXIES: z.string().default('127.0.0.1,::1'),
    NEXTAUTH_SECRET: z.string(),
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    GOOGLE_ID: z.string(),
    GOOGLE_SECRET: z.string(),
    NODE_ENV: z.string().default('development'),
    BACKEND_AI_CALLBACK_URL: z.url(),
    BACKEND_URL: z.url(),
    OAUTH_SYNC_SECRET: z.string(),
    NEXTAUTH_URL: z.url(),
  },
  runtimeEnv: {
    DEFAULT_RATE_LIMIT_WINDOW: process.env.DEFAULT_RATE_LIMIT_WINDOW,
    DEFAULT_RATE_LIMIT_MAX: process.env.DEFAULT_RATE_LIMIT_MAX,
    RATE_LIMITER_TYPE: process.env.RATE_LIMITER_TYPE,
    TRUSTED_PROXIES: process.env.TRUSTED_PROXIES,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    GOOGLE_ID: process.env.GOOGLE_ID,
    GOOGLE_SECRET: process.env.GOOGLE_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    BACKEND_AI_CALLBACK_URL: process.env.BACKEND_AI_CALLBACK_URL,
    BACKEND_URL: process.env.BACKEND_URL,
    OAUTH_SYNC_SECRET: process.env.OAUTH_SYNC_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
})
