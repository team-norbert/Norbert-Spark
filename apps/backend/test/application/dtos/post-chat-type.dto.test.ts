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

    it('should default rag to false when not provided', () => {
      const dto = new PostChatType('General Chat', 'A helpful assistant')

      expect(dto.rag).toBe(false)
    })

    it('should set rag to true when explicitly passed true', () => {
      const dto = new PostChatType('General Chat', 'A helpful assistant', true)

      expect(dto.rag).toBe(true)
    })

    it('should set rag to false when explicitly passed false', () => {
      const dto = new PostChatType('General Chat', 'A helpful assistant', false)

      expect(dto.rag).toBe(false)
    })

    it('should expose rag as a readonly property', () => {
      const dto = new PostChatType('General Chat', 'A helpful assistant')

      expect(dto).toHaveProperty('rag')
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
        PostChatType.validate({ name: longName, description: 'Valid description', rag: false })
      ).toThrow(ValidationException)
      expect(() =>
        PostChatType.validate({ name: longName, description: 'Valid description', rag: false })
      ).toThrow('Invalid name: must be less than 200 characters')
    })

    it('should accept a name of exactly 200 characters', () => {
      const name = 'a'.repeat(200)

      const dto = PostChatType.validate({ name, description: 'Valid description', rag: false })

      expect(dto.name).toBe(name)
    })

    it('should trim leading and trailing whitespace from name', () => {
      const dto = PostChatType.validate({
        name: '  My Chat  ',
        description: 'Valid description',
        rag: false,
      })

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
        PostChatType.validate({ name: 'Valid name', description: longDescription, rag: false })
      ).toThrow(ValidationException)
      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: longDescription, rag: false })
      ).toThrow('Invalid description: must be less than 500 characters')
    })

    it('should accept a description of exactly 500 characters', () => {
      const description = 'a'.repeat(500)

      const dto = PostChatType.validate({ name: 'Valid name', description, rag: false })

      expect(dto.description).toBe(description)
    })

    it('should trim leading and trailing whitespace from description', () => {
      const dto = PostChatType.validate({
        name: 'Valid name',
        description: '  A helpful assistant  ',
        rag: false,
      })

      expect(dto.description).toBe('A helpful assistant')
    })
  })

  // ── validate() – rag field ─────────────────────────────────────────────────

  describe('validate() - rag validation', () => {
    it('should throw ValidationException when rag is not provided', () => {
      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: 'Valid description' })
      ).toThrow(ValidationException)
      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: 'Valid description' })
      ).toThrow('Invalid rag: must be a boolean')
    })

    it('should throw ValidationException when rag is null', () => {
      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: 'Valid description', rag: null })
      ).toThrow(ValidationException)
      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: 'Valid description', rag: null })
      ).toThrow('Invalid rag: must be a boolean')
    })

    it('should throw ValidationException when rag is a string', () => {
      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: 'Valid description', rag: 'true' })
      ).toThrow(ValidationException)
      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: 'Valid description', rag: 'true' })
      ).toThrow('Invalid rag: must be a boolean')
    })

    it('should throw ValidationException when rag is a number', () => {
      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: 'Valid description', rag: 1 })
      ).toThrow(ValidationException)
      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: 'Valid description', rag: 1 })
      ).toThrow('Invalid rag: must be a boolean')
    })

    it('should accept rag: true without throwing', () => {
      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: 'Valid description', rag: true })
      ).not.toThrow()
    })

    it('should accept rag: false without throwing', () => {
      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: 'Valid description', rag: false })
      ).not.toThrow()
    })

    it('should store rag: true on the returned instance', () => {
      const dto = PostChatType.validate({
        name: 'RAG Chat',
        description: 'Uses retrieval-augmented generation',
        rag: true,
      })

      expect(dto.rag).toBe(true)
    })

    it('should store rag: false on the returned instance', () => {
      const dto = PostChatType.validate({
        name: 'Standard Chat',
        description: 'No RAG enabled',
        rag: false,
      })

      expect(dto.rag).toBe(false)
    })
  })

  // ── validate() – successful construction ──────────────────────────────────

  describe('validate() - successful construction', () => {
    it('should return a PostChatType instance for valid data', () => {
      const dto = PostChatType.validate({
        name: 'General Chat',
        description: 'A helpful assistant',
        rag: false,
      })

      expect(dto).toBeInstanceOf(PostChatType)
      expect(dto.rag).toBe(false)
    })

    it('should set the trimmed name on the returned instance', () => {
      const dto = PostChatType.validate({
        name: '  General Chat  ',
        description: 'A helpful assistant',
        rag: false,
      })

      expect(dto.name).toBe('General Chat')
    })

    it('should set the trimmed description on the returned instance', () => {
      const dto = PostChatType.validate({
        name: 'General Chat',
        description: '  A helpful assistant  ',
        rag: false,
      })

      expect(dto.description).toBe('A helpful assistant')
    })

    it('should accept a single-character name', () => {
      const dto = PostChatType.validate({ name: 'A', description: 'Valid description', rag: false })

      expect(dto.name).toBe('A')
    })

    it('should accept a single-character description', () => {
      const dto = PostChatType.validate({ name: 'Valid name', description: 'D', rag: false })

      expect(dto.description).toBe('D')
    })

    it('should ignore extra properties on the input object', () => {
      const dto = PostChatType.validate({
        name: 'General Chat',
        description: 'A helpful assistant',
        rag: false,
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
        PostChatType.validate({ name: longName, description: 'Valid description', rag: false })
      ).toThrow('Invalid name: must be less than 200 characters')
    })

    it('should reject description at 501 characters when name is valid', () => {
      const longDescription = 'a'.repeat(501)

      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: longDescription, rag: false })
      ).toThrow('Invalid description: must be less than 500 characters')
    })

    it('should validate name before checking description length', () => {
      // Both are invalid, but name is checked first
      expect(() => PostChatType.validate({ name: '', description: 'a'.repeat(501) })).toThrow(
        'Invalid name: must be a non-empty string'
      )
    })

    it('should report rag error before name-length error when rag is missing', () => {
      // name is too long but rag check fires first
      const longName = 'a'.repeat(201)

      expect(() =>
        PostChatType.validate({ name: longName, description: 'Valid description' })
      ).toThrow('Invalid rag: must be a boolean')
    })

    it('should report rag error before description-length error when rag is missing', () => {
      // description is too long but rag check fires first
      const longDescription = 'a'.repeat(501)

      expect(() =>
        PostChatType.validate({ name: 'Valid name', description: longDescription })
      ).toThrow('Invalid rag: must be a boolean')
    })
  })
})
