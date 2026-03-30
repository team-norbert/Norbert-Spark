import 'server-only'

import type {
  CreateVectorStoreRequest,
  CreateVectorStoreResponse,
} from '@/domain/ai/vector-store.js'
import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'
import { getAuthToken } from '@/lib/auth/auth.js'

export async function createVectorStoreInternal(
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
