import * as fs from 'node:fs/promises'
import path from 'node:path'

import { z } from 'zod'

import { TypeException } from '../../shared/exceptions/type.exception.js'

const FileExtensionSchema = z.string().regex(/\.(txt|csv|json|toon|onnx|safetensors|pt|py|gguf)$/i)

type FilePathSchema = z.infer<typeof FileExtensionSchema>

/**
 * Use case for retrieving text file content with caching
 *
 * Manages text file retrieval operations with built-in caching to optimize
 * repeated file access. Validates file extensions and handles file system
 * errors gracefully.
 *
 * @class
 *
 * @remarks
 * This use case follows the Clean Architecture pattern, encapsulating business
 * logic for file content retrieval. It maintains an internal cache to improve
 * performance when accessing the same files multiple times.
 *
 * Features:
 * - File extension validation for supported formats
 * - In-memory caching of file contents
 * - Clear error messages for file not found scenarios
 * - Support for multiple file formats (txt, csv, json, etc.)
 *
 * @example
 * ```typescript
 * // Create use case instance
 * const getTextUseCase = new GetTextUseCase('data', 'heart-of-darkness.txt')
 *
 * // Retrieve file content
 * const content = await getTextUseCase.execute()
 *
 * // Check if content is cached
 * if (getTextUseCase.hasCachedContent(getTextUseCase.filePath)) {
 *   const cached = getTextUseCase.getCachedContent(getTextUseCase.filePath)
 * }
 * ```
 *
 * @see {@link FileExtensionSchema} for supported file types
 */
export class GetTextUseCase {
  private readonly fileContents: Map<string, string>
  private readonly file: string
  public readonly filePath: string

  /**
   * Create a new GetTextUseCase instance
   *
   * @param dataFolder - The data folder name (e.g., 'data')
   * @param fileName - The file name to read (e.g., 'heart-of-darkness.txt')
   * @throws {z.ZodError} If the file extension is not supported
   *
   * @example
   * ```typescript
   * const useCase = new GetTextUseCase('data', 'document.txt')
   * ```
   */
  constructor(dataFolder: string, fileName: FilePathSchema) {
    try {
      FileExtensionSchema.parse(fileName)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new TypeException(
          `Invalid file extension for "${fileName}". Supported extensions are: .txt, .csv, .json, .toon, .onnx, .safetensors, .pt, .py, .gguf`,
          { cause: error }
        )
      }
    }
    this.file = fileName
    this.filePath = path.join(process.cwd(), dataFolder, fileName)
    this.fileContents = new Map<string, string>()
  }

  /**
   * Execute the use case to retrieve text content from a file
   *
   * Reads the file from the file system and caches the content for future access.
   * Returns undefined if the file is empty.
   *
   * @returns The file content as a string, or undefined if empty
   * @throws {Error} If file cannot be read or does not exist
   *
   * @example
   * ```typescript
   * const content = await getTextUseCase.execute()
   * if (content) {
   *   console.log(`File contains ${content.length} characters`)
   * }
   * ```
   */
  public async execute(): Promise<string | undefined> {
    try {
      // Read file content - will throw ENOENT if file doesn't exist
      const content = await fs.readFile(this.filePath, 'utf8')

      // Return undefined if content is empty
      if (!content) {
        return undefined
      }

      // Save the successfully retrieved content to cache
      this.fileContents.set(this.filePath, content)
      return content
    } catch (error) {
      // Handle file not found error
      const nodeError = error as NodeJS.ErrnoException
      if (nodeError.code === 'ENOENT') {
        throw new Error(`Error reading file "${this.filePath}": File not found: ${this.file}`, {
          cause: error,
        })
      }
      // Handle other errors
      throw new Error(
        `Error reading file "${this.filePath}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        { cause: error }
      )
    }
  }

  /**
   * Get cached file content from state
   *
   * @param textPath - The file path to retrieve from cache
   * @returns The cached file content, or undefined if not in cache
   *
   * @example
   * ```typescript
   * const cached = getTextUseCase.getCachedContent('/path/to/file.txt')
   * ```
   */
  public getCachedContent(textPath: string): string | undefined {
    return this.fileContents.get(textPath)
  }

  /**
   * Check if a file's content is cached
   *
   * @param textPath - The file path to check in cache
   * @returns True if the file content is cached
   *
   * @example
   * ```typescript
   * if (getTextUseCase.hasCachedContent(filePath)) {
   *   const content = getTextUseCase.getCachedContent(filePath)
   * }
   * ```
   */
  public hasCachedContent(textPath: string): boolean {
    return this.fileContents.has(textPath)
  }

  /**
   * Clear cached content for a specific file or all files
   *
   * @param textPath - Optional path to clear specific file, or clear all if not provided
   *
   * @example
   * ```typescript
   * // Clear specific file
   * getTextUseCase.clearCache('/path/to/file.txt')
   *
   * // Clear all cached files
   * getTextUseCase.clearCache()
   * ```
   */
  public clearCache(textPath?: string): void {
    if (textPath) {
      this.fileContents.delete(textPath)
    } else {
      this.fileContents.clear()
    }
  }

  /**
   * Get all cached file paths
   *
   * @returns Array of cached file paths
   *
   * @example
   * ```typescript
   * const cachedPaths = getTextUseCase.getCachedPaths()
   * console.log(`${cachedPaths.length} files cached`)
   * ```
   */
  public getCachedPaths(): string[] {
    return Array.from(this.fileContents.keys())
  }
}
