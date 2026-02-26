import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { CompanyDetailsPort } from '../ports/company.repository.port.js'
import type { LoggerPort } from '../ports/logger.port.js'

export class GetEmbeddingModelUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly companyDetailsRepo: CompanyDetailsPort
  ) {}

  public async execute(): Promise<void> {}
}
