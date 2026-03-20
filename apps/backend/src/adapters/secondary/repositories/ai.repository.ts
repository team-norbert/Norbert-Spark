import { isArray, UtcDate } from '@norberts-spark/shared'
import type { UIMessage } from 'ai'
import { asc, desc, eq, sql } from 'drizzle-orm'

import type { AIServicePort, ChatWithType } from '../../../application/ports/ai.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import type { ChatIdType } from '../../../domain/value-objects/chatID.js'
import type { UserIdType } from '../../../domain/value-objects/userID.js'
import { db } from '../../../infrastructure/database/index.js'
import {
  chats,
  chatTypes,
  type DBMessageSelect,
  messages,
  type MyDBUIMessagePartSelect,
  parts,
} from '../../../infrastructure/database/schema.js'
import { mapUIMessagePartsToDBParts } from '../../../shared/mapper/index.js'

export type ChatResponseResult = {
  chat: typeof chats.$inferSelect
  message: DBMessageSelect
  part: MyDBUIMessagePartSelect | null
}[]

/**
 * Secondary adapter — Drizzle ORM repository for all AI chat persistence.
 *
 * Implements {@link AIServicePort} and is the single source of truth for
 * reading and writing chat, message, and message-part records. All writes
 * are performed against the live `db` client; no caching layer is applied
 * here.
 *
 * **Tables touched:**
 * - `chats` — top-level chat sessions
 * - `messages` — individual messages within a chat
 * - `parts` — typed content parts belonging to a message (text, tool calls, …)
 * - `chat_types` — joined read-only to enrich chat list results
 */
export class AIRepository implements AIServicePort {
  constructor(private readonly logger: LoggerPort) {}

  /**
   * Inserts messages and their associated parts into the database.
   *
   * Shared helper used by both {@link createChat} and
   * {@link appendToChatMessages} to avoid duplicating the
   * insert-messages-then-insert-parts logic.
   *
   * The method is a no-op when `messagesToInsert` is empty, so callers do not
   * need to guard against empty arrays.
   *
   * @param chatId - The ID of the chat that the messages belong to.
   * @param messagesToInsert - The UI messages to persist. Each message's
   *   `parts` array is mapped to DB rows via {@link mapUIMessagePartsToDBParts}.
   * @returns A promise that resolves when all inserts have completed.
   */
  private async insertMessagesWithParts(
    chatId: ChatIdType,
    messagesToInsert: UIMessage[]
  ): Promise<void> {
    if (messagesToInsert.length === 0) {
      return
    }

    const messageRecords = messagesToInsert.map((msg) => ({
      chatId: chatId,
      role: msg.role,
    }))

    // Insert messages and get their IDs back so we can link parts
    const insertedMessages = await db.insert(messages).values(messageRecords).returning()

    this.logger.info('insertedMessages', insertedMessages)

    // Map all message parts from all messages to DB format
    const partsRecords = insertedMessages.flatMap((insertedMsg, index) => {
      const correspondingMessage = messagesToInsert.at(index)
      if (!correspondingMessage?.parts) return []
      return mapUIMessagePartsToDBParts(
        correspondingMessage.parts as any,
        insertedMsg.id,
        this.logger
      )
    })

    this.logger.info('partsRecords', partsRecords)

    // Insert all message parts
    if (partsRecords.length > 0) {
      await db.insert(parts).values(partsRecords)
    }
  }
  //user_id

  /**
   * Creates a new chat session and persists any initial messages.
   *
   * Inserts a row into `chats` keyed by the provided `chatId`, then calls
   * {@link insertMessagesWithParts} to persist `initialMessages` (if any).
   *
   * @param chatId - The UUIDv7 identifier for the new chat.
   * @param userId - The ID of the user who owns the chat.
   * @param chatTypeId - The ID of the chat type (configuration) to associate
   *   with this chat session.
   * @param initialMessages - Optional array of UI messages to insert alongside
   *   the chat record. Defaults to an empty array.
   * @returns A promise that resolves to the `chatId` string once the chat and
   *   all initial messages have been persisted.
   *
   * @example
   * const id = await repo.createChat(chatId, userId, chatTypeId, messages)
   * // id === chatId
   */
  async createChat(
    chatId: ChatIdType,
    userId: UserIdType,
    chatTypeId: ChatIdType,
    initialMessages: UIMessage[] = []
  ): Promise<string> {
    const newChat = {
      userId: userId,
      id: chatId,
      chatTypeId: chatTypeId,
    }

    this.logger.info('chatId', chatId)
    this.logger.info('userId', userId)
    this.logger.info('chatTypeId', chatTypeId)
    this.logger.info('initialMessages', initialMessages)
    this.logger.info('createChat', newChat)

    await db.insert(chats).values(newChat)

    this.logger.info('initialMessages', initialMessages)

    if (
      !isArray(initialMessages) &&
      typeof initialMessages === 'object' &&
      Object.keys(initialMessages).length > 0
    ) {
      initialMessages = [initialMessages]
    }

    // Insert initial messages if provided
    await this.insertMessagesWithParts(chatId, initialMessages)

    return chatId
  }

