import type { DBChatType } from '../../infrastructure/database/schema.js'

export interface AIContentPort {
  fetchChatContent(): Promise<DBChatType[]>
}
