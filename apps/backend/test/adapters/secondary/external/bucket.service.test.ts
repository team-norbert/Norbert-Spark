import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BucketService } from '../../../../src/adapters/secondary/external/bucket.service.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { createMockLogger } from '../../../shared/factories/logger.factory.js'

const mockSend = vi.fn()
const mockMiddlewareStackAdd = vi.fn()
const mockGetSignedUrl = vi.fn()

vi.mock('@aws-sdk/client-s3', () => {
  const mockS3Client = vi.fn(function (this: any) {
    this.send = mockSend
    this.middlewareStack = { add: mockMiddlewareStackAdd }
  })
  return {
    S3Client: mockS3Client,
    GetObjectCommand: vi.fn(function (this: any, params: any) {
      this.input = params
    }),
    PutObjectCommand: vi.fn(function (this: any, params: any) {
      this.input = params
    }),
  }
})

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn((...args: any[]) => mockGetSignedUrl(...args)),
}))

vi.mock('obscured', () => ({
  obscured: {
    value: vi.fn((val: string) => val),
  },
}))

vi.mock('../../../../src/infrastructure/config/env.config.js', () => ({
  EnvConfig: {
    CLOUDFLARE_ENDPOINT: 'https://test.r2.cloudflarestorage.com',
    CLOUDFLARE_ACCESS_ID: 'test-access-id',
    CLOUDFLARE_ACCESS_SECRET: 'test-access-secret',
  },
}))

