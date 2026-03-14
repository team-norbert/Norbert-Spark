import { redactSensitiveData } from '@norberts-spark/shared'

import type { LoggerPort } from '@/application/ports/logger.port.js'
import { env } from '@/env/client.js'

const LogLevel = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const

type LogLevelType = (typeof LogLevel)[keyof typeof LogLevel]

/**
 * Configuration options for the UnifiedLogger.
 */
export interface LoggerOptions {
  /**
   * The minimum log level to output. Messages below this level will be filtered out.
   * Hierarchy: TRACE < DEBUG < INFO < WARN < ERROR
   * @default 'debug'
   */
  minLevel?: LogLevelType
  /**
   * An optional prefix to prepend to all log messages.
   * Useful for identifying the source of log messages (e.g., component name, module name).
   * @example '[AuthService]', '[UserAPI]'
   */
  prefix?: string
  /**
   * The numeric log level for compatibility purposes.
   */
  level?: number
}

/**
 * Represents a formatted log message with metadata.
 */
export interface FormattedLogMessage {
  /**
   * ISO 8601 timestamp when the log message was created.
   */
  timestamp: string
  /**
   * The prefix string for the logger instance, if configured.
   */
  prefix: string
  /**
   *
   * The log method/level in uppercase (e.g., 'DEBUG', 'INFO', 'WARN', 'ERROR').
   */
  method: string
  /**
   * The actual log message content.
   */
  message: string
  /**
   * Optional numeric log level, included only if configured in LoggerOptions.
   */
  level?: number
}

/**
 * A structured log entry emitted by UnifiedLogger.
 * Designed for machine-readability in log aggregators.
 */
export interface StructuredLogEntry {
  /** Log level: 'trace' | 'debug' | 'info' | 'warn' | 'error' */
  level: string
  /** ISO 8601 timestamp */
  timestamp: string
  /** Human-readable log message */
  message: string
  /** Service identifier */
  service: string
  /** Runtime environment */
  env: string
  /** Application version */
  version: string
  /** Logger context/module name (formerly 'prefix') */
  loggerContext?: string
  /** Stable, dot-separated event name for machine filtering */
  event?: string
  /** Serialised error details (message omitted — may contain PII) */
  err?: { name: string; stack?: string }
  /** Application-specific error code */
  errorCode?: string
  /** Additional structured fields */
  [key: string]: unknown
}

// frontend server log shape
// {
//   "level": "error",
//   "timestamp": "2026-03-06T12:00:00.000Z",
//   "event": "server-action.backend-request.failed",
//   "message": "Backend returned 502",
//   "service": "norberts-spark-frontend",
//   "env": "production",
//   "version": "1.2.0",
//   "loggerContext": "backendRequest",
//   "statusCode": 502,
//   "endpoint": "/api/v1/ai/chats",
//   "durationMs": 1200,
//   "err": {
//     "name": "Error"
//   }
// }
//
// backend server log shape
// {
//   "level": "error",
//   "timestamp": "2026-03-06T12:00:05.000Z",
//   "event": "chat.transport.error",
//   "message": "Chat transport error",
//   "service": "norberts-spark-frontend",
//   "env": "production",
//   "loggerContext": "useAIChat",
//   "err": {
//     "name": "Error"
//   }
// }

export class UnifiedLogger implements LoggerPort {
  private static readonly LOG_LEVELS = [
    LogLevel.TRACE,
    LogLevel.DEBUG,
    LogLevel.INFO,
    LogLevel.WARN,
    LogLevel.ERROR,
  ]

  private static readonly SERVICE_NAME = env.NEXT_PUBLIC_SERVICE_NAME || 'norberts-spark-frontend'
  private static readonly ENV = process.env.NODE_ENV || 'development'
  private static readonly VERSION = env.NEXT_PUBLIC_APP_VERSION || 'unknown'

  // Hoisted to avoid per-call allocations on the hot logging path
  private static readonly RESERVED_FIELDS = new Set([
    'level',
    'timestamp',
    'message',
    'service',
    'env',
    'version',
    'loggerContext',
  ])
  private static readonly BLOCKED_FIELDS = new Set(['__proto__', 'constructor', 'prototype'])
  private bindings?: Record<string, unknown>

  private minLevel: LogLevelType
  private readonly prefix: string
  private level?: number

  constructor(options: LoggerOptions = {}) {
    this.level = options.level
    this.minLevel = options.minLevel || LogLevel.DEBUG
    this.prefix = options.prefix || ''
  }

