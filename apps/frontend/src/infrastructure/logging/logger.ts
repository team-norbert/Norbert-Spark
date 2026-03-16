import { redactSensitiveData } from '@norberts-spark/shared'

import type { LoggerPort } from '@/application/ports/logger.port.js'
import { env } from '@/env/client.js'

/**
 * Enumeration of all supported log levels in ascending severity order.
 *
 * The ordering `TRACE < DEBUG < INFO < WARN < ERROR` is enforced by the
 * `LOG_LEVELS` array inside {@link UnifiedLogger}. Any level below the
 * configured `minLevel` is silently discarded.
 */
const LogLevel = {
  /** Finest-grained diagnostic information. Suppressed in production. */
  TRACE: 'trace',
  /** Diagnostic information useful during development. Suppressed in production. */
  DEBUG: 'debug',
  /** Normal operational events. Suppressed in production. */
  INFO: 'info',
  /** Unexpected situations that do not stop execution. Always emitted. */
  WARN: 'warn',
  /** Failures that require attention. Always emitted. */
  ERROR: 'error',
} as const

/**
 * Union of all valid log level strings derived from {@link LogLevel}.
 * Equivalent to `'trace' | 'debug' | 'info' | 'warn' | 'error'`.
 */
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
   * An optional context label attached to every log entry as `loggerContext`.
   * Useful for identifying the module, component, or service that emitted the log.
   * @example
   * ```ts
   * createLogger({ prefix: 'AuthService' })
   * createLogger({ prefix: 'Users:ApiRoute' })
   * ```
   */
  prefix?: string
  /**
   * An optional numeric log level stored for compatibility with external systems
   * that use numeric levels (e.g. Pino's `30 = info`).
   *
   * This value is **not** emitted into {@link StructuredLogEntry} — it is only
   * accessible via {@link UnifiedLogger.getLevel}.
   */
  level?: number
}

/**
 * Legacy log shape returned by the pre-structured `UnifiedLogger`.
 *
 * @deprecated Superseded by {@link StructuredLogEntry}, which provides a
 *   machine-readable, GDPR-safe structured format. Do not use in new code.
 */
export interface FormattedLogMessage {
  /** ISO 8601 timestamp when the log message was created. */
  timestamp: string
  /** The prefix string for the logger instance, if configured. */
  prefix: string
  /** The log method/level in uppercase (e.g. `'DEBUG'`, `'INFO'`, `'WARN'`, `'ERROR'`). */
  method: string
  /** The human-readable log message. */
  message: string
  /** Optional numeric log level, included only if configured in {@link LoggerOptions.level}. */
  level?: number
}

/**
 * A structured log entry emitted by {@link UnifiedLogger}.
 *
 * Every entry is machine-readable and designed for ingestion by log
 * aggregators (Datadog, CloudWatch, Loki, etc.). Fields are grouped into
 * five categories:
 *
 * 1. **Core** — `level`, `timestamp`, `message` (always present)
 * 2. **Service metadata** — `service`, `env`, `version` (injected automatically)
 * 3. **Logger identity** — `loggerContext` (derived from the `prefix` option)
 * 4. **Error details** — `err` with `name` and `stack`; `err.message` omitted for GDPR safety
 * 5. **Extra fields** — any caller-supplied key/value pairs via the `context` argument
 *
 * Sensitive fields are redacted by `redactSensitiveData` from `@norberts-spark/shared`
 * before the entry is forwarded to `console.*`.
 *
 * @example
 * Server-side structured log (Server Action / API Route):
 * ```json
 * {
 *   "level": "error",
 *   "timestamp": "2026-03-06T12:00:00.000Z",
 *   "event": "server-action.backend-request.failed",
 *   "message": "Backend returned 502",
 *   "service": "norberts-spark-frontend",
 *   "env": "production",
 *   "version": "1.2.0",
 *   "loggerContext": "BackendRequest",
 *   "statusCode": 502,
 *   "endpoint": "/api/v1/ai/chats",
 *   "durationMs": 1200,
 *   "err": { "name": "Error" }
 * }
 * ```
 *
 * @example
 * Client-side structured log (React hook / component):
 * ```json
 * {
 *   "level": "error",
 *   "timestamp": "2026-03-06T12:00:05.000Z",
 *   "event": "chat.transport.error",
 *   "message": "Chat transport error",
 *   "service": "norberts-spark-frontend",
 *   "env": "production",
 *   "loggerContext": "UseAIChat:Hook",
 *   "err": { "name": "Error" }
 * }
 * ```
 */
