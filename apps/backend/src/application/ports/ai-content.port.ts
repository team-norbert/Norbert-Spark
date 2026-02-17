import type { DBChatType } from '../../infrastructure/database/schema.js'
import { PutChatTypeDto } from '../dtos/put-chat-type.dto.js'
import type { QueryResult } from 'pg'

export interface AIContentPort {
  fetchChatContent(): Promise<DBChatType[]>
  resolveChatTypeByParam(param: string): Promise<string | null>
  putChatTypeDetails(details: PutChatTypeDto): Promise<QueryResult | null>
}
