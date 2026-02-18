import type { GridPreProcessEditCellProps } from '@mui/x-data-grid'
import { describe, expect, it } from 'vitest'

import {
  validateDescription,
  validateName,
  validateSeoFriendlyId,
} from '@/view/client-components/ChatTypesPage.js'

/**
 * Helper to build a GridPreProcessEditCellProps-like object for testing.
 */
const makeParams = (value: string): GridPreProcessEditCellProps =>
  ({
    props: { value },
  }) as unknown as GridPreProcessEditCellProps

describe('ChatTypesPage validation functions', () => {
  // ── validateName ──────────────────────────────────────────────────────
  describe('validateName', () => {
    it('should accept a single character name', () => {
      const result = validateName(makeParams('a'))
      expect(result.error).toBe(false)
      expect(result.helperText).toBeUndefined()
    })

    it('should accept a typical name', () => {
      const result = validateName(makeParams('General Chat'))
      expect(result.error).toBe(false)
      expect(result.helperText).toBeUndefined()
    })

    it('should accept a name at exactly 200 characters', () => {
      const result = validateName(makeParams('a'.repeat(200)))
      expect(result.error).toBe(false)
      expect(result.helperText).toBeUndefined()
    })

    it('should reject an empty string', () => {
      const result = validateName(makeParams(''))
      expect(result.error).toBe(true)
      expect(result.helperText).toBe('Name must be between 1 and 200 characters')
    })

    it('should reject a name exceeding 200 characters', () => {
      const result = validateName(makeParams('a'.repeat(201)))
      expect(result.error).toBe(true)
      expect(result.helperText).toBe('Name must be between 1 and 200 characters')
    })

    it('should preserve other props from the params object', () => {
      const params = {
        props: { value: 'valid', isEditable: true },
      } as unknown as GridPreProcessEditCellProps
      const result = validateName(params) as unknown as Record<string, unknown>
      expect(result.isEditable).toBe(true)
    })
  })

  // ── validateSeoFriendlyId ─────────────────────────────────────────────
  describe('validateSeoFriendlyId', () => {
    describe('valid kebab-case values', () => {
      it('should accept a single lowercase letter', () => {
        const result = validateSeoFriendlyId(makeParams('a'))
        expect(result.error).toBe(false)
        expect(result.helperText).toBeUndefined()
      })

      it('should accept a simple kebab-case value', () => {
        const result = validateSeoFriendlyId(makeParams('my-chat-type'))
        expect(result.error).toBe(false)
        expect(result.helperText).toBeUndefined()
      })

      it('should accept a value with digits', () => {
        const result = validateSeoFriendlyId(makeParams('chat-type-2'))
        expect(result.error).toBe(false)
        expect(result.helperText).toBeUndefined()
      })

      it('should accept a value starting with a digit', () => {
        const result = validateSeoFriendlyId(makeParams('3d-model'))
        expect(result.error).toBe(false)
        expect(result.helperText).toBeUndefined()
      })

      it('should accept a value at exactly 200 characters', () => {
        const result = validateSeoFriendlyId(makeParams('a'.repeat(200)))
        expect(result.error).toBe(false)
        expect(result.helperText).toBeUndefined()
      })
    })

    describe('invalid kebab-case values', () => {
      const expectedHelperText =
        'SEO ID must be 1-200 chars in kebab-case format (e.g., my-chat-type)'

      it('should reject an empty string', () => {
        const result = validateSeoFriendlyId(makeParams(''))
        expect(result.error).toBe(true)
        expect(result.helperText).toBe(expectedHelperText)
      })

      it('should reject uppercase letters', () => {
        const result = validateSeoFriendlyId(makeParams('MyChat'))
        expect(result.error).toBe(true)
        expect(result.helperText).toBe(expectedHelperText)
      })

      it('should reject a value starting with a hyphen', () => {
        const result = validateSeoFriendlyId(makeParams('-chat'))
        expect(result.error).toBe(true)
        expect(result.helperText).toBe(expectedHelperText)
      })

      it('should reject a value ending with a hyphen', () => {
        const result = validateSeoFriendlyId(makeParams('chat-'))
        expect(result.error).toBe(true)
        expect(result.helperText).toBe(expectedHelperText)
      })

      it('should reject consecutive hyphens', () => {
        const result = validateSeoFriendlyId(makeParams('chat--type'))
        expect(result.error).toBe(true)
        expect(result.helperText).toBe(expectedHelperText)
      })

      it('should reject spaces', () => {
        const result = validateSeoFriendlyId(makeParams('chat type'))
        expect(result.error).toBe(true)
        expect(result.helperText).toBe(expectedHelperText)
      })

      it('should reject underscores', () => {
        const result = validateSeoFriendlyId(makeParams('chat_type'))
        expect(result.error).toBe(true)
        expect(result.helperText).toBe(expectedHelperText)
      })

      it('should reject a value exceeding 200 characters', () => {
        const result = validateSeoFriendlyId(makeParams('a'.repeat(201)))
        expect(result.error).toBe(true)
        expect(result.helperText).toBe(expectedHelperText)
      })

      it('should reject special characters', () => {
        const result = validateSeoFriendlyId(makeParams('chat@type'))
        expect(result.error).toBe(true)
        expect(result.helperText).toBe(expectedHelperText)
      })
    })

    it('should preserve other props from the params object', () => {
      const params = {
        props: { value: 'valid-id', isEditable: true },
      } as unknown as GridPreProcessEditCellProps
      const result = validateSeoFriendlyId(params) as unknown as Record<string, unknown>
      expect(result.isEditable).toBe(true)
    })
  })

  // ── validateDescription ───────────────────────────────────────────────
  describe('validateDescription', () => {
    it('should accept a single character description', () => {
      const result = validateDescription(makeParams('a'))
      expect(result.error).toBe(false)
      expect(result.helperText).toBeUndefined()
    })

    it('should accept a typical description', () => {
      const result = validateDescription(makeParams('This is a general chat type.'))
      expect(result.error).toBe(false)
      expect(result.helperText).toBeUndefined()
    })

    it('should accept a description at exactly 500 characters', () => {
      const result = validateDescription(makeParams('a'.repeat(500)))
      expect(result.error).toBe(false)
      expect(result.helperText).toBeUndefined()
    })

    it('should reject an empty string', () => {
      const result = validateDescription(makeParams(''))
      expect(result.error).toBe(true)
      expect(result.helperText).toBe('Description must be between 1 and 500 characters')
    })

    it('should reject a description exceeding 500 characters', () => {
      const result = validateDescription(makeParams('a'.repeat(501)))
      expect(result.error).toBe(true)
      expect(result.helperText).toBe('Description must be between 1 and 500 characters')
    })

    it('should preserve other props from the params object', () => {
      const params = {
        props: { value: 'valid description', isEditable: true },
      } as unknown as GridPreProcessEditCellProps
      const result = validateDescription(params) as unknown as Record<string, unknown>
      expect(result.isEditable).toBe(true)
    })
  })
})
