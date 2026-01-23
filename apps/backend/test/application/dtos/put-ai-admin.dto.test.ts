import { describe, expect, it } from 'vitest'

import { PutAIAdminDTO } from '../../../src/application/dtos/put-ai-admin.dto.js'
import { TypeException } from '../../../src/shared/exceptions/type.exception.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('PutAIAdminDTO', () => {
  describe('constructor', () => {
    it('should create a PutAIAdminDTO with only required field', () => {
      const prompt = 'You are a helpful assistant'

      const dto = new PutAIAdminDTO(prompt)

      expect(dto.prompt).toBe(prompt)
      expect(dto.temperature).toBeUndefined()
      expect(dto.topP).toBeUndefined()
      expect(dto.frequencyPenalty).toBeUndefined()
      expect(dto.presencePenalty).toBeUndefined()
      expect(dto.topK).toBeUndefined()
      expect(dto.stopSequences).toBeUndefined()
      expect(dto.seed).toBeUndefined()
      expect(dto.maxRetries).toBeUndefined()
    })

    it('should create a PutAIAdminDTO with all fields', () => {
      const prompt = 'You are a helpful assistant'
      const temperature = 0.7
      const topP = 0.9
      const frequencyPenalty = 0.5
      const presencePenalty = 0.5
      const topK = 40
      const stopSequences = ['STOP', 'END']
      const seed = 12345
      const maxRetries = 3

      const dto = new PutAIAdminDTO(
        prompt,
        temperature,
        topP,
        frequencyPenalty,
        presencePenalty,
        topK,
        stopSequences,
        seed,
        maxRetries
      )

      expect(dto.prompt).toBe(prompt)
      expect(dto.temperature).toBe(temperature)
      expect(dto.topP).toBe(topP)
      expect(dto.frequencyPenalty).toBe(frequencyPenalty)
      expect(dto.presencePenalty).toBe(presencePenalty)
      expect(dto.topK).toBe(topK)
      expect(dto.stopSequences).toEqual(stopSequences)
      expect(dto.seed).toBe(seed)
      expect(dto.maxRetries).toBe(maxRetries)
    })

    it('should be instance of PutAIAdminDTO', () => {
      const dto = new PutAIAdminDTO('Test prompt')

      expect(dto).toBeInstanceOf(PutAIAdminDTO)
    })

    it('should have readonly properties', () => {
      const dto = new PutAIAdminDTO('Test prompt', 0.7)

      const descriptorPrompt = Object.getOwnPropertyDescriptor(dto, 'prompt')
      const descriptorTemp = Object.getOwnPropertyDescriptor(dto, 'temperature')

      expect(descriptorPrompt?.enumerable).toBe(true)
      expect(descriptorTemp?.enumerable).toBe(true)
    })
  })

  describe('validate', () => {
    describe('data type validation', () => {
      it('should throw TypeException when data is undefined', () => {
        expect(() => PutAIAdminDTO.validate(undefined)).toThrow(TypeException)
        expect(() => PutAIAdminDTO.validate(undefined)).toThrow('Invalid data: expected an object')
      })

      it('should throw TypeException when data is null', () => {
        expect(() => PutAIAdminDTO.validate(null)).toThrow(TypeException)
        expect(() => PutAIAdminDTO.validate(null)).toThrow('Invalid data: expected an object')
      })

      it('should throw TypeException when data is not an object', () => {
        expect(() => PutAIAdminDTO.validate('string')).toThrow(TypeException)
        expect(() => PutAIAdminDTO.validate(123)).toThrow(TypeException)
        expect(() => PutAIAdminDTO.validate(true)).toThrow(TypeException)
        expect(() => PutAIAdminDTO.validate([])).toThrow(TypeException)
      })
    })

    describe('prompt validation', () => {
      it('should throw ValidationException when prompt is missing', () => {
        expect(() => PutAIAdminDTO.validate({})).toThrow(ValidationException)
        expect(() => PutAIAdminDTO.validate({})).toThrow(
          'Invalid prompt: must be a non-empty string'
        )
      })

      it('should throw ValidationException when prompt is empty string', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: '' })).toThrow(ValidationException)
        expect(() => PutAIAdminDTO.validate({ prompt: '' })).toThrow(
          'Invalid prompt: must be a non-empty string'
        )
      })

      it('should throw ValidationException when prompt is not a string', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 123 })).toThrow(ValidationException)
        expect(() => PutAIAdminDTO.validate({ prompt: null })).toThrow(ValidationException)
        expect(() => PutAIAdminDTO.validate({ prompt: {} })).toThrow(ValidationException)
      })

      it('should accept valid prompt', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Valid prompt' })

        expect(result).toBeInstanceOf(PutAIAdminDTO)
        expect(result.prompt).toBe('Valid prompt')
      })
    })

    describe('temperature validation', () => {
      it('should throw ValidationException when temperature is not a number', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', temperature: 'high' })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', temperature: 'high' })).toThrow(
          'Invalid temperature: must be a number'
        )
      })

      it('should throw ValidationException when temperature is below 0', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', temperature: -0.1 })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', temperature: -0.1 })).toThrow(
          'Invalid temperature: must be between 0 and 2'
        )
      })

      it('should throw ValidationException when temperature is above 2', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', temperature: 2.1 })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', temperature: 2.1 })).toThrow(
          'Invalid temperature: must be between 0 and 2'
        )
      })

      it('should accept temperature at lower boundary (0)', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', temperature: 0 })

        expect(result.temperature).toBe(0)
      })

      it('should accept temperature at upper boundary (2)', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', temperature: 2 })

        expect(result.temperature).toBe(2)
      })

      it('should accept valid temperature in range', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', temperature: 0.7 })

        expect(result.temperature).toBe(0.7)
      })

      it('should accept undefined temperature', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test' })

        expect(result.temperature).toBeUndefined()
      })
    })

    describe('topP validation', () => {
      it('should throw ValidationException when topP is not a number', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', topP: 'high' })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', topP: 'high' })).toThrow(
          'Invalid topP: must be a number'
        )
      })

      it('should throw ValidationException when topP is below 0', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', topP: -0.1 })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', topP: -0.1 })).toThrow(
          'Invalid topP: must be between 0 and 1'
        )
      })

      it('should throw ValidationException when topP is above 1', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', topP: 1.1 })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', topP: 1.1 })).toThrow(
          'Invalid topP: must be between 0 and 1'
        )
      })

      it('should accept topP at lower boundary (0)', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', topP: 0 })

        expect(result.topP).toBe(0)
      })

      it('should accept topP at upper boundary (1)', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', topP: 1 })

        expect(result.topP).toBe(1)
      })

      it('should accept valid topP in range', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', topP: 0.9 })

        expect(result.topP).toBe(0.9)
      })
    })

    describe('frequencyPenalty validation', () => {
      it('should throw ValidationException when frequencyPenalty is not a number', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', frequencyPenalty: 'high' })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', frequencyPenalty: 'high' })).toThrow(
          'Invalid frequencyPenalty: must be a number'
        )
      })

      it('should throw ValidationException when frequencyPenalty is below -2', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', frequencyPenalty: -2.1 })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', frequencyPenalty: -2.1 })).toThrow(
          'Invalid frequencyPenalty: must be between -2 and 2'
        )
      })

      it('should throw ValidationException when frequencyPenalty is above 2', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', frequencyPenalty: 2.1 })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', frequencyPenalty: 2.1 })).toThrow(
          'Invalid frequencyPenalty: must be between -2 and 2'
        )
      })

      it('should accept frequencyPenalty at lower boundary (-2)', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', frequencyPenalty: -2 })

        expect(result.frequencyPenalty).toBe(-2)
      })

      it('should accept frequencyPenalty at upper boundary (2)', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', frequencyPenalty: 2 })

        expect(result.frequencyPenalty).toBe(2)
      })

      it('should accept valid frequencyPenalty in range', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', frequencyPenalty: 0.5 })

        expect(result.frequencyPenalty).toBe(0.5)
      })
    })

    describe('presencePenalty validation', () => {
      it('should throw ValidationException when presencePenalty is not a number', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', presencePenalty: 'high' })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', presencePenalty: 'high' })).toThrow(
          'Invalid presencePenalty: must be a number'
        )
      })

      it('should throw ValidationException when presencePenalty is below -2', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', presencePenalty: -2.1 })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', presencePenalty: -2.1 })).toThrow(
          'Invalid presencePenalty: must be between -2 and 2'
        )
      })

      it('should throw ValidationException when presencePenalty is above 2', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', presencePenalty: 2.1 })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', presencePenalty: 2.1 })).toThrow(
          'Invalid presencePenalty: must be between -2 and 2'
        )
      })

      it('should accept presencePenalty at lower boundary (-2)', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', presencePenalty: -2 })

        expect(result.presencePenalty).toBe(-2)
      })

      it('should accept presencePenalty at upper boundary (2)', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', presencePenalty: 2 })

        expect(result.presencePenalty).toBe(2)
      })

      it('should accept valid presencePenalty in range', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', presencePenalty: 0.5 })

        expect(result.presencePenalty).toBe(0.5)
      })
    })

    describe('topK validation', () => {
      it('should throw ValidationException when topK is not a number', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', topK: 'high' })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', topK: 'high' })).toThrow(
          'Invalid topK: must be a number'
        )
      })

      it('should throw ValidationException when topK is 0', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', topK: 0 })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', topK: 0 })).toThrow(
          'Invalid topK: must be between 1 and 100'
        )
      })

      it('should throw ValidationException when topK is negative', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', topK: -1 })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', topK: -1 })).toThrow(
          'Invalid topK: must be between 1 and 100'
        )
      })

      it('should throw ValidationException when topK is above 100', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', topK: 101 })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', topK: 101 })).toThrow(
          'Invalid topK: must be between 1 and 100'
        )
      })

      it('should accept topK at lower boundary (1)', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', topK: 1 })

        expect(result.topK).toBe(1)
      })

      it('should accept topK at upper boundary (100)', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', topK: 100 })

        expect(result.topK).toBe(100)
      })

      it('should accept valid topK in range', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', topK: 40 })

        expect(result.topK).toBe(40)
      })
    })

    describe('stopSequences validation', () => {
      it('should throw ValidationException when stopSequences is not an array', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', stopSequences: 'STOP' })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', stopSequences: 'STOP' })).toThrow(
          'Invalid stopSequences: must be an array'
        )
      })

      it('should throw ValidationException when stopSequences contains non-strings', () => {
        expect(() =>
          PutAIAdminDTO.validate({ prompt: 'Test', stopSequences: ['STOP', 123] })
        ).toThrow(ValidationException)
        expect(() =>
          PutAIAdminDTO.validate({ prompt: 'Test', stopSequences: ['STOP', 123] })
        ).toThrow('Invalid stopSequences: all items must be strings')
      })

      it('should throw ValidationException when stopSequences contains null', () => {
        expect(() =>
          PutAIAdminDTO.validate({ prompt: 'Test', stopSequences: ['STOP', null] })
        ).toThrow(ValidationException)
      })

      it('should throw ValidationException when stopSequences contains undefined', () => {
        expect(() =>
          PutAIAdminDTO.validate({ prompt: 'Test', stopSequences: ['STOP', undefined] })
        ).toThrow(ValidationException)
      })

      it('should accept empty stopSequences array', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', stopSequences: [] })

        expect(result.stopSequences).toEqual([])
      })

      it('should accept valid stopSequences array', () => {
        const stopSequences = ['STOP', 'END', 'DONE']
        const result = PutAIAdminDTO.validate({ prompt: 'Test', stopSequences })

        expect(result.stopSequences).toEqual(stopSequences)
      })

      it('should accept single item stopSequences array', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', stopSequences: ['STOP'] })

        expect(result.stopSequences).toEqual(['STOP'])
      })
    })

    describe('seed validation', () => {
      it('should throw ValidationException when seed is not a number', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', seed: 'random' })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', seed: 'random' })).toThrow(
          'Invalid seed: must be a number'
        )
      })

      it('should throw ValidationException when seed is negative', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', seed: -1 })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', seed: -1 })).toThrow(
          'Invalid seed: must be between 0 and 2147483647'
        )
      })

      it('should throw ValidationException when seed exceeds max value', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', seed: 2147483648 })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', seed: 2147483648 })).toThrow(
          'Invalid seed: must be between 0 and 2147483647'
        )
      })

      it('should accept seed at lower boundary (0)', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', seed: 0 })

        expect(result.seed).toBe(0)
      })

      it('should accept seed at upper boundary (2147483647)', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', seed: 2147483647 })

        expect(result.seed).toBe(2147483647)
      })

      it('should accept valid seed in range', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', seed: 12345 })

        expect(result.seed).toBe(12345)
      })
    })

    describe('maxRetries validation', () => {
      it('should throw ValidationException when maxRetries is not a number', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', maxRetries: 'many' })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', maxRetries: 'many' })).toThrow(
          'Invalid maxRetries: must be a number'
        )
      })

      it('should throw ValidationException when maxRetries is negative', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', maxRetries: -1 })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', maxRetries: -1 })).toThrow(
          'Invalid maxRetries: must be between 0 and 10'
        )
      })

      it('should throw ValidationException when maxRetries is above 10', () => {
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', maxRetries: 11 })).toThrow(
          ValidationException
        )
        expect(() => PutAIAdminDTO.validate({ prompt: 'Test', maxRetries: 11 })).toThrow(
          'Invalid maxRetries: must be between 0 and 10'
        )
      })

      it('should accept maxRetries at lower boundary (0)', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', maxRetries: 0 })

        expect(result.maxRetries).toBe(0)
      })

      it('should accept maxRetries at upper boundary (10)', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', maxRetries: 10 })

        expect(result.maxRetries).toBe(10)
      })

      it('should accept valid maxRetries in range', () => {
        const result = PutAIAdminDTO.validate({ prompt: 'Test', maxRetries: 3 })

        expect(result.maxRetries).toBe(3)
      })
    })

    describe('combined field validation', () => {
      it('should validate all fields together', () => {
        const data = {
          prompt: 'You are a helpful assistant',
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.5,
          presencePenalty: -0.5,
          topK: 40,
          stopSequences: ['STOP', 'END'],
          seed: 12345,
          maxRetries: 3,
        }

        const result = PutAIAdminDTO.validate(data)

        expect(result).toBeInstanceOf(PutAIAdminDTO)
        expect(result.prompt).toBe(data.prompt)
        expect(result.temperature).toBe(data.temperature)
        expect(result.topP).toBe(data.topP)
        expect(result.frequencyPenalty).toBe(data.frequencyPenalty)
        expect(result.presencePenalty).toBe(data.presencePenalty)
        expect(result.topK).toBe(data.topK)
        expect(result.stopSequences).toEqual(data.stopSequences)
        expect(result.seed).toBe(data.seed)
        expect(result.maxRetries).toBe(data.maxRetries)
      })

      it('should validate with only required field', () => {
        const data = { prompt: 'Test prompt' }

        const result = PutAIAdminDTO.validate(data)

        expect(result).toBeInstanceOf(PutAIAdminDTO)
        expect(result.prompt).toBe(data.prompt)
        expect(result.temperature).toBeUndefined()
        expect(result.topP).toBeUndefined()
        expect(result.frequencyPenalty).toBeUndefined()
        expect(result.presencePenalty).toBeUndefined()
        expect(result.topK).toBeUndefined()
        expect(result.stopSequences).toBeUndefined()
        expect(result.seed).toBeUndefined()
        expect(result.maxRetries).toBeUndefined()
      })

      it('should validate with mix of defined and undefined optional fields', () => {
        const data = {
          prompt: 'Test prompt',
          temperature: 0.7,
          topK: 50,
          maxRetries: 5,
        }

        const result = PutAIAdminDTO.validate(data)

        expect(result).toBeInstanceOf(PutAIAdminDTO)
        expect(result.prompt).toBe(data.prompt)
        expect(result.temperature).toBe(data.temperature)
        expect(result.topP).toBeUndefined()
        expect(result.frequencyPenalty).toBeUndefined()
        expect(result.presencePenalty).toBeUndefined()
        expect(result.topK).toBe(data.topK)
        expect(result.stopSequences).toBeUndefined()
        expect(result.seed).toBeUndefined()
        expect(result.maxRetries).toBe(data.maxRetries)
      })

      it('should handle extra properties in data object', () => {
        const data = {
          prompt: 'Test prompt',
          temperature: 0.7,
          extraField: 'should be ignored',
          anotherExtra: 123,
        }

        const result = PutAIAdminDTO.validate(data)

        expect(result).toBeInstanceOf(PutAIAdminDTO)
        expect(result.prompt).toBe(data.prompt)
        expect(result.temperature).toBe(data.temperature)
        // Extra fields should not be in the DTO
        expect((result as any).extraField).toBeUndefined()
        expect((result as any).anotherExtra).toBeUndefined()
      })
    })
  })
})
