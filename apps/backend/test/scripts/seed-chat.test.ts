import { describe, expect, it } from 'vitest'

import { SEO } from '../../src/shared/utils/SEO.util.js'
import { Uuid7Util } from '../../src/shared/utils/uuid7.util.js'

/**
 * Test suite for the seed-chat script logic
 *
 * This tests the chat type data preparation and validation
 * without actually executing the database operations.
 */
describe('Chat Types Seed Script', () => {
  const chatTypesData = [
    {
      name: 'The Heart of Darkness',
      description:
        'Ask questions about the novella "The Heart of Darkness" by Joseph Conrad. Get insights into its themes, characters, and plot.',
      prompt:
        'You are a knowledgeable literary assistant specializing in Joseph Conrad\'s "Heart of Darkness". Help users understand the themes, characters, plot, and historical context of this novella. Provide insightful analysis while being clear and accessible.',
    },
  ]

  describe('Chat Type Data Validation', () => {
    it('should have exactly one chat type in seed data', () => {
      expect(chatTypesData).toHaveLength(1)
    })

    it('should have required fields for chat type', () => {
      const chatType = chatTypesData[0]!
      expect(chatType).toHaveProperty('name')
      expect(chatType).toHaveProperty('description')
      expect(chatType).toHaveProperty('prompt')
      expect(chatType.name).toBeTruthy()
      expect(chatType.description).toBeTruthy()
      expect(chatType.prompt).toBeTruthy()
    })

    it('should have name "The Heart of Darkness"', () => {
      expect(chatTypesData[0]!.name).toBe('The Heart of Darkness')
    })

    it('should have name within length constraints (1-200 characters)', () => {
      const name = chatTypesData[0]!.name
      expect(name.length).toBeGreaterThanOrEqual(1)
      expect(name.length).toBeLessThanOrEqual(200)
    })

    it('should have description within length constraints (1-500 characters)', () => {
      const description = chatTypesData[0]!.description
      expect(description.length).toBeGreaterThanOrEqual(1)
      expect(description.length).toBeLessThanOrEqual(500)
    })

    it('should have description mentioning Joseph Conrad', () => {
      expect(chatTypesData[0]!.description).toContain('Joseph Conrad')
    })
  })

  describe('Chat Type Preparation Logic', () => {
    it('should generate valid UUIDv7', () => {
      const id = Uuid7Util.createUuidv7()

      expect(id).toBeTruthy()
      expect(typeof id).toBe('string')
      expect(Uuid7Util.isValidUUID(id)).toBe(true)
      expect(Uuid7Util.uuidVersionValidation(id)).toBe('v7')
    })

    it('should generate SEO-friendly ID from name', () => {
      const name = chatTypesData[0]!.name
      const seoFriendlyId = SEO.generateSeoFriendlyTitle(name)

      expect(seoFriendlyId).toBeTruthy()
      expect(typeof seoFriendlyId).toBe('string')
      expect(seoFriendlyId).toBe('heart-darkness')
      expect(seoFriendlyId.length).toBeGreaterThanOrEqual(1)
      expect(seoFriendlyId.length).toBeLessThanOrEqual(200)
    })

    it('should generate base64-encoded ID from UUID', () => {
      const id = Uuid7Util.createUuidv7()
      const base64Id = Uuid7Util.toBase64(id)

      expect(base64Id).toBeTruthy()
      expect(typeof base64Id).toBe('string')
      expect(base64Id?.length).toBe(22)
    })

    it('should create complete chat type object', () => {
      const id = Uuid7Util.createUuidv7()
      const seoFriendlyId = SEO.generateSeoFriendlyTitle(chatTypesData[0]!.name)
      const seoFriendlyBase64Id = Uuid7Util.toBase64(id)

      const chatType = {
        id,
        name: chatTypesData[0]!.name,
        seoFriendlyId,
        seoFriendlyBase64Id,
        description: chatTypesData[0]!.description,
      }

      expect(chatType).toHaveProperty('id')
      expect(chatType).toHaveProperty('name')
      expect(chatType).toHaveProperty('seoFriendlyId')
      expect(chatType).toHaveProperty('seoFriendlyBase64Id')
      expect(chatType).toHaveProperty('description')
      expect(chatType.id).toBeTruthy()
      expect(chatType.seoFriendlyId).toBe('heart-darkness')
      expect(chatType.seoFriendlyBase64Id).toBeTruthy()
      expect(chatType.seoFriendlyBase64Id?.length).toBe(22)
    })

    it('should throw error if base64 generation fails', () => {
      const invalidId = 'not-a-uuid'

      expect(() => {
        const seoFriendlyBase64Id = Uuid7Util.toBase64(invalidId)
        if (!seoFriendlyBase64Id) {
          throw new Error(`Failed to generate base64 ID for UUID: ${invalidId}`)
        }
      }).toThrow('Failed to generate base64 ID for UUID')
    })

    it('should generate unique IDs for multiple iterations', () => {
      const ids = new Set<string>()
      const iterations = 10

      for (let i = 0; i < iterations; i++) {
        const id = Uuid7Util.createUuidv7()
        ids.add(id)
      }

      expect(ids.size).toBe(iterations)
    })

    it('should generate unique base64 IDs for multiple UUIDs', () => {
      const base64Ids = new Set<string>()
      const iterations = 10

      for (let i = 0; i < iterations; i++) {
        const id = Uuid7Util.createUuidv7()
        const base64Id = Uuid7Util.toBase64(id)
        if (base64Id) {
          base64Ids.add(base64Id)
        }
      }

      expect(base64Ids.size).toBe(iterations)
    })
  })

  describe('Data Transformation', () => {
    it('should map chat types data to insertable format', () => {
      const mapped = chatTypesData.map((chatType) => {
        const id = Uuid7Util.createUuidv7()
        const seoFriendlyId = SEO.generateSeoFriendlyTitle(chatType.name)
        const seoFriendlyBase64Id = Uuid7Util.toBase64(id)

        if (!seoFriendlyBase64Id) {
          throw new Error(`Failed to generate base64 ID for UUID: ${id}`)
        }

        return {
          id,
          name: chatType.name,
          seoFriendlyId,
          seoFriendlyBase64Id,
          description: chatType.description,
        }
      })

      expect(mapped).toHaveLength(1)
      expect(mapped[0]).toHaveProperty('id')
      expect(mapped[0]).toHaveProperty('name', 'The Heart of Darkness')
      expect(mapped[0]).toHaveProperty('seoFriendlyId', 'heart-darkness')
      expect(mapped[0]).toHaveProperty('seoFriendlyBase64Id')
      expect(mapped[0]).toHaveProperty('description')
      expect(mapped[0]!.seoFriendlyBase64Id.length).toBe(22)
    })

    it('should preserve original name and description', () => {
      const originalName = chatTypesData[0]!.name
      const originalDescription = chatTypesData[0]!.description

      const id = Uuid7Util.createUuidv7()
      const seoFriendlyId = SEO.generateSeoFriendlyTitle(originalName)
      const seoFriendlyBase64Id = Uuid7Util.toBase64(id)

      const transformed = {
        id,
        name: originalName,
        seoFriendlyId,
        seoFriendlyBase64Id,
        description: originalDescription,
      }

      expect(transformed.name).toBe(originalName)
      expect(transformed.description).toBe(originalDescription)
      expect(transformed.name).toBe('The Heart of Darkness')
    })
  })

  describe('SEO-Friendly ID Generation', () => {
    it('should convert to lowercase', () => {
      const seoId = SEO.generateSeoFriendlyTitle('The Heart of Darkness')
      expect(seoId).toBe(seoId.toLowerCase())
    })

    it('should replace spaces with hyphens', () => {
      const seoId = SEO.generateSeoFriendlyTitle('The Heart of Darkness')
      expect(seoId).toContain('-')
      expect(seoId).not.toContain(' ')
    })

    it('should remove common words (the, of)', () => {
      const seoId = SEO.generateSeoFriendlyTitle('The Heart of Darkness')
      expect(seoId).toBe('heart-darkness')
      expect(seoId).not.toContain('the')
      expect(seoId).not.toContain('of')
    })
  })

  describe('Base64 URL Encoding', () => {
    it('should produce URL-safe base64 (no padding)', () => {
      const id = Uuid7Util.createUuidv7()
      const base64Id = Uuid7Util.toBase64(id)

      expect(base64Id).toBeTruthy()
      expect(base64Id).not.toContain('=')
      expect(base64Id).not.toContain('+')
      expect(base64Id).not.toContain('/')
    })

    it('should be exactly 22 characters', () => {
      const id = Uuid7Util.createUuidv7()
      const base64Id = Uuid7Util.toBase64(id)

      expect(base64Id?.length).toBe(22)
    })

    it('should only accept v7 UUIDs', () => {
      const v4Uuid = '550e8400-e29b-41d4-a716-446655440000'
      const base64Id = Uuid7Util.toBase64(v4Uuid)

      expect(base64Id).toBeUndefined()
    })
  })

  describe('AI Options Data Validation', () => {
    it('should create AI options with chat type ID and prompt', () => {
      const chatTypeId = Uuid7Util.createUuidv7()
      const aiOption = {
        chatTypeId,
        prompt: chatTypesData[0]!.prompt,
        maxTokens: null,
        temperature: null,
        topP: null,
        frequencyPenalty: null,
        presencePenalty: null,
      }

      expect(aiOption).toHaveProperty('chatTypeId')
      expect(aiOption).toHaveProperty('prompt')
      expect(aiOption.chatTypeId).toBe(chatTypeId)
      expect(aiOption.prompt).toBe(chatTypesData[0]!.prompt)
    })

    it('should have null values for optional parameters', () => {
      const aiOption = {
        chatTypeId: Uuid7Util.createUuidv7(),
        prompt: chatTypesData[0]!.prompt,
        maxTokens: null,
        temperature: null,
        topP: null,
        frequencyPenalty: null,
        presencePenalty: null,
      }

      expect(aiOption.maxTokens).toBeNull()
      expect(aiOption.temperature).toBeNull()
      expect(aiOption.topP).toBeNull()
      expect(aiOption.frequencyPenalty).toBeNull()
      expect(aiOption.presencePenalty).toBeNull()
    })

    it('should have a prompt that mentions Heart of Darkness and Joseph Conrad', () => {
      const prompt = chatTypesData[0]!.prompt
      expect(prompt).toContain('Heart of Darkness')
      expect(prompt).toContain('Joseph Conrad')
    })
  })

  describe('AI Options Mapping Logic', () => {
    it('should map prompts using a name-based lookup', () => {
      // Simulate inserted chat types (as returned from database)
      const insertedChatTypes = chatTypesData.map((chatType) => ({
        id: Uuid7Util.createUuidv7(),
        name: chatType.name,
        seoFriendlyId: SEO.generateSeoFriendlyTitle(chatType.name),
        seoFriendlyBase64Id: Uuid7Util.toBase64(Uuid7Util.createUuidv7())!,
        description: chatType.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      // Create a map for name-based lookup
      const promptByName = new Map(chatTypesData.map((chatType) => [chatType.name, chatType.prompt]))

      const aiOptionsToInsert = insertedChatTypes.map((chatType) => {
        const prompt = promptByName.get(chatType.name)

        if (!prompt) {
          throw new Error(`No prompt found for chat type with name: ${chatType.name}`)
        }

        return {
          chatTypeId: chatType.id,
          prompt,
          maxTokens: null,
          temperature: null,
          topP: null,
          frequencyPenalty: null,
          presencePenalty: null,
        }
      })

      expect(aiOptionsToInsert).toHaveLength(1)
      expect(aiOptionsToInsert[0]!.prompt).toBe(chatTypesData[0]!.prompt)
      expect(aiOptionsToInsert[0]!.chatTypeId).toBe(insertedChatTypes[0]!.id)
    })

    it('should correctly map prompts regardless of database return order', () => {
      // Simulate inserted chat types in a different order than the seed data
      const insertedChatTypes = [
        {
          id: Uuid7Util.createUuidv7(),
          name: 'The Heart of Darkness', // This matches the first item in chatTypesData
          seoFriendlyId: SEO.generateSeoFriendlyTitle('The Heart of Darkness'),
          seoFriendlyBase64Id: Uuid7Util.toBase64(Uuid7Util.createUuidv7())!,
          description: chatTypesData[0]!.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const promptByName = new Map(chatTypesData.map((chatType) => [chatType.name, chatType.prompt]))

      const aiOptionsToInsert = insertedChatTypes.map((chatType) => {
        const prompt = promptByName.get(chatType.name)

        if (!prompt) {
          throw new Error(`No prompt found for chat type with name: ${chatType.name}`)
        }

        return {
          chatTypeId: chatType.id,
          prompt,
          maxTokens: null,
          temperature: null,
          topP: null,
          frequencyPenalty: null,
          presencePenalty: null,
        }
      })

      // Verify the correct prompt is used
      expect(aiOptionsToInsert[0]!.prompt).toBe(chatTypesData[0]!.prompt)
      expect(aiOptionsToInsert[0]!.prompt).toContain('Heart of Darkness')
    })

    it('should throw error when prompt not found for chat type name', () => {
      const insertedChatTypes = [
        {
          id: Uuid7Util.createUuidv7(),
          name: 'Non-existent Chat Type',
          seoFriendlyId: 'non-existent-chat-type',
          seoFriendlyBase64Id: Uuid7Util.toBase64(Uuid7Util.createUuidv7())!,
          description: 'This does not exist in chatTypesData',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const promptByName = new Map(chatTypesData.map((chatType) => [chatType.name, chatType.prompt]))

      expect(() => {
        insertedChatTypes.map((chatType) => {
          const prompt = promptByName.get(chatType.name)

          if (!prompt) {
            throw new Error(`No prompt found for chat type with name: ${chatType.name}`)
          }

          return {
            chatTypeId: chatType.id,
            prompt,
            maxTokens: null,
            temperature: null,
            topP: null,
            frequencyPenalty: null,
            presencePenalty: null,
          }
        })
      }).toThrow('No prompt found for chat type with name: Non-existent Chat Type')
    })

    it('should maintain relationship between chat type and its prompt', () => {
      const insertedChatTypes = chatTypesData.map((chatType) => ({
        id: Uuid7Util.createUuidv7(),
        name: chatType.name,
        seoFriendlyId: SEO.generateSeoFriendlyTitle(chatType.name),
        seoFriendlyBase64Id: Uuid7Util.toBase64(Uuid7Util.createUuidv7())!,
        description: chatType.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      const promptByName = new Map(chatTypesData.map((chatType) => [chatType.name, chatType.prompt]))

      const aiOptionsToInsert = insertedChatTypes.map((chatType) => {
        const prompt = promptByName.get(chatType.name)

        if (!prompt) {
          throw new Error(`No prompt found for chat type with name: ${chatType.name}`)
        }

        return {
          chatTypeId: chatType.id,
          prompt,
          maxTokens: null,
          temperature: null,
          topP: null,
          frequencyPenalty: null,
          presencePenalty: null,
        }
      })

      // Verify each AI option is correctly linked to its chat type
      aiOptionsToInsert.forEach((aiOption, index) => {
        const correspondingChatType = insertedChatTypes[index]!
        const correspondingOriginalData = chatTypesData.find((ct) => ct.name === correspondingChatType.name)

        expect(aiOption.chatTypeId).toBe(correspondingChatType.id)
        expect(aiOption.prompt).toBe(correspondingOriginalData!.prompt)
      })
    })
  })
})
