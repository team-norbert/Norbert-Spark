import { describe, expect, it } from 'vitest'

import { validateKebabCase } from '../../src/utils/functions.js'

describe('validateKebabCase', () => {
  describe('valid kebab-case values (should return true)', () => {
    it('should accept a single lowercase letter', () => {
      expect(validateKebabCase('a')).toBe(true)
    })

    it('should accept a single digit', () => {
      expect(validateKebabCase('5')).toBe(true)
    })

    it('should accept a simple lowercase word', () => {
      expect(validateKebabCase('hello')).toBe(true)
    })

    it('should accept two words separated by a hyphen', () => {
      expect(validateKebabCase('hello-world')).toBe(true)
    })

    it('should accept multiple hyphen-separated words', () => {
      expect(validateKebabCase('my-chat-type')).toBe(true)
    })

    it('should accept values with digits', () => {
      expect(validateKebabCase('chat-type-2')).toBe(true)
    })

    it('should accept values starting with a digit', () => {
      expect(validateKebabCase('3d-model')).toBe(true)
    })

    it('should accept all-digit values', () => {
      expect(validateKebabCase('123')).toBe(true)
    })

    it('should accept digits mixed with letters and hyphens', () => {
      expect(validateKebabCase('a1-b2-c3')).toBe(true)
    })

    it('should accept a value at exactly 200 characters', () => {
      const value = 'a'.repeat(200)
      expect(validateKebabCase(value)).toBe(true)
    })
  })

  describe('invalid kebab-case values (should return false)', () => {
    it('should reject an empty string', () => {
      expect(validateKebabCase('')).toBe(false)
    })

    it('should reject a value starting with a hyphen', () => {
      expect(validateKebabCase('-hello')).toBe(false)
    })

    it('should reject a value ending with a hyphen', () => {
      expect(validateKebabCase('hello-')).toBe(false)
    })

    it('should reject a value with consecutive hyphens', () => {
      expect(validateKebabCase('hello--world')).toBe(false)
    })

    it('should reject uppercase letters', () => {
      expect(validateKebabCase('Hello')).toBe(false)
    })

    it('should reject mixed case', () => {
      expect(validateKebabCase('helloWorld')).toBe(false)
    })

    it('should reject values with spaces', () => {
      expect(validateKebabCase('hello world')).toBe(false)
    })

    it('should reject values with underscores', () => {
      expect(validateKebabCase('hello_world')).toBe(false)
    })

    it('should reject values with special characters', () => {
      expect(validateKebabCase('hello@world')).toBe(false)
    })

    it('should reject values with dots', () => {
      expect(validateKebabCase('hello.world')).toBe(false)
    })

    it('should reject a value exceeding 200 characters', () => {
      const value = 'a'.repeat(201)
      expect(validateKebabCase(value)).toBe(false)
    })

    it('should reject a lone hyphen', () => {
      expect(validateKebabCase('-')).toBe(false)
    })

    it('should reject multiple consecutive hyphens in the middle', () => {
      expect(validateKebabCase('a---b')).toBe(false)
    })

    it('should reject values starting with uppercase followed by valid characters', () => {
      expect(validateKebabCase('A-valid')).toBe(false)
    })

    it('should reject values ending with uppercase', () => {
      expect(validateKebabCase('valid-A')).toBe(false)
    })
  })
})
