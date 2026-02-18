import { isObject, isDefined, isString, isNumber } from '@norberts-spark/shared'
import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'

/**
 * Data Transfer Object for AI admin configuration settings.
 *
 * This DTO encapsulates all configuration parameters for AI model behavior,
 * including prompt text, token limits, sampling parameters, and retry settings.
 * It provides validation to ensure all parameters fall within acceptable ranges
 * for AI model providers (e.g., Google Gemini, OpenAI).
 *
 * @remarks
 * All fields except prompt are optional, allowing partial updates of AI configuration.
 * The validation ensures:
 * - Prompt is a non-empty string
 * - Numeric parameters are within model-specific ranges
 * - Stop sequences are all strings
 * - Null values are converted to undefined for cleaner handling
 *
 * @example
 * ```typescript
 * const dto = new PutAIAdminDTO(
 *   'You are a helpful assistant',
 *   8000,    // maxTokens
 *   0.7,     // temperature
 *   0.95,    // topP
 *   0.5,     // frequencyPenalty
 *   0.5,     // presencePenalty
 *   40,      // topK
 *   ['\n\n', 'END'], // stopSequences
 *   12345,   // seed
 *   3        // maxRetries
 * )
 * ```
 */
export class PutAIAdminDTO {
  /**
   * Creates an instance of PutAIAdminDTO.
   *
   * @param prompt - The system prompt or instruction for the AI model (required, non-empty)
   * @param maxTokens - Maximum number of tokens to generate (0-100000)
   * @param temperature - Sampling temperature for randomness (0-2, where 0 is deterministic)
   * @param topP - Nucleus sampling parameter (0-1, cumulative probability threshold)
   * @param frequencyPenalty - Penalty for token frequency (-2 to 2, reduces repetition)
   * @param presencePenalty - Penalty for token presence (-2 to 2, encourages topic diversity)
   * @param topK - Top-K sampling parameter (1-100, number of tokens to consider)
   * @param stopSequences - Array of strings that stop generation when encountered
   * @param seed - Random seed for reproducible generation (0-2147483647, max int32)
   * @param maxRetries - Maximum number of retry attempts on failure (0-10)
   */
  constructor(
    public readonly prompt: string,
    public readonly maxTokens?: number,
    public readonly temperature?: number,
    public readonly topP?: number,
    public readonly frequencyPenalty?: number,
    public readonly presencePenalty?: number,
    public readonly topK?: number,
    public readonly stopSequences?: string[],
    public readonly seed?: number,
    public readonly maxRetries?: number
  ) {}

