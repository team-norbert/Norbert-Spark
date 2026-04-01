import { afterEach, describe, expect, it, vi } from 'vitest'

import { SeedHelpers } from '../../../src/shared/utils/seed-helpers.util.js'

describe('SeedHelpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('companyPrefixes', () => {
    it('has 20 elements', () => {
      expect(SeedHelpers.companyPrefixes).toHaveLength(20)
    })

    it('contains all expected prefix values', () => {
      const expected = [
        'Tech',
        'Global',
        'Digital',
        'Smart',
        'Cloud',
        'Quantum',
        'Cyber',
        'Data',
        'Next',
        'Future',
        'Prime',
        'Alpha',
        'Beta',
        'Summit',
        'Apex',
        'Vertex',
        'Zenith',
        'Core',
        'Elite',
        'Pro',
      ]
      for (const prefix of expected) {
        expect(SeedHelpers.companyPrefixes).toContain(prefix)
      }
    })
  })

  describe('companyRoots', () => {
    it('has 20 elements', () => {
      expect(SeedHelpers.companyRoots).toHaveLength(20)
    })

    it('contains all expected root values', () => {
      const expected = [
        'Solutions',
        'Systems',
        'Innovations',
        'Ventures',
        'Dynamics',
        'Networks',
        'Services',
        'Labs',
        'Works',
        'Tech',
        'Soft',
        'Wave',
        'Bridge',
        'Path',
        'Link',
        'Flow',
        'Shift',
        'Forge',
        'Craft',
        'Build',
      ]
      for (const root of expected) {
        expect(SeedHelpers.companyRoots).toContain(root)
      }
    })
  })

  describe('companySuffixes', () => {
    it('has 8 elements', () => {
      expect(SeedHelpers.companySuffixes).toHaveLength(8)
    })

    it('contains all expected suffix values', () => {
      const expected = ['Inc', 'LLC', 'Corp', 'Ltd', 'Group', 'Partners', 'Technologies', 'Co']
      for (const suffix of expected) {
        expect(SeedHelpers.companySuffixes).toContain(suffix)
      }
    })
  })

  describe('randomInt', () => {
    it('returns a value within the given range inclusive', () => {
      for (let i = 0; i < 20; i++) {
        const result = SeedHelpers.randomInt(1, 10)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(10)
      }
    })

    it('returns min when Math.random() returns 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      expect(SeedHelpers.randomInt(5, 10)).toBe(5)
    })

    it('returns max when Math.random() returns just below 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9999)
      expect(SeedHelpers.randomInt(1, 5)).toBe(5)
    })

    it('returns a single value when min equals max', () => {
      expect(SeedHelpers.randomInt(7, 7)).toBe(7)
    })
  })

  describe('randomElement', () => {
    it('returns an element that exists in the array', () => {
      const array = ['a', 'b', 'c']
      const result = SeedHelpers.randomElement(array)
      expect(array).toContain(result)
    })

    it('returns the first element when Math.random() returns 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      expect(SeedHelpers.randomElement(['x', 'y', 'z'])).toBe('x')
    })

    it('returns the last element when Math.random() returns just below 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9999)
      expect(SeedHelpers.randomElement(['x', 'y', 'z'])).toBe('z')
    })

    it('works with numeric arrays', () => {
      const array = [10, 20, 30]
      const result = SeedHelpers.randomElement(array)
      expect(array).toContain(result)
    })

    it('deterministically selects by index from Math.random', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      // floor(0.5 * 4) = 2 → index 2
      expect(SeedHelpers.randomElement(['a', 'b', 'c', 'd'])).toBe('c')
    })
  })

  describe('randomBoolean', () => {
    it('returns true when Math.random() is strictly less than probability', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.3)
      expect(SeedHelpers.randomBoolean(0.5)).toBe(true)
    })

    it('returns false when Math.random() equals probability (strict < not <=)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      expect(SeedHelpers.randomBoolean(0.5)).toBe(false)
    })

    it('returns false when Math.random() is greater than probability', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.8)
      expect(SeedHelpers.randomBoolean(0.5)).toBe(false)
    })

    it('uses default probability of 0.5', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.4)
      expect(SeedHelpers.randomBoolean()).toBe(true)
    })

    it('returns false with default probability when random is above 0.5', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.6)
      expect(SeedHelpers.randomBoolean()).toBe(false)
    })

    it('always returns false when probability is 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.0001)
      expect(SeedHelpers.randomBoolean(0)).toBe(false)
    })

    it('always returns true when probability is 1 and random is below 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9999)
      expect(SeedHelpers.randomBoolean(1)).toBe(true)
    })
  })

  describe('generateCompanyName', () => {
    it('returns an object with legal and display string properties', () => {
      const result = SeedHelpers.generateCompanyName()
      expect(result).toHaveProperty('legal')
      expect(result).toHaveProperty('display')
      expect(typeof result.legal).toBe('string')
      expect(typeof result.display).toBe('string')
    })

    it('legal name always ends with a period', () => {
      for (let i = 0; i < 10; i++) {
        const result = SeedHelpers.generateCompanyName()
        expect(result.legal).toMatch(/\.$/)
      }
    })

    it('legal name follows prefix+root+space+suffix+period format', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      // random=0: prefix=companyPrefixes[0]='Tech', root=companyRoots[0]='Solutions', suffix=companySuffixes[0]='Inc'
      const result = SeedHelpers.generateCompanyName()
      expect(result.legal).toBe('TechSolutions Inc.')
    })

    it('display name is prefix+root when randomBoolean returns true', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      // randomBoolean(0.7): 0 < 0.7 = true → display = `${prefix}${root}`
      const result = SeedHelpers.generateCompanyName()
      expect(result.display).toBe('TechSolutions')
    })

    it('display name has the period removed from legal name when randomBoolean returns false', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.8)
      // randomBoolean(0.7): 0.8 < 0.7 = false → display = legalName.replace('.', '')
      const result = SeedHelpers.generateCompanyName()
      expect(result.display).not.toMatch(/\.$/)
      expect(result.display).toBe(result.legal.replace('.', ''))
    })

    it('display name does not retain the period or substitute with replacement artifacts', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.8)
      // 0.8 < 0.7 = false → else branch: legalName.replace('.', '')
      const result = SeedHelpers.generateCompanyName()
      // The period must be removed (kills mutation: replace('', '') is a no-op)
      expect(result.display.endsWith('.')).toBe(false)
      // The replacement must be empty string (kills mutation: replace('.', 'Stryker was here!'))
      expect(result.display).not.toContain('Stryker was here!')
    })

    it('legal name contains a space between root and suffix', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const result = SeedHelpers.generateCompanyName()
      // 'TechSolutions Inc.' — space before 'Inc'
      expect(result.legal).toMatch(/\s\w+\.$/)
    })

    it('legal and display names are both non-empty', () => {
      const result = SeedHelpers.generateCompanyName()
      expect(result.legal.length).toBeGreaterThan(0)
      expect(result.display.length).toBeGreaterThan(0)
    })
  })

  describe('generateWebsiteUrl', () => {
    it('returns a URL starting with https://www.', () => {
      const url = SeedHelpers.generateWebsiteUrl('Tech Solutions')
      expect(url).toMatch(/^https:\/\/www\./)
    })

    it('domain section is lowercase and alphanumeric only (no spaces or special chars)', () => {
      const url = SeedHelpers.generateWebsiteUrl('Tech Solutions Inc!')
      const domain = url.replace('https://www.', '').split('.')[0]
      expect(domain).toMatch(/^[a-z0-9]+$/)
    })

    it('truncates domain to at most 20 characters', () => {
      const longName = 'A'.repeat(50)
      const url = SeedHelpers.generateWebsiteUrl(longName)
      const domain = url.replace('https://www.', '').split('.')[0]
      expect(domain!.length).toBeLessThanOrEqual(20)
    })

    it('converts uppercase letters in company name to lowercase', () => {
      const url = SeedHelpers.generateWebsiteUrl('UPPERCASE')
      expect(url).toContain('uppercase')
      expect(url).not.toMatch(/[A-Z]/)
    })

    it('uses one of the valid TLDs', () => {
      const validTlds = ['com', 'io', 'co', 'tech', 'ai', 'net']
      const url = SeedHelpers.generateWebsiteUrl('Test Company')
      const tld = url.split('.').pop()
      expect(validTlds).toContain(tld)
    })

    it('URL does not contain spaces', () => {
      const url = SeedHelpers.generateWebsiteUrl('Company With Spaces')
      expect(url).not.toContain(' ')
    })

    it('handles a company name that is already lowercase and alphanumeric', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0) // tld index 0 = 'com'
      const url = SeedHelpers.generateWebsiteUrl('acme')
      expect(url).toBe('https://www.acme.com')
    })
  })

  describe('generatePhoneNumber', () => {
    it('returns US format (+1-xxx-xxx-xxxx) for country US', () => {
      const phone = SeedHelpers.generatePhoneNumber('US')
      expect(phone).toMatch(/^\+1-[2-9]\d{2}-[2-9]\d{2}-\d{4}$/)
    })

    it('returns same format as US for country CA', () => {
      const phone = SeedHelpers.generatePhoneNumber('CA')
      expect(phone).toMatch(/^\+1-[2-9]\d{2}-[2-9]\d{2}-\d{4}$/)
    })

    it('returns GB format (+44-20-xxxx-xxxx) for country GB', () => {
      const phone = SeedHelpers.generatePhoneNumber('GB')
      expect(phone).toMatch(/^\+44-20-\d{4}-\d{4}$/)
    })

    it('returns DE format (+49-30-xxxx-xxxx) for country DE', () => {
      const phone = SeedHelpers.generatePhoneNumber('DE')
      expect(phone).toMatch(/^\+49-30-\d{4}-\d{4}$/)
    })

    it('returns AU format (+61-2-xxxx-xxxx) for country AU', () => {
      const phone = SeedHelpers.generatePhoneNumber('AU')
      expect(phone).toMatch(/^\+61-2-\d{4}-\d{4}$/)
    })

    it('returns generic international format for other countries', () => {
      const phone = SeedHelpers.generatePhoneNumber('FR')
      expect(phone).toMatch(/^\+\d{1,3}-\d{3}-\d{3}-\d{4}$/)
    })

    it('returns generic international format for unknown country codes', () => {
      const phone = SeedHelpers.generatePhoneNumber('JP')
      expect(phone).toMatch(/^\+\d{1,3}-\d{3}-\d{3}-\d{4}$/)
    })

    it('does not return US format for non-US/CA countries', () => {
      const phone = SeedHelpers.generatePhoneNumber('GB')
      expect(phone).not.toMatch(/^\+1-/)
    })

    it('does not return GB format for non-GB countries', () => {
      const phone = SeedHelpers.generatePhoneNumber('DE')
      expect(phone).not.toMatch(/^\+44-20-/)
    })
  })

  describe('generateEmail', () => {
    it('generates email in format firstname.lastname@domain', () => {
      const email = SeedHelpers.generateEmail('John', 'Doe', 'https://www.example.com')
      expect(email).toBe('john.doe@example.com')
    })

    it('converts first name to lowercase', () => {
      const email = SeedHelpers.generateEmail('JOHN', 'Doe', 'https://www.example.com')
      expect(email).toBe('john.doe@example.com')
    })

    it('converts last name to lowercase', () => {
      const email = SeedHelpers.generateEmail('John', 'DOE', 'https://www.example.com')
      expect(email).toBe('john.doe@example.com')
    })

    it('strips https://www. prefix from the company domain', () => {
      const email = SeedHelpers.generateEmail('Jane', 'Smith', 'https://www.company.com')
      expect(email).toBe('jane.smith@company.com')
    })

    it('strips http:// prefix from the company domain', () => {
      const email = SeedHelpers.generateEmail('Bob', 'Johnson', 'http://testsite.net')
      expect(email).toBe('bob.johnson@testsite.net')
    })

    it('combines first and last name with a dot separator', () => {
      const email = SeedHelpers.generateEmail('Alice', 'Wonder', 'https://www.land.io')
      expect(email).toContain('alice.wonder@')
    })

    it('does not include the protocol in the resulting email', () => {
      const email = SeedHelpers.generateEmail('Test', 'User', 'https://www.site.com')
      expect(email).not.toContain('https://')
      expect(email).not.toContain('http://')
      expect(email).not.toContain('www.')
    })
  })
})
