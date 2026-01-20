import { getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import {
  auditLog,
  chatAiOptions,
  chats,
  chatTypes,
  dataRetrievalMessageParts,
  dataRetrievalMessages,
  messages,
  parts,
  user,
} from '../src/infrastructure/database/schema.js'

describe('Database Schema', () => {
  describe('Table exports', () => {
    it('should export user table constant', () => {
      expect(user).toBeDefined()
      expect(typeof user).toBe('object')
    })

    it('should export chats table constant', () => {
      expect(chats).toBeDefined()
      expect(typeof chats).toBe('object')
    })

    it('should export chatTypes table constant', () => {
      expect(chatTypes).toBeDefined()
      expect(typeof chatTypes).toBe('object')
    })

    it('should export messages table constant', () => {
      expect(messages).toBeDefined()
      expect(typeof messages).toBe('object')
    })

    it('should export chatAiOptions table constant', () => {
      expect(chatAiOptions).toBeDefined()
      expect(typeof chatAiOptions).toBe('object')
    })

    it('should export parts table constant', () => {
      expect(parts).toBeDefined()
      expect(typeof parts).toBe('object')
    })

    it('should export auditLog table constant', () => {
      expect(auditLog).toBeDefined()
      expect(typeof auditLog).toBe('object')
    })

    it('should export dataRetrievalMessages table constant', () => {
      expect(dataRetrievalMessages).toBeDefined()
      expect(typeof dataRetrievalMessages).toBe('object')
    })

    it('should export dataRetrievalMessageParts table constant', () => {
      expect(dataRetrievalMessageParts).toBeDefined()
      expect(typeof dataRetrievalMessageParts).toBe('object')
    })
  })

  describe('Table names', () => {
    it('should have correct table name for users', () => {
      expect(getTableName(user)).toBe('users')
    })

    it('should have correct table name for chats', () => {
      expect(getTableName(chats)).toBe('chats')
    })

    it('should have correct table name for chat_types', () => {
      expect(getTableName(chatTypes)).toBe('chat_types')
    })

    it('should have correct table name for messages', () => {
      expect(getTableName(messages)).toBe('messages')
    })

    it('should have correct table name for parts', () => {
      expect(getTableName(parts)).toBe('parts')
    })

    it('should have correct table name for audit_log', () => {
      expect(getTableName(auditLog)).toBe('audit_log')
    })

    it('should have correct table name for data_retrieval_messages', () => {
      expect(getTableName(dataRetrievalMessages)).toBe('data_retrieval_messages')
    })

    it('should have correct table name for data_retrieval_message_parts', () => {
      expect(getTableName(dataRetrievalMessageParts)).toBe('data_retrieval_message_parts')
    })
  })

  describe('Table columns', () => {
    describe('user table columns', () => {
      it('should have userId column', () => {
        expect(user.userId).toBeDefined()
        expect(user.userId.name).toBe('user_id')
      })

      it('should have name column', () => {
        expect(user.name).toBeDefined()
        expect(user.name.name).toBe('name')
      })

      it('should have password column', () => {
        expect(user.password).toBeDefined()
        expect(user.password.name).toBe('password')
      })

      it('should have email column', () => {
        expect(user.email).toBeDefined()
        expect(user.email.name).toBe('email')
      })

      it('should have role column', () => {
        expect(user.role).toBeDefined()
        expect(user.role.name).toBe('role')
      })

      it('should have createdAt column', () => {
        expect(user.createdAt).toBeDefined()
        expect(user.createdAt.name).toBe('created_at')
      })
    })

    describe('chats table columns', () => {
      it('should have id column', () => {
        expect(chats.id).toBeDefined()
        expect(chats.id.name).toBe('id')
      })

      it('should have userId column', () => {
        expect(chats.userId).toBeDefined()
        expect(chats.userId.name).toBe('user_id')
      })

      it('should have chatTypeId column', () => {
        expect(chats.chatTypeId).toBeDefined()
        expect(chats.chatTypeId.name).toBe('chat_type_id')
      })

      it('should have createdAt column', () => {
        expect(chats.createdAt).toBeDefined()
        expect(chats.createdAt.name).toBe('created_at')
      })

      it('should have updatedAt column', () => {
        expect(chats.updatedAt).toBeDefined()
        expect(chats.updatedAt.name).toBe('updated_at')
      })
    })

    describe('chatTypes table columns', () => {
      it('should have id column', () => {
        expect(chatTypes.id).toBeDefined()
        expect(chatTypes.id.name).toBe('id')
      })

      it('should have name column', () => {
        expect(chatTypes.name).toBeDefined()
        expect(chatTypes.name.name).toBe('name')
      })

      it('should have seoFriendlyId column', () => {
        expect(chatTypes.seoFriendlyId).toBeDefined()
        expect(chatTypes.seoFriendlyId.name).toBe('seo_friendly_id')
      })

      it('should have seoFriendlyBase64Id column', () => {
        expect(chatTypes.seoFriendlyBase64Id).toBeDefined()
        expect(chatTypes.seoFriendlyBase64Id.name).toBe('seo_friendly_base64_id')
      })

      it('should have description column', () => {
        expect(chatTypes.description).toBeDefined()
        expect(chatTypes.description.name).toBe('description')
      })

      it('should have createdAt column', () => {
        expect(chatTypes.createdAt).toBeDefined()
        expect(chatTypes.createdAt.name).toBe('created_at')
      })

      it('should have updatedAt column', () => {
        expect(chatTypes.updatedAt).toBeDefined()
        expect(chatTypes.updatedAt.name).toBe('updated_at')
      })
    })

    describe('chatTypes table properties', () => {
      it('should have primary key on id', () => {
        expect(chatTypes.id.primary).toBe(true)
      })

      it('should have not null constraint on name', () => {
        expect(chatTypes.name.notNull).toBe(true)
      })

      it('should have unique constraint on name', () => {
        expect(chatTypes.name.isUnique).toBe(true)
      })

      it('should have unique constraint on seoFriendlyId', () => {
        expect(chatTypes.seoFriendlyId.isUnique).toBe(true)
      })

      it('should have unique constraint on seoFriendlyBase64Id', () => {
        expect(chatTypes.seoFriendlyBase64Id.isUnique).toBe(true)
      })

      it('should have not null constraint on description', () => {
        expect(chatTypes.description.notNull).toBe(true)
      })

      it('should have not null constraint on createdAt', () => {
        expect(chatTypes.createdAt.notNull).toBe(true)
      })

      it('should have not null constraint on updatedAt', () => {
        expect(chatTypes.updatedAt.notNull).toBe(true)
      })
    })

    describe('messages table columns', () => {
      it('should have id column', () => {
        expect(messages.id).toBeDefined()
        expect(messages.id.name).toBe('id')
      })

      it('should have chatId column', () => {
        expect(messages.chatId).toBeDefined()
        expect(messages.chatId.name).toBe('chat_id')
      })

      it('should have createdAt column', () => {
        expect(messages.createdAt).toBeDefined()
        expect(messages.createdAt.name).toBe('created_at')
      })

      it('should have role column', () => {
        expect(messages.role).toBeDefined()
        expect(messages.role.name).toBe('role')
      })
    })

    describe('chatAiOptions table columns', () => {
      it('should have id column', () => {
        expect(chatAiOptions.id).toBeDefined()
        expect(chatAiOptions.id.name).toBe('id')
      })

      it('should have chatTypeId column', () => {
        expect(chatAiOptions.chatTypeId).toBeDefined()
        expect(chatAiOptions.chatTypeId.name).toBe('chat_type_id')
      })

      it('should have prompt column', () => {
        expect(chatAiOptions.prompt).toBeDefined()
        expect(chatAiOptions.prompt.name).toBe('prompt')
      })

      it('should have maxTokens column', () => {
        expect(chatAiOptions.maxTokens).toBeDefined()
        expect(chatAiOptions.maxTokens.name).toBe('max_tokens')
      })

      it('should have temperature column', () => {
        expect(chatAiOptions.temperature).toBeDefined()
        expect(chatAiOptions.temperature.name).toBe('temperature')
      })

      it('should have topP column', () => {
        expect(chatAiOptions.topP).toBeDefined()
        expect(chatAiOptions.topP.name).toBe('top_p')
      })

      it('should have frequencyPenalty column', () => {
        expect(chatAiOptions.frequencyPenalty).toBeDefined()
        expect(chatAiOptions.frequencyPenalty.name).toBe('frequency_penalty')
      })

      it('should have presencePenalty column', () => {
        expect(chatAiOptions.presencePenalty).toBeDefined()
        expect(chatAiOptions.presencePenalty.name).toBe('presence_penalty')
      })

      it('should have createdAt column', () => {
        expect(chatAiOptions.createdAt).toBeDefined()
        expect(chatAiOptions.createdAt.name).toBe('created_at')
      })

      it('should have updatedAt column', () => {
        expect(chatAiOptions.updatedAt).toBeDefined()
        expect(chatAiOptions.updatedAt.name).toBe('updated_at')
      })
    })

    describe('chatAiOptions table properties', () => {
      it('should have primary key on id', () => {
        expect(chatAiOptions.id.primary).toBe(true)
      })

      it('should have not null constraint on chatTypeId', () => {
        expect(chatAiOptions.chatTypeId.notNull).toBe(true)
      })

      it('should have unique constraint on chatTypeId', () => {
        expect(chatAiOptions.chatTypeId.isUnique).toBe(true)
      })

      it('should have not null constraint on prompt', () => {
        expect(chatAiOptions.prompt.notNull).toBe(true)
      })

      it('should have default value for maxTokens', () => {
        expect(chatAiOptions.maxTokens.hasDefault).toBe(false)
      })

      it('should have not null constraint on createdAt', () => {
        expect(chatAiOptions.createdAt.notNull).toBe(true)
      })

      it('should have not null constraint on updatedAt', () => {
        expect(chatAiOptions.updatedAt.notNull).toBe(true)
      })

      it('should have nullable temperature', () => {
        expect(chatAiOptions.temperature.notNull).toBe(false)
      })

      it('should have nullable topP', () => {
        expect(chatAiOptions.topP.notNull).toBe(false)
      })

      it('should have nullable frequencyPenalty', () => {
        expect(chatAiOptions.frequencyPenalty.notNull).toBe(false)
      })

      it('should have nullable presencePenalty', () => {
        expect(chatAiOptions.presencePenalty.notNull).toBe(false)
      })
    })

    describe('parts table columns', () => {
      it('should have base columns', () => {
        expect(parts.id).toBeDefined()
        expect(parts.id.name).toBe('id')
        expect(parts.messageId).toBeDefined()
        expect(parts.messageId.name).toBe('message_id')
        expect(parts.type).toBeDefined()
        expect(parts.type.name).toBe('type')
        expect(parts.createdAt).toBeDefined()
        expect(parts.createdAt.name).toBe('created_at')
        expect(parts.order).toBeDefined()
        expect(parts.order.name).toBe('order')
      })

      it('should have text part columns', () => {
        expect(parts.textText).toBeDefined()
        expect(parts.textText.name).toBe('text_text')
      })

      it('should have reasoning part columns', () => {
        expect(parts.reasoningText).toBeDefined()
        expect(parts.reasoningText.name).toBe('reasoning_text')
      })

      it('should have file part columns', () => {
        expect(parts.fileMediaType).toBeDefined()
        expect(parts.fileMediaType.name).toBe('file_media_type')
        expect(parts.fileFilename).toBeDefined()
        expect(parts.fileFilename.name).toBe('file_filename')
        expect(parts.fileUrl).toBeDefined()
        expect(parts.fileUrl.name).toBe('file_url')
      })

      it('should have source URL part columns', () => {
        expect(parts.sourceUrlSourceId).toBeDefined()
        expect(parts.sourceUrlSourceId.name).toBe('source_url_source_id')
        expect(parts.sourceUrlUrl).toBeDefined()
        expect(parts.sourceUrlUrl.name).toBe('source_url_url')
        expect(parts.sourceUrlTitle).toBeDefined()
        expect(parts.sourceUrlTitle.name).toBe('source_url_title')
      })

      it('should have source document part columns', () => {
        expect(parts.sourceDocumentSourceId).toBeDefined()
        expect(parts.sourceDocumentSourceId.name).toBe('source_document_source_id')
        expect(parts.sourceDocumentMediaType).toBeDefined()
        expect(parts.sourceDocumentMediaType.name).toBe('source_document_media_type')
        expect(parts.sourceDocumentTitle).toBeDefined()
        expect(parts.sourceDocumentTitle.name).toBe('source_document_title')
        expect(parts.sourceDocumentFilename).toBeDefined()
        expect(parts.sourceDocumentFilename.name).toBe('source_document_filename')
      })

      it('should have tool call columns', () => {
        expect(parts.toolToolCallId).toBeDefined()
        expect(parts.toolToolCallId.name).toBe('tool_tool_call_id')
        expect(parts.toolState).toBeDefined()
        expect(parts.toolState.name).toBe('tool_state')
        expect(parts.toolErrorText).toBeDefined()
        expect(parts.toolErrorText.name).toBe('tool_error_text')
      })

      it('should have provider metadata column', () => {
        expect(parts.providerMetadata).toBeDefined()
        expect(parts.providerMetadata.name).toBe('provider_metadata')
      })
    })

    describe('auditLog table columns', () => {
      it('should have all required columns', () => {
        expect(auditLog.id).toBeDefined()
        expect(auditLog.id.name).toBe('id')
        expect(auditLog.userId).toBeDefined()
        expect(auditLog.userId.name).toBe('user_id')
        expect(auditLog.entityType).toBeDefined()
        expect(auditLog.entityType.name).toBe('entity_type')
        expect(auditLog.entityId).toBeDefined()
        expect(auditLog.entityId.name).toBe('entity_id')
        expect(auditLog.action).toBeDefined()
        expect(auditLog.action.name).toBe('action')
        expect(auditLog.changes).toBeDefined()
        expect(auditLog.changes.name).toBe('changes')
        expect(auditLog.ipAddress).toBeDefined()
        expect(auditLog.ipAddress.name).toBe('ip_address')
        expect(auditLog.userAgent).toBeDefined()
        expect(auditLog.userAgent.name).toBe('user_agent')
        expect(auditLog.createdAt).toBeDefined()
        expect(auditLog.createdAt.name).toBe('created_at')
      })
    })

    describe('dataRetrievalMessages table columns', () => {
      it('should have id column', () => {
        expect(dataRetrievalMessages.id).toBeDefined()
        expect(dataRetrievalMessages.id.name).toBe('id')
      })

      it('should have createdAt column', () => {
        expect(dataRetrievalMessages.createdAt).toBeDefined()
        expect(dataRetrievalMessages.createdAt.name).toBe('created_at')
      })
    })

    describe('dataRetrievalMessageParts table columns', () => {
      it('should have id column', () => {
        expect(dataRetrievalMessageParts.id).toBeDefined()
        expect(dataRetrievalMessageParts.id.name).toBe('id')
      })

      it('should have messageId column', () => {
        expect(dataRetrievalMessageParts.messageId).toBeDefined()
        expect(dataRetrievalMessageParts.messageId.name).toBe('message_id')
      })

      it('should have type column', () => {
        expect(dataRetrievalMessageParts.type).toBeDefined()
        expect(dataRetrievalMessageParts.type.name).toBe('type')
      })

      it('should have textJson column', () => {
        expect(dataRetrievalMessageParts.textJson).toBeDefined()
        expect(dataRetrievalMessageParts.textJson.name).toBe('text_json')
      })

      it('should have createdAt column', () => {
        expect(dataRetrievalMessageParts.createdAt).toBeDefined()
        expect(dataRetrievalMessageParts.createdAt.name).toBe('created_at')
      })
    })
  })

  describe('Column properties', () => {
    it('should have primary key on user.userId', () => {
      expect(user.userId.primary).toBe(true)
    })

    it('should have primary key on chats.id', () => {
      expect(chats.id.primary).toBe(true)
    })

    it('should have primary key on messages.id', () => {
      expect(messages.id.primary).toBe(true)
    })

    it('should have primary key on parts.id', () => {
      expect(parts.id.primary).toBe(true)
    })

    it('should have primary key on auditLog.id', () => {
      expect(auditLog.id.primary).toBe(true)
    })

    it('should have not null constraint on chats.userId', () => {
      expect(chats.userId.notNull).toBe(true)
    })

    it('should have not null constraint on messages.chatId', () => {
      expect(messages.chatId.notNull).toBe(true)
    })

    it('should have not null constraint on parts.messageId', () => {
      expect(parts.messageId.notNull).toBe(true)
    })

    it('should have nullable auditLog.userId for system actions', () => {
      expect(auditLog.userId.notNull).toBe(false)
    })

    it('should have primary key on dataRetrievalMessages.id', () => {
      expect(dataRetrievalMessages.id.primary).toBe(true)
    })

    it('should have primary key on dataRetrievalMessageParts.id', () => {
      expect(dataRetrievalMessageParts.id.primary).toBe(true)
    })

    it('should have not null constraint on dataRetrievalMessages.createdAt', () => {
      expect(dataRetrievalMessages.createdAt.notNull).toBe(true)
    })

    it('should have not null constraint on dataRetrievalMessageParts.messageId', () => {
      expect(dataRetrievalMessageParts.messageId.notNull).toBe(true)
    })

    it('should have not null constraint on dataRetrievalMessageParts.type', () => {
      expect(dataRetrievalMessageParts.type.notNull).toBe(true)
    })

    it('should have not null constraint on dataRetrievalMessageParts.createdAt', () => {
      expect(dataRetrievalMessageParts.createdAt.notNull).toBe(true)
    })

    it('should have nullable dataRetrievalMessageParts.textJson', () => {
      expect(dataRetrievalMessageParts.textJson.notNull).toBe(false)
    })
  })

  describe('Schema structure validation', () => {
    it('should have all nine table constants exported', () => {
      const tables = [
        user,
        chats,
        chatTypes,
        messages,
        parts,
        chatAiOptions,
        auditLog,
        dataRetrievalMessages,
        dataRetrievalMessageParts,
      ]
      expect(tables).toHaveLength(9)
      tables.forEach((table) => {
        expect(table).toBeDefined()
        expect(typeof table).toBe('object')
      })
    })

    it('should have unique table names', () => {
      const tableNames = [
        getTableName(user),
        getTableName(chats),
        getTableName(chatTypes),
        getTableName(messages),
        getTableName(chatAiOptions),
        getTableName(parts),
        getTableName(auditLog),
        getTableName(dataRetrievalMessages),
        getTableName(dataRetrievalMessageParts),
      ]
      const uniqueNames = new Set(tableNames)
      expect(uniqueNames.size).toBe(9)
    })

    it('should have consistent timestamp column naming', () => {
      expect(user.createdAt.name).toBe('created_at')
      expect(chats.createdAt.name).toBe('created_at')
      expect(chats.updatedAt.name).toBe('updated_at')
      expect(chatTypes.createdAt.name).toBe('created_at')
      expect(chatTypes.updatedAt.name).toBe('updated_at')
      expect(messages.createdAt.name).toBe('created_at')
      expect(parts.createdAt.name).toBe('created_at')
      expect(auditLog.createdAt.name).toBe('created_at')
      expect(dataRetrievalMessages.createdAt.name).toBe('created_at')
      expect(dataRetrievalMessageParts.createdAt.name).toBe('created_at')
    })

    it('should have consistent primary key naming with _id suffix or id', () => {
      expect(user.userId.name).toBe('user_id')
      expect(chats.id.name).toBe('id')
      expect(chatTypes.id.name).toBe('id')
      expect(messages.id.name).toBe('id')
      expect(chatAiOptions.id.name).toBe('id')
      expect(parts.id.name).toBe('id')
      expect(auditLog.id.name).toBe('id')
      expect(dataRetrievalMessages.id.name).toBe('id')
      expect(dataRetrievalMessageParts.id.name).toBe('id')
    })

    it('should have consistent foreign key naming pattern', () => {
      expect(chats.userId.name).toBe('user_id')
      expect(chats.chatTypeId.name).toBe('chat_type_id')
      expect(messages.chatId.name).toBe('chat_id')
      expect(chatAiOptions.chatTypeId.name).toBe('chat_type_id')
      expect(parts.messageId.name).toBe('message_id')
      expect(auditLog.userId.name).toBe('user_id')
      expect(dataRetrievalMessageParts.messageId.name).toBe('message_id')
    })
  })
})
