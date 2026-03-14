import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createLogger, UnifiedLogger } from '@/infrastructure/logging/logger.js'

// ---------------------------------------------------------------------------
// Mutable env mock — vi.hoisted ensures it is available before vi.mock's
// factory runs and before any module is imported.
// Note: UnifiedLogger determines production filtering from process.env.NODE_ENV
// captured at module load; this mock only controls the client env values read
// from @/env/client.js (e.g. service name, reported environment, URLs).
const mockEnv = vi.hoisted(() => ({
  NEXT_PUBLIC_SERVICE_NAME: 'norberts-spark-frontend',
  NEXT_PUBLIC_NODE_ENV: 'development',
  NEXT_PUBLIC_APP_VERSION: 'unknown',
  NEXT_PUBLIC_POST_AI_CALLBACK_URL: 'http://localhost:3001/api/ai/callback',
  NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
  NEXT_PUBLIC_BACKEND_URL: 'http://localhost:3001',
}))

vi.mock('@/env/client.js', () => ({ env: mockEnv, clientEnv: mockEnv }))

describe('UnifiedLogger', () => {
  let consoleTraceSpy: ReturnType<typeof vi.spyOn>
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Reset to non-production for every test
    mockEnv.NEXT_PUBLIC_NODE_ENV = 'development'
    consoleTraceSpy = vi.spyOn(console, 'trace').mockImplementation(() => {})
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleTraceSpy.mockRestore()
    consoleDebugSpy.mockRestore()
    consoleInfoSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  // -------------------------------------------------------------------------
  // constructor
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    it('should create logger with default options', () => {
      const logger = new UnifiedLogger()

      expect(logger).toBeInstanceOf(UnifiedLogger)
    })

    it('should create logger with custom minimum log level', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.debug('test')
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
    })

    it('should map prefix to loggerContext in log entries', () => {
      const logger = new UnifiedLogger({ prefix: 'MyApp' })

      logger.info('test message')

      const entry = consoleInfoSpy.mock.calls[0][0]
      expect(entry).toBeTypeOf('object')
      expect(entry.loggerContext).toBe('MyApp')
    })

    it('should create logger with both custom minimum level and prefix', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn', prefix: 'API' })

      logger.warn('test warning')

      const entry = consoleWarnSpy.mock.calls[0][0]
      expect(entry).toBeTypeOf('object')
      expect(entry.loggerContext).toBe('API')
    })
  })

  // -------------------------------------------------------------------------
  // StructuredLogEntry shape
  // Step 12 test case: `formatMessage` returns `StructuredLogEntry` shape
  // -------------------------------------------------------------------------
  describe('StructuredLogEntry shape', () => {
    it('should include all required fields in every log entry', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.info('test message')

      const entry = consoleInfoSpy.mock.calls[0][0]
      expect(entry).toMatchObject({
        level: 'info',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        message: 'test message',
        service: 'norberts-spark-frontend',
        env: 'test',
        version: 'unknown',
      })
    })

    it('should set level as lowercase string matching the log level', () => {
      const logger = new UnifiedLogger({ minLevel: 'trace' })

      logger.trace('t')
      logger.debug('d')
      logger.info('i')
      logger.warn('w')
      logger.error('e')

      expect(consoleTraceSpy.mock.calls[0][0].level).toBe('trace')
      expect(consoleDebugSpy.mock.calls[0][0].level).toBe('debug')
      expect(consoleInfoSpy.mock.calls[0][0].level).toBe('info')
      expect(consoleWarnSpy.mock.calls[0][0].level).toBe('warn')
      expect(consoleErrorSpy.mock.calls[0][0].level).toBe('error')
    })

    it('should not include loggerContext when prefix is not set', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.info('test')

      expect(consoleInfoSpy.mock.calls[0][0].loggerContext).toBeUndefined()
    })

    // Step 12 test case: `prefix` maps to `loggerContext` field
    it('should include loggerContext equal to the prefix value when set', () => {
      const logger = new UnifiedLogger({ prefix: 'TestPrefix' })

      logger.info('test')

      expect(consoleInfoSpy.mock.calls[0][0].loggerContext).toBe('TestPrefix')
    })

    it('should merge context fields into the log entry', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.info('test', { requestId: 'abc-123', statusCode: 200 })

      const entry = consoleInfoSpy.mock.calls[0][0]
      expect(entry.requestId).toBe('abc-123')
      expect(entry.statusCode).toBe(200)
    })

    // Step 12 test case: `event` field passes through
    it('should pass the event field through context', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.info('cache hit', { event: 'cache.read.hit' })

      expect(consoleInfoSpy.mock.calls[0][0].event).toBe('cache.read.hit')
    })

    it('should pass the event field through when calling warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.warn('rate limit hit', { event: 'middleware.rate-limit.exceeded' })

      expect(consoleWarnSpy.mock.calls[0][0].event).toBe('middleware.rate-limit.exceeded')
    })

    it('should pass the event field through when calling error', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.error('backend failed', undefined, { event: 'server-action.backend-request.failed' })

      expect(consoleErrorSpy.mock.calls[0][0].event).toBe(
        'server-action.backend-request.failed'
      )
    })

    it('should not allow RESERVED fields to be overwritten by context', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.info('message', {
        level: 'evil',
        timestamp: '1970',
        message: 'overwritten',
        service: 'hacker',
        env: 'evil-env',
        version: '0.0.0',
        loggerContext: 'injected',
      })

      const entry = consoleInfoSpy.mock.calls[0][0]
      expect(entry.level).toBe('info')
      expect(entry.message).toBe('message')
      expect(entry.service).toBe('norberts-spark-frontend')
      expect(entry.env).toBe('test')
      expect(entry.version).toBe('unknown')
      expect(entry.timestamp).not.toBe('1970')
      // no prefix was set, and the injected loggerContext was blocked
      expect(entry.loggerContext).toBeUndefined()
    })

    it('should call console with a single StructuredLogEntry argument (context is merged, not spread)', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.info('test', { foo: 'bar' })

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy.mock.calls[0]).toHaveLength(1)
      expect(consoleInfoSpy.mock.calls[0][0].foo).toBe('bar')
    })

    it('should block prototype-pollution keys (__proto__, constructor, prototype) in per-call context', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      const maliciousContext = JSON.parse(
        '{"__proto__":{"polluted":true},"constructor":{"evil":1},"prototype":{"bad":2},"safe":"value"}'
      ) as Record<string, unknown>

      logger.info('test', maliciousContext)

      const entry = consoleInfoSpy.mock.calls[0][0]
      // Safe key is preserved
      expect(entry.safe).toBe('value')
      // Prototype-pollution keys are not set as own properties
      expect(Object.prototype).not.toHaveProperty('polluted')
      expect(Object.hasOwn(entry, '__proto__')).toBe(false)
      expect(Object.hasOwn(entry, 'constructor')).toBe(false)
      expect(Object.hasOwn(entry, 'prototype')).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // trace
  // -------------------------------------------------------------------------
  describe('trace', () => {
    it('should log trace messages when minLevel is trace', () => {
      const logger = new UnifiedLogger({ minLevel: 'trace' })

      logger.trace('trace message')

      expect(consoleTraceSpy).toHaveBeenCalledTimes(1)
      expect(consoleTraceSpy.mock.calls[0][0].level).toBe('trace')
    })

    it('should not log trace messages when minLevel is debug', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.trace('trace message')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
    })

    it('should not log trace messages when minLevel is info', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.trace('trace message')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
    })

    it('should not log trace messages when minLevel is warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.trace('trace message')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
    })

    it('should not log trace messages when minLevel is error', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.trace('trace message')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
    })

    it('should include timestamp in trace message', () => {
      const logger = new UnifiedLogger({ minLevel: 'trace' })

      logger.trace('test')

      const entry = consoleTraceSpy.mock.calls[0][0]
      expect(entry).toBeTypeOf('object')
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should merge context object into the log entry', () => {
      const logger = new UnifiedLogger({ minLevel: 'trace' })

      logger.trace('trace message', { key: 'value' })

      const entry = consoleTraceSpy.mock.calls[0][0]
      expect(entry.message).toBe('trace message')
      expect(entry.key).toBe('value')
    })
  })

  // -------------------------------------------------------------------------
  // debug
  // -------------------------------------------------------------------------
  describe('debug', () => {
    it('should log debug messages when minLevel is debug', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.debug('debug message')

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      expect(consoleDebugSpy.mock.calls[0][0].level).toBe('debug')
    })

    it('should not log debug messages when minLevel is info', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.debug('debug message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should not log debug messages when minLevel is warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.debug('debug message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should not log debug messages when minLevel is error', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.debug('debug message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should include timestamp in debug message', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.debug('test')

      const entry = consoleDebugSpy.mock.calls[0][0]
      expect(entry).toBeTypeOf('object')
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should merge context object into the log entry', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.debug('debug message', { key: 'value' })

      const entry = consoleDebugSpy.mock.calls[0][0]
      expect(entry.message).toBe('debug message')
      expect(entry.key).toBe('value')
    })
  })

  // -------------------------------------------------------------------------
  // info
  // -------------------------------------------------------------------------
  describe('info', () => {
    it('should log info messages when minLevel is debug', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.info('info message')

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy.mock.calls[0][0].level).toBe('info')
    })

    it('should log info messages when minLevel is info', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.info('info message')

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
    })

    it('should not log info messages when minLevel is warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.info('info message')

      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    it('should not log info messages when minLevel is error', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.info('info message')

      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    it('should include timestamp in info message', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.info('test')

      const entry = consoleInfoSpy.mock.calls[0][0]
      expect(entry).toBeTypeOf('object')
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should merge context object into the log entry', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.info('info message', { userId: 'u-123' })

      const entry = consoleInfoSpy.mock.calls[0][0]
      expect(entry.message).toBe('info message')
      expect(entry.userId).toBe('u-123')
    })
  })

  // -------------------------------------------------------------------------
  // warn
  // -------------------------------------------------------------------------
  describe('warn', () => {
    it('should log warn messages when minLevel is debug', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.warn('warn message')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy.mock.calls[0][0].level).toBe('warn')
    })

    it('should log warn messages when minLevel is info', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.warn('warn message')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    })

    it('should log warn messages when minLevel is warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.warn('warn message')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    })

    it('should not log warn messages when minLevel is error', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.warn('warn message')

      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should include timestamp in warn message', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.warn('test')

      const entry = consoleWarnSpy.mock.calls[0][0]
      expect(entry).toBeTypeOf('object')
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should merge context object into the log entry', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.warn('warn message', { retryCount: 3 })

      const entry = consoleWarnSpy.mock.calls[0][0]
      expect(entry.message).toBe('warn message')
      expect(entry.retryCount).toBe(3)
    })
  })

  // -------------------------------------------------------------------------
  // error
  // -------------------------------------------------------------------------
  describe('error', () => {
    it('should log error messages when minLevel is debug', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy.mock.calls[0][0].level).toBe('error')
    })

    it('should log error messages when minLevel is info', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should log error messages when minLevel is warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should log error messages when minLevel is error', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should include timestamp in error message', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.error('test')

      const entry = consoleErrorSpy.mock.calls[0][0]
      expect(entry).toBeTypeOf('object')
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should set err.name from the provided Error', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.error('error message', new TypeError('bad value'))

      expect(consoleErrorSpy.mock.calls[0][0].err).toMatchObject({ name: 'TypeError' })
    })

    it('should include err.stack in non-production environment', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.error('error message', new Error('fail'))

      expect(consoleErrorSpy.mock.calls[0][0].err?.stack).toBeDefined()
    })

    it('should merge additional context alongside err', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })
      const error = new Error('critical error')

      logger.error('error message', error, { userId: 'u-123' })

      const entry = consoleErrorSpy.mock.calls[0][0]
      expect(entry.message).toBe('error message')
      expect(entry.err).toMatchObject({ name: 'Error' })
      expect(entry.userId).toBe('u-123')
    })

    it('should not set err when no Error is provided', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.error('error message')

      expect(consoleErrorSpy.mock.calls[0][0].err).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // error serialization (serializeError)
  // Step 12 test cases:
  //   - `error()` serialises Error into `err` with no `err.message`
  //   - Error stack excluded in production
  // -------------------------------------------------------------------------
  describe('error serialization', () => {
    it('should set err.name matching error.name', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.error('range fail', new RangeError('out of bounds'))

      expect(consoleErrorSpy.mock.calls[0][0].err?.name).toBe('RangeError')
    })

    it('should not include err.message (PII safety — only name and stack are serialised)', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.error('test', new Error('sensitive info in message'))

      const err = consoleErrorSpy.mock.calls[0][0].err as Record<string, unknown> | undefined
      expect(err?.message).toBeUndefined()
    })

    it('should include err.stack in non-production (NODE_ENV=test)', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.error('test', new Error('stack test'))

      const entry = consoleErrorSpy.mock.calls[0][0]
      expect(typeof entry.err?.stack).toBe('string')
      expect(entry.err?.stack).toContain('at ')
    })

    it('should strip the error message from err.stack to avoid re-introducing PII', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })
      const error = new Error('sensitive message in stack header')

      logger.error('test', error)

      const stack = consoleErrorSpy.mock.calls[0][0].err?.stack as string | undefined
      // The first line of the raw stack is "Error: sensitive message..." — it must be stripped
      expect(stack).not.toMatch(/^Error:/)
      expect(stack).not.toContain('sensitive message in stack header')
    })

    // Step 12 test case: Error stack excluded in production
    it('should exclude err.stack when process.env.NODE_ENV is production', async () => {
      // ENV is a static readonly field captured at class-load time, so we must
      // reset the module registry and re-import with NODE_ENV='production'.
      ;(process.env as { NODE_ENV?: string }).NODE_ENV = 'production'
      vi.resetModules()
      try {
        const { UnifiedLogger: ProdLogger } = await import('@/infrastructure/logging/logger.js')
        const logger = new ProdLogger({ minLevel: 'error' })
        logger.error('test', new Error('no stack'))
        expect(consoleErrorSpy.mock.calls[0][0].err?.stack).toBeUndefined()
      } finally {
        ;(process.env as { NODE_ENV?: string }).NODE_ENV = 'test'
        vi.resetModules()
      }
    })
  })

  // -------------------------------------------------------------------------
  // setMinLevel and getMinLevel
  // -------------------------------------------------------------------------
  describe('setMinLevel and getMinLevel', () => {
    it('should change minimum log level from debug to warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      expect(logger.getMinLevel()).toBe('debug')

      logger.setMinLevel('warn')

      expect(logger.getMinLevel()).toBe('warn')
      logger.debug('should not appear')
      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should change minimum log level from debug to error', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.setMinLevel('error')

      expect(logger.getMinLevel()).toBe('error')
      logger.info('should not appear')
      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    it('should allow changing minimum level multiple times', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.setMinLevel('debug')
      expect(logger.getMinLevel()).toBe('debug')

      logger.setMinLevel('warn')
      expect(logger.getMinLevel()).toBe('warn')

      logger.setMinLevel('error')
      expect(logger.getMinLevel()).toBe('error')
    })

    it('should affect logging behavior after minimum level change', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.info('should not log')
      expect(consoleInfoSpy).not.toHaveBeenCalled()

      logger.setMinLevel('info')
      logger.info('should log now')
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
    })
  })

  // -------------------------------------------------------------------------
  // setLevel and getLevel (numeric level — stored for external compatibility,
  // but NOT emitted into StructuredLogEntry; entry.level is always the string level)
  // -------------------------------------------------------------------------
  describe('setLevel and getLevel', () => {
    it('should return undefined when level is not set', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      expect(logger.getLevel()).toBeUndefined()
    })

    it('should set and get a numeric level', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.setLevel(30)

      expect(logger.getLevel()).toBe(30)
    })

    it('should allow changing level multiple times', () => {
      const logger = new UnifiedLogger({ minLevel: 'info', level: 10 })

      expect(logger.getLevel()).toBe(10)

      logger.setLevel(20)
      expect(logger.getLevel()).toBe(20)

      logger.setLevel(30)
      expect(logger.getLevel()).toBe(30)
    })

    it('should not affect the level string field in log entries', () => {
      // The numeric level option is stored for external compatibility but is NOT emitted
      // into the StructuredLogEntry — entry.level is always the string log level.
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.setLevel(40)
      logger.info('test')

      expect(consoleInfoSpy.mock.calls[0][0].level).toBe('info')
    })
  })

  // -------------------------------------------------------------------------
  // log level hierarchy
  // -------------------------------------------------------------------------
  describe('log level hierarchy', () => {
    it('should log all levels when minLevel is trace', () => {
      const logger = new UnifiedLogger({ minLevel: 'trace' })

      logger.trace('trace')
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleTraceSpy).toHaveBeenCalledTimes(1)
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should skip trace when minLevel is debug', () => {
      const logger = new UnifiedLogger({ minLevel: 'debug' })

      logger.trace('trace')
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should skip trace and debug when minLevel is info', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      logger.trace('trace')
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should only log warn and error when minLevel is warn', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })

      logger.trace('trace')
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should only log error when minLevel is error', () => {
      const logger = new UnifiedLogger({ minLevel: 'error' })

      logger.trace('trace')
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })
  })

  // -------------------------------------------------------------------------
  // createLogger factory function
  // -------------------------------------------------------------------------
  describe('createLogger factory function', () => {
    it('should create a UnifiedLogger instance without options', () => {
      const logger = createLogger()

      expect(logger).toBeInstanceOf(UnifiedLogger)
      logger.debug('test')
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)
    })

    it('should create a UnifiedLogger instance with options', () => {
      const logger = createLogger({ minLevel: 'debug', prefix: 'Factory' })

      expect(logger).toBeInstanceOf(UnifiedLogger)
      logger.debug('test')
      expect(consoleDebugSpy.mock.calls[0][0].loggerContext).toBe('Factory')
    })

    it('should create independent logger instances', () => {
      const logger1 = createLogger({ minLevel: 'debug' })
      const logger2 = createLogger({ minLevel: 'error' })

      logger1.debug('test')
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1)

      logger2.debug('test')
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1) // still 1 — logger2 filtered it

      logger2.error('test')
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })
  })

  // -------------------------------------------------------------------------
  // child()
  // Step 12 test cases:
  //   - `child()` merges bindings into every log entry emitted by the child
  //   - `child()` bindings don't mutate parent
  // -------------------------------------------------------------------------
  describe('child()', () => {
    it('should return a new UnifiedLogger instance', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })

      const child = logger.child({ component: 'UserService' })

      expect(child).toBeInstanceOf(UnifiedLogger)
      expect(child).not.toBe(logger)
    })

    // Step 12 test case: `child()` merges bindings
    it('should merge bindings into every log entry emitted by the child', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })
      const child = logger.child({ requestId: 'req-abc' })

      child.info('handling request')

      const entry = consoleInfoSpy.mock.calls[0][0]
      expect(entry.requestId).toBe('req-abc')
      expect(entry.message).toBe('handling request')
    })

    it('should merge bindings into warn entries emitted by the child', () => {
      const logger = new UnifiedLogger({ minLevel: 'warn' })
      const child = logger.child({ requestId: 'req-abc' })

      child.warn('rate limited')

      expect(consoleWarnSpy.mock.calls[0][0].requestId).toBe('req-abc')
    })

    // Step 12 test case: `child()` bindings don't mutate parent
    it('should not mutate parent logger bindings', () => {
      const parent = new UnifiedLogger({ minLevel: 'info' })
      const _child = parent.child({ scope: 'child-scope' })

      parent.info('parent message')

      expect(consoleInfoSpy.mock.calls[0][0].scope).toBeUndefined()
    })

    it('parent entries must not contain any of the child bindings even after multiple child logs', () => {
      const parent = new UnifiedLogger({ minLevel: 'info' })
      const child = parent.child({ childOnly: 'secret' })

      child.info('child log')
      child.info('child log 2')
      parent.info('parent log')

      // The third call (index 2) belongs to the parent
      expect(consoleInfoSpy.mock.calls[2][0].childOnly).toBeUndefined()
    })

    it('should inherit parent minLevel', () => {
      const parent = new UnifiedLogger({ minLevel: 'warn' })
      const child = parent.child({ scope: 'child' })

      child.info('should be filtered')
      expect(consoleInfoSpy).not.toHaveBeenCalled()

      child.warn('should appear')
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    })

    it('should inherit parent prefix as loggerContext', () => {
      const parent = new UnifiedLogger({ prefix: 'ParentModule' })
      const child = parent.child({ requestId: 'r-1' })

      child.info('child log')

      const entry = consoleInfoSpy.mock.calls[0][0]
      expect(entry.loggerContext).toBe('ParentModule')
      expect(entry.requestId).toBe('r-1')
    })

    it('should merge grandchild bindings on top of child bindings', () => {
      const root = new UnifiedLogger({ minLevel: 'info' })
      const child = root.child({ layer: 'service' })
      const grandchild = child.child({ traceId: 'trace-xyz' })

      grandchild.info('deep log')

      const entry = consoleInfoSpy.mock.calls[0][0]
      expect(entry.layer).toBe('service')
      expect(entry.traceId).toBe('trace-xyz')
    })

    it('should merge per-call context on top of child bindings', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })
      const child = logger.child({ component: 'Auth' })

      child.info('login attempt', { userId: 'u-456' })

      const entry = consoleInfoSpy.mock.calls[0][0]
      expect(entry.component).toBe('Auth')
      expect(entry.userId).toBe('u-456')
    })

    it('should block prototype-pollution keys in child() bindings', () => {
      const logger = new UnifiedLogger({ minLevel: 'info' })
      const maliciousBindings = JSON.parse(
        '{"__proto__":{"polluted":true},"constructor":{"evil":1},"prototype":{"bad":2},"safe":"binding"}'
      ) as Record<string, unknown>
      const child = logger.child(maliciousBindings)

      child.info('test')

      const entry = consoleInfoSpy.mock.calls[0][0]
      // Safe binding is preserved
      expect(entry.safe).toBe('binding')
      // Prototype-pollution keys are not set as own properties
      expect(Object.prototype).not.toHaveProperty('polluted')
      expect(Object.hasOwn(entry, '__proto__')).toBe(false)
      expect(Object.hasOwn(entry, 'constructor')).toBe(false)
      expect(Object.hasOwn(entry, 'prototype')).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // production environment filtering (process.env.NODE_ENV)
  // Step 12 test cases:
  //   - Production filtering: info/debug/trace do not call console.*
  //   - warn and error log in production
  //
  // ENV is a static readonly field captured at class-load time, so each test
  // must reset the module registry and dynamically re-import the logger after
  // setting process.env.NODE_ENV = 'production'.
  // -------------------------------------------------------------------------
  describe('production environment filtering', () => {
    beforeEach(() => {
      ;(process.env as { NODE_ENV?: string }).NODE_ENV = 'production'
      vi.resetModules()
    })

    afterEach(() => {
      ;(process.env as { NODE_ENV?: string }).NODE_ENV = 'test'
      vi.resetModules()
    })

    // Step 12 test case: Production filtering — info/debug/trace suppressed
    it('should suppress trace messages in production', async () => {
      const { UnifiedLogger: PL } = await import('@/infrastructure/logging/logger.js')
      const logger = new PL({ minLevel: 'trace' })

      logger.trace('trace message')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
    })

    it('should suppress debug messages in production', async () => {
      const { UnifiedLogger: PL } = await import('@/infrastructure/logging/logger.js')
      const logger = new PL({ minLevel: 'debug' })

      logger.debug('debug message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should suppress info messages in production', async () => {
      const { UnifiedLogger: PL } = await import('@/infrastructure/logging/logger.js')
      const logger = new PL({ minLevel: 'info' })

      logger.info('info message')

      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    // Step 12 test case: warn and error log in production
    it('should allow warn messages in production', async () => {
      const { UnifiedLogger: PL } = await import('@/infrastructure/logging/logger.js')
      const logger = new PL({ minLevel: 'warn' })

      logger.warn('warn message')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleWarnSpy.mock.calls[0][0].level).toBe('warn')
    })

    it('should allow error messages in production', async () => {
      const { UnifiedLogger: PL } = await import('@/infrastructure/logging/logger.js')
      const logger = new PL({ minLevel: 'error' })

      logger.error('error message')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy.mock.calls[0][0].level).toBe('error')
    })

    it('should suppress trace, debug, info but allow warn and error in production', async () => {
      const { UnifiedLogger: PL } = await import('@/infrastructure/logging/logger.js')
      const logger = new PL({ minLevel: 'trace' })

      logger.trace('trace message')
      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')
      logger.error('error message')

      expect(consoleTraceSpy).not.toHaveBeenCalled()
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should still emit the full StructuredLogEntry shape for warn in production', async () => {
      const { UnifiedLogger: PL } = await import('@/infrastructure/logging/logger.js')
      const logger = new PL({ minLevel: 'warn', prefix: 'ProdModule' })

      logger.warn('production warning', { event: 'middleware.auth-token.failed' })

      const entry = consoleWarnSpy.mock.calls[0][0]
      expect(entry).toMatchObject({
        level: 'warn',
        message: 'production warning',
        service: 'norberts-spark-frontend',
        env: 'production',
        loggerContext: 'ProdModule',
        event: 'middleware.auth-token.failed',
      })
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should still emit the full StructuredLogEntry shape for error in production', async () => {
      const { UnifiedLogger: PL } = await import('@/infrastructure/logging/logger.js')
      const logger = new PL({ minLevel: 'error', prefix: 'BackendRequest' })

      logger.error('backend failed', new Error('502'), {
        event: 'server-action.backend-request.failed',
        statusCode: 502,
        endpoint: '/api/v1/ai/chats',
      })

      const entry = consoleErrorSpy.mock.calls[0][0]
      expect(entry).toMatchObject({
        level: 'error',
        message: 'backend failed',
        service: 'norberts-spark-frontend',
        env: 'production',
        loggerContext: 'BackendRequest',
        event: 'server-action.backend-request.failed',
        statusCode: 502,
        endpoint: '/api/v1/ai/chats',
      })
      expect(entry.err).toMatchObject({ name: 'Error' })
      // Stack must be omitted in production
      expect(entry.err?.stack).toBeUndefined()
    })
  })
})
