import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/extract-data/[fileKey]/route.js'

// ReadableStream and TextEncoder are Node.js globals in tests

// Mock the auth helper
vi.mock('@/lib/auth.js', () => ({
  getAuthToken: vi.fn(),
}))

// Mock the logger
vi.mock('@/infrastructure/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

// Import after mock
const { getAuthToken } = await import('@/lib/auth/auth.js')

describe('GET /api/extract-data/[fileKey]', () => {
  const mockAccessToken = 'mock-jwt-token'
  const mockFileKey = 'data-extraction/test-uuid/test-file.pdf'
  const mockBackendUrl = 'https://127.0.0.1:3001'

  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn()
    process.env.BACKEND_URL = mockBackendUrl
    // Mock successful authentication by default
    ;(getAuthToken as ReturnType<typeof vi.fn>).mockResolvedValue(mockAccessToken)
  })

  describe('Successful NDJSON Streaming', () => {
    it('should successfully proxy streaming response from backend', async () => {
      const mockNDJSONData = JSON.stringify({
        fileName: 'test.pdf',
        data: '{"invoiceNumber":"INV-001"}',
        success: true,
      })

      const mockResponseBody = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(mockNDJSONData + '\n'))
          controller.close()
        },
      })

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockResponseBody,
      })

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(mockFileKey)}`,
        {
          method: 'GET',
        }
      )

      const response = await GET(request, { params: Promise.resolve({ fileKey: mockFileKey }) })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/x-ndjson; charset=utf-8')
      expect(response.headers.get('Cache-Control')).toBe('no-cache')
      expect(response.headers.get('Connection')).toBe('keep-alive')
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBackendUrl}/api/v1/ai/extract-data/${encodeURIComponent(mockFileKey)}`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        })
      )
    })

    it('should stream response body directly to client', async () => {
      const mockNDJSONLines = [
        JSON.stringify({ fileName: 'invoice1.pdf', data: '{"total":100}', success: true }),
        JSON.stringify({ fileName: 'invoice2.pdf', data: '{"total":200}', success: true }),
      ]

      const mockResponseBody = new ReadableStream({
        start(controller) {
          mockNDJSONLines.forEach((line) => {
            controller.enqueue(new TextEncoder().encode(line + '\n'))
          })
          controller.close()
        },
      })

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockResponseBody,
      })

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(mockFileKey)}`,
        {
          method: 'GET',
        }
      )

      const response = await GET(request, { params: Promise.resolve({ fileKey: mockFileKey }) })

      expect(response.body).toBe(mockResponseBody)
      expect(response.status).toBe(200)
    })

    it('should handle URL encoding of fileKey with special characters', async () => {
      const specialFileKey = 'data-extraction/test-uuid/file with spaces & special chars.pdf'
      const mockResponseBody = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockResponseBody,
      })

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(specialFileKey)}`,
        {
          method: 'GET',
        }
      )

      await GET(request, { params: Promise.resolve({ fileKey: specialFileKey }) })

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBackendUrl}/api/v1/ai/extract-data/${encodeURIComponent(specialFileKey)}`,
        expect.any(Object)
      )
    })
  })

  describe('Authentication', () => {
    it('should require authentication token', async () => {
      // Mock no token (unauthenticated)
      ;(getAuthToken as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(mockFileKey)}`,
        {
          method: 'GET',
        }
      )

      const response = await GET(request, { params: Promise.resolve({ fileKey: mockFileKey }) })
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result).toEqual({
        error: 'No authentication token',
      })
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should pass authentication token to backend', async () => {
      const customToken = 'custom-jwt-token-123'
      ;(getAuthToken as ReturnType<typeof vi.fn>).mockResolvedValueOnce(customToken)

      const mockResponseBody = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockResponseBody,
      })

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(mockFileKey)}`,
        {
          method: 'GET',
        }
      )

      await GET(request, { params: Promise.resolve({ fileKey: mockFileKey }) })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${customToken}`,
          },
        })
      )
    })
  })

  describe('Backend Error Handling', () => {
    it('should return error when backend returns 404', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(mockFileKey)}`,
        {
          method: 'GET',
        }
      )

      const response = await GET(request, { params: Promise.resolve({ fileKey: mockFileKey }) })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result).toEqual({
        error: 'Backend error: 404',
      })
    })

    it('should return error when backend returns 500', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(mockFileKey)}`,
        {
          method: 'GET',
        }
      )

      const response = await GET(request, { params: Promise.resolve({ fileKey: mockFileKey }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result).toEqual({
        error: 'Backend error: 500',
      })
    })

    it('should handle backend network errors', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(mockFileKey)}`,
        {
          method: 'GET',
        }
      )

      const response = await GET(request, { params: Promise.resolve({ fileKey: mockFileKey }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result).toEqual({
        error: 'Internal server error',
      })
    })

    it('should handle timeout errors', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Request timeout')
      )

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(mockFileKey)}`,
        {
          method: 'GET',
        }
      )

      const response = await GET(request, { params: Promise.resolve({ fileKey: mockFileKey }) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result).toEqual({
        error: 'Internal server error',
      })
    })
  })

  describe('Environment Configuration', () => {
    it('should use BACKEND_URL environment variable', async () => {
      const customBackendUrl = 'https://custom-backend.example.com:8080'
      process.env.BACKEND_URL = customBackendUrl

      const mockResponseBody = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockResponseBody,
      })

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(mockFileKey)}`,
        {
          method: 'GET',
        }
      )

      await GET(request, { params: Promise.resolve({ fileKey: mockFileKey }) })

      expect(global.fetch).toHaveBeenCalledWith(
        `${customBackendUrl}/api/v1/ai/extract-data/${encodeURIComponent(mockFileKey)}`,
        expect.any(Object)
      )
    })

    it('should use default BACKEND_URL when environment variable is not set', async () => {
      delete process.env.BACKEND_URL

      const mockResponseBody = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockResponseBody,
      })

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(mockFileKey)}`,
        {
          method: 'GET',
        }
      )

      await GET(request, { params: Promise.resolve({ fileKey: mockFileKey }) })

      expect(global.fetch).toHaveBeenCalledWith(
        `https://127.0.0.1:3001/api/v1/ai/extract-data/${encodeURIComponent(mockFileKey)}`,
        expect.any(Object)
      )
    })
  })

  describe('Response Headers', () => {
    it('should set correct content type for NDJSON', async () => {
      const mockResponseBody = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockResponseBody,
      })

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(mockFileKey)}`,
        {
          method: 'GET',
        }
      )

      const response = await GET(request, { params: Promise.resolve({ fileKey: mockFileKey }) })

      expect(response.headers.get('Content-Type')).toBe('application/x-ndjson; charset=utf-8')
    })

    it('should set cache control headers for streaming', async () => {
      const mockResponseBody = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockResponseBody,
      })

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(mockFileKey)}`,
        {
          method: 'GET',
        }
      )

      const response = await GET(request, { params: Promise.resolve({ fileKey: mockFileKey }) })

      expect(response.headers.get('Cache-Control')).toBe('no-cache')
      expect(response.headers.get('Connection')).toBe('keep-alive')
    })

    it('should set JSON content type for error responses', async () => {
      ;(getAuthToken as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(mockFileKey)}`,
        {
          method: 'GET',
        }
      )

      const response = await GET(request, { params: Promise.resolve({ fileKey: mockFileKey }) })

      expect(response.headers.get('Content-Type')).toBe('application/json')
    })
  })

  describe('FileKey Parameter Handling', () => {
    it('should handle ZIP file extraction', async () => {
      const zipFileKey = 'data-extraction/test-uuid/archive.zip'
      const mockResponseBody = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockResponseBody,
      })

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(zipFileKey)}`,
        {
          method: 'GET',
        }
      )

      const response = await GET(request, { params: Promise.resolve({ fileKey: zipFileKey }) })

      expect(response.status).toBe(200)
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBackendUrl}/api/v1/ai/extract-data/${encodeURIComponent(zipFileKey)}`,
        expect.any(Object)
      )
    })

    it('should handle PDF file extraction', async () => {
      const pdfFileKey = 'data-extraction/test-uuid/invoice.pdf'
      const mockResponseBody = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockResponseBody,
      })

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(pdfFileKey)}`,
        {
          method: 'GET',
        }
      )

      const response = await GET(request, { params: Promise.resolve({ fileKey: pdfFileKey }) })

      expect(response.status).toBe(200)
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBackendUrl}/api/v1/ai/extract-data/${encodeURIComponent(pdfFileKey)}`,
        expect.any(Object)
      )
    })

    it('should handle nested directory paths in fileKey', async () => {
      const nestedFileKey = 'data-extraction/uuid-123/nested/path/file.pdf'
      const mockResponseBody = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockResponseBody,
      })

      const request = new Request(
        `https://localhost:4321/api/extract-data/${encodeURIComponent(nestedFileKey)}`,
        {
          method: 'GET',
        }
      )

      const response = await GET(request, { params: Promise.resolve({ fileKey: nestedFileKey }) })

      expect(response.status).toBe(200)
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBackendUrl}/api/v1/ai/extract-data/${encodeURIComponent(nestedFileKey)}`,
        expect.any(Object)
      )
    })
  })
})
