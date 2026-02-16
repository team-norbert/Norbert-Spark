import type { DBChatType } from '../../infrastructure/database/schema.js'

export interface AIContentPort {
  fetchChatContent(): Promise<DBChatType[]>
  resolveChatTypeByParam(param: string): Promise<string | null>
}
