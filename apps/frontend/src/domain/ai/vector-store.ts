import { z } from 'zod'

// ── Shared ────────────────────────────────────────────────────────────────────

const DimensionSchema = z.union([
  z.literal(3072),
  z.literal(1536),
  z.literal(1024),
  z.literal(768),
  z.literal(384),
])

// ── Request ───────────────────────────────────────────────────────────────────

/**
 * Embedding models sub-schema.
 * Either an existing model is referenced by ID, or a new one is defined by name,
 * provider and dimension — matching the OpenAPI `anyOf` constraint.
 */
const EmbeddingModelsRequestSchema = z.union([
  z.object({ existingModelId: z.uuid() }).strict(),
  z
    .object({
      modelName: z.string(),
      modelProvider: z.string(),
      dimension: DimensionSchema,
    })
    .strict(),
])

/**
 * Zod schema for the POST /ai/create-vector-store request body.
 * Mirrors the OpenAPI `CreateVectorStoreRequest` schema.
 */
export const CreateVectorStoreRequestSchema = z.object({
  id: z.uuid(),
  documents: z
    .array(
      z.object({
        title: z.string(),
        source: z.string(),
      })
    )
    .min(1),
  embeddingModels: EmbeddingModelsRequestSchema,
  vectorEmbeddings: z.object({
    distanceMetric: z.enum(['cosine', 'euclidean', 'dot_product']),
    chunkSize: z.number().int().min(1).max(10000),
    chunkOverlap: z.number().int().min(0).max(1000),
  }),
  chatAIOptions: z.object({
    chatTypeId: z.uuid(),
    maxTokens: z.number().int().min(1).max(100000).optional(),
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional(),
    stopSequences: z.array(z.string()).optional(),
    seed: z.number().int().min(0).max(1000000).optional(),
    maxRetries: z.number().int().min(0).max(10).optional(),
  }),
})

export type CreateVectorStoreRequest = z.infer<typeof CreateVectorStoreRequestSchema>

/** Convenience alias for a single document entry in the request */
export type VectorStoreDocumentEntry = CreateVectorStoreRequest['documents'][number]

// ── Response ──────────────────────────────────────────────────────────────────

/**
 * Zod schema for the POST /ai/create-vector-store 201 response body.
 * Mirrors the OpenAPI `CreateVectorStoreResponse` schema.
 */
export const CreateVectorStoreResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    documents: z.object({
      id: z.uuid(),
      title: z.string(),
      source: z.string(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    }),
    embeddingModels: z.object({
      id: z.uuid(),
      modelName: z.string(),
      modelProvider: z.string(),
      dimension: DimensionSchema,
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    }),
    vectorEmbeddings: z.object({
      id: z.uuid(),
      distanceMetric: z.enum(['cosine', 'euclidean', 'dot_product']),
      chunkSize: z.number().int(),
      chunkOverlap: z.number().int(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    }),
    chatAIOptions: z.object({
      id: z.uuid(),
      maxTokens: z.number().int().optional(),
      temperature: z.number().optional(),
      topP: z.number().optional(),
      frequencyPenalty: z.number().optional(),
      presencePenalty: z.number().optional(),
      stopSequences: z.array(z.string()).optional(),
      seed: z.number().int().optional(),
      maxRetries: z.number().int().optional(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    }),
  }),
})

export type CreateVectorStoreResponse = z.infer<typeof CreateVectorStoreResponseSchema>
