import type { EmbeddingModelV3 } from '@ai-sdk/provider'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { embed, embedMany } from 'ai'
import { createHash } from 'crypto'

import type { LoggerPort } from '../../application/ports/logger.port.js'
import { loadProvider } from './provider-loader-map.util.js'

export class RAGUtils {
  constructor(private logger: LoggerPort) {}

  generateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex')
  }

  async chunking(
    chunkSize: number,
    chunkOverlap: number,
    separators: string[] = [' '],
    content: string
  ): Promise<string[]> {
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
    text: string,
    modelName: string,
    modelProvider: string
  ): Promise<number[]> {
    const input = text.replaceAll('\n', ' ')

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
    texts: string[],
    modelName: string,
    modelProvider: string
  ): Promise<number[][]> {
    const inputs = texts.map((text) => text.replaceAll('\n', ' '))

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
