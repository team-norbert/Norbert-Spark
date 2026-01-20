import { describe, expect, it } from 'vitest'

import { SeedHelpers } from '../../src/shared/utils/seed-helpers.util.js'

/**
 * Test suite for the seed-customers script helper functions
 *
 * This tests the core data generation logic used when seeding
 * customers and people into the database.
 */
describe('seed-customers helper functions', () => {
  describe('randomInt', () => {
    it('should return a number within the specified range', () => {
      for (let i = 0; i < 100; i++) {
        const result = SeedHelpers.randomInt(1, 10)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(10)
        expect(Number.isInteger(result)).toBe(true)
      }
    })

    it('should return min when min equals max', () => {
      expect(SeedHelpers.randomInt(5, 5)).toBe(5)
    })

    it('should handle negative numbers', () => {
      for (let i = 0; i < 50; i++) {
        const result = SeedHelpers.randomInt(-10, -1)
        expect(result).toBeGreaterThanOrEqual(-10)
        expect(result).toBeLessThanOrEqual(-1)
      }
    })

    it('should include both min and max values', () => {
      const results = new Set<number>()
      for (let i = 0; i < 1000; i++) {
        results.add(SeedHelpers.randomInt(1, 3))
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
        const result = SeedHelpers.randomElement(array)
        expect(array).toContain(result)
      }
    })

    it('should work with different data types', () => {
      const numbers = [1, 2, 3, 4, 5]
      expect(numbers).toContain(SeedHelpers.randomElement(numbers))

      const objects = [{ id: 1 }, { id: 2 }, { id: 3 }]
      expect(objects).toContain(SeedHelpers.randomElement(objects))
    })

    it('should return the only element in a single-element array', () => {
      expect(SeedHelpers.randomElement(['single'])).toBe('single')
    })
  })

  describe('randomBoolean', () => {
    it('should return a boolean', () => {
      for (let i = 0; i < 50; i++) {
        const result = SeedHelpers.randomBoolean()
        expect(typeof result).toBe('boolean')
      }
    })

    it('should return true more often with high probability', () => {
      let trueCount = 0
      const iterations = 1000
      for (let i = 0; i < iterations; i++) {
        if (SeedHelpers.randomBoolean(0.9)) trueCount++
      }
      // With 90% probability, expect around 900 true values (allow 10% variance)
      expect(trueCount).toBeGreaterThan(800)
      expect(trueCount).toBeLessThan(1000)
    })

    it('should return false more often with low probability', () => {
      let falseCount = 0
      const iterations = 1000
      for (let i = 0; i < iterations; i++) {
        if (!SeedHelpers.randomBoolean(0.1)) falseCount++
      }
      // With 10% probability, expect around 900 false values (allow 10% variance)
      expect(falseCount).toBeGreaterThan(800)
      expect(falseCount).toBeLessThan(1000)
    })

    it('should default to 0.5 probability', () => {
      let trueCount = 0
      const iterations = 1000
      for (let i = 0; i < iterations; i++) {
        if (SeedHelpers.randomBoolean()) trueCount++
      }
      // With 50% probability, expect around 500 true values (allow 20% variance)
      expect(trueCount).toBeGreaterThan(400)
      expect(trueCount).toBeLessThan(600)
    })
  })

  describe('generatePhoneNumber', () => {
    it('should generate US format for US country code', () => {
      const phone = SeedHelpers.generatePhoneNumber('US')
      expect(phone).toMatch(/^\+1-[2-9]\d{2}-[2-9]\d{2}-\d{4}$/)
    })

    it('should generate US format for CA country code', () => {
      const phone = SeedHelpers.generatePhoneNumber('CA')
      expect(phone).toMatch(/^\+1-[2-9]\d{2}-[2-9]\d{2}-\d{4}$/)
    })

    it('should generate UK format for GB country code', () => {
      const phone = SeedHelpers.generatePhoneNumber('GB')
      expect(phone).toMatch(/^\+44-20-\d{4}-\d{4}$/)
    })

    it('should generate German format for DE country code', () => {
      const phone = SeedHelpers.generatePhoneNumber('DE')
      expect(phone).toMatch(/^\+49-30-\d{4}-\d{4}$/)
    })

    it('should generate Australian format for AU country code', () => {
      const phone = SeedHelpers.generatePhoneNumber('AU')
      expect(phone).toMatch(/^\+61-2-\d{4}-\d{4}$/)
    })

    it('should generate generic format for unknown country code', () => {
      const phone = SeedHelpers.generatePhoneNumber('FR')
      expect(phone).toMatch(/^\+\d{1,3}-\d{3}-\d{3}-\d{4}$/)
    })

    it('should generate different numbers each time', () => {
      const phone1 = SeedHelpers.generatePhoneNumber('US')
      const phone2 = SeedHelpers.generatePhoneNumber('US')
      // Very unlikely to be the same (1 in millions)
      expect(phone1).not.toBe(phone2)
    })
  })

  describe('generateEmail', () => {
    it('should generate email with correct format', () => {
      const email = SeedHelpers.generateEmail('John', 'Doe', 'https://www.example.com')
      expect(email).toBe('john.doe@example.com')
    })

    it('should strip https://www. prefix from domain', () => {
      const email = SeedHelpers.generateEmail('Jane', 'Smith', 'https://www.acmecorp.io')
      expect(email).toBe('jane.smith@acmecorp.io')
    })

    it('should strip http:// prefix from domain', () => {
      const email = SeedHelpers.generateEmail('Bob', 'Johnson', 'http://testsite.net')
      expect(email).toBe('bob.johnson@testsite.net')
    })

    it('should convert names to lowercase', () => {
      const email = SeedHelpers.generateEmail('MARY', 'WILLIAMS', 'https://www.company.com')
      expect(email).toBe('mary.williams@company.com')
    })

    it('should handle mixed case input', () => {
      const email = SeedHelpers.generateEmail('MiXeD', 'CaSe', 'https://www.TeSt.COM')
      expect(email).toBe('mixed.case@TeSt.COM')
    })
  })

  describe('generateCompanyName', () => {
    it('should return an object with legal and display names', () => {
      const company = SeedHelpers.generateCompanyName()
      expect(company).toHaveProperty('legal')
      expect(company).toHaveProperty('display')
      expect(typeof company.legal).toBe('string')
      expect(typeof company.display).toBe('string')
    })

    it('should generate legal name with period at end', () => {
      const company = SeedHelpers.generateCompanyName()
      expect(company.legal).toMatch(/\.$/)
    })

    it('should generate non-empty names', () => {
      for (let i = 0; i < 20; i++) {
        const company = SeedHelpers.generateCompanyName()
        expect(company.legal.length).toBeGreaterThan(5)
        expect(company.display.length).toBeGreaterThan(3)
      }
    })

    it('should generate different names each time', () => {
      const names = new Set<string>()
      for (let i = 0; i < 50; i++) {
        names.add(SeedHelpers.generateCompanyName().legal)
      }
      // Should have at least 40 unique names out of 50
      expect(names.size).toBeGreaterThan(40)
    })
  })

  describe('generateWebsiteUrl', () => {
    it('should generate URL with https://www. prefix', () => {
      const url = SeedHelpers.generateWebsiteUrl('TestCompany')
      expect(url).toMatch(/^https:\/\/www\./)
    })

    it('should convert company name to lowercase', () => {
      const url = SeedHelpers.generateWebsiteUrl('UPPERCASE')
      expect(url).toContain('uppercase')
    })

    it('should remove non-alphanumeric characters', () => {
      const url = SeedHelpers.generateWebsiteUrl('Test & Company!')
      expect(url).not.toContain('&')
      expect(url).not.toContain('!')
      expect(url).not.toContain(' ')
    })

    it('should truncate to 20 characters for domain', () => {
      const url = SeedHelpers.generateWebsiteUrl('VeryLongCompanyNameThatExceedsTwentyCharacters')
      const domain = url.replace(/^https:\/\/www\./, '').split('.')[0]!
      expect(domain.length).toBeLessThanOrEqual(20)
    })

    it('should include a valid TLD', () => {
      const validTlds = ['com', 'io', 'co', 'tech', 'ai', 'net']
      for (let i = 0; i < 20; i++) {
        const url = SeedHelpers.generateWebsiteUrl('Company')
        const tld = url.split('.').pop()
        expect(validTlds).toContain(tld)
      }
    })

    it('should generate consistent format', () => {
      const url = SeedHelpers.generateWebsiteUrl('Example')
      expect(url).toMatch(/^https:\/\/www\.[a-z0-9]+\.(com|io|co|tech|ai|net)$/)
    })
  })
})
