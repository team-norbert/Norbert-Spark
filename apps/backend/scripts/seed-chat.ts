#!/usr/bin/env tsx
/**
 * Seed script to populate the chat_types table with initial data
 *
 * Usage:
 *   pnpm seed:chats
 *
 * This will create predefined chat types with:
 * - Auto-generated UUIDv7 IDs
 * - SEO-friendly slugs generated from names
 * - Base64-encoded UUIDs for compact URLs
 * - Descriptions and timestamps
 */

import { db } from '../src/infrastructure/database/index.js'
import { chatAiOptions, chatTypes } from '../src/infrastructure/database/schema.js'
import { SEO } from '../src/shared/utils/SEO.util.js'
import { Uuid7Util } from '../src/shared/utils/uuid7.util.js'

// Predefined chat types to seed
const chatTypesData = [
  {
    name: 'The Heart of Darkness',
    description:
      'Ask questions about the novella "The Heart of Darkness" by Joseph Conrad. Get insights into its themes, characters, and plot.',
    prompt:
      'You are a knowledgeable literary assistant specializing in Joseph Conrad\'s "Heart of Darkness". Help users understand the themes, characters, plot, and historical context of this novella. Provide insightful analysis while being clear and accessible.',
  },
]

async function seedChats() {
  try {
    console.log('🌱 Starting chat types seeding...\n')

    // Check if chat types already exist
    const existingChatTypes = await db.select().from(chatTypes)
    const existingAiOptions = await db.select().from(chatAiOptions)

    if (existingChatTypes.length > 0 || existingAiOptions.length > 0) {
      console.log(
        `⚠️  Warning: Found ${existingChatTypes.length} existing chat types and ${existingAiOptions.length} AI options.`
      )
      console.log('   Skipping seed to avoid duplicates.')
      console.log('   Run "pnpm db:reset" first if you want to reseed.\n')
      return
    }

    console.log(`📝 Preparing ${chatTypesData.length} chat types...`)

    const chatTypesToInsert = chatTypesData.map((chatType) => {
      const id = Uuid7Util.createUuidv7()
      const seoFriendlyId = SEO.generateSeoFriendlyTitle(chatType.name)
      const seoFriendlyBase64Id = Uuid7Util.toBase64(id)

      if (!seoFriendlyBase64Id) {
        throw new Error(`Failed to generate base64 ID for UUID: ${id}`)
      }

      console.log(`   📌 ${chatType.name}`)
      console.log(`      ID: ${id}`)
      console.log(`      SEO ID: ${seoFriendlyId}`)
      console.log(`      Base64 ID: ${seoFriendlyBase64Id}`)

      return {
        id,
        name: chatType.name,
        seoFriendlyId,
        seoFriendlyBase64Id,
        description: chatType.description,
      }
    })

    console.log('\n💾 Inserting chat types into database...')
    const insertedChatTypes = await db.insert(chatTypes).values(chatTypesToInsert).returning()

    console.log(`\n✅ Successfully created ${insertedChatTypes.length} chat types!`)

    // Create AI options for each chat type
    console.log('\n💾 Inserting AI options for chat types...')
    const aiOptionsToInsert = insertedChatTypes.map((chatType, index) => ({
      chatTypeId: chatType.id,
      prompt: chatTypesData[index].prompt,
      // Optional fields can be left null
      maxTokens: null,
      temperature: null,
      topP: null,
      frequencyPenalty: null,
      presencePenalty: null,
    }))

    const insertedAiOptions = await db.insert(chatAiOptions).values(aiOptionsToInsert).returning()

    console.log(`\n✅ Successfully created ${insertedAiOptions.length} AI options!`)

    console.log('\n📋 Summary:')
    insertedChatTypes.forEach((ct, index) => {
      console.log(`   ${index + 1}. ${ct.name}`)
      console.log(`      → ${ct.seoFriendlyId}`)
      console.log(`      → AI Options: prompt configured`)
    })

    console.log('\n💡 Usage:')
    console.log('   Access chat types via:')
    console.log('   - By ID: /api/chats/{id}')
    console.log('   - By SEO slug: /chats/{seo-friendly-id}')
    console.log('   - By Base64 ID: /c/{seo-friendly-base64-id}')
  } catch (error) {
    console.error('\n❌ Error seeding chat types:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  } finally {
    // Close the database connection pool
    const { pool } = await import('../src/infrastructure/database/index.js')
    await pool.end()
    console.log('\n🔌 Database connection closed')
  }
}

// Run the seed script
seedChats()
