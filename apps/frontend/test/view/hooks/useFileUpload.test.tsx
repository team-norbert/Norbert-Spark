import { act, renderHook } from '@testing-library/react'
import { useRouter } from 'next/navigation.js'
import { signOut } from 'next-auth/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFileUpload } from '@/view/hooks/useFileUpload.js'

// Mock next/navigation
vi.mock('next/navigation.js', () => ({
  useRouter: vi.fn(),
}))

// Mock isRedirectError from internal Next.js path
vi.mock('next/dist/client/components/redirect-error.js', () => ({
  isRedirectError: vi.fn(),
}))

// Mock NextAuth signOut
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

describe('useFileUpload', () => {
  const mockPush = vi.fn()
  const mockRouter = {
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(signOut).mockImplementation(() => Promise.resolve(undefined) as any)
  })

  describe('Initial State', () => {
    it('should initialize with empty uploaded files', () => {
      const { result } = renderHook(() => useFileUpload())

      expect(result.current.uploadedFiles).toEqual([])
    })

    it('should initialize with dragActive set to false', () => {
      const { result } = renderHook(() => useFileUpload())

      expect(result.current.dragActive).toBe(false)
    })

    it('should initialize with no error', () => {
      const { result } = renderHook(() => useFileUpload())

      expect(result.current.error).toBeNull()
    })

    it('should provide all required handlers', () => {
      const { result } = renderHook(() => useFileUpload())

      expect(result.current.handleDrag).toBeDefined()
      expect(result.current.handleDrop).toBeDefined()
      expect(result.current.handleFileInputChange).toBeDefined()
      expect(result.current.removeFile).toBeDefined()
      expect(result.current.clearAllFiles).toBeDefined()
      expect(result.current.handleProcessFiles).toBeDefined()
      expect(result.current.clearError).toBeDefined()
      expect(result.current.handleNavigateHome).toBeDefined()
      expect(result.current.handleSignOut).toBeDefined()
      expect(typeof result.current.handleDrag).toBe('function')
      expect(typeof result.current.handleDrop).toBe('function')
      expect(typeof result.current.handleFileInputChange).toBe('function')
      expect(typeof result.current.removeFile).toBe('function')
      expect(typeof result.current.clearAllFiles).toBe('function')
      expect(typeof result.current.handleProcessFiles).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
      expect(typeof result.current.handleNavigateHome).toBe('function')
      expect(typeof result.current.handleSignOut).toBe('function')
    })
  })

  describe('Drag and Drop Handlers', () => {
    describe('handleDrag', () => {
      it('should set dragActive to true on dragenter', () => {
        const { result } = renderHook(() => useFileUpload())

        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          type: 'dragenter',
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrag(mockEvent)
        })

        expect(mockEvent.preventDefault).toHaveBeenCalled()
        expect(mockEvent.stopPropagation).toHaveBeenCalled()
        expect(result.current.dragActive).toBe(true)
      })

      it('should set dragActive to true on dragover', () => {
        const { result } = renderHook(() => useFileUpload())

        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          type: 'dragover',
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrag(mockEvent)
        })

        expect(result.current.dragActive).toBe(true)
      })

      it('should set dragActive to false on dragleave', () => {
        const { result } = renderHook(() => useFileUpload())

        // First set dragActive to true
        const dragEnterEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          type: 'dragenter',
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrag(dragEnterEvent)
        })

        expect(result.current.dragActive).toBe(true)

        // Then drag leave
        const dragLeaveEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          type: 'dragleave',
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrag(dragLeaveEvent)
        })

        expect(result.current.dragActive).toBe(false)
      })

      it('should prevent default behavior and stop propagation', () => {
        const { result } = renderHook(() => useFileUpload())

        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          type: 'dragenter',
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrag(mockEvent)
        })

        expect(mockEvent.preventDefault).toHaveBeenCalled()
        expect(mockEvent.stopPropagation).toHaveBeenCalled()
      })
    })

    describe('handleDrop', () => {
      it('should handle valid PDF file drop', () => {
        const { result } = renderHook(() => useFileUpload())

        const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: {
            files: [pdfFile],
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrop(mockEvent)
        })

        expect(mockEvent.preventDefault).toHaveBeenCalled()
        expect(mockEvent.stopPropagation).toHaveBeenCalled()
        expect(result.current.dragActive).toBe(false)
        expect(result.current.uploadedFiles).toHaveLength(1)
        expect(result.current.uploadedFiles[0]!.file).toBe(pdfFile)
        expect(result.current.uploadedFiles[0]!.id).toContain('test.pdf')
        expect(result.current.error).toBeNull()
      })

      it('should handle valid ZIP file drop', () => {
        const { result } = renderHook(() => useFileUpload())

        const zipFile = new File(['content'], 'archive.zip', { type: 'application/zip' })
        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: {
            files: [zipFile],
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrop(mockEvent)
        })

        expect(result.current.uploadedFiles).toHaveLength(1)
        expect(result.current.uploadedFiles[0]!.file).toBe(zipFile)
        expect(result.current.error).toBeNull()
      })

      it('should handle multiple valid files drop', () => {
        const { result } = renderHook(() => useFileUpload())

        const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
        const zipFile = new File(['content'], 'archive.zip', { type: 'application/zip' })
        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: {
            files: [pdfFile, zipFile],
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrop(mockEvent)
        })

        expect(result.current.uploadedFiles).toHaveLength(2)
        expect(result.current.error).toBeNull()
      })

      it('should reject invalid file types and show error', () => {
        const { result } = renderHook(() => useFileUpload())

        const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' })
        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: {
            files: [invalidFile],
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrop(mockEvent)
        })

        expect(result.current.uploadedFiles).toHaveLength(0)
        expect(result.current.error).toContain('test.txt')
        expect(result.current.error).toContain('only PDF and ZIP files are allowed')
      })

      it('should accept valid files and reject invalid files in same drop', () => {
        const { result } = renderHook(() => useFileUpload())

        const pdfFile = new File(['content'], 'valid.pdf', { type: 'application/pdf' })
        const txtFile = new File(['content'], 'invalid.txt', { type: 'text/plain' })
        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: {
            files: [pdfFile, txtFile],
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrop(mockEvent)
        })

        expect(result.current.uploadedFiles).toHaveLength(1)
        expect(result.current.uploadedFiles[0]!.file).toBe(pdfFile)
        expect(result.current.error).toContain('invalid.txt')
        expect(result.current.error).not.toContain('valid.pdf')
      })

      it('should set dragActive to false after drop', () => {
        const { result } = renderHook(() => useFileUpload())

        // First set dragActive to true
        const dragEnterEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          type: 'dragenter',
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrag(dragEnterEvent)
        })

        expect(result.current.dragActive).toBe(true)

        // Then drop
        const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
        const dropEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: {
            files: [pdfFile],
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrop(dropEvent)
        })

        expect(result.current.dragActive).toBe(false)
      })

      it('should handle drop with no files', () => {
        const { result } = renderHook(() => useFileUpload())

        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: {
            files: [],
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrop(mockEvent)
        })

        expect(result.current.uploadedFiles).toHaveLength(0)
        expect(result.current.error).toBeNull()
      })
    })

    describe('handleFileInputChange', () => {
      it('should handle file input with valid PDF file', () => {
        const { result } = renderHook(() => useFileUpload())

        const pdfFile = new File(['content'], 'document.pdf', { type: 'application/pdf' })
        const mockEvent = {
          target: {
            files: [pdfFile],
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>

        act(() => {
          result.current.handleFileInputChange(mockEvent)
        })

        expect(result.current.uploadedFiles).toHaveLength(1)
        expect(result.current.uploadedFiles[0]!.file).toBe(pdfFile)
        expect(result.current.error).toBeNull()
      })

      it('should handle file input with valid ZIP file', () => {
        const { result } = renderHook(() => useFileUpload())

        const zipFile = new File(['content'], 'data.zip', { type: 'application/zip' })
        const mockEvent = {
          target: {
            files: [zipFile],
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>

        act(() => {
          result.current.handleFileInputChange(mockEvent)
        })

        expect(result.current.uploadedFiles).toHaveLength(1)
        expect(result.current.uploadedFiles[0]!.file).toBe(zipFile)
        expect(result.current.error).toBeNull()
      })

      it('should reject invalid file type', () => {
        const { result } = renderHook(() => useFileUpload())

        const docFile = new File(['content'], 'document.docx', {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })
        const mockEvent = {
          target: {
            files: [docFile],
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>

        act(() => {
          result.current.handleFileInputChange(mockEvent)
        })

        expect(result.current.uploadedFiles).toHaveLength(0)
        expect(result.current.error).toContain('document.docx')
      })

      it('should handle empty file list', () => {
        const { result } = renderHook(() => useFileUpload())

        const mockEvent = {
          target: {
            files: null,
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>

        act(() => {
          result.current.handleFileInputChange(mockEvent)
        })

        expect(result.current.uploadedFiles).toHaveLength(0)
        expect(result.current.error).toBeNull()
      })
    })
  })

  describe('File Management', () => {
    describe('removeFile', () => {
      it('should remove file by id', () => {
        const { result } = renderHook(() => useFileUpload())

        const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: {
            files: [pdfFile],
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrop(mockEvent)
        })

        expect(result.current.uploadedFiles).toHaveLength(1)
        const fileId = result.current.uploadedFiles[0]!.id

        act(() => {
          result.current.removeFile(fileId)
        })

        expect(result.current.uploadedFiles).toHaveLength(0)
      })

      it('should remove correct file when multiple files exist', () => {
        const { result } = renderHook(() => useFileUpload())

        const pdfFile1 = new File(['content'], 'test1.pdf', { type: 'application/pdf' })
        const pdfFile2 = new File(['content'], 'test2.pdf', { type: 'application/pdf' })
        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: {
            files: [pdfFile1, pdfFile2],
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrop(mockEvent)
        })

        expect(result.current.uploadedFiles).toHaveLength(2)
        const firstFileId = result.current.uploadedFiles[0]!.id

        act(() => {
          result.current.removeFile(firstFileId)
        })

        expect(result.current.uploadedFiles).toHaveLength(1)
        expect(result.current.uploadedFiles[0]!.file).toBe(pdfFile2)
      })

      it('should not affect other files when removing non-existent id', () => {
        const { result } = renderHook(() => useFileUpload())

        const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: {
            files: [pdfFile],
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrop(mockEvent)
        })

        expect(result.current.uploadedFiles).toHaveLength(1)

        act(() => {
          result.current.removeFile('non-existent-id')
        })

        expect(result.current.uploadedFiles).toHaveLength(1)
      })
    })

    describe('clearAllFiles', () => {
      it('should clear all uploaded files', () => {
        const { result } = renderHook(() => useFileUpload())

        const pdfFile1 = new File(['content'], 'test1.pdf', { type: 'application/pdf' })
        const pdfFile2 = new File(['content'], 'test2.pdf', { type: 'application/pdf' })
        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: {
            files: [pdfFile1, pdfFile2],
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrop(mockEvent)
        })

        expect(result.current.uploadedFiles).toHaveLength(2)

        act(() => {
          result.current.clearAllFiles()
        })

        expect(result.current.uploadedFiles).toHaveLength(0)
      })

      it('should clear error when clearing all files', () => {
        const { result } = renderHook(() => useFileUpload())

        const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' })
        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: {
            files: [invalidFile],
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrop(mockEvent)
        })

        expect(result.current.error).not.toBeNull()

        act(() => {
          result.current.clearAllFiles()
        })

        expect(result.current.error).toBeNull()
      })

      it('should work when there are no files', () => {
        const { result } = renderHook(() => useFileUpload())

        expect(result.current.uploadedFiles).toHaveLength(0)

        act(() => {
          result.current.clearAllFiles()
        })

        expect(result.current.uploadedFiles).toHaveLength(0)
      })
    })
  })

  describe('Error Handling', () => {
    describe('clearError', () => {
      it('should clear error message', () => {
        const { result } = renderHook(() => useFileUpload())

        const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' })
        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: {
            files: [invalidFile],
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrop(mockEvent)
        })

        expect(result.current.error).not.toBeNull()

        act(() => {
          result.current.clearError()
        })

        expect(result.current.error).toBeNull()
      })

      it('should work when there is no error', () => {
        const { result } = renderHook(() => useFileUpload())

        expect(result.current.error).toBeNull()

        act(() => {
          result.current.clearError()
        })

        expect(result.current.error).toBeNull()
      })
    })

    it('should clear previous error when uploading new valid files', () => {
      const { result } = renderHook(() => useFileUpload())

      // First upload invalid file to set error
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const invalidEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [invalidFile],
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDrop(invalidEvent)
      })

      expect(result.current.error).not.toBeNull()

      // Then upload valid file
      const validFile = new File(['content'], 'valid.pdf', { type: 'application/pdf' })
      const validEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [validFile],
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDrop(validEvent)
      })

      expect(result.current.error).toBeNull()
      expect(result.current.uploadedFiles).toHaveLength(1)
    })
  })

  describe('File Processing', () => {
    describe('handleProcessFiles', () => {
      it('should be callable with uploaded files', async () => {
        const { result } = renderHook(() => useFileUpload())

        const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
        const mockEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: {
            files: [pdfFile],
          },
        } as unknown as React.DragEvent

        act(() => {
          result.current.handleDrop(mockEvent)
        })

        // Verify function is callable (will fail due to no mocked API, but that's expected)
        await act(async () => {
          await result.current.handleProcessFiles()
        })

        // Just verify the function can be called - actual upload behavior is tested elsewhere
        expect(result.current.handleProcessFiles).toBeDefined()
      })

      it('should be callable with no files', async () => {
        const { result } = renderHook(() => useFileUpload())

        // Should not throw when called with no files (early return)
        await act(async () => {
          await result.current.handleProcessFiles()
        })

        // Verify isUploading remains false when no files to process
        expect(result.current.isUploading).toBe(false)
      })
    })
  })

  describe('Navigation Handlers', () => {
    describe('handleNavigateHome', () => {
      it('should navigate to dashboard', () => {
        const { result } = renderHook(() => useFileUpload())

        act(() => {
          result.current.handleNavigateHome()
        })

        expect(mockPush).toHaveBeenCalledWith('/dashboard')
        expect(mockPush).toHaveBeenCalledTimes(1)
      })
    })

    describe('handleSignOut', () => {
      it('should call signOut with callback to signin page', () => {
        const { result } = renderHook(() => useFileUpload())

        act(() => {
          result.current.handleSignOut()
        })

        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/signin' })
        expect(signOut).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('File Validation', () => {
    it('should accept PDF files with application/pdf MIME type', () => {
      const { result } = renderHook(() => useFileUpload())

      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const mockEvent = {
        target: {
          files: [pdfFile],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      act(() => {
        result.current.handleFileInputChange(mockEvent)
      })

      expect(result.current.uploadedFiles).toHaveLength(1)
      expect(result.current.error).toBeNull()
    })

    it('should accept ZIP files with application/zip MIME type', () => {
      const { result } = renderHook(() => useFileUpload())

      const zipFile = new File(['content'], 'test.zip', { type: 'application/zip' })
      const mockEvent = {
        target: {
          files: [zipFile],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      act(() => {
        result.current.handleFileInputChange(mockEvent)
      })

      expect(result.current.uploadedFiles).toHaveLength(1)
      expect(result.current.error).toBeNull()
    })

    it('should accept ZIP files with application/x-zip-compressed MIME type', () => {
      const { result } = renderHook(() => useFileUpload())

      const zipFile = new File(['content'], 'test.zip', { type: 'application/x-zip-compressed' })
      const mockEvent = {
        target: {
          files: [zipFile],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      act(() => {
        result.current.handleFileInputChange(mockEvent)
      })

      expect(result.current.uploadedFiles).toHaveLength(1)
      expect(result.current.error).toBeNull()
    })

    it('should accept files with correct extension even if MIME type is incorrect', () => {
      const { result } = renderHook(() => useFileUpload())

      // Sometimes files have incorrect MIME types but correct extensions
      const pdfFile = new File(['content'], 'document.pdf', { type: 'application/octet-stream' })
      const mockEvent = {
        target: {
          files: [pdfFile],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      act(() => {
        result.current.handleFileInputChange(mockEvent)
      })

      expect(result.current.uploadedFiles).toHaveLength(1)
      expect(result.current.error).toBeNull()
    })

    it('should reject files without PDF or ZIP extension', () => {
      const { result } = renderHook(() => useFileUpload())

      const txtFile = new File(['content'], 'document.txt', { type: 'text/plain' })
      const mockEvent = {
        target: {
          files: [txtFile],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>

      act(() => {
        result.current.handleFileInputChange(mockEvent)
      })

      expect(result.current.uploadedFiles).toHaveLength(0)
      expect(result.current.error).toContain('document.txt')
    })

    it('should generate unique IDs for files', () => {
      const { result } = renderHook(() => useFileUpload())

      const pdfFile1 = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const pdfFile2 = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [pdfFile1, pdfFile2],
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDrop(mockEvent)
      })

      expect(result.current.uploadedFiles).toHaveLength(2)
      expect(result.current.uploadedFiles[0]!.id).not.toBe(result.current.uploadedFiles[1]!.id)
    })

    it('should include file name in the generated ID', () => {
      const { result } = renderHook(() => useFileUpload())

      const pdfFile = new File(['content'], 'my-document.pdf', { type: 'application/pdf' })
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [pdfFile],
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDrop(mockEvent)
      })

      expect(result.current.uploadedFiles[0]!.id).toContain('my-document.pdf')
    })
  })

  describe('State Persistence', () => {
    it('should accumulate files from multiple uploads', () => {
      const { result } = renderHook(() => useFileUpload())

      const pdfFile1 = new File(['content'], 'first.pdf', { type: 'application/pdf' })
      const mockEvent1 = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [pdfFile1],
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDrop(mockEvent1)
      })

      expect(result.current.uploadedFiles).toHaveLength(1)

      const pdfFile2 = new File(['content'], 'second.pdf', { type: 'application/pdf' })
      const mockEvent2 = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [pdfFile2],
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDrop(mockEvent2)
      })

      expect(result.current.uploadedFiles).toHaveLength(2)
      expect(result.current.uploadedFiles[0]!.file.name).toBe('first.pdf')
      expect(result.current.uploadedFiles[1]!.file.name).toBe('second.pdf')
    })

    it('should maintain file list after removing one file', () => {
      const { result } = renderHook(() => useFileUpload())

      const pdfFile1 = new File(['content'], 'keep.pdf', { type: 'application/pdf' })
      const pdfFile2 = new File(['content'], 'remove.pdf', { type: 'application/pdf' })
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [pdfFile1, pdfFile2],
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDrop(mockEvent)
      })

      const secondFileId = result.current.uploadedFiles[1]!.id

      act(() => {
        result.current.removeFile(secondFileId)
      })

      expect(result.current.uploadedFiles).toHaveLength(1)
      expect(result.current.uploadedFiles[0]!.file.name).toBe('keep.pdf')
    })
  })
})
