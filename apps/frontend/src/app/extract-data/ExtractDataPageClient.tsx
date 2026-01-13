'use client'

import { FileUploadPage } from '@/view/client-components/FileUploadPage.js'
import { useFileUpload } from '@/view/hooks/useFileUpload.js'

/**
 * Extract Data page client component following DDD architecture.
 * This component is minimal and declarative - it only orchestrates the hook and component.
 * Business logic is in the hook, presentation is in the component.
 */
export function ExtractDataPageClient() {
  const {
    clearAllFiles,
    clearError,
    dragActive,
    error,
    handleDrag,
    handleDrop,
    handleFileInputChange,
    handleNavigateHome,
    handleProcessFiles,
    handleSignOut,
    isUploading,
    removeFile,
    uploadedFiles,
  } = useFileUpload()

  return (
    <FileUploadPage
      uploadedFiles={uploadedFiles}
      dragActive={dragActive}
      error={error}
      isUploading={isUploading}
      onDrag={handleDrag}
      onDrop={handleDrop}
      onFileInputChange={handleFileInputChange}
      onRemoveFile={removeFile}
      onClearAllFiles={clearAllFiles}
      onProcessFiles={handleProcessFiles}
      onClearError={clearError}
      onNavigateHome={handleNavigateHome}
      onSignOut={handleSignOut}
    />
  )
}
