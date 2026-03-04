export const EntityType = {
  USER: 'user',
  CHAT: 'chat',
  CHAT_TYPE: 'chat_type',
  MESSAGE: 'message',
  PART: 'part',
  AI_OPTIONS: 'ai_options',
  DATA_EXTRACTION: 'data_extraction',
  COMPANY: 'company',
  KEY_PERSON: 'key_person',
  TOKEN: 'token',
} as const

export const AuditAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  FETCH: 'fetch',
  FETCH_FAILED: 'fetch_failed',
  LOGIN_FAILED: 'login_failed',
  PASSWORD_CHANGE: 'password_change',
  EMAIL_CHANGE: 'email_change',
  REGISTRATION_FAILED: 'registration_failed',
  TOKEN_ISSUED: 'token_issued', // Login or OAuth sync (initial issuance)
  TOKEN_REFRESHED: 'token_refreshed', // Successful token refresh
  REFRESH_TOKEN_REPLAY_DETECTED: 'refresh_token_replay_detected', // Revoked token presented — potential attack
  REFRESH_FAMILY_REVOKED: 'refresh_family_revoked', // Entire token family revoked due to replay
  USER_LOGOUT: 'user_logout', // User explicitly logged out
  REFRESH_TOKENS_EXPIRED_CLEANUP: 'refresh_tokens_expired_cleanup', // Entire token family revoked due to replay
} as const

export type EntityType = (typeof EntityType)[keyof typeof EntityType]
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction]
