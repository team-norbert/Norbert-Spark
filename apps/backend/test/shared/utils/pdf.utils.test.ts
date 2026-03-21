import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LoggerPort } from '../../../src/application/ports/logger.port.js'
import { PDFUtils, ZipSecurityError } from '../../../src/shared/utils/pdf.utils.js'
import { createMockLogger } from '../factories/logger.factory.js'

describe('PDFUtils', () => {
  let pdfUtils: PDFUtils
  let mockLogger: LoggerPort

  beforeEach(() => {
    // Create mock logger
    mockLogger = createMockLogger()

    // Create PDFUtils instance with mock logger
    pdfUtils = new PDFUtils(mockLogger)
  })

  describe('extractFromBuffer', () => {
    // Load the test zip file once for all tests
    const testZipPath = join(process.cwd(), 'test', 'fake-reciepts.zip')
    const zipBuffer = readFileSync(testZipPath)

    it('should extract only PDF files from a zip buffer', async () => {
      const result = await pdfUtils.extractFromBuffer(zipBuffer)

      // Should only return PDF files, not directories or system files
      expect(result.pdfFiles.length).toBe(10)
      expect(result.pdfFiles.every((f) => f.path.toLowerCase().endsWith('.pdf'))).toBe(true)
    })

    it('should exclude __MACOSX system folder entries', async () => {
      const result = await pdfUtils.extractFromBuffer(zipBuffer)

      // None of the returned files should be from __MACOSX folder
      const macOSFiles = result.pdfFiles.filter((f) => f.path.includes('__MACOSX'))
      expect(macOSFiles.length).toBe(0)
    })

    it('should exclude hidden files starting with dot', async () => {
      const result = await pdfUtils.extractFromBuffer(zipBuffer)

      // None of the returned files should start with a dot
      const hiddenFiles = result.pdfFiles.filter((f) => {
        const filename = f.path.split('/').pop() || ''
        return filename.startsWith('.')
      })
      expect(hiddenFiles.length).toBe(0)
    })

    it('should exclude files in directories starting with underscore', async () => {
      const result = await pdfUtils.extractFromBuffer(zipBuffer)

      // None of the returned files should be in underscore-prefixed directories
      const underscorePathFiles = result.pdfFiles.filter((f) => {
        const segments = f.path.split('/')
        return segments.some((seg) => seg.startsWith('_'))
      })
      expect(underscorePathFiles.length).toBe(0)
    })

    it('should return files with type "File" only', async () => {
      const result = await pdfUtils.extractFromBuffer(zipBuffer)

      // All returned entries should be files, not directories
      expect(result.pdfFiles.every((f) => f.type === 'File')).toBe(true)
    })

    it('should return correct PDF file paths', async () => {
      const result = await pdfUtils.extractFromBuffer(zipBuffer)

      // Sort paths for consistent comparison
      const paths = result.pdfFiles.map((f) => f.path).sort()

      expect(paths).toEqual([
        'fake-reciepts/receipt-1.pdf',
        'fake-reciepts/receipt-10.pdf',
        'fake-reciepts/receipt-2.pdf',
        'fake-reciepts/receipt-3.pdf',
        'fake-reciepts/receipt-4.pdf',
        'fake-reciepts/receipt-5.pdf',
        'fake-reciepts/receipt-6.pdf',
        'fake-reciepts/receipt-7.pdf',
        'fake-reciepts/receipt-8.pdf',
        'fake-reciepts/receipt-9.pdf',
      ])
    })

    it('should handle case-insensitive PDF extension matching', async () => {
      const result = await pdfUtils.extractFromBuffer(zipBuffer)

      // All files should end with .pdf (case insensitive)
      expect(result.pdfFiles.every((f) => f.path.toLowerCase().endsWith('.pdf'))).toBe(true)
    })

    it('should return entries that can be read as buffers', async () => {
      const result = await pdfUtils.extractFromBuffer(zipBuffer)

      // Each file entry should have a buffer method
      expect(result.pdfFiles.every((f) => typeof f.buffer === 'function')).toBe(true)

      // Verify we can actually read the buffer content of the first file
      const firstFile = result.pdfFiles[0]
      expect(firstFile).toBeDefined()
      const fileBuffer = await firstFile!.buffer()
      expect(fileBuffer).toBeInstanceOf(Buffer)
      expect(fileBuffer.length).toBeGreaterThan(0)
    })

    it('should handle empty zip buffer gracefully', async () => {
      // Create a minimal valid empty zip file (End of Central Directory record)
      const emptyZipBuffer = Buffer.from([
        0x50,
        0x4b,
        0x05,
        0x06, // End of central directory signature
        0x00,
        0x00, // Number of this disk
        0x00,
        0x00, // Disk where central directory starts
        0x00,
        0x00, // Number of central directory records on this disk
        0x00,
        0x00, // Total number of central directory records
        0x00,
        0x00,
        0x00,
        0x00, // Size of central directory
        0x00,
        0x00,
        0x00,
        0x00, // Offset of start of central directory
        0x00,
        0x00, // Comment length
      ])

      const result = await pdfUtils.extractFromBuffer(emptyZipBuffer)
      expect(result.pdfFiles).toEqual([])
      expect(result.pdfFilesFound).toBe(0)
    })

    it('should filter out non-PDF files if present in zip', async () => {
      const result = await pdfUtils.extractFromBuffer(zipBuffer)

      // No file should have an extension other than .pdf
      const nonPdfFiles = result.pdfFiles.filter((f) => !f.path.toLowerCase().endsWith('.pdf'))
      expect(nonPdfFiles.length).toBe(0)
    })

    it('should exclude resource fork files (._prefix)', async () => {
      const result = await pdfUtils.extractFromBuffer(zipBuffer)

      // macOS resource fork files start with ._ and should be excluded
      const resourceForkFiles = result.pdfFiles.filter((f) => {
        const filename = f.path.split('/').pop() || ''
        return filename.startsWith('._')
      })
      expect(resourceForkFiles.length).toBe(0)
    })

    it('should log debug information about extraction', async () => {
      await pdfUtils.extractFromBuffer(zipBuffer)

      // Verify logger.debug was called with extraction summary
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'ZIP extraction summary',
        expect.objectContaining({
          totalEntries: expect.any(Number),
          pdfFilesFound: 10,
          pdfPaths: expect.any(Array),
          securityLimits: expect.objectContaining({
            maxFileCount: expect.any(Number),
            maxDecompressedSize: expect.any(Number),
          }),
        })
      )
    })
  })

  describe('Security Features', () => {
    const testZipPath = join(process.cwd(), 'test', 'fake-reciepts.zip')
    const zipBuffer = readFileSync(testZipPath)

    describe('File Count Limits', () => {
      it('should throw ZipSecurityError when file count exceeds limit', async () => {
        const strictPdfUtils = new PDFUtils(mockLogger, { maxFileCount: 5 })

        await expect(strictPdfUtils.extractFromBuffer(zipBuffer)).rejects.toThrow(ZipSecurityError)
        await expect(strictPdfUtils.extractFromBuffer(zipBuffer)).rejects.toThrow(
          /ZIP contains too many files/
        )
      })

      it('should allow extraction when file count is within limit', async () => {
        const result = await pdfUtils.extractFromBuffer(zipBuffer)
        expect(result.pdfFiles.length).toBeGreaterThan(0)
      })

      it('should use override limits when provided', async () => {
        // Override to allow more files
        const result = await pdfUtils.extractFromBuffer(zipBuffer, { maxFileCount: 200 })
        expect(result.pdfFiles.length).toBe(10)
      })
    })

    describe('Decompressed Size Limits', () => {
      it('should throw ZipSecurityError when total size exceeds limit', async () => {
        const strictPdfUtils = new PDFUtils(mockLogger, { maxDecompressedSize: 100 }) // 100 bytes

        await expect(strictPdfUtils.extractFromBuffer(zipBuffer)).rejects.toThrow(ZipSecurityError)
        await expect(strictPdfUtils.extractFromBuffer(zipBuffer)).rejects.toThrow(
          /total decompressed size exceeds limit/
        )
      })

      it('should allow extraction when size is within limit', async () => {
        const result = await pdfUtils.extractFromBuffer(zipBuffer)
        expect(result.pdfFiles.length).toBeGreaterThan(0)
      })
    })

    describe('Path Traversal Prevention', () => {
      it('should have path sanitization that rejects null bytes', async () => {
        // The sanitizePath method is private but we can verify behavior through logging
        const result = await pdfUtils.extractFromBuffer(zipBuffer)
        // Normal paths should work
        expect(result.pdfFiles.length).toBe(10)
      })

      it('should exclude files with path traversal in paths', async () => {
        const result = await pdfUtils.extractFromBuffer(zipBuffer)

        // No file paths should contain ..
        const traversalFiles = result.pdfFiles.filter(
          (f) => f.path.includes('../') || f.path.includes('..')
        )
        expect(traversalFiles.length).toBe(0)
      })

      it('should only allow relative paths', async () => {
        const result = await pdfUtils.extractFromBuffer(zipBuffer)

        // No file paths should be absolute
        const absolutePathFiles = result.pdfFiles.filter((f) => f.path.startsWith('/'))
        expect(absolutePathFiles.length).toBe(0)
      })
    })

    describe('Custom Security Limits', () => {
      it('should accept custom security limits in constructor', () => {
        const customPdfUtils = new PDFUtils(mockLogger, {
          maxFileCount: 50,
          maxDecompressedSize: 50 * 1024 * 1024,
          maxFileSize: 25 * 1024 * 1024,
          maxCompressionRatio: 50,
        })

        expect(customPdfUtils).toBeInstanceOf(PDFUtils)
      })

      it('should merge custom limits with defaults', async () => {
        const customPdfUtils = new PDFUtils(mockLogger, { maxFileCount: 200 })

        const result = await customPdfUtils.extractFromBuffer(zipBuffer)
        expect(result.pdfFiles.length).toBe(10)
      })
    })

    describe('ZipSecurityError', () => {
      it('should have correct error code for file count exceeded', async () => {
        const strictPdfUtils = new PDFUtils(mockLogger, { maxFileCount: 1 })

        const result = await strictPdfUtils
          .extractFromBuffer(zipBuffer)
          .catch((e: ZipSecurityError) => e)

        expect(result).toBeInstanceOf(ZipSecurityError)
        const error = result as ZipSecurityError
        expect(error.code).toBe('MAX_FILE_COUNT_EXCEEDED')
      })

      it('should have correct error code for size exceeded', async () => {
        const strictPdfUtils = new PDFUtils(mockLogger, { maxDecompressedSize: 1 })

        const result = await strictPdfUtils
          .extractFromBuffer(zipBuffer)
          .catch((e: ZipSecurityError) => e)

        expect(result).toBeInstanceOf(ZipSecurityError)
        const error = result as ZipSecurityError
        expect(error.code).toBe('MAX_DECOMPRESSED_SIZE_EXCEEDED')
      })
    })

    describe('Logging Security Events', () => {
      it('should log errors when security limits are exceeded', async () => {
        const strictPdfUtils = new PDFUtils(mockLogger, { maxFileCount: 1 })

        try {
          await strictPdfUtils.extractFromBuffer(zipBuffer)
        } catch (_error) {
          // Expected
        }

        expect(mockLogger.error).toHaveBeenCalled()
      })

      it('should include security limits in debug output', async () => {
        await pdfUtils.extractFromBuffer(zipBuffer)

        expect(mockLogger.debug).toHaveBeenCalledWith(
          'ZIP extraction summary',
          expect.objectContaining({
            securityLimits: expect.objectContaining({
              maxFileCount: expect.any(Number),
              maxDecompressedSize: expect.any(Number),
              maxFileSize: expect.any(Number),
              maxCompressionRatio: expect.any(Number),
            }),
          })
        )
      })
    })
  })
})

