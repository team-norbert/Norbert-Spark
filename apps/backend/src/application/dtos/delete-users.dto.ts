import { TypeException } from '../../shared/exceptions/type.exception.js'
import { Uuid7Util } from '../../shared/utils/uuid7.util.js'
import type { UserIdType } from '../../domain/value-objects/userID.js'
import type { components } from '@norberts-spark/shared/openapi-types'

/**
 * Data Transfer Object (DTO) for batch user deletion requests.
 *
 * This DTO validates and encapsulates the data required to delete multiple users
 * in a single operation. It ensures that all user IDs are valid UUIDv7 strings
 * before processing the deletion request.
 *
 * @example
 * ```typescript
 * // Valid usage
 * const data = { userIds: ['019b8589-7670-725e-b51b-2fcb23f9c593', '019b8589-7670-725e-b51b-2fcb23f9c594'] };
 * const dto = DeleteUsersDto.validate(data);
 * console.log(dto.userIds); // Array of validated UserIdType
 *
 * // Invalid usage - throws TypeException
 * const invalidData = { userIds: ['not-a-uuid'] };
 * const dto = DeleteUsersDto.validate(invalidData); // Throws: Invalid UUIDv7 format
 * ```
 */
export class DeleteUsersDto {
  /**
   * Creates a new DeleteUsersDto instance.
   *
   * @param userIds - Array of validated user IDs (UserIdType) to be deleted
   *
   * @example
   * ```typescript
   * const userIds = [uuidv7(), uuidv7()] as UserIdType[];
   * const dto = new DeleteUsersDto(userIds);
   * ```
   */
  constructor(public readonly userIds: UserIdType[]) {}

  /**
   * Validates and creates a DeleteUsersDto from raw request data.
   *
   * This method performs comprehensive validation to ensure:
   * 1. The data is a valid object (not null, undefined, or an array)
   * 2. The userIds field exists and is an array of strings
   * 3. Each userId is a valid UUID version 7 format
   *
   * @param data - Raw request data to validate (expected shape: { userIds: string[] })
   * @returns A new DeleteUsersDto instance with validated user IDs
   *
   * @throws {TypeException} If data is null, undefined, or not a valid object
   * @throws {TypeException} If userIds field is missing, not an array, or contains non-string values
   * @throws {TypeException} If any userId is not a valid UUIDv7 format
   *
   * @example
   * ```typescript
   * // Successful validation
   * const data = {
   *   userIds: [
   *     '019b8589-7670-725e-b51b-2fcb23f9c593',
   *     '019b8589-7670-725e-b51b-2fcb23f9c594'
   *   ]
   * };
   * const dto = DeleteUsersDto.validate(data);
   *
   * // Invalid data - throws TypeException
   * try {
   *   DeleteUsersDto.validate(null); // Throws: Data must be a valid array of user IDs
   * } catch (error) {
   *   console.error(error.message);
   * }
   *
   * try {
   *   DeleteUsersDto.validate({ userIds: ['invalid-uuid'] }); // Throws: Invalid UUIDv7 format
   * } catch (error) {
   *   console.error(error.message);
   * }
   *
   * // Empty array is valid
   * const emptyDto = DeleteUsersDto.validate({ userIds: [] });
   * console.log(emptyDto.userIds); // []
   * ```
   */
  static validate(data: components['schemas']['UserDeleteRequest']): DeleteUsersDto {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new TypeException('Data must be a valid array of user IDs')
    }

    if (!Array.isArray(data.userIds) || !data.userIds.every((id: any) => typeof id === 'string')) {
      throw new TypeException('userIds must be an array of strings')
    }

    // Validate each userId is a valid UUIDv7
    for (const id of data.userIds) {
      const version = Uuid7Util.uuidVersionValidation(id)
      if (version !== 'v7') {
        throw new TypeException(`Invalid UUIDv7 format for userId: ${id}`)
      }
    }

    return new DeleteUsersDto(data.userIds as UserIdType[])
  }
}
