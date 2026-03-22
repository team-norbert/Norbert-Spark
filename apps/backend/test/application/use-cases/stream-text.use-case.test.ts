import { streamText, type ToolSet } from 'ai'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuditLogPort } from '../../../src/application/ports/audit-log.port.js'
import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { AppendedChatUseCase } from '../../../src/application/use-cases/append-chat.use-case.js'
import { StreamTextUseCase } from '../../../src/application/use-cases/stream-text.use-case.js'
import type { AuditContext } from '../../../src/domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../../src/domain/audit/entity-type.enum.js'
import { ChatId, type ChatIdType } from '../../../src/domain/value-objects/chatID.js'
import { UserId } from '../../../src/domain/value-objects/userID.js'
import { Sanitise } from '../../../src/shared/utils/sanitise.utils.js'
import { createMockLogger } from '../../shared/factories/logger.factory.js'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('ai', () => ({
  streamText: vi.fn(),
  convertToModelMessages: vi.fn().mockResolvedValue([{ role: 'user', content: 'hi' }]),
  stepCountIs: vi.fn().mockReturnValue(() => false),
  wrapLanguageModel: vi.fn().mockReturnValue('wrapped-model'),
}))

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn().mockReturnValue('mock-google-model'),
}))

vi.mock('../../../src/infrastructure/ai/middleware/cache.middleware.js', () => ({
  createCacheMiddleware: vi.fn().mockReturnValue('mock-cache-middleware'),
}))

vi.mock('../../../src/infrastructure/config/env.config.js', () => ({
  EnvConfig: {
    NODE_ENV: 'test',
    MODEL_NAME: 'gemini-pro',
    SENTRY_ENABLED: false,
  },
}))

vi.mock('../../../src/shared/utils/sanitise.utils.js', () => ({
  Sanitise: {
    sanitiseText: vi.fn((text: string) => `sanitised:${text}`),
  },
}))

// ── Helpers ────────────────────────────────────────────────────────────────

function createMockAuditLog(): AuditLogPort {
  return {
    log: vi.fn().mockResolvedValue(undefined),
    getByEntity: vi.fn().mockResolvedValue([]),
    getByUser: vi.fn().mockResolvedValue([]),
    getByAction: vi.fn().mockResolvedValue([]),
  }
}

function createAuditContext(): AuditContext {
  return {
    userId: new UserId(uuidv7()).getValue(),
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
  }
}

/**
 * Build a mock return value for `streamText()`.
 *
 * `toUIMessageStreamResponse` is the method called by the use case, so we
 * capture the `onFinish` callback it receives and expose a way to invoke it
 * from tests.
 */
function makeStreamTextResult() {
  let capturedOnFinish: ((args: any) => Promise<void>) | undefined

  const mockResponse = new Response('mock-stream-body', {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  })

  return {
    streamTextReturn: {
      toUIMessageStreamResponse: vi.fn().mockImplementation((opts: any) => {
        capturedOnFinish = opts?.onFinish
        return mockResponse
      }),
    },
    mockResponse,
    /** Simulate the SDK calling the onFinish callback with a given responseMessage */
    async triggerOnFinish(responseMessage: any, messages: any[] | unknown = []) {
      if (!capturedOnFinish) throw new Error('onFinish was not captured — was execute() called?')
      await capturedOnFinish({ messages, responseMessage })
    },
  }
}

// ── Test Suite ─────────────────────────────────────────────────────────────

