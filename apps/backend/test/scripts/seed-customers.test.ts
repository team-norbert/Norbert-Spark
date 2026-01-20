import { describe, expect, it } from 'vitest'

/**
 * Test suite for the seed-customers script helper functions
 *
 * This tests the core data generation logic used when seeding
 * customers and people into the database.
 */
describe('seed-customers helper functions', () => {
  // Copy helper functions from seed-customers.ts for testing
  function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  function randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]!
  }

  function randomBoolean(probability = 0.5): boolean {
    return Math.random() < probability
  }

  function generatePhoneNumber(country: string): string {
    if (country === 'US' || country === 'CA') {
      return `+1-${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`
    } else if (country === 'GB') {
      return `+44-20-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`
    } else if (country === 'DE') {
      return `+49-30-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`
    } else if (country === 'AU') {
      return `+61-2-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`
    } else {
      return `+${randomInt(1, 999)}-${randomInt(100, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`
    }
  }

  function generateEmail(firstName: string, lastName: string, companyDomain: string): string {
    const domain = companyDomain.replace('https://www.', '').replace('http://', '')
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`
  }

  function generateCompanyName(): { legal: string; display: string } {
    const companyPrefixes = ['Alpha', 'Beta', 'Prime', 'Core', 'Next', 'Smart', 'Digital', 'Cloud']
    const companyRoots = ['Tech', 'Soft', 'Wave', 'Link', 'Path', 'Shift', 'Craft', 'Systems']
    const companySuffixes = [
      'Inc',
      'LLC',
      'Corp',
      'Ltd',
      'Group',
      'Co',
      'Technologies',
      'Enterprises',
    ]

    const prefix = randomElement(companyPrefixes)
    const root = randomElement(companyRoots)
    const suffix = randomElement(companySuffixes)

    const legalName = `${prefix}${root} ${suffix}.`
    const displayName = randomBoolean(0.7) ? `${prefix}${root}` : legalName.replace('.', '')

    return { legal: legalName, display: displayName }
  }

  function generateWebsiteUrl(companyName: string): string {
    const domain = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20)
    const tld = randomElement(['com', 'io', 'co', 'tech', 'ai', 'net'])
    return `https://www.${domain}.${tld}`
  }

  describe('randomInt', () => {
    it('should return a number within the specified range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInt(1, 10)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(10)
        expect(Number.isInteger(result)).toBe(true)
      }
    })

    it('should return min when min equals max', () => {
      expect(randomInt(5, 5)).toBe(5)
    })

    it('should handle negative numbers', () => {
      for (let i = 0; i < 50; i++) {
        const result = randomInt(-10, -1)
        expect(result).toBeGreaterThanOrEqual(-10)
        expect(result).toBeLessThanOrEqual(-1)
      }
    })

    it('should include both min and max values', () => {
      const results = new Set<number>()
      for (let i = 0; i < 1000; i++) {
        results.add(randomInt(1, 3))
      }
      expect(results.has(1)).toBe(true)
      expect(results.has(2)).toBe(true)
      expect(results.has(3)).toBe(true)
    })
  })

  describe('randomElement', () => {
    it('should return an element from the array', () => {
      const array = ['a', 'b', 'c', 'd']
      for (let i = 0; i < 50; i++) {
        const result = randomElement(array)
        expect(array).toContain(result)
      }
    })

    it('should work with different data types', () => {
      const numbers = [1, 2, 3, 4, 5]
      expect(numbers).toContain(randomElement(numbers))

      const objects = [{ id: 1 }, { id: 2 }, { id: 3 }]
      expect(objects).toContain(randomElement(objects))
    })

    it('should return the only element in a single-element array', () => {
      expect(randomElement(['single'])).toBe('single')
    })
  })

  describe('randomBoolean', () => {
    it('should return a boolean', () => {
      for (let i = 0; i < 50; i++) {
        const result = randomBoolean()
        expect(typeof result).toBe('boolean')
      }
    })

    it('should return true more often with high probability', () => {
      let trueCount = 0
      const iterations = 1000
      for (let i = 0; i < iterations; i++) {
        if (randomBoolean(0.9)) trueCount++
      }
      // With 90% probability, expect around 900 true values (allow 10% variance)
      expect(trueCount).toBeGreaterThan(800)
      expect(trueCount).toBeLessThan(1000)
    })

    it('should return false more often with low probability', () => {
      let falseCount = 0
      const iterations = 1000
      for (let i = 0; i < iterations; i++) {
        if (!randomBoolean(0.1)) falseCount++
      }
      // With 10% probability, expect around 900 false values (allow 10% variance)
      expect(falseCount).toBeGreaterThan(800)
      expect(falseCount).toBeLessThan(1000)
    })

    it('should default to 0.5 probability', () => {
      let trueCount = 0
      const iterations = 1000
      for (let i = 0; i < iterations; i++) {
        if (randomBoolean()) trueCount++
      }
      // With 50% probability, expect around 500 true values (allow 20% variance)
      expect(trueCount).toBeGreaterThan(400)
      expect(trueCount).toBeLessThan(600)
    })
  })

  describe('generatePhoneNumber', () => {
    it('should generate US format for US country code', () => {
      const phone = generatePhoneNumber('US')
      expect(phone).toMatch(/^\+1-[2-9]\d{2}-[2-9]\d{2}-\d{4}$/)
    })

    it('should generate US format for CA country code', () => {
      const phone = generatePhoneNumber('CA')
      expect(phone).toMatch(/^\+1-[2-9]\d{2}-[2-9]\d{2}-\d{4}$/)
    })

    it('should generate UK format for GB country code', () => {
      const phone = generatePhoneNumber('GB')
      expect(phone).toMatch(/^\+44-20-\d{4}-\d{4}$/)
    })

    it('should generate German format for DE country code', () => {
      const phone = generatePhoneNumber('DE')
      expect(phone).toMatch(/^\+49-30-\d{4}-\d{4}$/)
    })

    it('should generate Australian format for AU country code', () => {
      const phone = generatePhoneNumber('AU')
      expect(phone).toMatch(/^\+61-2-\d{4}-\d{4}$/)
    })

    it('should generate generic format for unknown country code', () => {
      const phone = generatePhoneNumber('FR')
      expect(phone).toMatch(/^\+\d{1,3}-\d{3}-\d{3}-\d{4}$/)
    })

    it('should generate different numbers each time', () => {
      const phone1 = generatePhoneNumber('US')
      const phone2 = generatePhoneNumber('US')
      // Very unlikely to be the same (1 in millions)
      expect(phone1).not.toBe(phone2)
    })
  })

  describe('generateEmail', () => {
    it('should generate email with correct format', () => {
      const email = generateEmail('John', 'Doe', 'https://www.example.com')
      expect(email).toBe('john.doe@example.com')
    })

    it('should strip https://www. prefix from domain', () => {
      const email = generateEmail('Jane', 'Smith', 'https://www.acmecorp.io')
      expect(email).toBe('jane.smith@acmecorp.io')
    })

    it('should strip http:// prefix from domain', () => {
      const email = generateEmail('Bob', 'Johnson', 'http://testsite.net')
      expect(email).toBe('bob.johnson@testsite.net')
    })

    it('should convert names to lowercase', () => {
      const email = generateEmail('MARY', 'WILLIAMS', 'https://www.company.com')
      expect(email).toBe('mary.williams@company.com')
    })

    it('should handle mixed case input', () => {
      const email = generateEmail('MiXeD', 'CaSe', 'https://www.TeSt.COM')
      expect(email).toBe('mixed.case@TeSt.COM')
    })
  })

  describe('generateCompanyName', () => {
    it('should return an object with legal and display names', () => {
      const company = generateCompanyName()
      expect(company).toHaveProperty('legal')
      expect(company).toHaveProperty('display')
      expect(typeof company.legal).toBe('string')
      expect(typeof company.display).toBe('string')
    })

    it('should generate legal name with period at end', () => {
      const company = generateCompanyName()
      expect(company.legal).toMatch(/\.$/)
    })

    it('should generate non-empty names', () => {
      for (let i = 0; i < 20; i++) {
        const company = generateCompanyName()
        expect(company.legal.length).toBeGreaterThan(5)
        expect(company.display.length).toBeGreaterThan(3)
      }
    })

    it('should generate different names each time', () => {
      const names = new Set<string>()
      for (let i = 0; i < 50; i++) {
        names.add(generateCompanyName().legal)
      }
      // Should have at least 40 unique names out of 50
      expect(names.size).toBeGreaterThan(40)
    })
  })

  describe('generateWebsiteUrl', () => {
    it('should generate URL with https://www. prefix', () => {
      const url = generateWebsiteUrl('TestCompany')
      expect(url).toMatch(/^https:\/\/www\./)
    })

    it('should convert company name to lowercase', () => {
      const url = generateWebsiteUrl('UPPERCASE')
      expect(url).toContain('uppercase')
    })

    it('should remove non-alphanumeric characters', () => {
      const url = generateWebsiteUrl('Test & Company!')
      expect(url).not.toContain('&')
      expect(url).not.toContain('!')
      expect(url).not.toContain(' ')
    })

    it('should truncate to 20 characters for domain', () => {
      const url = generateWebsiteUrl('VeryLongCompanyNameThatExceedsTwentyCharacters')
      const domain = url.replace(/^https:\/\/www\./, '').split('.')[0]!
      expect(domain.length).toBeLessThanOrEqual(20)
    })

    it('should include a valid TLD', () => {
      const validTlds = ['com', 'io', 'co', 'tech', 'ai', 'net']
      for (let i = 0; i < 20; i++) {
        const url = generateWebsiteUrl('Company')
        const tld = url.split('.').pop()
        expect(validTlds).toContain(tld)
      }
    })

    it('should generate consistent format', () => {
      const url = generateWebsiteUrl('Example')
      expect(url).toMatch(/^https:\/\/www\.[a-z0-9]+\.(com|io|co|tech|ai|net)$/)
    })
  })
})