  private shouldLog(logLevel: LogLevelType): boolean {
    return (
      UnifiedLogger.LOG_LEVELS.indexOf(logLevel) >= UnifiedLogger.LOG_LEVELS.indexOf(this.minLevel)
    )
  }

  private formatMessage(
    logLevel: LogLevelType,
    message: string,
    context?: Record<string, unknown>
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = redactSensitiveData({
      level: logLevel,
      timestamp: new Date().toISOString(),
      message,
      service: UnifiedLogger.SERVICE_NAME,
      env: UnifiedLogger.ENV,
      version: UnifiedLogger.VERSION,
    }) as StructuredLogEntry

    if (this.prefix) {
      entry.loggerContext = this.prefix
    }

    // Merge bound context from child() loggers
    if (this.bindings) {
      for (const [k, v] of Object.entries(this.bindings)) {
        if (!UnifiedLogger.RESERVED_FIELDS.has(k) && !UnifiedLogger.BLOCKED_FIELDS.has(k)) {
          Object.assign(entry, { [k]: v })
        }
      }
    }

    // Merge per-call fields
    if (context) {
      for (const [k, v] of Object.entries(context)) {
        if (!UnifiedLogger.RESERVED_FIELDS.has(k) && !UnifiedLogger.BLOCKED_FIELDS.has(k)) {
          Object.assign(entry, { [k]: v })
        }
      }
    }

    return entry
  }

  private serializeError(error: Error): { name: string; stack?: string } {
    const serialized: { name: string; stack?: string } = {
      name: error.name,
    }
    if (UnifiedLogger.ENV !== 'production' && error.stack) {
      // Strip the first line ("ErrorName: message") to avoid reintroducing the error message,
      // which may contain sensitive data, while preserving useful stack frames.
      const lines = error.stack.split('\n')
      const sanitizedStack = lines.slice(1).join('\n').trim()
      if (sanitizedStack) {
        serialized.stack = sanitizedStack
      }
    }
    return serialized
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.formatMessage(LogLevel.WARN, message, context)
      console.warn(entry)
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = error ? { ...context, err: this.serializeError(error) } : context
      const entry = this.formatMessage(LogLevel.ERROR, message, errorContext)
      console.error(entry)
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO) && UnifiedLogger.ENV !== 'production') {
      const entry = this.formatMessage(LogLevel.INFO, message, context)
      console.info(entry)
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG) && UnifiedLogger.ENV !== 'production') {
      const entry = this.formatMessage(LogLevel.DEBUG, message, context)
      console.debug(entry)
    }
  }

  trace(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.TRACE) && UnifiedLogger.ENV !== 'production') {
      const entry = this.formatMessage(LogLevel.TRACE, message, context)
      console.trace(entry)
    }
  }

  child(bindings: Record<string, unknown>): UnifiedLogger {
    const childLogger = new UnifiedLogger({
      minLevel: this.minLevel,
      prefix: this.prefix,
      level: this.level,
    })
    // Merge parent bindings with new bindings
    childLogger.bindings = { ...this.bindings, ...bindings }
    return childLogger
  }

  setMinLevel(minLevel: LogLevelType): void {
    this.minLevel = minLevel
  }

  /**
   * Returns the current minimum logging level threshold.
   *
   * @returns The current minimum level ('trace' | 'debug' | 'info' | 'warn' | 'error')
   *
   * @example
   * ```typescript
   * const currentMinLevel = logger.getMinLevel() // e.g., 'debug'
   * ```
   */
  getMinLevel(): LogLevelType {
    return this.minLevel
  }

  /**
   * Sets the optional numeric log level.
   * When set, this value will be included in the formatted log message output.
   * Useful for compatibility with logging systems that use numeric levels.
   *
   * @param level - The numeric log level
   *
   * @example
   * ```typescript
   * logger.setLevel(30) // Sets numeric level to 30
   * logger.info('Message') // Output will include level: 30
   * ```
   */
  setLevel(level: number): void {
    this.level = level
  }

  /**
   * Returns the current numeric log level if set, otherwise undefined.
   *
   * @returns The numeric level or undefined if not configured
   *
   * @example
   * ```typescript
   * const level = logger.getLevel() // e.g., 30 or undefined
   * ```
   */
  getLevel(): number | undefined {
    return this.level
  }
}

/**
 * Factory function to create a new UnifiedLogger instance.
 * Provides a convenient way to instantiate loggers without using 'new'.
 *
 * @param options - Optional configuration for the logger
 * @returns A new UnifiedLogger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger({ minLevel: 'info', prefix: 'API' })
 * logger.info('Request received')
 * ```
 */
export function createLogger(options?: LoggerOptions): UnifiedLogger {
  return new UnifiedLogger(options)
}