describe('StreamTextUseCase', () => {
  let logger: LoggerPort
  let auditLog: AuditLogPort
  let appendChatUseCase: AppendedChatUseCase
  let useCase: StreamTextUseCase<ToolSet>
  let chatId: ChatIdType
  let auditContext: AuditContext
  const systemPrompt = 'You are a helpful assistant.'
  const mockTools: ToolSet = {}

  beforeEach(() => {
    vi.clearAllMocks()

    logger = createMockLogger()
    auditLog = createMockAuditLog()
    appendChatUseCase = {
      execute: vi.fn().mockResolvedValue(null),
    } as unknown as AppendedChatUseCase
    useCase = new StreamTextUseCase<ToolSet>(logger, auditLog, appendChatUseCase)
    chatId = new ChatId(uuidv7()).getValue()
    auditContext = createAuditContext()
  })

  // ── Constructor ────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should create an instance successfully', () => {
      expect(useCase).toBeInstanceOf(StreamTextUseCase)
    })
  })

  // ── execute() ──────────────────────────────────────────────────────────

  describe('execute()', () => {
    it('should call streamText with the correct parameters', async () => {
      const { streamTextReturn } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any

      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      expect(streamText).toHaveBeenCalledOnce()
      const callArgs = vi.mocked(streamText).mock.calls[0][0]
      expect(callArgs).toMatchObject({
        model: 'mock-google-model',
        system: systemPrompt,
        tools: mockTools,
      })
    })

    it('should return a Response from toUIMessageStreamResponse', async () => {
      const { mockResponse, streamTextReturn } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      const result = await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      expect(result).toBe(mockResponse)
      expect(streamTextReturn.toUIMessageStreamResponse).toHaveBeenCalledOnce()
    })

    it('should pass originalMessages to toUIMessageStreamResponse', async () => {
      const { streamTextReturn } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      const callArgs = streamTextReturn.toUIMessageStreamResponse.mock.calls[0][0]
      expect(callArgs.originalMessages).toBe(messages)
    })

    it('should pass tools through to streamText', async () => {
      const customTools: ToolSet = { myTool: { execute: vi.fn() } } as any
      const { streamTextReturn } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, customTools)

      const callArgs = vi.mocked(streamText).mock.calls[0][0]
      expect(callArgs.tools).toBe(customTools)
    })

    it('should configure telemetry based on EnvConfig.SENTRY_ENABLED', async () => {
      const { streamTextReturn } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      const callArgs = vi.mocked(streamText).mock.calls[0][0]
      expect(callArgs.experimental_telemetry).toEqual({
        isEnabled: false,
        recordInputs: true,
        recordOutputs: true,
      })
    })
  })

  // ── onChunk callback ──────────────────────────────────────────────────

  describe('onChunk callback', () => {
    it('should write text-delta chunks to stdout', async () => {
      const { streamTextReturn } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      const callArgs = vi.mocked(streamText).mock.calls[0][0]
      const onChunk = callArgs.onChunk as (args: { chunk: any }) => void

      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
      onChunk({ chunk: { type: 'text-delta', text: 'hello world' } })

      expect(stdoutSpy).toHaveBeenCalledWith('hello world')
      stdoutSpy.mockRestore()
    })

    it('should not write non-text-delta chunks to stdout', async () => {
      const { streamTextReturn } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      const callArgs = vi.mocked(streamText).mock.calls[0][0]
      const onChunk = callArgs.onChunk as (args: { chunk: any }) => void

      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
      onChunk({ chunk: { type: 'reasoning-delta', text: 'thinking...' } })

      expect(stdoutSpy).not.toHaveBeenCalled()
      stdoutSpy.mockRestore()
    })

    it('should not write text-delta chunks with empty text', async () => {
      const { streamTextReturn } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      const callArgs = vi.mocked(streamText).mock.calls[0][0]
      const onChunk = callArgs.onChunk as (args: { chunk: any }) => void

      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
      onChunk({ chunk: { type: 'text-delta', text: '' } })

      expect(stdoutSpy).not.toHaveBeenCalled()
      stdoutSpy.mockRestore()
    })
  })

  // ── onFinish callback (streamText level) ───────────────────────────────

  describe('onFinish callback (streamText)', () => {
    it('should log finish details', async () => {
      const { streamTextReturn } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      const callArgs = vi.mocked(streamText).mock.calls[0][0]
      const onFinish = callArgs.onFinish as (args: any) => void

      onFinish({
        finishReason: 'stop',
        response: { messages: [] },
        text: 'Hello!',
        totalUsage: { promptTokens: 10, completionTokens: 5 },
        usage: { promptTokens: 10, completionTokens: 5 },
      })

      expect(logger.debug).toHaveBeenCalledWith('Stream finished', { finishReason: 'stop' })
      expect(logger.debug).toHaveBeenCalledWith('Stream usage info', {
        usage: { promptTokens: 10, completionTokens: 5 },
        totalUsage: { promptTokens: 10, completionTokens: 5 },
      })
      expect(logger.debug).toHaveBeenCalledWith('streamText.onFinish')
    })
  })

  // ── onError callback ──────────────────────────────────────────────────

  describe('onError callback', () => {
    it('should log Error instances directly', async () => {
      const { streamTextReturn } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      const callArgs = vi.mocked(streamText).mock.calls[0][0]
      const onError = callArgs.onError as (args: { error: unknown }) => void

      const error = new Error('Something broke')
      onError({ error })

      expect(logger.error).toHaveBeenCalledWith('Stream error', error)
    })

    it('should wrap non-Error values in an Error', async () => {
      const { streamTextReturn } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      const callArgs = vi.mocked(streamText).mock.calls[0][0]
      const onError = callArgs.onError as (args: { error: unknown }) => void

      onError({ error: 'string-error' })

      expect(logger.error).toHaveBeenCalledWith('Stream error', new Error('string-error'))
    })
  })

  // ── toUIMessageStreamResponse onFinish ────────────────────────────────

  describe('toUIMessageStreamResponse onFinish', () => {
    it('should sanitise text parts of the response message', async () => {
      const { streamTextReturn, triggerOnFinish } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      const responseMessage = {
        role: 'assistant',
        parts: [
          { type: 'text', text: '<script>alert("xss")</script>' },
          { type: 'tool-invocation', toolName: 'myTool', args: {} },
        ],
      }

      await triggerOnFinish(responseMessage, messages)

      expect(Sanitise.sanitiseText).toHaveBeenCalledWith('<script>alert("xss")</script>')
    })

    it('should not sanitise non-text parts', async () => {
      const { streamTextReturn, triggerOnFinish } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      const responseMessage = {
        role: 'assistant',
        parts: [{ type: 'tool-invocation', toolName: 'myTool', args: {} }],
      }

      await triggerOnFinish(responseMessage, messages)

      expect(Sanitise.sanitiseText).not.toHaveBeenCalled()
    })

    it('should log audit entry on finish', async () => {
      const { streamTextReturn, triggerOnFinish } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      const responseMessage = {
        role: 'assistant',
        parts: [{ type: 'text', text: 'Hi there!' }],
      }

      await triggerOnFinish(responseMessage, messages)

      expect(auditLog.log).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          userId: auditContext.userId,
          entityType: EntityType.CHAT,
          entityId: chatId,
          action: AuditAction.CREATE,
          changes: { reason: 'chat_successfully_on_finish' },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent ?? undefined,
        })
      )
    })

    it('should call appendChatUseCase.execute with sanitised message', async () => {
      const { streamTextReturn, triggerOnFinish } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      const responseMessage = {
        role: 'assistant',
        parts: [
          { type: 'text', text: 'response text' },
          { type: 'source', source: { url: 'https://example.com' } },
        ],
      }

      await triggerOnFinish(responseMessage, messages)

      expect(appendChatUseCase.execute).toHaveBeenCalledExactlyOnceWith(
        chatId,
        [
          expect.objectContaining({
            role: 'assistant',
            parts: [
              { type: 'text', text: 'sanitised:response text' },
              { type: 'source', source: { url: 'https://example.com' } },
            ],
          }),
        ],
        auditContext
      )
    })

    it('should log chatId and message count', async () => {
      const { streamTextReturn, triggerOnFinish } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
        { role: 'assistant', parts: [{ type: 'text', text: 'Hi' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      const responseMessage = {
        role: 'assistant',
        parts: [{ type: 'text', text: 'reply' }],
      }

      await triggerOnFinish(responseMessage, messages)

      expect(logger.debug).toHaveBeenCalledWith('toUIMessageStreamResponse.onFinish', {
        chatId,
        messageCount: 2,
      })
    })

    it('should log responseMessage', async () => {
      const { streamTextReturn, triggerOnFinish } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      const responseMessage = {
        role: 'assistant',
        parts: [{ type: 'text', text: 'Hi!' }],
      }

      await triggerOnFinish(responseMessage, messages)

      expect(logger.debug).toHaveBeenCalledWith('Response message', { responseMessage })
    })

    it('should handle messages that is not an array gracefully', async () => {
      const { streamTextReturn, triggerOnFinish } = makeStreamTextResult()
      vi.mocked(streamText).mockReturnValue(streamTextReturn as any)

      const messages = [
        { role: 'user', parts: [{ type: 'text', text: 'Hello' }], id: uuidv7() },
      ] as any
      await useCase.execute(auditContext, messages, systemPrompt, chatId, mockTools)

      const responseMessage = {
        role: 'assistant',
        parts: [{ type: 'text', text: 'reply' }],
      }

      // Pass a non-array as messages to test the Array.isArray guard
      await triggerOnFinish(responseMessage, 'not-an-array')

      expect(logger.debug).toHaveBeenCalledWith('toUIMessageStreamResponse.onFinish', {
        chatId,
        messageCount: undefined,
      })
    })
  })
})
