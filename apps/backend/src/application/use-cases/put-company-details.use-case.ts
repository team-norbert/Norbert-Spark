import type { LoggerPort } from '../ports/logger.port.js'
import type { AuditLogPort } from '../ports/audit-log.port.js'
import type { CompanyDetailsPort } from '../ports/company.repository.port.js'
import type { AuditContext } from '../../domain/audit/audit-context.js'
import type { CompanyUpdate, KeyPersonUpdate } from '../dtos/update-company.dto.js'
import { AuditAction, EntityType } from '../../domain/audit/entity-type.enum.js'
import { Uuid } from '../../domain/value-objects/uuid.js'

export type UpdateCompanyDetailsData = {
  company?: CompanyUpdate
  keyPerson?: KeyPersonUpdate
}

export class PutCompanyDetailsUseCase {
  constructor(
    private readonly logger: LoggerPort,
    private readonly auditLog: AuditLogPort,
    private readonly companyDetailsRepo: CompanyDetailsPort
  ) {}

  async execute(auditContext: AuditContext, data: UpdateCompanyDetailsData): Promise<any> {
    // Business logic to update company details goes here
    // This is a placeholder implementation
    let resultPutCompanyDetails
    let resultPutKeyPersonDetails
    if (data.company) {
      resultPutCompanyDetails = await this.companyDetailsRepo.putCompanyDetails(data.company)
    }
    if (data.keyPerson) {
      resultPutKeyPersonDetails = await this.companyDetailsRepo.putKeyPersonDetails(data.keyPerson)
    }

    if (resultPutCompanyDetails) {
      try {
        await this.auditLog.log({
          userId: auditContext.userId,
          entityType: EntityType.COMPANY,
          entityId: new Uuid(data?.company?.companyId as string).getValue(),
          action: AuditAction.UPDATE,
          changes: {
            reason: 'company_details_updated_successfully',
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent ?? undefined,
        })
      } catch (error) {
        this.logger.error('Error logging audit for company details retrieval', error as Error, {
          userId: auditContext.userId,
        })
      }
    }

    if (resultPutKeyPersonDetails) {
      try {
        await this.auditLog.log({
          userId: auditContext.userId,
          entityType: EntityType.KEY_PERSON,
          entityId: new Uuid(data?.keyPerson?.keyPersonId as string).getValue(),
          action: AuditAction.UPDATE,
          changes: {
            reason: 'key_person_details_updated_successfully',
          },
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent ?? undefined,
        })
      } catch (error) {
        this.logger.error('Error logging audit for key person details retrieval', error as Error, {
          userId: auditContext.userId,
        })
      }
    }

    return {
      company: resultPutCompanyDetails,
      keyPerson: resultPutKeyPersonDetails,
    }
  }
}
