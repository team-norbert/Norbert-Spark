import { z } from 'zod'
// TODO: import the actual OpenAPI-generated types, and ensure these Zod schemas stay in sync with them.

// ── Shared ────────────────────────────────────────────────────────────────────

const DimensionSchema = z.union([
  z.literal(3072),
  z.literal(1536),
  z.literal(1024),
  z.literal(768),
  z.literal(384),
])

// ── Request ───────────────────────────────────────────────────────────────────

const ModelProviderSchema = z.enum(['openai', 'google', 'cohere', 'amazon', 'voyage', 'mistral'])

const TaskTypeSchema = z.enum([
  'RETRIEVAL_QUERY',
  'RETRIEVAL_DOCUMENT',
  'SEMANTIC_SIMILARITY',
  'CLASSIFICATION',
  'CLUSTERING',
])

/**
 * Google embedding model names that require a `taskType` per the OpenAPI schema.
 */
const GOOGLE_TASK_TYPE_MODELS = [
  'text-embedding-005',
  'text-multilingual-embedding-002',
  'gemini-embedding-001',
] as const

function isGoogleTaskTypeModel(name: string): boolean {
  return (GOOGLE_TASK_TYPE_MODELS as readonly string[]).includes(name)
}

/**
 * Embedding models sub-schema.
 * Either an existing model is referenced by ID, or a new one is defined
 * by name, provider, dimension and release year — matching the OpenAPI
 * `oneOf` constraint with `additionalProperties: false` on each branch.
 *
 * `taskType` is conditionally required when `modelProvider` is `'google'`
 * and `modelName` is one of the Google models listed in the OpenAPI schema.
 */
const EmbeddingModelsRequestSchema = z.union([
  z.object({ existingModelId: z.uuid() }).strict(),
  z
    .object({
      modelName: z.string(),
      modelProvider: ModelProviderSchema,
      dimension: DimensionSchema,
      releaseYear: z
        .number()
        .int()
        .min(2000)
        .max(new Date().getFullYear() + 1),
      recommendedUsage: z.string().min(1),
      taskType: TaskTypeSchema.optional(),
    })
    .strict()
    .superRefine((data, ctx) => {
      if (
        data.modelProvider === 'google' &&
        isGoogleTaskTypeModel(data.modelName) &&
        data.taskType === undefined
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'taskType is required for this Google embedding model',
          path: ['taskType'],
        })
      }
    }),
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
      checksum: z.string(),
      createdAt: z.iso.datetime(),
      updatedAt: z.iso.datetime(),
    }),
    embeddingModels: z.object({
      id: z.uuid(),
      modelName: z.string(),
      modelProvider: ModelProviderSchema,
      status: z.string(),
      recommendedUsage: z.string(),
      releaseYear: z.number(),
      dimension: DimensionSchema,
      taskType: TaskTypeSchema.optional(),
      createdAt: z.iso.datetime(),
      updatedAt: z.iso.datetime(),
    }),
    vectorEmbeddings: z.object({
      id: z.uuid(),
      chunkSize: z.number(),
      chunkOverlap: z.number(),
      createdAt: z.iso.datetime(),
      updatedAt: z.iso.datetime(),
    }),
    chatAIOptions: z.object({
      id: z.uuid(),
      maxTokens: z.number().int().optional(),
      temperature: z.number().optional(),
      topP: z.number().optional(),
      frequencyPenalty: z.number().optional(),
      presencePenalty: z.number().optional(),
      stopSequences: z.array(z.string()).optional(),
      maxRetries: z.number().int().optional(),
      createdAt: z.iso.datetime(),
      updatedAt: z.iso.datetime(),
    }),
  }),
})

export type CreateVectorStoreResponse = z.infer<typeof CreateVectorStoreResponseSchema>