describe('BucketService', () => {
  let service: BucketService
  let mockLogger: LoggerPort

  beforeEach(() => {
    vi.clearAllMocks()
    mockLogger = createMockLogger()
    service = new BucketService(mockLogger)
  })

  describe('constructor', () => {
    it('should create an instance of BucketService', () => {
      expect(service).toBeInstanceOf(BucketService)
    })

    it('should create two S3Client instances', () => {
      expect(S3Client).toHaveBeenCalledTimes(2)
    })

    it('should create standard client with correct config', () => {
      expect(S3Client).toHaveBeenCalledWith({
        endpoint: 'https://test.r2.cloudflarestorage.com',
        credentials: {
          accessKeyId: 'test-access-id',
          secretAccessKey: 'test-access-secret',
        },
        region: 'auto',
      })
    })

    it('should create presign client with checksum options', () => {
      expect(S3Client).toHaveBeenCalledWith({
        endpoint: 'https://test.r2.cloudflarestorage.com',
        credentials: {
          accessKeyId: 'test-access-id',
          secretAccessKey: 'test-access-secret',
        },
        region: 'auto',
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      })
    })

    it('should register removeChecksumMiddleware on presign client', () => {
      expect(mockMiddlewareStackAdd).toHaveBeenCalledTimes(1)
      expect(mockMiddlewareStackAdd).toHaveBeenCalledWith(expect.any(Function), {
        step: 'build',
        name: 'removeChecksumMiddleware',
        priority: 'high',
      })
    })
  })

  describe('bucketExists', () => {
    it('should throw not implemented error', () => {
      expect(() => service.bucketExists('my-bucket')).toThrow('Method not implemented.')
    })
  })

  describe('createBucket', () => {
    it('should throw not implemented error', () => {
      expect(() => service.createBucket('my-bucket')).toThrow('Method not implemented.')
    })
  })

  describe('uploadFile', () => {
    it('should throw not implemented error', () => {
      expect(() => service.uploadFile('my-bucket', 'file.txt', 'content')).toThrow(
        'Method not implemented.'
      )
    })
  })

  describe('getFileUrl', () => {
    it('should return byte array on success', async () => {
      const expectedBytes = new Uint8Array([1, 2, 3])
      mockSend.mockResolvedValue({
        Body: { transformToByteArray: vi.fn().mockResolvedValue(expectedBytes) },
      })

      const result = await service.getFileUrl('my-bucket', 'file.txt')

      expect(result).toEqual(expectedBytes)
    })

    it('should send GetObjectCommand with correct params', async () => {
      mockSend.mockResolvedValue({
        Body: { transformToByteArray: vi.fn().mockResolvedValue(new Uint8Array()) },
      })

      await service.getFileUrl('my-bucket', 'path/to/file.txt')

      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'my-bucket',
        Key: 'path/to/file.txt',
      })
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ input: { Bucket: 'my-bucket', Key: 'path/to/file.txt' } })
      )
    })

    it('should return undefined when Body is undefined', async () => {
      mockSend.mockResolvedValue({ Body: undefined })

      const result = await service.getFileUrl('my-bucket', 'file.txt')

      expect(result).toBeUndefined()
    })

    it('should log error and rethrow on failure', async () => {
      const error = new Error('S3 connection failed')
      mockSend.mockRejectedValue(error)

      await expect(service.getFileUrl('my-bucket', 'file.txt')).rejects.toThrow(
        'S3 connection failed'
      )

      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching file from bucket', error, {
        bucketName: 'my-bucket',
        fileKey: 'file.txt',
      })
    })

    it('should propagate the original error', async () => {
      const error = new Error('Access denied')
      mockSend.mockRejectedValue(error)

      const caughtError = await service.getFileUrl('bucket', 'key').catch((e) => e)
      expect(caughtError).toBe(error)
    })
  })

  describe('getLoadURL', () => {
    it('should return a presigned GET URL', async () => {
      mockGetSignedUrl.mockResolvedValue('https://signed-get-url.example.com')

      const result = await service.getLoadURL('my-bucket', 'file.txt', 3600)

      expect(result).toBe('https://signed-get-url.example.com')
    })

    it('should create GetObjectCommand with correct params', async () => {
      mockGetSignedUrl.mockResolvedValue('https://signed-url.example.com')

      await service.getLoadURL('my-bucket', 'path/file.pdf', 600)

      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'my-bucket',
        Key: 'path/file.pdf',
      })
    })

    it('should call getSignedUrl with the client and expiration', async () => {
      mockGetSignedUrl.mockResolvedValue('https://signed-url.example.com')

      await service.getLoadURL('my-bucket', 'file.txt', 1800)

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ input: { Bucket: 'my-bucket', Key: 'file.txt' } }),
        { expiresIn: 1800 }
      )
    })
  })

  describe('getUploadURL', () => {
    it('should return a presigned PUT URL', async () => {
      mockGetSignedUrl.mockResolvedValue('https://signed-put-url.example.com')

      const result = await service.getUploadURL('my-bucket', 'file.txt', 3600)

      expect(result).toBe('https://signed-put-url.example.com')
    })

    it('should create PutObjectCommand with correct params', async () => {
      mockGetSignedUrl.mockResolvedValue('https://signed-url.example.com')

      await service.getUploadURL('my-bucket', 'uploads/image.png', 900)

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'my-bucket',
        Key: 'uploads/image.png',
      })
    })

    it('should call getSignedUrl with the presign client and expiration', async () => {
      mockGetSignedUrl.mockResolvedValue('https://signed-url.example.com')

      await service.getUploadURL('my-bucket', 'file.txt', 1200)

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ input: { Bucket: 'my-bucket', Key: 'file.txt' } }),
        { expiresIn: 1200 }
      )
    })
  })

  describe('removeChecksumMiddleware', () => {
    it('should remove checksum-related query params', async () => {
      const middleware = mockMiddlewareStackAdd.mock.calls[0]![0] as (
        next: any
      ) => (args: any) => Promise<any>
      const mockNext = vi.fn().mockResolvedValue({})
      const handler = middleware(mockNext)

      const query: Record<string, string> = {
        'x-amz-checksum-crc32': 'abc123',
        'x-amz-sdk-checksum-algorithm': 'CRC32',
        'other-param': 'keep-me',
      }

      await handler({ request: { query } })

      expect(query).toEqual({ 'other-param': 'keep-me' })
      expect(mockNext).toHaveBeenCalledTimes(1)
    })

    it('should not modify request when query is undefined', async () => {
      const middleware = mockMiddlewareStackAdd.mock.calls[0]![0] as (
        next: any
      ) => (args: any) => Promise<any>
      const mockNext = vi.fn().mockResolvedValue({})
      const handler = middleware(mockNext)

      await handler({ request: {} })

      expect(mockNext).toHaveBeenCalledTimes(1)
    })

    it('should not modify request when no checksum params present', async () => {
      const middleware = mockMiddlewareStackAdd.mock.calls[0]![0] as (
        next: any
      ) => (args: any) => Promise<any>
      const mockNext = vi.fn().mockResolvedValue({})
      const handler = middleware(mockNext)

      const query: Record<string, string> = { 'other-param': 'value' }
      await handler({ request: { query } })

      expect(query).toEqual({ 'other-param': 'value' })
    })
  })

  describe('implements BucketPort', () => {
    it('should have bucketExists method', () => {
      expect(typeof service.bucketExists).toBe('function')
    })

    it('should have createBucket method', () => {
      expect(typeof service.createBucket).toBe('function')
    })

    it('should have uploadFile method', () => {
      expect(typeof service.uploadFile).toBe('function')
    })

    it('should have getFileUrl method', () => {
      expect(typeof service.getFileUrl).toBe('function')
    })

    it('should have getLoadURL method', () => {
      expect(typeof service.getLoadURL).toBe('function')
    })

    it('should have getUploadURL method', () => {
      expect(typeof service.getUploadURL).toBe('function')
    })
  })
})
