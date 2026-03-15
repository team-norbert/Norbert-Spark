import { google } from '@ai-sdk/google'
import type { components, operations } from '@norberts-spark/shared/openapi-types'
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
  validateUIMessages,
} from 'ai'
import { createHash } from 'crypto'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { PostChatDto } from '../../../application/dtos/post-chat.dto.js'
import type { AuditLogPort } from '../../../application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { AppendedChatUseCase } from '../../../application/use-cases/append-chat.use-case.js'
import { GetChatUseCase } from '../../../application/use-cases/get-chat.use-case.js'
import { GetChatAiOptionsUseCase } from '../../../application/use-cases/get-chat-ai-options.use-case.js'
import { GetChatContentByChatIdUseCase } from '../../../application/use-cases/get-chat-content-by-chat-id.use-case.js'
import { GetChatsByUserIdUseCase } from '../../../application/use-cases/get-chats-by-userid.use-case.js'
import { ResolveChatTypeUseCase } from '../../../application/use-cases/resolve-chat-type.use-case.js'
import { SaveChatUseCase } from '../../../application/use-cases/save-chat.use-case.js'
import { AuditAction, EntityType } from '../../../domain/audit/entity-type.enum.js'
import { ChatId, type ChatIdType } from '../../../domain/value-objects/chatID.js'
import { UserId, type UserIdType } from '../../../domain/value-objects/userID.js'
import type { UUIDType } from '../../../domain/value-objects/uuid.js'
import { HeartOfDarknessTool } from '../../../infrastructure/ai/tools/heart-of-darkness.tool.js'
import { EnvConfig } from '../../../infrastructure/config/env.config.js'
import { authMiddleware } from '../../../infrastructure/http/middleware/auth.middleware.js'
import { ValidationException } from '../../../shared/exceptions/validation.exception.js'
import { mapDBPartToUIMessagePart } from '../../../shared/mapper/index.js'
import type { AuditContextType } from '../../../shared/types/index.js'
import { createAuditContext } from '../../../shared/types/index.js'
import { safelyMaskIp } from '../../../shared/utils/mask-ip.js'
import { Sanitise } from '../../../shared/utils/sanitise.utils.js'

export class AIController {
  private readonly heartOfDarknessTool: HeartOfDarknessTool

