import { describe, expect, it } from 'vitest'

import { RagDto } from '../../../src/application/dtos/rag.dto.js'
import { TypeException } from '../../../src/shared/exceptions/type.exception.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validInput = () => ({
  id: '01935e8a-7890-7123-b456-123456789abc',
  documents: {
    title: 'My Document',
    source: 'https://example.com/doc.pdf',
  },
  embeddingModels: {
    modelName: 'text-embedding-3-small',
    modelProvider: 'OpenAI',
    dimension: 1536 as const,
  },
  vectorEmbeddings: {
    distanceMetric: 'cosine' as const,
    chunkSize: 500,
    chunkOverlap: 50,
  },
  chatAIOptions: {
    chatTypeId: '01935e8a-7890-7123-b456-123456789abc',
    stopSequences: ['\n', ' Human:'],
  },
})

// ---------------------------------------------------------------------------

describe('RagDto', () => {
  describe('constructor', () => {
    it('should create an instance with all required fields', () => {
      const dto = new RagDto(
        '01933c89-6f67-7b3a-8e4c-123456789abc',
        { title: 'Title', source: 'source' },
        { modelName: 'model', modelProvider: 'provider', dimension: 1536 },
        { distanceMetric: 'cosine', chunkSize: 500, chunkOverlap: 50 },
        { chatTypeId: 'chat-type-id', stopSequences: [] }
      )

      expect(dto.documents.title).toBe('Title')
      expect(dto.documents.source).toBe('source')
      expect(dto.embeddingModels.modelName).toBe('model')
      expect(dto.embeddingModels.modelProvider).toBe('provider')
      expect(dto.embeddingModels.dimension).toBe(1536)
      expect(dto.vectorEmbeddings.distanceMetric).toBe('cosine')
      expect(dto.vectorEmbeddings.chunkSize).toBe(500)
      expect(dto.vectorEmbeddings.chunkOverlap).toBe(50)
      expect(dto.chatAIOptions.chatTypeId).toBe('chat-type-id')
    })

    it('should create an instance with all optional chatAIOptions fields', () => {
      const dto = new RagDto(
        '01933c89-6f67-7b3a-8e4c-123456789abc',
        { title: 'Title', source: 'source' },
        { modelName: 'model', modelProvider: 'provider', dimension: 768 },
        { distanceMetric: 'euclidean', chunkSize: 200, chunkOverlap: 20 },
        {
          chatTypeId: 'chat-type-id',
          maxTokens: 4096,
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.1,
          presencePenalty: 0.2,
          stopSequences: ['\n'],
          seed: 42,
          maxRetries: 3,
        }
      )

      expect(dto.chatAIOptions.maxTokens).toBe(4096)
      expect(dto.chatAIOptions.temperature).toBe(0.7)
      expect(dto.chatAIOptions.topP).toBe(0.9)
      expect(dto.chatAIOptions.frequencyPenalty).toBe(0.1)
      expect(dto.chatAIOptions.presencePenalty).toBe(0.2)
      expect(dto.chatAIOptions.stopSequences).toEqual(['\n'])
      expect(dto.chatAIOptions.seed).toBe(42)
      expect(dto.chatAIOptions.maxRetries).toBe(3)
    })
  })

  // -------------------------------------------------------------------------

  describe('validate() — top-level type checks', () => {
    it('should throw TypeException when data is null', () => {
      expect(() => RagDto.validate(null as any)).toThrow(TypeException)
      expect(() => RagDto.validate(null as any)).toThrow('Data must be a valid object')
    })

    it('should throw TypeException when data is undefined', () => {
      expect(() => RagDto.validate(undefined as any)).toThrow(TypeException)
    })

    it('should throw TypeException when data is a string', () => {
      expect(() => RagDto.validate('invalid' as any)).toThrow(TypeException)
    })

    it('should throw TypeException when data is a number', () => {
      expect(() => RagDto.validate(42 as any)).toThrow(TypeException)
    })

    it('should throw TypeException when documents is missing', () => {
      const { documents: _d, ...rest } = validInput()
      expect(() => RagDto.validate(rest as any)).toThrow(TypeException)
    })

    it('should throw TypeException when documents is not an object', () => {
      expect(() => RagDto.validate({ ...validInput(), documents: 'bad' } as any)).toThrow(
        TypeException
      )
    })

    it('should throw TypeException when embeddingModels is missing', () => {
      const { embeddingModels: _e, ...rest } = validInput()
      expect(() => RagDto.validate(rest as any)).toThrow(TypeException)
    })

    it('should throw TypeException when embeddingModels is not an object', () => {
      expect(() => RagDto.validate({ ...validInput(), embeddingModels: 123 } as any)).toThrow(
        TypeException
      )
    })

    it('should throw TypeException when vectorEmbeddings is missing', () => {
      const { vectorEmbeddings: _v, ...rest } = validInput()
      expect(() => RagDto.validate(rest as any)).toThrow(TypeException)
    })

    it('should throw TypeException when vectorEmbeddings is not an object', () => {
      expect(() => RagDto.validate({ ...validInput(), vectorEmbeddings: true } as any)).toThrow(
        TypeException
      )
    })

    it('should throw TypeException when chatAIOptions is missing', () => {
      const { chatAIOptions: _c, ...rest } = validInput()
      expect(() => RagDto.validate(rest as any)).toThrow(TypeException)
    })

    it('should throw TypeException when chatAIOptions is not an object', () => {
      expect(() => RagDto.validate({ ...validInput(), chatAIOptions: [] } as any)).toThrow(
        TypeException
      )
    })
  })

  // -------------------------------------------------------------------------

  describe('validate() — documents validation', () => {
    it('should throw ValidationException when documents.title is missing', () => {
      const data = { ...validInput(), documents: { source: 'src' } }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'documents.title is required and must be a string'
      )
    })

    it('should throw ValidationException when documents.title is not a string', () => {
      const data = { ...validInput(), documents: { title: 123, source: 'src' } }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'documents.title is required and must be a string'
      )
    })

    it('should throw ValidationException when documents.source is missing', () => {
      const data = { ...validInput(), documents: { title: 'Title' } }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'documents.source is required and must be a string'
      )
    })

    it('should throw ValidationException when documents.source is not a string', () => {
      const data = { ...validInput(), documents: { title: 'Title', source: 99 } }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'documents.source is required and must be a string'
      )
    })
  })

  // -------------------------------------------------------------------------

  describe('validate() — embeddingModels validation', () => {
    it('should throw ValidationException when modelName is missing', () => {
      const data = {
        ...validInput(),
        embeddingModels: { modelProvider: 'OpenAI', dimension: 1536 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.modelName is required and must be a string'
      )
    })

    it('should throw ValidationException when modelName is not a string', () => {
      const data = {
        ...validInput(),
        embeddingModels: { modelName: 42, modelProvider: 'OpenAI', dimension: 1536 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
    })

    it('should throw ValidationException when dimension is missing', () => {
      const data = {
        ...validInput(),
        embeddingModels: { modelName: 'model', modelProvider: 'OpenAI' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.dimension is required and must be a string'
      )
    })

    it('should throw ValidationException when dimension is not a number', () => {
      const data = {
        ...validInput(),
        embeddingModels: { modelName: 'model', modelProvider: 'OpenAI', dimension: '1536' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
    })

    it('should throw ValidationException when dimension is not one of the allowed values', () => {
      const data = {
        ...validInput(),
        embeddingModels: { modelName: 'model', modelProvider: 'OpenAI', dimension: 512 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.dimension must be either 1536, 768, or 384'
      )
    })

    it('should accept all valid dimension values', () => {
      for (const dimension of [1536, 768, 384] as const) {
        const data = {
          ...validInput(),
          embeddingModels: { ...validInput().embeddingModels, dimension },
        }
        const dto = RagDto.validate(data)
        expect(dto.embeddingModels.dimension).toBe(dimension)
      }
    })

    it('should throw ValidationException when modelProvider is missing', () => {
      const data = {
        ...validInput(),
        embeddingModels: { modelName: 'model', dimension: 1536 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.modelProvider is required and must be a string'
      )
    })

    it('should throw ValidationException when modelProvider is not a string', () => {
      const data = {
        ...validInput(),
        embeddingModels: { modelName: 'model', modelProvider: true, dimension: 1536 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
    })
  })

  // -------------------------------------------------------------------------

  describe('validate() — vectorEmbeddings validation', () => {
    it('should throw ValidationException when distanceMetric is missing', () => {
      const data = {
        ...validInput(),
        vectorEmbeddings: { chunkSize: 500, chunkOverlap: 50 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'vectorEmbeddings.distanceMetric is required and must be a string'
      )
    })

    it('should throw ValidationException when distanceMetric is not a string', () => {
      const data = {
        ...validInput(),
        vectorEmbeddings: { distanceMetric: 1, chunkSize: 500, chunkOverlap: 50 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
    })

    it('should throw ValidationException when distanceMetric is not an allowed value', () => {
      const data = {
        ...validInput(),
        vectorEmbeddings: { distanceMetric: 'manhattan', chunkSize: 500, chunkOverlap: 50 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'vectorEmbeddings.distanceMetric must be either "cosine", "euclidean", or "dot_product"'
      )
    })

    it('should accept all valid distanceMetric values', () => {
      for (const distanceMetric of ['cosine', 'euclidean', 'dot_product'] as const) {
        const data = {
          ...validInput(),
          vectorEmbeddings: { ...validInput().vectorEmbeddings, distanceMetric },
        }
        const dto = RagDto.validate(data)
        expect(dto.vectorEmbeddings.distanceMetric).toBe(distanceMetric)
      }
    })

    it('should throw ValidationException when chunkSize is missing', () => {
      const data = {
        ...validInput(),
        vectorEmbeddings: { distanceMetric: 'cosine', chunkOverlap: 50 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'vectorEmbeddings.chunkSize is required and must be a number'
      )
    })

    it('should throw ValidationException when chunkSize is not a number', () => {
      const data = {
        ...validInput(),
        vectorEmbeddings: { distanceMetric: 'cosine', chunkSize: '500', chunkOverlap: 50 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
    })

    it('should throw ValidationException when chunkOverlap is missing', () => {
      const data = {
        ...validInput(),
        vectorEmbeddings: { distanceMetric: 'cosine', chunkSize: 500 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'vectorEmbeddings.chunkOverlap is required and must be a number'
      )
    })

    it('should throw ValidationException when chunkOverlap is not a number', () => {
      const data = {
        ...validInput(),
        vectorEmbeddings: { distanceMetric: 'cosine', chunkSize: 500, chunkOverlap: '50' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
    })
  })

  // -------------------------------------------------------------------------

  describe('validate() — chatAIOptions validation', () => {
    it('should throw ValidationException when stopSequences is missing', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { chatTypeId: 'id' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'chatAIOptions.stopSequences is required and must be an array of strings'
      )
    })

    it('should throw ValidationException when stopSequences is not an array', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { chatTypeId: 'id', stopSequences: 'stop' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
    })

    it('should throw ValidationException when stopSequences contains a non-string', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { chatTypeId: 'id', stopSequences: ['\n', 42] },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'chatAIOptions.stopSequences must be an array of strings'
      )
    })

    it('should accept an empty stopSequences array', () => {
      const data = { ...validInput(), chatAIOptions: { chatTypeId: 'id', stopSequences: [] } }
      const dto = RagDto.validate(data)
      expect(dto.chatAIOptions.stopSequences).toEqual([])
    })

    it('should throw ValidationException when chatTypeId is not a string', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { chatTypeId: 123, stopSequences: [] },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'chatAIOptions.chatTypeId is required and must be a string'
      )
    })

    it('should throw ValidationException when maxTokens is present but not a number', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { ...validInput().chatAIOptions, maxTokens: 'lots' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow('chatAIOptions.maxTokens must be a number')
    })

    it('should throw ValidationException when temperature is present but not a number', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { ...validInput().chatAIOptions, temperature: 'hot' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'chatAIOptions.temperature must be a number'
      )
    })

    it('should throw ValidationException when topP is present but not a number', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { ...validInput().chatAIOptions, topP: true },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow('chatAIOptions.topP must be a number')
    })

    it('should throw ValidationException when frequencyPenalty is present but not a number', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { ...validInput().chatAIOptions, frequencyPenalty: '0.5' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'chatAIOptions.frequencyPenalty must be a number'
      )
    })

    it('should throw ValidationException when presencePenalty is present but not a number', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { ...validInput().chatAIOptions, presencePenalty: {} },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'chatAIOptions.presencePenalty must be a number'
      )
    })

    it('should throw ValidationException when seed is present but not a number', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { ...validInput().chatAIOptions, seed: '42' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow('chatAIOptions.seed must be a number')
    })

    it('should throw ValidationException when maxRetries is present but not a number', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { ...validInput().chatAIOptions, maxRetries: '3' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'chatAIOptions.maxRetries must be a number'
      )
    })

    it('should allow all optional chatAIOptions fields to be omitted', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { chatTypeId: 'type-id', stopSequences: ['\n'] },
      }
      const dto = RagDto.validate(data)
      expect(dto.chatAIOptions.maxTokens).toBeUndefined()
      expect(dto.chatAIOptions.temperature).toBeUndefined()
      expect(dto.chatAIOptions.topP).toBeUndefined()
      expect(dto.chatAIOptions.frequencyPenalty).toBeUndefined()
      expect(dto.chatAIOptions.presencePenalty).toBeUndefined()
      expect(dto.chatAIOptions.seed).toBeUndefined()
      expect(dto.chatAIOptions.maxRetries).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------

  describe('validate() — successful construction', () => {
    it('should return a RagDto instance for valid minimal input', () => {
      const dto = RagDto.validate(validInput())

      expect(dto).toBeInstanceOf(RagDto)
      expect(dto.documents.title).toBe('My Document')
      expect(dto.documents.source).toBe('https://example.com/doc.pdf')
      expect(dto.embeddingModels.modelName).toBe('text-embedding-3-small')
      expect(dto.embeddingModels.modelProvider).toBe('OpenAI')
      expect(dto.embeddingModels.dimension).toBe(1536)
      expect(dto.vectorEmbeddings.distanceMetric).toBe('cosine')
      expect(dto.vectorEmbeddings.chunkSize).toBe(500)
      expect(dto.vectorEmbeddings.chunkOverlap).toBe(50)
      expect(dto.chatAIOptions.chatTypeId).toBe('01935e8a-7890-7123-b456-123456789abc')
      expect(dto.chatAIOptions.stopSequences).toEqual(['\n', ' Human:'])
    })

    it('should return a RagDto instance with all optional fields present', () => {
      const data = {
        ...validInput(),
        chatAIOptions: {
          chatTypeId: 'type-id',
          stopSequences: ['\n'],
          maxTokens: 4096,
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.1,
          presencePenalty: 0.2,
          seed: 42,
          maxRetries: 3,
        },
      }
      const dto = RagDto.validate(data)

      expect(dto.chatAIOptions.maxTokens).toBe(4096)
      expect(dto.chatAIOptions.temperature).toBe(0.7)
      expect(dto.chatAIOptions.topP).toBe(0.9)
      expect(dto.chatAIOptions.frequencyPenalty).toBe(0.1)
      expect(dto.chatAIOptions.presencePenalty).toBe(0.2)
      expect(dto.chatAIOptions.seed).toBe(42)
      expect(dto.chatAIOptions.maxRetries).toBe(3)
    })
  })
})
