export type UtcDateInput = Date | string | number | UtcDate

export class InvalidUtcDateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidUtcDateError'
  }
}

export class UtcDate {
  private readonly value: Date

  private constructor(date: Date) {
    if (Number.isNaN(date.getTime())) {
      throw new InvalidUtcDateError('Invalid date')
    }

    this.value = new Date(date.getTime())
  }

  /**
   * Current UTC timestamp.
   */
  static now(): UtcDate {
    return new UtcDate(new Date())
  }

  /**
   * Create from native Date.
   * Clones the input to preserve immutability.
   */
  static fromDate(date: Date): UtcDate {
    return new UtcDate(date)
  }

  /**
   * Create from Unix epoch milliseconds.
   */
  static fromEpochMilliseconds(milliseconds: number): UtcDate {
    if (!Number.isFinite(milliseconds)) {
      throw new InvalidUtcDateError('Epoch milliseconds must be a finite number')
    }

    return new UtcDate(new Date(milliseconds))
  }

  /**
   * Create from Unix epoch seconds.
   */
  static fromEpochSeconds(seconds: number): UtcDate {
    if (!Number.isFinite(seconds)) {
      throw new InvalidUtcDateError('Epoch seconds must be a finite number')
    }

    return new UtcDate(new Date(seconds * 1000))
  }

  /**
   * Strict ISO-8601 parser.
   *
   * Accepts only strings with explicit timezone information:
   *   2026-03-07T09:30:00Z
   *   2026-03-07T09:30:00.123Z
   *   2026-03-07T09:30:00+00:00
   *   2026-03-07T10:30:00+01:00
   *
   * Rejects ambiguous/local-only strings like:
   *   2026-03-07
   *   2026-03-07T09:30:00
   */
  static fromIsoString(isoString: string): UtcDate {
    if (!UtcDate.isStrictIsoWithTimezone(isoString)) {
      throw new InvalidUtcDateError('ISO string must include date, time, and timezone offset')
    }

    return new UtcDate(new Date(isoString))
  }

  /**
   * Flexible factory for controlled app boundaries.
   * Prefer the more explicit factories in domain code.
   */
  static create(input: UtcDateInput): UtcDate {
    if (input instanceof UtcDate) {
      return input
    }

    if (input instanceof Date) {
      return UtcDate.fromDate(input)
    }

    if (typeof input === 'string') {
      return UtcDate.fromIsoString(input)
    }

    if (typeof input === 'number') {
      return UtcDate.fromEpochMilliseconds(input)
    }

    throw new InvalidUtcDateError('Unsupported UtcDate input')
  }

  /**
   * Returns a defensive copy of the underlying Date.
   */
  toDate(): Date {
    return new Date(this.value.getTime())
  }

  /**
   * ISO-8601 UTC string, suitable for APIs and storage.
   * Example: 2026-03-07T09:30:00.000Z
   */
  toISOString(): string {
    return this.value.toISOString()
  }

  /**
   * Unix epoch in milliseconds.
   */
  toEpochMilliseconds(): number {
    return this.value.getTime()
  }

  /**
   * Unix epoch in seconds.
   */
  toEpochSeconds(): number {
    return Math.floor(this.value.getTime() / 1000)
  }

