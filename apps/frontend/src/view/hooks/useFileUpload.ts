import { useRouter } from 'next/navigation.js'
import { signOut } from 'next-auth/react'
import type React from 'react'
import { useCallback, useState } from 'react'

import { createLogger } from '@/infrastructure/logging/logger.js'

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
const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
const MAX_RETRIES = 3

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
   * Upload a file in chunks with progress tracking
   * @param {UploadedFile} uploadedFile - The file to upload
   * @returns {Promise<boolean>} True if upload succeeds
   */
  const uploadFileInChunks = useCallback(
    async (uploadedFile: UploadedFile): Promise<boolean> => {
      const { file, id } = uploadedFile
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
      let uploadedChunks = 0

      try {
        // Initialize multipart upload
        const initResponse = await fetch('/api/upload/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            fileSize: file.size,
            mimeType: file.type,
            totalChunks,
          }),
        })

        if (!initResponse.ok) {
          throw new Error('Failed to initialize upload')
        }

        const initData = (await initResponse.json()) as { uploadId: string }
        const { uploadId } = initData

        // Upload chunks
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * CHUNK_SIZE
          const end = Math.min(start + CHUNK_SIZE, file.size)
          const chunk = file.slice(start, end)

          let retries = 0
          let chunkUploaded = false

          while (retries < MAX_RETRIES && !chunkUploaded) {
            try {
              const formData = new FormData()
              formData.append('chunk', chunk)
              formData.append('uploadId', uploadId)
              formData.append('chunkIndex', chunkIndex.toString())
              formData.append('totalChunks', totalChunks.toString())

              const uploadResponse = await fetch('/api/upload/chunk', {
                method: 'POST',
                body: formData,
              })

              if (!uploadResponse.ok) {
                throw new Error(`Failed to upload chunk ${chunkIndex}`)
              }

              chunkUploaded = true
              uploadedChunks++

              // Update progress
              const progress = Math.round((uploadedChunks / totalChunks) * 100)
              updateFileProgress(id, progress)
            } catch (_error) {
              retries++
              if (retries >= MAX_RETRIES) {
                throw new Error(`Failed to upload chunk ${chunkIndex} after ${MAX_RETRIES} retries`)
              }
              // Wait before retrying (exponential backoff)
              await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 1000))
            }
          }
        }

        // Complete multipart upload
        const completeResponse = await fetch('/api/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId, filename: file.name }),
        })

        if (!completeResponse.ok) {
          throw new Error('Failed to complete upload')
        }

        return true
      } catch (error) {
        logger.error('Upload error:', error)
        throw error
      }
    },
    [updateFileProgress]
  )

  /**
   * Process the uploaded files using multipart upload
   */
  const handleProcessFiles = useCallback(async () => {
    if (uploadedFiles.length === 0 || isUploading) return

    setIsUploading(true)
    setError(null)

    try {
      // Upload files sequentially (could be parallelized if needed)
      for (const uploadedFile of uploadedFiles) {
        await uploadFileInChunks(uploadedFile)
      }

      // All files uploaded successfully
      logger.info('All files uploaded successfully')
      // You can add navigation or success notification here
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred during upload'
      setError(`Upload failed: ${errorMessage}`)
      logger.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [uploadedFiles, isUploading, uploadFileInChunks])

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