  constructor(
    private readonly getChatUseCase: GetChatUseCase,
    private readonly logger: LoggerPort,
    private readonly appendChatUseCase: AppendedChatUseCase,
    private readonly saveChatUseCase: SaveChatUseCase,
    private readonly getChatsByUserIdUseCase: GetChatsByUserIdUseCase,
    private readonly getChatContentByChatIdUseCase: GetChatContentByChatIdUseCase,
    private readonly getChatAiOptionsUseCase: GetChatAiOptionsUseCase,
    private readonly resolveChatTypeUseCase: ResolveChatTypeUseCase,
    private readonly auditLogPort: AuditLogPort
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
    const auditContext: AuditContextType = createAuditContext({
      userId: request.user?.sub ?? null,
      ipAddress: safelyMaskIp(request.ip),
      userAgent: request.headers['user-agent'] ?? null,
      route: request.routeOptions.url,
      statusCode: reply.statusCode,
      method: request.method,
      requestId: request.id as UUIDType,
    })

    let messages: UIMessage[]
    let id: ChatIdType
    let trigger: string

    try {
      const body = request.body as components['schemas']['AIRequest'] & {
        id: string
        trigger: string
        chatTypeParam?: string
        chatTypeId?: string
        messages: any[]
      }

      this.logger.info('Request body:', {
        id: body?.id,
        trigger: body?.trigger,
        chatTypeParam: body?.chatTypeParam,
        chatTypeId: body?.chatTypeId,
        messageCount: Array.isArray(body?.messages) ? body.messages.length : 0,
      })

      const chatDTO = PostChatDto.validate(body)

      // Audit-log every prompt injection assessment that scored above 'allow'.
      // AuditLogPort.log() never throws, so failures are silently swallowed.
      for (const assessment of chatDTO.promptRiskAssessments) {
        await this.auditLogPort.log({
          userId: auditContext.userId,
          entityType: EntityType.PROMPT_INJECTION,
          entityId: chatDTO.id,
          action:
            assessment.decision === 'block'
              ? AuditAction.PROMPT_INJECTION_BLOCKED
              : AuditAction.PROMPT_INJECTION_FLAGGED,
          changes: {
            score: assessment.score,
            decision: assessment.decision,
            reasons: assessment.reasons,
            // Store only a non-reversible surrogate of normalizedText to avoid logging raw prompt content.
            normalizedText: assessment.normalizedText
              ? {
                  hash: createHash('sha256').update(assessment.normalizedText).digest('hex'),
                  length: assessment.normalizedText.length,
                }
              : null,
            messageIndex: assessment.messageIndex,
            messageId: assessment.messageId,
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent ?? undefined,
        })
      }

      // Reject any request that triggered a block-level assessment.
      const blocked = chatDTO.promptRiskAssessments.find((a) => a.decision === 'block')
      if (blocked) {
        throw new ValidationException('Prompt injection detected', {
          score: blocked.score,
          reasons: blocked.reasons,
        })
      }

      // Validate messages using validateUIMessages from 'ai' package
      messages = await validateUIMessages({
        messages: chatDTO?.messages || [],
      })

      // Extract id and trigger from body
      id = chatDTO?.id as ChatIdType

      trigger = chatDTO?.trigger
      this.logger.debug('Validated messages', {
        messageCount: messages.length,
        id,
        trigger,
      })
      this.logger.debug('Validated messages summary', {
        messageCount: messages.length,
        roles: messages.map((m) => m.role),
      })
    } catch (e) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid request body',
        details: e instanceof Error ? e.message : e,
      })
    }

    // Conversion of string request.user.sub id to UserIdType branded type
    // happens in middleware so no need to instantiate a new UserId here
    const userId = request?.user?.sub
    const chatId = id

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
      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: 'User not authenticated',
        })
      }
      this.logger.info('Chat does not exist, creating new chat', { id })
      await this.saveChatUseCase.execute(
        chatId,
        userId as UserIdType,
        chatTypeId,
        messages,
        auditContext
      )
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
        isEnabled: EnvConfig.SENTRY_ENABLED,
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
      onFinish: ({ finishReason, response, text, totalUsage, usage }) => {
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
        this.logger.error('Stream error', error instanceof Error ? error : new Error(String(error)))
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

        // Sanitise text parts before persisting to prevent stored XSS/prompt injection
        // (Finding 6 - Prompt Injection Defence in SECURITY_THREAT_MODEL.md)
        // Note: frontend rendering is already sanitised by Streamdown's rehype-sanitize pipeline
        const sanitisedResponseMessage = {
          ...responseMessage,
          parts: responseMessage.parts.map((part) => {
            if (part.type === 'text') {
              return { ...part, text: Sanitise.sanitiseText(part.text) }
            }
            return part
          }),
        }

        await this.appendChatUseCase.execute(chatId, [sanitisedResponseMessage], auditContext)
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
      ipAddress: safelyMaskIp(request.ip),
      userAgent: request.headers['user-agent'] ?? null,
    }

    const params = request.params as operations['getAIChatsByUserId']['parameters']['path']
    const userIdParam = params.userId

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

    /**
     * Note: Authentication is currently required for the chat APIs via authMiddleware
     * in the registerRoutes method. The authorization check below enforces that the
     * authenticated user must own the chat or have an elevated role.
     *
     * If you intentionally remove authentication in the future (for example, by
     * removing authMiddleware from the preHandler route), you should also remove
     * this authorization check, as it relies on request.user being present.
     */
    // Authorization check: User can only access their own chat history unless they have admin/moderator role
    const authenticatedUserId = request.user?.sub
    const userRoles = request.user?.roles || []

    // Check if user is accessing their own data OR has admin/moderator role
    if (authenticatedUserId) {
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
   * @throws {404} When no chat is found with the given chatId, or when the chat belongs to
   *               a different user and the authenticated user doesn't have admin/moderator role
   * @throws {500} When an error occurs while fetching the chat from the repository
   */
  async getAIChatByChatId(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.logger.debug('Received getAIChatByChatId request')

    // Extract audit context from request
    const auditContext = {
      userId: request.user?.sub ?? null,
      ipAddress: safelyMaskIp(request.ip),
      userAgent: request.headers['user-agent'] ?? null,
    }

    const params = request.params as any
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

      /**
       * Note: Authentication is currently required for the chat APIs via authMiddleware
       * in the registerRoutes method. The authorization check below enforces that the
       * authenticated user must own the chat or have an elevated role.
       *
       * If you intentionally remove authentication in the future (for example, by
       * removing authMiddleware from the preHandler route), you should also remove
       * this authorization check, as it relies on request.user being present.
       */
      // Authorization check: User can access if they own the chat OR have admin/moderator role
      const authenticatedUserId = request.user?.sub
      const isOwnChat = authenticatedUserId === chatUserId
      const hasElevatedRole = userRoles.includes('admin') || userRoles.includes('moderator')

      if (authenticatedUserId) {
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
