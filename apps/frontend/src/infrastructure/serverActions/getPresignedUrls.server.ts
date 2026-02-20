'use server'

import { createLogger } from '@/infrastructure/logging/logger.js'
import { getAuthToken } from '@/lib/auth/auth.js'

import { backendRequest } from './baseServerAction.js'

const logger = createLogger({ prefix: 'getPresignedUrls' })

/**
 * File metadata for requesting presigned URLs
 */
export interface FileMetadata {
  filename: string
  mimetype: string
}

/**
 * Presigned URL response for a single file
 */
export interface PresignedUploadUrl {
  filename: string
  uploadUrl: string
  fileKey: string
}

/**
 * Response from the presigned URLs endpoint
 */
export interface PresignedUrlsResponse {
  success: boolean
  data?: {
    uploadUrls: PresignedUploadUrl[]
  }
  message?: string
  error?: string
  sessionExpired?: boolean
}

/**
 * Server action to get presigned URLs for direct R2 upload.
 *
 * This action sends file metadata to the backend, which generates
 * presigned URLs for direct upload to Cloudflare R2 storage.
 * The frontend can then use these URLs to upload files directly
 * without going through the backend.
 *
 * @param files - Array of file metadata (filename and mimetype)
 * @returns Promise with presigned URLs or error
 *
 * @example
 * ```tsx
 * const result = await getPresignedUrls([
 *   { filename: 'document.pdf', mimetype: 'application/pdf' },
 *   { filename: 'archive.zip', mimetype: 'application/zip' }
 * ])
 *
 * if (result.success && result.data) {
 *   for (const { uploadUrl, filename } of result.data.uploadUrls) {
 *     await fetch(uploadUrl, { method: 'PUT', body: fileBlob })
 *   }
 * }
 * ```
 */
export async function getPresignedUrls(files: FileMetadata[]): Promise<PresignedUrlsResponse> {
  try {
    // Get the JWT token for backend requests
    const accessToken = await getAuthToken()

    if (!accessToken) {
      logger.warn('No access token available for presigned URL request')
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    if (!files || files.length === 0) {
      return {
        success: false,
        error: 'No files provided',
      }
    }

    // Validate file metadata
    for (const file of files) {
      if (!file.filename || !file.mimetype) {
        return {
          success: false,
          error: 'Each file must have filename and mimetype',
        }
      }
    }

    logger.info('Requesting presigned URLs', {
      fileCount: files.length,
      files: files.map((f) => ({ filename: f.filename, mimetype: f.mimetype })),
    })

    const response = await backendRequest<PresignedUrlsResponse>({
      method: 'POST',
      endpoint: '/ai/presigned-urls',
      body: { files },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeoutMs: 30000, // 30 seconds for presigned URL generation
      redirectOn401: false, // Don't redirect on 401, let the client handle auth errors
    })

    logger.info('Presigned URLs received', {
      success: response.success,
      urlCount: response.data?.uploadUrls?.length ?? 0,
    })

    return response
  } catch (error) {
    // Check if this is a 401 Unauthorized error (JWT expired)
    const err = error as Error & { status?: number }
    if (err.status === 401) {
      logger.warn('JWT expired or unauthorized in getPresignedUrls')
      return {
        success: false,
        error: 'Session expired. Please sign in again.',
        sessionExpired: true,
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to get presigned URLs'
    logger.error('Error getting presigned URLs', { error: errorMessage })

    return {
      success: false,
      error: errorMessage,
    }
  }
}
