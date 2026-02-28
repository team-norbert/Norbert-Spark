import { describe, expect, it } from 'vitest'

import {
  type EmbeddingModel,
  EmbeddingModelSchema,
  type EmbeddingModelsResponse,
  EmbeddingModelsResponseSchema,
  type EnrichedEmbeddingModel,
} from '@/domain/ai/embedding-models.js'

// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

const VALID_MODEL: EmbeddingModel = {
  id: '01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d0e',
  name: 'text-embedding-3-large',
  provider: 'openai',
  dimension: 3072,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
}

// ---------------------------------------------------------------------------
// EmbeddingModelSchema
// ---------------------------------------------------------------------------

describe('EmbeddingModelSchema', () => {
  describe('Valid Data', () => {
    it('should validate a correct EmbeddingModel object', () => {
      const result = EmbeddingModelSchema.safeParse(VALID_MODEL)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(VALID_MODEL)
    })

    it('should accept dimension 3072', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, dimension: 3072 })
      expect(result.success).toBe(true)
      expect(result.data?.dimension).toBe(3072)
    })

    it('should accept dimension 1536', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, dimension: 1536 })
      expect(result.success).toBe(true)
      expect(result.data?.dimension).toBe(1536)
    })

    it('should accept dimension 1024', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, dimension: 1024 })
      expect(result.success).toBe(true)
      expect(result.data?.dimension).toBe(1024)
    })

    it('should accept dimension 768', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, dimension: 768 })
      expect(result.success).toBe(true)
      expect(result.data?.dimension).toBe(768)
    })

    it('should accept dimension 384', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, dimension: 384 })
      expect(result.success).toBe(true)
      expect(result.data?.dimension).toBe(384)
    })

    it('should validate model with different provider', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, provider: 'ollama' })
      expect(result.success).toBe(true)
      expect(result.data?.provider).toBe('ollama')
    })

    it('should validate model with cohere provider', () => {
      const result = EmbeddingModelSchema.safeParse({
        ...VALID_MODEL,
        provider: 'cohere',
        name: 'embed-english-v3.0',
        dimension: 1024,
      })
      expect(result.success).toBe(true)
    })

    it('should validate model with different valid UUID', () => {
      const result = EmbeddingModelSchema.safeParse({
        ...VALID_MODEL,
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      })
      expect(result.success).toBe(true)
    })

    it('should validate model with updatedAt later than createdAt', () => {
      const result = EmbeddingModelSchema.safeParse({
        ...VALID_MODEL,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-06-30T23:59:59Z',
      })
      expect(result.success).toBe(true)
    })

    it('should validate model with timestamps including milliseconds', () => {
      const result = EmbeddingModelSchema.safeParse({
        ...VALID_MODEL,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.123Z',
      })
      expect(result.success).toBe(true)
    })

    it('should preserve all field values exactly', () => {
      const result = EmbeddingModelSchema.safeParse(VALID_MODEL)
      expect(result.success).toBe(true)
      expect(result.data?.id).toBe(VALID_MODEL.id)
      expect(result.data?.name).toBe(VALID_MODEL.name)
      expect(result.data?.provider).toBe(VALID_MODEL.provider)
      expect(result.data?.dimension).toBe(VALID_MODEL.dimension)
      expect(result.data?.createdAt).toBe(VALID_MODEL.createdAt)
      expect(result.data?.updatedAt).toBe(VALID_MODEL.updatedAt)
    })
  })

  describe('Invalid Data - Missing Fields', () => {
    it('should fail validation when id is missing', () => {
      const { id: _id, ...rest } = VALID_MODEL
      const result = EmbeddingModelSchema.safeParse(rest)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('id')
    })

    it('should fail validation when name is missing', () => {
      const { name: _name, ...rest } = VALID_MODEL
      const result = EmbeddingModelSchema.safeParse(rest)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('name')
    })

    it('should fail validation when provider is missing', () => {
      const { provider: _provider, ...rest } = VALID_MODEL
      const result = EmbeddingModelSchema.safeParse(rest)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('provider')
    })

    it('should fail validation when dimension is missing', () => {
      const { dimension: _dimension, ...rest } = VALID_MODEL
      const result = EmbeddingModelSchema.safeParse(rest)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('dimension')
    })

    it('should fail validation when createdAt is missing', () => {
      const { createdAt: _createdAt, ...rest } = VALID_MODEL
      const result = EmbeddingModelSchema.safeParse(rest)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('createdAt')
    })

    it('should fail validation when updatedAt is missing', () => {
      const { updatedAt: _updatedAt, ...rest } = VALID_MODEL
      const result = EmbeddingModelSchema.safeParse(rest)
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('updatedAt')
    })

    it('should fail validation when object is empty', () => {
      const result = EmbeddingModelSchema.safeParse({})
      expect(result.success).toBe(false)
      expect(result.error?.issues?.length).toBeGreaterThan(0)
    })

    it('should fail validation when input is null', () => {
      const result = EmbeddingModelSchema.safeParse(null)
      expect(result.success).toBe(false)
    })

    it('should fail validation when input is undefined', () => {
      const result = EmbeddingModelSchema.safeParse(undefined)
      expect(result.success).toBe(false)
    })
  })

  describe('Invalid Data - Invalid Field Types', () => {
    it('should fail validation when id is not a valid UUID', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, id: 'not-a-uuid' })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('id')
    })

    it('should fail validation when id is a number', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, id: 123 })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('id')
    })

    it('should fail validation when name is a number', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, name: 42 })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('name')
    })

    it('should fail validation when provider is a number', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, provider: 99 })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('provider')
    })

    it('should fail validation when dimension is not an allowed value', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, dimension: 512 })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('dimension')
    })

    it('should fail validation when dimension is 0', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, dimension: 0 })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('dimension')
    })

    it('should fail validation when dimension is a string representation of an allowed value', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, dimension: '3072' })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('dimension')
    })

    it('should fail validation when dimension is a float', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, dimension: 3072.5 })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('dimension')
    })

    it('should fail validation when dimension is a large out-of-range number', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, dimension: 4096 })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('dimension')
    })

    it('should fail validation when createdAt is not a valid datetime', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, createdAt: 'invalid-date' })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('createdAt')
    })

    it('should fail validation when createdAt is a date-only string', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, createdAt: '2024-01-15' })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('createdAt')
    })

    it('should fail validation when updatedAt is not a valid datetime', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, updatedAt: '2024-99-99' })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('updatedAt')
    })

    it('should fail validation when updatedAt is a number timestamp', () => {
      const result = EmbeddingModelSchema.safeParse({ ...VALID_MODEL, updatedAt: 1705312200000 })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('updatedAt')
    })
  })
})

