import * as Sentry from '@sentry/node'
import { obscured } from 'obscured'
import { EnvConfig } from '../config/env.config.js'

Sentry.init({
  dsn: obscured.value(EnvConfig.SENTRY_DSN),
  integrations: [
    // Add the Vercel AI SDK integration
    Sentry.vercelAIIntegration({
      recordInputs: true,
      recordOutputs: true,
    }),
  ],
  // Tracing must be enabled for agent monitoring to work
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
})
