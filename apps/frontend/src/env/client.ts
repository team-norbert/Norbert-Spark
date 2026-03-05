import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  client: {
    NEXT_PUBLIC_POST_AI_CALLBACK_URL: z.url(),
    NEXT_PUBLIC_BASE_URL: z.url(),
    NEXT_PUBLIC_BACKEND_URL: z.url(),
    NEXT_PUBLIC_NODE_ENV: z.string().default('development'),
  },
  runtimeEnv: {
    NEXT_PUBLIC_POST_AI_CALLBACK_URL: process.env.NEXT_PUBLIC_POST_AI_CALLBACK_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
  },
})
