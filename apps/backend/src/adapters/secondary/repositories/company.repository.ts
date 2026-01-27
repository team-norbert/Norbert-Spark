import type { DBCompanySelect, DBKeyPersonSelect } from '../../../infrastructure/database/schema.js'
import { company, keyPerson } from '../../../infrastructure/database/schema.js'
import { db } from '../../../infrastructure/database/index.js'
import type { CompanyDetailsPort } from '../../../application/ports/company.repository.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'

export class CompanyRepository implements CompanyDetailsPort {
  constructor(private readonly logger: LoggerPort) {}
  async getCompanyDetails(): Promise<DBCompanySelect | null> {
    this.logger.info('Fetching company details from the database')

    try {
      const [companyDetails] = await db.select().from(company).limit(1)
      return companyDetails ?? null
    } catch (error) {
      this.logger.error('Error fetching company details', error as Error)
      throw error
    }
  }
  async getKeyPersonDetails(): Promise<DBKeyPersonSelect | null> {
    this.logger.info('Fetching key person details from the database')

    try {
      const [keyPersonDetails] = await db.select().from(keyPerson).limit(1)
      return keyPersonDetails ?? null
    } catch (error) {
      this.logger.error('Error fetching key person details', error as Error)
      throw error
    }
  }
}
