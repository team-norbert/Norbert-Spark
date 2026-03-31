import path from 'path'
import { PDFParse } from 'pdf-parse'
import unzipper from 'unzipper'

import type { LoggerPort } from '../../application/ports/logger.port.js'
import { ValidationException } from '../exceptions/validation.exception.js'
import { ZipSecurityInvalidZipSizeException } from '../exceptions/zip-invalidzipsize.exception.js'
import { ZipSecurityMaxDecompressedException } from '../exceptions/zip-maxdecompressed.exception.js'
import { ZipSecurityMaxFileException } from '../exceptions/zip-maxfile.exception.js'
import { ZipSecuritySuspiciousException } from '../exceptions/zip-suspicious.exception.js'
/**
 * Security limits for ZIP extraction to prevent zip bomb and DoS attacks
 */
export interface ZipSecurityLimits {
  /** Maximum total decompressed size in bytes (default: 100MB) */
  maxDecompressedSize: number
  /** Maximum number of files to extract (default: 100) */
  maxFileCount: number
  /** Maximum size per individual file in bytes (default: 50MB) */
  maxFileSize: number
  /** Maximum compression ratio (decompressed/compressed) to detect zip bombs (default: 100) */
  maxCompressionRatio: number
}

/**
 * Default security limits
 */
const DEFAULT_SECURITY_LIMITS: ZipSecurityLimits = {
  maxDecompressedSize: 100 * 1024 * 1024, // 100MB total
  maxFileCount: 100, // Maximum 100 files
  maxFileSize: 50 * 1024 * 1024, // 50MB per file
  maxCompressionRatio: 100, // Max 100:1 compression ratio
}

/**
 * Utility class for PDF file operations.
 *
 * Provides methods for extracting and processing PDF files from various sources,
 * including ZIP archives. Handles cross-platform compatibility by filtering out
 * system files and hidden directories that may be included in archives.
 *
 * Implements security measures to protect against:
 * - Zip bomb attacks (compression ratio and size limits)
 * - Path traversal attacks (sanitized paths)
 * - DoS via excessive file counts
 *
 * Uses dependency injection to accept a logger for debugging and monitoring.
 *
 * @example
 * // Extract PDFs from a ZIP buffer
 * const logger = createLogger({ prefix: 'PDFUtils' })
 * const pdfUtils = new PDFUtils(logger)
 * const zipBuffer = fs.readFileSync('documents.zip')
 * const pdfEntries = await pdfUtils.extractFromBuffer(zipBuffer)
 *
 * for (const entry of pdfEntries) {
 *   const pdfBuffer = await entry.buffer()
 *   // Process each PDF...
 * }
 */
export class PDFUtils {
  private readonly securityLimits: ZipSecurityLimits

  constructor(
    private logger: LoggerPort,
    securityLimits?: Partial<ZipSecurityLimits>
  ) {
    this.securityLimits = { ...DEFAULT_SECURITY_LIMITS, ...securityLimits }
  }

  /**
   * Sanitizes a file path to prevent directory traversal attacks.
   * Removes path traversal sequences and ensures the path stays within bounds.
   *
   * @param filePath - The file path to sanitize
   * @returns Sanitized path or null if path is malicious
   */
  private sanitizePath(filePath: string): string | null {
    // Normalize path separators
    const normalized = filePath.replace(/\\/g, '/')

    // Check for null bytes (path injection)
    if (normalized.includes('\0')) {
      this.logger.warn('Null byte detected in path', { path: filePath })
      return null
    }

    // Check for path traversal attempts
    if (normalized.includes('../') || normalized.includes('..\\')) {
      this.logger.warn('Path traversal attempt detected', { path: filePath })
      return null
    }

    // Check for absolute paths
    if (path.isAbsolute(normalized) || normalized.startsWith('/')) {
      this.logger.warn('Absolute path detected', { path: filePath })
      return null
    }

    // Normalize and ensure no escape
    const segments = normalized.split('/').filter((s) => s && s !== '.')
    if (segments.some((s) => s === '..')) {
      this.logger.warn('Path escape attempt detected', { path: filePath })
      return null
    }

    return segments.join('/')
  }

