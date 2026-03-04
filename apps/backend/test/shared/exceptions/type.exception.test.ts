import { describe, expect, it } from 'vitest'

import { ErrorCode } from '../../../src/shared/constants/error-codes.js'
import { HttpStatus } from '../../../src/shared/constants/http-status.js'
import { BaseException } from '../../../src/shared/exceptions/base.exception.js'
import { TypeException } from '../../../src/shared/exceptions/type.exception.js'

describe('TypeException', () => {
  describe('constructor', () => {
    it('should create a type exception with message', () => {
      const message = 'Invalid type provided'
      const exception = new TypeException(message)

      expect(exception.message).toBe(message)
      expect(exception.code).toBe(ErrorCode.INTERNAL_ERROR)
      expect(exception.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    it('should create a type exception with details', () => {
      const message = 'Type mismatch'
      const details = { expected: 'string', received: 'number' }
      const exception = new TypeException(message, details)

      expect(exception.message).toBe(message)
      expect(exception.details).toEqual(details)
    })

    it('should work without details', () => {
      const exception = new TypeException('Error without details')
      expect(exception.details).toBeUndefined()
    })

    it('should set the correct name', () => {
      const exception = new TypeException('Error')
      expect(exception.name).toBe('TypeException')
    })

    it('should support cause via ErrorOptions', () => {
      const cause = new Error('root cause')
      const exception = new TypeException('Type error', undefined, { cause })
      expect(exception.cause).toBe(cause)
    })

    it('should be instance of BaseException and Error', () => {
      const exception = new TypeException('Error')
      expect(exception).toBeInstanceOf(TypeException)
      expect(exception).toBeInstanceOf(BaseException)
      expect(exception).toBeInstanceOf(Error)
    })
  })

  describe('properties', () => {
    it('should always have INTERNAL_SERVER_ERROR status code', () => {
      const exception1 = new TypeException('Error 1')
      const exception2 = new TypeException('Error 2', { type: 'invalid' })

      expect(exception1.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(exception2.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(exception1.statusCode).toBe(500)
    })

    it('should always have INTERNAL_ERROR code', () => {
      const exception1 = new TypeException('Error 1')
      const exception2 = new TypeException('Error 2', { type: 'invalid' })

      expect(exception1.code).toBe(ErrorCode.INTERNAL_ERROR)
      expect(exception2.code).toBe(ErrorCode.INTERNAL_ERROR)
    })
  })

  describe('toJSON', () => {
    it('should serialize with all properties', () => {
      const message = 'Type error'
      const details = { expected: 'object', received: 'array' }
      const exception = new TypeException(message, details)

      const json = exception.toJSON()

      expect(json).toEqual({
        name: 'TypeException',
        message: message,
        code: ErrorCode.INTERNAL_ERROR,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        details: details,
      })
    })

    it('should serialize without details', () => {
      const message = 'Type error'
      const exception = new TypeException(message)

      const json = exception.toJSON()

      expect(json).toEqual({
        name: 'TypeException',
        message: message,
        code: ErrorCode.INTERNAL_ERROR,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        details: undefined,
      })
    })
  })

  describe('common type error scenarios', () => {
    it('should handle invalid object type', () => {
      const exception = new TypeException('Data must be a valid object', {
        expected: 'object',
        received: 'string',
        value: 'invalid',
      })

      expect(exception.message).toContain('object')
      expect(exception.details).toHaveProperty('expected', 'object')
      expect(exception.statusCode).toBe(500)
    })

    it('should handle array type error', () => {
      const exception = new TypeException('Expected non-array object', {
        expected: 'object',
        received: 'array',
        isArray: true,
      })

      expect(exception.details).toHaveProperty('isArray', true)
    })

    it('should handle null/undefined type error', () => {
      const exception = new TypeException('Value cannot be null or undefined', {
        received: 'null',
        field: 'userId',
      })

      expect(exception.message).toContain('null')
      expect(exception.details).toHaveProperty('field')
    })

    it('should handle primitive type mismatch', () => {
      const exception = new TypeException('Expected string, received number', {
        field: 'username',
        expectedType: 'string',
        receivedType: 'number',
        receivedValue: 12345,
      })

      expect(exception.details).toHaveProperty('expectedType', 'string')
      expect(exception.details).toHaveProperty('receivedType', 'number')
    })

    it('should handle boolean type error', () => {
      const exception = new TypeException('Expected boolean value', {
        field: 'isActive',
        expectedType: 'boolean',
        receivedType: 'string',
        receivedValue: 'true',
      })

      expect(exception.details).toHaveProperty('expectedType', 'boolean')
      expect(exception.details?.receivedValue).toBe('true')
    })

    it('should handle function type error', () => {
      const exception = new TypeException('Expected function', {
        field: 'callback',
        expectedType: 'function',
        receivedType: 'object',
      })

      expect(exception.details).toHaveProperty('expectedType', 'function')
    })
  })

  describe('error throwing', () => {
    it('should be throwable and catchable', () => {
      expect(() => {
        throw new TypeException('Type error')
      }).toThrow(TypeException)
    })

    it('should preserve details when caught', () => {
      const details = { expected: 'number', received: 'string' }
      const error = new TypeException('Invalid type', details)
      expect(error).toBeInstanceOf(TypeException)
      expect(error.details).toEqual(details)
    })

    it('should be catchable as BaseException', () => {
      let caughtError: any
      try {
        throw new TypeException('Error')
      } catch (error) {
        caughtError = error
      }
      expect(caughtError).toBeInstanceOf(BaseException)
      expect(caughtError).toBeInstanceOf(TypeException)
    })
  })
})
