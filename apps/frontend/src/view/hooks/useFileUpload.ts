import type { pdfSchema } from '@norberts-spark/shared'
import { useRouter } from 'next/navigation.js'
import { signOut } from 'next-auth/react'
import type React from 'react'
import { useCallback, useState } from 'react'
import type { z } from 'zod'

import { createLogger } from '@/infrastructure/logging/logger.js'
import { extractDataByFileIdAction } from '@/infrastructure/serverActions/extractDataByFileId.server.js'
import { getPresignedUrls } from '@/infrastructure/serverActions/getPresignedUrls.server.js'
import { logoutUserAction } from '@/infrastructure/serverActions/logoutUser.server.js'

const logger = createLogger({ prefix: '[useFileUpload]' })

type ExtractedInvoiceData = z.infer<typeof pdfSchema>

export interface UploadedFile {
  file: File
  id: string
  uploadProgress?: number
}

interface UseFileUploadReturn {
  uploadedFiles: UploadedFile[]
  dragActive: boolean
  error: string | null
  isUploading: boolean
  isExtracting: boolean
  extractedData: ExtractedInvoiceData[]
  handleDrag: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: (id: string) => void
  clearAllFiles: () => void
  handleProcessFiles: () => void
  clearError: () => void
  handleNavigateHome: () => void
  handleSignOut: () => void
  showRagForm: boolean
  ragFileKeys: string[]
}

const ACCEPTED_FILE_TYPES = ['.pdf', '.zip']
const ACCEPTED_MIME_TYPES = ['application/pdf', 'application/zip', 'application/x-zip-compressed']
const MAX_RETRIES = 3
const RETRY_DELAY_BASE_MS = 1000 // Base delay for exponential backoff

/**
 * Custom hook for file upload page business logic following DDD architecture.
 * Manages file upload state, drag and drop functionality, and validation.
 *
 * @returns {UseFileUploadReturn} File upload state and handlers
 *
 * @example
 * ```tsx
 * const { uploadedFiles, handleDrop, removeFile } = useFileUpload({
 *   flow: 'rag',
 *   callbackUrl: '/dashboard',
 *   chatTypeId: 'some-chat-type-id',
 * })
 * ```
 */
