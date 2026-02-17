import type { LoggerPort } from '../../../application/ports/logger.port.js'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
  validateUIMessages,
} from 'ai'
import { google } from '@ai-sdk/google'
import { AppendedChatUseCase } from '../../../application/use-cases/append-chat.use-case.js'
import { EnvConfig } from '../../../infrastructure/config/env.config.js'
import { HeartOfDarknessTool } from '../../../infrastructure/ai/tools/heart-of-darkness.tool.js'
import { SaveChatUseCase } from '../../../application/use-cases/save-chat.use-case.js'
import { GetChatUseCase } from '../../../application/use-cases/get-chat.use-case.js'
import { GetChatDetailsUseCase } from '../../../application/use-cases/get-chat-details.use-case.js'
import { GetChatContentByChatIdUseCase } from '../../../application/use-cases/get-chat-content-by-chat-id.use-case.js'
import { ChatId, type ChatIdType } from '../../../domain/value-objects/chatID.js'
import { UserId, type UserIdType } from '../../../domain/value-objects/userID.js'
import { GetChatsByUserIdUseCase } from '../../../application/use-cases/get-chats-by-userid.use-case.js'
import { mapDBPartToUIMessagePart } from '../../../shared/mapper/index.js'
import { requireRole } from '../../../infrastructure/http/middleware/role.middleware.js'
import { BaseException } from '../../../shared/exceptions/base.exception.js'
import { GetChatAiOptionsUseCase } from '../../../application/use-cases/get-chat-ai-options.use-case.js'
import { ResolveChatTypeUseCase } from '../../../application/use-cases/resolve-chat-type.use-case.js'
import { PutChatTypeDto } from '../../../application/dtos/put-chat-type.dto.js'
import { PutChatDetailsUseCase } from '../../../application/use-cases/put-chat-details.use-case.js'

export class AIController {
  private readonly heartOfDarknessTool: HeartOfDarknessTool

  constructor(
    private readonly getChatUseCase: GetChatUseCase,
    private readonly logger: LoggerPort,
    private readonly appendChatUseCase: AppendedChatUseCase,
    private readonly saveChatUseCase: SaveChatUseCase,
    private readonly getChatsByUserIdUseCase: GetChatsByUserIdUseCase,
    private readonly getChatContentByChatIdUseCase: GetChatContentByChatIdUseCase,
    private readonly getChatDetailsUseCase: GetChatDetailsUseCase,
    private readonly getChatAiOptionsUseCase: GetChatAiOptionsUseCase,
    private readonly resolveChatTypeUseCase: ResolveChatTypeUseCase,
    private readonly putChatDetailsUseCase: PutChatDetailsUseCase
  ) {
    this.heartOfDarknessTool = new HeartOfDarknessTool(this.logger)
  }

  registerRoutes(app: FastifyInstance): void {
    app.post(
      '/ai/chat',
      {
        preHandler: [authMiddleware],
      },
      this.chat.bind(this)
    )
    app.get(
      '/ai/chats/:userId',
      {
        preHandler: [authMiddleware],
      },
      this.getAIChatsByUserId.bind(this)
    )
    app.get(
      '/ai/fetchChat/:chatId',
      {
        preHandler: [authMiddleware],
      },
      this.getAIChatByChatId.bind(this)
    )
    app.get(
      '/ai/chats/config',
      {
        preHandler: [authMiddleware],
      },
      this.getAIChatDetails.bind(this)
    )
    app.put(
      '/ai/chats/config',
      {
        preHandler: [authMiddleware, requireRole(['admin', 'moderator'])],
      },
      this.updateAIChatDetails.bind(this)
    )
  }

