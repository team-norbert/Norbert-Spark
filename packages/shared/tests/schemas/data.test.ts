import { getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import {
  dataRetrievalMessageParts,
  dataRetrievalMessages,
  type DBDataRetrievalMessage,
  type DBDataRetrievalMessagePart,
  type DBDataRetrievalMessagePartSelect,
  type DBDataRetrievalMessageSelect,
  pdfSchema,
} from '../../src/schemas/data.js'

describe('Data Schemas', () => {
  describe('pdfSchema', () => {
    it('should validate valid PDF invoice data', () => {
      const validData = {
        total: 1500.5,
        currency: 'USD',
        invoiceNumber: 'INV-2024-001',
        companyAddress: '123 Main St, New York, NY 10001',
        companyName: 'Acme Corporation',
        invoiceeAddress: '456 Oak Ave, Los Angeles, CA 90001',
      }

      const result = pdfSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should have correct field descriptions', () => {
      const shape = pdfSchema.shape
      expect(shape.total.description).toBe('The total amount of the invoice.')
      expect(shape.currency.description).toBe('The currency of the total amount.')
      expect(shape.invoiceNumber.description).toBe('The invoice number.')
      expect(shape.companyAddress.description).toBe(
        'The address of the company or person issuing the invoice.'
      )
      expect(shape.companyName.description).toBe('The name of the company issuing the invoice.')
      expect(shape.invoiceeAddress.description).toBe(
        'The address of the company or person receiving the invoice.'
      )
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        total: 1500.5,
        currency: 'USD',
        // missing other required fields
      }

      const result = pdfSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid total type', () => {
      const invalidData = {
        total: 'not a number',
        currency: 'USD',
        invoiceNumber: 'INV-001',
        companyAddress: '123 Main St',
        companyName: 'Acme Corp',
        invoiceeAddress: '456 Oak Ave',
      }

      const result = pdfSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing currency', () => {
      const invalidData = {
        total: 1500.5,
        invoiceNumber: 'INV-001',
        companyAddress: '123 Main St',
        companyName: 'Acme Corp',
        invoiceeAddress: '456 Oak Ave',
      }

      const result = pdfSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing invoice number', () => {
      const invalidData = {
        total: 1500.5,
        currency: 'USD',
        companyAddress: '123 Main St',
        companyName: 'Acme Corp',
        invoiceeAddress: '456 Oak Ave',
      }

      const result = pdfSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate with different currencies', () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD']

      currencies.forEach((currency) => {
        const data = {
          total: 1000,
          currency,
          invoiceNumber: 'INV-001',
          companyAddress: '123 Main St',
          companyName: 'Acme Corp',
          invoiceeAddress: '456 Oak Ave',
        }

        const result = pdfSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should validate with zero total', () => {
      const data = {
        total: 0,
        currency: 'USD',
        invoiceNumber: 'INV-001',
        companyAddress: '123 Main St',
        companyName: 'Acme Corp',
        invoiceeAddress: '456 Oak Ave',
      }

      const result = pdfSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should validate with negative total', () => {
      const data = {
        total: -100,
        currency: 'USD',
        invoiceNumber: 'CREDIT-001',
        companyAddress: '123 Main St',
        companyName: 'Acme Corp',
        invoiceeAddress: '456 Oak Ave',
      }

      const result = pdfSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('dataRetrievalMessages table', () => {
    it('should export dataRetrievalMessages table constant', () => {
      expect(dataRetrievalMessages).toBeDefined()
      expect(typeof dataRetrievalMessages).toBe('object')
    })

    it('should have correct table name', () => {
      expect(getTableName(dataRetrievalMessages)).toBe('data_retrieval_messages')
    })

    describe('columns', () => {
      it('should have id column', () => {
        expect(dataRetrievalMessages.id).toBeDefined()
        expect(dataRetrievalMessages.id.name).toBe('id')
      })

      it('should have createdAt column', () => {
        expect(dataRetrievalMessages.createdAt).toBeDefined()
        expect(dataRetrievalMessages.createdAt.name).toBe('created_at')
      })
    })

    describe('column properties', () => {
      it('should have primary key on id', () => {
        expect(dataRetrievalMessages.id.primary).toBe(true)
      })

      it('should have not null constraint on createdAt', () => {
        expect(dataRetrievalMessages.createdAt.notNull).toBe(true)
      })
    })
  })

  describe('dataRetrievalMessageParts table', () => {
    it('should export dataRetrievalMessageParts table constant', () => {
      expect(dataRetrievalMessageParts).toBeDefined()
      expect(typeof dataRetrievalMessageParts).toBe('object')
    })

    it('should have correct table name', () => {
      expect(getTableName(dataRetrievalMessageParts)).toBe('data_retrieval_message_parts')
    })

    describe('columns', () => {
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

    describe('column properties', () => {
      it('should have primary key on id', () => {
        expect(dataRetrievalMessageParts.id.primary).toBe(true)
      })

      it('should have not null constraint on messageId', () => {
        expect(dataRetrievalMessageParts.messageId.notNull).toBe(true)
      })

      it('should have not null constraint on type', () => {
        expect(dataRetrievalMessageParts.type.notNull).toBe(true)
      })

      it('should have not null constraint on createdAt', () => {
        expect(dataRetrievalMessageParts.createdAt.notNull).toBe(true)
      })

      it('should have nullable textJson', () => {
        expect(dataRetrievalMessageParts.textJson.notNull).toBe(false)
      })
    })
  })

  describe('DBDataRetrievalMessage type', () => {
    it('should be a valid insert type', () => {
      const mockMessage: DBDataRetrievalMessage = {}

      expect(mockMessage).toBeDefined()
    })

    it('should allow optional id for insert', () => {
      const mockMessage: DBDataRetrievalMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      }

      expect(mockMessage.id).toBe('123e4567-e89b-12d3-a456-426614174000')
    })

    it('should allow optional createdAt for insert', () => {
      const mockMessage: DBDataRetrievalMessage = {
        createdAt: new Date('2024-01-01'),
      }

      expect(mockMessage.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('DBDataRetrievalMessageSelect type', () => {
    it('should be a valid select type', () => {
      const mockMessage: DBDataRetrievalMessageSelect = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
      }

      expect(mockMessage).toBeDefined()
      expect(mockMessage.id).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(mockMessage.createdAt).toBeInstanceOf(Date)
    })

    it('should have all required fields', () => {
      const mockMessage: DBDataRetrievalMessageSelect = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date('2024-01-01'),
      }

      expect(mockMessage.id).toBeDefined()
      expect(mockMessage.createdAt).toBeDefined()
    })
  })

  describe('DBDataRetrievalMessagePart type', () => {
    it('should be a valid insert type', () => {
      const mockPart: DBDataRetrievalMessagePart = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'text',
      }

      expect(mockPart).toBeDefined()
      expect(mockPart.messageId).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(mockPart.type).toBe('text')
    })

    it('should allow optional id for insert', () => {
      const mockPart: DBDataRetrievalMessagePart = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'text',
        id: '987fcdeb-51a2-43f7-8d6e-123456789abc',
      }

      expect(mockPart.id).toBe('987fcdeb-51a2-43f7-8d6e-123456789abc')
    })

    it('should allow optional textJson', () => {
      const mockPart: DBDataRetrievalMessagePart = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'text',
        textJson: { content: 'Extracted data' },
      }

      expect(mockPart.textJson).toEqual({ content: 'Extracted data' })
    })

    it('should allow optional createdAt for insert', () => {
      const mockPart: DBDataRetrievalMessagePart = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'text',
        createdAt: new Date('2024-01-01'),
      }

      expect(mockPart.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('DBDataRetrievalMessagePartSelect type', () => {
    it('should be a valid select type', () => {
      const mockPart: DBDataRetrievalMessagePartSelect = {
        id: '987fcdeb-51a2-43f7-8d6e-123456789abc',
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'text',
        textJson: null,
        createdAt: new Date(),
      }

      expect(mockPart).toBeDefined()
      expect(mockPart.id).toBe('987fcdeb-51a2-43f7-8d6e-123456789abc')
      expect(mockPart.messageId).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(mockPart.type).toBe('text')
    })

    it('should have all required fields', () => {
      const mockPart: DBDataRetrievalMessagePartSelect = {
        id: '987fcdeb-51a2-43f7-8d6e-123456789abc',
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'text',
        textJson: { extracted: 'data' },
        createdAt: new Date('2024-01-01'),
      }

      expect(mockPart.id).toBeDefined()
      expect(mockPart.messageId).toBeDefined()
      expect(mockPart.type).toBeDefined()
      expect(mockPart.createdAt).toBeDefined()
    })

    it('should allow null textJson', () => {
      const mockPart: DBDataRetrievalMessagePartSelect = {
        id: '987fcdeb-51a2-43f7-8d6e-123456789abc',
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'text',
        textJson: null,
        createdAt: new Date(),
      }

      expect(mockPart.textJson).toBeNull()
    })

    it('should allow complex textJson object', () => {
      const mockPart: DBDataRetrievalMessagePartSelect = {
        id: '987fcdeb-51a2-43f7-8d6e-123456789abc',
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'text',
        textJson: {
          total: 1500.5,
          currency: 'USD',
          invoiceNumber: 'INV-001',
          companyName: 'Acme Corp',
          metadata: { processed: true },
        },
        createdAt: new Date(),
      }

      expect(mockPart.textJson).toEqual({
        total: 1500.5,
        currency: 'USD',
        invoiceNumber: 'INV-001',
        companyName: 'Acme Corp',
        metadata: { processed: true },
      })
    })
  })

  describe('table structure validation', () => {
    it('should have both table constants exported', () => {
      const tables = [dataRetrievalMessages, dataRetrievalMessageParts]
      expect(tables).toHaveLength(2)
      tables.forEach((table) => {
        expect(table).toBeDefined()
        expect(typeof table).toBe('object')
      })
    })

    it('should have unique table names', () => {
      const tableNames = [
        getTableName(dataRetrievalMessages),
        getTableName(dataRetrievalMessageParts),
      ]
      const uniqueNames = new Set(tableNames)
      expect(uniqueNames.size).toBe(2)
    })

    it('should have consistent timestamp column naming', () => {
      expect(dataRetrievalMessages.createdAt.name).toBe('created_at')
      expect(dataRetrievalMessageParts.createdAt.name).toBe('created_at')
    })

    it('should have consistent primary key naming', () => {
      expect(dataRetrievalMessages.id.name).toBe('id')
      expect(dataRetrievalMessageParts.id.name).toBe('id')
    })

    it('should have consistent foreign key naming pattern', () => {
      expect(dataRetrievalMessageParts.messageId.name).toBe('message_id')
    })
  })
})
