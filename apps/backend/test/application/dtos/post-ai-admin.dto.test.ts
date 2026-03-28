import { describe, expect, it } from 'vitest'

import { PostAIAdminDTO } from '../../../src/application/dtos/post-ai-admin.dto.js'
import { PutAIAdminDTO } from '../../../src/application/dtos/put-ai-admin.dto.js'
import { TypeException } from '../../../src/shared/exceptions/type.exception.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('PostAIAdminDTO', () => {
  describe('class identity and inheritance', () => {
    it('should be an instance of PostAIAdminDTO', () => {
      const dto = PostAIAdminDTO.validate({ prompt: 'Test prompt' })

      expect(dto).toBeInstanceOf(PostAIAdminDTO)
    })

    it('should also be an instance of PutAIAdminDTO (inheritance)', () => {
      const dto = PostAIAdminDTO.validate({ prompt: 'Test prompt' })

      expect(dto).toBeInstanceOf(PutAIAdminDTO)
    })

    it('validate() should return PostAIAdminDTO, not bare PutAIAdminDTO', () => {
      const dto = PostAIAdminDTO.validate({ prompt: 'Test prompt' })

      // Object.getPrototypeOf to confirm the concrete class
      expect(Object.getPrototypeOf(dto)).toBe(PostAIAdminDTO.prototype)
    })
  })

  describe('validate() — successful creation', () => {
    it('should create a PostAIAdminDTO with only the required prompt field', () => {
      const dto = PostAIAdminDTO.validate({ prompt: 'You are a helpful assistant' })

      expect(dto.prompt).toBe('You are a helpful assistant')
      expect(dto.maxTokens).toBeUndefined()
      expect(dto.temperature).toBeUndefined()
      expect(dto.topP).toBeUndefined()
      expect(dto.frequencyPenalty).toBeUndefined()
      expect(dto.presencePenalty).toBeUndefined()
      expect(dto.topK).toBeUndefined()
      expect(dto.stopSequences).toBeUndefined()
      expect(dto.maxRetries).toBeUndefined()
    })

    it('should create a PostAIAdminDTO with all fields', () => {
      const data = {
        prompt: 'You are a helpful assistant',
        maxTokens: 2000,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: -0.5,
        topK: 40,
        stopSequences: ['END', 'STOP'],
        maxRetries: 3,
      }

      const dto = PostAIAdminDTO.validate(data)

      expect(dto.prompt).toBe(data.prompt)
      expect(dto.maxTokens).toBe(data.maxTokens)
      expect(dto.temperature).toBe(data.temperature)
      expect(dto.topP).toBe(data.topP)
      expect(dto.frequencyPenalty).toBe(data.frequencyPenalty)
      expect(dto.presencePenalty).toBe(data.presencePenalty)
      expect(dto.topK).toBe(data.topK)
      expect(dto.stopSequences).toEqual(data.stopSequences)
      expect(dto.maxRetries).toBe(data.maxRetries)
    })

    it('should trim whitespace from prompt', () => {
      const dto = PostAIAdminDTO.validate({ prompt: '  trimmed  ' })

      expect(dto.prompt).toBe('trimmed')
    })

    it('should ignore extra properties not in the schema', () => {
      const dto = PostAIAdminDTO.validate({
        prompt: 'Test',
        unknownField: 'should be ignored',
        anotherExtra: 42,
      })

      expect(dto.prompt).toBe('Test')
      expect((dto as any).unknownField).toBeUndefined()
      expect((dto as any).anotherExtra).toBeUndefined()
    })
  })

  describe('validate() — null to undefined coercion', () => {
    it('should convert null maxTokens to undefined', () => {
      const dto = PostAIAdminDTO.validate({ prompt: 'Test', maxTokens: null })

      expect(dto.maxTokens).toBeUndefined()
    })

    it('should convert null temperature to undefined', () => {
      const dto = PostAIAdminDTO.validate({ prompt: 'Test', temperature: null })

      expect(dto.temperature).toBeUndefined()
    })

    it('should convert null topP to undefined', () => {
      const dto = PostAIAdminDTO.validate({ prompt: 'Test', topP: null })

      expect(dto.topP).toBeUndefined()
    })

    it('should convert null frequencyPenalty to undefined', () => {
      const dto = PostAIAdminDTO.validate({ prompt: 'Test', frequencyPenalty: null })

      expect(dto.frequencyPenalty).toBeUndefined()
    })

    it('should convert null presencePenalty to undefined', () => {
      const dto = PostAIAdminDTO.validate({ prompt: 'Test', presencePenalty: null })

      expect(dto.presencePenalty).toBeUndefined()
    })

    it('should convert null topK to undefined', () => {
      const dto = PostAIAdminDTO.validate({ prompt: 'Test', topK: null })

      expect(dto.topK).toBeUndefined()
    })

    it('should convert null stopSequences to undefined', () => {
      const dto = PostAIAdminDTO.validate({ prompt: 'Test', stopSequences: null })

      expect(dto.stopSequences).toBeUndefined()
    })

    it('should convert null maxRetries to undefined', () => {
      const dto = PostAIAdminDTO.validate({ prompt: 'Test', maxRetries: null })

      expect(dto.maxRetries).toBeUndefined()
    })

    it('should convert all null optional fields to undefined in one call', () => {
      const dto = PostAIAdminDTO.validate({
        prompt: 'Test',
        maxTokens: null,
        temperature: null,
        topP: null,
        frequencyPenalty: null,
        presencePenalty: null,
        topK: null,
        stopSequences: null,
        maxRetries: null,
      })

      expect(dto.maxTokens).toBeUndefined()
      expect(dto.temperature).toBeUndefined()
      expect(dto.topP).toBeUndefined()
      expect(dto.frequencyPenalty).toBeUndefined()
      expect(dto.presencePenalty).toBeUndefined()
      expect(dto.topK).toBeUndefined()
      expect(dto.stopSequences).toBeUndefined()
      expect(dto.maxRetries).toBeUndefined()
    })
  })

  describe('validate() — delegates validation to PutAIAdminDTO', () => {
    describe('data type errors', () => {
      it('should throw TypeException when data is undefined', () => {
        expect(() => PostAIAdminDTO.validate(undefined)).toThrow(TypeException)
        expect(() => PostAIAdminDTO.validate(undefined)).toThrow('Invalid data: expected an object')
      })

      it('should throw TypeException when data is null', () => {
        expect(() => PostAIAdminDTO.validate(null)).toThrow(TypeException)
      })

      it('should throw TypeException when data is a primitive', () => {
        expect(() => PostAIAdminDTO.validate('string')).toThrow(TypeException)
        expect(() => PostAIAdminDTO.validate(123)).toThrow(TypeException)
        expect(() => PostAIAdminDTO.validate(true)).toThrow(TypeException)
      })

      it('should throw TypeException when data is an array', () => {
        expect(() => PostAIAdminDTO.validate([])).toThrow(TypeException)
      })
    })

    describe('prompt errors', () => {
      it('should throw ValidationException when prompt is missing', () => {
        expect(() => PostAIAdminDTO.validate({})).toThrow(ValidationException)
        expect(() => PostAIAdminDTO.validate({})).toThrow(
          'Invalid prompt: must be a non-empty string'
        )
      })

      it('should throw ValidationException when prompt is empty string', () => {
        expect(() => PostAIAdminDTO.validate({ prompt: '' })).toThrow(ValidationException)
      })

      it('should throw ValidationException when prompt is whitespace only', () => {
        expect(() => PostAIAdminDTO.validate({ prompt: '   ' })).toThrow(ValidationException)
      })

      it('should throw ValidationException when prompt is not a string', () => {
        expect(() => PostAIAdminDTO.validate({ prompt: 42 })).toThrow(ValidationException)
        expect(() => PostAIAdminDTO.validate({ prompt: null })).toThrow(ValidationException)
      })
    })

    describe('optional field boundary errors', () => {
      it('should throw ValidationException for temperature above 2', () => {
        expect(() => PostAIAdminDTO.validate({ prompt: 'Test', temperature: 2.1 })).toThrow(
          ValidationException
        )
        expect(() => PostAIAdminDTO.validate({ prompt: 'Test', temperature: 2.1 })).toThrow(
          'Invalid temperature: must be between 0 and 2'
        )
      })

      it('should throw ValidationException for topP above 1', () => {
        expect(() => PostAIAdminDTO.validate({ prompt: 'Test', topP: 1.1 })).toThrow(
          ValidationException
        )
        expect(() => PostAIAdminDTO.validate({ prompt: 'Test', topP: 1.1 })).toThrow(
          'Invalid topP: must be between 0 and 1'
        )
      })

      it('should throw ValidationException for topK of 0', () => {
        expect(() => PostAIAdminDTO.validate({ prompt: 'Test', topK: 0 })).toThrow(
          ValidationException
        )
        expect(() => PostAIAdminDTO.validate({ prompt: 'Test', topK: 0 })).toThrow(
          'Invalid topK: must be between 1 and 100'
        )
      })

      it('should throw ValidationException for maxRetries above 10', () => {
        expect(() => PostAIAdminDTO.validate({ prompt: 'Test', maxRetries: 11 })).toThrow(
          ValidationException
        )
        expect(() => PostAIAdminDTO.validate({ prompt: 'Test', maxRetries: 11 })).toThrow(
          'Invalid maxRetries: must be between 0 and 10'
        )
      })

      it('should throw ValidationException for stopSequences containing non-strings', () => {
        expect(() =>
          PostAIAdminDTO.validate({ prompt: 'Test', stopSequences: ['OK', 123] })
        ).toThrow(ValidationException)
        expect(() =>
          PostAIAdminDTO.validate({ prompt: 'Test', stopSequences: ['OK', 123] })
        ).toThrow('Invalid stopSequences: all items must be strings')
      })
    })
  })
})
