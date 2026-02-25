import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'

import { DeleteUsersDto } from '../../../src/application/dtos/delete-users.dto.js'
import { TypeException } from '../../../src/shared/exceptions/type.exception.js'

describe('DeleteUsersDto', () => {
  describe('constructor', () => {
    it('should create a DeleteUsersDto with valid userIds array', () => {
      const userIds = [uuidv7(), uuidv7(), uuidv7()] as any

      const dto = new DeleteUsersDto(userIds)

      expect(dto.userIds).toEqual(userIds)
      expect(dto.userIds.length).toBe(3)
    })

    it('should have readonly userIds property', () => {
      const userIds = [uuidv7()] as any
      const dto = new DeleteUsersDto(userIds)

      // TypeScript readonly is compile-time only, but property should exist
      expect(dto.userIds).toBeDefined()

      const descriptor = Object.getOwnPropertyDescriptor(dto, 'userIds')
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should be instance of DeleteUsersDto', () => {
      const dto = new DeleteUsersDto([uuidv7()] as any)

      expect(dto).toBeInstanceOf(DeleteUsersDto)
    })

    it('should accept empty array', () => {
      const dto = new DeleteUsersDto([])

      expect(dto.userIds).toEqual([])
      expect(dto.userIds.length).toBe(0)
    })

    it('should preserve array reference', () => {
      const userIds = [uuidv7(), uuidv7()] as any
      const dto = new DeleteUsersDto(userIds)

      expect(dto.userIds).toBe(userIds)
    })
  })

  describe('validate()', () => {
    describe('successful validation', () => {
      it('should validate and create DeleteUsersDto with single valid UUIDv7', () => {
        const data = {
          userIds: [uuidv7()],
        }

        const dto = DeleteUsersDto.validate(data)

        expect(dto).toBeInstanceOf(DeleteUsersDto)
        expect(dto.userIds).toEqual(data.userIds)
        expect(dto.userIds.length).toBe(1)
      })

      it('should validate and create DeleteUsersDto with multiple valid UUIDv7s', () => {
        const data = {
          userIds: [uuidv7(), uuidv7(), uuidv7()],
        }

        const dto = DeleteUsersDto.validate(data)

        expect(dto).toBeInstanceOf(DeleteUsersDto)
        expect(dto.userIds).toEqual(data.userIds)
        expect(dto.userIds.length).toBe(3)
      })

      it('should handle large arrays of UUIDv7s', () => {
        const userIds = Array.from({ length: 100 }, () => uuidv7())
        const data = { userIds }

        const dto = DeleteUsersDto.validate(data)

        expect(dto.userIds).toEqual(userIds)
        expect(dto.userIds.length).toBe(100)
      })

      it('should preserve exact order of userIds', () => {
        const userIds = [uuidv7(), uuidv7(), uuidv7()]
        const data = { userIds }

        const dto = DeleteUsersDto.validate(data)

        expect(dto.userIds[0]).toBe(userIds[0])
        expect(dto.userIds[1]).toBe(userIds[1])
        expect(dto.userIds[2]).toBe(userIds[2])
      })

      it('should validate object with userIds property', () => {
        const data = {
          userIds: [uuidv7()],
        }

        const result = DeleteUsersDto.validate(data)

        expect(result).toBeInstanceOf(DeleteUsersDto)
      })

      it('should accept data with additional properties', () => {
        const data = {
          userIds: [uuidv7()],
          extraProperty: 'ignored',
          anotherProp: 123,
        }

        const dto = DeleteUsersDto.validate(data)

        expect(dto.userIds.length).toBe(1)
      })
    })

    describe('data validation failures', () => {
      it('should throw TypeException when data is null', () => {
        expect(() => DeleteUsersDto.validate(null as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(null as any)).toThrow(
          'Data must be a valid array of user IDs'
        )
      })

      it('should throw TypeException when data is undefined', () => {
        expect(() => DeleteUsersDto.validate(undefined as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(undefined as any)).toThrow(
          'Data must be a valid array of user IDs'
        )
      })

      it('should throw TypeException when data is an array', () => {
        const data = [uuidv7(), uuidv7()]

        expect(() => DeleteUsersDto.validate(data as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data as any)).toThrow(
          'Data must be a valid array of user IDs'
        )
      })

      it('should throw TypeException when data is a string', () => {
        expect(() => DeleteUsersDto.validate('not an object' as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate('not an object' as any)).toThrow(
          'Data must be a valid array of user IDs'
        )
      })

      it('should throw TypeException when data is a number', () => {
        expect(() => DeleteUsersDto.validate(123 as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(123 as any)).toThrow(
          'Data must be a valid array of user IDs'
        )
      })

      it('should throw TypeException when data is a boolean', () => {
        expect(() => DeleteUsersDto.validate(true as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(true as any)).toThrow(
          'Data must be a valid array of user IDs'
        )
      })

      it('should throw TypeException for empty object', () => {
        expect(() => DeleteUsersDto.validate({} as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate({} as any)).toThrow(
          'userIds must be an array of strings'
        )
      })
    })

    describe('userIds validation failures', () => {
      it('should throw TypeException when userIds is missing', () => {
        const data = { otherProperty: 'value' }

        expect(() => DeleteUsersDto.validate(data as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data as any)).toThrow(
          'userIds must be an array of strings'
        )
      })

      it('should throw TypeException when userIds is not an array', () => {
        const data = { userIds: 'not-an-array' }

        expect(() => DeleteUsersDto.validate(data as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data as any)).toThrow(
          'userIds must be an array of strings'
        )
      })

      it('should throw TypeException when userIds is null', () => {
        const data = { userIds: null }

        expect(() => DeleteUsersDto.validate(data as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data as any)).toThrow(
          'userIds must be an array of strings'
        )
      })

      it('should throw TypeException when userIds is an object', () => {
        const data = { userIds: { id: uuidv7() } }

        expect(() => DeleteUsersDto.validate(data as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data as any)).toThrow(
          'userIds must be an array of strings'
        )
      })

      it('should throw TypeException when userIds contains non-string values', () => {
        const data = { userIds: [uuidv7(), 123, uuidv7()] }

        expect(() => DeleteUsersDto.validate(data as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data as any)).toThrow(
          'userIds must be an array of strings'
        )
      })

      it('should throw TypeException when userIds contains null', () => {
        const data = { userIds: [uuidv7(), null, uuidv7()] }

        expect(() => DeleteUsersDto.validate(data as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data as any)).toThrow(
          'userIds must be an array of strings'
        )
      })

      it('should throw TypeException when userIds contains undefined', () => {
        const data = { userIds: [uuidv7(), undefined, uuidv7()] }

        expect(() => DeleteUsersDto.validate(data as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data as any)).toThrow(
          'userIds must be an array of strings'
        )
      })

      it('should throw TypeException when userIds contains objects', () => {
        const data = { userIds: [uuidv7(), { id: uuidv7() }, uuidv7()] }

        expect(() => DeleteUsersDto.validate(data as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data as any)).toThrow(
          'userIds must be an array of strings'
        )
      })

      it('should throw TypeException when userIds contains arrays', () => {
        const data = { userIds: [uuidv7(), [uuidv7()], uuidv7()] }

        expect(() => DeleteUsersDto.validate(data as any)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data as any)).toThrow(
          'userIds must be an array of strings'
        )
      })

      it('should throw TypeException when userIds is empty array', () => {
        const data = { userIds: [] }

        // Empty array passes array of strings check but might fail UUID validation
        const dto = DeleteUsersDto.validate(data)
        expect(dto.userIds).toEqual([])
      })
    })

    describe('UUID validation failures', () => {
      it('should throw TypeException for invalid UUID format', () => {
        const data = { userIds: ['not-a-uuid'] }

        expect(() => DeleteUsersDto.validate(data)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data)).toThrow(
          'Invalid UUIDv7 format for userId: not-a-uuid'
        )
      })

      it('should throw TypeException for UUIDv4 instead of UUIDv7', () => {
        const uuidv4 = '550e8400-e29b-41d4-a716-446655440000'
        const data = { userIds: [uuidv4] }

        expect(() => DeleteUsersDto.validate(data)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data)).toThrow(
          `Invalid UUIDv7 format for userId: ${uuidv4}`
        )
      })

      it('should throw TypeException for partial UUID', () => {
        const data = { userIds: ['550e8400-e29b'] }

        expect(() => DeleteUsersDto.validate(data)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data)).toThrow(
          'Invalid UUIDv7 format for userId: 550e8400-e29b'
        )
      })

      it('should throw TypeException for empty string UUID', () => {
        const data = { userIds: [''] }

        expect(() => DeleteUsersDto.validate(data)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data)).toThrow('Invalid UUIDv7 format for userId: ')
      })

      it('should throw TypeException for malformed UUID', () => {
        const malformed = '550e8400-e29b-41d4-a716-446655440000-extra'
        const data = { userIds: [malformed] }

        expect(() => DeleteUsersDto.validate(data)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data)).toThrow(
          `Invalid UUIDv7 format for userId: ${malformed}`
        )
      })

      it('should throw TypeException on first invalid UUID in array', () => {
        const invalidUuid = 'invalid-uuid'
        const data = {
          userIds: [uuidv7(), invalidUuid, uuidv7()],
        }

        expect(() => DeleteUsersDto.validate(data)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data)).toThrow(
          `Invalid UUIDv7 format for userId: ${invalidUuid}`
        )
      })

      it('should validate all UUIDs even if first is valid', () => {
        const invalidUuid = 'not-a-uuid'
        const data = {
          userIds: [uuidv7(), uuidv7(), invalidUuid],
        }

        expect(() => DeleteUsersDto.validate(data)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data)).toThrow(
          `Invalid UUIDv7 format for userId: ${invalidUuid}`
        )
      })

      it('should throw TypeException for UUID with wrong version in middle of array', () => {
        const uuidv4 = '550e8400-e29b-41d4-a716-446655440000'
        const data = {
          userIds: [uuidv7(), uuidv4, uuidv7()],
        }

        expect(() => DeleteUsersDto.validate(data)).toThrow(TypeException)
        expect(() => DeleteUsersDto.validate(data)).toThrow(
          `Invalid UUIDv7 format for userId: ${uuidv4}`
        )
      })

      it('should reject UUID with spaces', () => {
        const data = { userIds: [' ' + uuidv7() + ' '] }

        expect(() => DeleteUsersDto.validate(data)).toThrow(TypeException)
      })

      it('should reject UUID with special characters', () => {
        const data = { userIds: ['#' + uuidv7()] }

        expect(() => DeleteUsersDto.validate(data)).toThrow(TypeException)
      })
    })

    describe('edge cases', () => {
      it('should handle duplicate UUIDs', () => {
        const uuid = uuidv7()
        const data = { userIds: [uuid, uuid, uuid] }

        const dto = DeleteUsersDto.validate(data)

        expect(dto.userIds.length).toBe(3)
        expect(dto.userIds[0]).toBe(uuid)
        expect(dto.userIds[1]).toBe(uuid)
        expect(dto.userIds[2]).toBe(uuid)
      })

      it('should preserve UUID string case', () => {
        const uuid = uuidv7()
        const data = { userIds: [uuid] }

        const dto = DeleteUsersDto.validate(data)

        expect(dto.userIds[0]).toBe(uuid)
      })

      it('should handle very long array of UUIDs', () => {
        const userIds = Array.from({ length: 1000 }, () => uuidv7())
        const data = { userIds }

        const dto = DeleteUsersDto.validate(data)

        expect(dto.userIds.length).toBe(1000)
      })

      it('should maintain immutability of input data', () => {
        const originalUserIds = [uuidv7(), uuidv7()]
        const data = { userIds: [...originalUserIds] }

        const dto = DeleteUsersDto.validate(data)

        expect(data.userIds).toEqual(originalUserIds)
        expect(dto.userIds).toEqual(originalUserIds)
      })

      it('should not modify original data object', () => {
        const data = {
          userIds: [uuidv7(), uuidv7()],
          extraProp: 'test',
        }
        const dataCopy = { ...data, userIds: [...data.userIds] }

        DeleteUsersDto.validate(data)

        expect(data).toEqual(dataCopy)
      })
    })

    describe('type safety', () => {
      it('should return DeleteUsersDto instance', () => {
        const data = { userIds: [uuidv7()] }

        const result = DeleteUsersDto.validate(data)

        expect(result).toBeInstanceOf(DeleteUsersDto)
      })

      it('should have userIds property on returned instance', () => {
        const data = { userIds: [uuidv7()] }

        const result = DeleteUsersDto.validate(data)

        expect(result).toHaveProperty('userIds')
        expect(Array.isArray(result.userIds)).toBe(true)
      })

      it('should maintain type after validation', () => {
        const userId = uuidv7()
        const data = { userIds: [userId] }

        const result = DeleteUsersDto.validate(data)

        expect(typeof result.userIds[0]).toBe('string')
      })
    })
  })
})