  /**
   * Validates a file entry against security limits.
   *
   * @param file - The unzipper file entry
   * @param compressedSize - Size of the ZIP buffer for ratio calculation
   * @returns Error message if validation fails, null if valid
   */
  private validateFileEntry(file: unzipper.File, compressedSize: number): string | null {
    const uncompressedSize = file.uncompressedSize || 0

    // Check individual file size
    if (uncompressedSize > this.securityLimits.maxFileSize) {
      return `File exceeds maximum size: ${file.path} (${uncompressedSize} bytes > ${this.securityLimits.maxFileSize} bytes)`
    }

    // Check compression ratio for this file (potential zip bomb indicator)
    if (file.compressedSize && file.compressedSize > 0) {
      const ratio = uncompressedSize / file.compressedSize
      if (ratio > this.securityLimits.maxCompressionRatio) {
        return `Suspicious compression ratio detected: ${file.path} (ratio: ${ratio.toFixed(2)})`
      }
    }

    return null
  }

  async validatePDF(buffer: Buffer | Uint8Array): Promise<boolean> {
    try {
      // IMPORTANT: copy the buffer before passing to PDFParse / PDF.js.
      //
      // PDF.js transfers the underlying ArrayBuffer to its internal worker thread
      // for parsing. Transfer is a move — the original ArrayBuffer is detached,
      // causing any Uint8Array or Buffer that shared it (including the caller's
      // `buffer`) to have its byteLength set to 0 after this call returns.
      //
      // By making a copy here we hand PDF.js its own ArrayBuffer to transfer,
      // leaving the caller's buffer intact so it can still be sent to the AI
      // model (or used elsewhere) after validation completes.
      const copy = Buffer.from(buffer)
      const parser = new PDFParse({ data: copy })
      await parser.getInfo()
      return true
    } catch (_error) {
      throw new ValidationException('Invalid PDF')
    }
  }

