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
          modelName?: string
          modelProvider?: string
          dimension?: 1536 | 768 | 384 | 3072 | 1024
        }
      | {
          existingModelId?: string
          modelName: string
          modelProvider: string
          dimension: 1536 | 768 | 384 | 3072 | 1024
        },
    public readonly vectorEmbeddings: {
      distanceMetric: 'cosine' | 'euclidean' | 'dot_product'
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
      seed?: number
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
    }

    if (!isString(data.vectorEmbeddings.distanceMetric)) {
      throw new ValidationException(
        'vectorEmbeddings.distanceMetric is required and must be a string'
      )
    }

    if (
      data.vectorEmbeddings.distanceMetric !== 'cosine' &&
      data.vectorEmbeddings.distanceMetric !== 'euclidean' &&
      data.vectorEmbeddings.distanceMetric !== 'dot_product'
    ) {
      throw new ValidationException(
        'vectorEmbeddings.distanceMetric must be either "cosine", "euclidean", or "dot_product"'
      )
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

    if (isDefined(data.chatAIOptions.seed) && !isNumber(data.chatAIOptions.seed)) {
      throw new ValidationException('chatAIOptions.seed must be a number')
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
      {
        existingModelId: data.embeddingModels.existingModelId as string | undefined,
        modelName: data.embeddingModels.modelName as string | undefined,
        modelProvider: data.embeddingModels.modelProvider as string | undefined,
        dimension: data.embeddingModels.dimension as 1536 | 768 | 384 | 3072 | 1024 | undefined,
      } as RagDto['embeddingModels'],
      {
        distanceMetric: data.vectorEmbeddings.distanceMetric,
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
        seed: data.chatAIOptions.seed ?? undefined,
        maxRetries: data.chatAIOptions.maxRetries ?? undefined,
      }
    )
  }
}
