import type { components } from '@norberts-spark/shared/openapi-types'

import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { CompanyDetailsPort } from '../ports/company.repository.port.js'
import type { LoggerPort } from '../ports/logger.port.js'
//components['schemas']['AIEmbeddingModels']['data']
export class GetEmbeddingModelUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly companyDetailsRepo: CompanyDetailsPort
  ) {}

  public async execute(): Promise<components['schemas']['AIEmbeddingModels']['data']> {
    this.logger.info('GetEmbeddingModelUseCase.execute', {})
    // TODO: Implement fetching a single embedding model
    throw new Error('GetEmbeddingModelUseCase.execute is not implemented yet')
  }
}
