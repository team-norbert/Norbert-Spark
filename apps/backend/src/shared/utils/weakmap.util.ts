/**
 * A wrapper around the native WeakMap that provides a cleaner API.
 *
 * WeakMaps hold "weak" references to keys, meaning that if there are no other
 * references to the key object, it can be garbage collected along with its
 * associated value. This makes WeakMaps ideal for:
 * - Caching computed data associated with objects
 * - Storing private data for objects
 * - Tracking object metadata without preventing garbage collection
 *
 * @template Key - The type of keys (must be an object type)
 * @template Value - The type of values stored in the map
 *
 * @example
 * // Basic usage - storing metadata for DOM elements
 * const elementData = new CustomWeakMap<HTMLElement, { clicks: number }>()
 *
 * const button = document.createElement('button')
 * elementData.set(button, { clicks: 0 })
 *
 * // Later...
 * const data = elementData.get(button)
 * if (data) {
 *   data.clicks++
 * }
 *
 * @example
 * // Caching expensive computations
 * interface User { id: string; name: string }
 * const userCache = new CustomWeakMap<User, string>()
 *
 * function getDisplayName(user: User): string {
 *   if (userCache.has(user)) {
 *     return userCache.get(user)!
 *   }
 *   const displayName = `${user.name} (${user.id})`
 *   userCache.set(user, displayName)
 *   return displayName
 * }
 *
 * @example
 * // Private data pattern (encapsulation)
 * const privateData = new CustomWeakMap<object, { secret: string }>()
 *
 * class SecureService {
 *   constructor() {
 *     privateData.set(this, { secret: 'hidden-value' })
 *   }
 *
 *   getSecret(): string {
 *     return privateData.get(this)?.secret ?? ''
 *   }
 * }
 *
 * @example
 * // Initialize with existing entries
 * const key1 = { id: 1 }
 * const key2 = { id: 2 }
 * const map = new CustomWeakMap<object, string>([
 *   [key1, 'value1'],
 *   [key2, 'value2'],
 * ])
 */
export class CustomWeakMap<Key extends object, Value> {
  private weakMap: WeakMap<Key, Value>

  /**
   * Creates a new CustomWeakMap instance.
   * @param {Iterable<readonly [Key, Value]> | null} [iterable] - Optional iterable of key-value pairs to initialize the map.
   */
  constructor(iterable?: Iterable<readonly [Key, Value]> | null) {
    this.weakMap = iterable ? new WeakMap(iterable) : new WeakMap()
  }

  /**
   * Deletes the specified element from the WeakMap.
   * @param {Key} key - The key to delete from the WeakMap.
   * @returns {boolean} True if the key was present and removed, false otherwise.
   */
  delete(key: Key): boolean {
    return this.weakMap.delete(key)
  }

  /**
   * Returns the value associated with the specified key.
   * @param {Key} key - The key to retrieve the value for.
   * @returns {Value | undefined} The value associated with the key, or undefined if not found.
   */
  get(key: Key): Value | undefined {
    return this.weakMap.get(key)
  }

  /**
   * Indicates whether the WeakMap contains the specified key.
   * @param {Key} key - The key to check for in the WeakMap.
   * @returns {boolean} True if the key is present, false otherwise.
   */
  has(key: Key): boolean {
    return this.weakMap.has(key)
  }

  /**
   * Adds or updates the key-value pair in the WeakMap.
   * @param {Key} key - The key to add or update.
   * @param {Value} value - The value to associate with the key.
   */
  set(key: Key, value: Value): void {
    this.weakMap.set(key, value)
  }
}
