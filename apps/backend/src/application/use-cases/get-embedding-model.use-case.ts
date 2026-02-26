import { AIRAGRepository } from '../../adapters/secondary/repositories/ai-rag.repository.js'
import type { DBEmbeddingModelSelect } from '../../infrastructure/database/schema.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { LoggerPort } from '../ports/logger.port.js'

/**
 * Application use case for retrieving all available embedding models.
 *
 * Orchestrates fetching the full list of embedding models from the data store
 * and returns them ordered by creation date descending. Falls back to an empty
 * array when the repository returns `undefined` (e.g. when no rows exist).
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
   * `createdAt` descending. If the repository returns `undefined` (no rows),
   * an empty array is returned instead.
   *
   * @returns A promise that resolves to an array of `DBEmbeddingModelSelect`
   *   records, or an empty array when none exist.
   */
  public async execute(): Promise<DBEmbeddingModelSelect[]> {
    this.logger.info('GetEmbeddingModelUseCase.execute', {})
    return (await this.aiRagRepository.getAllEmbeddingModels()) || []
  }
}
