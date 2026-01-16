import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { PDFUtils } from '../../../src/shared/utils/pdf.utils.js'

describe('PDFUtils', () => {
  describe('extractFromBuffer', () => {
    // Load the test zip file once for all tests
    const testZipPath = join(process.cwd(), 'test', 'fake-reciepts.zip')
    const zipBuffer = readFileSync(testZipPath)

    it('should extract only PDF files from a zip buffer', async () => {
      const pdfFiles = await PDFUtils.extractFromBuffer(zipBuffer)

      // Should only return PDF files, not directories or system files
      expect(pdfFiles.length).toBe(10)
      expect(pdfFiles.every((f) => f.path.toLowerCase().endsWith('.pdf'))).toBe(true)
    })

    it('should exclude __MACOSX system folder entries', async () => {
      const pdfFiles = await PDFUtils.extractFromBuffer(zipBuffer)

      // None of the returned files should be from __MACOSX folder
      const macOSFiles = pdfFiles.filter((f) => f.path.includes('__MACOSX'))
      expect(macOSFiles.length).toBe(0)
    })

    it('should exclude hidden files starting with dot', async () => {
      const pdfFiles = await PDFUtils.extractFromBuffer(zipBuffer)

      // None of the returned files should start with a dot
      const hiddenFiles = pdfFiles.filter((f) => {
        const filename = f.path.split('/').pop() || ''
        return filename.startsWith('.')
      })
      expect(hiddenFiles.length).toBe(0)
    })

    it('should exclude files in directories starting with underscore', async () => {
      const pdfFiles = await PDFUtils.extractFromBuffer(zipBuffer)

      // None of the returned files should be in underscore-prefixed directories
      const underscorePathFiles = pdfFiles.filter((f) => {
        const segments = f.path.split('/')
        return segments.some((seg) => seg.startsWith('_'))
      })
      expect(underscorePathFiles.length).toBe(0)
    })

    it('should return files with type "File" only', async () => {
      const pdfFiles = await PDFUtils.extractFromBuffer(zipBuffer)

      // All returned entries should be files, not directories
      expect(pdfFiles.every((f) => f.type === 'File')).toBe(true)
    })

    it('should return correct PDF file paths', async () => {
      const pdfFiles = await PDFUtils.extractFromBuffer(zipBuffer)

      // Sort paths for consistent comparison
      const paths = pdfFiles.map((f) => f.path).sort()

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
      const pdfFiles = await PDFUtils.extractFromBuffer(zipBuffer)

      // All files should end with .pdf (case insensitive)
      expect(pdfFiles.every((f) => f.path.toLowerCase().endsWith('.pdf'))).toBe(true)
    })

    it('should return entries that can be read as buffers', async () => {
      const pdfFiles = await PDFUtils.extractFromBuffer(zipBuffer)

      // Each file entry should have a buffer method
      expect(pdfFiles.every((f) => typeof f.buffer === 'function')).toBe(true)

      // Verify we can actually read the buffer content of the first file
      const firstFile = pdfFiles[0]
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

      const pdfFiles = await PDFUtils.extractFromBuffer(emptyZipBuffer)
      expect(pdfFiles).toEqual([])
    })

    it('should filter out non-PDF files if present in zip', async () => {
      const pdfFiles = await PDFUtils.extractFromBuffer(zipBuffer)

      // No file should have an extension other than .pdf
      const nonPdfFiles = pdfFiles.filter((f) => !f.path.toLowerCase().endsWith('.pdf'))
      expect(nonPdfFiles.length).toBe(0)
    })

    it('should exclude resource fork files (._prefix)', async () => {
      const pdfFiles = await PDFUtils.extractFromBuffer(zipBuffer)

      // macOS resource fork files start with ._ and should be excluded
      const resourceForkFiles = pdfFiles.filter((f) => {
        const filename = f.path.split('/').pop() || ''
        return filename.startsWith('._')
      })
      expect(resourceForkFiles.length).toBe(0)
    })
  })
})
