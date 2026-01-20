import { describe, expect, it } from 'vitest'

import {
  type AIChatOptionsResponse,
  AIChatOptionsResponseSchema,
  type ChatType,
  ChatTypeSchema,
} from '@/domain/ai/chat-config.js'

describe('ChatTypeSchema', () => {
  describe('Valid Data', () => {
    it('should validate correct ChatType object', () => {
      const validChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'General Assistant',
        description: 'A general-purpose AI assistant for everyday tasks',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(validChatType)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validChatType)
    })

    it('should validate ChatType with minimal valid lengths', () => {
      const validChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'A',
        description: 'X',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'a',
        seoFriendlyBase64Id: '1234567890123456789012',
      }

      const result = ChatTypeSchema.safeParse(validChatType)
      expect(result.success).toBe(true)
    })

    it('should validate ChatType with maximum valid lengths', () => {
      const validChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'A'.repeat(200),
        description: 'X'.repeat(500),
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'a'.repeat(200),
        seoFriendlyBase64Id: '1234567890123456789012',
      }

      const result = ChatTypeSchema.safeParse(validChatType)
      expect(result.success).toBe(true)
    })

    it('should validate ChatType with special characters', () => {
      const validChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'C++ Developer',
        description: 'Expert C++ & Python programming!',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'cpp-developer',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(validChatType)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid Data - Missing Fields', () => {
    it('should fail validation when id is missing', () => {
      const invalidChatType = {
        name: 'General Assistant',
        description: 'A general-purpose AI assistant',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('id')
    })

    it('should fail validation when name is missing', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        description: 'A general-purpose AI assistant',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('name')
    })

    it('should fail validation when description is missing', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'General Assistant',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('description')
    })

    it('should fail validation when createdAt is missing', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'General Assistant',
        description: 'A general-purpose AI assistant',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('createdAt')
    })

    it('should fail validation when updatedAt is missing', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'General Assistant',
        description: 'A general-purpose AI assistant',
        createdAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('updatedAt')
    })

    it('should fail validation when seoFriendlyId is missing', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'General Assistant',
        description: 'A general-purpose AI assistant',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('seoFriendlyId')
    })

    it('should fail validation when seoFriendlyBase64Id is missing', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'General Assistant',
        description: 'A general-purpose AI assistant',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('seoFriendlyBase64Id')
    })
  })

  describe('Invalid Data - Invalid Field Types', () => {
    it('should fail validation when id is not a valid UUID', () => {
      const invalidChatType = {
        id: 'invalid-uuid',
        name: 'General Assistant',
        description: 'A general-purpose AI assistant',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('id')
      expect(result.error?.issues?.[0]?.message).toContain('Invalid')
    })

    it('should fail validation when id is a number', () => {
      const invalidChatType = {
        id: 123,
        name: 'General Assistant',
        description: 'A general-purpose AI assistant',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
    })

    it('should fail validation when createdAt is not a valid datetime string', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'General Assistant',
        description: 'A general-purpose AI assistant',
        createdAt: 'invalid-date',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('createdAt')
    })

    it('should fail validation when updatedAt is not a valid datetime string', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'General Assistant',
        description: 'A general-purpose AI assistant',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-15-99',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('updatedAt')
    })
  })

  describe('Invalid Data - String Length Constraints', () => {
    it('should fail validation when name is empty', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: '',
        description: 'A general-purpose AI assistant',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('name')
    })

    it('should fail validation when name exceeds 200 characters', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'A'.repeat(201),
        description: 'A general-purpose AI assistant',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('name')
    })

    it('should fail validation when description is empty', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'General Assistant',
        description: '',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('description')
    })

    it('should fail validation when description exceeds 500 characters', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'General Assistant',
        description: 'X'.repeat(501),
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('description')
    })

    it('should fail validation when seoFriendlyId is empty', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'General Assistant',
        description: 'A general-purpose AI assistant',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: '',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('seoFriendlyId')
    })

    it('should fail validation when seoFriendlyId exceeds 200 characters', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'General Assistant',
        description: 'A general-purpose AI assistant',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'a'.repeat(201),
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('seoFriendlyId')
    })

    it('should fail validation when seoFriendlyBase64Id is not exactly 22 characters', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'General Assistant',
        description: 'A general-purpose AI assistant',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4X',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('seoFriendlyBase64Id')
    })

    it('should fail validation when seoFriendlyBase64Id is too short', () => {
      const invalidChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'General Assistant',
        description: 'A general-purpose AI assistant',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe',
      }

      const result = ChatTypeSchema.safeParse(invalidChatType)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('seoFriendlyBase64Id')
    })
  })

  describe('Type Inference', () => {
    it('should correctly infer ChatType from schema', () => {
      const chatType: ChatType = {
        id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
        name: 'General Assistant',
        description: 'A general-purpose AI assistant',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        seoFriendlyId: 'general-assistant',
        seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
      }

      // Type should be correctly inferred - this is a compile-time test
      expect(chatType.id).toBeDefined()
      expect(chatType.name).toBeDefined()
      expect(chatType.description).toBeDefined()
      expect(chatType.createdAt).toBeDefined()
      expect(chatType.updatedAt).toBeDefined()
      expect(chatType.seoFriendlyId).toBeDefined()
      expect(chatType.seoFriendlyBase64Id).toBeDefined()
    })
  })
})

