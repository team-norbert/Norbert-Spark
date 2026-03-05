import { Writable } from 'node:stream'

import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { EnvConfig } from '../../../src/infrastructure/config/env.config.js'
import { createFastifyApp } from '../../../src/infrastructure/http/fastify.config.js'
import { InternalErrorException } from '../../../src/shared/exceptions/internal-error.exception.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('Fastify request identity and timing', () => {
  let app: FastifyInstance
  let capturedRequestId: string | undefined
  let capturedDurationMs: number | undefined

  beforeAll(async () => {
    app = createFastifyApp()

    app.addHook('onResponse', (request, _reply, done) => {
      capturedRequestId = request.id as string
      capturedDurationMs = request.durationMs
      done()
    })

    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    capturedRequestId = undefined
    capturedDurationMs = undefined
  })

  it('should assign a non-empty UUIDv7 to request.id for every request', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(capturedRequestId).toBeDefined()
    expect(capturedRequestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it('should assign a unique request.id per request', async () => {
    await app.inject({ method: 'GET', url: '/health' })
    const firstId = capturedRequestId

    await app.inject({ method: 'GET', url: '/health' })
    const secondId = capturedRequestId

    expect(firstId).not.toBe(secondId)
  })

  it('should set a non-negative durationMs by the time onResponse fires', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(capturedDurationMs).toBeDefined()
    expect(capturedDurationMs).toBeGreaterThanOrEqual(0)
  })
})

describe('Fastify logger base fields', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = createFastifyApp()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should bind service, env, and version to every log record via the logger base config', () => {
    const bindings = app.log.bindings()

    expect(bindings['service']).toBe(EnvConfig.SERVICE_NAME)
    expect(bindings['env']).toBe(EnvConfig.NODE_ENV)
    expect(bindings['version']).toBe(EnvConfig.APP_VERSION)
  })
})

describe('Fastify lifecycle hook logging', () => {
  let app: FastifyInstance
  const logLines: string[] = []

  beforeAll(async () => {
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        logLines.push(chunk.toString().trim())
        callback()
      },
    })

    app = createFastifyApp({ logger: { stream, level: 'info' } })

    app.get('/test-2xx', async () => ({ ok: true }))
    app.get('/test-4xx', async () => {
      throw new ValidationException('bad input')
    })
    app.get('/test-5xx', async () => {
      throw new InternalErrorException('server boom')
    })

    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    logLines.length = 0
  })

  function parseEvents(): Record<string, unknown>[] {
    return logLines.flatMap((line) => {
      try {
        const parsed = JSON.parse(line) as Record<string, unknown>
        return parsed.event ? [parsed] : []
      } catch {
        return []
      }
    })
  }

  it('should log http.request.completed (not http.request.error) for 2xx responses', async () => {
    await app.inject({ method: 'GET', url: '/test-2xx' })
    const events = parseEvents()

    expect(events.filter((e) => e.event === 'http.request.completed')).toHaveLength(1)
    expect(events.filter((e) => e.event === 'http.request.error')).toHaveLength(0)
  })

  it('should log http.request.completed (not http.request.error) for 4xx client errors', async () => {
    await app.inject({ method: 'GET', url: '/test-4xx' })
    const events = parseEvents()

    expect(events.filter((e) => e.event === 'http.request.completed')).toHaveLength(1)
    expect(events.filter((e) => e.event === 'http.request.error')).toHaveLength(0)
  })

  it('should log http.request.error (not http.request.completed) for 5xx server errors', async () => {
    await app.inject({ method: 'GET', url: '/test-5xx' })
    const events = parseEvents()

    expect(events.filter((e) => e.event === 'http.request.error')).toHaveLength(1)
    expect(events.filter((e) => e.event === 'http.request.completed')).toHaveLength(0)
  })
})
