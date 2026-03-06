import os from 'os'
import pino from 'pino'

import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { SENSITIVE_FIELDS } from '../../../domain/audit/redact-sensitive-data.js'
import { EnvConfig } from '../../../infrastructure/config/env.config.js'

/**
 * Pino-based logging service implementation
 *
 * Provides structured JSON logging with support for different log levels and contexts.
 * In development mode, uses pino-pretty for colorized, human-readable output.
 * In production, outputs raw JSON for log aggregation systems.
 *
 * @class PinoLoggerService
 * @implements {LoggerPort}
 * @example
 * ```typescript
 * const logger = new PinoLoggerService()
 * logger.info('User logged in', { userId: '123' })
 * logger.error('Database error', new Error('Connection failed'), { query: 'SELECT...' })
 * ```
 */
export class PinoLoggerService implements LoggerPort {
  private logger: pino.Logger

  /**
   * Creates an instance of PinoLoggerService.
   *
   * Accepts either no arguments (creates a fresh Pino instance configured from
   * the environment) or an existing `pino.Logger` (used internally by `child()`
   * to wrap the child Pino instance in a properly-typed `PinoLoggerService`).
   *
   * - Development: Uses pino-pretty for colorized console output
   * - Production: Outputs structured JSON logs
   * - Log level: Determined by LOG_LEVEL environment variable
   */
  constructor(existingLogger?: pino.Logger) {
    if (existingLogger) {
      this.logger = existingLogger
      return
    }

    const isDevelopment = EnvConfig.NODE_ENV !== 'production'

    this.logger = pino({
      level: EnvConfig.LOG_LEVEL,
      redact: {
        paths: SENSITIVE_FIELDS.flatMap((field) => [
          field,
          `*.${field}`,
          `*.*.${field}`,
          `*.record.${field}`,
          `*.record.*.${field}`,
        ]),
        censor: '[REDACTED]',
      },
      base: {
        pid: process.pid,
        hostname: os.hostname(),
        service: EnvConfig.SERVICE_NAME,
        env: EnvConfig.NODE_ENV,
        version: EnvConfig.APP_VERSION,
      },
      ...(isDevelopment && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      }),
    })
  }

  /**
   * Logs an informational message
   *
   * Use for general application events and successful operations.
   *
   * @param {string} message - The log message
   * @param {Record<string, any>} [context] - Optional contextual data to include in the log
   * @example
   * ```typescript
   * logger.info('User registered', { userId: 'abc123', email: 'user@example.com' })
   * ```
   */
  info(message: string, context?: Record<string, any>): void {
    this.logger.info(context, message)
  }

  /**
   * Logs an error message with optional error object and context
   *
   * Use for exceptions, failures, and critical issues that need attention.
   * The error object is automatically serialized with stack trace.
   *
   * @param {string} message - The error message
   * @param {Error} [error] - Optional Error object with stack trace
   * @param {Record<string, any>} [context] - Optional contextual data (e.g., request ID, user ID)
   * @example
   * ```typescript
   * try {
   *   await saveUser(user)
   * } catch (err) {
   *   logger.error('Failed to save user', err, { userId: user.id })
   * }
   * ```
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.logger.error({ ...context, err: error }, message)
  }

  /**
   * Logs a warning message
   *
   * Use for potentially harmful situations or deprecated features that don't
   * prevent the application from functioning.
   *
   * @param {string} message - The warning message
   * @param {Record<string, any>} [context] - Optional contextual data
   * @example
   * ```typescript
   * logger.warn('API rate limit approaching', { remaining: 10, limit: 100 })
   * ```
   */
  warn(message: string, context?: Record<string, any>): void {
    this.logger.warn(context, message)
  }

  /**
   * Logs a debug message
   *
   * Use for detailed diagnostic information useful during development and troubleshooting.
   * Typically disabled in production unless LOG_LEVEL is set to 'debug'.
   *
   * @param {string} message - The debug message
   * @param {Record<string, any>} [context] - Optional contextual data
   * @example
   * ```typescript
   * logger.debug('Cache hit', { key: 'user:123', ttl: 3600 })
   * ```
   */
  debug(message: string, context?: Record<string, any>): void {
    this.logger.debug(context, message)
  }

  /**
   * Returns a new logger with the given fields pre-merged into every log line.
   *
   * Pino serialises the bindings once at construction time, so there is no
   * per-call overhead. Useful for attaching `requestId`, `userId`, etc. to all
   * logs emitted within a single request lifecycle.
   *
   * @param {Record<string, any>} bindings - Fields to merge into every log record
   * @returns {LoggerPort} A new `PinoLoggerService` wrapping a Pino child logger
   * @example
   * ```typescript
   * const reqLogger = logger.child({ requestId: request.id, userId: request.user?.sub })
   * reqLogger.info('chat started') // emits { requestId: '...', userId: '...', msg: 'chat started' }
   * ```
   */
  child(bindings: Record<string, any>): LoggerPort {
    return new PinoLoggerService(this.logger.child(bindings))
  }
}
