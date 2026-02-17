import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'

import { PutChatTypeDto } from '../../../src/application/dtos/put-chat-type.dto.js'
import { Uuid } from '../../../src/domain/value-objects/uuid.js'
import { TypeException } from '../../../src/shared/exceptions/type.exception.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('PutChatTypeDto', () => {
  describe('constructor', () => {
    it('should create PutChatTypeDto with all fields', () => {
      const validUuid = new Uuid(uuidv7()).getValue()
      const dto = new PutChatTypeDto(validUuid, 'Chat Name', 'chat-name', 'Chat description')

      expect(dto.id).toBe(validUuid)
      expect(dto.name).toBe('Chat Name')
      expect(dto.seoFriendlyId).toBe('chat-name')
      expect(dto.description).toBe('Chat description')
    })

    it('should create PutChatTypeDto with only required id field', () => {
      const validUuid = new Uuid(uuidv7()).getValue()
      const dto = new PutChatTypeDto(validUuid)

      expect(dto.id).toBe(validUuid)
      expect(dto.name).toBeUndefined()
      expect(dto.seoFriendlyId).toBeUndefined()
      expect(dto.description).toBeUndefined()
    })

    it('should create PutChatTypeDto with partial optional fields', () => {
      const validUuid = new Uuid(uuidv7()).getValue()
      const dto = new PutChatTypeDto(validUuid, 'Chat Name', undefined, 'Description')

      expect(dto.id).toBe(validUuid)
      expect(dto.name).toBe('Chat Name')
      expect(dto.seoFriendlyId).toBeUndefined()
      expect(dto.description).toBe('Description')
    })
  })

  describe('validate() - type validation', () => {
    it('should throw TypeException when data is undefined', () => {
      expect(() => PutChatTypeDto.validate(undefined as any)).toThrow(TypeException)
      expect(() => PutChatTypeDto.validate(undefined as any)).toThrow(
        'Invalid data: expected an object'
      )
    })

    it('should throw TypeException when data is null', () => {
      expect(() => PutChatTypeDto.validate(null as any)).toThrow(TypeException)
      expect(() => PutChatTypeDto.validate(null as any)).toThrow('Invalid data: expected an object')
    })

    it('should throw TypeException when data is not an object', () => {
      expect(() => PutChatTypeDto.validate('string' as any)).toThrow(TypeException)
      expect(() => PutChatTypeDto.validate(123 as any)).toThrow(TypeException)
      expect(() => PutChatTypeDto.validate(true as any)).toThrow(TypeException)
      expect(() => PutChatTypeDto.validate([] as any)).toThrow(TypeException)
    })
  })

  describe('validate() - id validation', () => {
    it('should accept valid UUID v7 for id', () => {
      const validUuid = uuidv7()
      const data = { id: validUuid }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.id).toBe(validUuid)
    })

    it('should throw ValidationException when id is missing', () => {
      expect(() => PutChatTypeDto.validate({} as any)).toThrow(ValidationException)
      expect(() => PutChatTypeDto.validate({} as any)).toThrow(
        'Invalid request body: id is required'
      )
    })

    it('should throw ValidationException when id is undefined', () => {
      expect(() => PutChatTypeDto.validate({ id: undefined } as any)).toThrow(ValidationException)
      expect(() => PutChatTypeDto.validate({ id: undefined } as any)).toThrow(
        'Invalid request body: id is required'
      )
    })

    it('should throw ValidationException when id is not a string', () => {
      expect(() => PutChatTypeDto.validate({ id: 123 } as any)).toThrow(ValidationException)
      expect(() => PutChatTypeDto.validate({ id: 123 } as any)).toThrow(
        'Invalid id: must be a string'
      )
    })

    it('should throw ValidationException when id is not a valid UUID', () => {
      expect(() => PutChatTypeDto.validate({ id: 'not-a-uuid' })).toThrow(ValidationException)
      expect(() => PutChatTypeDto.validate({ id: 'not-a-uuid' })).toThrow(
        'Invalid id format: incorrect ChatId format'
      )
    })

    it('should throw ValidationException when id is not UUID v7', () => {
      const uuidv4 = '123e4567-e89b-12d3-a456-426614174000'
      expect(() => PutChatTypeDto.validate({ id: uuidv4 })).toThrow(ValidationException)
      expect(() => PutChatTypeDto.validate({ id: uuidv4 })).toThrow(
        'Invalid id format: incorrect ChatId format'
      )
    })
  })

  describe('validate() - name validation', () => {
    it('should accept valid name', () => {
      const validUuid = uuidv7()
      const data = { id: validUuid, name: 'Chat Type Name' }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.name).toBe('Chat Type Name')
    })

    it('should accept undefined name', () => {
      const validUuid = uuidv7()
      const data = { id: validUuid }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.name).toBeUndefined()
    })

    it('should convert null name to undefined', () => {
      const validUuid = uuidv7()
      const data = { id: validUuid, name: null as any }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.name).toBeUndefined()
    })

    it('should throw ValidationException when name is not a string', () => {
      const validUuid = uuidv7()
      expect(() => PutChatTypeDto.validate({ id: validUuid, name: 123 } as any)).toThrow(
        ValidationException
      )
      expect(() => PutChatTypeDto.validate({ id: validUuid, name: 123 } as any)).toThrow(
        'Invalid name: must be a string'
      )
    })

    it('should throw ValidationException when name is empty string', () => {
      const validUuid = uuidv7()
      expect(() => PutChatTypeDto.validate({ id: validUuid, name: '' })).toThrow(
        ValidationException
      )
      expect(() => PutChatTypeDto.validate({ id: validUuid, name: '' })).toThrow(
        'Invalid name: must be a string between 1 and 200 characters'
      )
    })

    it('should throw ValidationException when name is too long', () => {
      const validUuid = uuidv7()
      const longName = 'a'.repeat(201)
      expect(() => PutChatTypeDto.validate({ id: validUuid, name: longName })).toThrow(
        ValidationException
      )
      expect(() => PutChatTypeDto.validate({ id: validUuid, name: longName })).toThrow(
        'Invalid name: must be a string between 1 and 200 characters'
      )
    })

    it('should accept name at minimum length (1 character)', () => {
      const validUuid = uuidv7()
      const data = { id: validUuid, name: 'A' }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.name).toBe('A')
    })

    it('should accept name at maximum length (200 characters)', () => {
      const validUuid = uuidv7()
      const maxName = 'a'.repeat(200)
      const data = { id: validUuid, name: maxName }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.name).toBe(maxName)
    })
  })

  describe('validate() - seoFriendlyId validation', () => {
    it('should accept valid seoFriendlyId', () => {
      const validUuid = uuidv7()
      const data = { id: validUuid, seoFriendlyId: 'chat-type-id' }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.seoFriendlyId).toBe('chat-type-id')
    })

    it('should accept undefined seoFriendlyId', () => {
      const validUuid = uuidv7()
      const data = { id: validUuid }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.seoFriendlyId).toBeUndefined()
    })

    it('should convert null seoFriendlyId to undefined', () => {
      const validUuid = uuidv7()
      const data = { id: validUuid, seoFriendlyId: null as any }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.seoFriendlyId).toBeUndefined()
    })

    it('should throw ValidationException when seoFriendlyId is not a string', () => {
      const validUuid = uuidv7()
      expect(() => PutChatTypeDto.validate({ id: validUuid, seoFriendlyId: 123 } as any)).toThrow(
        ValidationException
      )
      expect(() => PutChatTypeDto.validate({ id: validUuid, seoFriendlyId: 123 } as any)).toThrow(
        'Invalid seoFriendlyId: must be a string'
      )
    })

    it('should throw ValidationException when seoFriendlyId is empty string', () => {
      const validUuid = uuidv7()
      const data = { id: validUuid, seoFriendlyId: '' }

      expect(() => PutChatTypeDto.validate(data)).toThrow(ValidationException)
      expect(() => PutChatTypeDto.validate(data)).toThrow(
        'Invalid seoFriendlyId: must be a string between 1 and 200 characters'
      )
    })

    it('should accept seoFriendlyId at minimum length (1 character)', () => {
      const validUuid = uuidv7()
      const data = { id: validUuid, seoFriendlyId: 'a' }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.seoFriendlyId).toBe('a')
    })

    it('should accept seoFriendlyId at maximum length (200 characters)', () => {
      const validUuid = uuidv7()
      const longSeoId = 'a'.repeat(200)
      const data = { id: validUuid, seoFriendlyId: longSeoId }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.seoFriendlyId).toBe(longSeoId)
    })

    it('should throw ValidationException when seoFriendlyId is too long', () => {
      const validUuid = uuidv7()
      const tooLongSeoId = 'a'.repeat(201)
      const data = { id: validUuid, seoFriendlyId: tooLongSeoId }

      expect(() => PutChatTypeDto.validate(data)).toThrow(ValidationException)
      expect(() => PutChatTypeDto.validate(data)).toThrow(
        'Invalid seoFriendlyId: must be a string between 1 and 200 characters'
      )
    })
  })

  describe('validate() - description validation', () => {
    it('should accept valid description', () => {
      const validUuid = uuidv7()
      const data = { id: validUuid, description: 'This is a chat type description' }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.description).toBe('This is a chat type description')
    })

    it('should accept undefined description', () => {
      const validUuid = uuidv7()
      const data = { id: validUuid }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.description).toBeUndefined()
    })

    it('should convert null description to undefined', () => {
      const validUuid = uuidv7()
      const data = { id: validUuid, description: null as any }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.description).toBeUndefined()
    })

    it('should throw ValidationException when description is not a string', () => {
      const validUuid = uuidv7()
      expect(() => PutChatTypeDto.validate({ id: validUuid, description: 123 } as any)).toThrow(
        ValidationException
      )
      expect(() => PutChatTypeDto.validate({ id: validUuid, description: 123 } as any)).toThrow(
        'Invalid description: must be a string'
      )
    })

    it('should throw ValidationException when description is empty string', () => {
      const validUuid = uuidv7()
      expect(() => PutChatTypeDto.validate({ id: validUuid, description: '' })).toThrow(
        ValidationException
      )
      expect(() => PutChatTypeDto.validate({ id: validUuid, description: '' })).toThrow(
        'Invalid description: must be a string between 1 and 500 characters'
      )
    })

    it('should throw ValidationException when description is too long', () => {
      const validUuid = uuidv7()
      const longDescription = 'a'.repeat(501)
      expect(() =>
        PutChatTypeDto.validate({ id: validUuid, description: longDescription })
      ).toThrow(ValidationException)
      expect(() =>
        PutChatTypeDto.validate({ id: validUuid, description: longDescription })
      ).toThrow('Invalid description: must be a string between 1 and 500 characters')
    })

    it('should accept description at minimum length (1 character)', () => {
      const validUuid = uuidv7()
      const data = { id: validUuid, description: 'A' }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.description).toBe('A')
    })

    it('should accept description at maximum length (500 characters)', () => {
      const validUuid = uuidv7()
      const maxDescription = 'a'.repeat(500)
      const data = { id: validUuid, description: maxDescription }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.description).toBe(maxDescription)
    })
  })

  describe('validate() - complete scenarios', () => {
    it('should create DTO with only id', () => {
      const validUuid = uuidv7()
      const data = { id: validUuid }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.id).toBe(validUuid)
      expect(dto.name).toBeUndefined()
      expect(dto.seoFriendlyId).toBeUndefined()
      expect(dto.description).toBeUndefined()
    })

    it('should create DTO with all fields', () => {
      const validUuid = uuidv7()
      const data = {
        id: validUuid,
        name: 'Complete Chat Type',
        seoFriendlyId: 'complete-chat-type',
        description: 'A complete chat type with all fields',
      }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.id).toBe(validUuid)
      expect(dto.name).toBe('Complete Chat Type')
      expect(dto.seoFriendlyId).toBe('complete-chat-type')
      expect(dto.description).toBe('A complete chat type with all fields')
    })

    it('should create DTO with some optional fields', () => {
      const validUuid = uuidv7()
      const data = {
        id: validUuid,
        name: 'Partial Chat Type',
        description: 'Only name and description provided',
      }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.id).toBe(validUuid)
      expect(dto.name).toBe('Partial Chat Type')
      expect(dto.seoFriendlyId).toBeUndefined()
      expect(dto.description).toBe('Only name and description provided')
    })

    it('should handle null values by converting them to undefined', () => {
      const validUuid = uuidv7()
      const data = {
        id: validUuid,
        name: null as any,
        seoFriendlyId: null as any,
        description: null as any,
      }

      const dto = PutChatTypeDto.validate(data)

      expect(dto.id).toBe(validUuid)
      expect(dto.name).toBeUndefined()
      expect(dto.seoFriendlyId).toBeUndefined()
      expect(dto.description).toBeUndefined()
    })
  })
})