export interface StructuredLogEntry {
  /** Log level string. One of `'trace'`, `'debug'`, `'info'`, `'warn'`, `'error'`. */
  level: string
  /** ISO 8601 timestamp produced by `new Date().toISOString()`. */
  timestamp: string
  /** Human-readable description of the event. Must not contain PII. */
  message: string
  /** Identifies the application in a multi-service log aggregator. */
  service: string
  /** Runtime environment (`'production'`, `'development'`, `'test'`, etc.). */
  env: string
  /** Application version string, used to correlate log spikes with deploys. */
  version: string
  /**
   * Module or component that emitted the log, derived from the `prefix`
   * option passed to {@link createLogger}.
   */
  loggerContext?: string
  /**
   * Stable, dot-separated machine-readable event name for filtering and
   * alerting in log aggregators (e.g. `'server-action.backend-request.failed'`).
   */
  event?: string
  /**
   * Serialised error details.
   * - `name` — always present (e.g. `'TypeError'`).
   * - `message` — included outside production to aid debugging. Omitted in
   *   production because error messages may contain PII.
   * - `stack` — included outside production with the full stack trace.
   * - `cause` — included outside production when `error.cause` is set (Node.js
   *   16.9+ wraps underlying errors here, e.g. the root cause of a fetch failure).
   * - Additional own enumerable properties (e.g. `code`, `errno`, `statusCode`)
   *   are captured outside production so that network/HTTP error details are visible.
   */
  err?: { name: string; message?: string; stack?: string; cause?: unknown; [key: string]: unknown }
  /**
   * Application-specific error code for programmatic error handling
   * (e.g. `'UNAUTHORIZED'`, `'NETWORK_ERROR'`, `'VALIDATION_FAILED'`).
   */
  errorCode?: string
  /** Any additional caller-supplied structured fields merged in at call time. */
  [key: string]: unknown
}

/**
 * Zero-dependency, `console`-based structured logger for the Next.js frontend.
 *
 * Works identically on the server (Node.js / Edge Runtime) and in the browser.
 * Each log method builds a {@link StructuredLogEntry}, runs it through
 * `redactSensitiveData`, and delegates to the matching `console.*` method
 * (`console.info`, `console.warn`, etc.).
 *
 * **Production filtering**: `trace`, `debug`, and `info` are no-ops when
 * `process.env.NODE_ENV === 'production'`. Only `warn` and `error` emit in
 * production.
 *
 * **Context propagation**: Use {@link child} to bind persistent fields (e.g.
 * `requestId`) that are merged into every entry produced by the child logger.
 *
 * @example
 * ```ts
 * const logger = createLogger({ prefix: 'BackendRequest' })
 * logger.info('Request completed', {
 *   event: 'server-action.backend-request.completed',
 *   endpoint: '/api/v1/ai/chats',
 *   statusCode: 200,
 *   durationMs: 42,
 * })
 *
 * // With per-request context binding:
 * const reqLogger = logger.child({ requestId: 'req-abc-123' })
 * reqLogger.warn('Slow response', { event: 'server-action.backend-request.slow', durationMs: 8000 })
 * ```
 */
export class UnifiedLogger implements LoggerPort {
  /**
   * Ordered array of level strings used to compare severity by index position.
   * Index 0 = lowest (`trace`), index 4 = highest (`error`).
   */
  private static readonly LOG_LEVELS = [
    LogLevel.TRACE,
    LogLevel.DEBUG,
    LogLevel.INFO,
    LogLevel.WARN,
    LogLevel.ERROR,
  ]

