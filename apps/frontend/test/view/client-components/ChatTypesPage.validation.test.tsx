import { describe, expect, it } from 'vitest'

import {
  isDescriptionInvalid,
  isNameInvalid,
  isSeoFriendlyIdInvalid,
} from '@/view/client-components/ChatTypesPage.js'

describe('ChatTypesPage validation predicates', () => {
  // ── isNameInvalid ─────────────────────────────────────────────────────
  describe('isNameInvalid', () => {
    it('should return false for a single character name', () => {
      expect(isNameInvalid('a')).toBe(false)
    })

    it('should return false for a typical name', () => {
      expect(isNameInvalid('General Chat')).toBe(false)
    })

    it('should return false for a name at exactly 200 characters', () => {
      expect(isNameInvalid('a'.repeat(200))).toBe(false)
    })

    it('should return true for an empty string', () => {
      expect(isNameInvalid('')).toBe(true)
    })

    it('should return true for a name exceeding 200 characters', () => {
      expect(isNameInvalid('a'.repeat(201))).toBe(true)
    })
  })

  // ── isSeoFriendlyIdInvalid ────────────────────────────────────────────
  describe('isSeoFriendlyIdInvalid', () => {
    describe('valid kebab-case values', () => {
      it('should return false for a single lowercase letter', () => {
        expect(isSeoFriendlyIdInvalid('a')).toBe(false)
      })

      it('should return false for a simple kebab-case value', () => {
        expect(isSeoFriendlyIdInvalid('my-chat-type')).toBe(false)
      })

      it('should return false for a value with digits', () => {
        expect(isSeoFriendlyIdInvalid('chat-type-2')).toBe(false)
      })

      it('should return false for a value starting with a digit', () => {
        expect(isSeoFriendlyIdInvalid('3d-model')).toBe(false)
      })

      it('should return false for a value at exactly 200 characters', () => {
        expect(isSeoFriendlyIdInvalid('a'.repeat(200))).toBe(false)
      })
    })

    describe('invalid kebab-case values', () => {
      it('should return true for an empty string', () => {
        expect(isSeoFriendlyIdInvalid('')).toBe(true)
      })

      it('should return true for uppercase letters', () => {
        expect(isSeoFriendlyIdInvalid('MyChat')).toBe(true)
      })

      it('should return true for a value starting with a hyphen', () => {
        expect(isSeoFriendlyIdInvalid('-chat')).toBe(true)
      })

      it('should return true for a value ending with a hyphen', () => {
        expect(isSeoFriendlyIdInvalid('chat-')).toBe(true)
      })

      it('should return true for consecutive hyphens', () => {
        expect(isSeoFriendlyIdInvalid('chat--type')).toBe(true)
      })

      it('should return true for spaces', () => {
        expect(isSeoFriendlyIdInvalid('chat type')).toBe(true)
      })

      it('should return true for underscores', () => {
        expect(isSeoFriendlyIdInvalid('chat_type')).toBe(true)
      })

      it('should return true for a value exceeding 200 characters', () => {
        expect(isSeoFriendlyIdInvalid('a'.repeat(201))).toBe(true)
      })

      it('should return true for special characters', () => {
        expect(isSeoFriendlyIdInvalid('chat@type')).toBe(true)
      })
    })
  })

  // ── isDescriptionInvalid ──────────────────────────────────────────────
  describe('isDescriptionInvalid', () => {
    it('should return false for a single character description', () => {
      expect(isDescriptionInvalid('a')).toBe(false)
    })

    it('should return false for a typical description', () => {
      expect(isDescriptionInvalid('This is a general chat type.')).toBe(false)
    })

    it('should return false for a description at exactly 500 characters', () => {
      expect(isDescriptionInvalid('a'.repeat(500))).toBe(false)
    })

    it('should return true for an empty string', () => {
      expect(isDescriptionInvalid('')).toBe(true)
    })

    it('should return true for a description exceeding 500 characters', () => {
      expect(isDescriptionInvalid('a'.repeat(501))).toBe(true)
    })
  })
})
