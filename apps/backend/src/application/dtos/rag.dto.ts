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

    const hasExistingModel =
      isString(data.embeddingModels.existingModelId) &&
      data.embeddingModels.existingModelId.trim() !== ''

    if (!hasExistingModel) {
      if (!isString(data.embeddingModels.modelName)) {
        throw new ValidationException('embeddingModels.modelName is required and must be a string')
      }

      if (!isNumber(data.embeddingModels.dimension)) {
        throw new ValidationException('embeddingModels.dimension is required and must be a number')
      }

      const VALID_DIMENSIONS = [1536, 768, 384, 3072, 1024] as const
      type ValidDimension = (typeof VALID_DIMENSIONS)[number]
      if (!VALID_DIMENSIONS.includes(data.embeddingModels.dimension as ValidDimension)) {
        throw new ValidationException(
          'embeddingModels.dimension must be either 1536, 768, 384, 3072, or 1024'
        )
      }

      if (!isString(data.embeddingModels.modelProvider)) {
        throw new ValidationException(
          'embeddingModels.modelProvider is required and must be a string'
        )
      }

      const VALID_PROVIDERS = ['openai', 'google', 'cohere', 'amazon', 'voyage', 'mistral'] as const
      type ValidProvider = (typeof VALID_PROVIDERS)[number]
      if (!VALID_PROVIDERS.includes(data.embeddingModels.modelProvider as ValidProvider)) {
        throw new ValidationException(
          'embeddingModels.modelProvider must be one of: openai, google, cohere, amazon, voyage, mistral'
        )
      }

      if (!isDefined(data.embeddingModels.releaseYear)) {
        throw new ValidationException(
          'embeddingModels.releaseYear is required and must be a number'
        )
      }

      if (
        !isNumber(data.embeddingModels.releaseYear) ||
        !Number.isInteger(data.embeddingModels.releaseYear)
      ) {
        throw new ValidationException('embeddingModels.releaseYear must be an integer')
      }

      if (data.embeddingModels.releaseYear < 2000 || data.embeddingModels.releaseYear > 2027) {
        throw new ValidationException('embeddingModels.releaseYear must be between 2000 and 2027')
      }

      const GOOGLE_TASK_TYPE_REQUIRED_MODELS = [
        'text-embedding-004',
        'text-multilingual-embedding-002',
      ] as const
      const requiresTaskType =
        data.embeddingModels.modelProvider === 'google' &&
        GOOGLE_TASK_TYPE_REQUIRED_MODELS.includes(
          data.embeddingModels.modelName as (typeof GOOGLE_TASK_TYPE_REQUIRED_MODELS)[number]
        )

      if (requiresTaskType && !isDefined(data.embeddingModels.taskType)) {
        throw new ValidationException(
          'embeddingModels.taskType is required for google models text-embedding-004 and text-multilingual-embedding-002'
        )
      }

      if (isDefined(data.embeddingModels.taskType)) {
        const VALID_TASK_TYPES = [
          'RETRIEVAL_QUERY',
          'RETRIEVAL_DOCUMENT',
          'SEMANTIC_SIMILARITY',
          'CLASSIFICATION',
          'CLUSTERING',
        ] as const
        type ValidTaskType = (typeof VALID_TASK_TYPES)[number]
        if (!isString(data.embeddingModels.taskType)) {
          throw new ValidationException('embeddingModels.taskType must be a string')
        }
        if (!VALID_TASK_TYPES.includes(data.embeddingModels.taskType as ValidTaskType)) {
          throw new ValidationException(
            'embeddingModels.taskType must be one of: RETRIEVAL_QUERY, RETRIEVAL_DOCUMENT, SEMANTIC_SIMILARITY, CLASSIFICATION, CLUSTERING'
          )
        }
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

    return new RagDto(
      data.id,
      data.documents.map((doc) => ({ title: doc.title, source: doc.source })),
      hasExistingModel
        ? ({
            existingModelId: data.embeddingModels.existingModelId as string,
          } as RagDto['embeddingModels'])
        : ({
            modelName: data.embeddingModels.modelName as string,
            modelProvider: data.embeddingModels.modelProvider as string,
            dimension: data.embeddingModels.dimension as 1536 | 768 | 384 | 3072 | 1024,
            releaseYear: data.embeddingModels.releaseYear as number,
            taskType: data.embeddingModels.taskType ?? undefined,
          } as RagDto['embeddingModels']),
      {
        chunkSize: data.vectorEmbeddings.chunkSize,
        chunkOverlap: data.vectorEmbeddings.chunkOverlap,
      },
      {
        chatTypeId: data.chatAIOptions.chatTypeId,
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
