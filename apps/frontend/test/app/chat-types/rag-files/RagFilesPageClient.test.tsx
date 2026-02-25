import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RagFilesPageClient } from '@/app/chat-types/rag-files/[id]/RagFilesPageClient.js'
import { FileUploadPage } from '@/view/client-components/FileUploadPage.js'
import { useFileUpload } from '@/view/hooks/useFileUpload.js'

// Mock the useFileUpload hook
vi.mock('@/view/hooks/useFileUpload.js', () => ({
  useFileUpload: vi.fn(),
}))

// Mock the FileUploadPage component
vi.mock('@/view/client-components/FileUploadPage.js', () => ({
  FileUploadPage: vi.fn((props) => (
    <div data-testid="file-upload-page" data-props={JSON.stringify(props)} />
  )),
}))

describe('RagFilesPageClient', () => {
  const mockHookReturn = {
    clearAllFiles: vi.fn(),
    clearError: vi.fn(),
    dragActive: false,
    error: null,
    extractedData: [],
    handleDrag: vi.fn(),
    handleDrop: vi.fn(),
    handleFileInputChange: vi.fn(),
    handleNavigateHome: vi.fn(),
    handleProcessFiles: vi.fn(),
    handleSignOut: vi.fn(),
    isExtracting: false,
    isUploading: false,
    removeFile: vi.fn(),
    uploadedFiles: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useFileUpload).mockReturnValue(mockHookReturn)
  })

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)
      expect(container).toBeInTheDocument()
    })

    it('should render FileUploadPage component', () => {
      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)
      expect(FileUploadPage).toHaveBeenCalledTimes(1)
    })

    it('should call useFileUpload hook', () => {
      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)
      expect(useFileUpload).toHaveBeenCalledTimes(1)
    })
  })

  describe('RAG-specific text prop', () => {
    it('should pass the RAG title text to FileUploadPage', () => {
      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      const call = vi.mocked(FileUploadPage).mock.calls[0]
      expect(call?.[0]?.text?.title).toBe('Retrieval-Augmented Generation (RAG) files upload')
    })

    it('should pass the RAG subtitle text to FileUploadPage', () => {
      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      const call = vi.mocked(FileUploadPage).mock.calls[0]
      expect(call?.[0]?.text?.subtitle).toBe('Upload PDF or ZIP files for RAG knowledge base')
    })

    it('should pass a different title than ExtractDataPageClient', () => {
      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      const call = vi.mocked(FileUploadPage).mock.calls[0]
      expect(call?.[0]?.text?.title).not.toBe('Extract Data')
    })

    it('should pass a different subtitle than ExtractDataPageClient', () => {
      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      const call = vi.mocked(FileUploadPage).mock.calls[0]
      expect(call?.[0]?.text?.subtitle).not.toBe('Upload PDF or ZIP files for data extraction')
    })
  })

  describe('Props Passing to FileUploadPage', () => {
    it('should pass all state values from useFileUpload hook to FileUploadPage', () => {
      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      const call = vi.mocked(FileUploadPage).mock.calls[0]
      expect(call?.[0]).toEqual({
        uploadedFiles: mockHookReturn.uploadedFiles,
        dragActive: mockHookReturn.dragActive,
        error: mockHookReturn.error,
        isUploading: mockHookReturn.isUploading,
        isExtracting: mockHookReturn.isExtracting,
        extractedData: mockHookReturn.extractedData,
        text: {
          title: 'Retrieval-Augmented Generation (RAG) files upload',
          subtitle: 'Upload PDF or ZIP files for RAG knowledge base',
        },
        testIds: {
          fileInput: 'rag-files-file-input',
        },
        onDrag: mockHookReturn.handleDrag,
        onDrop: mockHookReturn.handleDrop,
        onFileInputChange: mockHookReturn.handleFileInputChange,
        onRemoveFile: mockHookReturn.removeFile,
        onClearAllFiles: mockHookReturn.clearAllFiles,
        onProcessFiles: mockHookReturn.handleProcessFiles,
        onClearError: mockHookReturn.clearError,
        onNavigateHome: mockHookReturn.handleNavigateHome,
        onSignOut: mockHookReturn.handleSignOut,
      })
    })

    it('should pass all handler functions from useFileUpload hook to FileUploadPage', () => {
      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      const call = vi.mocked(FileUploadPage).mock.calls[0]
      const props = call?.[0]

      expect(props?.onDrag).toBe(mockHookReturn.handleDrag)
      expect(props?.onDrop).toBe(mockHookReturn.handleDrop)
      expect(props?.onFileInputChange).toBe(mockHookReturn.handleFileInputChange)
      expect(props?.onRemoveFile).toBe(mockHookReturn.removeFile)
      expect(props?.onClearAllFiles).toBe(mockHookReturn.clearAllFiles)
      expect(props?.onProcessFiles).toBe(mockHookReturn.handleProcessFiles)
      expect(props?.onClearError).toBe(mockHookReturn.clearError)
      expect(props?.onNavigateHome).toBe(mockHookReturn.handleNavigateHome)
      expect(props?.onSignOut).toBe(mockHookReturn.handleSignOut)
    })
  })

  describe('DDD Architecture Compliance', () => {
    it('should act as a minimal orchestrator between hook and component', () => {
      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      // Component should only call the hook once
      expect(useFileUpload).toHaveBeenCalledTimes(1)

      // Component should render FileUploadPage once
      expect(FileUploadPage).toHaveBeenCalledTimes(1)

      // Component should pass all hook values directly to FileUploadPage
      const fileUploadPageCall = vi.mocked(FileUploadPage).mock.calls[0]
      const passedProps = fileUploadPageCall?.[0]

      expect(passedProps).toBeDefined()
      expect(Object.keys(passedProps || {})).toHaveLength(17) // All 17 props should be passed
    })

    it('should not contain any business logic', () => {
      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      // All logic should come from the hook
      expect(useFileUpload).toHaveBeenCalled()

      // Component should simply render FileUploadPage
      expect(FileUploadPage).toHaveBeenCalledTimes(1)
    })
  })

  describe('State Propagation', () => {
    it('should propagate uploadedFiles state', () => {
      const uploadedFiles = [
        { file: new File([''], 'document.pdf'), id: '1', uploadProgress: 50 },
        { file: new File([''], 'archive.zip'), id: '2', uploadProgress: 100 },
      ]

      vi.mocked(useFileUpload).mockReturnValue({
        ...mockHookReturn,
        uploadedFiles,
      })

      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      const call = vi.mocked(FileUploadPage).mock.calls[0]
      expect(call?.[0]).toMatchObject({ uploadedFiles })
    })

    it('should propagate dragActive state', () => {
      vi.mocked(useFileUpload).mockReturnValue({
        ...mockHookReturn,
        dragActive: true,
      })

      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      const call = vi.mocked(FileUploadPage).mock.calls[0]
      expect(call?.[0]).toMatchObject({ dragActive: true })
    })

    it('should propagate error state', () => {
      const error = 'Invalid file type. Only PDF and ZIP files are allowed.'

      vi.mocked(useFileUpload).mockReturnValue({
        ...mockHookReturn,
        error,
      })

      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      const call = vi.mocked(FileUploadPage).mock.calls[0]
      expect(call?.[0]).toMatchObject({ error })
    })

    it('should propagate isUploading state', () => {
      vi.mocked(useFileUpload).mockReturnValue({
        ...mockHookReturn,
        isUploading: true,
      })

      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      const call = vi.mocked(FileUploadPage).mock.calls[0]
      expect(call?.[0]).toMatchObject({ isUploading: true })
    })

    it('should propagate isExtracting state', () => {
      vi.mocked(useFileUpload).mockReturnValue({
        ...mockHookReturn,
        isExtracting: true,
      })

      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      const call = vi.mocked(FileUploadPage).mock.calls[0]
      expect(call?.[0]).toMatchObject({ isExtracting: true })
    })

    it('should propagate null error state', () => {
      vi.mocked(useFileUpload).mockReturnValue({
        ...mockHookReturn,
        error: null,
      })

      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      const call = vi.mocked(FileUploadPage).mock.calls[0]
      expect(call?.[0]).toMatchObject({ error: null })
    })
  })

  describe('Handler Propagation', () => {
    it('should propagate all handler functions correctly', () => {
      const customHandlers = {
        clearAllFiles: vi.fn(),
        clearError: vi.fn(),
        handleDrag: vi.fn(),
        handleDrop: vi.fn(),
        handleFileInputChange: vi.fn(),
        handleNavigateHome: vi.fn(),
        handleProcessFiles: vi.fn(),
        handleSignOut: vi.fn(),
        removeFile: vi.fn(),
      }

      vi.mocked(useFileUpload).mockReturnValue({
        ...mockHookReturn,
        ...customHandlers,
      })

      render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      const call = vi.mocked(FileUploadPage).mock.calls[0]
      expect(call?.[0]).toMatchObject({
        onDrag: customHandlers.handleDrag,
        onDrop: customHandlers.handleDrop,
        onFileInputChange: customHandlers.handleFileInputChange,
        onRemoveFile: customHandlers.removeFile,
        onClearAllFiles: customHandlers.clearAllFiles,
        onProcessFiles: customHandlers.handleProcessFiles,
        onClearError: customHandlers.clearError,
        onNavigateHome: customHandlers.handleNavigateHome,
        onSignOut: customHandlers.handleSignOut,
      })
    })
  })

  describe('Re-rendering Behavior', () => {
    it('should re-render when hook state changes', () => {
      const { rerender } = render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      vi.mocked(useFileUpload).mockReturnValue({
        ...mockHookReturn,
        isUploading: true,
      })

      rerender(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      // FileUploadPage should have been called twice (initial render + rerender)
      expect(FileUploadPage).toHaveBeenCalledTimes(2)
    })

    it('should pass updated state to FileUploadPage on re-render', () => {
      const { rerender } = render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      // First render
      let call = vi.mocked(FileUploadPage).mock.calls[0]
      expect(call?.[0]).toMatchObject({ isUploading: false })

      // Change state
      vi.mocked(useFileUpload).mockReturnValue({
        ...mockHookReturn,
        isUploading: true,
        uploadedFiles: [{ file: new File([''], 'knowledge-base.pdf'), id: '1' }],
      })

      rerender(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      // Second render with updated state
      call = vi.mocked(FileUploadPage).mock.calls[1]
      expect(call?.[0]).toMatchObject({
        isUploading: true,
        uploadedFiles: [{ file: new File([''], 'knowledge-base.pdf'), id: '1' }],
      })
    })

    it('should preserve the RAG text prop on re-render', () => {
      const { rerender } = render(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      vi.mocked(useFileUpload).mockReturnValue({
        ...mockHookReturn,
        dragActive: true,
      })

      rerender(<RagFilesPageClient chatTypeId="test-chat-type-id" />)

      const call = vi.mocked(FileUploadPage).mock.calls[1]
      expect(call?.[0]?.text).toEqual({
        title: 'Retrieval-Augmented Generation (RAG) files upload',
        subtitle: 'Upload PDF or ZIP files for RAG knowledge base',
      })
    })
  })
})
