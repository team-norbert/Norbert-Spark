export interface LoggerPort {
  trace(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  error(message: string, error?: Error, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  debug(message: string, context?: Record<string, unknown>): void
  /** Return a new logger with the given fields pre-merged into every log line. */
  child(bindings: Record<string, unknown>): LoggerPort
}
