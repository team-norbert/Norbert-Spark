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
    extractedData,
    handleDrag,
    handleDrop,
    handleFileInputChange,
    handleNavigateHome,
    handleProcessFiles,
    handleSignOut,
    isExtracting,
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
      isExtracting={isExtracting}
      extractedData={extractedData}
      text={{
        title: 'Extract Data',
        subtitle: 'Upload PDF or ZIP files for data extraction',
      }}
      testIds={{
        fileInput: 'extract-data-file-input',
      }}
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
