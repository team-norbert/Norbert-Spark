import { describe, expect, it } from 'vitest'

import { InvalidUtcDateError, UtcDate } from '../../src/utils/UtcDate.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const KNOWN_ISO = '2026-03-07T09:30:00.000Z'
const KNOWN_MS = 1772875800000 // Date.parse(KNOWN_ISO)
const KNOWN_S = Math.floor(KNOWN_MS / 1000)

function knownDate(): UtcDate {
  return UtcDate.fromEpochMilliseconds(KNOWN_MS)
}

// ---------------------------------------------------------------------------
// InvalidUtcDateError
// ---------------------------------------------------------------------------

describe('InvalidUtcDateError', () => {
  it('should be an instance of Error', () => {
    const err = new InvalidUtcDateError('oops')
    expect(err).toBeInstanceOf(Error)
  })

  it('should be an instance of InvalidUtcDateError', () => {
    const err = new InvalidUtcDateError('oops')
    expect(err).toBeInstanceOf(InvalidUtcDateError)
  })

  it('should set the message', () => {
    expect(new InvalidUtcDateError('bad input').message).toBe('bad input')
  })

  it('should set name to InvalidUtcDateError', () => {
    expect(new InvalidUtcDateError('x').name).toBe('InvalidUtcDateError')
  })
})

// ---------------------------------------------------------------------------
// UtcDate.now()
// ---------------------------------------------------------------------------

describe('UtcDate.now()', () => {
  it('should return a UtcDate', () => {
    expect(UtcDate.now()).toBeInstanceOf(UtcDate)
  })

  it('should return a timestamp between the instants captured immediately before and after the call', () => {
    const before = Date.now()
    const d = UtcDate.now()
    const after = Date.now()
    expect(d.toEpochMilliseconds()).toBeGreaterThanOrEqual(before)
    expect(d.toEpochMilliseconds()).toBeLessThanOrEqual(after)
  })
})

// ---------------------------------------------------------------------------
// UtcDate.fromDate()
// ---------------------------------------------------------------------------

describe('UtcDate.fromDate()', () => {
  it('should create a UtcDate from a valid Date', () => {
    const d = UtcDate.fromDate(new Date(KNOWN_MS))
    expect(d.toEpochMilliseconds()).toBe(KNOWN_MS)
  })

  it('should clone the input so mutations do not affect the UtcDate', () => {
    const source = new Date(KNOWN_MS)
    const d = UtcDate.fromDate(source)
    source.setTime(0)
    expect(d.toEpochMilliseconds()).toBe(KNOWN_MS)
  })

  it('should throw InvalidUtcDateError for an invalid Date', () => {
    expect(() => UtcDate.fromDate(new Date('not-a-date'))).toThrowError(InvalidUtcDateError)
  })

  it('should throw with message "Invalid date" for an invalid Date', () => {
    expect(() => UtcDate.fromDate(new Date('not-a-date'))).toThrowError('Invalid date')
  })
})

// ---------------------------------------------------------------------------
// UtcDate.fromEpochMilliseconds()
// ---------------------------------------------------------------------------

describe('UtcDate.fromEpochMilliseconds()', () => {
  it('should create a UtcDate from a valid millisecond epoch', () => {
    const d = UtcDate.fromEpochMilliseconds(KNOWN_MS)
    expect(d.toEpochMilliseconds()).toBe(KNOWN_MS)
  })

  it('should accept 0 (Unix epoch)', () => {
    const d = UtcDate.fromEpochMilliseconds(0)
    expect(d.toEpochMilliseconds()).toBe(0)
  })

  it('should accept negative values (before Unix epoch)', () => {
    const d = UtcDate.fromEpochMilliseconds(-1000)
    expect(d.toEpochMilliseconds()).toBe(-1000)
  })

  it('should throw for Infinity', () => {
    expect(() => UtcDate.fromEpochMilliseconds(Infinity)).toThrowError(InvalidUtcDateError)
  })

  it('should throw for -Infinity', () => {
    expect(() => UtcDate.fromEpochMilliseconds(-Infinity)).toThrowError(InvalidUtcDateError)
  })

  it('should throw for NaN', () => {
    expect(() => UtcDate.fromEpochMilliseconds(NaN)).toThrowError(InvalidUtcDateError)
  })

  it('should include "finite" in the error message', () => {
    expect(() => UtcDate.fromEpochMilliseconds(Infinity)).toThrowError(
      'Epoch milliseconds must be a finite number'
    )
  })
})

