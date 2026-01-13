import { describe, expect, it } from 'vitest'

import { ErrorCode } from '../../../src/shared/constants/error-codes.js'
import { HttpStatus } from '../../../src/shared/constants/http-status.js'
import { BaseException } from '../../../src/shared/exceptions/base.exception.js'
import { UnprocessableEntityException } from '../../../src/shared/exceptions/unprocessable-entity.exception.js'

describe('UnprocessableEntityException', () => {
  describe('constructor', () => {
    it('should create an unprocessable entity exception with message', () => {
      const message = 'Invalid data format'
      const exception = new UnprocessableEntityException(message)

      expect(exception.message).toBe(message)
      expect(exception.code).toBe(ErrorCode.UNPROCESSABLE_ENTITY)
      expect(exception.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
    })

    it('should create an unprocessable entity exception with custom code', () => {
      const message = 'Invalid request'
      const customCode = ErrorCode.VALIDATION_ERROR
      const exception = new UnprocessableEntityException(message, customCode)

      expect(exception.message).toBe(message)
      expect(exception.code).toBe(customCode)
      expect(exception.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
    })

    it('should create an unprocessable entity exception with details', () => {
      const message = 'Validation failed'
      const details = { field: 'email', reason: 'Invalid format' }
      const exception = new UnprocessableEntityException(message, undefined, details)

      expect(exception.message).toBe(message)
      expect(exception.details).toEqual(details)
    })

    it('should create an unprocessable entity exception with code and details', () => {
      const message = 'Schema validation failed'
      const customCode = ErrorCode.VALIDATION_ERROR
      const details = { errors: ['field1', 'field2'] }
      const exception = new UnprocessableEntityException(message, customCode, details)

      expect(exception.message).toBe(message)
      expect(exception.code).toBe(customCode)
      expect(exception.details).toEqual(details)
    })

    it('should work without code or details', () => {
      const exception = new UnprocessableEntityException('Error without details')
      expect(exception.code).toBe(ErrorCode.UNPROCESSABLE_ENTITY)
      expect(exception.details).toBeUndefined()
    })

    it('should set the correct name', () => {
      const exception = new UnprocessableEntityException('Error')
      expect(exception.name).toBe('UnprocessableEntityException')
    })

    it('should be instance of BaseException and Error', () => {
      const exception = new UnprocessableEntityException('Error')
      expect(exception).toBeInstanceOf(UnprocessableEntityException)
      expect(exception).toBeInstanceOf(BaseException)
      expect(exception).toBeInstanceOf(Error)
    })
  })

  describe('properties', () => {
    it('should always have UNPROCESSABLE_ENTITY status code', () => {
      const exception1 = new UnprocessableEntityException('Error 1')
      const exception2 = new UnprocessableEntityException('Error 2', ErrorCode.VALIDATION_ERROR)
      const exception3 = new UnprocessableEntityException('Error 3', undefined, { field: 'name' })

      expect(exception1.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
      expect(exception2.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
      expect(exception3.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
      expect(exception1.statusCode).toBe(422)
    })

    it('should default to UNPROCESSABLE_ENTITY code when not provided', () => {
      const exception1 = new UnprocessableEntityException('Error 1')
      const exception2 = new UnprocessableEntityException('Error 2', undefined, { field: 'email' })

      expect(exception1.code).toBe(ErrorCode.UNPROCESSABLE_ENTITY)
      expect(exception2.code).toBe(ErrorCode.UNPROCESSABLE_ENTITY)
    })

    it('should allow custom error codes', () => {
      const exception1 = new UnprocessableEntityException('Error', ErrorCode.VALIDATION_ERROR)
      const exception2 = new UnprocessableEntityException('Error', ErrorCode.TYPE_ERROR)

      expect(exception1.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(exception2.code).toBe(ErrorCode.TYPE_ERROR)
    })
  })

  describe('toJSON', () => {
    it('should serialize with all properties using default code', () => {
      const message = 'Unprocessable entity error'
      const details = { field: 'age', value: -5 }
      const exception = new UnprocessableEntityException(message, undefined, details)

      const json = exception.toJSON()

      expect(json).toEqual({
        name: 'UnprocessableEntityException',
        message: message,
        code: ErrorCode.UNPROCESSABLE_ENTITY,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        details: details,
      })
    })

    it('should serialize with custom code', () => {
      const message = 'Validation error'
      const customCode = ErrorCode.VALIDATION_ERROR
      const details = { errors: ['field1'] }
      const exception = new UnprocessableEntityException(message, customCode, details)

      const json = exception.toJSON()

      expect(json).toEqual({
        name: 'UnprocessableEntityException',
        message: message,
        code: customCode,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        details: details,
      })
    })

    it('should serialize without details', () => {
      const message = 'Unprocessable entity error'
      const exception = new UnprocessableEntityException(message)

      const json = exception.toJSON()

      expect(json).toEqual({
        name: 'UnprocessableEntityException',
        message: message,
        code: ErrorCode.UNPROCESSABLE_ENTITY,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        details: undefined,
      })
    })
  })

  describe('common unprocessable entity scenarios', () => {
    it('should handle invalid file format error', () => {
      const exception = new UnprocessableEntityException('Invalid file format', undefined, {
        field: 'file',
        allowedFormats: ['pdf', 'zip'],
        receivedFormat: 'exe',
      })

      expect(exception.message).toBe('Invalid file format')
      expect(exception.details).toHaveProperty('allowedFormats')
      expect(exception.statusCode).toBe(422)
    })

    it('should handle invalid data structure error', () => {
      const exception = new UnprocessableEntityException('Data structure invalid', undefined, {
        expected: 'array',
        received: 'object',
      })

      expect(exception.message).toBe('Data structure invalid')
      expect(exception.details?.expected).toBe('array')
      expect(exception.details?.received).toBe('object')
    })

    it('should handle schema validation errors', () => {
      const exception = new UnprocessableEntityException('Schema validation failed', undefined, {
        schema: 'UserSchema',
        errors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'age', message: 'Must be positive' },
        ],
      })

      expect(exception.details).toHaveProperty('schema', 'UserSchema')
      expect(exception.details?.errors).toHaveLength(2)
    })

    it('should handle business rule violations', () => {
      const exception = new UnprocessableEntityException(
        'Business rule violated: Cannot have more than 5 active projects',
        undefined,
        {
          rule: 'MAX_ACTIVE_PROJECTS',
          currentCount: 5,
          attemptedCount: 6,
        }
      )

      expect(exception.message).toContain('Business rule violated')
      expect(exception.details).toHaveProperty('rule', 'MAX_ACTIVE_PROJECTS')
    })

    it('should handle invalid state transitions', () => {
      const exception = new UnprocessableEntityException('Invalid state transition', undefined, {
        currentState: 'draft',
        attemptedState: 'archived',
        allowedTransitions: ['published', 'deleted'],
      })

      expect(exception.details).toHaveProperty('currentState')
      expect(exception.details).toHaveProperty('allowedTransitions')
    })

    it('should handle malformed JSON data', () => {
      const exception = new UnprocessableEntityException('Malformed JSON data', undefined, {
        position: 42,
        character: '{',
        error: 'Unexpected token',
      })

      expect(exception.message).toBe('Malformed JSON data')
      expect(exception.details).toHaveProperty('error', 'Unexpected token')
    })
  })

  describe('error throwing', () => {
    it('should be throwable and catchable', () => {
      expect(() => {
        throw new UnprocessableEntityException('Unprocessable entity occurred')
      }).toThrow(UnprocessableEntityException)
    })

    it('should preserve code and details when caught', () => {
      const details = { field: 'status', value: 'invalid' }
      const customCode = ErrorCode.VALIDATION_ERROR
      const error = new UnprocessableEntityException('Invalid status', customCode, details)
      expect(error).toBeInstanceOf(UnprocessableEntityException)
      expect(error.code).toBe(customCode)
      expect(error.details).toEqual(details)
    })

    it('should be catchable as BaseException', () => {
      let caughtError: any
      try {
        throw new UnprocessableEntityException('Error')
      } catch (error) {
        caughtError = error
      }
      expect(caughtError).toBeInstanceOf(BaseException)
      expect(caughtError).toBeInstanceOf(UnprocessableEntityException)
    })

    it('should maintain error code when thrown', () => {
      let caughtError: any
      try {
        throw new UnprocessableEntityException('Error', ErrorCode.TYPE_ERROR)
      } catch (error) {
        caughtError = error
      }
      expect(caughtError).toBeInstanceOf(UnprocessableEntityException)
      expect(caughtError.code).toBe(ErrorCode.TYPE_ERROR)
      expect(caughtError.statusCode).toBe(422)
    })
  })
})
