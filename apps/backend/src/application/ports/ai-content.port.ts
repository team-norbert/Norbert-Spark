import type { DBChatType } from '../../infrastructure/database/schema.js'
import { PutChatTypeDto } from '../dtos/put-chat-type.dto.js'
import type { QueryResult } from 'pg'
import type { PostChatTypesInsert } from '../use-cases/post-chat-types.use-case.js'

export interface AIContentPort {
  fetchChatContent(): Promise<DBChatType[]>
  resolveChatTypeByParam(param: string): Promise<string | null>
  putChatTypeDetails(details: PutChatTypeDto): Promise<QueryResult | null>
  createChatType(data: PostChatTypesInsert): Promise<QueryResult>
}