// ---------------------------------------------------------------------------
// UtcDate.fromEpochSeconds()
// ---------------------------------------------------------------------------

describe('UtcDate.fromEpochSeconds()', () => {
  it('should create a UtcDate from a valid second epoch', () => {
    const d = UtcDate.fromEpochSeconds(KNOWN_S)
    expect(d.toEpochMilliseconds()).toBe(KNOWN_S * 1000)
  })

  it('should convert seconds to milliseconds (× 1000)', () => {
    const d = UtcDate.fromEpochSeconds(1)
    expect(d.toEpochMilliseconds()).toBe(1000)
  })

  it('should accept 0', () => {
    expect(UtcDate.fromEpochSeconds(0).toEpochMilliseconds()).toBe(0)
  })

  it('should accept negative seconds', () => {
    expect(UtcDate.fromEpochSeconds(-5).toEpochMilliseconds()).toBe(-5000)
  })

  it('should throw for Infinity', () => {
    expect(() => UtcDate.fromEpochSeconds(Infinity)).toThrowError(InvalidUtcDateError)
  })

  it('should throw for -Infinity', () => {
    expect(() => UtcDate.fromEpochSeconds(-Infinity)).toThrowError(InvalidUtcDateError)
  })

  it('should throw for NaN', () => {
    expect(() => UtcDate.fromEpochSeconds(NaN)).toThrowError(InvalidUtcDateError)
  })

  it('should include "finite" in the error message', () => {
    expect(() => UtcDate.fromEpochSeconds(NaN)).toThrowError(
      'Epoch seconds must be a finite number'
    )
  })
})

// ---------------------------------------------------------------------------
// UtcDate.fromIsoString()
// ---------------------------------------------------------------------------

describe('UtcDate.fromIsoString()', () => {
  describe('valid ISO strings (strict — must include timezone)', () => {
    it('should accept a Z-suffixed datetime', () => {
      const d = UtcDate.fromIsoString('2026-03-07T09:30:00Z')
      expect(d.toISOString()).toBe('2026-03-07T09:30:00.000Z')
    })

    it('should accept a datetime with milliseconds and Z suffix', () => {
      const d = UtcDate.fromIsoString('2026-03-07T09:30:00.123Z')
      expect(d.toISOString()).toBe('2026-03-07T09:30:00.123Z')
    })

    it('should accept a datetime with 1-digit milliseconds and Z suffix', () => {
      const d = UtcDate.fromIsoString('2026-03-07T09:30:00.1Z')
      expect(d).toBeInstanceOf(UtcDate)
    })

    it('should accept a datetime with 2-digit milliseconds and Z suffix', () => {
      const d = UtcDate.fromIsoString('2026-03-07T09:30:00.12Z')
      expect(d).toBeInstanceOf(UtcDate)
    })

    it('should accept a datetime with +00:00 offset', () => {
      const d = UtcDate.fromIsoString('2026-03-07T09:30:00+00:00')
      expect(d).toBeInstanceOf(UtcDate)
    })

    it('should accept a datetime with positive offset', () => {
      const d = UtcDate.fromIsoString('2026-03-07T10:30:00+01:00')
      expect(d).toBeInstanceOf(UtcDate)
    })

    it('should accept a datetime with negative offset', () => {
      const d = UtcDate.fromIsoString('2026-03-07T04:30:00-05:00')
      expect(d).toBeInstanceOf(UtcDate)
    })

    it('should normalise +00:00 and Z to the same UTC epoch', () => {
      const withZ = UtcDate.fromIsoString('2026-03-07T09:30:00Z')
      const withOffset = UtcDate.fromIsoString('2026-03-07T09:30:00+00:00')
      expect(withZ.toEpochMilliseconds()).toBe(withOffset.toEpochMilliseconds())
    })
  })

  describe('invalid ISO strings (should throw)', () => {
    it('should throw for a date-only string', () => {
      expect(() => UtcDate.fromIsoString('2026-03-07')).toThrowError(InvalidUtcDateError)
    })

    it('should throw for a datetime without timezone', () => {
      expect(() => UtcDate.fromIsoString('2026-03-07T09:30:00')).toThrowError(InvalidUtcDateError)
    })

    it('should throw for a random string', () => {
      expect(() => UtcDate.fromIsoString('not-a-date')).toThrowError(InvalidUtcDateError)
    })

    it('should throw for an empty string', () => {
      expect(() => UtcDate.fromIsoString('')).toThrowError(InvalidUtcDateError)
    })

    it('should throw for a datetime with space separator instead of T', () => {
      expect(() => UtcDate.fromIsoString('2026-03-07 09:30:00Z')).toThrowError(InvalidUtcDateError)
    })

    it('should include timezone in the error message', () => {
      expect(() => UtcDate.fromIsoString('2026-03-07')).toThrowError(
        'ISO string must include date, time, and timezone offset'
      )
    })
  })
})

