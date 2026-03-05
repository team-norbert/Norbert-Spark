import type { Obscured } from 'obscured'
import { obscured } from 'obscured'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ResendService } from '../../../../src/adapters/secondary/services/email.service.js'
import type { LoggerPort } from '../../../../src/application/ports/logger.port.js'
import { ExternalServiceException } from '../../../../src/shared/exceptions/external-service.exception.js'
import { createMockLogger } from '../../../shared/factories/logger.factory.js'

// Create mock emails.send function
const mockEmailsSend = vi.fn()

// Mock the Resend module
vi.mock('resend', () => {
  return {
    Resend: vi.fn(function (this: any) {
      this.emails = {
        send: mockEmailsSend,
      }
    }),
  }
})

// Mock EnvConfig
vi.mock('../../../../src/infrastructure/config/env.config.js', () => ({
  EnvConfig: {
    EMAIL_FROM_ADDRESS: 'noreply@example.com',
  },
}))

describe('ResendService', () => {
  let resendService: ResendService
  let mockLogger: LoggerPort
  let mockApiKey: Obscured<string>

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock logger
    mockLogger = createMockLogger()

    // Create obscured API key
    mockApiKey = obscured.make('test_api_key_12345')

    // Create ResendService instance
    resendService = new ResendService(mockApiKey, mockLogger)
  })

  describe('constructor', () => {
    it('should create an instance of ResendService', () => {
      expect(resendService).toBeInstanceOf(ResendService)
    })

    it('should initialize Resend client with API key', async () => {
      const { Resend } = await import('resend')
      expect(Resend).toHaveBeenCalledWith('test_api_key_12345')
    })

    it('should accept obscured API key', () => {
      const obscuredKey = obscured.make('secret_key_xyz')
      const service = new ResendService(obscuredKey, mockLogger)
      expect(service).toBeInstanceOf(ResendService)
    })
  })

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const mockEmailData = { id: 'email-123' }
      mockEmailsSend.mockResolvedValue({ data: mockEmailData, error: null })

      await resendService.sendWelcomeEmail('user@example.com', 'John Doe')

      expect(mockLogger.info).toHaveBeenCalledWith('Sending welcome email', {
        to: 'user@example.com',
        name: 'John Doe',
      })

      expect(mockEmailsSend).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: 'user@example.com',
        subject: 'Hello World',
        html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
      })

      expect(mockLogger.info).toHaveBeenCalledWith('Email sent successfully', {
        id: 'email-123',
        to: 'user@example.com',
        name: 'John Doe',
      })
    })

    it('should log info before sending email', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

      await resendService.sendWelcomeEmail('test@example.com', 'Test User')

      expect(mockLogger.info).toHaveBeenCalledWith('Sending welcome email', {
        to: 'test@example.com',
        name: 'Test User',
      })
    })

    it('should use correct email data structure', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

      await resendService.sendWelcomeEmail('recipient@example.com', 'Recipient Name')

      expect(mockEmailsSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@example.com',
          to: 'recipient@example.com',
          subject: expect.any(String),
          html: expect.any(String),
        })
      )
    })

    it('should throw ExternalServiceException when Resend API returns error', async () => {
      const mockError = { message: 'Invalid API key' }
      mockEmailsSend.mockResolvedValue({ data: null, error: mockError })

      await expect(resendService.sendWelcomeEmail('user@example.com', 'John Doe')).rejects.toThrow(
        ExternalServiceException
      )

      await expect(resendService.sendWelcomeEmail('user@example.com', 'John Doe')).rejects.toThrow(
        'Failed to send welcome email'
      )
    })

    it('should log error when email sending fails', async () => {
      const mockError = { message: 'Network error' }
      mockEmailsSend.mockResolvedValue({ data: null, error: mockError })

      await expect(resendService.sendWelcomeEmail('user@example.com', 'John Doe')).rejects.toThrow()

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to send welcome email',
        expect.any(Error),
        {
          to: 'user@example.com',
          name: 'John Doe',
        }
      )
    })

    it('should include error details in exception', async () => {
      const mockError = { message: 'Rate limit exceeded' }
      mockEmailsSend.mockResolvedValue({ data: null, error: mockError })

      await expect(resendService.sendWelcomeEmail('user@example.com', 'John Doe')).rejects.toThrow(
        ExternalServiceException
      )
      await expect(resendService.sendWelcomeEmail('user@example.com', 'John Doe')).rejects.toThrow(
        'Failed to send welcome email'
      )

      // Verify exception details by catching it
      const caughtError = await resendService
        .sendWelcomeEmail('user@example.com', 'John Doe')
        .catch((e) => e)
      expect(caughtError).toBeInstanceOf(ExternalServiceException)
      expect(caughtError.details).toEqual({ error: mockError })
    })

    it('should handle different recipient email formats', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

      await resendService.sendWelcomeEmail('user+test@example.co.uk', 'Test User')

      expect(mockEmailsSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user+test@example.co.uk',
        })
      )
    })

    it('should handle names with special characters', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

      await resendService.sendWelcomeEmail('user@example.com', "O'Brien-Smith")

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          name: "O'Brien-Smith",
        })
      )
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('should log sending password reset email', async () => {
      await resendService.sendPasswordResetEmail('user@example.com', 'reset-token-123')

      expect(mockLogger.info).toHaveBeenCalledWith('Sending password reset email', {
        to: 'user@example.com',
      })
    })

    it('should log success after sending password reset email', async () => {
      await resendService.sendPasswordResetEmail('user@example.com', 'reset-token-456')

      expect(mockLogger.info).toHaveBeenCalledWith('Password reset email sent', {
        to: 'user@example.com',
      })
    })

    it('should call logger.info twice (before and after sending)', async () => {
      await resendService.sendPasswordResetEmail('test@example.com', 'token-xyz')

      expect(mockLogger.info).toHaveBeenCalledTimes(2)
    })

    it('should handle different reset token formats', async () => {
      const tokens = [
        'simple-token',
        'complex-token-with-dashes-123',
        'TOKEN_WITH_UNDERSCORES_456',
        'mixedCaseToken789',
      ]

      for (const token of tokens) {
        await resendService.sendPasswordResetEmail('user@example.com', token)
      }

      expect(mockLogger.info).toHaveBeenCalledTimes(tokens.length * 2)
    })

    it('should handle different email addresses', async () => {
      const emails = [
        'simple@example.com',
        'user+tag@example.com',
        'first.last@subdomain.example.com',
      ]

      for (const email of emails) {
        await resendService.sendPasswordResetEmail(email, 'token-123')
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Sending password reset email',
          expect.objectContaining({ to: email })
        )
      }
    })
  })

  describe('implements EmailServicePort', () => {
    it('should have sendWelcomeEmail method', () => {
      expect(typeof resendService.sendWelcomeEmail).toBe('function')
    })

    it('should have sendPasswordResetEmail method', () => {
      expect(typeof resendService.sendPasswordResetEmail).toBe('function')
    })

    it('should return Promise from sendWelcomeEmail', () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })
      const result = resendService.sendWelcomeEmail('test@example.com', 'Test User')
      expect(result).toBeInstanceOf(Promise)
    })

    it('should return Promise from sendPasswordResetEmail', () => {
      const result = resendService.sendPasswordResetEmail('test@example.com', 'token')
      expect(result).toBeInstanceOf(Promise)
    })
  })

  describe('integration with logger', () => {
    it('should use provided logger instance', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

      await resendService.sendWelcomeEmail('user@example.com', 'John Doe')

      expect(mockLogger.info).toHaveBeenCalled()
    })

    it('should not call logger warn or debug methods', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

      await resendService.sendWelcomeEmail('user@example.com', 'John Doe')
      await resendService.sendPasswordResetEmail('user@example.com', 'token')

      expect(mockLogger.warn).not.toHaveBeenCalled()
      expect(mockLogger.debug).not.toHaveBeenCalled()
    })

    it('should call logger.error only when email sending fails', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

      await resendService.sendWelcomeEmail('user@example.com', 'John Doe')

      expect(mockLogger.error).not.toHaveBeenCalled()

      const mockError = { message: 'API error' }
      mockEmailsSend.mockResolvedValue({ data: null, error: mockError })

      await expect(resendService.sendWelcomeEmail('user@example.com', 'John Doe')).rejects.toThrow()

      expect(mockLogger.error).toHaveBeenCalledTimes(1)
    })
  })
})
