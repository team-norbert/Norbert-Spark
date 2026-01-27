export const EntityType = {
  USER: 'user',
  CHAT: 'chat',
  MESSAGE: 'message',
  PART: 'part',
  AI_OPTIONS: 'ai_options',
  DATA_EXTRACTION: 'data_extraction',
  COMPANY: 'company',
} as const

export const AuditAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  FETCH: 'fetch',
  LOGIN_FAILED: 'login_failed',
  PASSWORD_CHANGE: 'password_change',
  EMAIL_CHANGE: 'email_change',
  REGISTRATION_FAILED: 'registration_failed',
} as const

export type EntityType = (typeof EntityType)[keyof typeof EntityType]
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction]
