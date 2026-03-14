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
    handleRagFormSubmit,
    handleSignOut,
    isExtracting,
    isUploading,
    ragFileKeys,
    removeFile,
    showRagForm,
    uploadedFiles,
  } = useFileUpload({
    callbackUrl: '/chat-types/rag-files',
    flow: 'rag',
    chatTypeId,
  })

  return (
    <FileUploadPage
      chatTypeId={chatTypeId}
      dragActive={dragActive}
      error={error}
      extractedData={extractedData}
      flow="rag"
      isExtracting={isExtracting}
      isUploading={isUploading}
      onClearAllFiles={clearAllFiles}
      onClearError={clearError}
      onDrag={handleDrag}
      onDrop={handleDrop}
      onFileInputChange={handleFileInputChange}
      onNavigateHome={handleNavigateHome}
      onProcessFiles={handleProcessFiles}
      onRemoveFile={removeFile}
      onSignOut={handleSignOut}
      onSubmitVectorStore={handleRagFormSubmit}
      ragFileKeys={ragFileKeys}
      showRagForm={showRagForm}
      testIds={{
        fileInput: 'rag-files-file-input',
      }}
      text={{
        title: 'Retrieval-Augmented Generation (RAG) files upload',
        subtitle: 'Upload PDF or ZIP files for RAG knowledge base',
      }}
      uploadedFiles={uploadedFiles}
    />
  )
}