export function useFileUpload({
  callbackUrl,
  chatTypeId,
  flow,
}: {
  flow: string
  callbackUrl: string
  chatTypeId?: string
}): UseFileUploadReturn {
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData[]>([])
  const [showRagForm, setShowRagForm] = useState(false)
  const [ragFileKeys, setRagFileKeys] = useState<string[]>([])

  /**
   * Validate if a file has an accepted extension or MIME type
   * @param {File} file - The file to validate
   * @returns {boolean} True if file is valid
   */
  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    const isValidExtension = ACCEPTED_FILE_TYPES.includes(extension)
    const isValidMimeType = ACCEPTED_MIME_TYPES.includes(file.type)

    return isValidExtension || isValidMimeType
  }

  /**
   * Process uploaded files and add valid ones to state
   */
  const handleFiles = useCallback((files: File[] | null) => {
    setError(null)

    if (!files || files.length === 0) return

    const validFiles: UploadedFile[] = []
    const invalidFiles: string[] = []

    Array.from(files).forEach((file) => {
      if (validateFile(file)) {
        validFiles.push({
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
        })
      } else {
        invalidFiles.push(file.name)
      }
    })

    if (invalidFiles.length > 0) {
      setError(
        `The following files were rejected (only PDF and ZIP files are allowed): ${invalidFiles.join(', ')}`
      )
    }

    if (validFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validFiles])
    }
  }, [])

  /**
   * Handle drag events for drag and drop functionality
   * @param {React.DragEvent} e - The drag event
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  /**
   * Handle file drop event
   * @param {React.DragEvent} e - The drop event
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files))
      }
    },
    [handleFiles]
  )

  /**
   * Handle file input change event
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files ? Array.from(e.target.files) : null)
    },
    [handleFiles]
  )

  /**
   * Remove a file from the uploaded files list
   * @param {string} id - The ID of the file to remove
   */
  const removeFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  /**
   * Clear all uploaded files
   */
  const clearAllFiles = useCallback(() => {
    setUploadedFiles([])
    setError(null)
  }, [])

  /**
   * Update upload progress for a specific file
   * @param {string} id - The file ID
   * @param {number} progress - Progress percentage (0-100)
   */
  const updateFileProgress = useCallback((id: string, progress: number) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, uploadProgress: progress } : f))
    )
  }, [])

  /**
   * Upload a file directly to a bucket using a presigned URL with progress tracking
   * @param {File} file - The file to upload
   * @param {string} uploadUrl - The presigned URL for upload
   * @param {string} id - The file ID for progress tracking
   * @returns {Promise<boolean>} True if upload succeeds
   */
  const uploadFileToBucket = useCallback(
    async (file: File, uploadUrl: string, id: string): Promise<boolean> => {
      let retries = 0

      while (retries < MAX_RETRIES) {
        try {
          logger.info(`Uploading ${file.name} to Bucket`, {
            event: 'file-upload.started',
            url: uploadUrl,
            size: file.size,
            type: file.type,
          })

          // Use XMLHttpRequest for progress tracking (browser API)
          const result = await new Promise<boolean>((resolve, reject) => {
            const xhr = new window.XMLHttpRequest()

            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100)
                updateFileProgress(id, progress)
              }
            })

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                logger.info(`Upload successful for ${file.name}`, {
                  event: 'file-upload.completed',
                  status: xhr.status,
                })
                updateFileProgress(id, 100)
                resolve(true)
              } else {
                logger.error(`Upload failed with status ${xhr.status}`, undefined, {
                  event: 'file-upload.failed',
                  statusCode: xhr.status,
                  statusText: xhr.statusText,
                  response: xhr.responseText,
                })
                reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`))
              }
            })

            xhr.addEventListener('error', (_event) => {
              logger.error('XHR error event fired', undefined, {
                event: 'file-upload.failed',
                filename: file.name,
                readyState: xhr.readyState,
                statusCode: xhr.status,
                statusText: xhr.statusText,
                responseURL: xhr.responseURL,
              })
              reject(new Error('Network error during upload'))
            })

            xhr.addEventListener('abort', () => {
              reject(new Error('Upload aborted'))
            })

            xhr.open('PUT', uploadUrl)
            // Don't set Content-Type - let the presigned URL handle it
            // Setting headers not included in X-Amz-SignedHeaders causes 403
            xhr.send(file)
          })

          return result
        } catch (error) {
          retries++
          logger.warn(`Upload attempt ${retries} failed for ${file.name}`, {
            event: 'file-upload.failed',
            error: error instanceof Error ? error.message : String(error),
          })

          if (retries >= MAX_RETRIES) {
            throw new Error(`Failed to upload ${file.name} after ${MAX_RETRIES} retries`, {
              cause: error,
            })
          }

          // Exponential backoff before retry
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, retries) * RETRY_DELAY_BASE_MS)
          )
        }
      }

      return false
    },
    [updateFileProgress]
  )

  /**
   * Process the uploaded files using presigned URLs for direct bucket upload
   */
  const handleProcessFiles = useCallback(async () => {
    if (uploadedFiles.length === 0 || isUploading) return

    setError(null)
    setIsUploading(true)

    try {
      // Prepare file metadata for presigned URL generation
      const backendFlowType = flow === 'rag' ? 'rag' : 'data-extraction'
      const fileMetadata = uploadedFiles.map((uf) => ({
        filename: uf.file.name,
        mimetype: uf.file.type || 'application/octet-stream',
        flow: backendFlowType,
      }))

      logger.info('Requesting presigned URLs for files', {
        event: 'file-upload.started',
        fileCount: fileMetadata.length,
      })

      // Get presigned URLs from the server action
      const response = await getPresignedUrls(fileMetadata, chatTypeId)

      // Check if session expired (JWT expired on backend)
      if (response.sessionExpired) {
        logger.warn('Session expired, redirecting to signin', { event: 'session-guard.redirect' })
        router.push(`/signin?error=session_expired&callbackUrl=${encodeURIComponent(callbackUrl)}`)
        return
      }

      if (!response.success || !response.data?.uploadUrls) {
        throw new Error(response.error || 'Failed to get presigned URLs')
      }

      const { uploadUrls } = response.data

      logger.info('Received presigned URLs', {
        event: 'file-upload.started',
        urlCount: uploadUrls.length,
      })

      // Create a map of filename to presigned URL info
      const urlMap = new Map(uploadUrls.map((u) => [u.filename, u]))

      // Upload files directly to bucket using presigned URLs
      const ragUploadedFileKeys: string[] = []
      for (const uploadedFile of uploadedFiles) {
        const urlInfo = urlMap.get(uploadedFile.file.name)

        if (!urlInfo) {
          throw new Error(`No presigned URL received for ${uploadedFile.file.name}`)
        }

        logger.info('Uploading file to Bucket', {
          event: 'file-upload.started',
          filename: uploadedFile.file.name,
          fileKey: urlInfo.fileKey,
        })

        const result = await uploadFileToBucket(
          uploadedFile.file,
          urlInfo.uploadUrl,
          uploadedFile.id
        )

        logger.info('=== UPLOAD COMPLETE ===', {
          event: 'file-upload.completed',
          filename: uploadedFile.file.name,
          fileKey: urlInfo.fileKey,
        })

        if (flow === 'extract') {
          // Clear previous extraction results
          setExtractedData([])
          setIsExtracting(true)

          try {
            logger.info('Starting extraction via server action', {
              event: 'file-upload.extraction-started',
              fileKey: urlInfo.fileKey,
            })

            const extractResult = await extractDataByFileIdAction(urlInfo.fileKey)

            // Check if session expired (JWT expired on backend)
            if (extractResult.sessionExpired) {
              logger.warn('Session expired during extraction, redirecting to signin', {
                event: 'session-guard.redirect',
              })
              router.push(
                `/signin?error=session_expired&callbackUrl=${encodeURIComponent(callbackUrl)}`
              )
              return
            }

            if (
              extractResult.success &&
              extractResult.allResults &&
              extractResult.allResults.length > 0
            ) {
              logger.info('Extraction successful', {
                event: 'file-upload.extraction-completed',
                count: extractResult.allResults.length,
              })
              setExtractedData(extractResult.allResults)
            } else if (extractResult.error) {
              logger.error('Extraction failed', undefined, {
                event: 'file-upload.extraction-failed',
                error: extractResult.error,
              })
              throw new Error(extractResult.error)
            }
          } catch (extractError) {
            logger.error(
              'Extraction failed',
              extractError instanceof Error ? extractError : new Error(String(extractError)),
              { event: 'file-upload.extraction-failed' }
            )
          } finally {
            setIsExtracting(false)
          }
        } else if (flow === 'rag') {
          ragUploadedFileKeys.push(urlInfo.fileKey)
        }

        logger.info('File uploaded successfully', {
          event: 'file-upload.completed',
          filename: uploadedFile.file.name,
          urlInfo: urlInfo.uploadUrl,
          id: uploadedFile.id,
        })
        logger.info('Response uploaded successfully', { event: 'file-upload.completed', result })
      }

      // All files uploaded successfully
      logger.info('All files uploaded successfully to bucket', { event: 'file-upload.completed' })
      if (flow === 'rag' && ragUploadedFileKeys.length > 0) {
        setRagFileKeys(ragUploadedFileKeys)
        setShowRagForm(true)
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred during upload'
      setError(`Upload failed: ${errorMessage}`)
      logger.error('Upload error', error instanceof Error ? error : new Error(String(error)), {
        event: 'file-upload.failed',
      })
    } finally {
      setIsUploading(false)
    }
  }, [uploadedFiles, isUploading, uploadFileToBucket, router, callbackUrl, flow, chatTypeId])

  /**
   * Clear the error message
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Navigate to the dashboard
   */
  const handleNavigateHome = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  /**
   * Sign out the user using NextAuth
   * Clears the session and redirects to the signin page
   */
  const handleSignOut = useCallback(async () => {
    try {
      await logoutUserAction()
    } catch (error) {
      logger.error(
        'Failed to logout user on backend',
        error instanceof Error ? error : new Error(String(error)),
        { event: 'server-action.logout.failed' }
      )
    } finally {
      await signOut({ callbackUrl: '/signin' })
    }
  }, [])

  return {
    uploadedFiles,
    dragActive,
    error,
    isUploading,
    isExtracting,
    extractedData,
    handleDrag,
    handleDrop,
    handleFileInputChange,
    removeFile,
    clearAllFiles,
    handleProcessFiles,
    clearError,
    handleNavigateHome,
    handleSignOut,
    showRagForm,
    ragFileKeys,
  }
}
