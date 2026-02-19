import type { DBChatType } from '../../infrastructure/database/schema.js'
import { PutChatTypeDto } from '../dtos/put-chat-type.dto.js'
import type { QueryResult } from 'pg'
import type { ChatTypeInsertDto } from '../dtos/chat-type-insert.dto.js'

export interface AIContentPort {
  fetchChatContent(): Promise<DBChatType[]>
  resolveChatTypeByParam(param: string): Promise<string | null>
  putChatTypeDetails(details: PutChatTypeDto): Promise<QueryResult | null>
  createChatType(data: ChatTypeInsertDto): Promise<DBChatType>
}
