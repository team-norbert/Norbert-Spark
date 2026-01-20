import { desc } from 'drizzle-orm'

import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { db } from '../../../infrastructure/database/index.js'
import { chatTypes } from '../../../infrastructure/database/schema.js'
import type { AIContentPort } from '../../../application/ports/ai-content.port.js'

export class AIChatContentRepository implements AIContentPort {
  constructor(private readonly logger: LoggerPort) {}

  async fetchChatContent(): Promise<any> {
    this.logger.debug('Fetches chatContent from chat_types table')
    return db.select().from(chatTypes).orderBy(desc(chatTypes.createdAt))
  }
}