// ---------------------------------------------------------------------------
// UtcDate.create()
// ---------------------------------------------------------------------------

describe('UtcDate.create()', () => {
  it('should return the same UtcDate instance when given a UtcDate', () => {
    const d = knownDate()
    expect(UtcDate.create(d)).toBe(d)
  })

  it('should accept a native Date', () => {
    const d = UtcDate.create(new Date(KNOWN_MS))
    expect(d.toEpochMilliseconds()).toBe(KNOWN_MS)
  })

  it('should accept a valid ISO string', () => {
    const d = UtcDate.create(KNOWN_ISO)
    expect(d.toEpochMilliseconds()).toBe(KNOWN_MS)
  })

  it('should throw for an invalid ISO string', () => {
    expect(() => UtcDate.create('2026-03-07')).toThrowError(InvalidUtcDateError)
  })

  it('should accept a number (epoch ms)', () => {
    const d = UtcDate.create(KNOWN_MS)
    expect(d.toEpochMilliseconds()).toBe(KNOWN_MS)
  })

  it('should throw for a non-finite number', () => {
    expect(() => UtcDate.create(Infinity)).toThrowError(InvalidUtcDateError)
  })
})

// ---------------------------------------------------------------------------
// toDate()
// ---------------------------------------------------------------------------

describe('toDate()', () => {
  it('should return a native Date with the same epoch ms', () => {
    const d = knownDate()
    expect(d.toDate()).toEqual(new Date(KNOWN_MS))
  })

  it('should return a defensive copy (mutation does not affect the UtcDate)', () => {
    const d = knownDate()
    const copy = d.toDate()
    copy.setTime(0)
    expect(d.toEpochMilliseconds()).toBe(KNOWN_MS)
  })

  it('should return a Date instance', () => {
    expect(knownDate().toDate()).toBeInstanceOf(Date)
  })
})

// ---------------------------------------------------------------------------
// toISOString()
// ---------------------------------------------------------------------------

describe('toISOString()', () => {
  it('should return the correct ISO string', () => {
    expect(knownDate().toISOString()).toBe(KNOWN_ISO)
  })

  it('should always end with Z', () => {
    expect(knownDate().toISOString()).toMatch(/Z$/)
  })
})

// ---------------------------------------------------------------------------
// toEpochMilliseconds()
// ---------------------------------------------------------------------------

