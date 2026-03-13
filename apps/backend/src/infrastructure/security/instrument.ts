import * as Sentry from '@sentry/node'
import { obscured } from 'obscured'

import { EnvConfig } from '../config/env.config.js'

if (EnvConfig.SENTRY_ENABLED === true) {
  Sentry.init({
    dsn: obscured.value(EnvConfig.SENTRY_DSN),
    integrations: [
      // Configure Sentry AI SDK integration for monitoring LLM calls
      Sentry.vercelAIIntegration({
        recordInputs: true,
        recordOutputs: true,
      }),
    ],
    // Tracing must be enabled for agent monitoring to work
    tracesSampleRate: EnvConfig.NODE_ENV === 'production' ? 0.1 : 1.0,
    sendDefaultPii: false,
  })
}
