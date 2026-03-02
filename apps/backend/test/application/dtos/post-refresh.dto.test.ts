import { describe, expect, it } from 'vitest'

import { PostRefreshDTO } from '../../../src/application/dtos/post-refresh.dto.js'
import { TypeException } from '../../../src/shared/exceptions/type.exception.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

// A valid 64-character lowercase hex string (realistic SHA-256 hash)
const VALID_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
const VALID_HASH_UPPER = 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'

describe('PostRefreshDTO', () => {
  describe('constructor', () => {
    it('should create a PostRefreshDTO with valid refreshToken', () => {
      const dto = new PostRefreshDTO(VALID_HASH)

      expect(dto.refreshToken).toBe(VALID_HASH)
    })

    it('should have readonly properties at compile time', () => {
      const dto = new PostRefreshDTO(VALID_HASH)

      expect(dto.refreshToken).toBeDefined()

      const descriptor = Object.getOwnPropertyDescriptor(dto, 'refreshToken')
      expect(descriptor?.enumerable).toBe(true)
    })

    it('should be instance of PostRefreshDTO', () => {
      const dto = new PostRefreshDTO(VALID_HASH)

      expect(dto).toBeInstanceOf(PostRefreshDTO)
    })

    it('should accept any string value without validation', () => {
      const dto = new PostRefreshDTO('any-string')

      expect(dto.refreshToken).toBe('any-string')
    })

    it('should preserve the token exactly as provided', () => {
      const dto = new PostRefreshDTO(VALID_HASH)

      expect(dto.refreshToken).toBe(VALID_HASH)
    })
  })

  describe('validate()', () => {
    describe('successful validation', () => {
      it('should validate and create PostRefreshDTO with a valid 64-char hex string', () => {
        const data = { refreshToken: VALID_HASH }

        const dto = PostRefreshDTO.validate(data)

        expect(dto).toBeInstanceOf(PostRefreshDTO)
        expect(dto.refreshToken).toBe(VALID_HASH)
      })

      it('should validate an uppercase 64-char hex string', () => {
        const data = { refreshToken: VALID_HASH_UPPER }

        const dto = PostRefreshDTO.validate(data)

        expect(dto).toBeInstanceOf(PostRefreshDTO)
        expect(dto.refreshToken).toBe(VALID_HASH_UPPER)
      })

      it('should trim whitespace from the refreshToken before validation', () => {
        const data = { refreshToken: `  ${VALID_HASH}  ` }

        const dto = PostRefreshDTO.validate(data)

        expect(dto).toBeInstanceOf(PostRefreshDTO)
        expect(dto.refreshToken).toBe(VALID_HASH)
      })
    })

    describe('TypeException - invalid data shape', () => {
      it('should throw TypeException when data is null', () => {
        expect(() => PostRefreshDTO.validate(null as never)).toThrow(TypeException)
        expect(() => PostRefreshDTO.validate(null as never)).toThrow('Expected an object')
      })

      it('should throw TypeException when data is undefined', () => {
        expect(() => PostRefreshDTO.validate(undefined as never)).toThrow(TypeException)
        expect(() => PostRefreshDTO.validate(undefined as never)).toThrow('Expected an object')
      })

      it('should throw TypeException when data is a string', () => {
        expect(() => PostRefreshDTO.validate('token' as never)).toThrow(TypeException)
        expect(() => PostRefreshDTO.validate('token' as never)).toThrow('Expected an object')
      })

      it('should throw TypeException when data is a number', () => {
        expect(() => PostRefreshDTO.validate(123 as never)).toThrow(TypeException)
        expect(() => PostRefreshDTO.validate(123 as never)).toThrow('Expected an object')
      })

      it('should throw TypeException when data is a boolean', () => {
        expect(() => PostRefreshDTO.validate(true as never)).toThrow(TypeException)
        expect(() => PostRefreshDTO.validate(true as never)).toThrow('Expected an object')
      })

      it('should throw TypeException when data is an array', () => {
        expect(() => PostRefreshDTO.validate([] as never)).toThrow(TypeException)
      })
    })

    describe('ValidationException - invalid refreshToken', () => {
      it('should throw ValidationException when refreshToken is too short', () => {
        const data = { refreshToken: 'abcdef0123456789' }

        expect(() => PostRefreshDTO.validate(data as never)).toThrow(ValidationException)
        expect(() => PostRefreshDTO.validate(data as never)).toThrow(
          'Invalid refreshToken: must be a 64-character hexadecimal string'
        )
      })

      it('should throw ValidationException when refreshToken is too long', () => {
        const data = { refreshToken: VALID_HASH + 'ff' }

        expect(() => PostRefreshDTO.validate(data as never)).toThrow(ValidationException)
        expect(() => PostRefreshDTO.validate(data as never)).toThrow(
          'Invalid refreshToken: must be a 64-character hexadecimal string'
        )
      })

      it('should throw ValidationException when refreshToken is empty', () => {
        const data = { refreshToken: '' }

        expect(() => PostRefreshDTO.validate(data as never)).toThrow(ValidationException)
        expect(() => PostRefreshDTO.validate(data as never)).toThrow(
          'Invalid refreshToken: must be a 64-character hexadecimal string'
        )
      })

      it('should throw ValidationException when refreshToken contains non-hex characters', () => {
        const data = {
          refreshToken: 'g3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        }

        expect(() => PostRefreshDTO.validate(data as never)).toThrow(ValidationException)
        expect(() => PostRefreshDTO.validate(data as never)).toThrow(
          'Invalid refreshToken: must be a 64-character hexadecimal string'
        )
      })

      it('should throw ValidationException when refreshToken contains spaces in the middle', () => {
        const data = {
          refreshToken: 'e3b0c44298fc1c149afbf4c899 fb92427ae41e4649b934ca495991b7852b855',
        }

        expect(() => PostRefreshDTO.validate(data as never)).toThrow(ValidationException)
      })

      it('should throw ValidationException when refreshToken contains special characters', () => {
        const data = {
          refreshToken: 'e3b0c44298fc1c149afbf4c8996fb924!7ae41e4649b934ca495991b7852b855',
        }

        expect(() => PostRefreshDTO.validate(data as never)).toThrow(ValidationException)
      })
    })
  })
})
