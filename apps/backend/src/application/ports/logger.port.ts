export interface LoggerPort {
  info(message: string, context?: Record<string, any>): void
  error(message: string, error?: Error, context?: Record<string, any>): void
  warn(message: string, context?: Record<string, any>): void
  debug(message: string, context?: Record<string, any>): void
  /** Return a new logger with the given fields pre-merged into every log line. */
  child(bindings: Record<string, any>): LoggerPort
}
