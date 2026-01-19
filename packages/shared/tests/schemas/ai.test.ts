import { describe, expect, it } from 'vitest'

import {
  AIFetchChatResponseSchema,
  AIListSchema,
  AIListWithUsageSchema,
  AIModelsSchema,
  AIRequestSchema,
  AIReturnedResponseSchema,
  AISummarySchema,
  AISummaryWithUsageSchema,
  AIUsageListSchema,
  AIUsageSchema,
  AIUserIdResponseSchema,
  MessagePartSchema,
  MessageSchema,
  StreamEventFinishSchema,
  StreamEventFinishStepSchema,
  StreamEventSchema,
  StreamEventStartSchema,
  StreamEventStartStepSchema,
  StreamEventTextDeltaSchema,
  StreamEventTextEndSchema,
  StreamEventTextStartSchema,
  StreamEventToolInputAvailableSchema,
  StreamEventToolInputDeltaSchema,
  StreamEventToolInputStartSchema,
  StreamEventToolOutputAvailableSchema,
} from '../../src/schemas/ai.js'

describe('AI Schemas', () => {
  describe('AISummarySchema', () => {
    it('should validate valid AI summary', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        createdAt: new Date('2024-01-01'),
      }

      const result = AISummarySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate without createdAt (optional)', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
      }

      const result = AISummarySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should coerce string date to Date object', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        prompt: 'Test prompt',
        createdAt: '2024-01-01',
      }

      const result = AISummarySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.createdAt).toBeInstanceOf(Date)
      }
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = AISummarySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('AIListSchema', () => {
    it('should validate array of AI summaries', () => {
      const validData = [
        { id: '1', prompt: 'Prompt 1' },
        { id: '2', prompt: 'Prompt 2', createdAt: new Date() },
      ]

      const result = AIListSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate empty array', () => {
      const result = AIListSchema.safeParse([])
      expect(result.success).toBe(true)
    })

    it('should reject invalid array items', () => {
      const invalidData = [{ id: '1' }] // missing prompt

      const result = AIListSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('AISummaryWithUsageSchema', () => {
    it('should validate AI summary with usage count', () => {
      const validData = {
        id: '123',
        prompt: 'Test prompt',
        usageCount: 42,
      }

      const result = AISummaryWithUsageSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing usageCount', () => {
      const invalidData = {
        id: '123',
        prompt: 'Test prompt',
      }

      const result = AISummaryWithUsageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject non-numeric usageCount', () => {
      const invalidData = {
        id: '123',
        prompt: 'Test prompt',
        usageCount: 'not a number',
      }

      const result = AISummaryWithUsageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('AIListWithUsageSchema', () => {
    it('should validate array of AI summaries with usage', () => {
      const validData = [
        { id: '1', prompt: 'Prompt 1', usageCount: 5 },
        { id: '2', prompt: 'Prompt 2', usageCount: 10 },
      ]

      const result = AIListWithUsageSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('AIUsageSchema', () => {
    it('should validate AI usage data', () => {
      const validData = {
        aiId: '123',
        usageCount: 100,
      }

      const result = AIUsageSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing fields', () => {
      const invalidData = { aiId: '123' }

      const result = AIUsageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('AIUsageListSchema', () => {
    it('should validate array of AI usage data', () => {
      const validData = [
        { aiId: '1', usageCount: 5 },
        { aiId: '2', usageCount: 10 },
      ]

      const result = AIUsageListSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('AIModelsSchema', () => {
    it('should validate array of model names', () => {
      const validData = ['gpt-4', 'claude-3', 'gemini-pro']

      const result = AIModelsSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate empty array', () => {
      const result = AIModelsSchema.safeParse([])
      expect(result.success).toBe(true)
    })

    it('should reject non-string items', () => {
      const invalidData = ['gpt-4', 123, 'claude-3']

      const result = AIModelsSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('AIRequestSchema', () => {
    it('should validate valid AI request', () => {
      const validData = {
        prompt: 'Generate a story about AI',
      }

      const result = AIRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty prompt', () => {
      const invalidData = {
        prompt: '',
      }

      const result = AIRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Prompt is required')
      }
    })

    it('should reject missing prompt', () => {
      const invalidData = {}

      const result = AIRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('StreamEventStartSchema', () => {
    it('should validate start event', () => {
      const validData = { type: 'start' }

      const result = StreamEventStartSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject wrong type', () => {
      const invalidData = { type: 'wrong' }

      const result = StreamEventStartSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('StreamEventStartStepSchema', () => {
    it('should validate start-step event', () => {
      const validData = { type: 'start-step' }

      const result = StreamEventStartStepSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('StreamEventTextStartSchema', () => {
    it('should validate text-start event', () => {
      const validData = {
        type: 'text-start',
        id: 'text-123',
      }

      const result = StreamEventTextStartSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing id', () => {
      const invalidData = { type: 'text-start' }

      const result = StreamEventTextStartSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('StreamEventTextDeltaSchema', () => {
    it('should validate text-delta event', () => {
      const validData = {
        type: 'text-delta',
        id: 'text-123',
        delta: 'Hello ',
      }

      const result = StreamEventTextDeltaSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing delta', () => {
      const invalidData = {
        type: 'text-delta',
        id: 'text-123',
      }

      const result = StreamEventTextDeltaSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('StreamEventTextEndSchema', () => {
    it('should validate text-end event', () => {
      const validData = {
        type: 'text-end',
        id: 'text-123',
      }

      const result = StreamEventTextEndSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('StreamEventToolInputStartSchema', () => {
    it('should validate tool-input-start event', () => {
      const validData = {
        type: 'tool-input-start',
        toolCallId: 'call-123',
        toolName: 'calculator',
      }

      const result = StreamEventToolInputStartSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing toolName', () => {
      const invalidData = {
        type: 'tool-input-start',
        toolCallId: 'call-123',
      }

      const result = StreamEventToolInputStartSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('StreamEventToolInputDeltaSchema', () => {
    it('should validate tool-input-delta event', () => {
      const validData = {
        type: 'tool-input-delta',
        toolCallId: 'call-123',
        inputTextDelta: '{"num',
      }

      const result = StreamEventToolInputDeltaSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('StreamEventToolInputAvailableSchema', () => {
    it('should validate tool-input-available event', () => {
      const validData = {
        type: 'tool-input-available',
        toolCallId: 'call-123',
        toolName: 'calculator',
        input: { number: 42, operation: 'square' },
      }

      const result = StreamEventToolInputAvailableSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept empty input object', () => {
      const validData = {
        type: 'tool-input-available',
        toolCallId: 'call-123',
        toolName: 'calculator',
        input: {},
      }

      const result = StreamEventToolInputAvailableSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('StreamEventToolOutputAvailableSchema', () => {
    it('should validate tool-output-available event', () => {
      const validData = {
        type: 'tool-output-available',
        toolCallId: 'call-123',
        output: { result: 1764 },
      }

      const result = StreamEventToolOutputAvailableSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept any output type', () => {
      const validData = {
        type: 'tool-output-available',
        toolCallId: 'call-123',
        output: 'string output',
      }

      const result = StreamEventToolOutputAvailableSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('StreamEventFinishStepSchema', () => {
    it('should validate finish-step event', () => {
      const validData = { type: 'finish-step' }

      const result = StreamEventFinishStepSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('StreamEventFinishSchema', () => {
    it('should validate finish event with usage', () => {
      const validData = {
        type: 'finish',
        finishReason: 'stop',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      }

      const result = StreamEventFinishSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate finish event without usage', () => {
      const validData = {
        type: 'finish',
        finishReason: 'stop',
      }

      const result = StreamEventFinishSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate all finish reasons', () => {
      const reasons = ['stop', 'length', 'content-filter', 'tool-calls', 'error', 'other']

      reasons.forEach((reason) => {
        const validData = {
          type: 'finish',
          finishReason: reason,
        }

        const result = StreamEventFinishSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid finish reason', () => {
      const invalidData = {
        type: 'finish',
        finishReason: 'invalid-reason',
      }

      const result = StreamEventFinishSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate partial usage data', () => {
      const validData = {
        type: 'finish',
        finishReason: 'stop',
        usage: {
          promptTokens: 10,
        },
      }

      const result = StreamEventFinishSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('StreamEventSchema (discriminated union)', () => {
    it('should validate start event', () => {
      const validData = { type: 'start' }

      const result = StreamEventSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate text-delta event', () => {
      const validData = {
        type: 'text-delta',
        id: 'text-123',
        delta: 'Hello',
      }

      const result = StreamEventSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate finish event', () => {
      const validData = {
        type: 'finish',
        finishReason: 'stop',
      }

      const result = StreamEventSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject unknown event type', () => {
      const invalidData = {
        type: 'unknown-event',
      }

      const result = StreamEventSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject event with wrong structure for type', () => {
      const invalidData = {
        type: 'text-delta',
        // missing id and delta
      }

      const result = StreamEventSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('MessagePartSchema', () => {
    it('should validate text message part', () => {
      const validData = {
        type: 'text',
        text: 'Hello world',
      }

      const result = MessagePartSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate all part types', () => {
      const types = [
        'text',
        'reasoning',
        'file',
        'source_url',
        'source_document',
        'step-start',
        'data',
        'tool-heartOfDarknessQA',
      ]

      types.forEach((type) => {
        const validData = { type }

        const result = MessagePartSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('should validate part with state', () => {
      const validData = {
        type: 'data',
        state: 'done',
      }

      const result = MessagePartSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate both state values', () => {
      const states = ['done', 'output-available']

      states.forEach((state) => {
        const validData = {
          type: 'text',
          state,
        }

        const result = MessagePartSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid type', () => {
      const invalidData = {
        type: 'invalid-type',
      }

      const result = MessagePartSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid state', () => {
      const invalidData = {
        type: 'text',
        state: 'invalid-state',
      }

      const result = MessagePartSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('MessageSchema', () => {
    it('should validate user message', () => {
      const validData = {
        id: 'msg-123',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
      }

      const result = MessageSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate assistant message', () => {
      const validData = {
        id: 'msg-456',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Hi there!' }],
      }

      const result = MessageSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate message with multiple parts', () => {
      const validData = {
        id: 'msg-789',
        role: 'assistant',
        parts: [
          { type: 'reasoning', text: 'Thinking...' },
          { type: 'text', text: 'Here is my answer' },
        ],
      }

      const result = MessageSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate message with empty parts array', () => {
      const validData = {
        id: 'msg-empty',
        role: 'user',
        parts: [],
      }

      const result = MessageSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid role', () => {
      const invalidData = {
        id: 'msg-123',
        role: 'system',
        parts: [],
      }

      const result = MessageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        id: 'msg-123',
        role: 'user',
      }

      const result = MessageSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('AIReturnedResponseSchema', () => {
    it('should validate valid AI response', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Hello' }],
          },
          {
            id: 'msg-2',
            role: 'assistant',
            parts: [{ type: 'text', text: 'Hi!' }],
          },
        ],
        trigger: 'user_input',
      }

      const result = AIReturnedResponseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate response with empty messages', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        messages: [],
        trigger: 'system',
      }

      const result = AIReturnedResponseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject non-UUID id', () => {
      const invalidData = {
        id: 'not-a-uuid',
        messages: [],
        trigger: 'test',
      }

      const result = AIReturnedResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing fields', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        messages: [],
      }

      const result = AIReturnedResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('AIUserIdResponseSchema', () => {
    it('should validate successful response', () => {
      const validData = {
        success: true,
        data: ['123e4567-e89b-12d3-a456-426614174000', '987fcdeb-51a2-43f7-8d6e-123456789abc'],
      }

      const result = AIUserIdResponseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate failed response with empty data', () => {
      const validData = {
        success: false,
        data: [],
      }

      const result = AIUserIdResponseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject non-UUID in data array', () => {
      const invalidData = {
        success: true,
        data: ['not-a-uuid'],
      }

      const result = AIUserIdResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing fields', () => {
      const invalidData = {
        success: true,
      }

      const result = AIUserIdResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('AIFetchChatResponseSchema', () => {
    it('should validate successful chat fetch', () => {
      const validData = {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              parts: [{ type: 'text', text: 'Question' }],
            },
          ],
        },
      }

      const result = AIFetchChatResponseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate with empty messages', () => {
      const validData = {
        success: false,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          messages: [],
        },
      }

      const result = AIFetchChatResponseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject non-UUID chat id', () => {
      const invalidData = {
        success: true,
        data: {
          id: 'not-a-uuid',
          messages: [],
        },
      }

      const result = AIFetchChatResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing data field', () => {
      const invalidData = {
        success: true,
      }

      const result = AIFetchChatResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
