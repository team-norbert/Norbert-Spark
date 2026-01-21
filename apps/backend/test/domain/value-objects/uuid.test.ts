import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Uuid, type UUIDType } from '../../../src/domain/value-objects/uuid.js'
import { Uuid7Util } from '../../../src/shared/utils/uuid7.util.js'

// Mock Uuid7Util
vi.mock('../../../src/shared/utils/uuid7.util.js', () => ({
  Uuid7Util: {
    isValidUUID: vi.fn(),
    uuidVersionValidation: vi.fn(),
  },
}))

describe('Uuid Value Object', () => {
  let validUuid: string

  beforeEach(() => {
    validUuid = uuidv7()
    vi.clearAllMocks()
    // Default mock behavior for valid UUID
    vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(true)
    vi.mocked(Uuid7Util.uuidVersionValidation).mockReturnValue('v7')
  })

  describe('Constructor', () => {
    it('should create a Uuid with a valid UUID', () => {
      const uuid = new Uuid(validUuid)

      expect(uuid).toBeInstanceOf(Uuid)
      expect(uuid.getValue()).toBe(validUuid)
    })

    it('should validate UUID format using Uuid7Util.isValidUUID', () => {
      new Uuid(validUuid)

      expect(Uuid7Util.isValidUUID).toHaveBeenCalledWith(validUuid)
      expect(Uuid7Util.isValidUUID).toHaveBeenCalledTimes(1)
    })

    it('should validate UUID version using Uuid7Util.uuidVersionValidation', () => {
      new Uuid(validUuid)

      expect(Uuid7Util.uuidVersionValidation).toHaveBeenCalledWith(validUuid)
      expect(Uuid7Util.uuidVersionValidation).toHaveBeenCalledTimes(1)
    })

    it('should throw error for invalid UUID format', () => {
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)
      const invalidUuid = 'not-a-valid-uuid'

      expect(() => new Uuid(invalidUuid)).toThrow('Invalid userID UUID format provided')
    })

    it('should throw error for non-UUID strings', () => {
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

      expect(() => new Uuid('entity-123')).toThrow('Invalid userID UUID format provided')
      expect(() => new Uuid('12345')).toThrow('Invalid userID UUID format provided')
      expect(() => new Uuid('')).toThrow('Invalid userID UUID format provided')
    })

    it('should throw error for UUID with incorrect format structure', () => {
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)
      const malformedUuid = '018d3f78-1234-7abc-def0' // Missing part

      expect(() => new Uuid(malformedUuid)).toThrow('Invalid userID UUID format provided')
    })

    it('should throw error when version validation returns undefined', () => {
      vi.mocked(Uuid7Util.uuidVersionValidation).mockReturnValue(undefined)

      expect(() => new Uuid(validUuid)).toThrow('Invalid userID UUID version: undefined')
    })

    it('should throw error when version validation indicates wrong version', () => {
      vi.mocked(Uuid7Util.uuidVersionValidation).mockReturnValue('Expected v7, but got v4')

      expect(() => new Uuid(validUuid)).toThrow(
        'Invalid userID UUID version: Expected v7, but got v4'
      )
    })

    it('should throw error for UUIDv4 when v7 is expected', () => {
      const uuidv4 = '550e8400-e29b-41d4-a716-446655440000'
      vi.mocked(Uuid7Util.uuidVersionValidation).mockReturnValue('v4')

      expect(() => new Uuid(uuidv4)).toThrow('Invalid userID UUID version: v4')
    })

    it('should throw error for UUIDv1 when v7 is expected', () => {
      const uuidv1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      vi.mocked(Uuid7Util.uuidVersionValidation).mockReturnValue('v1')

      expect(() => new Uuid(uuidv1)).toThrow('Invalid userID UUID version: v1')
    })

    it('should accept different valid UUIDv7 strings', () => {
      const uuid1 = uuidv7()
      const uuid2 = uuidv7()
      const uuid3 = uuidv7()

      const uuidObj1 = new Uuid(uuid1)
      const uuidObj2 = new Uuid(uuid2)
      const uuidObj3 = new Uuid(uuid3)

      expect(uuidObj1.getValue()).toBe(uuid1)
      expect(uuidObj2.getValue()).toBe(uuid2)
      expect(uuidObj3.getValue()).toBe(uuid3)
      expect(uuidObj1.getValue()).not.toBe(uuidObj2.getValue())
      expect(uuidObj2.getValue()).not.toBe(uuidObj3.getValue())
    })

    it('should handle UUID strings with uppercase letters', () => {
      const uppercaseUuid = validUuid.toUpperCase()
      const uuid = new Uuid(uppercaseUuid)

      expect(uuid.getValue()).toBe(uppercaseUuid)
    })

    it('should handle UUID strings with mixed case', () => {
      const mixedCaseUuid = '018D3F78-1234-7ABC-DEF0-123456789ABC'
      const uuid = new Uuid(mixedCaseUuid)

      expect(uuid.getValue()).toBe(mixedCaseUuid)
    })
  })

  describe('getValue()', () => {
    it('should return the UUID string value', () => {
      const uuid = new Uuid(validUuid)

      expect(uuid.getValue()).toBe(validUuid)
      expect(typeof uuid.getValue()).toBe('string')
    })

    it('should return consistent value on multiple calls', () => {
      const uuid = new Uuid(validUuid)

      const value1 = uuid.getValue()
      const value2 = uuid.getValue()
      const value3 = uuid.getValue()

      expect(value1).toBe(value2)
      expect(value2).toBe(value3)
      expect(value1).toBe(validUuid)
    })

    it('should return value that can be used as UUIDType', () => {
      const uuid = new Uuid(validUuid)
      const value: UUIDType = uuid.getValue()

      expect(typeof value).toBe('string')
      expect(value).toBe(validUuid)
    })

    it('should return immutable value', () => {
      const uuid = new Uuid(validUuid)
      const value1 = uuid.getValue()
      const value2 = uuid.getValue()

      // Both calls should return the same reference/value
      expect(value1).toBe(value2)
    })
  })

  describe('Type Safety', () => {
    it('should create branded UUIDType', () => {
      const uuid = new Uuid(validUuid)
      const value = uuid.getValue()

      // Value should be assignable to UUIDType
      const branded: UUIDType = value
      expect(branded).toBe(validUuid)
    })

    it('should work with generic type parameter', () => {
      const uuid = new Uuid<string>(validUuid)
      const value: UUIDType<string> = uuid.getValue()

      expect(value).toBe(validUuid)
    })
  })

  describe('Edge Cases', () => {
    it('should handle validation being called multiple times', () => {
      new Uuid(validUuid)
      new Uuid(validUuid)
      new Uuid(validUuid)

      expect(Uuid7Util.isValidUUID).toHaveBeenCalledTimes(3)
      expect(Uuid7Util.uuidVersionValidation).toHaveBeenCalledTimes(3)
    })

    it('should throw error for null-like strings', () => {
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

      expect(() => new Uuid('null')).toThrow('Invalid userID UUID format provided')
      expect(() => new Uuid('undefined')).toThrow('Invalid userID UUID format provided')
    })

    it('should throw error for whitespace-only strings', () => {
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

      expect(() => new Uuid('   ')).toThrow('Invalid userID UUID format provided')
      expect(() => new Uuid('\t')).toThrow('Invalid userID UUID format provided')
      expect(() => new Uuid('\n')).toThrow('Invalid userID UUID format provided')
    })

    it('should throw error for UUID-like strings with extra characters', () => {
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

      expect(() => new Uuid(`${validUuid}-extra`)).toThrow('Invalid userID UUID format provided')
      expect(() => new Uuid(`prefix-${validUuid}`)).toThrow('Invalid userID UUID format provided')
    })

    it('should handle version validation returning non-v7 string', () => {
      vi.mocked(Uuid7Util.uuidVersionValidation).mockReturnValue('v3')

      expect(() => new Uuid(validUuid)).toThrow('Invalid userID UUID version: v3')
    })

    it('should handle version validation returning error message string', () => {
      const errorMessage = 'Expected v7, but got v5'
      vi.mocked(Uuid7Util.uuidVersionValidation).mockReturnValue(errorMessage)

      expect(() => new Uuid(validUuid)).toThrow(`Invalid userID UUID version: ${errorMessage}`)
    })
  })

  describe('Integration with Validation', () => {
    it('should only create instance if both validations pass', () => {
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(true)
      vi.mocked(Uuid7Util.uuidVersionValidation).mockReturnValue('v7')

      const uuid = new Uuid(validUuid)

      expect(uuid).toBeInstanceOf(Uuid)
      expect(uuid.getValue()).toBe(validUuid)
    })

    it('should fail early if format validation fails', () => {
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(false)

      expect(() => new Uuid('invalid')).toThrow('Invalid userID UUID format provided')

      // Version validation should not be called if format validation fails
      expect(Uuid7Util.uuidVersionValidation).not.toHaveBeenCalled()
    })

    it('should proceed to version validation only after format validation passes', () => {
      vi.mocked(Uuid7Util.isValidUUID).mockReturnValue(true)
      vi.mocked(Uuid7Util.uuidVersionValidation).mockReturnValue('v4')

      expect(() => new Uuid(validUuid)).toThrow('Invalid userID UUID version: v4')

      expect(Uuid7Util.isValidUUID).toHaveBeenCalled()
      expect(Uuid7Util.uuidVersionValidation).toHaveBeenCalled()
    })
  })

  describe('Multiple Instances', () => {
    it('should create independent instances', () => {
      const uuid1 = uuidv7()
      const uuid2 = uuidv7()

      const instance1 = new Uuid(uuid1)
      const instance2 = new Uuid(uuid2)

      expect(instance1).not.toBe(instance2)
      expect(instance1.getValue()).toBe(uuid1)
      expect(instance2.getValue()).toBe(uuid2)
      expect(instance1.getValue()).not.toBe(instance2.getValue())
    })

    it('should create distinct instances even with same UUID string', () => {
      const instance1 = new Uuid(validUuid)
      const instance2 = new Uuid(validUuid)

      expect(instance1).not.toBe(instance2)
      expect(instance1.getValue()).toBe(instance2.getValue())
      expect(instance1.getValue()).toBe(validUuid)
    })
  })
})
