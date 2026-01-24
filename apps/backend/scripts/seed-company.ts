#!/usr/bin/env tsx
/**
 * Seed script to populate the company and key_person tables with fictitious data
 *
 * Usage:
 *   pnpm seed:company [relationship_count]
 *   pnpm seed:company 50
 *
 * Or set via environment variable:
 *   SEED_RELATIONSHIP_COUNT=50 pnpm seed:company
 *
 * Default count: 1
 * This will create ONE company, ONE key person, and multiple company_people relationships
 */

import { db } from '../src/infrastructure/database/index.js'
import { company, keyPerson, companyPeople } from '../src/infrastructure/database/schema.js'
import { SeedHelpers } from '../src/shared/utils/seed-helpers.util.js'

// Get the number of relationships to create
const getRelationshipCount = (): number => {
  const cliArg = process.argv[2]
  if (cliArg) {
    const count = parseInt(cliArg, 10)
    if (isNaN(count) || count < 1) {
      console.error('❌ Error: Relationship count must be a number >= 1')
      process.exit(1)
    }
    return count
  }

  const envCount = process.env.SEED_RELATIONSHIP_COUNT
  if (envCount) {
    const count = parseInt(envCount, 10)
    if (isNaN(count) || count < 1) {
      console.error('❌ Error: SEED_RELATIONSHIP_COUNT must be a number >= 1')
      process.exit(1)
    }
    return count
  }

  return 1
}

const TOTAL_RELATIONSHIPS = getRelationshipCount()

// Industries
const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Telecommunications',
  'Energy',
  'Transportation',
  'Real Estate',
  'Media & Entertainment',
  'Hospitality',
  'Agriculture',
  'Aerospace',
  'Automotive',
  'Biotechnology',
  'Consulting',
  'E-commerce',
  'Insurance',
  'Logistics',
]

// Countries (ISO 3166-1 alpha-2)
const countries = [
  'US',
  'GB',
  'CA',
  'AU',
  'DE',
  'FR',
  'JP',
  'CN',
  'IN',
  'BR',
  'MX',
  'NL',
  'ES',
  'IT',
  'SE',
  'CH',
  'SG',
  'KR',
  'IL',
  'IE',
]

// Timezones
const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Australia/Sydney',
  'America/Toronto',
  'America/Mexico_City',
  'Europe/Amsterdam',
  'Europe/Stockholm',
  'Asia/Seoul',
  'Asia/Dubai',
  'Pacific/Auckland',
]

// Customer statuses
const statuses = ['prospect', 'active', 'paused', 'churned'] as const

// Person names
const firstNames = [
  'James',
  'Mary',
  'John',
  'Patricia',
  'Robert',
  'Jennifer',
  'Michael',
  'Linda',
  'William',
  'Barbara',
  'David',
  'Elizabeth',
  'Richard',
  'Susan',
  'Joseph',
  'Jessica',
  'Thomas',
  'Sarah',
  'Charles',
  'Karen',
  'Christopher',
  'Nancy',
  'Daniel',
  'Lisa',
  'Matthew',
  'Margaret',
  'Anthony',
  'Sandra',
  'Mark',
  'Ashley',
  'Donald',
  'Emily',
  'Steven',
  'Kimberly',
  'Paul',
  'Michelle',
  'Andrew',
  'Carol',
  'Joshua',
  'Amanda',
]

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Perez',
  'Thompson',
  'White',
  'Harris',
  'Sanchez',
  'Clark',
  'Ramirez',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
  'Allen',
  'King',
  'Wright',
  'Scott',
  'Torres',
  'Nguyen',
  'Hill',
  'Flores',
]

// Job titles
const jobTitles = [
  'CEO',
  'CTO',
  'CFO',
  'COO',
  'VP of Engineering',
  'VP of Sales',
  'VP of Marketing',
  'Director of Operations',
  'Director of Product',
  'Head of IT',
  'Head of Business Development',
  'General Manager',
  'Senior Vice President',
  'Managing Director',
  'Chief Architect',
  'Chief Data Officer',
  'Chief Security Officer',
  'President',
  'Founder',
  'Co-Founder',
]

