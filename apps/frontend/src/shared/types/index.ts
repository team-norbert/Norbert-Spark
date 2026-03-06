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

/**
 * frontend server log shape
 * {
 *   "level": "error",
 *   "timestamp": "2026-03-06T12:00:00.000Z",
 *   "event": "server-action.backend-request.failed",
 *   "message": "Backend returned 502",
 *   "service": "norberts-spark-frontend",
 *   "env": "production",
 *   "version": "1.2.0",
 *   "loggerContext": "backendRequest",
 *   "statusCode": 502,
 *   "endpoint": "/api/v1/ai/chats",
 *   "durationMs": 1200,
 *   "err": {
 *     "name": "Error"
 *   }
 * }
 *
 * backend server log shape
 * {
 *   "level": "error",
 *   "timestamp": "2026-03-06T12:00:05.000Z",
 *   "event": "chat.transport.error",
 *   "message": "Chat transport error",
 *   "service": "norberts-spark-frontend",
 *   "env": "production",
 *   "loggerContext": "useAIChat",
 *   "err": {
 *     "name": "Error"
 *   }
 * }
 */
