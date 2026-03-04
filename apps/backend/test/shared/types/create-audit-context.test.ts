import { describe, expect, it } from 'vitest'

import { type UserIdType } from '../../../src/domain/value-objects/userID.js'
import { EnvConfig } from '../../../src/infrastructure/config/env.config.js'
import {
  createAuditContext,
  type CreateAuditContextInput,
} from '../../../src/shared/types/index.js'

const baseInput: CreateAuditContextInput = {
  userId: null,
  ipAddress: '192.168.1.xxx',
  userAgent: 'test-agent',
  requestId: null,
  method: 'GET',
  route: '/api/v1/ai/chats/:userId',
  statusCode: 200,
}

describe('createAuditContext', () => {
  describe('default service fallback', () => {
    it('should use "norberts-spark-backend" as default service when not provided', () => {
      const result = createAuditContext(baseInput)

      expect(result.service).toBe('norberts-spark-backend')
    })

    it('should use the provided service when specified', () => {
      const result = createAuditContext({ ...baseInput, service: 'my-custom-service' })

      expect(result.service).toBe('my-custom-service')
    })
  })

  describe('EnvConfig-derived fields', () => {
    it('should populate env from EnvConfig.NODE_ENV', () => {
      const result = createAuditContext(baseInput)

      expect(result.env).toBe(EnvConfig.NODE_ENV)
    })

    it('should populate version from EnvConfig.API_VERSION', () => {
      const result = createAuditContext(baseInput)

      expect(result.version).toBe(EnvConfig.API_VERSION)
    })

    it('should populate level from EnvConfig.LOG_LEVEL', () => {
      const result = createAuditContext(baseInput)

      expect(result.level).toBe(EnvConfig.LOG_LEVEL)
    })

    it('should set time to a Date instance representing the current time', () => {
      const before = new Date()
      const result = createAuditContext(baseInput)
      const after = new Date()

      expect(result.time).toBeInstanceOf(Date)
      expect(result.time.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(result.time.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('caller-supplied fields are preserved', () => {
    it('should preserve userId from input', () => {
      const userId = '019500ab-cdef-7000-8000-000000000001' as UserIdType
      const result = createAuditContext({ ...baseInput, userId })

      expect(result.userId).toBe(userId)
    })

    it('should preserve ipAddress from input', () => {
      const result = createAuditContext({ ...baseInput, ipAddress: '10.0.0.xxx' })

      expect(result.ipAddress).toBe('10.0.0.xxx')
    })

    it('should preserve userAgent from input', () => {
      const result = createAuditContext({ ...baseInput, userAgent: 'Mozilla/5.0' })

      expect(result.userAgent).toBe('Mozilla/5.0')
    })

    it('should preserve method from input', () => {
      const result = createAuditContext({ ...baseInput, method: 'POST' })

      expect(result.method).toBe('POST')
    })

    it('should preserve route from input', () => {
      const result = createAuditContext({ ...baseInput, route: '/api/v1/users/:id' })

      expect(result.route).toBe('/api/v1/users/:id')
    })

    it('should preserve statusCode from input', () => {
      const result = createAuditContext({ ...baseInput, statusCode: 404 })

      expect(result.statusCode).toBe(404)
    })

    it('should preserve optional event from input', () => {
      const result = createAuditContext({ ...baseInput, event: 'http.request.completed' })

      expect(result.event).toBe('http.request.completed')
    })

    it('should preserve optional durationMs from input', () => {
      const result = createAuditContext({ ...baseInput, durationMs: 37 })

      expect(result.durationMs).toBe(37)
    })

    it('should preserve optional additionalInfo from input', () => {
      const additionalInfo = { foo: 'bar', count: 42 }
      const result = createAuditContext({ ...baseInput, additionalInfo })

      expect(result.additionalInfo).toEqual(additionalInfo)
    })
  })
})
