import { useRouter } from 'next/navigation.js'
import { signOut } from 'next-auth/react'
import type React from 'react'
import { useCallback, useState } from 'react'

import { createLogger } from '@/infrastructure/logging/logger.js'
import { getPresignedUrls } from '@/infrastructure/serverActions/getPresignedUrls.server.js'

const logger = createLogger({ prefix: '[useFileUpload]' })

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
  handleDrag: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeFile: (id: string) => void
  clearAllFiles: () => void
  handleProcessFiles: () => void
  clearError: () => void
  handleNavigateHome: () => void
  handleSignOut: () => void
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
 * const { uploadedFiles, handleDrop, removeFile } = useFileUpload()
 * ```
 */
export function useFileUpload(): UseFileUploadReturn {
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

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
   * Upload a file directly to R2 using a presigned URL with progress tracking
   * @param {File} file - The file to upload
   * @param {string} uploadUrl - The presigned URL for upload
   * @param {string} id - The file ID for progress tracking
   * @returns {Promise<boolean>} True if upload succeeds
   */
  const uploadFileToR2 = useCallback(
    async (file: File, uploadUrl: string, id: string): Promise<boolean> => {
      let retries = 0

      while (retries < MAX_RETRIES) {
        try {
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
                updateFileProgress(id, 100)
                resolve(true)
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`))
              }
            })

            xhr.addEventListener('error', () => {
              reject(new Error('Network error during upload'))
            })

            xhr.addEventListener('abort', () => {
              reject(new Error('Upload aborted'))
            })

            xhr.open('PUT', uploadUrl)
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
            xhr.send(file)
          })

          return result
        } catch (error) {
          retries++
          logger.warn(`Upload attempt ${retries} failed for ${file.name}`, error)

          if (retries >= MAX_RETRIES) {
            throw new Error(`Failed to upload ${file.name} after ${MAX_RETRIES} retries`)
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
   * Process the uploaded files using presigned URLs for direct R2 upload
   */
  const handleProcessFiles = useCallback(async () => {
    if (uploadedFiles.length === 0 || isUploading) return

    setIsUploading(true)
    setError(null)

    try {
      // Prepare file metadata for presigned URL generation
      const fileMetadata = uploadedFiles.map((uf) => ({
        filename: uf.file.name,
        mimetype: uf.file.type || 'application/octet-stream',
      }))

      logger.info('Requesting presigned URLs for files', { fileCount: fileMetadata.length })

      // Get presigned URLs from the server action
      const response = await getPresignedUrls(fileMetadata)

      if (!response.success || !response.data?.uploadUrls) {
        throw new Error(response.error || 'Failed to get presigned URLs')
      }

      const { uploadUrls } = response.data

      logger.info('Received presigned URLs', { urlCount: uploadUrls.length })

      // Create a map of filename to presigned URL info
      const urlMap = new Map(uploadUrls.map((u) => [u.filename, u]))

      // Upload files directly to R2 using presigned URLs
      for (const uploadedFile of uploadedFiles) {
        const urlInfo = urlMap.get(uploadedFile.file.name)

        if (!urlInfo) {
          throw new Error(`No presigned URL received for ${uploadedFile.file.name}`)
        }

        logger.info('Uploading file to R2', {
          filename: uploadedFile.file.name,
          fileKey: urlInfo.fileKey,
        })

        await uploadFileToR2(uploadedFile.file, urlInfo.uploadUrl, uploadedFile.id)

        logger.info('File uploaded successfully', { filename: uploadedFile.file.name })
      }

      // All files uploaded successfully
      logger.info('All files uploaded successfully to R2')
      // You can add navigation or success notification here
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred during upload'
      setError(`Upload failed: ${errorMessage}`)
      logger.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [uploadedFiles, isUploading, uploadFileToR2])

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
  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: '/signin' })
  }, [])

  return {
    uploadedFiles,
    dragActive,
    error,
    isUploading,
    handleDrag,
    handleDrop,
    handleFileInputChange,
    removeFile,
    clearAllFiles,
    handleProcessFiles,
    clearError,
    handleNavigateHome,
    handleSignOut,
  }
}
