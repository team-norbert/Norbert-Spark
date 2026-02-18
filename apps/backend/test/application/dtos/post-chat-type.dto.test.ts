import { describe, expect, it } from 'vitest'

import { PostChatType } from '../../../src/application/dtos/post-chat-types.dto.js'
import { TypeException } from '../../../src/shared/exceptions/type.exception.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('PostChatType', () => {
  // ── constructor ────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should create an instance with the given name and description', () => {
      const dto = new PostChatType('General Chat', 'A helpful assistant')

      expect(dto.name).toBe('General Chat')
      expect(dto.description).toBe('A helpful assistant')
    })

    it('should expose name and description as readonly properties', () => {
      const dto = new PostChatType('General Chat', 'A helpful assistant')

      expect(dto).toHaveProperty('name')
      expect(dto).toHaveProperty('description')
    })
  })

  // ── validate() – type-level guards ────────────────────────────────────────

  describe('validate() - type validation', () => {
    it('should throw TypeException when data is undefined', () => {
      expect(() => PostChatType.validate(undefined)).toThrow(TypeException)
      expect(() => PostChatType.validate(undefined)).toThrow('Invalid data: expected an object')
    })

    it('should throw TypeException when data is null', () => {
      expect(() => PostChatType.validate(null)).toThrow(TypeException)
      expect(() => PostChatType.validate(null)).toThrow('Invalid data: expected an object')
    })

    it('should throw TypeException when data is a string', () => {
      expect(() => PostChatType.validate('string')).toThrow(TypeException)
      expect(() => PostChatType.validate('string')).toThrow('Invalid data: expected an object')
    })

    it('should throw TypeException when data is a number', () => {
      expect(() => PostChatType.validate(42)).toThrow(TypeException)
    })

    it('should throw TypeException when data is a boolean', () => {
      expect(() => PostChatType.validate(true)).toThrow(TypeException)
    })

    it('should throw TypeException when data is an array', () => {
      expect(() => PostChatType.validate([])).toThrow(TypeException)
      expect(() => PostChatType.validate([])).toThrow('Invalid data: expected an object')
    })
  })

  // ── validate() – name field ────────────────────────────────────────────────

  describe('validate() - name validation', () => {
    it('should throw ValidationException when name is missing', () => {
      expect(() => PostChatType.validate({ description: 'Valid description' })).toThrow(
        ValidationException
      )
      expect(() => PostChatType.validate({ description: 'Valid description' })).toThrow(
        'Invalid name: must be a non-empty string'
      )
    })

    it('should throw ValidationException when name is undefined', () => {
      expect(() =>
        PostChatType.validate({ name: undefined, description: 'Valid description' })
      ).toThrow(ValidationException)
    })

    it('should throw ValidationException when name is null', () => {
      expect(() => PostChatType.validate({ name: null, description: 'Valid description' })).toThrow(
        ValidationException
      )
      expect(() => PostChatType.validate({ name: null, description: 'Valid description' })).toThrow(
        'Invalid name: must be a non-empty string'
      )
    })

    it('should throw ValidationException when name is a number', () => {
      expect(() => PostChatType.validate({ name: 123, description: 'Valid description' })).toThrow(
        ValidationException
      )
      expect(() => PostChatType.validate({ name: 123, description: 'Valid description' })).toThrow(
        'Invalid name: must be a non-empty string'
      )
    })

    it('should throw ValidationException when name is an empty string', () => {
      expect(() => PostChatType.validate({ name: '', description: 'Valid description' })).toThrow(
        ValidationException
      )
      expect(() => PostChatType.validate({ name: '', description: 'Valid description' })).toThrow(
        'Invalid name: must be a non-empty string'
      )
    })

    it('should throw ValidationException when name is only whitespace', () => {
      expect(() =>
        PostChatType.validate({ name: '   ', description: 'Valid description' })
      ).toThrow(ValidationException)
      expect(() =>
        PostChatType.validate({ name: '   ', description: 'Valid description' })
      ).toThrow('Invalid name: must be a non-empty string')
    })

    it('should throw ValidationException when name exceeds 200 characters', () => {
      const longName = 'a'.repeat(201)

      expect(() =>
        PostChatType.validate({ name: longName, description: 'Valid description' })
      ).toThrow(ValidationException)
      expect(() =>
        PostChatType.validate({ name: longName, description: 'Valid description' })
      ).toThrow('Invalid name: must be less than 200 characters')
    })

    it('should accept a name of exactly 200 characters', () => {
      const name = 'a'.repeat(200)

      const dto = PostChatType.validate({ name, description: 'Valid description' })

      expect(dto.name).toBe(name)
    })

    it('should trim leading and trailing whitespace from name', () => {
      const dto = PostChatType.validate({ name: '  My Chat  ', description: 'Valid description' })

      expect(dto.name).toBe('My Chat')
    })
  })

  // ── validate() – description field ────────────────────────────────────────

  describe('validate() - description validation', () => {
    it('should throw ValidationException when description is missing', () => {
      expect(() => PostChatType.validate({ name: 'Valid name' })).toThrow(ValidationException)
      expect(() => PostChatType.validate({ name: 'Valid name' })).toThrow(
        'Invalid description: must be a non-empty string'
      )
    })

    it('should throw ValidationException when description is undefined', () => {
      expect(() => PostChatType.validate({ name: 'Valid name', description: undefined })).toThrow(
        ValidationException
      )
    })

    it('should throw ValidationException when description is null', () => {
      expect(() => PostChatType.validate({ name: 'Valid name', description: null })).toThrow(
        ValidationException
      )
      expect(() => PostChatType.validate({ name: 'Valid name', description: null })).toThrow(
        'Invalid description: must be a non-empty string'
      )
    })

    it('should throw ValidationException when description is a number', () => {
      expect(() => PostChatType.validate({ name: 'Valid name', description: 42 })).toThrow(
        ValidationException
      )
      expect(() => PostChatType.validate({ name: 'Valid name', description: 42 })).toThrow(
        'Invalid description: must be a non-empty string'
      )
    })

    it('should throw ValidationException when description is an empty string', () => {
      expect(() => PostChatType.validate({ name: 'Valid name', description: '' })).toThrow(
        ValidationException
      )
      expect(() => PostChatType.validate({ name: 'Valid name', description: '' })).toThrow(
        'Invalid description: must be a non-empty string'
      )
    })

    it('should throw ValidationException when description is only whitespace', () => {
      expect(() => PostChatType.validate({ name: 'Valid name', description: '   ' })).toThrow(
        ValidationException
      )
      expect(() => PostChatType.validate({ name: 'Valid name', description: '   ' })).toThrow(
        'Invalid description: must be a non-empty string'
      )
    })

    it('should throw ValidationException when description exceeds 500 characters', () => {
      const longDescription = 'a'.repeat(501)

      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: longDescription })
      ).toThrow(ValidationException)
      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: longDescription })
      ).toThrow('Invalid description: must be less than 500 characters')
    })

    it('should accept a description of exactly 500 characters', () => {
      const description = 'a'.repeat(500)

      const dto = PostChatType.validate({ name: 'Valid name', description })

      expect(dto.description).toBe(description)
    })

    it('should trim leading and trailing whitespace from description', () => {
      const dto = PostChatType.validate({
        name: 'Valid name',
        description: '  A helpful assistant  ',
      })

      expect(dto.description).toBe('A helpful assistant')
    })
  })

  // ── validate() – successful construction ──────────────────────────────────

  describe('validate() - successful construction', () => {
    it('should return a PostChatType instance for valid data', () => {
      const dto = PostChatType.validate({
        name: 'General Chat',
        description: 'A helpful assistant',
      })

      expect(dto).toBeInstanceOf(PostChatType)
    })

    it('should set the trimmed name on the returned instance', () => {
      const dto = PostChatType.validate({
        name: '  General Chat  ',
        description: 'A helpful assistant',
      })

      expect(dto.name).toBe('General Chat')
    })

    it('should set the trimmed description on the returned instance', () => {
      const dto = PostChatType.validate({
        name: 'General Chat',
        description: '  A helpful assistant  ',
      })

      expect(dto.description).toBe('A helpful assistant')
    })

    it('should accept a single-character name', () => {
      const dto = PostChatType.validate({ name: 'A', description: 'Valid description' })

      expect(dto.name).toBe('A')
    })

    it('should accept a single-character description', () => {
      const dto = PostChatType.validate({ name: 'Valid name', description: 'D' })

      expect(dto.description).toBe('D')
    })

    it('should ignore extra properties on the input object', () => {
      const dto = PostChatType.validate({
        name: 'General Chat',
        description: 'A helpful assistant',
        extra: 'ignored',
      })

      expect(dto).toBeInstanceOf(PostChatType)
      expect(dto.name).toBe('General Chat')
      expect(dto.description).toBe('A helpful assistant')
    })
  })

  // ── validate() – boundary: both length limits hit together ───────────────

  describe('validate() - boundary conditions', () => {
    it('should reject name at 201 characters before checking description', () => {
      const longName = 'a'.repeat(201)

      expect(() =>
        PostChatType.validate({ name: longName, description: 'Valid description' })
      ).toThrow('Invalid name: must be less than 200 characters')
    })

    it('should reject description at 501 characters when name is valid', () => {
      const longDescription = 'a'.repeat(501)

      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: longDescription })
      ).toThrow('Invalid description: must be less than 500 characters')
    })

    it('should validate name before checking description length', () => {
      // Both are invalid, but name is checked first
      expect(() => PostChatType.validate({ name: '', description: 'a'.repeat(501) })).toThrow(
        'Invalid name: must be a non-empty string'
      )
    })
  })
})
