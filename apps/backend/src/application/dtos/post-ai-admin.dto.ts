import { PutAIAdminDTO } from './put-ai-admin.dto.js'

/**
 * Data Transfer Object for AI admin configuration settings used in POST (create) operations.
 *
 * Extends {@link PutAIAdminDTO} and reuses its validation logic to avoid duplication.
 * Use {@link PostAIAdminDTO.validate} to create a validated instance from raw request data.
 */
export class PostAIAdminDTO extends PutAIAdminDTO {
  /**
   * Validates and constructs a PostAIAdminDTO from raw data.
   *
   * Delegates all validation to {@link PutAIAdminDTO.validate} and returns a
   * PostAIAdminDTO instance with the validated values.
   *
   * @param data - Raw data object to validate (typically from HTTP request body)
   * @returns A validated PostAIAdminDTO instance with null values converted to undefined
   * @throws {TypeException} If data is not an object
   * @throws {ValidationException} If any field fails validation rules
   */
  static override validate(data: any): PostAIAdminDTO {
    const validated = PutAIAdminDTO.validate(data)
    return new PostAIAdminDTO(
      validated.prompt,
      validated.maxTokens,
      validated.temperature,
      validated.topP,
      validated.frequencyPenalty,
      validated.presencePenalty,
      validated.topK,
      validated.stopSequences,
      validated.seed,
      validated.maxRetries
    )
  }
}
