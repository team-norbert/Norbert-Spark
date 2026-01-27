import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { CompanyDetailsPort } from '../ports/company.repository.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import type { DBCompanySelect, DBKeyPersonSelect } from '../../infrastructure/database/schema.js'

export class GetCompanyDetailsUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly companyDetailsRepo: CompanyDetailsPort
  ) {}

  async execute(auditContext: AuditContext): Promise<{
    company: DBCompanySelect | null
    keyPerson: DBKeyPersonSelect | null
  }> {
    this.logger.info('Fetching company details')

    const [company, keyPerson] = await Promise.all([
      this.companyDetailsRepo.getCompanyDetails(),
      this.companyDetailsRepo.getKeyPersonDetails(),
    ])

    try {
      await this.auditLog.log({
        userId: auditContext.userId,
        entityType: EntityType.COMPANY,
        entityId: auditContext.userId,
        action: AuditAction.FETCH,
        changes: {
          reason: 'chat_successfully_retrieved_by_userid',
        },
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent ?? undefined,
      })
    } catch (error) {
      this.logger.error('Error logging audit for chat retrieval', error as Error, {
        userId: auditContext.userId,
      })
    }

    this.logger.info('Company details fetched successfully')
    return { company, keyPerson }
  }
}