async function seedCompany() {
  console.log('🌱 Starting company and key person seed script...')
  console.log(
    `📊 Will create 1 company, 1 key person, and ${TOTAL_RELATIONSHIPS} relationship(s)\n`
  )

  try {
    // Check if data already exists
    const existingCompany = await db.select().from(company)
    if (existingCompany.length > 0) {
      console.log(`⚠️  Found ${existingCompany.length} existing company records`)
      console.log('🗑️  Clearing existing data...')
      await db.delete(keyPerson)
      await db.delete(company)
      console.log('✅ Existing data cleared\n')
    }

    const startTime = Date.now()

    console.log('📝 Generating company data...')

    const { legal, display } = SeedHelpers.generateCompanyName()
    const industry = SeedHelpers.randomElement(industries)
    const country = SeedHelpers.randomElement(countries)
    const websiteUrl = SeedHelpers.generateWebsiteUrl(display)
    const companySize = SeedHelpers.randomInt(10, 10000)
    const status = SeedHelpers.randomElement([...statuses] as (
      | 'prospect'
      | 'active'
      | 'paused'
      | 'churned'
    )[])
    const timezone = SeedHelpers.randomElement(timezones)

    const companyData = {
      legalName: legal,
      displayName: display,
      industry,
      companySize,
      websiteUrl,
      billingCountry: country,
      timezone,
      status,
    }

    console.log('✅ Generated company data')
    console.log('💾 Inserting company into database...')

    const [insertedCompany] = await db.insert(company).values(companyData).returning()

    if (!insertedCompany) {
      throw new Error('Failed to insert company')
    }

    console.log(`✅ Inserted company: ${insertedCompany.displayName}`)
    console.log('📝 Generating key person data...')

    const firstName = SeedHelpers.randomElement(firstNames)
    const lastName = SeedHelpers.randomElement(lastNames)
    const email = SeedHelpers.generateEmail(firstName, lastName, websiteUrl)
    const phone = SeedHelpers.generatePhoneNumber(country)
    const jobTitle = SeedHelpers.randomElement(jobTitles)
    const isActive = SeedHelpers.randomBoolean(0.95)

    const personData = {
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      isActive,
    }

    console.log('✅ Generated key person data')
    console.log('💾 Inserting key person into database...')

    const [insertedPerson] = await db.insert(keyPerson).values(personData).returning()

    if (!insertedPerson) {
      throw new Error('Failed to insert key person')
    }

    console.log(`✅ Inserted key person: ${insertedPerson.firstName} ${insertedPerson.lastName}`)
    console.log('📝 Creating company-people relationships...')

    const allRelationships = []

    // Create the specified number of relationships
    for (let i = 0; i < TOTAL_RELATIONSHIPS; i++) {
      const roles = [
        'primary_contact',
        'decision_maker',
        'billing_contact',
        'technical_contact',
        'stakeholder',
      ] as const
      const role = roles[i % roles.length]

      allRelationships.push({
        companyId: insertedCompany.customerId,
        personId: insertedPerson.keyPersonId,
        role: role,
        isPrimary: i === 0, // First relationship is primary
      })
    }

    console.log(`✅ Generated ${allRelationships.length} relationship(s)`)
    console.log('💾 Inserting relationships into database...')

    await db.insert(companyPeople).values(allRelationships)

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    console.log(`✅ Inserted ${allRelationships.length} company-people relationship(s)`)
    console.log(`\n✨ Seed completed successfully in ${duration}s`)
    console.log('\n📊 Summary:')
    console.log(`   • Company: 1 (${insertedCompany.displayName})`)
    console.log(`   • Key Person: 1 (${insertedPerson.firstName} ${insertedPerson.lastName})`)
    console.log(`   • Relationships: ${allRelationships.length}`)

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error seeding company and key person:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  }
}

// Run the seed script
seedCompany()
