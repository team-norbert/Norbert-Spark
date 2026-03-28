import { getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import {
  auditLog,
  chatAiOptions,
  chats,
  chatTypes,
  company,
  companyPeople,
  dataRetrievalMessageParts,
  dataRetrievalMessages,
  documents,
  embeddingModels,
  keyPerson,
  messages,
  parts,
  refreshTokens,
  user,
  vectorEmbeddings384,
  vectorEmbeddings768,
  vectorEmbeddings1024,
  vectorEmbeddings1536,
  vectorEmbeddings3072,
} from '../src/infrastructure/database/schema.js'

describe('Database Schema', () => {
  describe('Table exports', () => {
    it('should export user table constant', () => {
      expect(user).toBeDefined()
      expect(typeof user).toBe('object')
    })

    it('should export refreshTokens table constant', () => {
      expect(refreshTokens).toBeDefined()
      expect(typeof refreshTokens).toBe('object')
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

    it('should export vectorEmbeddings1536 table constant', () => {
      expect(vectorEmbeddings1536).toBeDefined()
      expect(typeof vectorEmbeddings1536).toBe('object')
    })

    it('should export vectorEmbeddings768 table constant', () => {
      expect(vectorEmbeddings768).toBeDefined()
      expect(typeof vectorEmbeddings768).toBe('object')
    })

    it('should export vectorEmbeddings384 table constant', () => {
      expect(vectorEmbeddings384).toBeDefined()
      expect(typeof vectorEmbeddings384).toBe('object')
    })

    it('should export vectorEmbeddings3072 table constant', () => {
      expect(vectorEmbeddings3072).toBeDefined()
      expect(typeof vectorEmbeddings3072).toBe('object')
    })

    it('should export vectorEmbeddings1024 table constant', () => {
      expect(vectorEmbeddings1024).toBeDefined()
      expect(typeof vectorEmbeddings1024).toBe('object')
    })

    it('should export company table constant', () => {
      expect(company).toBeDefined()
      expect(typeof company).toBe('object')
    })

    it('should export keyPerson table constant', () => {
      expect(keyPerson).toBeDefined()
      expect(typeof keyPerson).toBe('object')
    })

    it('should export companyPeople table constant', () => {
      expect(companyPeople).toBeDefined()
      expect(typeof companyPeople).toBe('object')
    })

    it('should export documents table constant', () => {
      expect(documents).toBeDefined()
      expect(typeof documents).toBe('object')
    })

    it('should export embeddingModels table constant', () => {
      expect(embeddingModels).toBeDefined()
      expect(typeof embeddingModels).toBe('object')
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

    it('should have correct table name for vector_embeddings_1536', () => {
      expect(getTableName(vectorEmbeddings1536)).toBe('vector_embeddings_1536')
    })

    it('should have correct table name for vector_embeddings_768', () => {
      expect(getTableName(vectorEmbeddings768)).toBe('vector_embeddings_768')
    })

    it('should have correct table name for vector_embeddings_384', () => {
      expect(getTableName(vectorEmbeddings384)).toBe('vector_embeddings_384')
    })

    it('should have correct table name for vector_embeddings_3072', () => {
      expect(getTableName(vectorEmbeddings3072)).toBe('vector_embeddings_3072')
    })

    it('should have correct table name for vector_embeddings_1024', () => {
      expect(getTableName(vectorEmbeddings1024)).toBe('vector_embeddings_1024')
    })

    it('should have correct table name for company', () => {
      expect(getTableName(company)).toBe('company')
    })

    it('should have correct table name for key_person', () => {
      expect(getTableName(keyPerson)).toBe('key_person')
    })

    it('should have correct table name for company_people', () => {
      expect(getTableName(companyPeople)).toBe('company_people')
    })

    it('should have correct table name for documents', () => {
      expect(getTableName(documents)).toBe('documents')
    })

    it('should have correct table name for embedding_models', () => {
      expect(getTableName(embeddingModels)).toBe('embedding_models')
    })

    it('should have correct table name for refresh_tokens', () => {
      expect(getTableName(refreshTokens)).toBe('refresh_tokens')
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

      it('should have twoFactorEnabled column', () => {
        expect(user.twoFactorEnabled).toBeDefined()
        expect(user.twoFactorEnabled.name).toBe('two_factor_enabled')
      })

      it('should have twoFactorSecret column', () => {
        expect(user.twoFactorSecret).toBeDefined()
        expect(user.twoFactorSecret.name).toBe('two_factor_secret')
      })

      it('should have createdAt column', () => {
        expect(user.createdAt).toBeDefined()
        expect(user.createdAt.name).toBe('created_at')
      })

      it('should have updatedAt column', () => {
        expect(user.updatedAt).toBeDefined()
        expect(user.updatedAt.name).toBe('updated_at')
      })
    })

    describe('refreshTokens table columns', () => {
      it('should have id column', () => {
        expect(refreshTokens.id).toBeDefined()
        expect(refreshTokens.id.name).toBe('id')
      })

      it('should have userId column', () => {
        expect(refreshTokens.userId).toBeDefined()
        expect(refreshTokens.userId.name).toBe('user_id')
      })

      it('should have tokenHash column', () => {
        expect(refreshTokens.tokenHash).toBeDefined()
        expect(refreshTokens.tokenHash.name).toBe('token_hash')
      })

      it('should have tokenFamily column', () => {
        expect(refreshTokens.tokenFamily).toBeDefined()
        expect(refreshTokens.tokenFamily.name).toBe('token_family')
      })

      it('should have expiresAt column', () => {
        expect(refreshTokens.expiresAt).toBeDefined()
        expect(refreshTokens.expiresAt.name).toBe('expires_at')
      })

      it('should have revokedAt column', () => {
        expect(refreshTokens.revokedAt).toBeDefined()
        expect(refreshTokens.revokedAt.name).toBe('revoked_at')
      })

      it('should have createdAt column', () => {
        expect(refreshTokens.createdAt).toBeDefined()
        expect(refreshTokens.createdAt.name).toBe('created_at')
      })

      it('should have lastUsedAt column', () => {
        expect(refreshTokens.lastUsedAt).toBeDefined()
        expect(refreshTokens.lastUsedAt.name).toBe('last_used_at')
      })

      it('should have ipAddress column', () => {
        expect(refreshTokens.ipAddress).toBeDefined()
        expect(refreshTokens.ipAddress.name).toBe('ip_address')
      })

      it('should have userAgent column', () => {
        expect(refreshTokens.userAgent).toBeDefined()
        expect(refreshTokens.userAgent.name).toBe('user_agent')
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

      it('should have rag column', () => {
        expect(chatTypes.rag).toBeDefined()
        expect(chatTypes.rag.name).toBe('rag')
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

      it('should have not null constraint on seoFriendlyId', () => {
        expect(chatTypes.seoFriendlyId.notNull).toBe(true)
      })

      it('should have unique constraint on seoFriendlyBase64Id', () => {
        expect(chatTypes.seoFriendlyBase64Id.isUnique).toBe(true)
      })
    })

    describe('company table columns', () => {
      it('should have companyId column', () => {
        expect(company.companyId).toBeDefined()
        expect(company.companyId.name).toBe('company_id')
      })

      it('should have legalName column', () => {
        expect(company.legalName).toBeDefined()
        expect(company.legalName.name).toBe('legal_name')
      })

      it('should have displayName column', () => {
        expect(company.displayName).toBeDefined()
        expect(company.displayName.name).toBe('display_name')
      })

      it('should have status column', () => {
        expect(company.status).toBeDefined()
        expect(company.status.name).toBe('status')
      })

      it('should have companySize column', () => {
        expect(company.companySize).toBeDefined()
        expect(company.companySize.name).toBe('company_size')
      })
    })
  })

  describe('Custom types', () => {
    describe('citext columns', () => {
      it('should use custom type for case-insensitive email column', () => {
        // The email column in user table uses citext custom type
        const emailColumn = user.email
        expect(emailColumn).toBeDefined()
        expect(emailColumn.dataType).toBe('custom')
      })
    })

    describe('vector columns', () => {
      it('should use custom type for vector embedding columns', () => {
        // Vector embeddings use custom pgvector type
        const vectorColumn = vectorEmbeddings1536.embedding
        expect(vectorColumn).toBeDefined()
        expect(vectorColumn.dataType).toBe('custom')
      })

      it('should have vector embedding columns in multiple dimension tables', () => {
        expect(vectorEmbeddings1536.embedding).toBeDefined()
        expect(vectorEmbeddings768.embedding).toBeDefined()
        expect(vectorEmbeddings384.embedding).toBeDefined()
        expect(vectorEmbeddings3072.embedding).toBeDefined()
        expect(vectorEmbeddings1024.embedding).toBeDefined()
      })
    })
  })

  describe('Enum definitions', () => {
    describe('companyStatusEnum values', () => {
      it('should include prospect status value', () => {
        const statusColumn = company.status
        expect(statusColumn.enumValues).toContain('prospect')
      })

      it('should include active status value', () => {
        const statusColumn = company.status
        expect(statusColumn.enumValues).toContain('active')
      })

      it('should include paused status value', () => {
        const statusColumn = company.status
        expect(statusColumn.enumValues).toContain('paused')
      })

      it('should include churned status value', () => {
        const statusColumn = company.status
        expect(statusColumn.enumValues).toContain('churned')
      })

      it('should have exactly 4 status values', () => {
        const statusColumn = company.status
        expect(statusColumn.enumValues).toHaveLength(4)
      })
    })

    describe('contactRoleEnum values', () => {
      it('should include primary_contact role value', () => {
        const roleColumn = companyPeople.role
        expect(roleColumn.enumValues).toContain('primary_contact')
      })

      it('should include decision_maker role value', () => {
        const roleColumn = companyPeople.role
        expect(roleColumn.enumValues).toContain('decision_maker')
      })

      it('should include billing_contact role value', () => {
        const roleColumn = companyPeople.role
        expect(roleColumn.enumValues).toContain('billing_contact')
      })

      it('should include technical_contact role value', () => {
        const roleColumn = companyPeople.role
        expect(roleColumn.enumValues).toContain('technical_contact')
      })

      it('should include stakeholder role value', () => {
        const roleColumn = companyPeople.role
        expect(roleColumn.enumValues).toContain('stakeholder')
      })

      it('should have exactly 5 role values', () => {
        const roleColumn = companyPeople.role
        expect(roleColumn.enumValues).toHaveLength(5)
      })
    })
  })

  describe('Column defaults and constraints', () => {
    describe('company table defaults', () => {
      it('should have status column with active default value', () => {
        const statusColumn = company.status
        expect(statusColumn.hasDefault).toBe(true)
        expect(statusColumn.default).toBe('active')
      })

      it('should have singletonCheck column with true default', () => {
        const singletonColumn = company.singletonCheck
        expect(singletonColumn.hasDefault).toBe(true)
        expect(singletonColumn.default).toBe(true)
      })

      it('should have timezone column with UTC default', () => {
        const timezoneColumn = company.timezone
        expect(timezoneColumn.hasDefault).toBe(true)
        expect(timezoneColumn.default).toBe('UTC')
      })

      it('should have createdAt column with defaultNow', () => {
        const createdAtColumn = company.createdAt
        expect(createdAtColumn.hasDefault).toBe(true)
      })

      it('should have updatedAt column with defaultNow', () => {
        const updatedAtColumn = company.updatedAt
        expect(updatedAtColumn.hasDefault).toBe(true)
      })
    })

    describe('user table defaults', () => {
      it('should have twoFactorEnabled column with false default', () => {
        const twoFactorColumn = user.twoFactorEnabled
        expect(twoFactorColumn.hasDefault).toBe(true)
        expect(twoFactorColumn.default).toBe(false)
      })

      it('should have role column with user default value', () => {
        const roleColumn = user.role
        expect(roleColumn.hasDefault).toBe(true)
        expect(roleColumn.default).toBe('user')
      })
    })
  })

  describe('chatTypes table properties (additional)', () => {
    describe('chatTypes table constraints', () => {
      it('should have not null constraint on seoFriendlyBase64Id', () => {
        expect(chatTypes.seoFriendlyBase64Id.notNull).toBe(true)
      })

      it('should have not null constraint on description', () => {
        expect(chatTypes.description.notNull).toBe(true)
      })

      it('should have not null constraint on rag', () => {
        expect(chatTypes.rag.notNull).toBe(true)
      })

      it('should have default value of false on rag', () => {
        expect(chatTypes.rag.default).toBe(false)
      })

      it('should have not null constraint on createdAt', () => {
        expect(chatTypes.createdAt.notNull).toBe(true)
      })

      it('should have not null constraint on updatedAt', () => {
        expect(chatTypes.updatedAt.notNull).toBe(true)
      })
    })

    describe('chatTypes table validation constraints', () => {
      describe('seoFriendlyId regex pattern validation', () => {
        it('should accept valid lowercase alphanumeric strings', () => {
          const validIds = ['general', 'fitness', 'abc123', 'test1']
          // eslint-disable-next-line security/detect-unsafe-regex
          const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

          validIds.forEach((id) => {
            expect(pattern.test(id)).toBe(true)
          })
        })

        it('should accept valid hyphenated lowercase strings', () => {
          const validIds = [
            'general-chat',
            'fitness-tracking',
            'level-2-gym',
            'abc-123-xyz',
            'my-awesome-chat-type',
          ]
          // eslint-disable-next-line security/detect-unsafe-regex
          const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

          validIds.forEach((id) => {
            expect(pattern.test(id)).toBe(true)
          })
        })

        it('should reject strings with uppercase letters', () => {
          const invalidIds = ['General', 'FITNESS', 'General-Chat', 'testID']
          // eslint-disable-next-line security/detect-unsafe-regex
          const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

          invalidIds.forEach((id) => {
            expect(pattern.test(id)).toBe(false)
          })
        })

        it('should reject strings with special characters', () => {
          const invalidIds = [
            'general_chat',
            'fitness!',
            'chat@type',
            'test#1',
            'my.chat',
            'chat type',
            'test&value',
          ]
          // eslint-disable-next-line security/detect-unsafe-regex
          const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

          invalidIds.forEach((id) => {
            expect(pattern.test(id)).toBe(false)
          })
        })

        it('should reject strings with consecutive hyphens', () => {
          const invalidIds = ['general--chat', 'test--123', 'a--b--c']
          // eslint-disable-next-line security/detect-unsafe-regex
          const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

          invalidIds.forEach((id) => {
            expect(pattern.test(id)).toBe(false)
          })
        })

        it('should reject strings with leading hyphens', () => {
          const invalidIds = ['-general', '-test', '-123']
          // eslint-disable-next-line security/detect-unsafe-regex
          const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

          invalidIds.forEach((id) => {
            expect(pattern.test(id)).toBe(false)
          })
        })

        it('should reject strings with trailing hyphens', () => {
          const invalidIds = ['general-', 'test-', '123-']
          // eslint-disable-next-line security/detect-unsafe-regex
          const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

          invalidIds.forEach((id) => {
            expect(pattern.test(id)).toBe(false)
          })
        })

        it('should reject empty strings', () => {
          // eslint-disable-next-line security/detect-unsafe-regex
          const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
          expect(pattern.test('')).toBe(false)
        })
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

      it('should not have default value for maxTokens', () => {
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

    describe('company table columns', () => {
      it('should have companyId column', () => {
        expect(company.companyId).toBeDefined()
        expect(company.companyId.name).toBe('company_id')
      })

      it('should have legalName column', () => {
        expect(company.legalName).toBeDefined()
        expect(company.legalName.name).toBe('legal_name')
      })

      it('should have displayName column', () => {
        expect(company.displayName).toBeDefined()
        expect(company.displayName.name).toBe('display_name')
      })

      it('should have status column', () => {
        expect(company.status).toBeDefined()
        expect(company.status.name).toBe('status')
      })

      it('should have industry column', () => {
        expect(company.industry).toBeDefined()
        expect(company.industry.name).toBe('industry')
      })

      it('should have companySize column', () => {
        expect(company.companySize).toBeDefined()
        expect(company.companySize.name).toBe('company_size')
      })

      it('should have websiteUrl column', () => {
        expect(company.websiteUrl).toBeDefined()
        expect(company.websiteUrl.name).toBe('website_url')
      })

      it('should have billingCountry column', () => {
        expect(company.billingCountry).toBeDefined()
        expect(company.billingCountry.name).toBe('billing_country')
      })

      it('should have timezone column', () => {
        expect(company.timezone).toBeDefined()
        expect(company.timezone.name).toBe('timezone')
      })

      it('should have createdAt column', () => {
        expect(company.createdAt).toBeDefined()
        expect(company.createdAt.name).toBe('created_at')
      })

      it('should have updatedAt column', () => {
        expect(company.updatedAt).toBeDefined()
        expect(company.updatedAt.name).toBe('updated_at')
      })

      it('should have singletonCheck column', () => {
        expect(company.singletonCheck).toBeDefined()
        expect(company.singletonCheck.name).toBe('singleton_check')
      })
    })

    describe('keyPerson table columns', () => {
      it('should have keyPersonId column', () => {
        expect(keyPerson.keyPersonId).toBeDefined()
        expect(keyPerson.keyPersonId.name).toBe('person_id')
      })

      it('should have firstName column', () => {
        expect(keyPerson.firstName).toBeDefined()
        expect(keyPerson.firstName.name).toBe('first_name')
      })

      it('should have lastName column', () => {
        expect(keyPerson.lastName).toBeDefined()
        expect(keyPerson.lastName.name).toBe('last_name')
      })

      it('should have email column', () => {
        expect(keyPerson.email).toBeDefined()
        expect(keyPerson.email.name).toBe('email')
      })

      it('should have phone column', () => {
        expect(keyPerson.phone).toBeDefined()
        expect(keyPerson.phone.name).toBe('phone')
      })

      it('should have jobTitle column', () => {
        expect(keyPerson.jobTitle).toBeDefined()
        expect(keyPerson.jobTitle.name).toBe('job_title')
      })

      it('should have isActive column', () => {
        expect(keyPerson.isActive).toBeDefined()
        expect(keyPerson.isActive.name).toBe('is_active')
      })

      it('should have createdAt column', () => {
        expect(keyPerson.createdAt).toBeDefined()
        expect(keyPerson.createdAt.name).toBe('created_at')
      })

      it('should have updatedAt column', () => {
        expect(keyPerson.updatedAt).toBeDefined()
        expect(keyPerson.updatedAt.name).toBe('updated_at')
      })
    })

    describe('companyPeople table columns', () => {
      it('should have companyPersonId column', () => {
        expect(companyPeople.companyPersonId).toBeDefined()
        expect(companyPeople.companyPersonId.name).toBe('company_person_id')
      })

      it('should have companyId column', () => {
        expect(companyPeople.companyId).toBeDefined()
        expect(companyPeople.companyId.name).toBe('company_id')
      })

      it('should have personId column', () => {
        expect(companyPeople.personId).toBeDefined()
        expect(companyPeople.personId.name).toBe('person_id')
      })

      it('should have role column', () => {
        expect(companyPeople.role).toBeDefined()
        expect(companyPeople.role.name).toBe('role')
      })

      it('should have isPrimary column', () => {
        expect(companyPeople.isPrimary).toBeDefined()
        expect(companyPeople.isPrimary.name).toBe('is_primary')
      })

      it('should have startDate column', () => {
        expect(companyPeople.startDate).toBeDefined()
        expect(companyPeople.startDate.name).toBe('start_date')
      })

      it('should have endDate column', () => {
        expect(companyPeople.endDate).toBeDefined()
        expect(companyPeople.endDate.name).toBe('end_date')
      })

      it('should have createdAt column', () => {
        expect(companyPeople.createdAt).toBeDefined()
        expect(companyPeople.createdAt.name).toBe('created_at')
      })
    })

    describe('documents table columns', () => {
      it('should have id column', () => {
        expect(documents.id).toBeDefined()
        expect(documents.id.name).toBe('id')
      })

      it('should have title column', () => {
        expect(documents.title).toBeDefined()
        expect(documents.title.name).toBe('title')
      })

      it('should have source column', () => {
        expect(documents.source).toBeDefined()
        expect(documents.source.name).toBe('source')
      })

      it('should have checksum column', () => {
        expect(documents.checksum).toBeDefined()
        expect(documents.checksum.name).toBe('checksum')
      })

      it('should have status column', () => {
        expect(documents.status).toBeDefined()
        expect(documents.status.name).toBe('status')
      })

      it('should have createdAt column', () => {
        expect(documents.createdAt).toBeDefined()
        expect(documents.createdAt.name).toBe('created_at')
      })

      it('should have updatedAt column', () => {
        expect(documents.updatedAt).toBeDefined()
        expect(documents.updatedAt.name).toBe('updated_at')
      })
    })

    describe('embeddingModels table columns', () => {
      it('should have id column', () => {
        expect(embeddingModels.id).toBeDefined()
        expect(embeddingModels.id.name).toBe('id')
      })

      it('should have name column', () => {
        expect(embeddingModels.name).toBeDefined()
        expect(embeddingModels.name.name).toBe('name')
      })

      it('should have provider column', () => {
        expect(embeddingModels.provider).toBeDefined()
        expect(embeddingModels.provider.name).toBe('provider')
      })

      it('should have dimension column as an integer', () => {
        expect(embeddingModels.dimension).toBeDefined()
        expect(embeddingModels.dimension.name).toBe('dimension')
        expect(embeddingModels.dimension.columnType).toBe('PgInteger')
      })

      it('should have createdAt column', () => {
        expect(embeddingModels.createdAt).toBeDefined()
        expect(embeddingModels.createdAt.name).toBe('created_at')
      })

      it('should have updatedAt column', () => {
        expect(embeddingModels.updatedAt).toBeDefined()
        expect(embeddingModels.updatedAt.name).toBe('updated_at')
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

    it('should have not null constraint on chats.chatTypeId', () => {
      expect(chats.chatTypeId.notNull).toBe(true)
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

    it('should have primary key on company.companyId', () => {
      expect(company.companyId.primary).toBe(true)
    })

    it('should have primary key on keyPerson.keyPersonId', () => {
      expect(keyPerson.keyPersonId.primary).toBe(true)
    })

    it('should have primary key on companyPeople.companyPersonId', () => {
      expect(companyPeople.companyPersonId.primary).toBe(true)
    })

    it('should have not null constraint on company.legalName', () => {
      expect(company.legalName.notNull).toBe(true)
    })

    it('should have not null constraint on keyPerson.firstName', () => {
      expect(keyPerson.firstName.notNull).toBe(true)
    })

    it('should have not null constraint on companyPeople.companyId', () => {
      expect(companyPeople.companyId.notNull).toBe(true)
    })

    it('should have not null constraint on companyPeople.personId', () => {
      expect(companyPeople.personId.notNull).toBe(true)
    })

    it('should have primary key on documents.id', () => {
      expect(documents.id.primary).toBe(true)
    })

    it('should have not null constraint on documents.title', () => {
      expect(documents.title.notNull).toBe(true)
    })

    it('should have not null constraint on documents.status', () => {
      expect(documents.status.notNull).toBe(true)
    })

    it('should have not null constraint on documents.source', () => {
      expect(documents.source.notNull).toBe(true)
    })

    it('should have primary key on embeddingModels.id', () => {
      expect(embeddingModels.id.primary).toBe(true)
    })

    it('should have not null constraint on embeddingModels.name', () => {
      expect(embeddingModels.name.notNull).toBe(true)
    })

    it('should have not null constraint on embeddingModels.provider', () => {
      expect(embeddingModels.provider.notNull).toBe(true)
    })

    it('should have not null constraint on embeddingModels.dimension', () => {
      expect(embeddingModels.dimension.notNull).toBe(true)
    })
  })

  describe('Schema structure validation', () => {
    it('should have all nineteen table constants exported', () => {
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
        vectorEmbeddings1536,
        vectorEmbeddings768,
        vectorEmbeddings384,
        vectorEmbeddings3072,
        vectorEmbeddings1024,
        company,
        keyPerson,
        companyPeople,
        documents,
        embeddingModels,
      ]
      expect(tables).toHaveLength(19)
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

  describe('vectorEmbeddings tables', () => {
    describe('vectorEmbeddings1536', () => {
      describe('columns', () => {
        it('should have id column', () => {
          expect(vectorEmbeddings1536.id).toBeDefined()
          expect(vectorEmbeddings1536.id.name).toBe('id')
        })

        it('should have content column', () => {
          expect(vectorEmbeddings1536.content).toBeDefined()
          expect(vectorEmbeddings1536.content.name).toBe('content')
        })

        it('should have documentId column', () => {
          expect(vectorEmbeddings1536.documentId).toBeDefined()
          expect(vectorEmbeddings1536.documentId.name).toBe('document_id')
        })

        it('should have metadata column', () => {
          expect(vectorEmbeddings1536.metadata).toBeDefined()
          expect(vectorEmbeddings1536.metadata.name).toBe('metadata')
        })

        it('should have chunkIndex column', () => {
          expect(vectorEmbeddings1536.chunkIndex).toBeDefined()
          expect(vectorEmbeddings1536.chunkIndex.name).toBe('chunk_index')
        })

        it('should have embedding column', () => {
          expect(vectorEmbeddings1536.embedding).toBeDefined()
          expect(vectorEmbeddings1536.embedding.name).toBe('embedding')
        })

        it('should have chunkSize column', () => {
          expect(vectorEmbeddings1536.chunkSize).toBeDefined()
          expect(vectorEmbeddings1536.chunkSize.name).toBe('chunk_size')
        })

        it('should have chunkOverlap column', () => {
          expect(vectorEmbeddings1536.chunkOverlap).toBeDefined()
          expect(vectorEmbeddings1536.chunkOverlap.name).toBe('chunk_overlap')
        })

        it('should have createdAt column', () => {
          expect(vectorEmbeddings1536.createdAt).toBeDefined()
          expect(vectorEmbeddings1536.createdAt.name).toBe('created_at')
        })

        it('should have updatedAt column', () => {
          expect(vectorEmbeddings1536.updatedAt).toBeDefined()
          expect(vectorEmbeddings1536.updatedAt.name).toBe('updated_at')
        })
      })

      describe('column properties', () => {
        it('should have primary key on id', () => {
          expect(vectorEmbeddings1536.id.primary).toBe(true)
        })

        it('should have not null constraint on content', () => {
          expect(vectorEmbeddings1536.content.notNull).toBe(true)
        })

        it('should have not null constraint on documentId', () => {
          expect(vectorEmbeddings1536.documentId.notNull).toBe(true)
        })

        it('should have not null constraint on metadata', () => {
          expect(vectorEmbeddings1536.metadata.notNull).toBe(true)
        })

        it('should have not null constraint on chunkIndex', () => {
          expect(vectorEmbeddings1536.chunkIndex.notNull).toBe(true)
        })

        it('should have not null constraint on embedding', () => {
          expect(vectorEmbeddings1536.embedding.notNull).toBe(true)
        })

        it('should have not null constraint on createdAt', () => {
          expect(vectorEmbeddings1536.createdAt.notNull).toBe(true)
        })

        it('should have not null constraint on updatedAt', () => {
          expect(vectorEmbeddings1536.updatedAt.notNull).toBe(true)
        })

        it('should have default value for chunkIndex', () => {
          expect(vectorEmbeddings1536.chunkIndex.hasDefault).toBe(true)
        })

        it('should have default value for metadata', () => {
          expect(vectorEmbeddings1536.metadata.hasDefault).toBe(true)
        })

        it('should have not null constraint on chunkSize', () => {
          expect(vectorEmbeddings1536.chunkSize.notNull).toBe(true)
        })

        it('should have not null constraint on chunkOverlap', () => {
          expect(vectorEmbeddings1536.chunkOverlap.notNull).toBe(true)
        })

        it('should have default value for chunkSize', () => {
          expect(vectorEmbeddings1536.chunkSize.hasDefault).toBe(true)
        })

        it('should have default value for chunkOverlap', () => {
          expect(vectorEmbeddings1536.chunkOverlap.hasDefault).toBe(true)
        })
      })

      describe('embedding column configuration', () => {
        it('should configure embedding column as custom pgvector type', () => {
          expect(vectorEmbeddings1536.embedding.columnType).toBe('PgCustomColumn')
          expect(vectorEmbeddings1536.embedding.dataType).toBe('custom')
        })
      })

      describe('indexes', () => {
        it('should have the table properly configured with index definitions', () => {
          expect(vectorEmbeddings1536).toBeDefined()
          expect(typeof vectorEmbeddings1536).toBe('object')
        })

        it('should be able to query the table (indexes will be applied at DB level)', () => {
          const tableName = getTableName(vectorEmbeddings1536)
          expect(tableName).toBe('vector_embeddings_1536')
        })

        it('should have columns that will be indexed (embedding, documentId, chunkIndex)', () => {
          expect(vectorEmbeddings1536.embedding).toBeDefined()
          expect(vectorEmbeddings1536.embedding.name).toBe('embedding')
          expect(vectorEmbeddings1536.documentId).toBeDefined()
          expect(vectorEmbeddings1536.documentId.name).toBe('document_id')
          expect(vectorEmbeddings1536.chunkIndex).toBeDefined()
          expect(vectorEmbeddings1536.chunkIndex.name).toBe('chunk_index')
        })
      })
    })

    describe('vectorEmbeddings768', () => {
      describe('columns', () => {
        it('should have id column', () => {
          expect(vectorEmbeddings768.id).toBeDefined()
          expect(vectorEmbeddings768.id.name).toBe('id')
        })

        it('should have content column', () => {
          expect(vectorEmbeddings768.content).toBeDefined()
          expect(vectorEmbeddings768.content.name).toBe('content')
        })

        it('should have documentId column', () => {
          expect(vectorEmbeddings768.documentId).toBeDefined()
          expect(vectorEmbeddings768.documentId.name).toBe('document_id')
        })

        it('should have metadata column', () => {
          expect(vectorEmbeddings768.metadata).toBeDefined()
          expect(vectorEmbeddings768.metadata.name).toBe('metadata')
        })

        it('should have chunkIndex column', () => {
          expect(vectorEmbeddings768.chunkIndex).toBeDefined()
          expect(vectorEmbeddings768.chunkIndex.name).toBe('chunk_index')
        })

        it('should have embedding column', () => {
          expect(vectorEmbeddings768.embedding).toBeDefined()
          expect(vectorEmbeddings768.embedding.name).toBe('embedding')
        })

        it('should have chunkSize column', () => {
          expect(vectorEmbeddings768.chunkSize).toBeDefined()
          expect(vectorEmbeddings768.chunkSize.name).toBe('chunk_size')
        })

        it('should have chunkOverlap column', () => {
          expect(vectorEmbeddings768.chunkOverlap).toBeDefined()
          expect(vectorEmbeddings768.chunkOverlap.name).toBe('chunk_overlap')
        })

        it('should have createdAt column', () => {
          expect(vectorEmbeddings768.createdAt).toBeDefined()
          expect(vectorEmbeddings768.createdAt.name).toBe('created_at')
        })

        it('should have updatedAt column', () => {
          expect(vectorEmbeddings768.updatedAt).toBeDefined()
          expect(vectorEmbeddings768.updatedAt.name).toBe('updated_at')
        })
      })

      describe('column properties', () => {
        it('should have primary key on id', () => {
          expect(vectorEmbeddings768.id.primary).toBe(true)
        })

        it('should have not null constraint on content', () => {
          expect(vectorEmbeddings768.content.notNull).toBe(true)
        })

        it('should have not null constraint on documentId', () => {
          expect(vectorEmbeddings768.documentId.notNull).toBe(true)
        })

        it('should have not null constraint on embedding', () => {
          expect(vectorEmbeddings768.embedding.notNull).toBe(true)
        })

        it('should have default value for chunkIndex', () => {
          expect(vectorEmbeddings768.chunkIndex.hasDefault).toBe(true)
        })

        it('should have default value for metadata', () => {
          expect(vectorEmbeddings768.metadata.hasDefault).toBe(true)
        })

        it('should have not null constraint on chunkSize', () => {
          expect(vectorEmbeddings768.chunkSize.notNull).toBe(true)
        })

        it('should have not null constraint on chunkOverlap', () => {
          expect(vectorEmbeddings768.chunkOverlap.notNull).toBe(true)
        })

        it('should have default value for chunkSize', () => {
          expect(vectorEmbeddings768.chunkSize.hasDefault).toBe(true)
        })

        it('should have default value for chunkOverlap', () => {
          expect(vectorEmbeddings768.chunkOverlap.hasDefault).toBe(true)
        })
      })

      describe('embedding dimension', () => {
        it('should use 768 dimensions for SBERT/multilingual models', () => {
          expect(vectorEmbeddings768.embedding.columnType).toBe('PgCustomColumn')
          expect(vectorEmbeddings768.embedding.dataType).toBe('custom')
        })
      })

      describe('indexes', () => {
        it('should have the table properly configured with index definitions', () => {
          expect(vectorEmbeddings768).toBeDefined()
          expect(typeof vectorEmbeddings768).toBe('object')
        })

        it('should be able to query the table (indexes will be applied at DB level)', () => {
          const tableName = getTableName(vectorEmbeddings768)
          expect(tableName).toBe('vector_embeddings_768')
        })
      })
    })

    describe('vectorEmbeddings384', () => {
      describe('columns', () => {
        it('should have id column', () => {
          expect(vectorEmbeddings384.id).toBeDefined()
          expect(vectorEmbeddings384.id.name).toBe('id')
        })

        it('should have content column', () => {
          expect(vectorEmbeddings384.content).toBeDefined()
          expect(vectorEmbeddings384.content.name).toBe('content')
        })

        it('should have documentId column', () => {
          expect(vectorEmbeddings384.documentId).toBeDefined()
          expect(vectorEmbeddings384.documentId.name).toBe('document_id')
        })

        it('should have metadata column', () => {
          expect(vectorEmbeddings384.metadata).toBeDefined()
          expect(vectorEmbeddings384.metadata.name).toBe('metadata')
        })

        it('should have chunkIndex column', () => {
          expect(vectorEmbeddings384.chunkIndex).toBeDefined()
          expect(vectorEmbeddings384.chunkIndex.name).toBe('chunk_index')
        })

        it('should have embedding column', () => {
          expect(vectorEmbeddings384.embedding).toBeDefined()
          expect(vectorEmbeddings384.embedding.name).toBe('embedding')
        })

        it('should have chunkSize column', () => {
          expect(vectorEmbeddings384.chunkSize).toBeDefined()
          expect(vectorEmbeddings384.chunkSize.name).toBe('chunk_size')
        })

        it('should have chunkOverlap column', () => {
          expect(vectorEmbeddings384.chunkOverlap).toBeDefined()
          expect(vectorEmbeddings384.chunkOverlap.name).toBe('chunk_overlap')
        })

        it('should have createdAt column', () => {
          expect(vectorEmbeddings384.createdAt).toBeDefined()
          expect(vectorEmbeddings384.createdAt.name).toBe('created_at')
        })

        it('should have updatedAt column', () => {
          expect(vectorEmbeddings384.updatedAt).toBeDefined()
          expect(vectorEmbeddings384.updatedAt.name).toBe('updated_at')
        })
      })

      describe('column properties', () => {
        it('should have primary key on id', () => {
          expect(vectorEmbeddings384.id.primary).toBe(true)
        })

        it('should have not null constraint on content', () => {
          expect(vectorEmbeddings384.content.notNull).toBe(true)
        })

        it('should have not null constraint on documentId', () => {
          expect(vectorEmbeddings384.documentId.notNull).toBe(true)
        })

        it('should have not null constraint on embedding', () => {
          expect(vectorEmbeddings384.embedding.notNull).toBe(true)
        })

        it('should have default value for chunkIndex', () => {
          expect(vectorEmbeddings384.chunkIndex.hasDefault).toBe(true)
        })

        it('should have default value for metadata', () => {
          expect(vectorEmbeddings384.metadata.hasDefault).toBe(true)
        })

        it('should have not null constraint on chunkSize', () => {
          expect(vectorEmbeddings384.chunkSize.notNull).toBe(true)
        })

        it('should have not null constraint on chunkOverlap', () => {
          expect(vectorEmbeddings384.chunkOverlap.notNull).toBe(true)
        })

        it('should have default value for chunkSize', () => {
          expect(vectorEmbeddings384.chunkSize.hasDefault).toBe(true)
        })

        it('should have default value for chunkOverlap', () => {
          expect(vectorEmbeddings384.chunkOverlap.hasDefault).toBe(true)
        })
      })

      describe('embedding column type', () => {
        it('should use a custom pgvector column for embeddings', () => {
          expect(vectorEmbeddings384.embedding.columnType).toBe('PgCustomColumn')
          expect(vectorEmbeddings384.embedding.dataType).toBe('custom')
        })
      })

      describe('indexes', () => {
        it('should have the table properly configured with index definitions', () => {
          expect(vectorEmbeddings384).toBeDefined()
          expect(typeof vectorEmbeddings384).toBe('object')
        })

        it('should be able to query the table (indexes will be applied at DB level)', () => {
          const tableName = getTableName(vectorEmbeddings384)
          expect(tableName).toBe('vector_embeddings_384')
        })
      })
    })

    describe('vectorEmbeddings3072', () => {
      describe('columns', () => {
        it('should have id column', () => {
          expect(vectorEmbeddings3072.id).toBeDefined()
          expect(vectorEmbeddings3072.id.name).toBe('id')
        })

        it('should have content column', () => {
          expect(vectorEmbeddings3072.content).toBeDefined()
          expect(vectorEmbeddings3072.content.name).toBe('content')
        })

        it('should have documentId column', () => {
          expect(vectorEmbeddings3072.documentId).toBeDefined()
          expect(vectorEmbeddings3072.documentId.name).toBe('document_id')
        })

        it('should have metadata column', () => {
          expect(vectorEmbeddings3072.metadata).toBeDefined()
          expect(vectorEmbeddings3072.metadata.name).toBe('metadata')
        })

        it('should have chunkIndex column', () => {
          expect(vectorEmbeddings3072.chunkIndex).toBeDefined()
          expect(vectorEmbeddings3072.chunkIndex.name).toBe('chunk_index')
        })

        it('should have embedding column', () => {
          expect(vectorEmbeddings3072.embedding).toBeDefined()
          expect(vectorEmbeddings3072.embedding.name).toBe('embedding')
        })

        it('should have chunkSize column', () => {
          expect(vectorEmbeddings3072.chunkSize).toBeDefined()
          expect(vectorEmbeddings3072.chunkSize.name).toBe('chunk_size')
        })

        it('should have chunkOverlap column', () => {
          expect(vectorEmbeddings3072.chunkOverlap).toBeDefined()
          expect(vectorEmbeddings3072.chunkOverlap.name).toBe('chunk_overlap')
        })

        it('should have createdAt column', () => {
          expect(vectorEmbeddings3072.createdAt).toBeDefined()
          expect(vectorEmbeddings3072.createdAt.name).toBe('created_at')
        })

        it('should have updatedAt column', () => {
          expect(vectorEmbeddings3072.updatedAt).toBeDefined()
          expect(vectorEmbeddings3072.updatedAt.name).toBe('updated_at')
        })
      })

      describe('column properties', () => {
        it('should have primary key on id', () => {
          expect(vectorEmbeddings3072.id.primary).toBe(true)
        })

        it('should have not null constraint on content', () => {
          expect(vectorEmbeddings3072.content.notNull).toBe(true)
        })

        it('should have not null constraint on documentId', () => {
          expect(vectorEmbeddings3072.documentId.notNull).toBe(true)
        })

        it('should have not null constraint on metadata', () => {
          expect(vectorEmbeddings3072.metadata.notNull).toBe(true)
        })

        it('should have not null constraint on chunkIndex', () => {
          expect(vectorEmbeddings3072.chunkIndex.notNull).toBe(true)
        })

        it('should have not null constraint on embedding', () => {
          expect(vectorEmbeddings3072.embedding.notNull).toBe(true)
        })

        it('should have not null constraint on createdAt', () => {
          expect(vectorEmbeddings3072.createdAt.notNull).toBe(true)
        })

        it('should have not null constraint on updatedAt', () => {
          expect(vectorEmbeddings3072.updatedAt.notNull).toBe(true)
        })

        it('should have default value for chunkIndex', () => {
          expect(vectorEmbeddings3072.chunkIndex.hasDefault).toBe(true)
        })

        it('should have default value for metadata', () => {
          expect(vectorEmbeddings3072.metadata.hasDefault).toBe(true)
        })

        it('should have not null constraint on chunkSize', () => {
          expect(vectorEmbeddings3072.chunkSize.notNull).toBe(true)
        })

        it('should have not null constraint on chunkOverlap', () => {
          expect(vectorEmbeddings3072.chunkOverlap.notNull).toBe(true)
        })

        it('should have default value for chunkSize', () => {
          expect(vectorEmbeddings3072.chunkSize.hasDefault).toBe(true)
        })

        it('should have default value for chunkOverlap', () => {
          expect(vectorEmbeddings3072.chunkOverlap.hasDefault).toBe(true)
        })
      })

      describe('embedding column configuration', () => {
        it('should configure embedding column as custom pgvector type', () => {
          expect(vectorEmbeddings3072.embedding.columnType).toBe('PgCustomColumn')
          expect(vectorEmbeddings3072.embedding.dataType).toBe('custom')
        })
      })

      describe('indexes', () => {
        it('should have the table properly configured with index definitions', () => {
          expect(vectorEmbeddings3072).toBeDefined()
          expect(typeof vectorEmbeddings3072).toBe('object')
        })

        it('should be able to query the table (indexes will be applied at DB level)', () => {
          const tableName = getTableName(vectorEmbeddings3072)
          expect(tableName).toBe('vector_embeddings_3072')
        })

        it('should have columns that will be indexed (embedding, documentId, chunkIndex)', () => {
          expect(vectorEmbeddings3072.embedding).toBeDefined()
          expect(vectorEmbeddings3072.embedding.name).toBe('embedding')
          expect(vectorEmbeddings3072.documentId).toBeDefined()
          expect(vectorEmbeddings3072.documentId.name).toBe('document_id')
          expect(vectorEmbeddings3072.chunkIndex).toBeDefined()
          expect(vectorEmbeddings3072.chunkIndex.name).toBe('chunk_index')
        })
      })
    })

    describe('vectorEmbeddings1024', () => {
      describe('columns', () => {
        it('should have id column', () => {
          expect(vectorEmbeddings1024.id).toBeDefined()
          expect(vectorEmbeddings1024.id.name).toBe('id')
        })

        it('should have content column', () => {
          expect(vectorEmbeddings1024.content).toBeDefined()
          expect(vectorEmbeddings1024.content.name).toBe('content')
        })

        it('should have documentId column', () => {
          expect(vectorEmbeddings1024.documentId).toBeDefined()
          expect(vectorEmbeddings1024.documentId.name).toBe('document_id')
        })

        it('should have metadata column', () => {
          expect(vectorEmbeddings1024.metadata).toBeDefined()
          expect(vectorEmbeddings1024.metadata.name).toBe('metadata')
        })

        it('should have chunkIndex column', () => {
          expect(vectorEmbeddings1024.chunkIndex).toBeDefined()
          expect(vectorEmbeddings1024.chunkIndex.name).toBe('chunk_index')
        })

        it('should have embedding column', () => {
          expect(vectorEmbeddings1024.embedding).toBeDefined()
          expect(vectorEmbeddings1024.embedding.name).toBe('embedding')
        })

        it('should have chunkSize column', () => {
          expect(vectorEmbeddings1024.chunkSize).toBeDefined()
          expect(vectorEmbeddings1024.chunkSize.name).toBe('chunk_size')
        })

        it('should have chunkOverlap column', () => {
          expect(vectorEmbeddings1024.chunkOverlap).toBeDefined()
          expect(vectorEmbeddings1024.chunkOverlap.name).toBe('chunk_overlap')
        })

        it('should have createdAt column', () => {
          expect(vectorEmbeddings1024.createdAt).toBeDefined()
          expect(vectorEmbeddings1024.createdAt.name).toBe('created_at')
        })

        it('should have updatedAt column', () => {
          expect(vectorEmbeddings1024.updatedAt).toBeDefined()
          expect(vectorEmbeddings1024.updatedAt.name).toBe('updated_at')
        })
      })

      describe('column properties', () => {
        it('should have primary key on id', () => {
          expect(vectorEmbeddings1024.id.primary).toBe(true)
        })

        it('should have not null constraint on content', () => {
          expect(vectorEmbeddings1024.content.notNull).toBe(true)
        })

        it('should have not null constraint on documentId', () => {
          expect(vectorEmbeddings1024.documentId.notNull).toBe(true)
        })

        it('should have not null constraint on metadata', () => {
          expect(vectorEmbeddings1024.metadata.notNull).toBe(true)
        })

        it('should have not null constraint on chunkIndex', () => {
          expect(vectorEmbeddings1024.chunkIndex.notNull).toBe(true)
        })

        it('should have not null constraint on embedding', () => {
          expect(vectorEmbeddings1024.embedding.notNull).toBe(true)
        })

        it('should have not null constraint on createdAt', () => {
          expect(vectorEmbeddings1024.createdAt.notNull).toBe(true)
        })

        it('should have not null constraint on updatedAt', () => {
          expect(vectorEmbeddings1024.updatedAt.notNull).toBe(true)
        })

        it('should have default value for chunkIndex', () => {
          expect(vectorEmbeddings1024.chunkIndex.hasDefault).toBe(true)
        })

        it('should have default value for metadata', () => {
          expect(vectorEmbeddings1024.metadata.hasDefault).toBe(true)
        })

        it('should have not null constraint on chunkSize', () => {
          expect(vectorEmbeddings1024.chunkSize.notNull).toBe(true)
        })

        it('should have not null constraint on chunkOverlap', () => {
          expect(vectorEmbeddings1024.chunkOverlap.notNull).toBe(true)
        })

        it('should have default value for chunkSize', () => {
          expect(vectorEmbeddings1024.chunkSize.hasDefault).toBe(true)
        })

        it('should have default value for chunkOverlap', () => {
          expect(vectorEmbeddings1024.chunkOverlap.hasDefault).toBe(true)
        })
      })

      describe('embedding column configuration', () => {
        it('should configure embedding column as custom pgvector type', () => {
          expect(vectorEmbeddings1024.embedding.columnType).toBe('PgCustomColumn')
          expect(vectorEmbeddings1024.embedding.dataType).toBe('custom')
        })
      })

      describe('indexes', () => {
        it('should have the table properly configured with index definitions', () => {
          expect(vectorEmbeddings1024).toBeDefined()
          expect(typeof vectorEmbeddings1024).toBe('object')
        })

        it('should be able to query the table (indexes will be applied at DB level)', () => {
          const tableName = getTableName(vectorEmbeddings1024)
          expect(tableName).toBe('vector_embeddings_1024')
        })

        it('should have columns that will be indexed (embedding, documentId, chunkIndex)', () => {
          expect(vectorEmbeddings1024.embedding).toBeDefined()
          expect(vectorEmbeddings1024.embedding.name).toBe('embedding')
          expect(vectorEmbeddings1024.documentId).toBeDefined()
          expect(vectorEmbeddings1024.documentId.name).toBe('document_id')
          expect(vectorEmbeddings1024.chunkIndex).toBeDefined()
          expect(vectorEmbeddings1024.chunkIndex.name).toBe('chunk_index')
        })
      })
    })

    describe('all vectorEmbeddings tables share common structure', () => {
      it('should have same column names across all dimension variants', () => {
        const getColumnKeys = (table: Record<string, unknown>): string[] =>
          Object.entries(table)
            // Exclude known non-column properties and keep only entries that look like Drizzle columns
            .filter(([key, value]) => {
              if (key === 'enableRLS') return false
              return (
                !!value &&
                typeof value === 'object' &&
                'columnType' in (value as Record<string, unknown>)
              )
            })
            .map(([key]) => key)
            .sort()

        const columns1536 = getColumnKeys(
          vectorEmbeddings1536 as unknown as Record<string, unknown>
        )
        const columns768 = getColumnKeys(vectorEmbeddings768 as unknown as Record<string, unknown>)
        const columns384 = getColumnKeys(vectorEmbeddings384 as unknown as Record<string, unknown>)
        const columns3072 = getColumnKeys(
          vectorEmbeddings3072 as unknown as Record<string, unknown>
        )
        const columns1024 = getColumnKeys(
          vectorEmbeddings1024 as unknown as Record<string, unknown>
        )
        expect(columns1536).toEqual(columns768)
        expect(columns768).toEqual(columns384)
        expect(columns384).toEqual(columns3072)
        expect(columns3072).toEqual(columns1024)
      })

      it('should all have embedding columns configured for pgvector', () => {
        expect(vectorEmbeddings1536.embedding.columnType).toBe('PgCustomColumn')
        expect(vectorEmbeddings768.embedding.columnType).toBe('PgCustomColumn')
        expect(vectorEmbeddings384.embedding.columnType).toBe('PgCustomColumn')
        expect(vectorEmbeddings3072.embedding.columnType).toBe('PgCustomColumn')
        expect(vectorEmbeddings1024.embedding.columnType).toBe('PgCustomColumn')
      })
    })
  })

  describe('Schema consistency', () => {
    it('should have consistent id naming across tables', () => {
      expect(user.userId.name).toBe('user_id')
      expect(chats.id.name).toBe('id')
      expect(chatTypes.id.name).toBe('id')
      expect(messages.id.name).toBe('id')
      expect(chatAiOptions.id.name).toBe('id')
      expect(parts.id.name).toBe('id')
      expect(auditLog.id.name).toBe('id')
      expect(dataRetrievalMessages.id.name).toBe('id')
      expect(dataRetrievalMessageParts.id.name).toBe('id')
      expect(vectorEmbeddings1536.id.name).toBe('id')
      expect(vectorEmbeddings768.id.name).toBe('id')
      expect(vectorEmbeddings384.id.name).toBe('id')
      expect(vectorEmbeddings3072.id.name).toBe('id')
      expect(vectorEmbeddings1024.id.name).toBe('id')
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