// ---------------------------------------------------------------------------
// EmbeddingModelsResponseSchema
// ---------------------------------------------------------------------------

describe('EmbeddingModelsResponseSchema', () => {
  describe('Valid Data', () => {
    it('should validate a correct EmbeddingModelsResponse', () => {
      const mockResponse: EmbeddingModelsResponse = {
        success: true,
        data: [VALID_MODEL],
      }
      const result = EmbeddingModelsResponseSchema.safeParse(mockResponse)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
    })

    it('should validate response with empty data array', () => {
      const result = EmbeddingModelsResponseSchema.safeParse({ success: true, data: [] })
      expect(result.success).toBe(true)
      expect(result.data?.data).toHaveLength(0)
    })

    it('should validate response with success set to false', () => {
      const result = EmbeddingModelsResponseSchema.safeParse({ success: false, data: [] })
      expect(result.success).toBe(true)
      expect(result.data?.success).toBe(false)
    })

    it('should validate response with multiple models', () => {
      const mockResponse: EmbeddingModelsResponse = {
        success: true,
        data: [
          VALID_MODEL,
          { ...VALID_MODEL, id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', dimension: 384 },
          {
            ...VALID_MODEL,
            id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
            provider: 'ollama',
            dimension: 768,
          },
        ],
      }
      const result = EmbeddingModelsResponseSchema.safeParse(mockResponse)
      expect(result.success).toBe(true)
      expect(result.data?.data).toHaveLength(3)
    })

    it('should validate response with all five dimension types present', () => {
      const dimensions = [3072, 1536, 1024, 768, 384] as const
      const mockResponse: EmbeddingModelsResponse = {
        success: true,
        data: dimensions.map((dimension, i) => ({
          ...VALID_MODEL,
          id: `01942f8e-67a3-7b2c-9d4e-5f6a7b8c9d${String(i).padStart(2, '0')}`,
          dimension,
        })),
      }
      const result = EmbeddingModelsResponseSchema.safeParse(mockResponse)
      expect(result.success).toBe(true)
      expect(result.data?.data.map((m) => m.dimension)).toEqual(dimensions)
    })
  })

  describe('Invalid Data - Missing Fields', () => {
    it('should fail validation when success is missing', () => {
      const result = EmbeddingModelsResponseSchema.safeParse({ data: [VALID_MODEL] })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('success')
    })

    it('should fail validation when data is missing', () => {
      const result = EmbeddingModelsResponseSchema.safeParse({ success: true })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('data')
    })

    it('should fail validation when object is empty', () => {
      const result = EmbeddingModelsResponseSchema.safeParse({})
      expect(result.success).toBe(false)
      expect(result.error?.issues?.length).toBeGreaterThan(0)
    })

    it('should fail validation when input is null', () => {
      const result = EmbeddingModelsResponseSchema.safeParse(null)
      expect(result.success).toBe(false)
    })
  })

  describe('Invalid Data - Invalid Field Types', () => {
    it('should fail validation when success is a string', () => {
      const result = EmbeddingModelsResponseSchema.safeParse({
        success: 'true',
        data: [],
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('success')
    })

    it('should fail validation when success is a number', () => {
      const result = EmbeddingModelsResponseSchema.safeParse({
        success: 1,
        data: [],
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('success')
    })

    it('should fail validation when data is not an array', () => {
      const result = EmbeddingModelsResponseSchema.safeParse({
        success: true,
        data: 'not-an-array',
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('data')
    })

    it('should fail validation when data contains an item with an invalid dimension', () => {
      const result = EmbeddingModelsResponseSchema.safeParse({
        success: true,
        data: [{ ...VALID_MODEL, dimension: 999 }],
      })
      expect(result.success).toBe(false)
      expect(result.error?.issues?.[0]?.path).toContain('data')
    })

    it('should fail validation when data contains an item with a missing field', () => {
      const { dimension: _dimension, ...modelWithoutDimension } = VALID_MODEL
      const result = EmbeddingModelsResponseSchema.safeParse({
        success: true,
        data: [modelWithoutDimension],
      })
      expect(result.success).toBe(false)
    })

    it('should fail validation when data contains an item with an invalid UUID', () => {
      const result = EmbeddingModelsResponseSchema.safeParse({
        success: true,
        data: [{ ...VALID_MODEL, id: 'not-a-valid-uuid' }],
      })
      expect(result.success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// EnrichedEmbeddingModel type — runtime shape validation
// ---------------------------------------------------------------------------

describe('EnrichedEmbeddingModel', () => {
  it('should be assignable from a plain EmbeddingModel (all meta fields optional)', () => {
    // EnrichedEmbeddingModel = EmbeddingModel & Partial<EmbeddingModelMeta>
    // A plain EmbeddingModel must satisfy the enriched type without meta fields
    const enriched: EnrichedEmbeddingModel = { ...VALID_MODEL }
    expect(enriched.id).toBe(VALID_MODEL.id)
    expect(enriched.status).toBeUndefined()
    expect(enriched.release_year).toBeUndefined()
    expect(enriched.recommended_usage).toBeUndefined()
  })

  it('should hold all EmbeddingModelMeta fields when provided', () => {
    const enriched: EnrichedEmbeddingModel = {
      ...VALID_MODEL,
      status: 'current',
      release_year: 2024,
      recommended_usage: 'General-purpose semantic search',
    }
    expect(enriched.status).toBe('current')
    expect(enriched.release_year).toBe(2024)
    expect(enriched.recommended_usage).toBe('General-purpose semantic search')
  })

  it('should hold status "legacy" when provided', () => {
    const enriched: EnrichedEmbeddingModel = {
      ...VALID_MODEL,
      status: 'legacy',
      release_year: 2022,
      recommended_usage: 'Backwards-compatible workloads',
    }
    expect(enriched.status).toBe('legacy')
  })

  it('should allow partial meta — only release_year provided', () => {
    const enriched: EnrichedEmbeddingModel = {
      ...VALID_MODEL,
      release_year: 2023,
    }
    expect(enriched.release_year).toBe(2023)
    expect(enriched.status).toBeUndefined()
    expect(enriched.recommended_usage).toBeUndefined()
  })

  it('should preserve all base EmbeddingModel fields alongside meta', () => {
    const enriched: EnrichedEmbeddingModel = {
      ...VALID_MODEL,
      status: 'current',
      release_year: 2024,
      recommended_usage: 'High-accuracy embeddings',
    }
    expect(enriched.id).toBe(VALID_MODEL.id)
    expect(enriched.name).toBe(VALID_MODEL.name)
    expect(enriched.provider).toBe(VALID_MODEL.provider)
    expect(enriched.dimension).toBe(VALID_MODEL.dimension)
    expect(enriched.createdAt).toBe(VALID_MODEL.createdAt)
    expect(enriched.updatedAt).toBe(VALID_MODEL.updatedAt)
  })
})
