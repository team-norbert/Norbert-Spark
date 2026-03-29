import { z } from 'zod'
// TODO: import the actual OpenAPI-generated types, and ensure these Zod schemas stay in sync with them.

/**
 * Schema for a single AI Embedding Model
 * Matches the backend AIEmbeddingModels OpenAPI schema
 */
export const EmbeddingModelSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  provider: z.string(),
  dimension: z.union([
    z.literal(3072),
    z.literal(1536),
    z.literal(1024),
    z.literal(768),
    z.literal(384),
  ]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type EmbeddingModel = z.infer<typeof EmbeddingModelSchema>

/**
 * Additional metadata sourced from the local embedding_models.json asset.
 * Merged onto API records that match by name + provider.
 */
export interface EmbeddingModelMeta {
  status: 'current' | 'legacy'
  release_year: number
  recommended_usage: string
}

/**
 * An API embedding model record enriched with local metadata.
 * Fields from EmbeddingModelMeta are optional — the merge is best-effort;
 * a model returned by the API that has no matching JSON entry will still work.
 */
export type EnrichedEmbeddingModel = EmbeddingModel & Partial<EmbeddingModelMeta>

/**
 * Schema for the GET /ai/embedding-models API response
 */
export const EmbeddingModelsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(EmbeddingModelSchema),
})

export type EmbeddingModelsResponse = z.infer<typeof EmbeddingModelsResponseSchema>
