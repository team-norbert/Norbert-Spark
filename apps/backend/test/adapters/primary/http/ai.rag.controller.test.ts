import { DrizzleQueryError } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AiRagController } from '../../../../src/adapters/primary/http/ai.rag.controller.js'
import { ExtractDataDto } from '../../../../src/application/dtos/extract-data.dto.js'
import { RagDto } from '../../../../src/application/dtos/rag.dto.js'
import type { CreateVectorStoreResult } from '../../../../src/application/ports/ai.rag.repository.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import type { CreateVectorStoreUseCase } from '../../../../src/application/use-cases/create-vector-store.use-case.js'
import type { ExtractDataUseCase } from '../../../../src/application/use-cases/extract-data.use-case.js'
import type { GetEmbeddingModelUseCase } from '../../../../src/application/use-cases/get-embedding-model.use-case.js'
import type { GetEmbeddingModelByIdUseCase } from '../../../../src/application/use-cases/get-embedding-model-by-id.use-case.js'
import type { PresignedUploadUrlUseCase } from '../../../../src/application/use-cases/presigned-url-put.use-case.js'
import type { DBEmbeddingModelSelect } from '../../../../src/infrastructure/database/schema.js'
import { BaseException } from '../../../../src/shared/exceptions/base.exception.js'
import { NotFoundException } from '../../../../src/shared/exceptions/not-found.exception.js'
import { ValidationException } from '../../../../src/shared/exceptions/validation.exception.js'
import type { PDFUtils } from '../../../../src/shared/utils/pdf.utils.js'
import type { RAGUtils } from '../../../../src/shared/utils/rag.utils.js'
import { createMockLogger } from '../../../shared/factories/logger.factory.js'

// ---------------------------------------------------------------------------
// Hoist PDFParse mock instances so they are available inside vi.mock factories
// and in test assertions (vi.hoisted runs before module imports).
// ---------------------------------------------------------------------------
const { MockPDFParse, mockPDFParseInstance } = vi.hoisted(() => {
  const mockPDFParseInstance = {
    getText: vi.fn<[], Promise<{ text: string }>>(),
    getInfo: vi.fn<[], Promise<{ info?: { Title?: string } }>>(),
    destroy: vi.fn<[], Promise<void>>(),
  }
  // Use a regular function so `new MockPDFParse(...)` returns the shared instance.
  // Arrow functions cannot be constructors; returning an object from a regular
  // function explicitly makes `new expr` evaluate to that object.
  const MockPDFParse = vi.fn(function () {
    return mockPDFParseInstance
  })
  return { mockPDFParseInstance, MockPDFParse }
})

vi.mock('pdf-parse', () => ({ PDFParse: MockPDFParse }))

