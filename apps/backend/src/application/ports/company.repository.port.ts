import type { DBCompanySelect, DBKeyPersonSelect } from '../../infrastructure/database/schema.js'

export interface CompanyDetailsPort {
  getCompanyDetails(): Promise<DBCompanySelect | null>
  getKeyPersonDetails(): Promise<DBKeyPersonSelect | null>
}
