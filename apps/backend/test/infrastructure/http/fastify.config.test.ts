import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createFastifyApp } from '../../../src/infrastructure/http/fastify.config.js'

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