// Mock the database module so it never tries to connect or validate DATABASE_URL.
vi.mock('../../../../src/infrastructure/database/index.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    transaction: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const MODEL_ID = '01933c89-0001-7000-8000-000000000001'
const CHAT_TYPE_ID = '01933c89-0001-7000-8000-000000000002'
const DOC_ID = '01933c89-0001-7000-8000-000000000003'
const VS_ID = '01933c89-0001-7000-8000-000000000004'
const CHAT_OPT_ID = '01933c89-0001-7000-8000-000000000005'
const CHECKSUM = 'a'.repeat(64)
const TS = new Date('2026-01-01T00:00:00.000Z')
const TS_ISO = TS.toISOString()

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

const makeMockModel = (
  overrides: Partial<DBEmbeddingModelSelect> = {}
): DBEmbeddingModelSelect => ({
  id: MODEL_ID,
  name: 'text-embedding-3-large',
  provider: 'openai',
  dimension: 1536,
  status: 'current',
  releaseYear: 2024,
  recommendedUsage: 'General-purpose semantic search',
  taskType: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
})

const makeVectorStoreResult = (): CreateVectorStoreResult => ({
  documents: [
    {
      id: DOC_ID,
      title: 'Test Document',
      source: 'rag/path/test.pdf',
      checksum: CHECKSUM,
      createdAt: TS,
      updatedAt: TS,
    },
  ],
  vectorStore: { id: VS_ID, createdAt: TS, updatedAt: TS },
  chatAIOptions: {
    id: CHAT_OPT_ID,
    prompt: 'You are a helpful assistant.',
    maxTokens: 1000,
    temperature: '0.7',
    topP: '1',
    frequencyPenalty: null,
    presencePenalty: null,
    stopSequences: null,
    maxRetries: 2,
    createdAt: TS,
    updatedAt: TS,
  },
})

/** Creates a RagDto that uses an existing model and empty stopSequences by default. */
const makeRagDto = (chatAIOverrides: Partial<RagDto['chatAIOptions']> = {}): RagDto =>
  new RagDto(
    uuidv7(),
    [{ title: 'Test Document', source: 'rag/path/test.pdf' }],
    { existingModelId: MODEL_ID },
    { chunkSize: 300, chunkOverlap: 40 },
    {
      chatTypeId: CHAT_TYPE_ID,
      prompt: 'You are a helpful assistant.',
      maxTokens: 1000,
      temperature: 0.7,
      topP: 1,
      stopSequences: [],
      maxRetries: 2,
      ...chatAIOverrides,
    }
  )

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('AiRagController', () => {
  let controller: AiRagController
  let mockGetEmbeddingModelUseCase: GetEmbeddingModelUseCase
  let mockExtractDataUseCase: ExtractDataUseCase
  let mockPresignedUploadUrlUseCase: PresignedUploadUrlUseCase
  let mockPdfUtils: PDFUtils
  let mockRagUtils: RAGUtils
  let mockGetEmbeddingModelByIdUseCase: GetEmbeddingModelByIdUseCase
  let mockCreateVectorStoreUseCase: CreateVectorStoreUseCase
  let mockLogger: LoggerPort
  let mockRequest: FastifyRequest
  let mockReply: FastifyReply

  beforeEach(() => {
    vi.clearAllMocks()

    mockGetEmbeddingModelUseCase = { execute: vi.fn() } as any
    mockExtractDataUseCase = { execute: vi.fn() } as any
    mockPresignedUploadUrlUseCase = { execute: vi.fn() } as any
    mockPdfUtils = { extractFromBuffer: vi.fn() } as any
    mockRagUtils = {
      generateChecksum: vi.fn().mockReturnValue(CHECKSUM),
      chunking: vi.fn().mockResolvedValue(['chunk 1', 'chunk 2']),
      generateEmbeddings: vi.fn().mockResolvedValue([
        [0.1, 0.2],
        [0.3, 0.4],
      ]),
    } as any
    mockGetEmbeddingModelByIdUseCase = { execute: vi.fn() } as any
    mockCreateVectorStoreUseCase = { execute: vi.fn() } as any
    mockLogger = createMockLogger()

    mockRequest = {
      user: { sub: uuidv7() },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      body: {},
    } as any

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as any

    // Default PDFParse stubs used by most tests
    mockPDFParseInstance.getText.mockResolvedValue({ text: 'document content' })
    mockPDFParseInstance.getInfo.mockResolvedValue({ info: { Title: 'Test Document' } })
    mockPDFParseInstance.destroy.mockResolvedValue(undefined)

    controller = new AiRagController(
      mockLogger,
      mockGetEmbeddingModelUseCase,
      mockExtractDataUseCase,
      mockPresignedUploadUrlUseCase,
      mockPdfUtils,
      mockRagUtils,
      mockGetEmbeddingModelByIdUseCase,
      mockCreateVectorStoreUseCase
    )
  })

  // -------------------------------------------------------------------------
  // getEmbeddingModels
  // -------------------------------------------------------------------------

  describe('getEmbeddingModels', () => {
    it('should return 200 with embedding models on success', async () => {
      const models = [
        makeMockModel({ name: 'text-embedding-3-large', provider: 'openai', dimension: 3072 }),
        makeMockModel({ name: 'text-embedding-3-small', provider: 'openai', dimension: 1536 }),
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
        dimension: 1536,
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
            dimension: 1536,
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
        error: 'An unexpected error occurred',
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

    it('should not expose error details for DrizzleQueryError', async () => {
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
        error: 'An unexpected error occurred',
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

  // -------------------------------------------------------------------------
  // createRagVectorStore
  // -------------------------------------------------------------------------

  describe('createRagVectorStore', () => {
    // Shared happy-path stubs; individual tests override as needed.
    beforeEach(() => {
      vi.spyOn(RagDto, 'validate').mockReturnValue(makeRagDto())
      vi.spyOn(ExtractDataDto, 'validate').mockReturnValue({
        fileKey: 'rag/path/test.pdf',
        bucketName: 'test-bucket',
      } as any)
      vi.mocked(mockGetEmbeddingModelByIdUseCase.execute).mockResolvedValue(makeMockModel())
      vi.mocked(mockExtractDataUseCase.execute).mockResolvedValue({
        buffer: Buffer.from('pdf content'),
        fileType: 'pdf',
      })
      vi.mocked(mockCreateVectorStoreUseCase.execute).mockResolvedValue(makeVectorStoreResult())
    })

    it('returns 201 with the full OpenAPI response shape on successful PDF ingestion', async () => {
      const model = makeMockModel()
      vi.mocked(mockGetEmbeddingModelByIdUseCase.execute).mockResolvedValue(model)

      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(201)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: {
          documents: [
            {
              id: DOC_ID,
              title: 'Test Document',
              source: 'rag/path/test.pdf',
              checksum: CHECKSUM,
              createdAt: TS_ISO,
              updatedAt: TS_ISO,
            },
          ],
          embeddingModels: {
            id: model.id,
            modelName: model.name,
            modelProvider: model.provider,
            status: model.status,
            recommendedUsage: model.recommendedUsage,
            releaseYear: model.releaseYear,
            dimension: model.dimension,
            taskType: 'RETRIEVAL_QUERY', // fallback — model.taskType is null
            createdAt: model.createdAt.toISOString(),
            updatedAt: model.updatedAt.toISOString(),
          },
          vectorEmbeddings: {
            id: VS_ID,
            chunkSize: 300,
            chunkOverlap: 40,
            createdAt: TS_ISO,
            updatedAt: TS_ISO,
          },
          chatAIOptions: {
            id: CHAT_OPT_ID,
            prompt: 'You are a helpful assistant.',
            maxTokens: 1000,
            temperature: 0.7, // converted from string '0.7'
            topP: 1, // converted from string '1'
            maxRetries: 2,
            createdAt: TS_ISO,
            updatedAt: TS_ISO,
            // frequencyPenalty / presencePenalty / stopSequences are null → omitted
          },
        },
      })
    })

    it('processes inner PDFs from a ZIP file and uses the composite source path', async () => {
      const innerBuffer = Buffer.from('inner pdf content')
      vi.mocked(mockExtractDataUseCase.execute).mockResolvedValue({
        buffer: Buffer.from('zip content'),
        fileType: 'zip',
      })
      vi.mocked(mockPdfUtils.extractFromBuffer).mockResolvedValue({
        pdfFiles: [
          {
            path: 'subfolder/chapter.pdf',
            buffer: vi.fn().mockResolvedValue(innerBuffer),
          },
        ],
      } as any)
      mockPDFParseInstance.getInfo.mockResolvedValue({ info: { Title: 'Chapter One' } })
      mockPDFParseInstance.getText.mockResolvedValue({ text: 'chapter text' })

      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(201)
      expect(mockCreateVectorStoreUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: expect.arrayContaining([
            expect.objectContaining({
              title: 'Chapter One',
              source: 'rag/path/test.pdf::subfolder/chapter.pdf',
              checksum: CHECKSUM,
            }),
          ]),
        })
      )
    })

    it('falls back to fileEntry.path as title when the ZIP inner PDF has no Title metadata', async () => {
      vi.mocked(mockExtractDataUseCase.execute).mockResolvedValue({
        buffer: Buffer.from('zip content'),
        fileType: 'zip',
      })
      vi.mocked(mockPdfUtils.extractFromBuffer).mockResolvedValue({
        pdfFiles: [
          {
            path: 'no-title.pdf',
            buffer: vi.fn().mockResolvedValue(Buffer.from('data')),
          },
        ],
      } as any)
      mockPDFParseInstance.getInfo.mockResolvedValue({ info: {} }) // no Title

      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockCreateVectorStoreUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          documents: expect.arrayContaining([expect.objectContaining({ title: 'no-title.pdf' })]),
        })
      )
    })

    it('returns 404 when the embedding model is not found', async () => {
      vi.mocked(mockGetEmbeddingModelByIdUseCase.execute).mockResolvedValue(undefined)

      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'EmbeddingModel not found',
      })
    })

    it('returns 400 when RagDto.validate throws a ValidationException', async () => {
      const validationError = new ValidationException('id is required and must be a string')
      vi.spyOn(RagDto, 'validate').mockImplementation(() => {
        throw validationError
      })

      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(validationError.statusCode)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: validationError.message,
      })
    })

    it('returns 500 and logs the error when extractDataUseCase throws', async () => {
      const error = new Error('S3 connection timeout')
      vi.mocked(mockExtractDataUseCase.execute).mockRejectedValue(error)

      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockLogger.error).toHaveBeenCalledWith('Error in createRagVectorStore', error)
      expect(mockReply.code).toHaveBeenCalledWith(500)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'An unexpected error occurred',
      })
    })

    it('returns 500 and logs the error when createVectorStoreUseCase throws', async () => {
      const error = new Error('Transaction rolled back')
      vi.mocked(mockCreateVectorStoreUseCase.execute).mockRejectedValue(error)

      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockLogger.error).toHaveBeenCalledWith('Error in createRagVectorStore', error)
      expect(mockReply.code).toHaveBeenCalledWith(500)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'An unexpected error occurred',
      })
    })

    it('wraps a non-Error rejection in a new Error before logging', async () => {
      vi.mocked(mockCreateVectorStoreUseCase.execute).mockRejectedValue('string rejection')

      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in createRagVectorStore',
        new Error('string rejection')
      )
      expect(mockReply.code).toHaveBeenCalledWith(500)
    })

    it('passes stopSequences to ragUtils.chunking when the array is non-empty', async () => {
      vi.spyOn(RagDto, 'validate').mockReturnValue(makeRagDto({ stopSequences: ['\n', 'END'] }))

      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockRagUtils.chunking).toHaveBeenCalledWith(300, 40, expect.any(String), ['\n', 'END'])
    })

    it('omits stopSequences from ragUtils.chunking when the array is empty', async () => {
      // makeRagDto() defaults to stopSequences: []

      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockRagUtils.chunking).toHaveBeenCalledWith(300, 40, expect.any(String), undefined)
    })

    it('falls back to RETRIEVAL_QUERY for taskType when the model has taskType null', async () => {
      vi.mocked(mockGetEmbeddingModelByIdUseCase.execute).mockResolvedValue(
        makeMockModel({ taskType: null })
      )

      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            embeddingModels: expect.objectContaining({ taskType: 'RETRIEVAL_QUERY' }),
          }),
        })
      )
    })

    it('uses the model taskType directly when it is set', async () => {
      vi.mocked(mockGetEmbeddingModelByIdUseCase.execute).mockResolvedValue(
        makeMockModel({ provider: 'google', taskType: 'RETRIEVAL_DOCUMENT' })
      )

      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            embeddingModels: expect.objectContaining({ taskType: 'RETRIEVAL_DOCUMENT' }),
          }),
        })
      )
    })

    it('omits optional chatAIOptions fields from the response when they are null', async () => {
      vi.mocked(mockCreateVectorStoreUseCase.execute).mockResolvedValue({
        ...makeVectorStoreResult(),
        chatAIOptions: {
          id: CHAT_OPT_ID,
          prompt: 'You are helpful.',
          maxTokens: null,
          temperature: null,
          topP: null,
          frequencyPenalty: null,
          presencePenalty: null,
          stopSequences: null,
          maxRetries: null,
          createdAt: TS,
          updatedAt: TS,
        },
      })

      await controller.createRagVectorStore(mockRequest, mockReply)

      const sent = vi.mocked(mockReply.send).mock.calls[0]![0] as {
        data: { chatAIOptions: object }
      }
      const opts = sent.data.chatAIOptions
      expect(opts).not.toHaveProperty('maxTokens')
      expect(opts).not.toHaveProperty('temperature')
      expect(opts).not.toHaveProperty('topP')
      expect(opts).not.toHaveProperty('frequencyPenalty')
      expect(opts).not.toHaveProperty('presencePenalty')
      expect(opts).not.toHaveProperty('stopSequences')
      expect(opts).not.toHaveProperty('maxRetries')
    })

    it('converts numeric string chatAIOptions fields to numbers in the response', async () => {
      vi.mocked(mockCreateVectorStoreUseCase.execute).mockResolvedValue({
        ...makeVectorStoreResult(),
        chatAIOptions: {
          id: CHAT_OPT_ID,
          prompt: 'You are helpful.',
          maxTokens: 2000,
          temperature: '0.5',
          topP: '0.9',
          frequencyPenalty: '0.1',
          presencePenalty: '-0.2',
          stopSequences: ['END', 'STOP'],
          maxRetries: 3,
          createdAt: TS,
          updatedAt: TS,
        },
      })

      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            chatAIOptions: expect.objectContaining({
              maxTokens: 2000,
              temperature: 0.5,
              topP: 0.9,
              frequencyPenalty: 0.1,
              presencePenalty: -0.2,
              stopSequences: ['END', 'STOP'],
              maxRetries: 3,
            }),
          }),
        })
      )
    })

    it('passes the correct typed payload to createVectorStoreUseCase', async () => {
      const model = makeMockModel({ id: MODEL_ID, dimension: 1536 })
      vi.mocked(mockGetEmbeddingModelByIdUseCase.execute).mockResolvedValue(model)
      vi.mocked(mockRagUtils.chunking).mockResolvedValue(['chunk A', 'chunk B'])
      vi.mocked(mockRagUtils.generateEmbeddings).mockResolvedValue([[0.1], [0.2]])

      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockCreateVectorStoreUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          embeddingModelId: MODEL_ID,
          dimension: 1536,
          chunkSize: 300,
          chunkOverlap: 40,
          documents: expect.arrayContaining([
            expect.objectContaining({
              title: 'Test Document',
              source: 'rag/path/test.pdf',
              checksum: CHECKSUM,
              records: [
                { content: 'chunk A', embedding: [0.1] },
                { content: 'chunk B', embedding: [0.2] },
              ],
            }),
          ]),
          chatAIOptions: expect.objectContaining({
            chatTypeId: CHAT_TYPE_ID,
            prompt: 'You are a helpful assistant.',
          }),
        })
      )
    })

    it('logs a debug message after successful vector store creation', async () => {
      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Created vector store',
        expect.objectContaining({ event: 'rag.vector_store.created' })
      )
    })

    it('uses the first document title as the vectorStoreName', async () => {
      vi.spyOn(RagDto, 'validate').mockReturnValue(
        new RagDto(
          uuidv7(),
          [{ title: 'My Custom Title', source: 'rag/path/test.pdf' }],
          { existingModelId: MODEL_ID },
          { chunkSize: 300, chunkOverlap: 40 },
          { chatTypeId: CHAT_TYPE_ID, prompt: 'p' }
        )
      )

      await controller.createRagVectorStore(mockRequest, mockReply)

      expect(mockCreateVectorStoreUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ vectorStoreName: 'My Custom Title' })
      )
    })
  })
})