  /**
   * Handles AI chat requests
   * The flow of chat is as follows: return FastifyUtil.createResponse('Last message must be from the user', 400)
   * 1. Validate the request body against the AIReturnedResponseSchema
   * 2. Retrieve the chat using the GetChatUseCase
   * 3. Validate that the most recent message is from the user
   * 4. If the chat does not exist, create a new chat
   * 5. If the chat exists, append the most recent message to the chat
   * 6. Run the streamText from the ai NPM package to get the AI response
   *
   * @returns {Promise<void>}
   *
   * @param request
   * @param reply
   */
  async chat(request: FastifyRequest, reply: FastifyReply) {
    this.logger.debug('Received chat request')

    // Note: consider validating the request body schema
    // Note: consider implementing rate limiting per user
    // Note: manually test various failure modes

    // Extract audit context from request
    const auditContext = {
      userId: request.user?.sub ?? null,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    }

    let messages: UIMessage[]
    let id: string
    let trigger: string

    try {
      const body = request.body as any

      this.logger.info('Request body:', {
        id: body?.id,
        trigger: body?.trigger,
        chatTypeParam: body?.chatTypeParam,
        chatTypeId: body?.chatTypeId,
        messages: body?.messages,
      })

      // Validate messages using validateUIMessages from 'ai' package
      messages = await validateUIMessages({
        messages: body?.messages || [],
      })

      // Extract id and trigger from body
      id = body?.id

      trigger = body?.trigger

      if (!id || !trigger) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid request body',
          details: 'id and trigger are required',
        })
      }

      try {
        id = new ChatId(id).getValue()
      } catch {
        return reply.code(400).send({
          success: false,
          error: 'Invalid id format',
          details: 'incorrect ChatId format',
        })
      }

      this.logger.debug('Validated messages', { messageCount: messages.length, id, trigger })
      this.logger.debug('Validated messages content:', messages)
    } catch (e) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid request body',
        details: e instanceof Error ? e.message : e,
      })
    }

    if (!request.user?.sub) {
      return reply.code(401).send({
        success: false,
        error: 'User not authenticated',
      })
    }

    // Conversion of string request.user.sub id to UserIdType branded type
    // happens in middleware so no need to instantiate a new UserId here
    const userId = request.user.sub
    const chatId = id as ChatIdType

    // Resolve chatTypeId from URI parameter (chatTypeParam) or fallback to body.chatTypeId
    // The chatTypeParam can be any of: UUID id, seo_friendly_id, or seo_friendly_base64_id
    const requestBody = request.body as any
    const chatTypeParam = requestBody?.chatTypeParam as string | undefined
    const bodyChatTypeId = requestBody?.chatTypeId as string | undefined

    // Early validation: ensure at least one chat type identifier is provided
    if (!bodyChatTypeId && !chatTypeParam) {
      return reply.code(400).send({
        success: false,
        error: 'Chat type identification required',
        details: 'Provide chatTypeParam or chatTypeId in the request body',
      })
    }

    let chatTypeId: ChatIdType

    if (chatTypeParam) {
      const resolved = await this.resolveChatTypeUseCase.execute(chatTypeParam, auditContext)

      if (!resolved) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid chat type parameter',
          details: `Could not resolve chat type from: ${chatTypeParam}`,
        })
      }

      try {
        chatTypeId = new ChatId(resolved).getValue()
      } catch {
        return reply.code(400).send({
          success: false,
          error: 'Invalid resolved chat type ID',
        })
      }
    } else if (bodyChatTypeId) {
      try {
        chatTypeId = new ChatId(bodyChatTypeId).getValue()
      } catch {
        return reply.code(400).send({
          success: false,
          error: 'Invalid chatTypeId format',
          details: 'chatTypeId must be a valid UUID v7',
        })
      }
    } else {
      // This should never happen due to early validation, but satisfies TypeScript
      return reply.code(500).send({
        success: false,
        error: 'Internal error: chat type resolution failed',
      })
    }

    this.logger.debug('Processing chat request', {
      chatId,
      chatTypeId,
      userId,
      messageCount: messages.length,
    })

    // Filter out system messages as they're not stored in the database
    const userAndAssistantMessages = messages.filter(
      (msg) => msg.role === 'user' || msg.role === 'assistant'
    ) as any[]

    const chat = await this.getChatUseCase.execute(chatId, userAndAssistantMessages, auditContext)

    this.logger.info('Received chat', { chat: chat ?? null })

    const mostRecentMessage = messages[messages.length - 1]

    if (!mostRecentMessage) {
      return reply.code(400).send({
        success: false,
        error: 'No messages provided',
      })
    }

    if (mostRecentMessage.role !== 'user') {
      return reply.code(400).send({
        success: false,
        error: 'Last message must be from the user',
      })
    }

    if (!chat) {
      this.logger.info('Chat does not exist, creating new chat', { id })
      await this.saveChatUseCase.execute(chatId, userId, chatTypeId, messages, auditContext)
    } else {
      await this.appendChatUseCase.execute(chatId, [mostRecentMessage as UIMessage], auditContext)
      this.logger.info('Chat exists, appending most recent message', { id })
    }

    if (!EnvConfig.MODEL_NAME) {
      this.logger.error('MODEL_NAME environment variable is not configured')
      return reply.code(500).send({
        success: false,
        error: 'AI service configuration error',
      })
    }

    const systemPrompt = await this.getChatAiOptionsUseCase.execute(auditContext, chatTypeId)
    if (!systemPrompt) {
      this.logger.error('System prompt could not be retrieved', undefined, { chatTypeId, userId })
      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve AI configuration',
      })
    }

    const result = streamText({
      model: google(EnvConfig.MODEL_NAME),
      messages: await convertToModelMessages(messages as UIMessage[]),
      system: systemPrompt.prompt,
      experimental_telemetry: {
        isEnabled: EnvConfig.SENTRY_ENABLED === 'true',
        recordInputs: true,
        recordOutputs: true,
      },
      tools: {
        heartOfDarknessQA: this.heartOfDarknessTool.getTool(),
      },
      stopWhen: [stepCountIs(5)],
      onChunk({ chunk }) {
        // Called for each partial piece of output
        if (chunk.type === 'text-delta') {
          process.stdout.write(chunk.text)
          // For debugging, prefer using the application logger at debug level instead of stdout,
          // and ensure such logging is disabled or minimized in production.
          // Example:
          // logger.debug({ text: chunk.text }, 'AI stream text-delta chunk')        }
          // you can also inspect chunk.reasoning / chunk.sources / etc.
        }
        // you can also inspect chunk.reasoning / chunk.sources / etc.
      },
      onFinish: ({ text, finishReason, usage, response, totalUsage }) => {
        // Called once when the full output is complete
        // The reason the model finished generating the text.
        // "stop" | "length" | "content-filter" | "tool-calls" | "error" | "other" | "unknown"
        this.logger.debug('Stream finished', { finishReason })
        this.logger.debug('Stream usage info', { usage, totalUsage })
        this.logger.debug('streamText.onFinish')

        // Model messages (AssistantModelMessage or ToolModelMessage)
        // Minimal information, no UI data
        // Not suitable for UI applications
        this.logger.debug('Stream messages', { messages: JSON.stringify(messages) })
        // 'response.messages' is an array of ToolModelMessage and AssistantModelMessage,
        // which are the model messages that were generated during the stream.
        // This is useful if you don't need UIMessages - for simpler applications.
        this.logger.debug('Stream response', { response: JSON.stringify(response) })
      },
      onError: ({ error }) => {
        this.logger.error('Stream error', error as Error)
      },
    })

    return result.toUIMessageStreamResponse({
      originalMessages: messages as UIMessage[],
      onFinish: async ({ messages, responseMessage }) => {
        // 'messages' is the full message history, including the original messages
        // Includes original user message and assistant's response with all parts
        // Ideal for persisting entire conversations
        this.logger.debug('toUIMessageStreamResponse.onFinish', {
          chatId: id,
          messageCount: Array.isArray(messages) ? messages.length : undefined,
        })

        // Single message
        // Just the newly generated assistant message
        // Good for persisting only the latest response
        this.logger.debug('Response message', { responseMessage })
        await this.appendChatUseCase.execute(chatId, [responseMessage], auditContext)
      },
    })
  }

  /**
   * Retrieves all chat IDs associated with a specific user.
   *
   * This endpoint implements authorization checks to ensure users can only access their own chat history
   * unless they have admin or moderator privileges. The authorization flow is:
   * 1. User can access their own chat history (userId matches authenticated user's ID)
   * 2. Admin or moderator can access any user's chat history
   *
   * @param request - The Fastify request object containing the userId parameter and authenticated user info
   * @param reply - The Fastify reply object for sending responses
   * @returns A promise that resolves to an array of ChatIdType or void if an error response is sent
   *
   * @throws {400} When userId parameter is missing or has invalid format (not a valid UUID v7)
   * @throws {401} When user is not authenticated
   * @throws {403} When user attempts to access another user's chat history without admin/moderator role
   * @throws {500} When an error occurs while fetching chats from the repository
   *
   * @example
   * ```typescript
   * // Route: GET /ai/chats/:userId
   * // Example request: GET /ai/chats/01935e8a-7890-7123-b456-123456789abc
   * // Example response:
   * // {
   * //   "success": true,
   * //   "data": ["01935e8a-1234-7abc-b456-111111111111", "01935e8a-5678-7def-b456-222222222222"]
   * // }
   * ```
   */

  async getAIChatsByUserId(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.logger.debug('Received getAIChatsByUserId request')

    // Extract audit context from request
    const auditContext = {
      userId: request.user?.sub ?? null,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    }

    const params = request.params as Record<string, unknown>
    const userIdParam = params.userId as string

    if (!userIdParam) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid userId parameter',
      })
    }

    let userId: UserIdType

    try {
      userId = new UserId(userIdParam).getValue()
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Invalid userId format in getAIChatsByUserId: ${userIdParam}`, error)
      }
      return reply.code(400).send({
        success: false,
        error: 'Invalid userId format',
      })
    }

    // Authorization check: User can only access their own chat history unless they have admin/moderator role
    const authenticatedUserId = request.user?.sub
    const userRoles = request.user?.roles || []

    if (!authenticatedUserId) {
      this.logger.warn('Authorization check failed: User not authenticated')
      return reply.code(401).send({
        success: false,
        error: 'Authentication required',
      })
    }

    // Check if user is accessing their own data OR has admin/moderator role
    const isOwnData = authenticatedUserId === userId
    const hasElevatedRole = userRoles.includes('admin') || userRoles.includes('moderator')

    if (!isOwnData && !hasElevatedRole) {
      this.logger.warn(
        `Authorization check failed: User ${authenticatedUserId} attempted to access chats for user ${userId} without required permissions`
      )
      return reply.code(403).send({
        success: false,
        error:
          'Access denied. You can only access your own chat history or must have admin/moderator role',
      })
    }

    try {
      const chatIds = await this.getChatsByUserIdUseCase.execute(userId, auditContext)
      reply.code(200).send({
        success: true,
        data: chatIds,
      })
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error while fetching chats for userId in getAIChatsByUserId: ${userId}`,
          error
        )
      }
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      })
    }
  }

  /**
   * Retrieves all available chat types with their details and SEO-friendly identifiers.
   *
   * This endpoint fetches all chat type options from the database, ensuring each has
   * complete SEO-friendly fields (slug and base64 ID). The chat types are returned
   * in descending order by creation date. This endpoint requires authentication and
   * admin or moderator role and is typically used to populate chat type selection interfaces.
   *
   * The response includes:
   * - Chat type ID (UUIDv7)
   * - Name and description
   * - SEO-friendly ID (URL-safe slug)
   * - SEO-friendly base64 ID (22-character encoded UUID)
   * - Creation and update timestamps
   *
   * @param {FastifyRequest} request - The Fastify request object containing optional user information
   * @param {FastifyReply} reply - The Fastify reply object for sending responses
   *
   * @returns {Promise<void>} A promise that resolves when the response is sent
   *
   * @example
   * Response format:
   * ```json
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "019bda39-6197-7557-9071-d7ed1c719138",
   *       "name": "General Assistant",
   *       "description": "A general purpose AI assistant",
   *       "seoFriendlyId": "general-assistant",
   *       "seoFriendlyBase64Id": "AbCdEfGhIjKlMnOpQrStUv",
   *       "createdAt": "2024-01-01T00:00:00.000Z",
   *       "updatedAt": "2024-01-01T00:00:00.000Z"
   *     }
   *   ]
   * }
   * ```
   *
   * @throws {BaseException} When a domain-specific error occurs (returns appropriate status code)
   * @throws {Error} When an unexpected error occurs (returns 500 status code)
   */
  async getAIChatDetails(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.logger.debug('Received getAIChatDetails request')
    // Extract audit context from request
    const auditContext = {
      userId: request.user?.sub ?? null,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    }

    try {
      const result = await this.getChatDetailsUseCase.execute(auditContext)

      this.logger.debug(JSON.stringify(result))

      reply.code(200).send({
        success: true,
        data: result,
      })
    } catch (error) {
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage = err?.message || 'Failed to fetch chat details'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }

  async updateAIChatDetails(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.logger.debug('Received updateAIChatDetails request')
    // Extract audit context from request
    const auditContext = {
      userId: request.user?.sub ?? null,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    }

    // Authorization check: Only admin/moderator roles can update company details
    const authenticatedUserId = request.user?.sub
    const userRoles = request.user?.roles || []

    if (!authenticatedUserId) {
      this.logger.warn('Authorization check failed: User not authenticated')
      return reply.code(401).send({
        success: false,
        error: 'Authentication required',
      })
    }

    // Check if user has admin/moderator role
    const hasElevatedRole = userRoles.includes('admin') || userRoles.includes('moderator')

    if (!hasElevatedRole) {
      this.logger.warn(
        `Authorization check failed: User ${authenticatedUserId} attempted to update chat types without admin/moderator role`
      )
      return reply.code(403).send({
        success: false,
        error: 'Access denied. Admin or moderator role required to update chat types',
      })
    }

    try {
      const body = request.body as any
      const dto = PutChatTypeDto.validate(body)
      const result = await this.putChatDetailsUseCase.execute(auditContext, dto)
      if (!result) {
        reply.code(404).send({
          success: false,
          error: 'AI chat type not found or update failed',
        })
        return
      }
      if (result) {
        reply.status(204).send()
      }
    } catch (error) {
      const err = error as Error
      const statusCode = err instanceof BaseException ? err.statusCode : 500
      const errorMessage = err?.message || 'An unexpected error occurred'
      reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      })
    }
  }

  /**
   * Retrieves a specific chat with all its messages and parts by chatId.
   *
   * This endpoint fetches the complete chat history including all messages and their
   * associated parts (text, tool calls, etc.) in the UI format expected by the frontend.
   * Authorization is performed by fetching the chat and validating that the authenticated
   * user owns the chat or has admin/moderator privileges.
   *
   * @param request - The Fastify request object containing the chatId parameter
   * @param reply - The Fastify reply object for sending responses
   * @returns A promise that resolves to the chat data with messages and parts
   *
   * @throws {400} When chatId parameter is missing or has invalid format (not a valid UUID v7)
   * @throws {401} When user is not authenticated
   * @throws {404} When no chat is found with the given chatId, or when the chat belongs to
   *               a different user and the authenticated user doesn't have admin/moderator role
   * @throws {500} When an error occurs while fetching the chat from the repository
   */
  async getAIChatByChatId(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.logger.debug('Received getAIChatByChatId request')

    // Extract audit context from request
    const auditContext = {
      userId: request.user?.sub ?? null,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    }

    const params = request.params as Record<string, unknown>
    const chatIdParam = params.chatId as string

    if (!chatIdParam) {
      return reply.code(400).send({
        success: false,
        error: 'Missing chatId parameter',
      })
    }

    let chatId: ChatIdType

    try {
      chatId = new ChatId(chatIdParam).getValue()
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Invalid chatId format in getAIChatByChatId: ${chatIdParam}`, error)
      }
      return reply.code(400).send({
        success: false,
        error: 'Invalid chatId format',
      })
    }

    // Check authentication
    const authenticatedUserId = request.user?.sub
    if (!authenticatedUserId) {
      this.logger.warn('Authorization check failed: User not authenticated')
      return reply.code(401).send({
        success: false,
        error: 'Authentication required',
      })
    }

    try {
      // Fetch the chat data which includes the userId
      const chatData = await this.getChatContentByChatIdUseCase.execute(chatId, auditContext)

      if (!chatData || chatData.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Chat not found',
        })
      }

      // Extract userId from the chat record (all rows have the same chat info)
      const chatUserId = chatData[0]?.chat?.userId
      if (!chatUserId) {
        this.logger.error(`Chat data missing userId for chatId: ${chatId}`)
        return reply.code(500).send({
          success: false,
          error: 'Invalid chat data',
        })
      }

      const userRoles = request.user?.roles || []

      // Authorization check: User can access if they own the chat OR have admin/moderator role
      const isOwnChat = authenticatedUserId === chatUserId
      const hasElevatedRole = userRoles.includes('admin') || userRoles.includes('moderator')

      if (!isOwnChat && !hasElevatedRole) {
        this.logger.warn(
          `Authorization check failed: User ${authenticatedUserId} attempted to access chat ${chatId} owned by user ${chatUserId} without required permissions`
        )
        // Return 404 instead of 403 to not leak information about chat existence
        return reply.code(404).send({
          success: false,
          error: 'Chat not found',
        })
      }

      // Transform the database response into UIMessage format
      // Group parts by message ID
      const messagesMap = new Map<
        string,
        {
          id: string
          role: string
          createdAt: Date
          parts: ReturnType<typeof mapDBPartToUIMessagePart>[]
        }
      >()

      for (const row of chatData) {
        const messageId = row.message.id

        if (!messagesMap.has(messageId)) {
          messagesMap.set(messageId, {
            id: messageId,
            role: row.message.role,
            createdAt: row.message.createdAt,
            parts: [],
          })
        }

        // Add part if it exists (left join may return null parts)
        if (row.part) {
          const uiPart = mapDBPartToUIMessagePart(row.part)
          messagesMap.get(messageId)!.parts.push(uiPart)
        }
      }

      // Sort parts within each message by order (parts should have order field)
      // and convert map to array sorted by createdAt
      const messages = Array.from(messagesMap.values())
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((msg) => ({
          id: msg.id,
          role: msg.role,
          parts: msg.parts,
        }))

      reply.code(200).send({
        success: true,
        data: {
          id: chatId,
          messages,
        },
      })
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error while fetching chat in getAIChatByChatId: ${chatId}`, error)
      }
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      })
    }
  }
}