  /** Application identifier injected into every log entry as `service`. */
  private static readonly SERVICE_NAME = env.NEXT_PUBLIC_SERVICE_NAME || 'norberts-spark-frontend'
  /** Runtime environment injected into every log entry as `env`. */
  private static readonly ENV = process.env.NODE_ENV || 'development'
  /** Application version injected into every log entry as `version`. */
  private static readonly VERSION = env.NEXT_PUBLIC_APP_VERSION || 'unknown'

  /**
   * Core fields set by {@link formatMessage} that must never be overwritten by
   * caller-supplied `context` or `child()` bindings.
   * Declared as a static `Set` to avoid per-call allocation on the hot logging path.
   */
  private static readonly RESERVED_FIELDS = new Set([
    'level',
    'timestamp',
    'message',
    'service',
    'env',
    'version',
    'loggerContext',
  ])

  /**
   * Keys silently dropped from `context` and `child()` bindings to prevent
   * prototype-pollution attacks.
   */
  private static readonly BLOCKED_FIELDS = new Set(['__proto__', 'constructor', 'prototype'])

  /**
   * Persistent key/value pairs bound via {@link child} that are shallow-merged
   * into every log entry produced by this logger instance.
   */
  private bindings?: Record<string, unknown>

  /** The minimum severity threshold below which log calls are discarded. */
  private minLevel: LogLevelType
  /** Context label emitted as `loggerContext` in every entry. Empty string means omitted. */
  private readonly prefix: string
  /** Optional numeric level stored for external compatibility; not emitted in entries. */
  private level?: number

  /**
   * Creates a new {@link UnifiedLogger} instance.
   *
   * Prefer the {@link createLogger} factory over calling `new UnifiedLogger()`
   * directly — it is more concise and consistent across the codebase.
   *
   * @param options - Optional configuration. Defaults to `minLevel: 'debug'` with no prefix.
   */
  constructor(options: LoggerOptions = {}) {
    this.level = options.level
    this.minLevel = options.minLevel || LogLevel.DEBUG
    this.prefix = options.prefix || ''
  }

  /**
   * Returns `true` when `logLevel` meets or exceeds `minLevel`.
   *
   * Comparison is by index position within the ordered {@link LOG_LEVELS}
   * array (`trace = 0` … `error = 4`).
   *
   * @param logLevel - The severity of the message being evaluated.
   * @returns `true` when the message should be emitted; `false` to suppress it.
   */
  private shouldLog(logLevel: LogLevelType): boolean {
    return (
      UnifiedLogger.LOG_LEVELS.indexOf(logLevel) >= UnifiedLogger.LOG_LEVELS.indexOf(this.minLevel)
    )
  }

  /**
   * Builds a {@link StructuredLogEntry} for the given log level and message.
   *
   * Construction order:
   * 1. Core fields (`level`, `timestamp`, `message`, `service`, `env`, `version`)
   * 2. `loggerContext` from `this.prefix` (if set)
   * 3. Bound fields from `this.bindings` (merged in by {@link child})
   * 4. Per-call fields from `context`
   *
   * Reserved and prototype-polluting keys in steps 3–4 are silently dropped.
   * The completed entry is passed through `redactSensitiveData` before being returned.
   *
   * @param logLevel - The severity level for this entry.
   * @param message - The human-readable log message.
   * @param context - Optional caller-supplied structured fields to merge into the entry.
   * @returns A fully populated, redacted {@link StructuredLogEntry}.
   */
  private formatMessage(
    logLevel: LogLevelType,
    message: string,
    context?: Record<string, unknown>
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      level: logLevel,
      timestamp: new Date().toISOString(),
      message,
      service: UnifiedLogger.SERVICE_NAME,
      env: UnifiedLogger.ENV,
      version: UnifiedLogger.VERSION,
    }

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

