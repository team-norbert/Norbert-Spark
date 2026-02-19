import type { FastifyReply, FastifyRequest } from 'fastify'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIAdminController } from '../../../../src/adapters/primary/http/ai-admin.controller.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import type { GetAIAdminUseCase } from '../../../../src/application/use-cases/get-ai-admin.use-case.js'
import type { PostAIAdminUseCase } from '../../../../src/application/use-cases/post-ai-admin.use-case.js'
import type { PutAIAdminUseCase } from '../../../../src/application/use-cases/put-ai-admin.use-case.js'
import { BaseException } from '../../../../src/shared/exceptions/base.exception.js'
import { NotFoundException } from '../../../../src/shared/exceptions/not-found.exception.js'
import { ValidationException } from '../../../../src/shared/exceptions/validation.exception.js'

describe('AIAdminController', () => {
  let controller: AIAdminController
  let mockGetAIAdminUseCase: GetAIAdminUseCase
  let mockPutAIAdminUseCase: PutAIAdminUseCase
  let mockPostAIAdminUseCase: PostAIAdminUseCase
  let mockLogger: LoggerPort
  let mockRequest: FastifyRequest
  let mockReply: FastifyReply

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Create mock use case
    mockGetAIAdminUseCase = {
      execute: vi.fn(),
    } as any

    // Create mock put use case
    mockPutAIAdminUseCase = {
      execute: vi.fn(),
    } as any

    // Create mock post use case
    mockPostAIAdminUseCase = {
      execute: vi.fn(),
    } as any

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as LoggerPort

    // Create mock request
    mockRequest = {
      params: {},
      user: { sub: uuidv7() },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
    } as any

    // Create mock reply with chainable methods
    mockReply = {
      code: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as any

    // Create controller instance
    controller = new AIAdminController(
      mockLogger,
      mockGetAIAdminUseCase,
      mockPutAIAdminUseCase,
      mockPostAIAdminUseCase
    )
  })

  describe('getAIChatSettingsById', () => {
    it('should return chat AI options for valid ID', async () => {
      const chatTypeId = uuidv7()
      const mockOptions = {
        id: uuidv7(),
        chatTypeId,
        prompt: 'You are a helpful assistant',
        maxTokens: 1000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 40,
        stopSequences: ['END'],
        seed: 12345,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockRequest.params = { id: chatTypeId }
      vi.mocked(mockGetAIAdminUseCase.execute).mockResolvedValue(mockOptions)

      await controller.getAIChatSettingsById(mockRequest, mockReply)

      expect(mockLogger.info).toHaveBeenCalledWith('Received ai-admin request')
      expect(mockGetAIAdminUseCase.execute).toHaveBeenCalledWith(
        chatTypeId,
        expect.objectContaining({
          userId: mockRequest.user?.sub,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        })
      )
      expect(mockReply.code).toHaveBeenCalledWith(200)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockOptions,
      })
    })

    it('should handle null user in audit context', async () => {
      const chatTypeId = uuidv7()
      const mockOptions = {
        id: uuidv7(),
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: 500,
        temperature: '0.5',
        topP: '1.0',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: null,
        stopSequences: null,
        seed: null,
        maxRetries: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockRequest.params = { id: chatTypeId }
      mockRequest.user = undefined
      mockRequest.headers['user-agent'] = undefined

      vi.mocked(mockGetAIAdminUseCase.execute).mockResolvedValue(mockOptions)

      await controller.getAIChatSettingsById(mockRequest, mockReply)

      expect(mockGetAIAdminUseCase.execute).toHaveBeenCalledWith(
        chatTypeId,
        expect.objectContaining({
          userId: null,
          ipAddress: '127.0.0.1',
          userAgent: null,
        })
      )
      expect(mockReply.code).toHaveBeenCalledWith(200)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockOptions,
      })
    })

    it('should return 404 when result is null', async () => {
      const chatTypeId = uuidv7()
      mockRequest.params = { id: chatTypeId }

      vi.mocked(mockGetAIAdminUseCase.execute).mockResolvedValue(null)

      await controller.getAIChatSettingsById(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'AI Chat Configuration not found',
      })
    })

    it('should handle NotFoundException with 404 status', async () => {
      const chatTypeId = uuidv7()
      mockRequest.params = { id: chatTypeId }

      const notFoundError = new NotFoundException('Chat AI options')
      vi.mocked(mockGetAIAdminUseCase.execute).mockRejectedValue(notFoundError)

      await controller.getAIChatSettingsById(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Chat AI options not found',
      })
    })

    it('should handle ValidationException with 400 status', async () => {
      const chatTypeId = uuidv7()
      mockRequest.params = { id: chatTypeId }

      const validationError = new ValidationException('Invalid UUID format')
      vi.mocked(mockGetAIAdminUseCase.execute).mockRejectedValue(validationError)

      await controller.getAIChatSettingsById(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(400)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid UUID format',
      })
    })

    it('should handle generic errors with 500 status', async () => {
      const chatTypeId = uuidv7()
      mockRequest.params = { id: chatTypeId }

      const genericError = new Error('Database connection failed')
      vi.mocked(mockGetAIAdminUseCase.execute).mockRejectedValue(genericError)

      await controller.getAIChatSettingsById(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Database connection failed',
      })
    })

    it('should handle BaseException with custom status code', async () => {
      const chatTypeId = uuidv7()
      mockRequest.params = { id: chatTypeId }

      class CustomException extends BaseException {
        constructor(message: string) {
          super(message, 'CUSTOM_ERROR' as any, 403, {})
        }
      }

      const customError = new CustomException('Access forbidden')
      vi.mocked(mockGetAIAdminUseCase.execute).mockRejectedValue(customError)

      await controller.getAIChatSettingsById(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(403)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Access forbidden',
      })
    })

    it('should handle error without message property', async () => {
      const chatTypeId = uuidv7()
      mockRequest.params = { id: chatTypeId }

      const errorWithoutMessage = { someProperty: 'value' } as any
      vi.mocked(mockGetAIAdminUseCase.execute).mockRejectedValue(errorWithoutMessage)

      await controller.getAIChatSettingsById(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'An unexpected error occurred',
      })
    })

    it('should extract ID from request params', async () => {
      const chatTypeId = uuidv7()
      mockRequest.params = { id: chatTypeId, someOtherParam: 'value' }

      const mockOptions = {
        id: uuidv7(),
        chatTypeId,
        prompt: 'Test',
        maxTokens: 100,
        temperature: '0.5',
        topP: '1.0',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: null,
        stopSequences: null,
        seed: null,
        maxRetries: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(mockGetAIAdminUseCase.execute).mockResolvedValue(mockOptions)

      await controller.getAIChatSettingsById(mockRequest, mockReply)

      expect(mockGetAIAdminUseCase.execute).toHaveBeenCalledWith(chatTypeId, expect.any(Object))
    })

    it('should log info message on request', async () => {
      const chatTypeId = uuidv7()
      mockRequest.params = { id: chatTypeId }

      vi.mocked(mockGetAIAdminUseCase.execute).mockResolvedValue({} as any)

      await controller.getAIChatSettingsById(mockRequest, mockReply)

      expect(mockLogger.info).toHaveBeenCalledWith('Received ai-admin request')
    })
  })

  describe('putAIChatSettingsById', () => {
    it('should update chat AI options and return 204 for valid request', async () => {
      const chatTypeId = uuidv7()
      const requestBody = {
        prompt: 'You are a helpful AI assistant',
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        topK: 40,
        stopSequences: ['END', 'STOP'],
        seed: 12345,
        maxRetries: 3,
      }

      mockRequest.params = { id: chatTypeId }
      mockRequest.body = requestBody
      vi.mocked(mockPutAIAdminUseCase.execute).mockResolvedValue({
        id: chatTypeId,
        chatTypeId,
        prompt: 'You are a helpful AI assistant',
        maxTokens: 2000,
        temperature: '0.7',
        topP: '0.9',
        frequencyPenalty: '0.0',
        presencePenalty: '0.0',
        topK: 40,
        stopSequences: ['END', 'STOP'],
        seed: 12345,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await controller.putAIChatSettingsById(mockRequest, mockReply)

      expect(mockLogger.info).toHaveBeenCalledWith('Received ai-admin PUT request')
      expect(mockPutAIAdminUseCase.execute).toHaveBeenCalledWith(
        chatTypeId,
        expect.objectContaining({
          prompt: 'You are a helpful AI assistant',
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0,
          topK: 40,
          stopSequences: ['END', 'STOP'],
          seed: 12345,
          maxRetries: 3,
        }),
        expect.objectContaining({
          userId: mockRequest.user?.sub,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        })
      )
      expect(mockReply.status).toHaveBeenCalledWith(204)
      expect(mockReply.send).toHaveBeenCalled()
    })

    it('should update with only required fields', async () => {
      const chatTypeId = uuidv7()
      const requestBody = {
        prompt: 'Updated prompt',
      }

      mockRequest.params = { id: chatTypeId }
      mockRequest.body = requestBody
      vi.mocked(mockPutAIAdminUseCase.execute).mockResolvedValue({
        id: chatTypeId,
        chatTypeId,
        prompt: 'Updated prompt',
        maxTokens: null,
        temperature: null,
        topP: null,
        frequencyPenalty: null,
        presencePenalty: null,
        topK: null,
        stopSequences: null,
        seed: null,
        maxRetries: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await controller.putAIChatSettingsById(mockRequest, mockReply)

      expect(mockPutAIAdminUseCase.execute).toHaveBeenCalledWith(
        chatTypeId,
        expect.objectContaining({
          prompt: 'Updated prompt',
        }),
        expect.any(Object)
      )
      expect(mockReply.status).toHaveBeenCalledWith(204)
    })

    it('should return 400 for invalid UUID', async () => {
      mockRequest.params = { id: 'invalid-uuid' }
      mockRequest.body = { prompt: 'Test prompt' }

      await controller.putAIChatSettingsById(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(expect.any(Number))
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
        })
      )
    })

    it('should return 400 for validation errors', async () => {
      const chatTypeId = uuidv7()
      mockRequest.params = { id: chatTypeId }
      mockRequest.body = { temperature: 5 } // Invalid: temperature must be between 0 and 2

      await controller.putAIChatSettingsById(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalled()
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
        })
      )
    })

    it('should handle use case errors correctly', async () => {
      const chatTypeId = uuidv7()
      const error = new NotFoundException('Chat configuration')

      mockRequest.params = { id: chatTypeId }
      mockRequest.body = { prompt: 'Test prompt' }
      vi.mocked(mockPutAIAdminUseCase.execute).mockRejectedValue(error)

      await controller.putAIChatSettingsById(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(404)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Chat configuration not found',
      })
    })

    it('should handle unexpected errors with 500 status', async () => {
      const chatTypeId = uuidv7()
      const error = new Error('Unexpected error')

      mockRequest.params = { id: chatTypeId }
      mockRequest.body = { prompt: 'Test prompt' }
      vi.mocked(mockPutAIAdminUseCase.execute).mockRejectedValue(error)

      await controller.putAIChatSettingsById(mockRequest, mockReply)

      expect(mockReply.code).toHaveBeenCalledWith(500)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'Unexpected error',
      })
    })

    it('should extract audit context correctly when user is not authenticated', async () => {
      const chatTypeId = uuidv7()
      mockRequest.params = { id: chatTypeId }
      mockRequest.body = { prompt: 'Test prompt' }
      mockRequest.user = undefined
      vi.mocked(mockPutAIAdminUseCase.execute).mockResolvedValue({
        id: chatTypeId,
        chatTypeId,
        prompt: 'Test prompt',
        maxTokens: null,
        temperature: null,
        topP: null,
        frequencyPenalty: null,
        presencePenalty: null,
        topK: null,
        stopSequences: null,
        seed: null,
        maxRetries: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await controller.putAIChatSettingsById(mockRequest, mockReply)

      expect(mockPutAIAdminUseCase.execute).toHaveBeenCalledWith(
        chatTypeId,
        expect.any(Object),
        expect.objectContaining({
          userId: null,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        })
      )
    })
  })

  describe('registerRoutes', () => {
    it('should register GET route with authentication middleware', () => {
      const mockApp = {
        get: vi.fn(),
        put: vi.fn(),
      } as any

      controller.registerRoutes(mockApp)

      expect(mockApp.get).toHaveBeenCalledWith(
        '/ai/chats/config/:id/settings',
        expect.objectContaining({
          preHandler: expect.any(Array),
        }),
        expect.any(Function)
      )

      expect(mockApp.put).toHaveBeenCalledWith(
        '/ai/chats/config/:id/settings',
        expect.objectContaining({
          preHandler: expect.any(Array),
        }),
        expect.any(Function)
      )
    })
  })
})
