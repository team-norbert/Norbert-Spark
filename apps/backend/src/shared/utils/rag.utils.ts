import type { EmbeddingModelV3 } from '@ai-sdk/provider'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { isDefined } from '@norberts-spark/shared'
import { embed, embedMany } from 'ai'
import { createHash } from 'crypto'

import type { LoggerPort } from '../../application/ports/logger.port.js'
import { InternalErrorException } from '../exceptions/internal-error.exception.js'
import { loadProvider } from './provider-loader-map.util.js'

export class RAGUtils {
  constructor(private logger: LoggerPort) {}

  generateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex')
  }

  async chunking(
    chunkSize: number,
    chunkOverlap: number,
    content: string,
    separators: string[] = [' ']
  ): Promise<string[]> {
    this.logger.info('Starting text chunking', {
      event: 'rag.chunking.started',
      chunkSize,
      chunkOverlap,
      content: content.substring(0, 100),
      separators,
    })
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators,
    })
    try {
      const chunks = await textSplitter.splitText(content.trim())
      this.logger.info('Text chunking completed', {
        event: 'rag.chunking.completed',
        chunkCount: chunks.length,
      })
      return chunks
    } catch (error: unknown) {
      this.logger.error(
        'Text chunking failed',
        error instanceof Error ? error : new Error(String(error)),
        { event: 'rag.chunking.failed' }
      )
      return []
    }
  }

  async generateEmbedding(
    chunks: string,
    modelName: string,
    modelProvider: string
  ): Promise<number[]> {
    const input = chunks.replaceAll('\n', ' ')

    const provider = (await loadProvider(modelProvider)) as {
      embeddingModel: (modelId: string) => EmbeddingModelV3
    }

    const { embedding } = await embed({
      model: provider.embeddingModel(modelName),
      value: input,
    })

    return embedding
  }

  async generateEmbeddings(
    chunks: string[],
    modelName: string | undefined,
    modelProvider: string | undefined
  ): Promise<number[][]> {
    if (!isDefined(modelName) || !isDefined(modelProvider)) {
      throw new InternalErrorException('Model name and provider are required')
    }

    this.logger.info('Generating embeddings', {
      event: 'rag.embeddings.started',
      chunkCount: chunks.length,
      modelName,
      modelProvider,
    })
    const inputs = chunks.map((text) => text.replaceAll('\n', ' '))

    const provider = (await loadProvider(modelProvider)) as {
      embeddingModel: (modelId: string) => EmbeddingModelV3
    }

    const { embeddings } = await embedMany({
      model: provider.embeddingModel(modelName),
      values: inputs,
    })

    return embeddings
  }
}
