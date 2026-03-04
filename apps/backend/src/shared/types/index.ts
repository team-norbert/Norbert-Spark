import { type UIMessage, type UIMessagePart } from 'ai'
import { z } from 'zod'

import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { UUIDType } from '../../domain/value-objects/uuid.js'
import { EnvConfig } from '../../infrastructure/config/env.config.js'
import type { DBChatType } from '../../infrastructure/database/schema.js'

export const metadataSchema = z.object({})

export const dataPartSchema = z.object({
  darkness: z.object({
    response: z.string().optional(),
    loading: z.boolean().default(true),
  }),
})

export type MyDataPart = z.infer<typeof dataPartSchema>

// UIMessagePart requires 2 type arguments: data part and tools
// Since we're not using custom tools types, we use never for the tools parameter
export type MyUIMessagePart = UIMessagePart<MyDataPart, never>

export type JwtUserClaims = {
  sub: UserIdType
  email: string
  roles?: string[]
}

export namespace DB {
  // Types for our persistence layer
  export interface Chat {
    id: string
    messages: UIMessage[]
    createdAt: string
    updatedAt: string
  }

  export interface PersistenceData {
    chats: DB.Chat[]
  }
}

export type PutChatDetailsType = Pick<DBChatType, 'id'> &
  Partial<Pick<DBChatType, 'name' | 'description' | 'seoFriendlyId'>>

export type auditContextType = {
  userId: UserIdType | null
  ipAddress: string | null
  userAgent: string | null
  level: string
  time: Date
  event?: string
  requestId: UUIDType | null
  method: string
  route: string | undefined
  statusCode: number
  durationMs: number | undefined
  service: string
  env: string
  version: string
  additionalInfo?: Record<string, unknown>
}

/**
 * Input type for creating an audit context with optional fields that have defaults.
 */
export type CreateAuditContextInput = Omit<
  auditContextType,
  'service' | 'version' | 'time' | 'env' | 'level'
> & {
  service?: string
}

/**
 * Creates an audit context with default values.
 * @param input - The audit context input with optional service (defaults to 'norberts-spark-backend')
 * @returns A fully populated audit context
 */
export function createAuditContext(input: CreateAuditContextInput): auditContextType {
  return {
    ...input,
    time: new Date(),
    service: input.service ?? 'norberts-spark-backend',
    version: '1.0.0',
    env: EnvConfig.NODE_ENV,
    level: EnvConfig.LOG_LEVEL,
  }
}

/**
 * {
 *   "level": "info",
 *   "time": 1740700800000,
 *   "event": "http.request.completed",
 *   "requestId": "01950000-0000-7000-8000-000000000001",
 *   "userId": "01950000-0000-7000-8000-000000000002",
 *   "method": "GET",
 *   "route": "/api/v1/ai/chats/:userId",
 *   "statusCode": 200,
 *   "durationMs": 37,
 *   "service": "norberts-spark-backend",
 *   "env": "production",
 *   "version": "1.0.0"
 * }
 */
