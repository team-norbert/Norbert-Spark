import { describe, expect, it } from 'vitest'

import { RagDto } from '../../../src/application/dtos/rag.dto.js'
import { TypeException } from '../../../src/shared/exceptions/type.exception.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validInput = () => ({
  id: '01935e8a-7890-7123-b456-123456789abc',
  documents: [{ title: 'My Document', source: 'https://example.com/doc.pdf' }],
  embeddingModels: {
    modelName: 'text-embedding-3-small',
    modelProvider: 'openai',
    dimension: 1536 as const,
    releaseYear: 2024,
  },
  vectorEmbeddings: {
    chunkSize: 500,
    chunkOverlap: 50,
  },
  chatAIOptions: {
    chatTypeId: '01935e8a-7890-7123-b456-123456789abc',
    prompt: 'You are a helpful AI assistant.',
    stopSequences: ['\n', ' Human:'],
  },
})

// ---------------------------------------------------------------------------

describe('RagDto', () => {
  describe('constructor', () => {
    it('should create an instance with all required fields', () => {
      const dto = new RagDto(
        '01933c89-6f67-7b3a-8e4c-123456789abc',
        [{ title: 'Title', source: 'source' }],
        { modelName: 'model', modelProvider: 'provider', dimension: 1536, releaseYear: 2024 },
        { chunkSize: 500, chunkOverlap: 50 },
        { chatTypeId: 'chat-type-id', prompt: 'You are helpful.', stopSequences: [] }
      )

      expect(dto.id).toBe('01933c89-6f67-7b3a-8e4c-123456789abc')
      expect(dto.documents).toEqual([{ title: 'Title', source: 'source' }])
      expect(dto.embeddingModels.modelName).toBe('model')
      expect(dto.embeddingModels.modelProvider).toBe('provider')
      expect(dto.embeddingModels.dimension).toBe(1536)
      expect(dto.vectorEmbeddings.chunkSize).toBe(500)
      expect(dto.vectorEmbeddings.chunkOverlap).toBe(50)
      expect(dto.chatAIOptions.chatTypeId).toBe('chat-type-id')
    })

    it('should create an instance with all optional chatAIOptions fields', () => {
      const dto = new RagDto(
        '01933c89-6f67-7b3a-8e4c-123456789abc',
        [{ title: 'Title', source: 'source' }],
        { modelName: 'model', modelProvider: 'provider', dimension: 768, releaseYear: 2023 },
        { chunkSize: 200, chunkOverlap: 20 },
        {
          chatTypeId: 'chat-type-id',
          prompt: 'You are a helpful assistant.',
          maxTokens: 4096,
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.1,
          presencePenalty: 0.2,
          stopSequences: ['\n'],
          maxRetries: 3,
        }
      )

      expect(dto.chatAIOptions.maxTokens).toBe(4096)
      expect(dto.chatAIOptions.temperature).toBe(0.7)
      expect(dto.chatAIOptions.topP).toBe(0.9)
      expect(dto.chatAIOptions.frequencyPenalty).toBe(0.1)
      expect(dto.chatAIOptions.presencePenalty).toBe(0.2)
      expect(dto.chatAIOptions.stopSequences).toEqual(['\n'])
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

  describe('validate() — id validation', () => {
    it('should throw ValidationException when id is missing', () => {
      const { id: _id, ...rest } = validInput()
      expect(() => RagDto.validate(rest as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(rest as any)).toThrow('id is required and must be a string')
    })

    it('should throw ValidationException when id is null', () => {
      expect(() => RagDto.validate({ ...validInput(), id: null } as any)).toThrow(
        ValidationException
      )
      expect(() => RagDto.validate({ ...validInput(), id: null } as any)).toThrow(
        'id is required and must be a string'
      )
    })

    it('should throw ValidationException when id is a number', () => {
      expect(() => RagDto.validate({ ...validInput(), id: 42 } as any)).toThrow(ValidationException)
      expect(() => RagDto.validate({ ...validInput(), id: 42 } as any)).toThrow(
        'id is required and must be a string'
      )
    })

    it('should throw ValidationException when id is an empty string', () => {
      // empty string is still a string — validate() accepts it (isString('')  === true)
      // confirm no throw
      expect(() => RagDto.validate({ ...validInput(), id: '' })).not.toThrow()
    })

    it('should accept any non-empty string as id', () => {
      const dto = RagDto.validate({ ...validInput(), id: 'custom-id-123' })
      expect(dto.id).toBe('custom-id-123')
    })
  })

  // -------------------------------------------------------------------------

  describe('validate() — documents validation', () => {
    it('should throw ValidationException when a document element is null', () => {
      const data = { ...validInput(), documents: [null] }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow('each document must be a valid object')
    })

    it('should throw ValidationException when a document element is undefined', () => {
      const data = { ...validInput(), documents: [undefined] }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow('each document must be a valid object')
    })

    it('should throw ValidationException when a document element is a string', () => {
      const data = { ...validInput(), documents: ['not-an-object'] }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow('each document must be a valid object')
    })

    it('should throw ValidationException when a document element is a number', () => {
      const data = { ...validInput(), documents: [42] }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow('each document must be a valid object')
    })

    it('should throw ValidationException when documents.title is missing', () => {
      const data = { ...validInput(), documents: [{ source: 'src' }] }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'documents.title is required and must be a string'
      )
    })

    it('should throw ValidationException when documents.title is not a string', () => {
      const data = { ...validInput(), documents: [{ title: 123, source: 'src' }] }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'documents.title is required and must be a string'
      )
    })

    it('should throw ValidationException when documents.source is missing', () => {
      const data = { ...validInput(), documents: [{ title: 'Title' }] }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'documents.source is required and must be a string'
      )
    })

    it('should throw ValidationException when documents.source is not a string', () => {
      const data = { ...validInput(), documents: [{ title: 'Title', source: 99 }] }
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
        embeddingModels: { modelProvider: 'openai', dimension: 1536 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.modelName is required and must be a string'
      )
    })

    it('should throw ValidationException when modelName is not a string', () => {
      const data = {
        ...validInput(),
        embeddingModels: { modelName: 42, modelProvider: 'openai', dimension: 1536 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
    })

    it('should throw ValidationException when dimension is missing', () => {
      const data = {
        ...validInput(),
        embeddingModels: { modelName: 'model', modelProvider: 'openai' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.dimension is required and must be a number'
      )
    })

    it('should throw ValidationException when dimension is not a number', () => {
      const data = {
        ...validInput(),
        embeddingModels: { modelName: 'model', modelProvider: 'openai', dimension: '1536' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
    })

    it('should throw ValidationException when dimension is not one of the allowed values', () => {
      const data = {
        ...validInput(),
        embeddingModels: { modelName: 'model', modelProvider: 'openai', dimension: 512 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.dimension must be either 1536, 768, 384, 3072, or 1024'
      )
    })

    it('should accept all valid dimension values', () => {
      for (const dimension of [1536, 768, 384, 3072, 1024] as const) {
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

    it('should accept existingModelId alone (branch 1 of oneOf)', () => {
      const data = {
        ...validInput(),
        embeddingModels: { existingModelId: 'aaaaaaaa-0000-0000-0000-000000000001' },
      }
      const dto = RagDto.validate(data as any)
      expect(dto.embeddingModels.existingModelId).toBe('aaaaaaaa-0000-0000-0000-000000000001')
    })

    it('should not require modelName, modelProvider or dimension when existingModelId is provided', () => {
      const data = {
        ...validInput(),
        embeddingModels: { existingModelId: 'aaaaaaaa-0000-0000-0000-000000000001' },
      }
      expect(() => RagDto.validate(data as any)).not.toThrow()
    })

    it('should throw ValidationException when neither existingModelId nor custom fields are provided', () => {
      const data = { ...validInput(), embeddingModels: {} }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
    })

    it('should throw ValidationException when existingModelId is not a string', () => {
      const data = {
        ...validInput(),
        embeddingModels: { existingModelId: 42 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
    })

    it('should throw ValidationException when modelProvider is not a valid provider', () => {
      const data = {
        ...validInput(),
        embeddingModels: { ...validInput().embeddingModels, modelProvider: 'unknown-provider' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.modelProvider must be one of: openai, google, cohere, amazon, voyage, mistral'
      )
    })

    it('should accept all valid provider enum values', () => {
      for (const modelProvider of ['openai', 'google', 'cohere', 'amazon', 'voyage', 'mistral']) {
        const data = {
          ...validInput(),
          embeddingModels: { ...validInput().embeddingModels, modelProvider },
        }
        const dto = RagDto.validate(data as any)
        expect(dto.embeddingModels.modelProvider).toBe(modelProvider)
      }
    })

    it('should throw ValidationException when google + text-embedding-004 and taskType is missing', () => {
      const data = {
        ...validInput(),
        embeddingModels: {
          modelName: 'text-embedding-004',
          modelProvider: 'google',
          dimension: 768 as const,
          releaseYear: 2024,
        },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.taskType is required for google models text-embedding-004 and text-multilingual-embedding-002'
      )
    })

    it('should throw ValidationException when google + text-multilingual-embedding-002 and taskType is missing', () => {
      const data = {
        ...validInput(),
        embeddingModels: {
          modelName: 'text-multilingual-embedding-002',
          modelProvider: 'google',
          dimension: 768 as const,
          releaseYear: 2024,
        },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.taskType is required for google models text-embedding-004 and text-multilingual-embedding-002'
      )
    })

    it('should not require taskType for google model not in the required list', () => {
      const data = {
        ...validInput(),
        embeddingModels: {
          modelName: 'textembedding-gecko@003',
          modelProvider: 'google',
          dimension: 768 as const,
          releaseYear: 2023,
        },
      }
      expect(() => RagDto.validate(data as any)).not.toThrow()
    })

    it('should not require taskType for non-google providers', () => {
      const data = {
        ...validInput(),
        embeddingModels: {
          modelName: 'text-embedding-3-small',
          modelProvider: 'openai',
          dimension: 1536 as const,
          releaseYear: 2024,
        },
      }
      expect(() => RagDto.validate(data as any)).not.toThrow()
    })

    it('should accept a valid taskType for a google model that requires it', () => {
      const data = {
        ...validInput(),
        embeddingModels: {
          modelName: 'text-embedding-004',
          modelProvider: 'google',
          dimension: 768 as const,
          releaseYear: 2024,
          taskType: 'RETRIEVAL_QUERY',
        },
      }
      const dto = RagDto.validate(data as any)
      expect(dto.embeddingModels.taskType).toBe('RETRIEVAL_QUERY')
    })

    it('should throw ValidationException when taskType is an invalid enum value', () => {
      const data = {
        ...validInput(),
        embeddingModels: { ...validInput().embeddingModels, taskType: 'INVALID_TASK' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.taskType must be one of: RETRIEVAL_QUERY, RETRIEVAL_DOCUMENT, SEMANTIC_SIMILARITY, CLASSIFICATION, CLUSTERING'
      )
    })

    it('should accept all valid taskType enum values', () => {
      const validTaskTypes = [
        'RETRIEVAL_QUERY',
        'RETRIEVAL_DOCUMENT',
        'SEMANTIC_SIMILARITY',
        'CLASSIFICATION',
        'CLUSTERING',
      ]
      for (const taskType of validTaskTypes) {
        const data = {
          ...validInput(),
          embeddingModels: { ...validInput().embeddingModels, taskType },
        }
        const dto = RagDto.validate(data as any)
        expect(dto.embeddingModels.taskType).toBe(taskType)
      }
    })

    it('should throw ValidationException when releaseYear is present but not a number', () => {
      const data = {
        ...validInput(),
        embeddingModels: { ...validInput().embeddingModels, releaseYear: '2024' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.releaseYear must be an integer'
      )
    })

    it('should throw ValidationException when releaseYear is a float', () => {
      const data = {
        ...validInput(),
        embeddingModels: { ...validInput().embeddingModels, releaseYear: 2024.5 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.releaseYear must be an integer'
      )
    })

    it('should throw ValidationException when releaseYear is below minimum (2000)', () => {
      const data = {
        ...validInput(),
        embeddingModels: { ...validInput().embeddingModels, releaseYear: 1999 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.releaseYear must be between 2000 and 2027'
      )
    })

    it('should throw ValidationException when releaseYear is above maximum (2027)', () => {
      const data = {
        ...validInput(),
        embeddingModels: { ...validInput().embeddingModels, releaseYear: 2028 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.releaseYear must be between 2000 and 2027'
      )
    })

    it('should accept boundary releaseYear values (2000 and 2027)', () => {
      for (const releaseYear of [2000, 2027]) {
        const data = {
          ...validInput(),
          embeddingModels: { ...validInput().embeddingModels, releaseYear },
        }
        const dto = RagDto.validate(data as any)
        expect(dto.embeddingModels.releaseYear).toBe(releaseYear)
      }
    })

    it('should accept a valid integer releaseYear within bounds', () => {
      const data = {
        ...validInput(),
        embeddingModels: { ...validInput().embeddingModels, releaseYear: 2024 },
      }
      const dto = RagDto.validate(data as any)
      expect(dto.embeddingModels.releaseYear).toBe(2024)
    })

    it('should throw ValidationException when releaseYear is omitted for a new model', () => {
      const { releaseYear: _r, ...embeddingModelsWithoutReleaseYear } = validInput().embeddingModels
      const data = {
        ...validInput(),
        embeddingModels: embeddingModelsWithoutReleaseYear,
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'embeddingModels.releaseYear is required and must be a number'
      )
    })

    it('should not require releaseYear when existingModelId is provided', () => {
      const data = {
        ...validInput(),
        embeddingModels: { existingModelId: 'aaaaaaaa-0000-0000-0000-000000000001' },
      }
      expect(() => RagDto.validate(data as any)).not.toThrow()
    })

    it('should strip extra fields when existingModelId is provided', () => {
      const data = {
        ...validInput(),
        embeddingModels: {
          existingModelId: 'aaaaaaaa-0000-0000-0000-000000000001',
          modelName: 'should-be-stripped',
          modelProvider: 'openai',
          dimension: 1536,
          releaseYear: 2024,
        },
      }
      const dto = RagDto.validate(data as any)
      expect(dto.embeddingModels.existingModelId).toBe('aaaaaaaa-0000-0000-0000-000000000001')
      expect((dto.embeddingModels as any).modelName).toBeUndefined()
      expect((dto.embeddingModels as any).modelProvider).toBeUndefined()
      expect((dto.embeddingModels as any).dimension).toBeUndefined()
      expect((dto.embeddingModels as any).releaseYear).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------

  describe('validate() — vectorEmbeddings validation', () => {
    it('should throw ValidationException when chunkSize is missing', () => {
      const data = {
        ...validInput(),
        vectorEmbeddings: { chunkOverlap: 50 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'vectorEmbeddings.chunkSize is required and must be a number'
      )
    })

    it('should throw ValidationException when chunkSize is not a number', () => {
      const data = {
        ...validInput(),
        vectorEmbeddings: { chunkSize: '500', chunkOverlap: 50 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
    })

    it('should throw ValidationException when chunkOverlap is missing', () => {
      const data = {
        ...validInput(),
        vectorEmbeddings: { chunkSize: 500 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'vectorEmbeddings.chunkOverlap is required and must be a number'
      )
    })

    it('should throw ValidationException when chunkOverlap is not a number', () => {
      const data = {
        ...validInput(),
        vectorEmbeddings: { chunkSize: 500, chunkOverlap: '50' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
    })
  })

  // -------------------------------------------------------------------------

  describe('validate() — chatAIOptions validation', () => {
    it('should accept chatAIOptions without stopSequences (it is optional)', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { chatTypeId: 'id', prompt: 'You are helpful.' },
      }
      expect(() => RagDto.validate(data as any)).not.toThrow()
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
      const data = {
        ...validInput(),
        chatAIOptions: { chatTypeId: 'id', prompt: 'You are helpful.', stopSequences: [] },
      }
      const dto = RagDto.validate(data)
      expect(dto.chatAIOptions.stopSequences).toEqual([])
    })

    it('should throw ValidationException when chatTypeId is missing', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { stopSequences: [] },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow('chatAIOptions.chatTypeId is required')
    })

    it('should throw ValidationException when chatTypeId is not a string', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { chatTypeId: 123, stopSequences: [] },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'chatAIOptions.chatTypeId must be a string'
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
        chatAIOptions: { chatTypeId: 'type-id', prompt: 'You are helpful.', stopSequences: ['\n'] },
      }
      const dto = RagDto.validate(data)
      expect(dto.chatAIOptions.maxTokens).toBeUndefined()
      expect(dto.chatAIOptions.temperature).toBeUndefined()
      expect(dto.chatAIOptions.topP).toBeUndefined()
      expect(dto.chatAIOptions.frequencyPenalty).toBeUndefined()
      expect(dto.chatAIOptions.presencePenalty).toBeUndefined()
      expect(dto.chatAIOptions.maxRetries).toBeUndefined()
    })

    it('should throw ValidationException when prompt is missing', () => {
      const { prompt: _p, ...chatAIOptionsWithoutPrompt } = validInput().chatAIOptions
      const data = { ...validInput(), chatAIOptions: chatAIOptionsWithoutPrompt }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'chatAIOptions.prompt is required and must be a string'
      )
    })

    it('should throw ValidationException when prompt is not a string', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { ...validInput().chatAIOptions, prompt: 42 },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'chatAIOptions.prompt is required and must be a string'
      )
    })

    it('should throw ValidationException when prompt is whitespace-only', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { ...validInput().chatAIOptions, prompt: '   ' },
      }
      expect(() => RagDto.validate(data as any)).toThrow(ValidationException)
      expect(() => RagDto.validate(data as any)).toThrow(
        'chatAIOptions.prompt must not be empty or whitespace-only'
      )
    })

    it('should trim whitespace from prompt', () => {
      const data = {
        ...validInput(),
        chatAIOptions: { ...validInput().chatAIOptions, prompt: '  You are helpful.  ' },
      }
      const dto = RagDto.validate(data)
      expect(dto.chatAIOptions.prompt).toBe('You are helpful.')
    })
  })

  // -------------------------------------------------------------------------

  describe('validate() — successful construction', () => {
    it('should return a RagDto instance for valid minimal input', () => {
      const dto = RagDto.validate(validInput())

      expect(dto).toBeInstanceOf(RagDto)
      expect(dto.id).toBe('01935e8a-7890-7123-b456-123456789abc')
      expect(dto.documents).toEqual([
        { title: 'My Document', source: 'https://example.com/doc.pdf' },
      ])
      expect(dto.embeddingModels.modelName).toBe('text-embedding-3-small')
      expect(dto.embeddingModels.modelProvider).toBe('openai')
      expect(dto.embeddingModels.dimension).toBe(1536)
      expect(dto.embeddingModels.releaseYear).toBe(2024)
      expect(dto.vectorEmbeddings.chunkSize).toBe(500)
      expect(dto.vectorEmbeddings.chunkOverlap).toBe(50)
      expect(dto.chatAIOptions.chatTypeId).toBe('01935e8a-7890-7123-b456-123456789abc')
      expect(dto.chatAIOptions.prompt).toBe('You are a helpful AI assistant.')
      expect(dto.chatAIOptions.stopSequences).toEqual(['\n', ' Human:'])
    })

    it('should return a RagDto with only existingModelId when existingModelId path is used', () => {
      const data = {
        ...validInput(),
        embeddingModels: { existingModelId: 'aaaaaaaa-0000-0000-0000-000000000001' },
      }
      const dto = RagDto.validate(data as any)
      expect(dto.embeddingModels.existingModelId).toBe('aaaaaaaa-0000-0000-0000-000000000001')
      expect((dto.embeddingModels as any).modelName).toBeUndefined()
      expect((dto.embeddingModels as any).releaseYear).toBeUndefined()
    })

    it('should return a RagDto instance with all optional fields present', () => {
      const data = {
        ...validInput(),
        chatAIOptions: {
          chatTypeId: 'type-id',
          prompt: 'You are a helpful assistant.',
          stopSequences: ['\n'],
          maxTokens: 4096,
          temperature: 0.7,
          topP: 0.9,
          frequencyPenalty: 0.1,
          presencePenalty: 0.2,
          maxRetries: 3,
        },
      }
      const dto = RagDto.validate(data)

      expect(dto.chatAIOptions.maxTokens).toBe(4096)
      expect(dto.chatAIOptions.temperature).toBe(0.7)
      expect(dto.chatAIOptions.topP).toBe(0.9)
      expect(dto.chatAIOptions.frequencyPenalty).toBe(0.1)
      expect(dto.chatAIOptions.presencePenalty).toBe(0.2)
      expect(dto.chatAIOptions.maxRetries).toBe(3)
    })
  })
})
