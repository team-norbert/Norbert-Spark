import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

import packageJson from '../../package.json' with { type: 'json' }

// Inject version from package.json at build time so that client code does not
// need to import package.json (which would bundle it into the browser build).
// Using ??= so that an explicit env var in the environment always wins.
process.env.NEXT_PUBLIC_APP_VERSION ??= packageJson.version
process.env.APP_VERSION ??= packageJson.version

export const env = createEnv({
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  client: {
    NEXT_PUBLIC_POST_AI_CALLBACK_URL: z.url(),
    NEXT_PUBLIC_BASE_URL: z.url(),
    NEXT_PUBLIC_BACKEND_URL: z.url(),
    NEXT_PUBLIC_NODE_ENV: z.string().default('development'),
    NEXT_PUBLIC_SERVICE_NAME: z.string().default('norberts-spark-frontend'),
    NEXT_PUBLIC_APP_VERSION: z.string(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_POST_AI_CALLBACK_URL: process.env.NEXT_PUBLIC_POST_AI_CALLBACK_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV,
    NEXT_PUBLIC_SERVICE_NAME: process.env.NEXT_PUBLIC_SERVICE_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  },
})

export { env as clientEnv }
