/**
 * Utility functions for generating seed data for customers, people, and related entities.
 * These functions are used by seed scripts and their associated tests.
 *
 * @example
 * ```typescript
 * // Generate a random integer
 * const age = SeedHelpers.randomInt(18, 65)
 *
 * // Get a random element from an array
 * const country = SeedHelpers.randomElement(['US', 'GB', 'CA'])
 *
 * // Generate a company name
 * const company = SeedHelpers.generateCompanyName()
 *
 * // Generate a phone number
 * const phone = SeedHelpers.generatePhoneNumber('US')
 * ```
 */
export class SeedHelpers {
  // Company name parts
  static readonly companyPrefixes = [
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

  static readonly companyRoots = [
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

  static readonly companySuffixes = [
    'Inc',
    'LLC',
    'Corp',
    'Ltd',
    'Group',
    'Partners',
    'Technologies',
    'Co',
  ]

  /**
   * Generates a random integer between min and max (inclusive).
   *
   * @param min - The minimum value (inclusive)
   * @param max - The maximum value (inclusive)
   * @returns A random integer between min and max
   *
   * @example
   * ```typescript
   * SeedHelpers.randomInt(1, 10) // 7
   * SeedHelpers.randomInt(100, 200) // 142
   * ```
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * Returns a random element from the provided array.
   *
   * @param array - The array to pick from
   * @returns A random element from the array
   *
   * @example
   * ```typescript
   * SeedHelpers.randomElement(['a', 'b', 'c']) // 'b'
   * SeedHelpers.randomElement([1, 2, 3, 4, 5]) // 3
   * ```
   */
  static randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]!
  }

  /**
   * Returns a random boolean value based on the provided probability.
   *
   * @param probability - The probability of returning true (0.0 to 1.0, default: 0.5)
   * @returns True or false based on probability
   *
   * @example
   * ```typescript
   * SeedHelpers.randomBoolean() // true or false (50% chance)
   * SeedHelpers.randomBoolean(0.7) // true or false (70% chance of true)
   * SeedHelpers.randomBoolean(0.1) // true or false (10% chance of true)
   * ```
   */
  static randomBoolean(probability = 0.5): boolean {
    return Math.random() < probability
  }

  /**
   * Generates a company name with both legal and display variants.
   *
   * The legal name includes a suffix with a period (e.g., "TechSoft Inc."),
   * while the display name may omit the suffix based on random chance.
   *
   * @returns An object containing legal and display name variants
   *
   * @example
   * ```typescript
   * SeedHelpers.generateCompanyName()
   * // { legal: 'AlphaSystems Inc.', display: 'AlphaSystems' }
   * ```
   */
  static generateCompanyName(): { legal: string; display: string } {
    const prefix = this.randomElement(this.companyPrefixes)
    const root = this.randomElement(this.companyRoots)
    const suffix = this.randomElement(this.companySuffixes)

    const legalName = `${prefix}${root} ${suffix}.`
    const displayName = this.randomBoolean(0.7) ? `${prefix}${root}` : legalName.replace('.', '')

    return { legal: legalName, display: displayName }
  }

  /**
   * Generates a website URL based on the company name.
   *
   * Converts the company name to lowercase, removes non-alphanumeric characters,
   * truncates to 20 characters, and adds a random TLD.
   *
   * @param companyName - The company name to convert to a URL
   * @returns A formatted website URL
   *
   * @example
   * ```typescript
   * SeedHelpers.generateWebsiteUrl('Tech Solutions')
   * // 'https://www.techsolutions.com'
   * ```
   */
  static generateWebsiteUrl(companyName: string): string {
    const domain = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20)
    const tld = this.randomElement(['com', 'io', 'co', 'tech', 'ai', 'net'])
    return `https://www.${domain}.${tld}`
  }

  /**
   * Generates a phone number formatted for the specified country.
   *
   * Supports specific formats for US, CA, GB, DE, and AU.
   * Falls back to a generic international format for other countries.
   *
   * @param country - ISO 3166-1 alpha-2 country code
   * @returns A formatted phone number string
   *
   * @example
   * ```typescript
   * SeedHelpers.generatePhoneNumber('US') // '+1-555-123-4567'
   * SeedHelpers.generatePhoneNumber('GB') // '+44-20-1234-5678'
   * SeedHelpers.generatePhoneNumber('FR') // '+33-123-456-7890'
   * ```
   */
  static generatePhoneNumber(country: string): string {
    if (country === 'US' || country === 'CA') {
      return `+1-${this.randomInt(200, 999)}-${this.randomInt(200, 999)}-${this.randomInt(1000, 9999)}`
    } else if (country === 'GB') {
      return `+44-20-${this.randomInt(1000, 9999)}-${this.randomInt(1000, 9999)}`
    } else if (country === 'DE') {
      return `+49-30-${this.randomInt(1000, 9999)}-${this.randomInt(1000, 9999)}`
    } else if (country === 'AU') {
      return `+61-2-${this.randomInt(1000, 9999)}-${this.randomInt(1000, 9999)}`
    } else {
      return `+${this.randomInt(1, 999)}-${this.randomInt(100, 999)}-${this.randomInt(100, 999)}-${this.randomInt(1000, 9999)}`
    }
  }

  /**
   * Generates an email address from the person's name and company domain.
   *
   * Converts both first and last names to lowercase and formats as
   * firstname.lastname@domain.
   *
   * @param firstName - The person's first name
   * @param lastName - The person's last name
   * @param companyDomain - The company's website URL (protocol will be stripped)
   * @returns A formatted email address
   *
   * @example
   * ```typescript
   * SeedHelpers.generateEmail('John', 'Doe', 'https://www.example.com')
   * // 'john.doe@example.com'
   * ```
   */
  static generateEmail(firstName: string, lastName: string, companyDomain: string): string {
    const domain = companyDomain.replace('https://www.', '').replace('http://', '')
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`
  }
}