  /**
   * Appends new messages to an existing chat.
   *
   * Updates the `updatedAt` timestamp on the parent `chats` row, then
   * calls {@link insertMessagesWithParts} to persist the new messages and
   * their parts.
   *
   * @param chatId - The ID of the chat to append messages to.
   * @param messagesToAppend - The UI messages to add. Defaults to an empty
   *   array (no-op).
   * @returns A promise that resolves to the `chatId` string once all messages
   *   have been persisted.
   *
   * @example
   * await repo.appendToChatMessages(chatId, [assistantMessage])
   */
  async appendToChatMessages(
    chatId: ChatIdType,
    messagesToAppend: UIMessage[] = []
  ): Promise<string> {
    const isArrayString = isArray(messagesToAppend) ? 'yes' : 'no'
    this.logger.info('chatId', chatId)
    this.logger.info('messagesToAppend', messagesToAppend)
    this.logger.info('isArray', { isArrayString })

    // 1. Update the chat table updated_at column
    await db.update(chats).set({ updatedAt: UtcDate.now().toDate() }).where(eq(chats.id, chatId))

    // 2. Insert the new messages into the messages table
    await this.insertMessagesWithParts(chatId, messagesToAppend)

    return chatId
  }

  /**
   * Retrieves all chats for a user with their associated chat type information.
   *
   * Data Integrity Guarantees:
   * 1. The INNER JOIN is safe because chats.chatTypeId has a NOT NULL constraint
   *    (see schema.ts line 694: .notNull())
   * 2. Foreign key constraint ensures referential integrity: chats.chatTypeId
   *    references chat_types.id with onDelete: 'restrict' (schema.ts line 695)
   * 3. Database index on chats.chat_type_id ensures efficient joins (schema.ts line 705)
   * 4. No orphaned chats can exist - the FK constraint prevents deletion of
   *    chat_types while chats reference them
   *
   * @param userId - The user's ID to filter chats by
   * @returns Array of chats with id, chatTypeId, and seoFriendlyId
   */
  async getChatsByUserId(userId: UserIdType): Promise<ChatWithType[]> {
    const result = await db
      .select({
        id: chats.id,
        chatTypeId: chats.chatTypeId,
        seoFriendlyId: chatTypes.seoFriendlyId,
      })
      .from(chats)
      .innerJoin(chatTypes, eq(chats.chatTypeId, chatTypes.id))
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt))

    return result.map((row) => ({
      id: row.id as ChatIdType,
      chatTypeId: row.chatTypeId as ChatIdType,
      seoFriendlyId: row.seoFriendlyId,
    }))
  }

  /**
   * Retrieves a chat with all its messages and parts, ordered for streaming.
   *
   * Performs an `INNER JOIN` on `messages` and a `LEFT JOIN` on `parts` so
   * that messages without parts are still included. Results are ordered by
   * message `createdAt` ascending, then by part `order` ascending (NULLs last).
   *
   * @param chatId - The ID of the chat to retrieve.
   * @returns A promise that resolves to the flat join result
   *   ({@link ChatResponseResult}) or `null` if the query returns no rows.
   *
   * @example
   * const rows = await repo.getChatResponse(chatId)
   * // rows[0].chat, rows[0].message, rows[0].part
   */
  async getChatResponse(chatId: ChatIdType): Promise<ChatResponseResult | null> {
    // Query chats table by id, then join with messages and parts
    const result = await db
      .select({ chat: chats, message: messages, part: parts })
      .from(chats)
      .innerJoin(messages, eq(messages.chatId, chats.id))
      .leftJoin(parts, eq(parts.messageId, messages.id))
      .where(eq(chats.id, chatId))
      .orderBy(asc(messages.createdAt), sql`${parts.order} ASC NULLS LAST`) // Order by message creation time first, then part order (nulls last)

    return result
  }

  /**
   * Retrieves a chat with all its messages and parts by chat ID.
   *
   * Functionally identical to {@link getChatResponse} — performs the same
   * `INNER JOIN` on `messages` and `LEFT JOIN` on `parts`, ordered by message
   * `createdAt` ascending then part `order` ascending (NULLs last).
   *
   * This method is the repository entry point used by
   * {@link GetChatContentByChatIdUseCase} to serve the
   * `GET /ai/fetchChat/:chatId` endpoint.
   *
   * @param chatId - The ID of the chat to retrieve.
   * @returns A promise that resolves to the flat join result
   *   ({@link ChatResponseResult}) or `null` if the query returns no rows.
   *
   * @example
   * const rows = await repo.getAIChatByChatId(chatId)
   * // rows[0].chat.userId can be used for authorisation checks
   */
  async getAIChatByChatId(chatId: ChatIdType): Promise<ChatResponseResult | null> {
    // Query chats table by id, then join with messages and parts
    const result = await db
      .select({ chat: chats, message: messages, part: parts })
      .from(chats)
      .innerJoin(messages, eq(messages.chatId, chats.id))
      .leftJoin(parts, eq(parts.messageId, messages.id))
      .where(eq(chats.id, chatId))
      .orderBy(asc(messages.createdAt), sql`${parts.order} ASC NULLS LAST`) // Order by message creation time first, then part order (nulls last)

    return result
  }
}
