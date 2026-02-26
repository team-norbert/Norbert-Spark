import { DrizzleQueryError } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AiRagController } from '../../../../src/adapters/primary/http/ai.rag.controller.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import type { GetEmbeddingModelUseCase } from '../../../../src/application/use-cases/get-embedding-model.use-case.js'
import type { PresignedUploadUrlUseCase } from '../../../../src/application/use-cases/presigned-url-put.use-case.js'
import type { DBEmbeddingModelSelect } from '../../../../src/infrastructure/database/schema.js'
import { BaseException } from '../../../../src/shared/exceptions/base.exception.js'
import { NotFoundException } from '../../../../src/shared/exceptions/not-found.exception.js'
import type { PDFUtils } from '../../../../src/shared/utils/pdf.utils.js'

const makeMockModel = (
  overrides: Partial<DBEmbeddingModelSelect> = {}
): DBEmbeddingModelSelect => ({
  id: uuidv7(),
  name: 'text-embedding-3-large',
  provider: 'openai',
  dimension: '3072',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
})

describe('AiRagController', () => {
  let controller: AiRagController
  let mockGetEmbeddingModelUseCase: GetEmbeddingModelUseCase
  let mockPresignedUploadUrlUseCase: PresignedUploadUrlUseCase
  let mockPdfUtils: PDFUtils
  let mockLogger: LoggerPort
  let mockRequest: FastifyRequest
  let mockReply: FastifyReply

  beforeEach(() => {
    vi.clearAllMocks()

    mockGetEmbeddingModelUseCase = {
      execute: vi.fn(),
    } as any

    mockPresignedUploadUrlUseCase = {
      execute: vi.fn(),
    } as any

    mockPdfUtils = {} as any

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as LoggerPort

    mockRequest = {
      user: { sub: uuidv7() },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    } as any

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as any

    controller = new AiRagController(
      mockLogger,
      mockGetEmbeddingModelUseCase,
      mockPresignedUploadUrlUseCase,
      mockPdfUtils
    )
  })

  describe('getEmbeddingModels', () => {
    it('should return 200 with embedding models on success', async () => {
      const models = [
        makeMockModel({ name: 'text-embedding-3-large', provider: 'openai', dimension: '3072' }),
        makeMockModel({ name: 'text-embedding-3-small', provider: 'openai', dimension: '1536' }),
      ]
      vi.mocked(mockGetEmbeddingModelUseCase.execute).mockResolvedValue(models)

      await controller.getEmbeddingModels(mockRequest, mockReply)

      expect(mockGetEmbeddingModelUseCase.execute).toHaveBeenCalledOnce()
      expect(mockReply.code).toHaveBeenCalledWith(200)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: models,
      })
    })

    it('should return 200 with an empty array when no models exist', async () => {
      vi.mocked(mockGetEmbeddingModelUseCase.execute).mockResolvedValue([])

      await controller.getEmbeddingModels(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(200)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: [],
      })
    })

    it('should return all model fields in the response', async () => {
      const model = makeMockModel({
        name: 'text-embedding-ada-002',
        provider: 'openai',
        dimension: '1536',
        createdAt: new Date('2023-06-01T12:00:00Z'),
        updatedAt: new Date('2023-06-15T08:00:00Z'),
      })
      vi.mocked(mockGetEmbeddingModelUseCase.execute).mockResolvedValue([model])

      await controller.getEmbeddingModels(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: [
          expect.objectContaining({
            id: model.id,
            name: 'text-embedding-ada-002',
            provider: 'openai',
            dimension: '1536',
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
          }),
        ],
      })
    })

    it('should return 500 and log error when use case throws a generic error', async () => {
      const error = new Error('Database connection lost')
      vi.mocked(mockGetEmbeddingModelUseCase.execute).mockRejectedValue(error)

      await controller.getEmbeddingModels(mockRequest, mockReply)

      expect(mockLogger.error).toHaveBeenCalledWith('Error in getEmbeddingModels', error)
      expect(mockReply.code).toHaveBeenCalledWith(500)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection lost',
      })
    })

    it('should use statusCode from BaseException subclass', async () => {
      const notFoundError = new NotFoundException('EmbeddingModel')
      vi.mocked(mockGetEmbeddingModelUseCase.execute).mockRejectedValue(notFoundError)

      await controller.getEmbeddingModels(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(notFoundError.statusCode)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: notFoundError.message,
      })
    })

    it('should return a DB-specific message when a DrizzleQueryError is thrown', async () => {
      const drizzleError = new DrizzleQueryError(
        'SELECT * FROM embedding_models',
        [],
        new Error('query failed')
      )
      vi.mocked(mockGetEmbeddingModelUseCase.execute).mockRejectedValue(drizzleError)

      await controller.getEmbeddingModels(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch embedding models due to a database error',
      })
    })

    it('should wrap a non-Error rejection in a new Error before logging', async () => {
      vi.mocked(mockGetEmbeddingModelUseCase.execute).mockRejectedValue('unexpected string error')

      await controller.getEmbeddingModels(mockRequest, mockReply)

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in getEmbeddingModels',
        new Error('unexpected string error')
      )
      expect(mockReply.code).toHaveBeenCalledWith(500)
    })
  })
})
