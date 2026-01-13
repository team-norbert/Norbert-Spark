import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  FileMetadata,
  PresignedUrlsResponse,
} from '@/infrastructure/serverActions/getPresignedUrls.server.js'

describe('getPresignedUrls', () => {
  let mockGetAuthToken: ReturnType<typeof vi.fn>
  let mockBackendRequest: ReturnType<typeof vi.fn>
  let mockLoggerWarn: ReturnType<typeof vi.fn>
  let mockLoggerError: ReturnType<typeof vi.fn>
  let mockLoggerInfo: ReturnType<typeof vi.fn>

  const TEST_TOKEN = 'test-jwt-token'

  beforeEach(() => {
    // Reset modules to ensure fresh imports
    vi.resetModules()

    // Mock auth token getter
    mockGetAuthToken = vi.fn()
    vi.doMock('@/lib/auth.js', () => ({
      getAuthToken: mockGetAuthToken,
    }))

    // Mock backend request
    mockBackendRequest = vi.fn()
    vi.doMock('@/infrastructure/serverActions/baseServerAction.js', () => ({
      backendRequest: mockBackendRequest,
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
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('successful requests', () => {
    it('should return presigned URLs when authentication is successful', async () => {
      const files: FileMetadata[] = [
        { filename: 'document.pdf', mimetype: 'application/pdf' },
        { filename: 'archive.zip', mimetype: 'application/zip' },
      ]

      const mockResponse: PresignedUrlsResponse = {
        success: true,
        data: {
          uploadUrls: [
            {
              filename: 'document.pdf',
              uploadUrl: 'https://r2.example.com/presigned-url-1',
              fileKey: 'data-extraction/uuid-1/document.pdf',
            },
            {
              filename: 'archive.zip',
              uploadUrl: 'https://r2.example.com/presigned-url-2',
              fileKey: 'data-extraction/uuid-2/archive.zip',
            },
          ],
        },
        message: 'Presigned URLs generated successfully',
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const result = await getPresignedUrls(files)

      expect(result).toEqual(mockResponse)
      expect(mockGetAuthToken).toHaveBeenCalledOnce()
      expect(mockBackendRequest).toHaveBeenCalledWith({
        method: 'POST',
        endpoint: '/ai/extract-data/presigned-urls',
        body: { files },
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        timeoutMs: 30000,
      })
      expect(mockLoggerInfo).toHaveBeenCalledWith('Requesting presigned URLs', {
        fileCount: 2,
        files: files.map((f) => ({ filename: f.filename, mimetype: f.mimetype })),
      })
      expect(mockLoggerWarn).not.toHaveBeenCalled()
      expect(mockLoggerError).not.toHaveBeenCalled()
    })

    it('should handle single file upload request', async () => {
      const files: FileMetadata[] = [{ filename: 'single.pdf', mimetype: 'application/pdf' }]

      const mockResponse: PresignedUrlsResponse = {
        success: true,
        data: {
          uploadUrls: [
            {
              filename: 'single.pdf',
              uploadUrl: 'https://r2.example.com/presigned-url',
              fileKey: 'data-extraction/uuid/single.pdf',
            },
          ],
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const result = await getPresignedUrls(files)

      expect(result.success).toBe(true)
      expect(result.data?.uploadUrls).toHaveLength(1)
      expect(result.data?.uploadUrls?.[0]?.filename).toBe('single.pdf')
    })

    it('should log received presigned URLs count', async () => {
      const files: FileMetadata[] = [
        { filename: 'file1.pdf', mimetype: 'application/pdf' },
        { filename: 'file2.pdf', mimetype: 'application/pdf' },
        { filename: 'file3.pdf', mimetype: 'application/pdf' },
      ]

      const mockResponse: PresignedUrlsResponse = {
        success: true,
        data: {
          uploadUrls: [
            {
              filename: 'file1.pdf',
              uploadUrl: 'https://r2.example.com/url1',
              fileKey: 'key1',
            },
            {
              filename: 'file2.pdf',
              uploadUrl: 'https://r2.example.com/url2',
              fileKey: 'key2',
            },
            {
              filename: 'file3.pdf',
              uploadUrl: 'https://r2.example.com/url3',
              fileKey: 'key3',
            },
          ],
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      await getPresignedUrls(files)

      expect(mockLoggerInfo).toHaveBeenCalledWith('Presigned URLs received', {
        success: true,
        urlCount: 3,
      })
    })

    it('should handle different file types correctly', async () => {
      const files: FileMetadata[] = [
        { filename: 'document.pdf', mimetype: 'application/pdf' },
        { filename: 'archive.zip', mimetype: 'application/zip' },
        { filename: 'compressed.zip', mimetype: 'application/x-zip-compressed' },
      ]

      const mockResponse: PresignedUrlsResponse = {
        success: true,
        data: {
          uploadUrls: files.map((f, i) => ({
            filename: f.filename,
            uploadUrl: `https://r2.example.com/url-${i}`,
            fileKey: `key-${i}`,
          })),
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const result = await getPresignedUrls(files)

      expect(result.success).toBe(true)
      expect(result.data?.uploadUrls).toHaveLength(3)
    })
  })

  describe('authentication errors', () => {
    it('should return error when no access token is available', async () => {
      mockGetAuthToken.mockResolvedValue(null)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files: FileMetadata[] = [{ filename: 'test.pdf', mimetype: 'application/pdf' }]
      const result = await getPresignedUrls(files)

      expect(result).toEqual({
        success: false,
        error: 'Authentication required',
      })
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'No access token available for presigned URL request'
      )
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should return error when access token is undefined', async () => {
      mockGetAuthToken.mockResolvedValue(undefined)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files: FileMetadata[] = [{ filename: 'test.pdf', mimetype: 'application/pdf' }]
      const result = await getPresignedUrls(files)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
    })

    it('should return error when access token is empty string', async () => {
      mockGetAuthToken.mockResolvedValue('')

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files: FileMetadata[] = [{ filename: 'test.pdf', mimetype: 'application/pdf' }]
      const result = await getPresignedUrls(files)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
    })
  })

  describe('validation errors', () => {
    it('should return error when files array is empty', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const result = await getPresignedUrls([])

      expect(result).toEqual({
        success: false,
        error: 'No files provided',
      })
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should return error when files is null', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const result = await getPresignedUrls(null as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No files provided')
    })

    it('should return error when files is undefined', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const result = await getPresignedUrls(undefined as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No files provided')
    })

    it('should return error when file is missing filename', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files = [{ filename: '', mimetype: 'application/pdf' }]
      const result = await getPresignedUrls(files)

      expect(result).toEqual({
        success: false,
        error: 'Each file must have filename and mimetype',
      })
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should return error when file is missing mimetype', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files = [{ filename: 'test.pdf', mimetype: '' }]
      const result = await getPresignedUrls(files)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Each file must have filename and mimetype')
    })

    it('should return error when any file in array is invalid', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files = [
        { filename: 'valid.pdf', mimetype: 'application/pdf' },
        { filename: '', mimetype: 'application/pdf' }, // Invalid
        { filename: 'another.zip', mimetype: 'application/zip' },
      ]
      const result = await getPresignedUrls(files)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Each file must have filename and mimetype')
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })

    it('should validate all files before making backend request', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files = [
        { filename: 'test.pdf', mimetype: '' },
        { filename: '', mimetype: 'application/pdf' },
      ]
      const result = await getPresignedUrls(files)

      expect(result.success).toBe(false)
      expect(mockBackendRequest).not.toHaveBeenCalled()
    })
  })

  describe('backend request errors', () => {
    it('should handle backend errors gracefully', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(new Error('Network error'))

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files: FileMetadata[] = [{ filename: 'test.pdf', mimetype: 'application/pdf' }]
      const result = await getPresignedUrls(files)

      expect(result).toEqual({
        success: false,
        error: 'Network error',
      })
      expect(mockLoggerError).toHaveBeenCalledWith('Error getting presigned URLs', {
        error: 'Network error',
      })
    })

    it('should handle non-Error exceptions', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue('String error')

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files: FileMetadata[] = [{ filename: 'test.pdf', mimetype: 'application/pdf' }]
      const result = await getPresignedUrls(files)

      expect(result).toEqual({
        success: false,
        error: 'Failed to get presigned URLs',
      })
    })

    it('should handle timeout errors', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(new Error('Request timeout'))

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files: FileMetadata[] = [{ filename: 'test.pdf', mimetype: 'application/pdf' }]
      const result = await getPresignedUrls(files)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Request timeout')
    })

    it('should handle 401 unauthorized errors', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(new Error('Unauthorized'))

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files: FileMetadata[] = [{ filename: 'test.pdf', mimetype: 'application/pdf' }]
      const result = await getPresignedUrls(files)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })

    it('should handle 422 validation errors from backend', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockRejectedValue(new Error('Invalid file type'))

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files: FileMetadata[] = [{ filename: 'test.exe', mimetype: 'application/x-msdownload' }]
      const result = await getPresignedUrls(files)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid file type')
    })
  })

  describe('response handling', () => {
    it('should handle backend success response without data', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({
        success: true,
        message: 'No URLs generated',
      })

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files: FileMetadata[] = [{ filename: 'test.pdf', mimetype: 'application/pdf' }]
      const result = await getPresignedUrls(files)

      expect(result.success).toBe(true)
      expect(mockLoggerInfo).toHaveBeenCalledWith('Presigned URLs received', {
        success: true,
        urlCount: 0,
      })
    })

    it('should handle backend error response', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({
        success: false,
        error: 'Bucket configuration missing',
      })

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files: FileMetadata[] = [{ filename: 'test.pdf', mimetype: 'application/pdf' }]
      const result = await getPresignedUrls(files)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Bucket configuration missing')
    })

    it('should preserve message from successful backend response', async () => {
      const mockResponse: PresignedUrlsResponse = {
        success: true,
        data: {
          uploadUrls: [
            {
              filename: 'test.pdf',
              uploadUrl: 'https://example.com/url',
              fileKey: 'key',
            },
          ],
        },
        message: 'Custom success message',
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files: FileMetadata[] = [{ filename: 'test.pdf', mimetype: 'application/pdf' }]
      const result = await getPresignedUrls(files)

      expect(result.message).toBe('Custom success message')
    })
  })

  describe('edge cases', () => {
    it('should handle files with special characters in filename', async () => {
      const files: FileMetadata[] = [
        { filename: 'test (copy) [1].pdf', mimetype: 'application/pdf' },
        { filename: 'file-name_v2.0.pdf', mimetype: 'application/pdf' },
      ]

      const mockResponse: PresignedUrlsResponse = {
        success: true,
        data: {
          uploadUrls: files.map((f) => ({
            filename: f.filename,
            uploadUrl: 'https://example.com/url',
            fileKey: `key/${f.filename}`,
          })),
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const result = await getPresignedUrls(files)

      expect(result.success).toBe(true)
      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { files },
        })
      )
    })

    it('should handle unicode characters in filename', async () => {
      const files: FileMetadata[] = [{ filename: 'документ.pdf', mimetype: 'application/pdf' }]

      const mockResponse: PresignedUrlsResponse = {
        success: true,
        data: {
          uploadUrls: [
            {
              filename: 'документ.pdf',
              uploadUrl: 'https://example.com/url',
              fileKey: 'key',
            },
          ],
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const result = await getPresignedUrls(files)

      expect(result.success).toBe(true)
    })

    it('should handle very long filenames', async () => {
      const longFilename = 'a'.repeat(255) + '.pdf'
      const files: FileMetadata[] = [{ filename: longFilename, mimetype: 'application/pdf' }]

      const mockResponse: PresignedUrlsResponse = {
        success: true,
        data: {
          uploadUrls: [
            {
              filename: longFilename,
              uploadUrl: 'https://example.com/url',
              fileKey: 'key',
            },
          ],
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const result = await getPresignedUrls(files)

      expect(result.success).toBe(true)
    })

    it('should handle maximum file count request', async () => {
      const files: FileMetadata[] = Array.from({ length: 10 }, (_, i) => ({
        filename: `file${i}.pdf`,
        mimetype: 'application/pdf',
      }))

      const mockResponse: PresignedUrlsResponse = {
        success: true,
        data: {
          uploadUrls: files.map((f) => ({
            filename: f.filename,
            uploadUrl: `https://example.com/url-${f.filename}`,
            fileKey: `key-${f.filename}`,
          })),
        },
      }

      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue(mockResponse)

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const result = await getPresignedUrls(files)

      expect(result.success).toBe(true)
      expect(result.data?.uploadUrls).toHaveLength(10)
    })
  })

  describe('timeout configuration', () => {
    it('should use 30 second timeout for presigned URL requests', async () => {
      mockGetAuthToken.mockResolvedValue(TEST_TOKEN)
      mockBackendRequest.mockResolvedValue({
        success: true,
        data: { uploadUrls: [] },
      })

      const { getPresignedUrls } =
        await import('@/infrastructure/serverActions/getPresignedUrls.server.js')

      const files: FileMetadata[] = [{ filename: 'test.pdf', mimetype: 'application/pdf' }]
      await getPresignedUrls(files)

      expect(mockBackendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          timeoutMs: 30000,
        })
      )
    })
  })
})
