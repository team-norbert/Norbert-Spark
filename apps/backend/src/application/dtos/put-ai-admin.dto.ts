import { isObject, isDefined, isString, isNumber } from '@norberts-spark/shared'
import { TypeException } from '../../shared/exceptions/type.exception.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'

export class PutAIAdminDTO {
  constructor(
    public readonly prompt: string,
    public readonly temperature?: number,
    public readonly topP?: number,
    public readonly frequencyPenalty?: number,
    public readonly presencePenalty?: number,
    public readonly topK?: number,
    public readonly stopSequences?: string[],
    public readonly seed?: number,
    public readonly maxRetries?: number
  ) {}
  static validate(data: any): PutAIAdminDTO {
    if (!isDefined(data) || !isObject(data)) {
      throw new TypeException('Invalid data: expected an object')
    }

    const {
      prompt,
      temperature,
      topP,
      frequencyPenalty,
      presencePenalty,
      topK,
      stopSequences,
      seed,
      maxRetries,
    } = data

    if (!prompt || !isString(prompt)) {
      throw new ValidationException('Invalid prompt: must be a non-empty string')
    }
    if (temperature && !isNumber(temperature)) {
      throw new ValidationException('Invalid temperature: must be a number')
    }
    if (isNumber(temperature) && (temperature < 0 || temperature > 2)) {
      throw new ValidationException('Invalid temperature: must be between 0 and 2')
    }
    if (topP && !isNumber(topP)) {
      throw new ValidationException('Invalid topP: must be a number')
    }
    if (isNumber(topP) && (topP < 0 || topP > 1)) {
      throw new ValidationException('Invalid topP: must be between 0 and 1')
    }
    if (frequencyPenalty && !isNumber(frequencyPenalty)) {
      throw new ValidationException('Invalid frequencyPenalty: must be a number')
    }
    if (isNumber(frequencyPenalty) && (frequencyPenalty < -2 || frequencyPenalty > 2)) {
      throw new ValidationException('Invalid frequencyPenalty: must be between -2 and 2')
    }
    if (presencePenalty && !isNumber(presencePenalty)) {
      throw new ValidationException('Invalid presencePenalty: must be a number')
    }
    if (isNumber(presencePenalty) && (presencePenalty < -2 || presencePenalty > 2)) {
      throw new ValidationException('Invalid presencePenalty: must be between -2 and 2')
    }
    if (topK && !isNumber(topK)) {
      throw new ValidationException('Invalid topK: must be a number')
    }
    if (isNumber(topK) && (topK <= 0 || topK > 100)) {
      throw new ValidationException('Invalid topK: must be between 1 and 100')
    }
    if (stopSequences && !Array.isArray(stopSequences)) {
      throw new ValidationException('Invalid stopSequences: must be an array')
    }
    if (Array.isArray(stopSequences) && !stopSequences.every((item) => isString(item))) {
      throw new ValidationException('Invalid stopSequences: all items must be strings')
    }
    if (seed && !isNumber(seed)) {
      throw new ValidationException('Invalid seed: must be a number')
    }
    if (isNumber(seed) && (seed < 0 || seed > 2147483647)) {
      throw new ValidationException('Invalid seed: must be between 0 and 2147483647')
    }
    if (maxRetries && !isNumber(maxRetries)) {
      throw new ValidationException('Invalid maxRetries: must be a number')
    }
    if (isNumber(maxRetries) && (maxRetries < 0 || maxRetries > 10)) {
      throw new ValidationException('Invalid maxRetries: must be between 0 and 10')
    }

    return new PutAIAdminDTO(
      prompt,
      temperature as number | undefined,
      topP as number | undefined,
      frequencyPenalty as number | undefined,
      presencePenalty as number | undefined,
      topK as number | undefined,
      stopSequences as string[] | undefined,
      seed as number | undefined,
      maxRetries as number | undefined
    )
  }
}
