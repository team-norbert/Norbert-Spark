import { SEO } from '@norberts-spark/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
      expect(chatType.name).toBeTruthy()
      expect(chatType.description).toBeTruthy()
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
})
