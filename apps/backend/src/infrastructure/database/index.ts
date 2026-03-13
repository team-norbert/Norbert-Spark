import { instrumentDrizzleClient } from '@kubiks/otel-drizzle'
import { drizzle } from 'drizzle-orm/node-postgres'
import { obscured } from 'obscured'
import { Pool } from 'pg'

import { ValidationException } from '../../shared/exceptions/validation.exception.js'
import { EnvConfig } from '../config/env.config.js'

const logger = {
  info: (...params: unknown[]) => console.info(...params),
  error: (...params: unknown[]) => console.error(...params),
}

logger.info('Connecting to database...')

if (!obscured.value(EnvConfig.DATABASE_URL)) {
  throw new ValidationException('DATABASE_URL is required but not configured')
}

export const pool = new Pool({
  connectionString: obscured.value(EnvConfig.DATABASE_URL),
  ssl:
    String(EnvConfig.DATABASE_SSL_ENABLED) === 'true'
      ? { rejectUnauthorized: String(EnvConfig.DATABASE_SSL_REJECT_UNAUTHORIZED) !== 'false' }
      : false,
  connectionTimeoutMillis: Number(EnvConfig.DATABASE_CONNECTION_TIMEOUT_MS),
  idleTimeoutMillis: Number(EnvConfig.DATABASE_IDLE_TIMEOUT_MS),
  max: Number(EnvConfig.DATABASE_POOL_MAX),
  min: Number(EnvConfig.DATABASE_POOL_MIN),
  maxLifetimeSeconds: Number(EnvConfig.DATABASE_POOL_MAX_LIFETIME_SECONDS),
})

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err)
  process.exit(-1)
})

const db = drizzle(pool)

const shouldCaptureQueryText =
  EnvConfig.NODE_ENV !== 'production' && EnvConfig.OTEL_CAPTURE_QUERY_TEXT

const instrumentedDb = instrumentDrizzleClient(db, {
  captureQueryText: shouldCaptureQueryText,
  maxQueryTextLength: 500,
})

export { instrumentedDb as db }
