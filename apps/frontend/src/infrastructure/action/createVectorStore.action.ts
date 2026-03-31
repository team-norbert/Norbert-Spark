'use server'

import type {
  CreateVectorStoreRequest,
  CreateVectorStoreResponse,
} from '@/domain/ai/vector-store.js'

import { createVectorStoreInternal } from '../data/createVectorStore.data.js'

export async function createVectorStoreAction(
  payload: CreateVectorStoreRequest
): Promise<CreateVectorStoreResponse> {
  return createVectorStoreInternal(payload)
}
