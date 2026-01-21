import { ValidationException } from '../../shared/exceptions/validation.exception.js'
import { ValidationUtil } from '../../shared/utils/validation.util.js'
/**
 * Unique symbol for email branding to ensure type safety.
 * This prevents regular strings from being used where Email types are expected.
 */
declare const EmailBrand: unique symbol

/**
 * Branded email type that wraps the Email class with compile-time type safety.
 * The brand ensures that only validated Email instances can be used where this type is expected.
 *
 * @template T - The string literal type of the email address (defaults to string)
 */
export type EmailType<T extends string = string> = string & { readonly [EmailBrand]: T }

/**
 * Applies the email brand to a validated string value.
 * This is an internal helper function that casts a string to EmailType.
 *
 * @template T - The string literal type of the email address
 * @param value - The validated email string to brand
 * @returns The branded EmailType value
 * @internal
 */
function brandEmail<T extends string>(value: string): EmailType<T> {
  return value as EmailType<T>
}

/**
 * Email value object representing a validated email address.
 *
 * Emails are automatically normalized to lowercase and trimmed of whitespace.
 * Validation ensures basic email format: localpart@domain.tld
 *
 * The class uses TypeScript's branded type pattern to provide compile-time type safety,
 * preventing regular strings from being accidentally used where validated emails are required.
 *
 * @template T - The string literal type of the email address (defaults to string)
 *
 * @example
 * const email = new Email('test@example.com')
 * const emailValue: EmailType = email.getValue()
 *
 * @example
 * const email1 = new Email('test@example.com')
 * const email2 = new Email('TEST@EXAMPLE.COM')
 * email1.equals(email2) // true (case-insensitive comparison)
 */
export class Email<T extends string = string> {
  private readonly value: EmailType<T>
  declare readonly [EmailBrand]: T

  /**
   * Creates a new Email value object.
   * The email is normalized (lowercased and trimmed) and validated during construction.
   *
   * @param email - The email address string to validate and wrap
   * @throws {ValidationException} If the email format is invalid
   *
   * @example
   * const email = new Email('User@Example.COM')
   * email.getValue() // 'user@example.com'
   */
  constructor(email: string) {
    const normalized = email.toLowerCase().trim()
    this.value = this.validate(normalized)
  }

  /**
   * Validates the email format and returns a branded EmailType.
   *
   * @param email - The normalized email string to validate
   * @returns The validated email as a branded EmailType
   * @throws {ValidationException} If the email format is invalid
   * @private
   */
  private validate(email: string): EmailType<T> {
    if (!ValidationUtil.isEmail(email)) {
      throw new ValidationException('Invalid email format')
    }
    return brandEmail<T>(email)
  }

  /**
   * Returns the validated and normalized email address as a branded EmailType.
   * This branded type can be used safely throughout the application with compile-time type checking.
   *
   * @returns The branded EmailType value (normalized and validated)
   *
   * @example
   * const email = new Email('test@example.com')
   * const emailValue: EmailType = email.getValue()
   */
  getValue(): EmailType<T> {
    return this.value
  }

  /**
   * Compares this email with another Email instance for equality.
   * Comparison is case-insensitive due to normalization during construction.
   *
   * @param other - Another Email instance to compare with
   * @returns True if both emails represent the same address (case-insensitive), false otherwise
   *
   * @example
   * const email1 = new Email('test@example.com')
   * const email2 = new Email('TEST@EXAMPLE.COM')
   * email1.equals(email2) // true
   */
  equals(other: Email<string>): boolean {
    return this.value === other.value
  }
}