  /**
   * Validates and constructs a PutAIAdminDTO from raw data.
   *
   * Performs comprehensive validation of all AI configuration parameters,
   * ensuring they meet the requirements of AI model providers. Throws
   * TypeException or ValidationException if validation fails.
   *
   * @param data - Raw data object to validate (typically from HTTP request body)
   * @returns A validated PutAIAdminDTO instance with null values converted to undefined
   * @throws {TypeException} If data is not an object
   * @throws {ValidationException} If any field fails validation rules:
   * - prompt: Must be non-empty string
   * - maxTokens: Must be number between 0-100000
   * - temperature: Must be number between 0-2
   * - topP: Must be number between 0-1
   * - frequencyPenalty: Must be number between -2 to 2
   * - presencePenalty: Must be number between -2 to 2
   * - topK: Must be number between 1-100
   * - stopSequences: Must be array of strings
   * - seed: Must be number between 0-2147483647 (max int32)
   * - maxRetries: Must be number between 0-10
   *
   * @example
   * ```typescript
   * try {
   *   const dto = PutAIAdminDTO.validate(requestBody)
   *   // Use dto for AI configuration
   * } catch (error) {
   *   if (error instanceof ValidationException) {
   *     console.error('Validation failed:', error.message)
   *   }
   * }
   * ```
   */
  static validate(data: any): PutAIAdminDTO {
    if (!isDefined(data) || !isObject(data)) {
      throw new TypeException('Invalid data: expected an object')
    }

    const {
      prompt,
      maxTokens,
      temperature,
      topP,
      frequencyPenalty,
      presencePenalty,
      topK,
      stopSequences,
      seed,
      maxRetries,
    } = data

    if (!prompt || !isString(prompt) || !prompt.trim()) {
      throw new ValidationException('Invalid prompt: must be a non-empty string')
    }
    if (isDefined(maxTokens) && !isNumber(maxTokens)) {
      throw new ValidationException('Invalid maxTokens: must be a number')
    }
    if (isNumber(maxTokens) && (maxTokens < 0 || maxTokens > 100000)) {
      throw new ValidationException('Invalid temperature: must be between 0 and 100000')
    }
    if (isDefined(temperature) && !isNumber(temperature)) {
      throw new ValidationException('Invalid temperature: must be a number')
    }
    if (isNumber(temperature) && (temperature < 0 || temperature > 2)) {
      throw new ValidationException('Invalid temperature: must be between 0 and 2')
    }
    if (isDefined(topP) && !isNumber(topP)) {
      throw new ValidationException('Invalid topP: must be a number')
    }
    if (isNumber(topP) && (topP < 0 || topP > 1)) {
      throw new ValidationException('Invalid topP: must be between 0 and 1')
    }
    if (isDefined(frequencyPenalty) && !isNumber(frequencyPenalty)) {
      throw new ValidationException('Invalid frequencyPenalty: must be a number')
    }
    if (isNumber(frequencyPenalty) && (frequencyPenalty < -2 || frequencyPenalty > 2)) {
      throw new ValidationException('Invalid frequencyPenalty: must be between -2 and 2')
    }
    if (isDefined(presencePenalty) && !isNumber(presencePenalty)) {
      throw new ValidationException('Invalid presencePenalty: must be a number')
    }
    if (isNumber(presencePenalty) && (presencePenalty < -2 || presencePenalty > 2)) {
      throw new ValidationException('Invalid presencePenalty: must be between -2 and 2')
    }
    if (isDefined(topK) && !isNumber(topK)) {
      throw new ValidationException('Invalid topK: must be a number')
    }
    if (isNumber(topK) && (topK <= 0 || topK > 100)) {
      throw new ValidationException('Invalid topK: must be between 1 and 100')
    }
    if (isDefined(stopSequences) && !Array.isArray(stopSequences)) {
      throw new ValidationException('Invalid stopSequences: must be an array')
    }
    if (Array.isArray(stopSequences) && !stopSequences.every((item) => isString(item))) {
      throw new ValidationException('Invalid stopSequences: all items must be strings')
    }
    if (isDefined(seed) && !isNumber(seed)) {
      throw new ValidationException('Invalid seed: must be a number')
    }
    if (isNumber(seed) && (seed < 0 || seed > 2147483647)) {
      throw new ValidationException('Invalid seed: must be between 0 and 2147483647')
    }
    if (isDefined(maxRetries) && !isNumber(maxRetries)) {
      throw new ValidationException('Invalid maxRetries: must be a number')
    }
    if (isNumber(maxRetries) && (maxRetries < 0 || maxRetries > 10)) {
      throw new ValidationException('Invalid maxRetries: must be between 0 and 10')
    }

    return new PutAIAdminDTO(
      prompt.trim(),
      maxTokens === null ? undefined : (maxTokens as number | undefined),
      temperature === null ? undefined : (temperature as number | undefined),
      topP === null ? undefined : (topP as number | undefined),
      frequencyPenalty === null ? undefined : (frequencyPenalty as number | undefined),
      presencePenalty === null ? undefined : (presencePenalty as number | undefined),
      topK === null ? undefined : (topK as number | undefined),
      stopSequences === null ? undefined : (stopSequences as string[] | undefined),
      seed === null ? undefined : (seed as number | undefined),
      maxRetries === null ? undefined : (maxRetries as number | undefined)
    )
  }
}
