import { google } from '@ai-sdk/google'
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type ToolSet,
  type UIMessage,
  wrapLanguageModel,
} from 'ai'

import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import { createCacheMiddleware } from '../../infrastructure/ai/middleware/cache.middleware.js'
import { EnvConfig } from '../../infrastructure/config/env.config.js'
import { Sanitise } from '../../shared/utils/sanitise.utils.js'
import type { AuditLogPort, CreateAuditLogDTO } from '../ports/audit-log.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
import { AppendedChatUseCase } from './append-chat.use-case.js'

export class StreamTextUseCase<T extends ToolSet> {
  private readonly cacheMiddleware: ReturnType<typeof createCacheMiddleware>
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly appendChatUseCase: AppendedChatUseCase
  ) {
    this.cacheMiddleware = createCacheMiddleware(this.logger)
  }

  async execute(
    auditContext: AuditContext,
    messages: UIMessage[],
    systemPrompt: string,
    chatId: ChatIdType,
    tools: T
  ): Promise<Response> {
    const result = streamText({
      model:
        EnvConfig.NODE_ENV === 'production'
          ? wrapLanguageModel({
              model: google(EnvConfig.MODEL_NAME),
              middleware: this.cacheMiddleware,
            })
          : google(EnvConfig.MODEL_NAME),
      messages: await convertToModelMessages(messages as UIMessage[]),
      system: systemPrompt,
      experimental_telemetry: {
        isEnabled: EnvConfig.SENTRY_ENABLED,
        recordInputs: true,
        recordOutputs: true,
      },
      tools,
      stopWhen: [stepCountIs(5)],
      onChunk({ chunk }) {
        // Called for each partial piece of output
        const c = chunk as { type: string; text?: string }
        if (c.type === 'text-delta' && c.text) {
          process.stdout.write(c.text)
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
          chatId,
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

        const auditEntry: CreateAuditLogDTO = {
          userId: auditContext.userId,
          entityType: EntityType.CHAT,
          entityId: chatId,
          action: AuditAction.CREATE,
          changes: { reason: 'chat_successfully_on_finish' },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent ?? undefined,
        }
        // AuditLogPort.log() never throws per contract
        await this.auditLog.log(auditEntry)

        await this.appendChatUseCase.execute(chatId, [sanitisedResponseMessage], auditContext)
      },
    })
  }
}
