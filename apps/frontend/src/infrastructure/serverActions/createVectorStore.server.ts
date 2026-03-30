import 'server-only'

import type {
  CreateVectorStoreRequest,
  CreateVectorStoreResponse,
} from '@/domain/ai/vector-store.js'
import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'
import { getAuthToken } from '@/lib/auth/auth.js'

/**
 * Server Action to create a new vector store.
 *
 * Sends a POST request to the backend /ai/create-vector-store endpoint with the
 * full vector store configuration collected from the CreateVectorStoreForm.
 *
 * A valid bearer token is required. On 401 the base request layer will
 * transparently attempt a token refresh before redirecting to sign-in.
 *
 * @param {CreateVectorStoreRequest} payload - The complete vector store configuration
 * @returns {Promise<CreateVectorStoreResponse>} The created vector store data
 * @throws {Error} If the request fails or the user is not authenticated
 *
 * @example
 * ```typescript
 * const result = await createVectorStoreAction({
 *   id: 'uuid',
 *   documents: [{ title: 'My Doc', source: 'rag/uuid/doc.pdf' }],
 *   embeddingModels: { existingModelId: 'model-uuid' },
 *   vectorEmbeddings: { distanceMetric: 'cosine', chunkSize: 300, chunkOverlap: 40 },
 *   chatAIOptions: { chatTypeId: 'chat-type-uuid' },
 * })
 * ```
 */
export async function createVectorStoreAction(
  payload: CreateVectorStoreRequest
): Promise<CreateVectorStoreResponse> {
  const token = await getAuthToken()
  if (!token) {
    throw new Error('No authentication token available')
  }

  return backendRequest<CreateVectorStoreResponse>({
    method: 'POST',
    endpoint: '/ai/create-vector-store',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  })
}
