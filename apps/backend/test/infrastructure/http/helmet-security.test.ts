import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createFastifyApp } from '../../../src/infrastructure/http/fastify.config.js'

describe('Helmet Security Headers', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = createFastifyApp()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Security headers on /health endpoint', () => {
    it('should set X-Content-Type-Options header to nosniff', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['x-content-type-options']).toBe('nosniff')
    })

    it('should set X-Frame-Options header to SAMEORIGIN', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN')
    })

    it('should set X-DNS-Prefetch-Control header to off', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['x-dns-prefetch-control']).toBe('off')
    })

    it('should set X-Download-Options header to noopen', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['x-download-options']).toBe('noopen')
    })

    it('should set X-Permitted-Cross-Domain-Policies header to none', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['x-permitted-cross-domain-policies']).toBe('none')
    })

    it('should set Referrer-Policy header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['referrer-policy']).toBe('no-referrer')
    })

    it('should set X-XSS-Protection header to 0', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      // Helmet sets this to 0 as modern browsers have built-in XSS protection
      expect(response.headers['x-xss-protection']).toBe('0')
    })

    it('should set Strict-Transport-Security header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      // HSTS header with max-age
      expect(response.headers['strict-transport-security']).toMatch(/max-age=\d+/)
    })

    it('should set Origin-Agent-Cluster header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['origin-agent-cluster']).toBe('?1')
    })

    it('should not set Content-Security-Policy header (disabled in config)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      // CSP is explicitly disabled in fastify.config.ts
      expect(response.headers['content-security-policy']).toBeUndefined()
    })
  })

  describe('Security headers applied globally', () => {
    it('should apply security headers to all routes', async () => {
      // Test /docs endpoint as well to ensure global: true is working
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
      })

      // Should have security headers regardless of route
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN')
      expect(response.headers['x-dns-prefetch-control']).toBe('off')
    })
  })

  describe('All security headers are present', () => {
    it('should have all expected security headers in a single response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)

      // Verify all security headers are present
      const expectedHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-dns-prefetch-control',
        'x-download-options',
        'x-permitted-cross-domain-policies',
        'referrer-policy',
        'x-xss-protection',
        'strict-transport-security',
        'origin-agent-cluster',
      ]

      for (const header of expectedHeaders) {
        expect(
          Object.hasOwn(response.headers, header),
          `Expected header '${header}' to be present`
        ).toBe(true)
      }

      // CSP should NOT be present (explicitly disabled)
      expect(response.headers['content-security-policy']).toBeUndefined()
    })
  })
})