describe('toEpochMilliseconds()', () => {
  it('should return the underlying epoch in milliseconds', () => {
    expect(knownDate().toEpochMilliseconds()).toBe(KNOWN_MS)
  })

  it('should return 0 for the Unix epoch', () => {
    expect(UtcDate.fromEpochMilliseconds(0).toEpochMilliseconds()).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// toEpochSeconds()
// ---------------------------------------------------------------------------

describe('toEpochSeconds()', () => {
  it('should return the floor of epoch ms / 1000', () => {
    expect(knownDate().toEpochSeconds()).toBe(KNOWN_S)
  })

  it('should floor fractional seconds', () => {
    const d = UtcDate.fromEpochMilliseconds(1500)
    expect(d.toEpochSeconds()).toBe(1)
  })

  it('should return 0 for epoch 0', () => {
    expect(UtcDate.fromEpochMilliseconds(0).toEpochSeconds()).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// toUtcSqlTimestamp()
// ---------------------------------------------------------------------------

describe('toUtcSqlTimestamp()', () => {
  it('should format as YYYY-MM-DD HH:MM:SS.mmm', () => {
    expect(knownDate().toUtcSqlTimestamp()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/)
  })

  it('should return the correct value for the known timestamp', () => {
    expect(knownDate().toUtcSqlTimestamp()).toBe('2026-03-07 09:30:00.000')
  })

  it('should zero-pad single-digit months, days, hours, minutes, seconds', () => {
    // 2000-01-02T03:04:05.006Z
    const d = UtcDate.fromIsoString('2000-01-02T03:04:05.006Z')
    expect(d.toUtcSqlTimestamp()).toBe('2000-01-02 03:04:05.006')
  })
})

// ---------------------------------------------------------------------------
// toJSON()
// ---------------------------------------------------------------------------

describe('toJSON()', () => {
  it('should return the same value as toISOString()', () => {
    const d = knownDate()
    expect(d.toJSON()).toBe(d.toISOString())
  })

  it('should serialise correctly via JSON.stringify()', () => {
    expect(JSON.stringify(knownDate())).toBe(`"${KNOWN_ISO}"`)
  })
})

// ---------------------------------------------------------------------------
// valueOf()
// ---------------------------------------------------------------------------

describe('valueOf()', () => {
  it('should return the same value as toEpochMilliseconds()', () => {
    const d = knownDate()
    expect(d.valueOf()).toBe(d.toEpochMilliseconds())
  })

  it('should allow numeric comparison with +', () => {
    const d = knownDate()
    expect(+d).toBe(KNOWN_MS)
  })
})

// ---------------------------------------------------------------------------
// equals()
// ---------------------------------------------------------------------------

describe('equals()', () => {
  it('should return true for two UtcDates with the same epoch', () => {
    const a = UtcDate.fromEpochMilliseconds(KNOWN_MS)
    const b = UtcDate.fromEpochMilliseconds(KNOWN_MS)
    expect(a.equals(b)).toBe(true)
  })

  it('should return false for two UtcDates with different epochs', () => {
    const a = knownDate()
    const b = knownDate().addMilliseconds(1)
    expect(a.equals(b)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isBefore() / isBeforeOrEqual()
// ---------------------------------------------------------------------------

describe('isBefore()', () => {
  it('should return true when this is earlier', () => {
    const earlier = knownDate()
    const later = knownDate().addMilliseconds(1)
    expect(earlier.isBefore(later)).toBe(true)
  })

  it('should return false when this is later', () => {
    const earlier = knownDate()
    const later = knownDate().addMilliseconds(1)
    expect(later.isBefore(earlier)).toBe(false)
  })

  it('should return false for equal dates', () => {
    const d = knownDate()
    expect(d.isBefore(d)).toBe(false)
  })
})

describe('isBeforeOrEqual()', () => {
  it('should return true when this is earlier', () => {
    const earlier = knownDate()
    const later = knownDate().addMilliseconds(1)
    expect(earlier.isBeforeOrEqual(later)).toBe(true)
  })

  it('should return true for equal dates', () => {
    const d = knownDate()
    const copy = UtcDate.fromEpochMilliseconds(d.toEpochMilliseconds())
    expect(d.isBeforeOrEqual(copy)).toBe(true)
  })

  it('should return false when this is later', () => {
    const earlier = knownDate()
    const later = knownDate().addMilliseconds(1)
    expect(later.isBeforeOrEqual(earlier)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isAfter() / isAfterOrEqual()
// ---------------------------------------------------------------------------

describe('isAfter()', () => {
  it('should return true when this is later', () => {
    const later = knownDate().addMilliseconds(1)
    expect(later.isAfter(knownDate())).toBe(true)
  })

  it('should return false when this is earlier', () => {
    expect(knownDate().isAfter(knownDate().addMilliseconds(1))).toBe(false)
  })

  it('should return false for equal dates', () => {
    const d = knownDate()
    expect(d.isAfter(d)).toBe(false)
  })
})

describe('isAfterOrEqual()', () => {
  it('should return true when this is later', () => {
    const later = knownDate().addMilliseconds(1)
    expect(later.isAfterOrEqual(knownDate())).toBe(true)
  })

  it('should return true for equal dates', () => {
    const d = knownDate()
    const copy = UtcDate.fromEpochMilliseconds(d.toEpochMilliseconds())
    expect(d.isAfterOrEqual(copy)).toBe(true)
  })

  it('should return false when this is earlier', () => {
    expect(knownDate().isAfterOrEqual(knownDate().addMilliseconds(1))).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// addMilliseconds()
// ---------------------------------------------------------------------------

describe('addMilliseconds()', () => {
  it('should add a positive number of milliseconds', () => {
    expect(knownDate().addMilliseconds(500).toEpochMilliseconds()).toBe(KNOWN_MS + 500)
  })

  it('should add a negative number of milliseconds (go back in time)', () => {
    expect(knownDate().addMilliseconds(-1000).toEpochMilliseconds()).toBe(KNOWN_MS - 1000)
  })

  it('should return a new UtcDate instance', () => {
    const d = knownDate()
    expect(d.addMilliseconds(1)).not.toBe(d)
  })

  it('should throw InvalidUtcDateError for Infinity', () => {
    expect(() => knownDate().addMilliseconds(Infinity)).toThrowError(InvalidUtcDateError)
  })

  it('should throw InvalidUtcDateError for NaN', () => {
    expect(() => knownDate().addMilliseconds(NaN)).toThrowError(InvalidUtcDateError)
  })

  it('should include "milliseconds" in the error message', () => {
    expect(() => knownDate().addMilliseconds(Infinity)).toThrowError('milliseconds')
  })
})

// ---------------------------------------------------------------------------
// addSeconds()
// ---------------------------------------------------------------------------

describe('addSeconds()', () => {
  it('should add seconds converted to milliseconds', () => {
    expect(knownDate().addSeconds(10).toEpochMilliseconds()).toBe(KNOWN_MS + 10_000)
  })

  it('should throw for non-finite input', () => {
    expect(() => knownDate().addSeconds(Infinity)).toThrowError(InvalidUtcDateError)
  })
})

// ---------------------------------------------------------------------------
// addMinutes()
// ---------------------------------------------------------------------------

describe('addMinutes()', () => {
  it('should add minutes converted to milliseconds', () => {
    expect(knownDate().addMinutes(1).toEpochMilliseconds()).toBe(KNOWN_MS + 60_000)
  })

  it('should throw for non-finite input', () => {
    expect(() => knownDate().addMinutes(NaN)).toThrowError(InvalidUtcDateError)
  })
})

// ---------------------------------------------------------------------------
// addHours()
// ---------------------------------------------------------------------------

describe('addHours()', () => {
  it('should add hours converted to milliseconds', () => {
    expect(knownDate().addHours(1).toEpochMilliseconds()).toBe(KNOWN_MS + 3_600_000)
  })

  it('should throw for non-finite input', () => {
    expect(() => knownDate().addHours(-Infinity)).toThrowError(InvalidUtcDateError)
  })
})

// ---------------------------------------------------------------------------
// addDays()
// ---------------------------------------------------------------------------

describe('addDays()', () => {
  it('should add days converted to milliseconds', () => {
    expect(knownDate().addDays(1).toEpochMilliseconds()).toBe(KNOWN_MS + 86_400_000)
  })

  it('should throw for non-finite input', () => {
    expect(() => knownDate().addDays(NaN)).toThrowError(InvalidUtcDateError)
  })
})

// ---------------------------------------------------------------------------
// subtractMilliseconds()
// ---------------------------------------------------------------------------

describe('subtractMilliseconds()', () => {
  it('should subtract milliseconds', () => {
    expect(knownDate().subtractMilliseconds(500).toEpochMilliseconds()).toBe(KNOWN_MS - 500)
  })

  it('should throw for non-finite input', () => {
    expect(() => knownDate().subtractMilliseconds(Infinity)).toThrowError(InvalidUtcDateError)
  })
})

// ---------------------------------------------------------------------------
// subtractSeconds()
// ---------------------------------------------------------------------------

describe('subtractSeconds()', () => {
  it('should subtract seconds converted to milliseconds', () => {
    expect(knownDate().subtractSeconds(5).toEpochMilliseconds()).toBe(KNOWN_MS - 5_000)
  })
})

// ---------------------------------------------------------------------------
// subtractMinutes()
// ---------------------------------------------------------------------------

describe('subtractMinutes()', () => {
  it('should subtract minutes converted to milliseconds', () => {
    expect(knownDate().subtractMinutes(2).toEpochMilliseconds()).toBe(KNOWN_MS - 120_000)
  })
})

// ---------------------------------------------------------------------------
// subtractHours()
// ---------------------------------------------------------------------------

describe('subtractHours()', () => {
  it('should subtract hours converted to milliseconds', () => {
    expect(knownDate().subtractHours(2).toEpochMilliseconds()).toBe(KNOWN_MS - 7_200_000)
  })
})

// ---------------------------------------------------------------------------
// subtractDays()
// ---------------------------------------------------------------------------

describe('subtractDays()', () => {
  it('should subtract days converted to milliseconds', () => {
    expect(knownDate().subtractDays(1).toEpochMilliseconds()).toBe(KNOWN_MS - 86_400_000)
  })
})

// ---------------------------------------------------------------------------
// diffInMilliseconds()
// ---------------------------------------------------------------------------

describe('diffInMilliseconds()', () => {
  it('should return this - other in ms (positive when this is later)', () => {
    const a = knownDate().addMilliseconds(300)
    const b = knownDate()
    expect(a.diffInMilliseconds(b)).toBe(300)
  })

  it('should return negative when this is earlier', () => {
    const a = knownDate()
    const b = knownDate().addMilliseconds(300)
    expect(a.diffInMilliseconds(b)).toBe(-300)
  })

  it('should return 0 for equal dates', () => {
    const d = knownDate()
    expect(d.diffInMilliseconds(d)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// diffInSeconds()
// ---------------------------------------------------------------------------

describe('diffInSeconds()', () => {
  it('should return the floor of diffInMilliseconds / 1000', () => {
    const a = knownDate().addMilliseconds(2500)
    const b = knownDate()
    expect(a.diffInSeconds(b)).toBe(2)
  })

  it('should return 0 for equal dates', () => {
    const d = knownDate()
    expect(d.diffInSeconds(d)).toBe(0)
  })

  it('should return negative when this is earlier', () => {
    const a = knownDate()
    const b = knownDate().addSeconds(3)
    expect(a.diffInSeconds(b)).toBe(-3)
  })
})

// ---------------------------------------------------------------------------
// startOfUtcDay()
// ---------------------------------------------------------------------------

describe('startOfUtcDay()', () => {
  it('should normalise to 00:00:00.000 UTC', () => {
    const d = UtcDate.fromIsoString('2026-03-07T15:45:30.123Z')
    expect(d.startOfUtcDay().toISOString()).toBe('2026-03-07T00:00:00.000Z')
  })

  it('should return a new UtcDate instance', () => {
    const d = knownDate()
    expect(d.startOfUtcDay()).not.toBe(d)
  })

  it('should not change a date already at start of day', () => {
    const d = UtcDate.fromIsoString('2026-03-07T00:00:00.000Z')
    expect(d.startOfUtcDay().toISOString()).toBe('2026-03-07T00:00:00.000Z')
  })
})

// ---------------------------------------------------------------------------
// endOfUtcDay()
// ---------------------------------------------------------------------------

describe('endOfUtcDay()', () => {
  it('should normalise to 23:59:59.999 UTC', () => {
    const d = UtcDate.fromIsoString('2026-03-07T00:00:00.000Z')
    expect(d.endOfUtcDay().toISOString()).toBe('2026-03-07T23:59:59.999Z')
  })

  it('should return a new UtcDate instance', () => {
    const d = knownDate()
    expect(d.endOfUtcDay()).not.toBe(d)
  })

  it('should not change a date already at end of day', () => {
    const d = UtcDate.fromIsoString('2026-03-07T23:59:59.999Z')
    expect(d.endOfUtcDay().toISOString()).toBe('2026-03-07T23:59:59.999Z')
  })
})

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('arithmetic methods should return a new instance, not mutate the original', () => {
    const original = knownDate()
    const after = original.addDays(1)
    expect(original.toEpochMilliseconds()).toBe(KNOWN_MS)
    expect(after.toEpochMilliseconds()).toBe(KNOWN_MS + 86_400_000)
  })

  it('create() with a UtcDate should return the same reference unchanged', () => {
    const d = knownDate()
    expect(UtcDate.create(d)).toBe(d)
  })
})
