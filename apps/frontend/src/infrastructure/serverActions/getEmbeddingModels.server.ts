'use server'

import type { EmbeddingModelsResponse } from '@/domain/ai/embedding-models.js'
import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'
import { getAuthToken } from '@/lib/auth/auth.js'

/**
 * Server Action to fetch all available AI embedding models.
 *
 * Calls GET /ai/embedding-models on the backend. Requires a valid bearer token
 * and a user with 'admin' or 'moderator' role.
 *
 * @returns Promise resolving to the embedding models response
 * @throws {Error} If the request fails or the user is not authenticated/authorised
 *
 * @example
 * ```typescript
 * const response = await getEmbeddingModels()
 * console.log(response.data) // EmbeddingModel[]
 * ```
 */
export async function getEmbeddingModels(): Promise<EmbeddingModelsResponse> {
  const token = await getAuthToken()
  if (!token) {
    throw new Error('No authentication token available')
  }

  return backendRequest<EmbeddingModelsResponse>({
    method: 'GET',
    endpoint: '/ai/embedding-models',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