describe('AIChatOptionsResponseSchema', () => {
  describe('Valid Data', () => {
    it('should validate correct AIChatOptionsResponse with multiple items', () => {
      const validResponse = {
        success: true,
        data: [
          {
            id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
            name: 'General Assistant',
            description: 'A general-purpose AI assistant',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            seoFriendlyId: 'general-assistant',
            seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
          },
          {
            id: '01942f8e-67a4-7c3d-8e5f-6a7b8c9d0e1f',
            name: 'Fitness Tracker',
            description: 'Track your fitness goals',
            createdAt: '2024-01-16T10:30:00Z',
            updatedAt: '2024-01-16T10:30:00Z',
            seoFriendlyId: 'fitness-tracker',
            seoFriendlyBase64Id: 'AZQv42ejfD2OX2p7jJEFGH',
          },
        ],
      }

      const result = AIChatOptionsResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validResponse)
    })

    it('should validate AIChatOptionsResponse with empty data array', () => {
      const validResponse = {
        success: true,
        data: [],
      }

      const result = AIChatOptionsResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
      expect(result.data?.data).toEqual([])
    })

    it('should validate AIChatOptionsResponse with success false', () => {
      const validResponse = {
        success: false,
        data: [],
      }

      const result = AIChatOptionsResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
      expect(result.data?.success).toBe(false)
    })

    it('should validate AIChatOptionsResponse with single item', () => {
      const validResponse = {
        success: true,
        data: [
          {
            id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
            name: 'General Assistant',
            description: 'A general-purpose AI assistant',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            seoFriendlyId: 'general-assistant',
            seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
          },
        ],
      }

      const result = AIChatOptionsResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
      expect(result.data?.data).toHaveLength(1)
    })
  })

  describe('Invalid Data - Missing Fields', () => {
    it('should fail validation when success field is missing', () => {
      const invalidResponse = {
        data: [
          {
            id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
            name: 'General Assistant',
            description: 'A general-purpose AI assistant',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            seoFriendlyId: 'general-assistant',
            seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
          },
        ],
      }

      const result = AIChatOptionsResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('success')
    })

    it('should fail validation when data field is missing', () => {
      const invalidResponse = {
        success: true,
      }

      const result = AIChatOptionsResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('data')
    })
  })

  describe('Invalid Data - Invalid Field Types', () => {
    it('should fail validation when success is not a boolean', () => {
      const invalidResponse = {
        success: 'true',
        data: [],
      }

      const result = AIChatOptionsResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('success')
    })

    it('should fail validation when data is not an array', () => {
      const invalidResponse = {
        success: true,
        data: {
          id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
          name: 'General Assistant',
        },
      }

      const result = AIChatOptionsResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('data')
    })

    it('should fail validation when data array contains invalid ChatType', () => {
      const invalidResponse = {
        success: true,
        data: [
          {
            id: 'invalid-uuid',
            name: 'General Assistant',
            description: 'A general-purpose AI assistant',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            seoFriendlyId: 'general-assistant',
            seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
          },
        ],
      }

      const result = AIChatOptionsResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('data')
      expect(result.error?.issues?.[0]?.path).toContain(0)
      expect(result.error?.issues?.[0]?.path).toContain('id')
    })

    it('should fail validation when data array contains incomplete ChatType', () => {
      const invalidResponse = {
        success: true,
        data: [
          {
            id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
            name: 'General Assistant',
            // missing description and other fields
          },
        ],
      }

      const result = AIChatOptionsResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })

  describe('Type Inference', () => {
    it('should correctly infer AIChatOptionsResponse from schema', () => {
      const response: AIChatOptionsResponse = {
        success: true,
        data: [
          {
            id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
            name: 'General Assistant',
            description: 'A general-purpose AI assistant',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
            seoFriendlyId: 'general-assistant',
            seoFriendlyBase64Id: 'AZQv42ejeyy51P5qe4ABCD',
          },
        ],
      }

      // Type should be correctly inferred - this is a compile-time test
      expect(response.success).toBeDefined()
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data)).toBe(true)
    })
  })
})
