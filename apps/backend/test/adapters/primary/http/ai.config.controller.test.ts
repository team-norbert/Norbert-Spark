import { DrizzleQueryError } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIConfigController } from '../../../../src/adapters/primary/http/ai.config.controller.js'
import type { AuditLogPort } from '../../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import type { GetChatDetailsUseCase } from '../../../../src/application/use-cases/get-chat-details.use-case.js'
import type { PostChatTypesUseCase } from '../../../../src/application/use-cases/post-chat-types.use-case.js'
import type { PutChatDetailsUseCase } from '../../../../src/application/use-cases/put-chat-details.use-case.js'
import { UserId } from '../../../../src/domain/value-objects/userID.js'
import { ConflictException } from '../../../../src/shared/exceptions/conflict.exception.js'
import { InternalErrorException } from '../../../../src/shared/exceptions/internal-error.exception.js'
import { NotFoundException } from '../../../../src/shared/exceptions/not-found.exception.js'
import { createMockLogger } from '../../../shared/factories/logger.factory.js'

describe('AIConfigController', () => {
  let controller: AIConfigController
  let mockGetChatDetailsUseCase: GetChatDetailsUseCase
  let mockPutChatDetailsUseCase: PutChatDetailsUseCase
  let mockPostChatTypesUseCase: PostChatTypesUseCase
  let mockAuditLogPort: AuditLogPort
  let mockLogger: LoggerPort
  let mockRequest: FastifyRequest
  let mockReply: FastifyReply

  beforeEach(() => {
    vi.clearAllMocks()

    mockGetChatDetailsUseCase = {
      execute: vi.fn(),
    } as any

    mockPutChatDetailsUseCase = {
      execute: vi.fn(),
    } as any

    mockPostChatTypesUseCase = {
      execute: vi.fn(),
    } as any

    mockLogger = createMockLogger()

    mockAuditLogPort = {
      log: vi.fn().mockResolvedValue(undefined),
      getByEntity: vi.fn().mockResolvedValue([]),
      getByUser: vi.fn().mockResolvedValue([]),
      getByAction: vi.fn().mockResolvedValue([]),
    } as any

    controller = new AIConfigController(
      mockLogger,
      mockGetChatDetailsUseCase,
      mockPutChatDetailsUseCase,
      mockPostChatTypesUseCase
    )

    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      code: vi.fn().mockReturnThis(),
    } as any

    mockRequest = {
      id: uuidv7(),
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      method: 'GET',
      routeOptions: { url: '/ai/chats/config' },
      headers: {
        'user-agent': 'test-user-agent',
      },
      user: {
        sub: new UserId(uuidv7()).getValue(),
        email: 'user@example.com',
      },
    } as any
  })

  describe('constructor', () => {
    it('should create instance with required dependencies', () => {
      const instance = new AIConfigController(
        mockLogger,
        mockGetChatDetailsUseCase,
        mockPutChatDetailsUseCase,
        mockPostChatTypesUseCase
      )

      expect(instance).toBeInstanceOf(AIConfigController)
      expect(instance).toBeDefined()
    })
  })

  describe('registerRoutes()', () => {
    it('should register GET /ai/chats/config route', () => {
      const mockApp = {
        get: vi.fn(),
        put: vi.fn(),
        post: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.get).toHaveBeenCalledWith(
        '/ai/chats/config',
        expect.objectContaining({ preHandler: expect.any(Array) }),
        expect.any(Function)
      )
    })

    it('should register PUT /ai/chats/config route', () => {
      const mockApp = {
        get: vi.fn(),
        put: vi.fn(),
        post: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.put).toHaveBeenCalledWith(
        '/ai/chats/config',
        expect.objectContaining({ preHandler: expect.any(Array) }),
        expect.any(Function)
      )
    })

    it('should register POST /ai/chats/config route', () => {
      const mockApp = {
        get: vi.fn(),
        put: vi.fn(),
        post: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.post).toHaveBeenCalledWith(
        '/ai/chats/config',
        expect.objectContaining({ preHandler: expect.any(Array) }),
        expect.any(Function)
      )
    })

    it('should register exactly 1 GET, 1 PUT, and 1 POST route', () => {
      const mockApp = {
        get: vi.fn(),
        put: vi.fn(),
        post: vi.fn(),
      } as unknown as FastifyInstance

      controller.registerRoutes(mockApp)

      expect(mockApp.get).toHaveBeenCalledTimes(1)
      expect(mockApp.put).toHaveBeenCalledTimes(1)
      expect(mockApp.post).toHaveBeenCalledTimes(1)
    })
  })

  describe('getAIChatDetails()', () => {
    describe('successful scenarios', () => {
      it('should fetch and return chat type details successfully', async () => {
        const mockChatTypes = [
          {
            id: uuidv7(),
            name: 'General Assistant',
            seoFriendlyId: 'general-assistant',
            seoFriendlyBase64Id: 'AbCdEfGhIjKlMnOpQrStUv',
            description: 'A general purpose AI assistant',
            rag: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: uuidv7(),
            name: 'Code Helper',
            seoFriendlyId: 'code-helper',
            seoFriendlyBase64Id: 'XyZaBcDeFgHiJkLmNoPqRs',
            description: 'Specialized in coding assistance',
            rag: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]

        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatDetailsUseCase.execute).mockResolvedValue(mockChatTypes)

        await controller.getAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockChatTypes,
        })
        expect(mockGetChatDetailsUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: expect.any(String),
            ipAddress: '127.0.0.xxx',
            userAgent: 'test-user-agent',
          })
        )
        expect(mockGetChatDetailsUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockLogger.debug).toHaveBeenCalledWith('Received getAIChatDetails request')
      })

      it('should return empty array when no chat types exist', async () => {
        const mockChatTypes: any[] = []

        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatDetailsUseCase.execute).mockResolvedValue(mockChatTypes)

        await controller.getAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: [],
        })
        expect(mockGetChatDetailsUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: expect.any(String),
            ipAddress: '127.0.0.xxx',
            userAgent: 'test-user-agent',
          })
        )
      })

      it('should handle authenticated user with null userId', async () => {
        const mockChatTypes = [
          {
            id: uuidv7(),
            name: 'Test Chat Type',
            seoFriendlyId: 'test-chat-type',
            seoFriendlyBase64Id: 'TeSt1234567890AbCdEfGh',
            description: 'Test description',
            rag: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]

        mockRequest.user = undefined // No user object
        vi.mocked(mockGetChatDetailsUseCase.execute).mockResolvedValue(mockChatTypes)

        await controller.getAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: mockChatTypes,
        })
        expect(mockGetChatDetailsUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: null,
            ipAddress: '127.0.0.xxx',
            userAgent: 'test-user-agent',
          })
        )
      })

      it('should handle request with null user-agent header', async () => {
        const mockChatTypes = [
          {
            id: uuidv7(),
            name: 'Test Chat Type',
            seoFriendlyId: 'test-chat-type',
            seoFriendlyBase64Id: 'TeSt1234567890AbCdEfGh',
            description: 'Test description',
            rag: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]

        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user@example.com',
          roles: ['user'],
        }
        mockRequest.headers['user-agent'] = undefined
        vi.mocked(mockGetChatDetailsUseCase.execute).mockResolvedValue(mockChatTypes)

        await controller.getAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(200)
        expect(mockGetChatDetailsUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: expect.any(String),
            ipAddress: '127.0.0.xxx',
            userAgent: null,
          })
        )
      })

      it('should include complete audit context in use case call', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const mockChatTypes = [
          {
            id: uuidv7(),
            name: 'Test',
            seoFriendlyId: 'test',
            seoFriendlyBase64Id: 'TeSt1234567890AbCdEfGh',
            description: 'Test',
            rag: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]

        mockRequest.user = {
          sub: userId,
          email: 'test@example.com',
          roles: ['admin'],
        }
        const customRequest = {
          ...mockRequest,
          ip: '192.168.1.1',
          headers: {
            ...mockRequest.headers,
            'user-agent': 'Mozilla/5.0',
          },
        } as any
        vi.mocked(mockGetChatDetailsUseCase.execute).mockResolvedValue(mockChatTypes)

        await controller.getAIChatDetails(customRequest, mockReply)

        expect(mockGetChatDetailsUseCase.execute).toHaveBeenCalledWith({
          userId,
          ipAddress: '192.168.1.xxx',
          userAgent: 'Mozilla/5.0',
        })
      })
    })

    describe('error handling', () => {
      it('should handle InternalErrorException with 500 status code', async () => {
        const internalError = new InternalErrorException('Internal server error occurred')

        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatDetailsUseCase.execute).mockRejectedValue(internalError)

        await controller.getAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Internal server error occurred',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error in getAIChatDetails',
          expect.any(Error)
        )
      })

      it('should handle generic errors with 500 status code', async () => {
        const genericError = new Error('Database connection failed')

        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatDetailsUseCase.execute).mockRejectedValue(genericError)

        await controller.getAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error in getAIChatDetails',
          expect.any(Error)
        )
      })

      it('should handle errors without message with default error message', async () => {
        const errorWithoutMessage = new Error()
        errorWithoutMessage.message = ''

        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatDetailsUseCase.execute).mockRejectedValue(errorWithoutMessage)

        await controller.getAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error in getAIChatDetails',
          expect.any(Error)
        )
      })

      it('should handle non-Error thrown values', async () => {
        const stringError = 'Something went wrong'

        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatDetailsUseCase.execute).mockRejectedValue(stringError)

        await controller.getAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error in getAIChatDetails',
          expect.any(Error)
        )
      })

      it('should return a safe error message when a DrizzleQueryError is thrown', async () => {
        const drizzleError = new DrizzleQueryError('SELECT 1', [])

        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatDetailsUseCase.execute).mockRejectedValue(drizzleError)

        await controller.getAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error in getAIChatDetails',
          expect.any(Error)
        )
      })

      it('should handle NotFoundException with 404 status code', async () => {
        const notFoundError = new NotFoundException('ChatType', 'test-id')

        mockRequest.user = {
          sub: new UserId(uuidv7()).getValue(),
          email: 'user@example.com',
          roles: ['user'],
        }
        vi.mocked(mockGetChatDetailsUseCase.execute).mockRejectedValue(notFoundError)

        await controller.getAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(404)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: "ChatType with identifier 'test-id' not found",
        })
      })
    })
  })

  describe('updateAIChatDetails()', () => {
    describe('successful scenarios', () => {
      it('should update chat type details successfully with all fields', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const requestBody = {
          id: chatTypeId,
          name: 'Updated Chat Type',
          seoFriendlyId: 'updated-chat-type',
          description: 'Updated description for the chat type',
        }
        const mockResult = { rowCount: 1 }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }
        vi.mocked(mockPutChatDetailsUseCase.execute).mockResolvedValue(mockResult as any)

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(204)
        expect(mockReply.send).toHaveBeenCalled()
        expect(mockPutChatDetailsUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            userId,
            ipAddress: '127.0.0.xxx',
            userAgent: 'test-user-agent',
          }),
          expect.objectContaining({
            id: expect.any(String),
            name: 'Updated Chat Type',
            seoFriendlyId: 'updated-chat-type',
            description: 'Updated description for the chat type',
          })
        )
        expect(mockLogger.debug).toHaveBeenCalledWith('Received updateAIChatDetails request')
      })

      it('should update chat type with only name field', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const requestBody = {
          id: chatTypeId,
          name: 'New Name Only',
        }
        const mockResult = { rowCount: 1 }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'moderator@example.com',
          roles: ['moderator'],
        }
        vi.mocked(mockPutChatDetailsUseCase.execute).mockResolvedValue(mockResult as any)

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(204)
        expect(mockPutChatDetailsUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            userId,
            ipAddress: '127.0.0.xxx',
            userAgent: 'test-user-agent',
          }),
          expect.objectContaining({
            id: expect.any(String),
            name: 'New Name Only',
          })
        )
      })

      it('should update chat type with moderator role', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const requestBody = {
          id: chatTypeId,
          description: 'Updated by moderator',
        }
        const mockResult = { rowCount: 1 }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'moderator@example.com',
          roles: ['moderator', 'user'],
        }
        vi.mocked(mockPutChatDetailsUseCase.execute).mockResolvedValue(mockResult as any)

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(204)
        expect(mockPutChatDetailsUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            userId,
            ipAddress: '127.0.0.xxx',
            userAgent: 'test-user-agent',
          }),
          expect.objectContaining({
            id: expect.any(String),
            description: 'Updated by moderator',
          })
        )
      })

      it('should handle request with null user-agent header', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const requestBody = {
          id: chatTypeId,
          name: 'Test Update',
        }
        const mockResult = { rowCount: 1 }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }
        mockRequest.headers['user-agent'] = undefined
        vi.mocked(mockPutChatDetailsUseCase.execute).mockResolvedValue(mockResult as any)

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.status).toHaveBeenCalledWith(204)
        expect(mockPutChatDetailsUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            userId,
            ipAddress: '127.0.0.xxx',
            userAgent: null,
          }),
          expect.any(Object)
        )
      })

      it('should include complete audit context in use case call', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const requestBody = {
          id: chatTypeId,
          name: 'Audit Test',
        }
        const mockResult = { rowCount: 1 }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }
        const customRequest = {
          ...mockRequest,
          ip: '192.168.1.100',
          headers: {
            ...mockRequest.headers,
            'user-agent': 'Mozilla/5.0',
          },
        } as any
        vi.mocked(mockPutChatDetailsUseCase.execute).mockResolvedValue(mockResult as any)

        await controller.updateAIChatDetails(customRequest, mockReply)

        expect(mockPutChatDetailsUseCase.execute).toHaveBeenCalledWith(
          {
            userId,
            ipAddress: '192.168.1.xxx',
            userAgent: 'Mozilla/5.0',
          },
          expect.any(Object)
        )
      })
    })

    describe('validation failures', () => {
      it('should return 400 when id is missing', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const requestBody = {
          name: 'No ID Update',
        }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid request body: id is required',
        })
        expect(mockPutChatDetailsUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 when id is not a valid UUID', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const requestBody = {
          id: 'invalid-uuid',
          name: 'Invalid ID Update',
        }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid id format: incorrect ChatId format',
        })
        expect(mockPutChatDetailsUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 when name exceeds maximum length', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const longName = 'a'.repeat(201)
        const requestBody = {
          id: chatTypeId,
          name: longName,
        }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid name: must be a string between 1 and 200 characters',
        })
        expect(mockPutChatDetailsUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 when description exceeds maximum length', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const longDescription = 'a'.repeat(501)
        const requestBody = {
          id: chatTypeId,
          description: longDescription,
        }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid description: must be a string between 1 and 500 characters',
        })
        expect(mockPutChatDetailsUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 when name is not a string', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const requestBody = {
          id: chatTypeId,
          name: 12345,
        }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid name: must be a string',
        })
        expect(mockPutChatDetailsUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 500 when request body is not an object', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = 'not an object'
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid data: expected an object',
        })
        expect(mockPutChatDetailsUseCase.execute).not.toHaveBeenCalled()
      })
    })

    describe('not found scenarios', () => {
      it('should return 404 when chat type is not found', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const requestBody = {
          id: chatTypeId,
          name: 'Non-existent Chat Type',
        }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }
        vi.mocked(mockPutChatDetailsUseCase.execute).mockResolvedValue(null)

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(404)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'AI chat type not found or update failed',
        })
        expect(mockPutChatDetailsUseCase.execute).toHaveBeenCalled()
      })

      it('should return 404 when update operation fails', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const requestBody = {
          id: chatTypeId,
          name: 'Failed Update',
        }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }
        vi.mocked(mockPutChatDetailsUseCase.execute).mockResolvedValue(null)

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(404)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'AI chat type not found or update failed',
        })
      })
    })

    describe('error handling', () => {
      it('should handle InternalErrorException with 500 status code', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const internalError = new InternalErrorException('Database error occurred')
        const requestBody = {
          id: chatTypeId,
          name: 'Error Test',
        }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }
        vi.mocked(mockPutChatDetailsUseCase.execute).mockRejectedValue(internalError)

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Database error occurred',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error in updateAIChatDetails',
          expect.any(Error)
        )
      })

      it('should handle generic errors with 500 status code', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const genericError = new Error('Unexpected error')
        const requestBody = {
          id: chatTypeId,
          name: 'Generic Error Test',
        }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }
        vi.mocked(mockPutChatDetailsUseCase.execute).mockRejectedValue(genericError)

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error in updateAIChatDetails',
          expect.any(Error)
        )
      })

      it('should handle errors without message with default error message', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const errorWithoutMessage = new Error()
        errorWithoutMessage.message = ''
        const requestBody = {
          id: chatTypeId,
          name: 'Empty Error Message Test',
        }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }
        vi.mocked(mockPutChatDetailsUseCase.execute).mockRejectedValue(errorWithoutMessage)

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error in updateAIChatDetails',
          expect.any(Error)
        )
      })

      it('should handle NotFoundException with 404 status code', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const notFoundError = new NotFoundException('ChatType', chatTypeId)
        const requestBody = {
          id: chatTypeId,
          name: 'Not Found Test',
        }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }
        vi.mocked(mockPutChatDetailsUseCase.execute).mockRejectedValue(notFoundError)

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(404)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: `ChatType with identifier '${chatTypeId}' not found`,
        })
      })

      it('should handle non-Error thrown values', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const stringError = 'String error message'
        const requestBody = {
          id: chatTypeId,
          name: 'String Error Test',
        }

        mockRequest.body = requestBody
        mockRequest.user = {
          sub: userId,
          email: 'admin@example.com',
          roles: ['admin'],
        }
        vi.mocked(mockPutChatDetailsUseCase.execute).mockRejectedValue(stringError)

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error in updateAIChatDetails',
          expect.any(Error)
        )
      })

      it('should return a safe error message when a DrizzleQueryError is thrown', async () => {
        const chatTypeId = uuidv7()
        const userId = new UserId(uuidv7()).getValue()
        const drizzleError = new DrizzleQueryError(
          'UPDATE chat_types SET name = $1 WHERE id = $2',
          []
        )
        const requestBody = { id: chatTypeId, name: 'Drizzle Error Test' }

        mockRequest.body = requestBody
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }
        vi.mocked(mockPutChatDetailsUseCase.execute).mockRejectedValue(drizzleError)

        await controller.updateAIChatDetails(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error in updateAIChatDetails',
          expect.any(Error)
        )
      })
    })
  })

  describe('createAIChatType()', () => {
    describe('successful scenarios', () => {
      it('should create a chat type successfully and respond with 201', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const mockCreatedChatType = {
          id: uuidv7(),
          name: 'General Assistant',
          description: 'A general-purpose AI assistant',
          rag: false,
          seoFriendlyId: 'general-assistant',
          seoFriendlyBase64Id: 'AAAAAAAAAAAAAAAAAAAAAA',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        mockRequest.body = {
          name: 'General Assistant',
          description: 'A general-purpose AI assistant',
          rag: false,
        }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }
        vi.mocked(mockPostChatTypesUseCase.execute).mockResolvedValue(mockCreatedChatType as any)

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(201)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: true,
          data: {
            id: mockCreatedChatType.id,
            name: mockCreatedChatType.name,
            description: mockCreatedChatType.description,
            rag: mockCreatedChatType.rag,
            seoFriendlyId: mockCreatedChatType.seoFriendlyId,
            seoFriendlyBase64Id: mockCreatedChatType.seoFriendlyBase64Id,
            createdAt: mockCreatedChatType.createdAt,
            updatedAt: mockCreatedChatType.updatedAt,
          },
        })
      })

      it('should log the debug message on entry', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = { name: 'Test Type', description: 'A test chat type', rag: false }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }
        vi.mocked(mockPostChatTypesUseCase.execute).mockResolvedValue({ rowCount: 1 } as any)

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockLogger.debug).toHaveBeenCalledWith('Received createAIChatType request')
      })

      it('should call execute with correct audit context', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const customRequest = {
          ...mockRequest,
          body: { name: 'Audit Test', description: 'Testing audit context', rag: false },
          user: { sub: userId, email: 'admin@example.com', roles: ['admin'] },
          ip: '10.0.0.1',
          headers: { 'user-agent': 'Mozilla/5.0 (Test)' },
        } as any
        vi.mocked(mockPostChatTypesUseCase.execute).mockResolvedValue({ rowCount: 1 } as any)

        await controller.createAIChatType(customRequest, mockReply)

        expect(mockPostChatTypesUseCase.execute).toHaveBeenCalledWith(
          { userId, ipAddress: '10.0.0.xxx', userAgent: 'Mozilla/5.0 (Test)' },
          expect.objectContaining({ name: 'Audit Test', description: 'Testing audit context' })
        )
      })

      it('should call execute with null userAgent when user-agent header is absent', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = { name: 'No Agent', description: 'No user-agent header', rag: false }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }
        mockRequest.headers = {}
        vi.mocked(mockPostChatTypesUseCase.execute).mockResolvedValue({ rowCount: 1 } as any)

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockPostChatTypesUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ userAgent: null }),
          expect.any(Object)
        )
      })

      it('should call execute with null userId when request.user is absent', async () => {
        mockRequest.body = {
          name: 'Unauthenticated',
          description: 'No user on request',
          rag: false,
        }
        mockRequest.user = undefined as any
        vi.mocked(mockPostChatTypesUseCase.execute).mockResolvedValue({ rowCount: 1 } as any)

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockPostChatTypesUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ userId: null }),
          expect.any(Object)
        )
      })

      it('should pass trimmed name and description to the use case', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = {
          name: '  Creative Writing  ',
          description: '  Helps with writing  ',
          rag: false,
        }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }
        vi.mocked(mockPostChatTypesUseCase.execute).mockResolvedValue({ rowCount: 1 } as any)

        await controller.createAIChatType(mockRequest, mockReply)

        // PostChatType.validate() trims values before passing to use case
        expect(mockPostChatTypesUseCase.execute).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({ name: 'Creative Writing', description: 'Helps with writing' })
        )
      })
    })

    describe('validation failures', () => {
      it('should return 400 when name is missing', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = { description: 'No name provided' }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid name: must be a non-empty string',
        })
        expect(mockPostChatTypesUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 when name is an empty string', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = { name: '', description: 'Has description' }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid name: must be a non-empty string',
        })
        expect(mockPostChatTypesUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 when name is whitespace only', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = { name: '   ', description: 'Has description' }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid name: must be a non-empty string',
        })
        expect(mockPostChatTypesUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 when description is missing', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = { name: 'Valid Name' }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid description: must be a non-empty string',
        })
        expect(mockPostChatTypesUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 when description is an empty string', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = { name: 'Valid Name', description: '' }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid description: must be a non-empty string',
        })
        expect(mockPostChatTypesUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 when name exceeds 200 characters', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = { name: 'a'.repeat(201), description: 'Valid description', rag: false }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid name: must be less than 200 characters',
        })
        expect(mockPostChatTypesUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 400 when description exceeds 500 characters', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = { name: 'Valid Name', description: 'a'.repeat(501), rag: false }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(400)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid description: must be less than 500 characters',
        })
        expect(mockPostChatTypesUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 500 when body is not an object', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = 'not an object'
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid data: expected an object',
        })
        expect(mockPostChatTypesUseCase.execute).not.toHaveBeenCalled()
      })

      it('should return 500 when body is null', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = null
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid data: expected an object',
        })
        expect(mockPostChatTypesUseCase.execute).not.toHaveBeenCalled()
      })
    })

    describe('error handling', () => {
      it('should return 500 on generic error from use case', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = { name: 'Error Case', description: 'Will throw', rag: false }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }
        vi.mocked(mockPostChatTypesUseCase.execute).mockRejectedValue(
          new Error('DB connection lost')
        )

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error in createAIChatType',
          expect.any(Error)
        )
      })

      it('should return 500 on InternalErrorException from use case', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = {
          name: 'Internal Error',
          description: 'Will throw internal error',
          rag: false,
        }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }
        vi.mocked(mockPostChatTypesUseCase.execute).mockRejectedValue(
          new InternalErrorException('Unexpected failure')
        )

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'Unexpected failure',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error in createAIChatType',
          expect.any(Error)
        )
      })

      it('should return 404 on NotFoundException from use case', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const id = uuidv7()

        mockRequest.body = { name: 'Not Found', description: 'Will throw not found', rag: false }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }
        vi.mocked(mockPostChatTypesUseCase.execute).mockRejectedValue(
          new NotFoundException('ChatType', id)
        )

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(404)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: `ChatType with identifier '${id}' not found`,
        })
      })

      it('should return 409 on ConflictException from use case', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = {
          name: 'Duplicate Type',
          description: 'Will throw conflict',
          rag: false,
        }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }
        vi.mocked(mockPostChatTypesUseCase.execute).mockRejectedValue(
          new ConflictException('A chat type with this name or identifier already exists')
        )

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(409)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'A chat type with this name or identifier already exists',
        })
      })

      it('should use fallback error message when error has no message', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const emptyError = new Error()
        emptyError.message = ''

        mockRequest.body = { name: 'Empty Error', description: 'Empty error message', rag: false }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }
        vi.mocked(mockPostChatTypesUseCase.execute).mockRejectedValue(emptyError)

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error in createAIChatType',
          expect.any(Error)
        )
      })

      it('should return 500 when a non-Error value is thrown', async () => {
        const userId = new UserId(uuidv7()).getValue()

        mockRequest.body = { name: 'String Throw', description: 'Throws a string', rag: false }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }
        vi.mocked(mockPostChatTypesUseCase.execute).mockRejectedValue('something went wrong')

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error in createAIChatType',
          expect.any(Error)
        )
      })

      it('should return a safe error message when a DrizzleQueryError is thrown', async () => {
        const userId = new UserId(uuidv7()).getValue()
        const drizzleError = new DrizzleQueryError('INSERT INTO chat_types (name) VALUES ($1)', [])

        mockRequest.body = { name: 'Drizzle Type', description: 'Drizzle error test', rag: false }
        mockRequest.user = { sub: userId, email: 'admin@example.com', roles: ['admin'] }
        vi.mocked(mockPostChatTypesUseCase.execute).mockRejectedValue(drizzleError)

        await controller.createAIChatType(mockRequest, mockReply)

        expect(mockReply.code).toHaveBeenCalledWith(500)
        expect(mockReply.send).toHaveBeenCalledWith({
          success: false,
          error: 'An unexpected error occurred',
        })
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error in createAIChatType',
          expect.any(Error)
        )
      })
    })
  })
})
