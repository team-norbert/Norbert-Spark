'use client'

import { FileUploadPage } from '@/view/client-components/FileUploadPage.js'
import { useFileUpload } from '@/view/hooks/useFileUpload.js'

/**
 * RAG Files page client component following DDD architecture.
 * This component is minimal and declarative - it only orchestrates the hook and component.
 * Business logic is in the hook, presentation is in the component.
 */
export function RagFilesPageClient({ chatTypeId }: { chatTypeId: string }) {
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
  } = useFileUpload({
    callbackUrl: '/chat-types/rag-files',
    flow: 'rag',
    chatTypeId,
  })

  return (
    <FileUploadPage
      uploadedFiles={uploadedFiles}
      dragActive={dragActive}
      error={error}
      isUploading={isUploading}
      isExtracting={isExtracting}
      extractedData={extractedData}
      text={{
        title: 'Retrieval-Augmented Generation (RAG) files upload',
        subtitle: 'Upload PDF or ZIP files for RAG knowledge base',
      }}
      testIds={{
        fileInput: 'rag-files-file-input',
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