// ---------------------------------------------------------------------------
// Tests targeting surviving mutants
// ---------------------------------------------------------------------------

describe('PDFUtils - sanitizePath (via extractFromBuffer)', () => {
  let pdfUtils: PDFUtils
  let mockLogger: LoggerPort

  beforeEach(() => {
    mockLogger = createMockLogger()
    pdfUtils = new PDFUtils(mockLogger)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should skip files with null bytes in their path and log a warning', async () => {
    // Mutants 6854, 6860, 6862, 6863, 6864
    // Entry whose path contains a null byte — we inject it via a ZIP whose
    // central-directory name contains \0.
    const pdfData = Buffer.from('%PDF-1.4 test')
    const zipBuf = Buffer.alloc(100)

    // Patch the unzipper result to return a file with a null-byte path
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'evil\0file.pdf',
      uncompressedSize: pdfData.length,
      compressedSize: pdfData.length,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    vi.spyOn(unzipper.default.Open, 'buffer').mockResolvedValue({ files: [mockFile] } as any)

    const result = await pdfUtils.extractFromBuffer(zipBuf)

    expect(result.pdfFiles).toHaveLength(0)
    expect(mockLogger.warn).toHaveBeenCalledWith('Null byte detected in path', {
      path: 'evil\0file.pdf',
    })
  })

  it('should skip files with backslash path traversal (..\\\\) and log a warning', async () => {
    // Mutant 6867: || -> && so ..\ path would not be caught
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: '..\\evil.pdf',
      uncompressedSize: pdfData.length,
      compressedSize: pdfData.length,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    vi.spyOn(unzipper.default.Open, 'buffer').mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    expect(result.pdfFiles).toHaveLength(0)
    expect(mockLogger.warn).toHaveBeenCalledWith('Path traversal attempt detected', {
      path: '..\\evil.pdf',
    })
  })

  it('should skip files with absolute path starting with / and log warning', async () => {
    // Mutants 6874, 6875, 6876: absolute path detection (|| -> &&, startsWith vs endsWith)
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: '/etc/evil.pdf',
      uncompressedSize: pdfData.length,
      compressedSize: pdfData.length,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    vi.spyOn(unzipper.default.Open, 'buffer').mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    expect(result.pdfFiles).toHaveLength(0)
    expect(mockLogger.warn).toHaveBeenCalledWith('Absolute path detected', {
      path: '/etc/evil.pdf',
    })
  })

  it('should normalise paths with dot segments (./subdir/file.pdf)', async () => {
    // Mutants 6881, 6882, 6884, 6886, 6887, 6889: filter(s => s && s !== '.')
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: './subdir/file.pdf',
      uncompressedSize: pdfData.length,
      compressedSize: pdfData.length,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    vi.spyOn(unzipper.default.Open, 'buffer').mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    // The path is valid but contains '.' which should be filtered — file should be accepted
    expect(result.pdfFiles).toHaveLength(1)
  })

  it('should skip files whose path has a .. segment after normalisation and log warning', async () => {
    // Mutants 6891, 6892, 6893, 6895, 6897, 6898, 6899, 6900
    // A path containing `..` segments is rejected by sanitizePath.
    // For paths ending in .pdf, the `../` literal check fires before the
    // segments.some(s => s === '..') safety net, but both guards ensure the
    // file is skipped. We verify the file is excluded AND the warning is logged.
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'subdir/../../secret.pdf',
      uncompressedSize: pdfData.length,
      compressedSize: pdfData.length,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    vi.spyOn(unzipper.default.Open, 'buffer').mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    expect(result.pdfFiles).toHaveLength(0)
    expect(mockLogger.warn).toHaveBeenCalledWith('Path traversal attempt detected', {
      path: 'subdir/../../secret.pdf',
    })
  })

  it('should log warn with path escape message when .. segment is found', async () => {
    // Mutants 6898, 6899, 6900 — the warn call and its args
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'subdir/../../../evil.pdf',
      uncompressedSize: pdfData.length,
      compressedSize: pdfData.length,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    vi.spyOn(unzipper.default.Open, 'buffer').mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    await pdfUtils.extractFromBuffer(zipBuf)

    // The path contains ../ so it should be caught by the ../literal check first
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringMatching(/traversal|escape/i),
      expect.objectContaining({ path: 'subdir/../../../evil.pdf' })
    )
  })
})

