import type { Obscured } from 'obscured'
import { obscured } from 'obscured'
import { Resend } from 'resend'

import type { EmailServicePort } from '../../../application/ports/email.service.port.js'
import type { LoggerPort } from '../../../application/ports/logger.port.js'
import { EnvConfig } from '../../../infrastructure/config/env.config.js'
import { ExternalServiceException } from '../../../shared/exceptions/external-service.exception.js'

/**
 * Adapter for sending emails using the Resend API.
 * Implements the EmailServicePort interface.
 *
 * @class ResendService
 * @implements {EmailServicePort}
 *
 * @param {Obscured<string | undefined>} apiKey - The Resend API key, provided in an obscured form for security.
 * @param {LoggerPort} logger - Logger instance for logging email operations.
 *
 * @dependency Uses the external Resend API via the `resend` npm package.
 *
 * @throws {ExternalServiceException} When the Resend API call fails.
 */
export class ResendService implements EmailServicePort {
  private readonly resendClient: Resend

  constructor(
    private readonly apiKey: Obscured<string | undefined>,
    private readonly logger: LoggerPort
  ) {
    this.resendClient = new Resend(obscured.value(apiKey))
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    this.logger.info('Sending welcome email', { to, name })

    const emailData = {
      from: EnvConfig.EMAIL_FROM_ADDRESS,
      to,
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
    }

    const { data, error } = await this.resendClient.emails.send(emailData)

    if (error) {
      this.logger.error('Failed to send welcome email', new Error(error.message), { to, name })
      throw new ExternalServiceException('Failed to send welcome email', { error })
    }

    if (data) {
      this.logger.info('Email sent successfully', { id: data.id, to, name })
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    this.logger.info('Sending password reset email', { to })

    const emailData = {
      to,
      from: 'noreply@norbertsSpark.com',
      subject: 'Reset Your Password',
      html: `<p>Click here to reset: <a href="https://example.com/reset/${resetToken}">Reset Password</a></p>`,
    }

    // await this.sendGridClient.send(emailData)
    this.logger.info('Password reset email sent', { to })
  }
}
