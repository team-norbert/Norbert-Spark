import 'varlock/auto-load'

import { obscured } from 'obscured'
import { ENV } from 'varlock/env'

import packageJson from '../../../../../package.json' with { type: 'json' }

const { version } = packageJson

const requiredEnvs: string[] = [
  'DATABASE_URL',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'MODEL_NAME',
  'RESEND_API_KEY',
  'JWT_SECRET',
  'API_VERSION',
  'OAUTH_SYNC_SECRET',
  'CLOUDFLARE_API',
  'JWT_ISSUER',
  'ENCRYPTION_KEY',
]

export class EnvConfig {
  static readonly NODE_ENV = ENV.NODE_ENV || 'development'
  static readonly DATABASE_URL = obscured.make(ENV.DATABASE_URL)
  static readonly DATABASE_SSL_ENABLED = ENV.DATABASE_SSL_ENABLED ?? false
  static readonly DATABASE_SSL_REJECT_UNAUTHORIZED = ENV.DATABASE_SSL_REJECT_UNAUTHORIZED ?? true
  static readonly GOOGLE_GENERATIVE_AI_API_KEY = obscured.make(ENV.GOOGLE_GENERATIVE_AI_API_KEY)
  static readonly MODEL_NAME = ENV.MODEL_NAME
  static readonly PORT = ENV.PORT ?? 3001
  static readonly LOG_LEVEL = ENV.LOG_LEVEL || 'info'
  static readonly DATABASE_CONNECTION_TIMEOUT_MS = ENV.DATABASE_CONNECTION_TIMEOUT_MS ?? 5000
  static readonly DATABASE_IDLE_TIMEOUT_MS = ENV.DATABASE_IDLE_TIMEOUT_MS ?? 30000
  static readonly DATABASE_POOL_MAX = ENV.DATABASE_POOL_MAX ?? 20
  static readonly DATABASE_POOL_MIN = ENV.DATABASE_POOL_MIN ?? 5
  static readonly DATABASE_POOL_MAX_LIFETIME_SECONDS = ENV.DATABASE_POOL_MAX_LIFETIME_SECONDS ?? 60
  static readonly RESEND_API_KEY = obscured.make(ENV.RESEND_API_KEY)
  static readonly EMAIL_FROM_ADDRESS = ENV.EMAIL_FROM_ADDRESS || ''
  static readonly HOST = ENV.HOST || '127.0.0.1'
  static readonly USE_HTTPS = ENV.USE_HTTPS ?? true
  static readonly JWT_SECRET = ENV.JWT_SECRET
  static readonly JWT_EXPIRATION = ENV.JWT_EXPIRATION ?? 3600 // 1 hour in seconds
  static readonly JWT_ISSUER = ENV.JWT_ISSUER || 'my-app'
  static readonly API_VERSION = ENV.API_VERSION || 'v1'
  static readonly UPSTASH_REDIS_REST_URL = obscured.make(ENV.UPSTASH_REDIS_REST_URL)
  static readonly UPSTASH_REDIS_REST_TOKEN = obscured.make(ENV.UPSTASH_REDIS_REST_TOKEN)
  static readonly OAUTH_SYNC_SECRET = obscured.make(ENV.OAUTH_SYNC_SECRET)
  static readonly SENTRY_DSN = obscured.make(ENV.SENTRY_DSN)
  static readonly SENTRY_ENABLED = EnvConfig.parseBooleanEnv(ENV.SENTRY_ENABLED, false)
  static readonly SENTRY_AUTH_TOKEN = ENV.SENTRY_AUTH_TOKEN || ''
  static readonly SENTRY_PROJECT = ENV.SENTRY_PROJECT || ''
  static readonly SENTRY_ORG = ENV.SENTRY_ORG || ''
  static readonly CLOUDFLARE_ACCESS_SECRET = obscured.make(ENV.CLOUDFLARE_ACCESS_SECRET) || ''
  static readonly CLOUDFLARE_ACCESS_ID = obscured.make(ENV.CLOUDFLARE_ACCESS_ID) || ''
  static readonly CLOUDFLARE_ENDPOINT = ENV.CLOUDFLARE_ENDPOINT || ''
  static readonly CLOUDFLARE_API = obscured.make(ENV.CLOUDFLARE_API) || ''
  static readonly BUCKET = ENV.BUCKET || ''
  static readonly OTEL_CAPTURE_QUERY_TEXT = ENV.OTEL_CAPTURE_QUERY_TEXT ?? false
  static readonly ENCRYPTION_KEY = obscured.make(ENV.ENCRYPTION_KEY) || ''
  static readonly REFRESH_TOKEN_EXPIRATION = ENV.REFRESH_TOKEN_EXPIRATION ?? 604800 // 7 days in seconds
  static readonly ACCESS_TOKEN_BUFFER = ENV.ACCESS_TOKEN_BUFFER ?? 300 // 5 minutes in seconds
  static readonly SERVICE_NAME = ENV.SERVICE_NAME || 'norberts-spark-backend'
  static readonly APP_VERSION = version
  static readonly REDIS_URL = obscured.make(ENV.REDIS_URL)
  static readonly APPLICATION_NAME = ENV.APPLICATION_NAME || 'Norberts Spark Backend'
  private static parseBooleanEnv(value: unknown, defaultValue: boolean): boolean {
    if (typeof value === 'boolean') {
      return value
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (['true', '1', 'yes', 'on'].includes(normalized)) {
        return true
      }
      if (['false', '0', 'no', 'off'].includes(normalized)) {
        return false
      }
    }
    return defaultValue
  }
  static validate(): void {
    const missing = requiredEnvs.filter((key) => !Reflect.get(ENV, key))

    if (EnvConfig.JWT_ISSUER === 'my-app') {
      throw new Error(
        `Invalid JWT_ISSUER value 'my-app'. Please set JWT_ISSUER to a unique, non-default value for your application.`
      )
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }
}
