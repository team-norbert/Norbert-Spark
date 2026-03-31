import { isDefined, isNumber, isObject, isString } from '@norberts-spark/shared'
import type { components } from '@norberts-spark/shared/openapi-types'

import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'

export class RagDto {
  constructor(
    public readonly id: string,
    public readonly documents: Array<{
      title: string
      source: string
    }>,
    public readonly embeddingModels:
      | {
          existingModelId: string
        }
      | {
          modelName: string
          modelProvider: string
          dimension: 1536 | 768 | 384 | 3072 | 1024
          releaseYear: number
          taskType?:
            | 'RETRIEVAL_QUERY'
            | 'RETRIEVAL_DOCUMENT'
            | 'SEMANTIC_SIMILARITY'
            | 'CLASSIFICATION'
            | 'CLUSTERING'
        },
    public readonly vectorEmbeddings: {
      chunkSize: number
      chunkOverlap: number
    },
    public readonly chatAIOptions: {
      chatTypeId: string
      prompt: string
      maxTokens?: number
      temperature?: number
      topP?: number
      frequencyPenalty?: number
      presencePenalty?: number
      stopSequences?: string[]
      maxRetries?: number
    }
  ) {}

  static validate(data: components['schemas']['CreateVectorStoreRequest']): RagDto {
    if (!isDefined(data) || !isObject(data)) {
      throw new TypeException('Data must be a valid object')
    }

    if (
      !isDefined(data.documents) ||
      !Array.isArray(data.documents) ||
      data.documents.length === 0
    ) {
      throw new TypeException('Data must be a valid object')
    }

    if (!isDefined(data.embeddingModels) || !isObject(data.embeddingModels)) {
      throw new TypeException('Data must be a valid object')
    }

    if (!isDefined(data.vectorEmbeddings) || !isObject(data.vectorEmbeddings)) {
      throw new TypeException('Data must be a valid object')
    }

    if (!isDefined(data.chatAIOptions) || !isObject(data.chatAIOptions)) {
      throw new TypeException('Data must be a valid object')
    }

    if (!isString(data.id)) {
      throw new ValidationException('id is required and must be a string')
    }

    for (const doc of data.documents) {
      if (!isObject(doc)) {
        throw new ValidationException('each document must be a valid object')
      }

      if (!isString(doc.title)) {
        throw new ValidationException('documents.title is required and must be a string')
      }

      if (!isString(doc.source)) {
        throw new ValidationException('documents.source is required and must be a string')
      }
    }

    // Type narrowing for discriminated union
    // Store validated embedding model data
    let validatedEmbeddingModels: RagDto['embeddingModels']

    // Type narrowing for discriminated union using 'in' operator
    if (
      'existingModelId' in data.embeddingModels &&
      isString(data.embeddingModels.existingModelId) &&
      data.embeddingModels.existingModelId.trim() !== ''
    ) {
      validatedEmbeddingModels = {
        existingModelId: data.embeddingModels.existingModelId,
      }
    } else {
      // Extract for type-safe access (type narrowing doesn't persist across checks)
      const embeddingData = data.embeddingModels as {
        modelName?: unknown
        modelProvider?: unknown
        dimension?: unknown
        releaseYear?: unknown
        taskType?: unknown
      }

      if (!isString(embeddingData.modelName)) {
        throw new ValidationException('embeddingModels.modelName is required and must be a string')
      }

      if (!isNumber(embeddingData.dimension)) {
        throw new ValidationException('embeddingModels.dimension is required and must be a number')
      }

      const VALID_DIMENSIONS = [1536, 768, 384, 3072, 1024] as const
      type ValidDimension = (typeof VALID_DIMENSIONS)[number]
      if (!VALID_DIMENSIONS.includes(embeddingData.dimension as ValidDimension)) {
        throw new ValidationException(
          'embeddingModels.dimension must be either 1536, 768, 384, 3072, or 1024'
        )
      }

      if (!isString(embeddingData.modelProvider)) {
        throw new ValidationException(
          'embeddingModels.modelProvider is required and must be a string'
        )
      }

      const VALID_PROVIDERS = ['openai', 'google', 'cohere', 'amazon', 'voyage', 'mistral'] as const
      type ValidProvider = (typeof VALID_PROVIDERS)[number]
      if (!VALID_PROVIDERS.includes(embeddingData.modelProvider as ValidProvider)) {
        throw new ValidationException(
          'embeddingModels.modelProvider must be one of: openai, google, cohere, amazon, voyage, mistral'
        )
      }

      if (!isDefined(embeddingData.releaseYear)) {
        throw new ValidationException(
          'embeddingModels.releaseYear is required and must be a number'
        )
      }

      if (!isNumber(embeddingData.releaseYear) || !Number.isInteger(embeddingData.releaseYear)) {
        throw new ValidationException('embeddingModels.releaseYear must be an integer')
      }

      const currentYear = new Date().getFullYear()
      const maxReleaseYear = currentYear + 1
      if (embeddingData.releaseYear < 2000 || embeddingData.releaseYear > maxReleaseYear) {
        throw new ValidationException(
          `embeddingModels.releaseYear must be between 2000 and ${maxReleaseYear}`
        )
      }

      const GOOGLE_TASK_TYPE_REQUIRED_MODELS = [
        'text-embedding-004',
        'text-multilingual-embedding-002',
      ] as const
      const requiresTaskType =
        embeddingData.modelProvider === 'google' &&
        GOOGLE_TASK_TYPE_REQUIRED_MODELS.includes(
          embeddingData.modelName as (typeof GOOGLE_TASK_TYPE_REQUIRED_MODELS)[number]
        )

      if (requiresTaskType && !isDefined(embeddingData.taskType)) {
        throw new ValidationException(
          'embeddingModels.taskType is required for google models text-embedding-004 and text-multilingual-embedding-002'
        )
      }

      if (isDefined(embeddingData.taskType)) {
        const VALID_TASK_TYPES = [
          'RETRIEVAL_QUERY',
          'RETRIEVAL_DOCUMENT',
          'SEMANTIC_SIMILARITY',
          'CLASSIFICATION',
          'CLUSTERING',
        ] as const
        type ValidTaskType = (typeof VALID_TASK_TYPES)[number]
        if (!isString(embeddingData.taskType)) {
          throw new ValidationException('embeddingModels.taskType must be a string')
        }
        if (!VALID_TASK_TYPES.includes(embeddingData.taskType as ValidTaskType)) {
          throw new ValidationException(
            'embeddingModels.taskType must be one of: RETRIEVAL_QUERY, RETRIEVAL_DOCUMENT, SEMANTIC_SIMILARITY, CLASSIFICATION, CLUSTERING'
          )
        }
      }

      validatedEmbeddingModels = {
        modelName: embeddingData.modelName,
        modelProvider: embeddingData.modelProvider as string,
        dimension: embeddingData.dimension as 1536 | 768 | 384 | 3072 | 1024,
        releaseYear: embeddingData.releaseYear as number,
        taskType: embeddingData.taskType as
          | 'RETRIEVAL_QUERY'
          | 'RETRIEVAL_DOCUMENT'
          | 'SEMANTIC_SIMILARITY'
          | 'CLASSIFICATION'
          | 'CLUSTERING'
          | undefined,
      }
    }

    if (!isNumber(data.vectorEmbeddings.chunkSize)) {
      throw new ValidationException('vectorEmbeddings.chunkSize is required and must be a number')
    }

    if (!isNumber(data.vectorEmbeddings.chunkOverlap)) {
      throw new ValidationException(
        'vectorEmbeddings.chunkOverlap is required and must be a number'
      )
    }

    if (
      isDefined(data.chatAIOptions.stopSequences) &&
      !Array.isArray(data.chatAIOptions.stopSequences)
    ) {
      throw new ValidationException('chatAIOptions.stopSequences must be an array of strings')
    }

    if (
      isDefined(data.chatAIOptions.stopSequences) &&
      Array.isArray(data.chatAIOptions.stopSequences) &&
      !data.chatAIOptions.stopSequences.every(isString)
    ) {
      throw new ValidationException('chatAIOptions.stopSequences must be an array of strings')
    }

    if (isDefined(data.chatAIOptions.maxTokens) && !isNumber(data.chatAIOptions.maxTokens)) {
      throw new ValidationException('chatAIOptions.maxTokens must be a number')
    }

    if (isDefined(data.chatAIOptions.temperature) && !isNumber(data.chatAIOptions.temperature)) {
      throw new ValidationException('chatAIOptions.temperature must be a number')
    }

    if (isDefined(data.chatAIOptions.topP) && !isNumber(data.chatAIOptions.topP)) {
      throw new ValidationException('chatAIOptions.topP must be a number')
    }

    if (
      isDefined(data.chatAIOptions.frequencyPenalty) &&
      !isNumber(data.chatAIOptions.frequencyPenalty)
    ) {
      throw new ValidationException('chatAIOptions.frequencyPenalty must be a number')
    }

    if (
      isDefined(data.chatAIOptions.presencePenalty) &&
      !isNumber(data.chatAIOptions.presencePenalty)
    ) {
      throw new ValidationException('chatAIOptions.presencePenalty must be a number')
    }

    if (isDefined(data.chatAIOptions.maxRetries) && !isNumber(data.chatAIOptions.maxRetries)) {
      throw new ValidationException('chatAIOptions.maxRetries must be a number')
    }

    if (!isDefined(data.chatAIOptions.chatTypeId)) {
      throw new ValidationException('chatAIOptions.chatTypeId is required')
    }

    if (!isString(data.chatAIOptions.chatTypeId)) {
      throw new ValidationException('chatAIOptions.chatTypeId must be a string')
    }

    if (!isDefined(data.chatAIOptions.prompt) || !isString(data.chatAIOptions.prompt)) {
      throw new ValidationException('chatAIOptions.prompt is required and must be a string')
    }

    if (!data.chatAIOptions.prompt.trim()) {
      throw new ValidationException('chatAIOptions.prompt must not be empty or whitespace-only')
    }

    return new RagDto(
      data.id,
      data.documents.map((doc) => ({ title: doc.title, source: doc.source })),
      validatedEmbeddingModels,
      {
        chunkSize: data.vectorEmbeddings.chunkSize,
        chunkOverlap: data.vectorEmbeddings.chunkOverlap,
      },
      {
        chatTypeId: data.chatAIOptions.chatTypeId,
        prompt: data.chatAIOptions.prompt.trim(),
        maxTokens: data.chatAIOptions.maxTokens ?? undefined,
        temperature: data.chatAIOptions.temperature ?? undefined,
        topP: data.chatAIOptions.topP ?? undefined,
        frequencyPenalty: data.chatAIOptions.frequencyPenalty ?? undefined,
        presencePenalty: data.chatAIOptions.presencePenalty ?? undefined,
        stopSequences: data.chatAIOptions.stopSequences ?? undefined,
        maxRetries: data.chatAIOptions.maxRetries ?? undefined,
      }
    )
  }
}