  /**
   * Extracts PDF file entries from a ZIP archive buffer.
   *
   * This method opens a ZIP archive from a buffer and filters to return only
   * valid PDF files, excluding:
   * - Directory entries
   * - Hidden files (starting with `.`)
   * - System folders (macOS `__MACOSX`, `.DS_Store`, Linux `.git`, etc.)
   * - Files in directories starting with `.` or `_`
   *
   * Security measures applied:
   * - Maximum file count limit
   * - Maximum total decompressed size limit
   * - Maximum individual file size limit
   * - Compression ratio check (zip bomb detection)
   * - Path traversal prevention
   *
   * The filtering uses a positive matching approach that works across all
   * operating systems (macOS, Linux, Windows) without needing to enumerate
   * specific system file names.
   *
   * @param {Buffer} buffer - The ZIP file content as a Buffer
   * @param {Partial<ZipSecurityLimits>} overrideLimits - Optional security limit overrides
   * @returns {Promise<{ totalEntries: number; pdfFilesFound: number; pdfPaths: string[]; pdfFiles: unzipper.File[] }>}
   *          Object containing metadata about the ZIP contents and an array of unzipper File entries for PDF files.
   *          Each file entry has a `buffer()` method to read the file content and a `path` property.
   * @throws {ZipSecurityMaxFileException} If the ZIP contains more files than the allowed maximum.
   * @throws {ZipSecurityMaxDecompressedException} If the total decompressed size exceeds the allowed limit.
   * @throws {ZipSecurityInvalidZipSizeException} If the ZIP buffer is too small to be a valid ZIP file.
   * @throws {ZipSecuritySuspiciousException} If the overall compression ratio is suspiciously high.
   *
   * @example
   * // Basic usage
   * const logger = createLogger({ prefix: 'PDFUtils' })
   * const pdfUtils = new PDFUtils(logger)
   * const zipBuffer = fs.readFileSync('invoices.zip')
   * const pdfs = await pdfUtils.extractFromBuffer(zipBuffer)
   * console.log(`Found ${pdfs.length} PDF files`)
   *
   * @example
   * // With custom security limits
   * const logger = createLogger({ prefix: 'PDFUtils' })
   * const pdfUtils = new PDFUtils(logger, { maxFileCount: 50 })
   * const pdfs = await pdfUtils.extractFromBuffer(zipBuffer)
   *
   * @example
   * // Process each PDF
   * const logger = createLogger({ prefix: 'PDFUtils' })
   * const pdfUtils = new PDFUtils(logger)
   * const pdfs = await pdfUtils.extractFromBuffer(zipBuffer)
   * for (const pdf of pdfs) {
   *   console.log(`Processing: ${pdf.path}`)
   *   const content = await pdf.buffer()
   *   // Send to AI for extraction, save to disk, etc.
   * }
   *
   * @example
   * // Handle ZIP from HTTP response
   * const logger = createLogger({ prefix: 'PDFUtils' })
   * const pdfUtils = new PDFUtils(logger)
   * const response = await fetch('https://example.com/documents.zip')
   * const arrayBuffer = await response.arrayBuffer()
   * const pdfs = await pdfUtils.extractFromBuffer(Buffer.from(arrayBuffer))
   */
  async extractFromBuffer(
    buffer: Buffer,
    overrideLimits?: Partial<ZipSecurityLimits>
  ): Promise<{
    totalEntries: number
    pdfFilesFound: number
    pdfPaths: string[]
    pdfFiles: unzipper.File[]
  }> {
    const limits = { ...this.securityLimits, ...overrideLimits }
    const compressedSize = buffer.length

    const directory = await unzipper.Open.buffer(buffer)

    // Check total file count
    if (directory.files.length > limits.maxFileCount) {
      const error = `ZIP contains too many files: ${directory.files.length} > ${limits.maxFileCount}`
      this.logger.error(error)
      throw new ZipSecurityMaxFileException(error)
    }

    // Calculate total uncompressed size
    const totalUncompressedSize = directory.files.reduce(
      (sum, f) => sum + (f.uncompressedSize || 0),
      0
    )

    if (totalUncompressedSize > limits.maxDecompressedSize) {
      const error = `ZIP total decompressed size exceeds limit: ${totalUncompressedSize} bytes > ${limits.maxDecompressedSize} bytes`
      this.logger.error(error)
      throw new ZipSecurityMaxDecompressedException(error)
    }

    // Check overall compression ratio
    // Minimum valid ZIP file size is ~22 bytes (empty ZIP header)
    const MIN_VALID_ZIP_SIZE = 22
    if (compressedSize < MIN_VALID_ZIP_SIZE) {
      const error = `Invalid or corrupted ZIP: buffer size ${compressedSize} bytes is below minimum valid ZIP size`
      this.logger.error(error)
      throw new ZipSecurityInvalidZipSizeException(error)
    }

    const overallRatio = totalUncompressedSize / compressedSize
    if (overallRatio > limits.maxCompressionRatio) {
      const error = `Suspicious overall compression ratio: ${overallRatio.toFixed(2)} > ${limits.maxCompressionRatio}`
      this.logger.error(error)
      throw new ZipSecuritySuspiciousException(error)
    }

    const pdfFiles: unzipper.File[] = []
    const skippedFiles: string[] = []

    for (const f of directory.files) {
      if (f.type !== 'File') continue
      if (!f.path.toLowerCase().endsWith('.pdf')) continue

      // Sanitize and validate path
      const sanitizedPath = this.sanitizePath(f.path)
      if (!sanitizedPath) {
        skippedFiles.push(`${f.path} (path traversal)`)
        continue
      }

      // Get the filename from the path
      const filename = sanitizedPath.split('/').pop() || ''

      // Exclude hidden files (starting with .)
      if (filename.startsWith('.')) {
        skippedFiles.push(`${f.path} (hidden file)`)
        continue
      }

      // Exclude files in hidden/system directories (segments starting with . or _)
      const pathSegments = sanitizedPath.split('/')
      const hasSystemFolder = pathSegments.some(
        (segment) => segment.startsWith('.') || segment.startsWith('_')
      )
      if (hasSystemFolder) {
        skippedFiles.push(`${f.path} (system folder)`)
        continue
      }

      // Validate file entry against security limits
      const validationError = this.validateFileEntry(f, compressedSize)
      if (validationError) {
        this.logger.warn(validationError)
        skippedFiles.push(`${f.path} (security)`)
        continue
      }

      pdfFiles.push(f)
    }

    this.logger.debug('ZIP extraction summary', {
      totalEntries: directory.files.length,
      pdfFilesFound: pdfFiles.length,
      pdfPaths: pdfFiles.map((f) => f.path),
      skippedFiles,
      securityLimits: {
        maxFileCount: limits.maxFileCount,
        maxDecompressedSize: limits.maxDecompressedSize,
        maxFileSize: limits.maxFileSize,
        maxCompressionRatio: limits.maxCompressionRatio,
      },
    })

    return {
      totalEntries: directory.files.length,
      pdfFilesFound: pdfFiles.length,
      pdfPaths: pdfFiles.map((f) => f.path),
      pdfFiles,
    }
  }
}
