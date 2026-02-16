import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('extractDataByFileIdAction', () => {
  let mockGetAuthToken: ReturnType<typeof vi.fn>
  let mockLoggerWarn: ReturnType<typeof vi.fn>
  let mockLoggerError: ReturnType<typeof vi.fn>
  let mockLoggerInfo: ReturnType<typeof vi.fn>
  let mockFetch: ReturnType<typeof vi.fn>

  const TEST_TOKEN = 'test-jwt-token'
  const TEST_FILE_KEY = 'data-extraction/test-uuid/document.pdf'

  beforeEach(() => {
    // Reset modules to ensure fresh imports
    vi.resetModules()

    // Mock auth token getter
    mockGetAuthToken = vi.fn()
    vi.doMock('@/lib/auth/auth.js', () => ({
      getAuthToken: mockGetAuthToken,
    }))

    // Mock logger
    mockLoggerWarn = vi.fn()
    mockLoggerError = vi.fn()
    mockLoggerInfo = vi.fn()
    vi.doMock('@/infrastructure/logging/logger.js', () => ({
      createLogger: vi.fn(() => ({
        warn: mockLoggerWarn,
        error: mockLoggerError,
        info: mockLoggerInfo,
        debug: vi.fn(),
      })),
    }))

    // Mock global fetch
    mockFetch = vi.fn()
    global.fetch = mockFetch as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication', () => {
    it('should return error when no auth token is available', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      const result = await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(result).toEqual({
        success: false,
        error: 'No authentication token',
      })
      expect(mockGetAuthToken).toHaveBeenCalledOnce()
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'No auth token available in extractDataByFileIdAction'
      )
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should include Bearer token in Authorization header', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const mockReader = {
        read: vi.fn().mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ai/extract-data/'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            Authorization: `Bearer ${TEST_TOKEN}`,
          },
        })
      )
    })
  })

  describe('URL Construction', () => {
    it('should use BACKEND_URL environment variable if set', async () => {
      const customBackendUrl = 'https://api.example.com'
      process.env.BACKEND_URL = customBackendUrl

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const mockReader = {
        read: vi.fn().mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(mockFetch).toHaveBeenCalledWith(
        `${customBackendUrl}/api/v1/ai/extract-data/${encodeURIComponent(TEST_FILE_KEY)}`,
        expect.any(Object)
      )

      delete process.env.BACKEND_URL
    })

    it('should use default BACKEND_URL when environment variable is not set', async () => {
      delete process.env.BACKEND_URL

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const mockReader = {
        read: vi.fn().mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(mockFetch).toHaveBeenCalledWith(
        `https://127.0.0.1:3001/api/v1/ai/extract-data/${encodeURIComponent(TEST_FILE_KEY)}`,
        expect.any(Object)
      )
    })

    it('should properly encode fileKey in URL', async () => {
      const fileKeyWithSpecialChars = 'data-extraction/test folder/file name.pdf'
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const mockReader = {
        read: vi.fn().mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      await extractDataByFileIdAction(fileKeyWithSpecialChars)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(fileKeyWithSpecialChars)),
        expect.any(Object)
      )
    })
  })

  describe('Session Expiration', () => {
    it('should return sessionExpired flag when backend returns 401', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      const result = await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(result).toEqual({
        success: false,
        error: 'Session expired. Please sign in again.',
        sessionExpired: true,
      })
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'JWT expired or unauthorized in extractDataByFileIdAction'
      )
    })
  })

  describe('Error Handling', () => {
    it('should return error when backend returns non-ok status', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      const result = await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should return error when response body is null', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: null,
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      const result = await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Response body is null')
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle fetch errors gracefully', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      mockFetch.mockRejectedValue(new Error('Network error'))

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      const result = await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
      expect(mockLoggerError).toHaveBeenCalledWith(
        'extractDataByFileIdAction error',
        expect.objectContaining({
          fileKey: TEST_FILE_KEY,
        })
      )
    })
  })

  describe('NDJSON Stream Processing', () => {
    it('should parse single NDJSON line correctly', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const ndJsonLine = JSON.stringify({
        fileName: 'invoice.pdf',
        success: true,
        data: JSON.stringify({
          total: 100.0,
          currency: 'USD',
          invoiceNumber: 'INV-001',
          companyAddress: '123 Test St',
          companyName: 'Test Company',
          invoiceeAddress: '456 Customer Ave',
        }),
      })

      const encoder = new TextEncoder()
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode(ndJsonLine + '\n') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      const result = await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(result.success).toBe(true)
      expect(result.allResults).toHaveLength(1)
      expect(result.data).toEqual({
        total: 100.0,
        currency: 'USD',
        invoiceNumber: 'INV-001',
        companyAddress: '123 Test St',
        companyName: 'Test Company',
        invoiceeAddress: '456 Customer Ave',
      })
    })

    it('should parse multiple NDJSON lines correctly', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const ndJsonLine1 = JSON.stringify({
        fileName: 'invoice1.pdf',
        success: true,
        data: JSON.stringify({
          total: 100.0,
          currency: 'USD',
          invoiceNumber: 'INV-001',
          companyAddress: '123 Test St',
          companyName: 'Company A',
          invoiceeAddress: '456 Customer Ave',
        }),
      })

      const ndJsonLine2 = JSON.stringify({
        fileName: 'invoice2.pdf',
        success: true,
        data: JSON.stringify({
          total: 200.0,
          currency: 'EUR',
          invoiceNumber: 'INV-002',
          companyAddress: '789 Test Rd',
          companyName: 'Company B',
          invoiceeAddress: '321 Client Blvd',
        }),
      })

      const encoder = new TextEncoder()
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode(ndJsonLine1 + '\n') })
          .mockResolvedValueOnce({ done: false, value: encoder.encode(ndJsonLine2 + '\n') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      const result = await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(result.success).toBe(true)
      expect(result.allResults).toHaveLength(2)
      expect(result.allResults?.[0]?.invoiceNumber).toBe('INV-001')
      expect(result.allResults?.[1]?.invoiceNumber).toBe('INV-002')
      expect(result.data?.invoiceNumber).toBe('INV-002') // Last result
    })

    it('should handle chunked data split across multiple reads', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const ndJsonLine = JSON.stringify({
        fileName: 'invoice.pdf',
        success: true,
        data: JSON.stringify({
          total: 100.0,
          currency: 'USD',
          invoiceNumber: 'INV-001',
          companyAddress: '123 Test St',
          companyName: 'Test Company',
          invoiceeAddress: '456 Customer Ave',
        }),
      })

      const halfPoint = Math.floor(ndJsonLine.length / 2)
      const chunk1 = ndJsonLine.substring(0, halfPoint)
      const chunk2 = ndJsonLine.substring(halfPoint) + '\n'

      const encoder = new TextEncoder()
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode(chunk1) })
          .mockResolvedValueOnce({ done: false, value: encoder.encode(chunk2) })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      const result = await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(result.success).toBe(true)
      expect(result.allResults).toHaveLength(1)
      expect(result.data?.invoiceNumber).toBe('INV-001')
    })

    it('should skip empty lines in NDJSON stream', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const ndJsonLine = JSON.stringify({
        fileName: 'invoice.pdf',
        success: true,
        data: JSON.stringify({
          total: 100.0,
          currency: 'USD',
          invoiceNumber: 'INV-001',
          companyAddress: '123 Test St',
          companyName: 'Test Company',
          invoiceeAddress: '456 Customer Ave',
        }),
      })

      const content = '\n\n' + ndJsonLine + '\n\n\n'

      const encoder = new TextEncoder()
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode(content) })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      const result = await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(result.success).toBe(true)
      expect(result.allResults).toHaveLength(1)
    })

    it('should handle unsuccessful NDJSON entries gracefully', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const successLine = JSON.stringify({
        fileName: 'invoice1.pdf',
        success: true,
        data: JSON.stringify({
          total: 100.0,
          currency: 'USD',
          invoiceNumber: 'INV-001',
          companyAddress: '123 Test St',
          companyName: 'Test Company',
          invoiceeAddress: '456 Customer Ave',
        }),
      })

      const failureLine = JSON.stringify({
        fileName: 'invoice2.pdf',
        success: false,
        error: 'Failed to extract data',
      })

      const encoder = new TextEncoder()
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode(successLine + '\n') })
          .mockResolvedValueOnce({ done: false, value: encoder.encode(failureLine + '\n') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      const result = await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(result.success).toBe(true)
      expect(result.allResults).toHaveLength(1) // Only successful entry
      expect(result.data?.invoiceNumber).toBe('INV-001')
    })

    it('should handle malformed JSON lines gracefully', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const validLine = JSON.stringify({
        fileName: 'invoice.pdf',
        success: true,
        data: JSON.stringify({
          total: 100.0,
          currency: 'USD',
          invoiceNumber: 'INV-001',
          companyAddress: '123 Test St',
          companyName: 'Test Company',
          invoiceeAddress: '456 Customer Ave',
        }),
      })

      const invalidLine = '{ invalid json'

      const encoder = new TextEncoder()
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode(invalidLine + '\n') })
          .mockResolvedValueOnce({ done: false, value: encoder.encode(validLine + '\n') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      const result = await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(result.success).toBe(true)
      expect(result.allResults).toHaveLength(1)
      expect(result.data?.invoiceNumber).toBe('INV-001')
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Failed to parse NDJSON line',
        expect.objectContaining({ line: invalidLine })
      )
    })

    it('should process remaining buffer data after stream ends', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const ndJsonLine = JSON.stringify({
        fileName: 'invoice.pdf',
        success: true,
        data: JSON.stringify({
          total: 100.0,
          currency: 'USD',
          invoiceNumber: 'INV-001',
          companyAddress: '123 Test St',
          companyName: 'Test Company',
          invoiceeAddress: '456 Customer Ave',
        }),
      })

      // No trailing newline - should still be processed
      const encoder = new TextEncoder()
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode(ndJsonLine) })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      const result = await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(result.success).toBe(true)
      expect(result.allResults).toHaveLength(1)
      expect(result.data?.invoiceNumber).toBe('INV-001')
    })
  })

  describe('Logging', () => {
    it('should log request details', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const mockReader = {
        read: vi.fn().mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(mockLoggerInfo).toHaveBeenCalledWith('Calling extract data endpoint', {
        fileKey: TEST_FILE_KEY,
      })
    })

    it('should log response with result count', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const ndJsonLine1 = JSON.stringify({
        fileName: 'invoice1.pdf',
        success: true,
        data: JSON.stringify({
          total: 100.0,
          currency: 'USD',
          invoiceNumber: 'INV-001',
          companyAddress: '123 Test St',
          companyName: 'Company A',
          invoiceeAddress: '456 Customer Ave',
        }),
      })

      const ndJsonLine2 = JSON.stringify({
        fileName: 'invoice2.pdf',
        success: true,
        data: JSON.stringify({
          total: 200.0,
          currency: 'EUR',
          invoiceNumber: 'INV-002',
          companyAddress: '789 Test Rd',
          companyName: 'Company B',
          invoiceeAddress: '321 Client Blvd',
        }),
      })

      const encoder = new TextEncoder()
      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({ done: false, value: encoder.encode(ndJsonLine1 + '\n') })
          .mockResolvedValueOnce({ done: false, value: encoder.encode(ndJsonLine2 + '\n') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(mockLoggerInfo).toHaveBeenCalledWith('Response from extract data', { count: 2 })
    })
  })

  describe('Resource Cleanup', () => {
    it('should release reader lock after successful processing', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const mockReader = {
        read: vi.fn().mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(mockReader.releaseLock).toHaveBeenCalledOnce()
    })

    it('should release reader lock even when processing throws error', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const mockReader = {
        read: vi.fn().mockRejectedValueOnce(new Error('Read error')),
        releaseLock: vi.fn(),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader,
        },
      })

      const { extractDataByFileIdAction } =
        await import('@/infrastructure/serverActions/extractDataByFileId.server.js')

      await extractDataByFileIdAction(TEST_FILE_KEY)

      expect(mockReader.releaseLock).toHaveBeenCalledOnce()
    })
  })
})
