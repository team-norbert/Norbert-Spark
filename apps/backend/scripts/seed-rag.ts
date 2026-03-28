#!/usr/bin/env tsx
/**
 * Seed script to populate the embedding_models table with well-known AI embedding model data.
 *
 * Usage:
 *   pnpm seed:rag
 *
 * This seeds all 16 models defined in embedding_models.json, covering providers:
 *   OpenAI, Google, Cohere, Amazon, Voyage, Mistral, Jina, Nomic
 *
 * The script is idempotent: re-running it will skip models that already exist
 * (matched by the unique constraint on name + provider + dimension).
 *
 * Supported dimensions: 3072, 1536, 1024, 768, 384
 * Each dimension corresponds to a dedicated vector_embeddings_<dim> table for RAG queries.
 */

import { existsSync, mkdirSync } from 'node:fs'
import { copyFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { db } from '../src/infrastructure/database/index.js'
import { embeddingModels } from '../src/infrastructure/database/schema.js'
import rawData from './embedding_models.json' with { type: 'json' }

type EmbeddingDimension = 384 | 768 | 1024 | 1536 | 3072

const VALID_DIMENSIONS = new Set<number>([3072, 1536, 1024, 768, 384])

const models = rawData.embedding_models

// Validate that all models in the JSON have supported dimension values
const invalidModels = models.filter((m) => !VALID_DIMENSIONS.has(Number(m.dimension)))
if (invalidModels.length > 0) {
  console.error('❌ The following models have unsupported dimensions and cannot be seeded:')
  invalidModels.forEach((m) => {
    console.error(`   - ${m.provider}/${m.name} (dimension: ${m.dimension})`)
  })
  console.error(`   Supported dimensions: ${[...VALID_DIMENSIONS].join(', ')}`)
  process.exit(1)
}

const rows = models.map((m) => ({
  name: m.name,
  provider: m.provider,
  status: m.status,
  releaseYear: Number(m.release_year),
  recommendedUsage: m.recommended_usage,
  taskType: 'task_type' in m ? (m as { task_type?: string }).task_type ?? null : null,
  dimension: Number(m.dimension) as EmbeddingDimension,
}))

console.log(`🌱 Seeding ${rows.length} embedding models…`)

const inserted = await db.insert(embeddingModels).values(rows).onConflictDoNothing().returning({
  id: embeddingModels.id,
  name: embeddingModels.name,
  provider: embeddingModels.provider,
})

if (inserted.length === 0) {
  console.log('ℹ️  All models already exist — nothing to insert.')
} else {
  console.log(`✅ Inserted ${inserted.length} new model(s):`)
  inserted.forEach((r) => {
    console.log(`   + [${r.provider}] ${r.name}`)
  })
}

const skipped = rows.length - inserted.length
if (skipped > 0) {
  console.log(`⏭️  Skipped ${skipped} model(s) that already existed.`)
}

// Copy embedding_models.json to apps/frontend/src/assets
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const sourceFile = join(__dirname, 'embedding_models.json')
const targetDir = join(__dirname, '..', '..', 'frontend', 'src', 'assets')
const targetFile = join(targetDir, 'embedding_models.json')

if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true })
  console.log(`📁 Created directory: apps/frontend/src/assets`)
}

await copyFile(sourceFile, targetFile)
console.log(`📋 Copied embedding_models.json to apps/frontend/src/assets/`)

const total = await db.$count(embeddingModels)
console.log(`📊 Total embedding_models rows: ${total}`)

process.exit(0)
