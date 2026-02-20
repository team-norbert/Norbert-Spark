import { isString, isDefined, isObject, isBoolean, isNullOrUndefined } from '@norberts-spark/shared'
import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'

/**
 * Data Transfer Object for creating a new chat type (POST requests).
 *
 * Carries the validated, trimmed payload after {@link PostChatType.validate}
 * has confirmed all constraints. Consumers can treat the properties as
 * safe — no further validation is required once an instance exists.
 */
export class PostChatType {
  /**
   * @param name - The display name of the chat type (1–200 characters,
   *   leading/trailing whitespace removed).
   * @param description - A human-readable description of the chat type
   *   (1–500 characters, leading/trailing whitespace removed).
   * @param rag - Optional flag indicating if this chat type uses Retrieval-Augmented Generation (RAG) features. Defaults to `false`.
   */
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly rag: boolean = false
  ) {}

  /**
   * Parses and validates an untrusted input value, returning a
   * {@link PostChatType} instance when the data is acceptable.
   *
   * Validation rules:
   * - `data` must be a non-null, non-array plain object.
   * - `name` must be a non-empty string of at most 200 characters.
   * - `description` must be a non-empty string of at most 500 characters.
   *
   * Both `name` and `description` are trimmed before the length check and
   * before being stored on the returned instance.
   *
   * @param data - The raw request body received from the HTTP layer.
   * @returns A validated {@link PostChatType} instance.
   * @throws {TypeException} When `data` is not a plain object (e.g. `null`,
   *   `undefined`, a primitive, or an array).
   * @throws {ValidationException} When `name` or `description` fail their
   *   content or length constraints.
   */
  static validate(data: any): PostChatType {
    if (!isDefined(data) || !isObject(data)) {
      throw new TypeException('Invalid data: expected an object')
    }
    if (!isString(data.name) || !data.name.trim()) {
      throw new ValidationException('Invalid name: must be a non-empty string')
    }
    if (!isString(data.description) || !data.description.trim()) {
      throw new ValidationException('Invalid description: must be a non-empty string')
    }
    if (!isBoolean(data.rag) || isNullOrUndefined(data.rag)) {
      throw new ValidationException('Invalid rag: must be a boolean')
    }
    if (data.name.trim().length > 200) {
      throw new ValidationException('Invalid name: must be less than 200 characters')
    }
    if (data.description.trim().length > 500) {
      throw new ValidationException('Invalid description: must be less than 500 characters')
    }
    return new PostChatType(data.name.trim(), data.description.trim(), data.rag)
  }
}