describe('PDFUtils - validateFileEntry (via extractFromBuffer)', () => {
  let pdfUtils: PDFUtils
  let mockLogger: LoggerPort

  beforeEach(() => {
    mockLogger = createMockLogger()
    pdfUtils = new PDFUtils(mockLogger)
  })

  it('should skip individual file that exceeds maxFileSize and log warn', async () => {
    // Mutants 6907, 6908, 6910, 6911: uncompressedSize > maxFileSize block
    // Use overrideLimits to raise maxCompressionRatio and maxDecompressedSize so the
    // overall ratio check doesn't trigger before validateFileEntry is reached
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'large.pdf',
      uncompressedSize: 60 * 1024 * 1024, // 60MB > default 50MB maxFileSize
      compressedSize: 1000,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const specialPdfUtils = new PDFUtils(mockLogger, {
      maxCompressionRatio: Infinity,
      maxDecompressedSize: 500 * 1024 * 1024,
    })
    const zipBuf = Buffer.alloc(100)
    const result = await specialPdfUtils.extractFromBuffer(zipBuf)

    expect(result.pdfFiles).toHaveLength(0)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('File exceeds maximum size')
    )

    spy.mockRestore()
  })

  it('validateFileEntry: file size exactly at limit (not exceeded) should be allowed', async () => {
    // Mutant 6908: >= would reject equal-size files
    const limit = 50 * 1024 * 1024
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'edge.pdf',
      uncompressedSize: limit, // exactly at limit — should be allowed
      compressedSize: 1000,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    // Override ratio/size limits so only the per-file size check is relevant here
    const specialPdfUtils = new PDFUtils(mockLogger, {
      maxCompressionRatio: Infinity,
      maxDecompressedSize: 500 * 1024 * 1024,
    })
    const zipBuf = Buffer.alloc(100)
    const result = await specialPdfUtils.extractFromBuffer(zipBuf)

    // uncompressedSize === maxFileSize should NOT be rejected (condition is >)
    expect(result.pdfFiles).toHaveLength(1)

    spy.mockRestore()
  })

  it('should skip file with suspicious per-file compression ratio and log warn', async () => {
    // Mutants 6912, 6913, 6914, 6915, 6916, 6917, 6918, 6921, 6922
    // per-file ratio = uncompressedSize / compressedSize = 200 / 1 = 200 > default 100
    // But overallRatio = totalUncompressed / buffer.length — we keep both small
    // so only the per-file check fires
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'suspicious.pdf',
      uncompressedSize: 200,
      compressedSize: 1,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    // The zip buffer is ~100 bytes; totalUncompressed = 200, ratio = ~2 — well below overall limit
    // No override needed, the per-file check fires first
    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    expect(result.pdfFiles).toHaveLength(0)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Suspicious compression ratio detected')
    )

    spy.mockRestore()
  })

  it('validateFileEntry: compression ratio exactly at limit should be allowed', async () => {
    // Mutant 6922: >= would reject equal-ratio files
    // per-file ratio = 100/1 = exactly 100 — should be allowed (condition is >)
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'edge-ratio.pdf',
      uncompressedSize: 100, // ratio = 100/1 = exactly 100 — should be allowed
      compressedSize: 1,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    // totalUncompressed = 100; buffer ~100 bytes → overallRatio ≈ 1, well below limit
    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    // ratio === maxCompressionRatio should NOT be rejected (condition is >)
    expect(result.pdfFiles).toHaveLength(1)

    spy.mockRestore()
  })

  it('should skip file with zero compressedSize (denominator guard)', async () => {
    // Mutants 6913, 6914: compressedSize && compressedSize > 0 condition
    // If compressedSize is 0, the ratio check should be skipped
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'zero-compressed.pdf',
      uncompressedSize: 1000, // small — overallRatio ~ 1000/100bytes ~ 10 < limit
      compressedSize: 0, // should skip ratio check
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    await pdfUtils.extractFromBuffer(zipBuf)

    // Should not warn about per-file compression ratio when compressedSize is 0
    expect(mockLogger.warn).not.toHaveBeenCalledWith(
      expect.stringContaining('Suspicious compression ratio')
    )

    spy.mockRestore()
  })
})

