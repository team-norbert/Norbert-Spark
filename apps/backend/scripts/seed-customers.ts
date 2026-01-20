#!/usr/bin/env tsx
/**
 * Seed script to populate the customers and people tables with fictitious data
 *
 * Usage:
 *   pnpm seed:customers [count]
 *   pnpm seed:customers 50
 *
 * Or set via environment variable:
 *   SEED_CUSTOMER_COUNT=50 pnpm seed:customers
 *
 * Default count: 20
 * This will create companies with 1 key person (primary contact) each
 */

import { db } from '../src/infrastructure/database/index.js'
import { customers, people, customerPeople } from '../src/infrastructure/database/schema.js'
import { SeedHelpers } from '../src/shared/utils/seed-helpers.util.js'

// Get the number of customers to create
const getCustomerCount = (): number => {
  const cliArg = process.argv[2]
  if (cliArg) {
    const count = parseInt(cliArg, 10)
    if (isNaN(count) || count < 1) {
      console.error('❌ Error: Customer count must be a number >= 1')
      process.exit(1)
    }
    return count
  }

  const envCount = process.env.SEED_CUSTOMER_COUNT
  if (envCount) {
    const count = parseInt(envCount, 10)
    if (isNaN(count) || count < 1) {
      console.error('❌ Error: SEED_CUSTOMER_COUNT must be a number >= 1')
      process.exit(1)
    }
    return count
  }

  return 20
}

const TOTAL_CUSTOMERS = getCustomerCount()

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

// Contact roles
const contactRoles = [
  'primary_contact',
  'decision_maker',
  'billing_contact',
  'technical_contact',
  'stakeholder',
] as const

async function seedCustomers() {
  console.log('🌱 Starting customer and people seed script...')
  console.log(`📊 Will create ${TOTAL_CUSTOMERS} customers with associated contacts\n`)

  try {
    // Check if data already exists
    const existingCustomers = await db.select().from(customers)
    if (existingCustomers.length > 0) {
      console.log(`⚠️  Found ${existingCustomers.length} existing customers`)
      console.log('🗑️  Clearing existing data...')
      await db.delete(people)
      await db.delete(customers)
      console.log('✅ Existing data cleared\n')
    }

    const startTime = Date.now()
    const customersToInsert = []
    const allPeople = []
    const allRelationships = []

    console.log('📝 Generating customer data...')

    for (let i = 0; i < TOTAL_CUSTOMERS; i++) {
      const { legal, display } = SeedHelpers.generateCompanyName()
      const industry = SeedHelpers.randomElement(industries)
      const country = SeedHelpers.randomElement(countries)
      const websiteUrl = SeedHelpers.generateWebsiteUrl(display)
      const companySize = SeedHelpers.randomInt(10, 10000)
      const status = SeedHelpers.randomElement(statuses)
      const timezone = SeedHelpers.randomElement(timezones)

      const customer = {
        legalName: legal,
        displayName: display,
        industry,
        companySize,
        websiteUrl,
        billingCountry: country,
        timezone,
        status,
      }

      customersToInsert.push(customer)
    }

    console.log(`✅ Generated ${customersToInsert.length} customers`)
    console.log('💾 Inserting customers into database...')

    const insertedCustomers = await db.insert(customers).values(customersToInsert).returning()

    console.log(`✅ Inserted ${insertedCustomers.length} customers`)
    console.log('📝 Generating people and relationships...')

    // Create exactly 1 person per customer
    for (const customer of insertedCustomers) {
      const customerDomain = customer.websiteUrl

      const firstName = SeedHelpers.randomElement(firstNames)
      const lastName = SeedHelpers.randomElement(lastNames)
      const email = SeedHelpers.generateEmail(firstName, lastName, customerDomain)
      const phone = SeedHelpers.generatePhoneNumber(customer.billingCountry)
      const jobTitle = SeedHelpers.randomElement(jobTitles)
      const isActive = SeedHelpers.randomBoolean(0.95)

      const person = {
        firstName,
        lastName,
        email,
        phone,
        jobTitle,
        isActive,
      }

      allPeople.push({ ...person, customerId: customer.customerId })
    }

    console.log(`✅ Generated ${allPeople.length} people`)
    console.log('💾 Inserting people into database...')

    // Insert all people
    const peopleToInsert = allPeople.map((p) => ({
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      jobTitle: p.jobTitle,
      isActive: p.isActive,
    }))

    const insertedPeople = await db.insert(people).values(peopleToInsert).returning()

    console.log(`✅ Inserted ${insertedPeople.length} people`)
    console.log('📝 Creating customer-people relationships...')

    // Create relationships - one person per customer as primary contact
    for (let i = 0; i < insertedCustomers.length; i++) {
      const customer = insertedCustomers[i]
      const person = insertedPeople[i]

      allRelationships.push({
        customerId: customer.customerId,
        personId: person.personId,
        role: 'primary_contact',
        isPrimary: true,
      })
    }

    console.log(`✅ Generated ${allRelationships.length} relationships`)
    console.log('💾 Inserting relationships into database...')

    await db.insert(customerPeople).values(allRelationships)

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    console.log(`✅ Inserted ${allRelationships.length} customer-people relationships`)
    console.log(`\n✨ Seed completed successfully in ${duration}s`)
    console.log('\n📊 Summary:')
    console.log(`   • Customers: ${insertedCustomers.length}`)
    console.log(`   • People: ${insertedPeople.length}`)
    console.log(`   • Relationships: ${allRelationships.length}`)

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error seeding customers and people:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  }
}

// Run the seed script
seedCustomers()
