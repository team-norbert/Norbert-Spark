import { useRouter } from 'next/navigation.js'
import { signOut } from 'next-auth/react'
import type React from 'react'
import { useCallback, useState } from 'react'

export interface UploadedFile {
  file: File
  id: string
}

interface UseFileUploadReturn {
  uploadedFiles: UploadedFile[]
  dragActive: boolean
  error: string | null
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
   * Process the uploaded files
   * This is where the actual file processing logic would go
   */
  const handleProcessFiles = useCallback(() => {
    // TODO: Implement file processing logic
    console.log('Processing files:', uploadedFiles)
  }, [uploadedFiles])

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
