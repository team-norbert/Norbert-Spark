export type AuditContext = {
  readonly userId: string | null
  readonly ipAddress: string
  readonly userAgent: string | null
}
