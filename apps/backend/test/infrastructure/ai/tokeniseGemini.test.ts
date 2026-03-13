import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const FIXTURES_DIR = path.join(__dirname, 'fixtures')

// Mock the Google Generative AI module
const mockCountTokens = vi.fn()
const mockGetGenerativeModel = vi.fn()
const mockGoogleGenerativeAI = vi.fn()

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      constructor(apiKey: string) {
        mockGoogleGenerativeAI(apiKey)
      }

      getGenerativeModel(config: { model: string }) {
        mockGetGenerativeModel(config)
        return {
          countTokens: mockCountTokens,
        }
      }
    },
  }
})

describe('TokeniseGemini', () => {
  let originalEnv: typeof process.env

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }

    // Set required environment variables
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-api-key'
    process.env.MODEL_NAME = 'gemini-pro'

    // Clear all mocks
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls to getInstance', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const instance1 = TokeniseGemini.getInstance()
      const instance2 = TokeniseGemini.getInstance()

      expect(instance1).toBe(instance2)
    })

    it('should create only one instance', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const instance1 = TokeniseGemini.getInstance()
      const instance2 = TokeniseGemini.getInstance()
      const instance3 = TokeniseGemini.getInstance()

      expect(instance1).toBe(instance2)
      expect(instance2).toBe(instance3)
    })

    it('should have getInstance as a static method', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      expect(typeof TokeniseGemini.getInstance).toBe('function')
    })

    it('should have a private constructor (TypeScript compile-time check)', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      // This test documents that the constructor is private
      // TypeScript prevents direct instantiation at compile time
      const instance = TokeniseGemini.getInstance()
      expect(instance).toBeDefined()
    })

    it('should initialize GoogleGenerativeAI with API key', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      TokeniseGemini.getInstance()

      expect(mockGoogleGenerativeAI).toHaveBeenCalledWith('test-api-key')
    })

    it('should initialize generative model with model name', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      TokeniseGemini.getInstance()

      expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-pro' })
    })
  })

  describe('count()', () => {
    it('should count tokens in a simple text file', async () => {
      mockCountTokens.mockResolvedValue({ totalTokens: 42 })

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const count = await tokenizer.count(path.join(FIXTURES_DIR, 'sample.txt'))

      expect(count).toBe(42)
      expect(mockCountTokens).toHaveBeenCalledTimes(1)
      expect(mockCountTokens).toHaveBeenCalledWith({
        contents: [
          {
            role: 'user',
            parts: [{ text: expect.any(String) }],
          },
        ],
      })
    })

    it('should count tokens in an empty file', async () => {
      mockCountTokens.mockResolvedValue({ totalTokens: 0 })

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const count = await tokenizer.count(path.join(FIXTURES_DIR, 'empty.txt'))

      expect(count).toBe(0)
      expect(mockCountTokens).toHaveBeenCalledWith({
        contents: [
          {
            role: 'user',
            parts: [{ text: '' }],
          },
        ],
      })
    })

    it('should count tokens in files with special characters', async () => {
      mockCountTokens.mockResolvedValue({ totalTokens: 15 })

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const count = await tokenizer.count(path.join(FIXTURES_DIR, 'special-chars.txt'))

      expect(count).toBe(15)
      expect(mockCountTokens).toHaveBeenCalledTimes(1)
    })

    it('should handle relative file paths', async () => {
      mockCountTokens.mockResolvedValue({ totalTokens: 10 })

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const relativePath = path.relative(process.cwd(), path.join(FIXTURES_DIR, 'sample.txt'))
      const count = await tokenizer.count(relativePath)

      expect(count).toBe(10)
    })

    it('should validate file path is within base directory when baseDir is provided', async () => {
      mockCountTokens.mockResolvedValue({ totalTokens: 20 })

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const filePath = path.join(FIXTURES_DIR, 'sample.txt')
      const count = await tokenizer.count(filePath, FIXTURES_DIR)

      expect(count).toBe(20)
      expect(mockCountTokens).toHaveBeenCalledTimes(1)
    })

    it('should throw error when file path is outside base directory', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const filePath = path.join(FIXTURES_DIR, 'sample.txt')
      const wrongBaseDir = path.join(__dirname, 'wrong-dir')

      await expect(tokenizer.count(filePath, wrongBaseDir)).rejects.toThrow(
        /outside the allowed base directory/
      )
    })

    it('should throw error when trying to access parent directory with baseDir', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const filePath = path.join(FIXTURES_DIR, '../tokeniseGemini.test.ts')

      await expect(tokenizer.count(filePath, FIXTURES_DIR)).rejects.toThrow(
        /outside the allowed base directory/
      )
    })

    it('should throw error when file does not exist', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const nonExistentFile = path.join(FIXTURES_DIR, 'non-existent.txt')

      await expect(tokenizer.count(nonExistentFile)).rejects.toThrow(/Failed to read file/)
    })

    it('should throw error with file path when file cannot be read', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const invalidPath = path.join(FIXTURES_DIR, 'does-not-exist.txt')

      await expect(tokenizer.count(invalidPath)).rejects.toThrow(
        /Failed to read file ".*does-not-exist\.txt"/
      )
    })

    it('should handle API errors gracefully', async () => {
      mockCountTokens.mockRejectedValue(new Error('API quota exceeded'))

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const filePath = path.join(FIXTURES_DIR, 'sample.txt')

      await expect(tokenizer.count(filePath)).rejects.toThrow('API quota exceeded')
    })

    it('should work without baseDir parameter', async () => {
      mockCountTokens.mockResolvedValue({ totalTokens: 30 })

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const count = await tokenizer.count(path.join(FIXTURES_DIR, 'sample.txt'))

      expect(count).toBe(30)
    })
  })

  describe('Environment Variable Handling', () => {
    it('should handle missing API key gracefully', async () => {
      const originalApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = ''
      vi.resetModules()

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const instance = TokeniseGemini.getInstance()
      expect(instance).toBeDefined()

      // Should have called GoogleGenerativeAI with empty string
      expect(mockGoogleGenerativeAI).toHaveBeenCalledWith('')

      // Restore original value
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalApiKey
    })

    it('should handle missing model name gracefully', async () => {
      const originalModelName = process.env.MODEL_NAME
      process.env.MODEL_NAME = ''
      vi.resetModules()

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const instance = TokeniseGemini.getInstance()
      expect(instance).toBeDefined()

      // Should have called getGenerativeModel with empty string
      expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: '' })

      // Restore original value
      process.env.MODEL_NAME = originalModelName
    })

    it('should use obscured value for API key', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      TokeniseGemini.getInstance()

      // The obscured value should be unwrapped to the original string
      expect(mockGoogleGenerativeAI).toHaveBeenCalledWith('test-api-key')
    })
  })

  describe('Path Security', () => {
    it('should prevent path traversal attacks with ../', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const maliciousPath = path.join(FIXTURES_DIR, '../../secrets.txt')

      await expect(tokenizer.count(maliciousPath, FIXTURES_DIR)).rejects.toThrow(
        /outside the allowed base directory/
      )
    })

    it('should prevent absolute path injection', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const absolutePath = '/etc/passwd'

      await expect(tokenizer.count(absolutePath, FIXTURES_DIR)).rejects.toThrow(
        /outside the allowed base directory/
      )
    })

    it('should allow files in subdirectories of baseDir', async () => {
      mockCountTokens.mockResolvedValue({ totalTokens: 5 })

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const filePath = path.join(FIXTURES_DIR, 'sample.txt')
      const parentDir = path.dirname(FIXTURES_DIR)

      const count = await tokenizer.count(filePath, parentDir)
      expect(count).toBe(5)
    })
  })

  describe('API Integration', () => {
    it('should pass correct structure to countTokens API', async () => {
      mockCountTokens.mockResolvedValue({ totalTokens: 100 })

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      await tokenizer.count(path.join(FIXTURES_DIR, 'sample.txt'))

      // @ts-ignore
      const callArgs = mockCountTokens.mock.calls[0][0]
      expect(callArgs).toHaveProperty('contents')
      expect(callArgs.contents).toHaveLength(1)
      expect(callArgs.contents[0]).toHaveProperty('role', 'user')
      expect(callArgs.contents[0]).toHaveProperty('parts')
      expect(callArgs.contents[0].parts).toHaveLength(1)
      expect(callArgs.contents[0].parts[0]).toHaveProperty('text')
    })

    it('should return totalTokens from API response', async () => {
      const expectedTokens = 12345
      mockCountTokens.mockResolvedValue({ totalTokens: expectedTokens })

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const count = await tokenizer.count(path.join(FIXTURES_DIR, 'sample.txt'))

      expect(count).toBe(expectedTokens)
    })

    it('should handle large token counts', async () => {
      const largeTokenCount = 999999
      mockCountTokens.mockResolvedValue({ totalTokens: largeTokenCount })

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const count = await tokenizer.count(path.join(FIXTURES_DIR, 'sample.txt'))

      expect(count).toBe(largeTokenCount)
    })
  })

  describe('Edge Cases', () => {
    it('should handle files with UTF-8 encoding', async () => {
      mockCountTokens.mockResolvedValue({ totalTokens: 25 })

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const count = await tokenizer.count(path.join(FIXTURES_DIR, 'special-chars.txt'))

      expect(count).toBe(25)
      expect(mockCountTokens).toHaveBeenCalledTimes(1)
    })

    it('should work with normalized paths', async () => {
      mockCountTokens.mockResolvedValue({ totalTokens: 8 })

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const unnormalizedPath = path.join(FIXTURES_DIR, '.', 'sample.txt')
      const count = await tokenizer.count(unnormalizedPath)

      expect(count).toBe(8)
    })

    it('should handle concurrent calls', async () => {
      mockCountTokens.mockResolvedValue({ totalTokens: 10 })

      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const filePath = path.join(FIXTURES_DIR, 'sample.txt')

      const promises = [
        tokenizer.count(filePath),
        tokenizer.count(filePath),
        tokenizer.count(filePath),
      ]

      const results = await Promise.all(promises)

      expect(results).toEqual([10, 10, 10])
      expect(mockCountTokens).toHaveBeenCalledTimes(3)
    })

    it('should maintain singleton across concurrent getInstance calls', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const instances = await Promise.all([
        Promise.resolve(TokeniseGemini.getInstance()),
        Promise.resolve(TokeniseGemini.getInstance()),
        Promise.resolve(TokeniseGemini.getInstance()),
      ])

      expect(instances[0]).toBe(instances[1])
      expect(instances[1]).toBe(instances[2])
    })
  })

  describe('Error Messages', () => {
    it('should include file path in read error message', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const missingFile = 'missing-file.txt'

      await expect(tokenizer.count(missingFile)).rejects.toThrow(
        new RegExp(`Failed to read file "${missingFile}"`)
      )
    })

    it('should include both file path and base dir in validation error', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const filePath = '/etc/passwd'
      const baseDir = FIXTURES_DIR

      await expect(tokenizer.count(filePath, baseDir)).rejects.toThrow(
        new RegExp(`File path ".*" is outside the allowed base directory`)
      )
    })

    it('should preserve original error message from file system', async () => {
      const { TokeniseGemini } = await import('../../../src/infrastructure/ai/tokeniseGemini.js')

      const tokenizer = TokeniseGemini.getInstance()
      const invalidPath = path.join(FIXTURES_DIR, 'does-not-exist.txt')

      await expect(tokenizer.count(invalidPath)).rejects.toThrow(/ENOENT|no such file/)
    })
  })
})