    return redactSensitiveData(entry) as StructuredLogEntry
  }

  /**
   * Converts an `Error` into a serialised `err` object for inclusion in a
   * {@link StructuredLogEntry}.
   *
   * - `err.name` is always included (e.g. `'TypeError'`, `'RangeError'`).
   * - `err.message` is included outside production even when it is an empty
   *   string, so that `Error()` with no message is still distinguishable from
   *   a missing message. Omitted in production because messages may contain PII.
   * - `err.stack` is included only outside production with the full stack trace.
   * - `err.cause` is included outside production when `error.cause` is set
   *   (Node.js 16.9+). If the cause is itself an `Error` it is recursively
   *   serialised; otherwise it is converted to a string. This surfaces the
   *   underlying network/system error that wrapping errors (e.g. `fetch failed`)
   *   hide behind a generic top-level message.
   * - Any additional own enumerable properties (e.g. `code`, `errno`,
   *   `statusCode`, `syscall`) are captured outside production so that
   *   Node.js system and HTTP errors expose their full context.
   *
   * @param error - The `Error` instance to serialise.
   * @returns A plain object containing `name`, and outside production, `message`,
   *   `stack`, `cause`, and any extra enumerable own properties.
   */
  private serializeError(error: Error): {
    name: string
    message?: string
    stack?: string
    cause?: unknown
    [key: string]: unknown
  } {
    const serialized: {
      name: string
      message?: string
      stack?: string
      cause?: unknown
      [key: string]: unknown
    } = { name: error.name }

    if (UnifiedLogger.ENV !== 'production') {
      // Use !== undefined so that an empty-string message is still surfaced
      if (error.message !== undefined) {
        serialized.message = error.message
      }
      if (error.stack) {
        serialized.stack = error.stack
      }
      // Capture error.cause (Node.js 16.9+) — this is where fetch/undici wraps
      // the real underlying network error (e.g. ECONNREFUSED, ECONNRESET)
      const cause = (error as Error & { cause?: unknown }).cause
      if (cause !== undefined) {
        serialized.cause = cause instanceof Error ? this.serializeError(cause) : String(cause)
      }
      // Capture any additional own enumerable properties such as `code`, `errno`,
      // `statusCode`, or `syscall` that are common on Node.js system/network errors
      const STANDARD_KEYS = new Set(['name', 'message', 'stack', 'cause'])
      const errorRecord = error as unknown as Record<string, unknown>
      for (const key of Object.keys(error)) {
        if (!STANDARD_KEYS.has(key)) {
          Reflect.set(serialized, key, Reflect.get(errorRecord, key))
        }
      }
    }

    return serialized
  }

  /**
   * Emits a `warn`-level structured log entry.
   *
   * Always emitted regardless of `NODE_ENV`. Use it for unexpected situations
   * that do not stop execution but indicate something is wrong (e.g. a slow
   * response, a retried request, a deprecated code path).
   *
   * @param message - Human-readable description of the warning. Must not contain PII.
   * @param context - Optional structured fields merged into the entry
   *   (e.g. `{ event: 'middleware.rate-limit.exceeded', endpoint: '/api/v1/chat' }`).
   */
  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.formatMessage(LogLevel.WARN, message, context)
      console.warn(entry)
    }
  }

  /**
   * Emits an `error`-level structured log entry.
   *
   * Always emitted regardless of `NODE_ENV`. Use it for failures that require
   * attention (e.g. a failed backend request, an uncaught exception).
   *
   * When an `Error` is provided it is serialised via {@link serializeError}:
   * `err.name` is always present; outside production `err.message` and
   * `err.stack` are also included. In production `err.message` is omitted
   * because error messages may contain PII.
   *
   * @param message - Human-readable description of the failure. Must not contain PII.
   * @param error - Optional `Error` instance to serialise into the `err` field.
   * @param context - Optional structured fields merged into the entry
   *   (e.g. `{ event: 'server-action.backend-request.failed', statusCode: 502 }`).
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = error ? { ...context, err: this.serializeError(error) } : context
      const entry = this.formatMessage(LogLevel.ERROR, message, errorContext)
      console.error(entry)
    }
  }

  /**
   * Emits an `info`-level structured log entry.
   *
   * Suppressed when `process.env.NODE_ENV === 'production'`. Use it for normal
   * operational events that are valuable during development and staging (e.g. a
   * successful backend request, a completed user action).
   *
   * @param message - Human-readable description of the event. Must not contain PII.
   * @param context - Optional structured fields merged into the entry
   *   (e.g. `{ event: 'server-action.backend-request.completed', durationMs: 42 }`).
   */
  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO) && UnifiedLogger.ENV !== 'production') {
      const entry = this.formatMessage(LogLevel.INFO, message, context)
      console.info(entry)
    }
  }

  /**
   * Emits a `debug`-level structured log entry.
   *
   * Suppressed when `process.env.NODE_ENV === 'production'`. Use it for
   * diagnostic information useful when tracing a specific flow during
   * development but too noisy for production.
   *
   * @param message - Human-readable debug message. Must not contain PII.
   * @param context - Optional structured fields merged into the entry.
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG) && UnifiedLogger.ENV !== 'production') {
      const entry = this.formatMessage(LogLevel.DEBUG, message, context)
      console.debug(entry)
    }
  }

  /**
   * Emits a `trace`-level structured log entry.
   *
   * Suppressed when `process.env.NODE_ENV === 'production'`. Use it for the
   * finest-grained diagnostic information (e.g. entering/leaving a function,
   * loop iterations) where even `debug` would be too coarse.
   *
   * @param message - Human-readable trace message. Must not contain PII.
   * @param context - Optional structured fields merged into the entry.
   */
  trace(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.TRACE) && UnifiedLogger.ENV !== 'production') {
      const entry = this.formatMessage(LogLevel.TRACE, message, context)
      console.trace(entry)
    }
  }

  /**
   * Creates a new {@link UnifiedLogger} with the supplied `bindings` pre-merged
   * into every log entry it produces.
   *
   * The child inherits `minLevel` and `prefix` from the parent. Parent bindings
   * are shallow-merged with the new `bindings` (child wins on key conflicts).
   * The parent logger is **not** mutated.
   *
   * Prototype-polluting keys (`__proto__`, `constructor`, `prototype`) in
   * `bindings` are silently dropped when entries are built.
   *
   * @param bindings - Key/value pairs to pre-merge into every entry emitted by
   *   the child logger (e.g. `{ requestId: 'req-abc-123' }`).
   * @returns A new `UnifiedLogger` instance with the bound context.
   *
   * @example
   * ```ts
   * const reqLogger = logger.child({ requestId: req.headers['x-request-id'] })
   * reqLogger.info('Handling request', { event: 'api-route.users.fetched' })
   * // → entry contains both requestId and event
   * ```
   */
  child(bindings: Record<string, unknown>): UnifiedLogger {
    const childLogger = new UnifiedLogger({
      minLevel: this.minLevel,
      prefix: this.prefix,
      level: this.level,
    })
    // Shallow-merge parent bindings with new bindings; child wins on key conflicts.
    childLogger.bindings = { ...this.bindings, ...bindings }
    return childLogger
  }

  /**
   * Updates the minimum log level threshold at runtime.
   *
   * Any subsequent log call below the new `minLevel` will be silently
   * discarded. The production guard is unaffected — `trace`, `debug`, and
   * `info` remain no-ops in production regardless of `minLevel`.
   *
   * @param minLevel - The new minimum level
   *   (`'trace'` | `'debug'` | `'info'` | `'warn'` | `'error'`).
   *
   * @example
   * ```ts
   * logger.setMinLevel('warn') // silence debug and info going forward
   * ```
   */
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
   * Stores an optional numeric log level for compatibility with external
   * systems that use numeric levels (e.g. Pino's `30 = info`).
   *
   * This value is **not** emitted into the {@link StructuredLogEntry} — the
   * entry always uses the string `level` field. The numeric level is only
   * accessible via {@link getLevel} and is intended for serialisation to
   * external log consumers.
   *
   * @param level - The numeric log level to store (e.g. `30` for info in Pino).
   *
   * @example
   * ```ts
   * logger.setLevel(30)
   * logger.getLevel() // → 30
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
