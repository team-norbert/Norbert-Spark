import { AIRAGRepository } from '../../adapters/secondary/repositories/ai-rag.repository.js'
import type { DBEmbeddingModelSelect } from '../../infrastructure/database/schema.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { LoggerPort } from '../ports/logger.port.js'

/**
 * Application use case for retrieving all available embedding models.
 *
 * Orchestrates fetching the full list of embedding models from the data store
 * and returns them ordered by creation date descending. Any database error
 * propagates up so the HTTP layer can respond with an appropriate error status.
 *
 * This use case sits in the application layer and has no knowledge of HTTP
 * transport or UI concerns — it depends only on the domain types and the
 * `AIRAGRepository` infrastructure contract.
 */
export class GetEmbeddingModelUseCase {
  /**
   * @param logger - Structured logger used to record execution telemetry.
   * @param auditLog - Audit log port reserved for future audit trail writes.
   * @param aiRagRepository - Repository that provides access to the `embedding_models` table.
   */
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly aiRagRepository: AIRAGRepository
  ) {}

  /**
   * Executes the use case.
   *
   * Fetches all embedding model records from the repository, ordered by
   * `createdAt` descending. Any database error propagates to the caller.
   *
   * @returns A promise that resolves to an array of `DBEmbeddingModelSelect`
   *   records.
   */
  public async execute(): Promise<DBEmbeddingModelSelect[]> {
    this.logger.info('Fetching embedding models', { event: 'embedding_model.fetch.attempt' })
    return this.aiRagRepository.getAllEmbeddingModels()
  }
}