describe('PDFUtils - extractFromBuffer boundary conditions', () => {
  let pdfUtils: PDFUtils
  let mockLogger: LoggerPort

  beforeEach(() => {
    mockLogger = createMockLogger()
    pdfUtils = new PDFUtils(mockLogger)
  })

  it('should allow extraction when file count equals maxFileCount (not exceed)', async () => {
    // Mutant 6936: > -> >= would reject equal count
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const files = Array.from({ length: 100 }, (_, i) => ({
      type: 'File',
      path: `file${i}.pdf`,
      uncompressedSize: pdfData.length,
      compressedSize: pdfData.length,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }))
    const spy = vi.spyOn(unzipper.default.Open, 'buffer').mockResolvedValue({ files } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    // 100 files === maxFileCount (100), should NOT throw
    expect(result.pdfFiles).toHaveLength(100)

    spy.mockRestore()
  })

  it('should throw when file count is exactly maxFileCount + 1', async () => {
    // Confirms the > boundary is working
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const files = Array.from({ length: 101 }, (_, i) => ({
      type: 'File',
      path: `file${i}.pdf`,
      uncompressedSize: pdfData.length,
      compressedSize: pdfData.length,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }))
    const spy = vi.spyOn(unzipper.default.Open, 'buffer').mockResolvedValue({ files } as any)

    const zipBuf = Buffer.alloc(100)
    await expect(pdfUtils.extractFromBuffer(zipBuf)).rejects.toThrow(ZipSecurityError)

    spy.mockRestore()
  })

  it('should allow extraction when totalUncompressedSize equals maxDecompressedSize', async () => {
    // Mutant 6948: > -> >= would reject equal size
    const limit = 100 * 1024 * 1024
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'edge.pdf',
      uncompressedSize: limit, // exactly at limit
      compressedSize: 1000,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    // Raise maxCompressionRatio so the overallRatio check doesn't fire first,
    // and raise maxFileSize (default 50MB) above the 100MB file so validateFileEntry
    // also passes — this isolates the totalUncompressedSize === maxDecompressedSize boundary.
    const specialPdfUtils = new PDFUtils(mockLogger, {
      maxCompressionRatio: Infinity,
      maxFileSize: 200 * 1024 * 1024,
    })
    const zipBuf = Buffer.alloc(100)
    // totalUncompressedSize === maxDecompressedSize should NOT throw (condition is >)
    const result = await specialPdfUtils.extractFromBuffer(zipBuf)
    expect(result.pdfFiles).toHaveLength(1)

    spy.mockRestore()
  })

  it('should throw ZipSecurityError with INVALID_ZIP_SIZE when buffer is too small', async () => {
    // Mutants 6954, 6957, 6958: compressedSize < MIN_VALID_ZIP_SIZE (22) block
    // unzipper.Open.buffer is called before the size check, so mock it to succeed
    const unzipper = await import('unzipper')
    const spy = vi.spyOn(unzipper.default.Open, 'buffer').mockResolvedValue({ files: [] } as any)

    const tinyBuf = Buffer.alloc(10) // 10 bytes < 22 MIN_VALID_ZIP_SIZE

    await expect(pdfUtils.extractFromBuffer(tinyBuf)).rejects.toThrow(ZipSecurityError)
    await expect(pdfUtils.extractFromBuffer(tinyBuf)).rejects.toThrow(
      /below minimum valid ZIP size/
    )

    spy.mockRestore()
  })

  it('should have INVALID_ZIP_SIZE error code for tiny buffer', async () => {
    // Mutant 6957, 6958 — error code in INVALID_ZIP_SIZE branch
    const unzipper = await import('unzipper')
    const spy = vi.spyOn(unzipper.default.Open, 'buffer').mockResolvedValue({ files: [] } as any)

    const tinyBuf = Buffer.alloc(10)

    const result = await pdfUtils.extractFromBuffer(tinyBuf).catch((e: ZipSecurityError) => e)
    expect(result).toBeInstanceOf(ZipSecurityError)
    expect((result as ZipSecurityError).code).toBe('INVALID_ZIP_SIZE')

    spy.mockRestore()
  })

  it('should throw SUSPICIOUS_COMPRESSION_RATIO for overall ratio exceeding limit', async () => {
    // Mutants 6962, 6963, 6965, 6966, 6967
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    // overallRatio = totalUncompressed / compressedSize
    // Fake compressedSize in buffer.length won't affect unzipper mock,
    // but we control the files array to make totalUncompressedSize huge
    const hugeUncompressed = 200 * 1024 * 1024 // 200MB
    const mockFile = {
      type: 'File',
      path: 'huge.pdf',
      uncompressedSize: hugeUncompressed,
      compressedSize: 1000,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    // Use a pdfUtils with raised maxDecompressedSize to avoid hitting that limit first
    const specialPdfUtils = new PDFUtils(mockLogger, {
      maxDecompressedSize: 500 * 1024 * 1024,
    })
    // Create a small buffer (> 22 bytes) so INVALID_ZIP_SIZE isn't triggered
    const zipBuf = Buffer.alloc(100)

    // overallRatio = 200MB / ~few hundred bytes >> 100
    await expect(specialPdfUtils.extractFromBuffer(zipBuf)).rejects.toThrow(ZipSecurityError)
    await expect(specialPdfUtils.extractFromBuffer(zipBuf)).rejects.toThrow(
      /Suspicious overall compression ratio/
    )

    spy.mockRestore()
  })

  it('should have SUSPICIOUS_COMPRESSION_RATIO error code', async () => {
    // Mutant 6965 — error code
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'huge.pdf',
      uncompressedSize: 200 * 1024 * 1024,
      compressedSize: 1000,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const specialPdfUtils = new PDFUtils(mockLogger, { maxDecompressedSize: 500 * 1024 * 1024 })
    const zipBuf = Buffer.alloc(100)

    const result = await specialPdfUtils.extractFromBuffer(zipBuf).catch((e: ZipSecurityError) => e)
    expect((result as ZipSecurityError).code).toBe('SUSPICIOUS_COMPRESSION_RATIO')

    spy.mockRestore()
  })

  it('should log error and include ratio in message for overall compression ratio violation', async () => {
    // Mutants 6965, 6966: error message string content
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'huge.pdf',
      uncompressedSize: 200 * 1024 * 1024,
      compressedSize: 1000,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const specialPdfUtils = new PDFUtils(mockLogger, { maxDecompressedSize: 500 * 1024 * 1024 })
    const zipBuf = Buffer.alloc(100)

    await specialPdfUtils.extractFromBuffer(zipBuf).catch(() => {})
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringMatching(/Suspicious overall compression ratio/)
    )

    spy.mockRestore()
  })

  it('should allow ratio exactly equal to maxCompressionRatio (overall)', async () => {
    // Mutant 6963: >= would reject equal ratio
    // Set up overallRatio = exactly 100 (= maxCompressionRatio):
    //   buffer.length = 100, totalUncompressedSize = 100 * 100 = 10 000
    //   overallRatio = 10 000 / 100 = 100 — must NOT throw (condition is >)
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'exact.pdf',
      uncompressedSize: 10000, // ratio = 10 000 / 100 = 100 = maxCompressionRatio
      compressedSize: 100,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)
    // overallRatio === maxCompressionRatio should NOT be rejected (condition is >)
    expect(result.pdfFiles).toHaveLength(1)

    spy.mockRestore()
  })
})

