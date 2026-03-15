/**
 * Type-safe change structures for audit logs
 *
 * These types provide better type safety and autocomplete support
 * for different audit log actions instead of using Record<string, any>.
 */

/**
 * Changes tracked when an entity is created
 */
export interface CreateChanges {
  created: Record<string, unknown>
}

/**
 * Changes tracked when an entity is updated
 *
 * Can optionally capture the state before and after the update.
 * Use 'reason' for simple tracking or 'before'/'after' for detailed change tracking.
 */
export interface UpdateChanges {
  reason?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
}

export interface FileUploadChanges {
  reason: string
  fileType?: string
  fileSize?: number
  fileName?: string
  [key: string]: unknown
}
/**
 * Changes tracked when an entity is deleted
 */
export interface DeleteChanges {
  deleted: Record<string, unknown>
}

/**
 * Metadata tracked for successful login attempts
 */
export interface LoginChanges {
  success: boolean
  method?: string
  sessionDuration?: string
  [key: string]: unknown
}

/**
 * Metadata tracked for failed login attempts
 */
export interface LoginFailedChanges {
  email?: string
  reason: string
  [key: string]: unknown
}

export interface ChatTypeChange {
  reason: string
  [key: string]: unknown
}

/**
 * Metadata tracked for logout actions
 */
export interface LogoutChanges {
  reason?: string
  sessionDuration?: string
  [key: string]: unknown
}

/**
 * Metadata tracked for password change actions
 */
export interface PasswordChangeChanges {
  success: boolean
  method?: string
  [key: string]: unknown
}

/**
 * Metadata tracked for email change actions
 */
export interface EmailChangeChanges {
  before?: string
  after?: string
  verified?: boolean
  [key: string]: unknown
}

/**
 * Metadata tracked for failed registration attempts
 */
export interface RegistrationFailedChanges {
  email?: string
  reason: string
  [key: string]: unknown
}

/**
 * Metadata tracked for successful registration
 */
export interface RegistrationSuccessChanges {
  email: string
  reason: string
  [key: string]: unknown
}

export interface FetchChatChanges {
  reason: string
  chatIds: string[]
  [key: string]: unknown
}

export interface FetchChatFailedChanges {
  reason: string
  errorMessage: string
  [key: string]: unknown
}

/**
 * Metadata recorded when a user message is assessed for prompt injection.
 * Only written when the decision is 'flag' or 'block'.
 */
export interface PromptInjectionChanges {
  /** Risk score produced by the classifier (sum of matched pattern weights). */
  score: number
  /** Classifier verdict for this message. */
  decision: 'flag' | 'block'
  /** Human-readable labels for each matched pattern, e.g. 'instruction-override'. */
  reasons: string[]
  /**
   * Hash of the NFKC-normalised, zero-width-stripped, lowercase text that was assessed.
   *
   * NOTE: Do not store the full prompt text in audit logs. Use a one-way hash (e.g. SHA-256)
   * of the normalised text instead so prompts can be correlated without persisting PII/secrets.
   */
  normalizedTextHash?: string
  /**
   * Optional, truncated excerpt of the normalised text for debugging purposes.
   *
   * This MUST be limited to a short prefix (e.g. first N characters) and must not contain
   * the full prompt text to avoid leaking PII/secrets into long-lived audit logs.
   */
  normalizedTextExcerpt?: string
  /** Zero-based index of the offending message within the request messages array. */
  messageIndex: number
  /** The `id` field of the offending message. */
  messageId: string
}

/**
 * Union type of all possible change structures
 * This provides type safety while allowing flexibility for different audit actions
 */
export type AuditChanges =
  | CreateChanges
  | UpdateChanges
  | DeleteChanges
  | LoginChanges
  | LoginFailedChanges
  | LogoutChanges
  | PasswordChangeChanges
  | EmailChangeChanges
  | RegistrationFailedChanges
  | RegistrationSuccessChanges
  | FetchChatChanges
  | FetchChatFailedChanges
  | ChatTypeChange
  | FileUploadChanges
  | PromptInjectionChanges
  | Record<string, unknown> // Fallback for custom change structures
