import { getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { chats, type DBMessage, type DBMessageSelect, messages, parts } from '../../src'

describe('Chat Schemas', () => {
  describe('chats table', () => {
    it('should export chats table constant', () => {
      expect(chats).toBeDefined()
      expect(typeof chats).toBe('object')
    })

    it('should have correct table name', () => {
      expect(getTableName(chats)).toBe('chats')
    })

    describe('columns', () => {
      it('should have id column', () => {
        expect(chats.id).toBeDefined()
        expect(chats.id.name).toBe('id')
      })

      it('should have userId column', () => {
        expect(chats.userId).toBeDefined()
        expect(chats.userId.name).toBe('user_id')
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

    describe('column properties', () => {
      it('should have primary key on id', () => {
        expect(chats.id.primary).toBe(true)
      })

      it('should have not null constraint on userId', () => {
        expect(chats.userId.notNull).toBe(true)
      })

      it('should have not null constraint on createdAt', () => {
        expect(chats.createdAt.notNull).toBe(true)
      })

      it('should have not null constraint on updatedAt', () => {
        expect(chats.updatedAt.notNull).toBe(true)
      })
    })
  })

  describe('messages table', () => {
    it('should export messages table constant', () => {
      expect(messages).toBeDefined()
      expect(typeof messages).toBe('object')
    })

    it('should have correct table name', () => {
      expect(getTableName(messages)).toBe('messages')
    })

    describe('columns', () => {
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

    describe('column properties', () => {
      it('should have primary key on id', () => {
        expect(messages.id.primary).toBe(true)
      })

      it('should have not null constraint on chatId', () => {
        expect(messages.chatId.notNull).toBe(true)
      })

      it('should have not null constraint on createdAt', () => {
        expect(messages.createdAt.notNull).toBe(true)
      })

      it('should have not null constraint on role', () => {
        expect(messages.role.notNull).toBe(true)
      })
    })
  })

  describe('parts table', () => {
    it('should export parts table constant', () => {
      expect(parts).toBeDefined()
      expect(typeof parts).toBe('object')
    })

    it('should have correct table name', () => {
      expect(getTableName(parts)).toBe('parts')
    })

    describe('base columns', () => {
      it('should have id column', () => {
        expect(parts.id).toBeDefined()
        expect(parts.id.name).toBe('id')
      })

      it('should have messageId column', () => {
        expect(parts.messageId).toBeDefined()
        expect(parts.messageId.name).toBe('message_id')
      })

      it('should have type column', () => {
        expect(parts.type).toBeDefined()
        expect(parts.type.name).toBe('type')
      })

      it('should have createdAt column', () => {
        expect(parts.createdAt).toBeDefined()
        expect(parts.createdAt.name).toBe('created_at')
      })

      it('should have order column', () => {
        expect(parts.order).toBeDefined()
        expect(parts.order.name).toBe('order')
      })
    })

    describe('text part columns', () => {
      it('should have textText column', () => {
        expect(parts.textText).toBeDefined()
        expect(parts.textText.name).toBe('text_text')
      })
    })

    describe('reasoning part columns', () => {
      it('should have reasoningText column', () => {
        expect(parts.reasoningText).toBeDefined()
        expect(parts.reasoningText.name).toBe('reasoning_text')
      })
    })

    describe('file part columns', () => {
      it('should have fileMediaType column', () => {
        expect(parts.fileMediaType).toBeDefined()
        expect(parts.fileMediaType.name).toBe('file_media_type')
      })

      it('should have fileFilename column', () => {
        expect(parts.fileFilename).toBeDefined()
        expect(parts.fileFilename.name).toBe('file_filename')
      })

      it('should have fileUrl column', () => {
        expect(parts.fileUrl).toBeDefined()
        expect(parts.fileUrl.name).toBe('file_url')
      })
    })

    describe('source URL part columns', () => {
      it('should have sourceUrlSourceId column', () => {
        expect(parts.sourceUrlSourceId).toBeDefined()
        expect(parts.sourceUrlSourceId.name).toBe('source_url_source_id')
      })

      it('should have sourceUrlUrl column', () => {
        expect(parts.sourceUrlUrl).toBeDefined()
        expect(parts.sourceUrlUrl.name).toBe('source_url_url')
      })

      it('should have sourceUrlTitle column', () => {
        expect(parts.sourceUrlTitle).toBeDefined()
        expect(parts.sourceUrlTitle.name).toBe('source_url_title')
      })
    })

    describe('source document part columns', () => {
      it('should have sourceDocumentSourceId column', () => {
        expect(parts.sourceDocumentSourceId).toBeDefined()
        expect(parts.sourceDocumentSourceId.name).toBe('source_document_source_id')
      })

      it('should have sourceDocumentMediaType column', () => {
        expect(parts.sourceDocumentMediaType).toBeDefined()
        expect(parts.sourceDocumentMediaType.name).toBe('source_document_media_type')
      })

      it('should have sourceDocumentTitle column', () => {
        expect(parts.sourceDocumentTitle).toBeDefined()
        expect(parts.sourceDocumentTitle.name).toBe('source_document_title')
      })

      it('should have sourceDocumentFilename column', () => {
        expect(parts.sourceDocumentFilename).toBeDefined()
        expect(parts.sourceDocumentFilename.name).toBe('source_document_filename')
      })
    })

    describe('tool call columns', () => {
      it('should have toolToolCallId column', () => {
        expect(parts.toolToolCallId).toBeDefined()
        expect(parts.toolToolCallId.name).toBe('tool_tool_call_id')
      })

      it('should have toolState column', () => {
        expect(parts.toolState).toBeDefined()
        expect(parts.toolState.name).toBe('tool_state')
      })

      it('should have toolErrorText column', () => {
        expect(parts.toolErrorText).toBeDefined()
        expect(parts.toolErrorText.name).toBe('tool_error_text')
      })
    })

    describe('tool-specific columns', () => {
      it('should have toolHeartOfDarknessQAInput column', () => {
        expect(parts.toolHeartOfDarknessQAInput).toBeDefined()
        expect(parts.toolHeartOfDarknessQAInput.name).toBe('tool_heart_of_darkness_qa_input')
      })

      it('should have toolHeartOfDarknessQAOutput column', () => {
        expect(parts.toolHeartOfDarknessQAOutput).toBeDefined()
        expect(parts.toolHeartOfDarknessQAOutput.name).toBe('tool_heart_of_darkness_qa_output')
      })

      it('should have toolHeartOfDarknessQAErrorText column', () => {
        expect(parts.toolHeartOfDarknessQAErrorText).toBeDefined()
        expect(parts.toolHeartOfDarknessQAErrorText.name).toBe(
          'tool_heart_of_darkness_qa_error_text'
        )
      })
    })

    describe('data part columns', () => {
      it('should have dataContent column', () => {
        expect(parts.dataContent).toBeDefined()
        expect(parts.dataContent.name).toBe('data_content')
      })
    })

    describe('provider metadata column', () => {
      it('should have providerMetadata column', () => {
        expect(parts.providerMetadata).toBeDefined()
        expect(parts.providerMetadata.name).toBe('provider_metadata')
      })
    })

    describe('column properties', () => {
      it('should have primary key on id', () => {
        expect(parts.id.primary).toBe(true)
      })

      it('should have not null constraint on messageId', () => {
        expect(parts.messageId.notNull).toBe(true)
      })

      it('should have not null constraint on type', () => {
        expect(parts.type.notNull).toBe(true)
      })

      it('should have not null constraint on createdAt', () => {
        expect(parts.createdAt.notNull).toBe(true)
      })

      it('should have not null constraint on order', () => {
        expect(parts.order.notNull).toBe(true)
      })

      it('should have nullable textText', () => {
        expect(parts.textText.notNull).toBe(false)
      })

      it('should have nullable reasoningText', () => {
        expect(parts.reasoningText.notNull).toBe(false)
      })

      it('should have nullable file fields', () => {
        expect(parts.fileMediaType.notNull).toBe(false)
        expect(parts.fileFilename.notNull).toBe(false)
        expect(parts.fileUrl.notNull).toBe(false)
      })

      it('should have nullable source URL fields', () => {
        expect(parts.sourceUrlSourceId.notNull).toBe(false)
        expect(parts.sourceUrlUrl.notNull).toBe(false)
        expect(parts.sourceUrlTitle.notNull).toBe(false)
      })

      it('should have nullable source document fields', () => {
        expect(parts.sourceDocumentSourceId.notNull).toBe(false)
        expect(parts.sourceDocumentMediaType.notNull).toBe(false)
        expect(parts.sourceDocumentTitle.notNull).toBe(false)
        expect(parts.sourceDocumentFilename.notNull).toBe(false)
      })

      it('should have nullable tool fields', () => {
        expect(parts.toolToolCallId.notNull).toBe(false)
        expect(parts.toolState.notNull).toBe(false)
        expect(parts.toolErrorText.notNull).toBe(false)
      })

      it('should have nullable dataContent', () => {
        expect(parts.dataContent.notNull).toBe(false)
      })

      it('should have nullable providerMetadata', () => {
        expect(parts.providerMetadata.notNull).toBe(false)
      })
    })
  })

  describe('DBMessage type', () => {
    it('should be a valid insert type', () => {
      const mockMessage: DBMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        chatId: '987fcdeb-51a2-43f7-8d6e-123456789abc',
        role: 'user',
      }

      expect(mockMessage).toBeDefined()
      expect(mockMessage.chatId).toBe('987fcdeb-51a2-43f7-8d6e-123456789abc')
      expect(mockMessage.role).toBe('user')
    })

    it('should allow optional id for insert', () => {
      const mockMessage: DBMessage = {
        chatId: '987fcdeb-51a2-43f7-8d6e-123456789abc',
        role: 'assistant',
      }

      expect(mockMessage.id).toBeUndefined()
    })

    it('should allow optional createdAt for insert', () => {
      const mockMessage: DBMessage = {
        chatId: '987fcdeb-51a2-43f7-8d6e-123456789abc',
        role: 'user',
      }

      expect(mockMessage.createdAt).toBeUndefined()
    })
  })

  describe('DBMessageSelect type', () => {
    it('should be a valid select type', () => {
      const mockMessage: DBMessageSelect = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        chatId: '987fcdeb-51a2-43f7-8d6e-123456789abc',
        role: 'user',
        createdAt: new Date(),
      }

      expect(mockMessage).toBeDefined()
      expect(mockMessage.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(mockMessage.chatId).toBe('987fcdeb-51a2-43f7-8d6e-123456789abc')
      expect(mockMessage.role).toBe('user')
      expect(mockMessage.createdAt).toBeInstanceOf(Date)
    })

    it('should have all required fields', () => {
      const mockMessage: DBMessageSelect = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        chatId: '987fcdeb-51a2-43f7-8d6e-123456789abc',
        role: 'assistant',
        createdAt: new Date('2024-01-01'),
      }

      expect(mockMessage.id).toBeDefined()
      expect(mockMessage.chatId).toBeDefined()
      expect(mockMessage.role).toBeDefined()
      expect(mockMessage.createdAt).toBeDefined()
    })
  })

  describe('table structure validation', () => {
    it('should have all three table constants exported', () => {
      const tables = [chats, messages, parts]
      expect(tables).toHaveLength(3)
      tables.forEach((table) => {
        expect(table).toBeDefined()
        expect(typeof table).toBe('object')
      })
    })

    it('should have unique table names', () => {
      const tableNames = [getTableName(chats), getTableName(messages), getTableName(parts)]
      const uniqueNames = new Set(tableNames)
      expect(uniqueNames.size).toBe(3)
    })

    it('should have consistent timestamp column naming in chats', () => {
      expect(chats.createdAt.name).toBe('created_at')
      expect(chats.updatedAt.name).toBe('updated_at')
    })

    it('should have consistent timestamp column naming in messages', () => {
      expect(messages.createdAt.name).toBe('created_at')
    })

    it('should have consistent timestamp column naming in parts', () => {
      expect(parts.createdAt.name).toBe('created_at')
    })

    it('should have consistent primary key naming', () => {
      expect(chats.id.name).toBe('id')
      expect(messages.id.name).toBe('id')
      expect(parts.id.name).toBe('id')
    })

    it('should have consistent foreign key naming pattern', () => {
      expect(chats.userId.name).toBe('user_id')
      expect(messages.chatId.name).toBe('chat_id')
      expect(parts.messageId.name).toBe('message_id')
    })
  })
})