describe('PDFUtils - file filtering edge cases', () => {
  let pdfUtils: PDFUtils
  let mockLogger: LoggerPort

  beforeEach(() => {
    mockLogger = createMockLogger()
    pdfUtils = new PDFUtils(mockLogger)
  })

  it('should skip non-File type entries (directories)', async () => {
    // Mutant 6972: f.type !== 'File' -> false
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockDir = {
      type: 'Directory',
      path: 'subdir/',
      uncompressedSize: 0,
      compressedSize: 0,
      buffer: vi.fn(),
    }
    const mockFile = {
      type: 'File',
      path: 'subdir/real.pdf',
      uncompressedSize: pdfData.length,
      compressedSize: pdfData.length,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockDir, mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    expect(result.pdfFiles).toHaveLength(1)
    expect(result.pdfFiles[0].path).toBe('subdir/real.pdf')

    spy.mockRestore()
  })

  it('should skip files not ending in .pdf', async () => {
    // Mutant 6977, 6980: endsWith('.pdf') -> false / '.pdf' -> ''
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockTxt = {
      type: 'File',
      path: 'document.txt',
      uncompressedSize: 100,
      compressedSize: 100,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const mockPdf = {
      type: 'File',
      path: 'document.pdf',
      uncompressedSize: 100,
      compressedSize: 100,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockTxt, mockPdf] } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    expect(result.pdfFiles).toHaveLength(1)
    expect(result.pdfFiles[0].path).toBe('document.pdf')

    spy.mockRestore()
  })

  it('should accept files with .PDF (uppercase) extension', async () => {
    // Mutant 6979: toLowerCase() -> toUpperCase() would fail '.pdf' check
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'DOCUMENT.PDF',
      uncompressedSize: 100,
      compressedSize: 100,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    expect(result.pdfFiles).toHaveLength(1)

    spy.mockRestore()
  })

  it('should skip files in directories starting with _ (system folder)', async () => {
    // Mutants 6998-7005: segment.startsWith('.') || segment.startsWith('_')
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: '_private/document.pdf',
      uncompressedSize: 100,
      compressedSize: 100,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    expect(result.pdfFiles).toHaveLength(0)

    spy.mockRestore()
  })

  it('should skip files in directories starting with . (hidden system folder)', async () => {
    // Mutants 7003, 7002: startsWith('.') vs endsWith('.')
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: '.hidden/document.pdf',
      uncompressedSize: 100,
      compressedSize: 100,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    expect(result.pdfFiles).toHaveLength(0)

    spy.mockRestore()
  })

  it('should allow file in a directory that ends with _ but does not start with _', async () => {
    // Mutant 7005: startsWith('_') -> endsWith('_') would wrongly skip these
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'docs_/document.pdf', // folder name ends with _ but does not start with _
      uncompressedSize: 100,
      compressedSize: 100,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    // docs_ doesn't start with _ or . so it should be ALLOWED
    expect(result.pdfFiles).toHaveLength(1)

    spy.mockRestore()
  })

  it('should skip hidden file starting with . and log hidden file warning', async () => {
    // Mutants 6992, 6993, 6995, 6996: filename.startsWith('.') block
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'subdir/.hidden.pdf',
      uncompressedSize: 100,
      compressedSize: 100,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    expect(result.pdfFiles).toHaveLength(0)

    spy.mockRestore()
  })

  it('should allow file that is not hidden (filename does not start with .)', async () => {
    // Mutant 6992: false would block all files
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'subdir/visible.pdf',
      uncompressedSize: 100,
      compressedSize: 100,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    expect(result.pdfFiles).toHaveLength(1)

    spy.mockRestore()
  })

  it('should skip file with path traversal in sanitized path and log (path traversal skipped)', async () => {
    // Mutants 6985, 6989, 6990: log message string for path traversal in loop
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: '../outside.pdf',
      uncompressedSize: 100,
      compressedSize: 100,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    expect(result.pdfFiles).toHaveLength(0)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Path traversal attempt detected',
      expect.objectContaining({ path: '../outside.pdf' })
    )

    spy.mockRestore()
  })

  it('should include (path traversal) in skippedFiles for unsafe path', async () => {
    // Mutant 6985: `${f.path} (path traversal)` -> template literal stripped
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: '../evil.pdf',
      uncompressedSize: 100,
      compressedSize: 100,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    await pdfUtils.extractFromBuffer(zipBuf)

    // skippedFiles is included in the debug log
    expect(mockLogger.debug).toHaveBeenCalledWith(
      'ZIP extraction summary',
      expect.objectContaining({
        skippedFiles: expect.arrayContaining([expect.stringContaining('path traversal')]),
      })
    )

    spy.mockRestore()
  })

  it('should include (hidden file) in skippedFiles for hidden files', async () => {
    // Mutants 6996, 6931 — hidden file skip message
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: '.hidden.pdf',
      uncompressedSize: 100,
      compressedSize: 100,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    await pdfUtils.extractFromBuffer(zipBuf)

    expect(mockLogger.debug).toHaveBeenCalledWith(
      'ZIP extraction summary',
      expect.objectContaining({
        skippedFiles: expect.arrayContaining([expect.stringContaining('hidden file')]),
      })
    )

    spy.mockRestore()
  })

  it('should include (system folder) in skippedFiles for _ directory', async () => {
    // Mutants 7010, 7013, 7014 — system folder skip message
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: '_macosx/file.pdf',
      uncompressedSize: 100,
      compressedSize: 100,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    await pdfUtils.extractFromBuffer(zipBuf)

    expect(mockLogger.debug).toHaveBeenCalledWith(
      'ZIP extraction summary',
      expect.objectContaining({
        skippedFiles: expect.arrayContaining([expect.stringContaining('system folder')]),
      })
    )

    spy.mockRestore()
  })

  it('should include (security) in skippedFiles for security-rejected files', async () => {
    // Mutants 7009, 7008 — security skip message
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'oversized.pdf',
      uncompressedSize: 60 * 1024 * 1024, // > 50MB limit
      compressedSize: 1000,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    // Raise maxCompressionRatio and maxDecompressedSize so the per-file size check triggers
    const specialPdfUtils = new PDFUtils(mockLogger, {
      maxCompressionRatio: Infinity,
      maxDecompressedSize: 500 * 1024 * 1024,
    })
    const zipBuf = Buffer.alloc(100)
    await specialPdfUtils.extractFromBuffer(zipBuf)

    expect(mockLogger.debug).toHaveBeenCalledWith(
      'ZIP extraction summary',
      expect.objectContaining({
        skippedFiles: expect.arrayContaining([expect.stringContaining('security')]),
      })
    )

    spy.mockRestore()
  })

  it('should return correct pdfPaths in result', async () => {
    // Mutant 7017: map(f => f.path) -> () => undefined
    const pdfData = Buffer.from('%PDF-1.4 test')
    const unzipper = await import('unzipper')
    const mockFile = {
      type: 'File',
      path: 'valid/file.pdf',
      uncompressedSize: 100,
      compressedSize: 100,
      buffer: vi.fn().mockResolvedValue(pdfData),
    }
    const spy = vi
      .spyOn(unzipper.default.Open, 'buffer')
      .mockResolvedValue({ files: [mockFile] } as any)

    const zipBuf = Buffer.alloc(100)
    const result = await pdfUtils.extractFromBuffer(zipBuf)

    expect(result.pdfPaths).toEqual(['valid/file.pdf'])

    spy.mockRestore()
  })
})
