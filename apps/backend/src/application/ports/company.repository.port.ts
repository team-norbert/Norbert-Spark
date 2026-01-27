import type { DBCompanySelect, DBKeyPersonSelect } from '../../infrastructure/database/schema.js'

export interface CompanyDetailsPort {
  getCompanyDetails(): Promise<DBCompanySelect | null>
  getKeyPersonDetails(): Promise<DBKeyPersonSelect | null>
  putCompanyDetails(data: Partial<DBCompanySelect>): Promise<DBCompanySelect | null>
  putKeyPersonDetails(data: Partial<DBKeyPersonSelect>): Promise<DBKeyPersonSelect | null>
}
