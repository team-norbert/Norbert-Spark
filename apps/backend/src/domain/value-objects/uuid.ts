import { Uuid7Util } from '../../shared/utils/uuid7.util.js'

/**
 * Unique symbol for UUID branding to ensure type safety.
 * This prevents regular strings from being used where UUID types are expected.
 */
declare const UUIDBrand: unique symbol

/**
 * Branded UUIDType that wraps the Uuid class with compile-time type safety.
 * The brand ensures that only validated Uuid instances can be used where this type is expected.
 *
 * @template T - The string literal type of the uuid (defaults to string)
 */

export type UUIDType<T extends string = string> = string & { readonly [UUIDBrand]: T }

function brandUUIDId<T extends string>(value: string): UUIDType<T> {
  return value as UUIDType<T>
}

export class Uuid<T extends string = string> {
  private readonly value: UUIDType<T>
  declare readonly [UUIDBrand]: T

  constructor(value: string) {
    this.value = this.processUserUUID(value)
  }

  private processUserUUID<T extends string = string>(userUUID: string): UUIDType<T> {
    if (!Uuid7Util.isValidUUID(userUUID)) {
      throw new Error('Invalid userID UUID format provided')
    }
    // Validate the UUID version but return the UUID itself, not the version string
    const version = Uuid7Util.uuidVersionValidation(userUUID)
    if (version !== 'v7') {
      throw new Error(`Invalid userID UUID version: ${version}`)
    }
    return brandUUIDId<T>(userUUID)
  }

  getValue(): UUIDType {
    return this.value
  }
}
