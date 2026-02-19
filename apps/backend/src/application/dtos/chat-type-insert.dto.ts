import type { DBChatType } from '../../infrastructure/database/schema.js'

/**
 * Data Transfer Object representing the shape of data required to insert
 * a new chat type into the database.
 *
 * This DTO is derived from the database schema but excludes the timestamp
 * fields that are automatically managed by the database (createdAt, updatedAt).
 *
 * It serves as the contract between the application layer and the infrastructure
 * layer for chat type creation operations, ensuring type safety and consistency
 * across use-cases, ports, and repositories.
 *
 * @remarks
 * This type should be used instead of exporting insert types from use-case
 * modules to maintain proper dependency direction and layer separation.
 *
 * @example
 * ```typescript
 * const insertData: ChatTypeInsertDto = {
 *   id: '01234567-89ab-cdef-0123-456789abcdef',
 *   name: 'Creative Writing',
 *   description: 'Helps users with creative writing tasks',
 *   seoFriendlyId: 'creative-writing',
 *   seoFriendlyBase64Id: 'AbCdEfGhIjKlMnOpQrStUv',
 * }
 * ```
 */
export type ChatTypeInsertDto = Omit<DBChatType, 'createdAt' | 'updatedAt'>