  /**
   * SQL-friendly timestamp without timezone suffix.
   * Useful only when your infrastructure layer explicitly expects UTC.
   * Example: 2026-03-07 09:30:00.123
   */
  toUtcSqlTimestamp(): string {
    const year = this.value.getUTCFullYear()
    const month = String(this.value.getUTCMonth() + 1).padStart(2, '0')
    const day = String(this.value.getUTCDate()).padStart(2, '0')
    const hours = String(this.value.getUTCHours()).padStart(2, '0')
    const minutes = String(this.value.getUTCMinutes()).padStart(2, '0')
    const seconds = String(this.value.getUTCSeconds()).padStart(2, '0')
    const millis = String(this.value.getUTCMilliseconds()).padStart(3, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${millis}`
  }

  /**
   * For JSON.stringify().
   */
  toJSON(): string {
    return this.toISOString()
  }

  /**
   * Primitive numeric value for comparisons and sorting.
   */
  valueOf(): number {
    return this.toEpochMilliseconds()
  }

  equals(other: UtcDate): boolean {
    return this.toEpochMilliseconds() === other.toEpochMilliseconds()
  }

  isBefore(other: UtcDate): boolean {
    return this.toEpochMilliseconds() < other.toEpochMilliseconds()
  }

  isBeforeOrEqual(other: UtcDate): boolean {
    return this.toEpochMilliseconds() <= other.toEpochMilliseconds()
  }

  isAfter(other: UtcDate): boolean {
    return this.toEpochMilliseconds() > other.toEpochMilliseconds()
  }

  isAfterOrEqual(other: UtcDate): boolean {
    return this.toEpochMilliseconds() >= other.toEpochMilliseconds()
  }

  addMilliseconds(milliseconds: number): UtcDate {
    UtcDate.assertFiniteNumber(milliseconds, 'milliseconds')
    return UtcDate.fromEpochMilliseconds(this.toEpochMilliseconds() + milliseconds)
  }

  addSeconds(seconds: number): UtcDate {
    UtcDate.assertFiniteNumber(seconds, 'seconds')
    return this.addMilliseconds(seconds * 1000)
  }

  addMinutes(minutes: number): UtcDate {
    UtcDate.assertFiniteNumber(minutes, 'minutes')
    return this.addMilliseconds(minutes * 60 * 1000)
  }

  addHours(hours: number): UtcDate {
    UtcDate.assertFiniteNumber(hours, 'hours')
    return this.addMilliseconds(hours * 60 * 60 * 1000)
  }

  addDays(days: number): UtcDate {
    UtcDate.assertFiniteNumber(days, 'days')
    return this.addMilliseconds(days * 24 * 60 * 60 * 1000)
  }

  subtractMilliseconds(milliseconds: number): UtcDate {
    UtcDate.assertFiniteNumber(milliseconds, 'milliseconds')
    return this.addMilliseconds(-milliseconds)
  }

  subtractSeconds(seconds: number): UtcDate {
    return this.addSeconds(-seconds)
  }

  subtractMinutes(minutes: number): UtcDate {
    return this.addMinutes(-minutes)
  }

  subtractHours(hours: number): UtcDate {
    return this.addHours(-hours)
  }

  subtractDays(days: number): UtcDate {
    return this.addDays(-days)
  }

  diffInMilliseconds(other: UtcDate): number {
    return this.toEpochMilliseconds() - other.toEpochMilliseconds()
  }

  diffInSeconds(other: UtcDate): number {
    return Math.floor(this.diffInMilliseconds(other) / 1000)
  }

  /**
   * Normalizes to 00:00:00.000 UTC.
   */
  startOfUtcDay(): UtcDate {
    return new UtcDate(
      new Date(
        Date.UTC(
          this.value.getUTCFullYear(),
          this.value.getUTCMonth(),
          this.value.getUTCDate(),
          0,
          0,
          0,
          0
        )
      )
    )
  }

  /**
   * Normalizes to 23:59:59.999 UTC.
   */
  endOfUtcDay(): UtcDate {
    return new UtcDate(
      new Date(
        Date.UTC(
          this.value.getUTCFullYear(),
          this.value.getUTCMonth(),
          this.value.getUTCDate(),
          23,
          59,
          59,
          999
        )
      )
    )
  }

  private static assertFiniteNumber(value: number, label: string): void {
    if (!Number.isFinite(value)) {
      throw new InvalidUtcDateError(`${label} must be a finite number`)
    }
  }

  private static isStrictIsoWithTimezone(value: string): boolean {
    // eslint-disable-next-line security/detect-unsafe-regex
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  }
}
