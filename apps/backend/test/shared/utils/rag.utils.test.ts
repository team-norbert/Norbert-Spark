import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { embed, embedMany } from 'ai'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InternalErrorException } from '../../../src/shared/exceptions/internal-error.exception.js'
import { loadProvider } from '../../../src/shared/utils/provider-loader-map.util.js'
import { RAGUtils } from '../../../src/shared/utils/rag.utils.js'
import { createMockLogger } from '../../shared/factories/logger.factory.js'

vi.mock('@langchain/textsplitters', () => ({
  RecursiveCharacterTextSplitter: vi.fn(),
}))

vi.mock('../../../src/shared/utils/provider-loader-map.util.js', () => ({
  loadProvider: vi.fn(),
}))

vi.mock('ai', () => ({
  embed: vi.fn(),
  embedMany: vi.fn(),
}))

describe('RAGUtils', () => {
  let ragUtils: RAGUtils
  let mockLogger: ReturnType<typeof createMockLogger>
  let mockSplitText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockLogger = createMockLogger()
    ragUtils = new RAGUtils(mockLogger)

    mockSplitText = vi.fn().mockResolvedValue(['chunk1', 'chunk2'])
    vi.mocked(RecursiveCharacterTextSplitter).mockImplementation(
      class {
        splitText = mockSplitText
      } as any
    )
  })

  describe('generateChecksum', () => {
    it('should return a 64-character lowercase hex string (SHA-256)', () => {
      const result = ragUtils.generateChecksum('hello world')
      expect(result).toHaveLength(64)
      expect(result).toMatch(/^[0-9a-f]+$/)
    })

    it('should return the correct SHA-256 hex digest for known input', () => {
      // SHA-256 of 'hello' = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
      const result = ragUtils.generateChecksum('hello')
      expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
    })

    it('should return different checksums for different content', () => {
      const a = ragUtils.generateChecksum('foo')
      const b = ragUtils.generateChecksum('bar')
      expect(a).not.toBe(b)
    })

    it('should return the same checksum for the same content', () => {
      const content = 'deterministic content'
      expect(ragUtils.generateChecksum(content)).toBe(ragUtils.generateChecksum(content))
    })
  })

  describe('chunking', () => {
    it('should log "Starting text chunking" with event "rag.chunking.started"', async () => {
      await ragUtils.chunking(100, 10, 'some content')

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting text chunking',
        expect.objectContaining({ event: 'rag.chunking.started' })
      )
    })

    it('should include chunkSize, chunkOverlap, contentLength, separators in the start log', async () => {
      await ragUtils.chunking(200, 20, 'hello world', ['\n'])

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting text chunking',
        expect.objectContaining({
          chunkSize: 200,
          chunkOverlap: 20,
          contentLength: 11,
          separators: ['\n'],
        })
      )
    })

    it('should include contentChecksum in the start log', async () => {
      await ragUtils.chunking(100, 10, 'abc')
      const expectedChecksum = ragUtils.generateChecksum('abc')

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting text chunking',
        expect.objectContaining({ contentChecksum: expectedChecksum })
      )
    })

    it('should instantiate RecursiveCharacterTextSplitter with the supplied options', async () => {
      await ragUtils.chunking(500, 50, 'content', ['\n', ' '])

      expect(RecursiveCharacterTextSplitter).toHaveBeenCalledWith({
        chunkSize: 500,
        chunkOverlap: 50,
        separators: ['\n', ' '],
      })
    })

    it('should use [" "] as the default separator', async () => {
      await ragUtils.chunking(100, 10, 'content')

      expect(RecursiveCharacterTextSplitter).toHaveBeenCalledWith(
        expect.objectContaining({ separators: [' '] })
      )
    })

    it('should call splitText with trimmed content', async () => {
      await ragUtils.chunking(100, 10, '  padded content  ')

      expect(mockSplitText).toHaveBeenCalledWith('padded content')
    })

    it('should log "Text chunking completed" with event "rag.chunking.completed"', async () => {
      await ragUtils.chunking(100, 10, 'content')

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Text chunking completed',
        expect.objectContaining({ event: 'rag.chunking.completed' })
      )
    })

    it('should include chunkCount in the completion log', async () => {
      mockSplitText.mockResolvedValue(['a', 'b', 'c'])
      await ragUtils.chunking(100, 10, 'content')

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Text chunking completed',
        expect.objectContaining({ chunkCount: 3 })
      )
    })

    it('should return the chunks produced by the text splitter', async () => {
      mockSplitText.mockResolvedValue(['part1', 'part2'])
      const result = await ragUtils.chunking(100, 10, 'content')

      expect(result).toEqual(['part1', 'part2'])
    })

    it('should log "Text chunking failed" with event "rag.chunking.failed" on error', async () => {
      const error = new Error('split failed')
      mockSplitText.mockRejectedValue(error)

      await expect(ragUtils.chunking(100, 10, 'content')).rejects.toThrow('split failed')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Text chunking failed',
        error,
        expect.objectContaining({ event: 'rag.chunking.failed' })
      )
    })

    it('should re-throw the original error after logging', async () => {
      const error = new Error('upstream failure')
      mockSplitText.mockRejectedValue(error)

      await expect(ragUtils.chunking(100, 10, 'content')).rejects.toBe(error)
    })

    it('should wrap non-Error throws in an Error for the logger', async () => {
      mockSplitText.mockRejectedValue('string error')

      await expect(ragUtils.chunking(100, 10, 'content')).rejects.toBe('string error')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Text chunking failed',
        expect.any(Error),
        expect.objectContaining({ event: 'rag.chunking.failed' })
      )
    })
  })

  describe('generateEmbedding', () => {
    const mockEmbeddingModel = vi.fn()
    const mockProvider = { embeddingModel: vi.fn().mockReturnValue(mockEmbeddingModel) }

    beforeEach(() => {
      vi.mocked(loadProvider).mockResolvedValue(mockProvider as any)
      vi.mocked(embed).mockResolvedValue({ embedding: [0.1, 0.2, 0.3] } as any)
    })

    it('should replace newlines with spaces before embedding', async () => {
      await ragUtils.generateEmbedding('line1\nline2\nline3', 'model', 'provider')

      expect(embed).toHaveBeenCalledWith(expect.objectContaining({ value: 'line1 line2 line3' }))
    })

    it('should preserve existing spaces when there are no newlines', async () => {
      await ragUtils.generateEmbedding('hello world', 'model', 'provider')

      expect(embed).toHaveBeenCalledWith(expect.objectContaining({ value: 'hello world' }))
    })

    it('should call loadProvider with the supplied modelProvider', async () => {
      await ragUtils.generateEmbedding('text', 'my-model', 'my-provider')

      expect(loadProvider).toHaveBeenCalledWith('my-provider')
    })

    it('should call provider.embeddingModel with the supplied modelName', async () => {
      await ragUtils.generateEmbedding('text', 'my-model', 'my-provider')

      expect(mockProvider.embeddingModel).toHaveBeenCalledWith('my-model')
    })

    it('should return the embedding produced by the AI SDK', async () => {
      vi.mocked(embed).mockResolvedValue({ embedding: [1, 2, 3] } as any)

      const result = await ragUtils.generateEmbedding('text', 'model', 'provider')

      expect(result).toEqual([1, 2, 3])
    })
  })

  describe('generateEmbeddings', () => {
    const mockEmbeddingModel = vi.fn()
    const mockProvider = { embeddingModel: vi.fn().mockReturnValue(mockEmbeddingModel) }

    beforeEach(() => {
      vi.mocked(loadProvider).mockResolvedValue(mockProvider as any)
      vi.mocked(embedMany).mockResolvedValue({ embeddings: [[0.1], [0.2]] } as any)
    })

    it('should throw InternalErrorException when modelName is undefined', async () => {
      await expect(
        ragUtils.generateEmbeddings(['chunk'], undefined, 'provider')
      ).rejects.toBeInstanceOf(InternalErrorException)
    })

    it('should throw InternalErrorException when modelProvider is undefined', async () => {
      await expect(
        ragUtils.generateEmbeddings(['chunk'], 'model', undefined)
      ).rejects.toBeInstanceOf(InternalErrorException)
    })

    it('should throw with "Model name and provider are required"', async () => {
      await expect(ragUtils.generateEmbeddings(['chunk'], undefined, undefined)).rejects.toThrow(
        'Model name and provider are required'
      )
    })

    it('should log "Generating embeddings" with event "rag.embeddings.started"', async () => {
      await ragUtils.generateEmbeddings(['a', 'b'], 'model', 'provider')

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Generating embeddings',
        expect.objectContaining({ event: 'rag.embeddings.started' })
      )
    })

    it('should include chunkCount, modelName, and modelProvider in the start log', async () => {
      await ragUtils.generateEmbeddings(['x', 'y', 'z'], 'embed-model', 'openai')

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Generating embeddings',
        expect.objectContaining({
          chunkCount: 3,
          modelName: 'embed-model',
          modelProvider: 'openai',
        })
      )
    })

    it('should replace newlines with spaces in each chunk before embedding', async () => {
      await ragUtils.generateEmbeddings(['line1\nline2', 'foo\nbar'], 'model', 'provider')

      expect(embedMany).toHaveBeenCalledWith(
        expect.objectContaining({ values: ['line1 line2', 'foo bar'] })
      )
    })

    it('should call loadProvider with the supplied modelProvider', async () => {
      await ragUtils.generateEmbeddings(['text'], 'model', 'my-provider')

      expect(loadProvider).toHaveBeenCalledWith('my-provider')
    })

    it('should call provider.embeddingModel with the supplied modelName', async () => {
      await ragUtils.generateEmbeddings(['text'], 'my-model', 'provider')

      expect(mockProvider.embeddingModel).toHaveBeenCalledWith('my-model')
    })

    it('should return the embeddings produced by the AI SDK', async () => {
      vi.mocked(embedMany).mockResolvedValue({
        embeddings: [
          [1, 2],
          [3, 4],
        ],
      } as any)

      const result = await ragUtils.generateEmbeddings(['a', 'b'], 'model', 'provider')

      expect(result).toEqual([
        [1, 2],
        [3, 4],
      ])
    })
  })
})
