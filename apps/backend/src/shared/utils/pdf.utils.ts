import unzipper from 'unzipper'

/**
 * Utility class for PDF file operations.
 *
 * Provides methods for extracting and processing PDF files from various sources,
 * including ZIP archives. Handles cross-platform compatibility by filtering out
 * system files and hidden directories that may be included in archives.
 *
 * @example
 * // Extract PDFs from a ZIP buffer
 * const zipBuffer = fs.readFileSync('documents.zip')
 * const pdfEntries = await PDFUtils.extractFromBuffer(zipBuffer)
 *
 * for (const entry of pdfEntries) {
 *   const pdfBuffer = await entry.buffer()
 *   // Process each PDF...
 * }
 */
export class PDFUtils {
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
   * The filtering uses a positive matching approach that works across all
   * operating systems (macOS, Linux, Windows) without needing to enumerate
   * specific system file names.
   *
   * @param {Buffer} buffer - The ZIP file content as a Buffer
   * @returns {Promise<unzipper.File[]>} Array of unzipper File entries for PDF files.
   *          Each entry has a `buffer()` method to read the file content and a `path` property.
   *
   * @example
   * // Basic usage
   * const zipBuffer = fs.readFileSync('invoices.zip')
   * const pdfs = await PDFUtils.extractFromBuffer(zipBuffer)
   * console.log(`Found ${pdfs.length} PDF files`)
   *
   * @example
   * // Process each PDF
   * const pdfs = await PDFUtils.extractFromBuffer(zipBuffer)
   * for (const pdf of pdfs) {
   *   console.log(`Processing: ${pdf.path}`)
   *   const content = await pdf.buffer()
   *   // Send to AI for extraction, save to disk, etc.
   * }
   *
   * @example
   * // Handle ZIP from HTTP response
   * const response = await fetch('https://example.com/documents.zip')
   * const arrayBuffer = await response.arrayBuffer()
   * const pdfs = await PDFUtils.extractFromBuffer(Buffer.from(arrayBuffer))
   */
  static async extractFromBuffer(buffer: Buffer): Promise<unzipper.File[]> {
    const directory = await unzipper.Open.buffer(Buffer.from(buffer))

    const pdfFiles = directory.files.filter((f) => {
      if (f.type !== 'File') return false
      if (!f.path.toLowerCase().endsWith('.pdf')) return false

      // Get the filename from the path
      const filename = f.path.split('/').pop() || ''

      // Exclude hidden files (starting with .)
      if (filename.startsWith('.')) return false

      // Exclude files in hidden/system directories (segments starting with . or _)
      const pathSegments = f.path.split('/')
      const hasSystemFolder = pathSegments.some(
        (segment) => segment.startsWith('.') || segment.startsWith('_')
      )
      if (hasSystemFolder) return false

      return true
    })

    return pdfFiles
  }
}
