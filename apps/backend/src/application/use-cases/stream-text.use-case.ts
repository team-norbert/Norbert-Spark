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
import type { ChatIdType } from '../../domain/value-objects/chatID.js'
import { createCacheMiddleware } from '../../infrastructure/ai/middleware/cache.middleware.js'
import { EnvConfig } from '../../infrastructure/config/env.config.js'
import { Sanitise } from '../../shared/utils/sanitise.utils.js'
import type { LoggerPort } from '../ports/logger.port.js'
import { AppendedChatUseCase } from './append-chat.use-case.js'

export class StreamTextUseCase<T extends ToolSet> {
  private readonly cacheMiddleware: ReturnType<typeof createCacheMiddleware>
  constructor(
    private readonly logger: LoggerPort,
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
      onChunk: ({ chunk }) => {
        // Called for each partial piece of output
        const c = chunk as { type: string; text?: string }
        if (c.type === 'text-delta' && c.text && EnvConfig.NODE_ENV !== 'production') {
          this.logger.debug('AI stream text-delta chunk', { text: c.text })
        }
      },
      onFinish: ({ finishReason, response, totalUsage, usage }) => {
        // Called once when the full output is complete
        // The reason the model finished generating the text.
        // "stop" | "length" | "content-filter" | "tool-calls" | "error" | "other" | "unknown"
        this.logger.debug('Stream finished', { finishReason })
        this.logger.debug('Stream usage info', { usage, totalUsage })
        this.logger.debug('streamText.onFinish')

        // Log only non-sensitive metadata to avoid storing raw prompt/model content.
        this.logger.debug('Stream messages metadata', {
          messageCount: messages.length,
        })

        const responseMessages = (response as any)?.messages
        const responseMessageCount = Array.isArray(responseMessages)
          ? responseMessages.length
          : undefined
        this.logger.debug('Stream response metadata', {
          responseMessageCount,
        })
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
}
