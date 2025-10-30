#!/usr/bin/env node

/**
 * Safety Script: Safe Schema Reset
 *
 * Resets a specific PostgreSQL schema (drops and recreates it).
 * Requires confirmation by typing the exact schema name.
 *
 * Usage:
 *   DB_SCHEMA=demo_infswsol_com pnpm db:reset-schema
 *
 * This is MUCH safer than raw SQL commands because:
 * 1. Requires DB_SCHEMA to be set (targets specific schema)
 * 2. Requires confirmation (must type schema name)
 * 3. Shows clear warnings before destructive action
 */

const { exec } = require('child_process')
const { promisify } = require('util')
const readline = require('readline')

const execPromise = promisify(exec)

const schema = process.env.DB_SCHEMA
const dbUrl = process.env.DATABASE_URL

if (!schema) {
  console.error(`
❌ ERROR: DB_SCHEMA environment variable required!

Usage:
  DB_SCHEMA=demo_infswsol_com pnpm db:reset-schema
  DB_SCHEMA=template_infswsol_com pnpm db:reset-schema

⚠️  This prevents accidentally resetting ALL schemas.
  `)
  process.exit(1)
}

if (!dbUrl) {
  console.error(`
❌ ERROR: DATABASE_URL environment variable required!

Make sure your .env.local file contains:
  DATABASE_URL=postgresql://...
  `)
  process.exit(1)
}

console.log(`
⚠️  WARNING: This will DELETE ALL DATA in schema: ${schema}
⚠️  This action cannot be undone!

Schema: ${schema}
Database: ${dbUrl.replace(/:[^:@]+@/, ':***@')}

Tables and data in this schema will be permanently deleted.
Other schemas will NOT be affected.
`)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question(`Type the schema name "${schema}" to confirm: `, async (answer) => {
  if (answer.trim() !== schema) {
    console.log('\n❌ Schema name mismatch. Operation aborted.\n')
    rl.close()
    process.exit(1)
  }

  console.log('\n🗑️  Dropping schema...')

  try {
    // Drop schema (CASCADE removes all objects in it)
    await execPromise(`psql "${dbUrl}" -c "DROP SCHEMA IF EXISTS ${schema} CASCADE;"`)
    console.log('✅ Schema dropped')

    // Recreate empty schema
    await execPromise(`psql "${dbUrl}" -c "CREATE SCHEMA ${schema};"`)
    console.log('✅ Schema recreated')

    console.log(`
✅ Schema reset complete!

Next steps:
1. Run migrations to recreate tables:
   DB_SCHEMA=${schema} pnpm db:push

2. Verify tables created:
   DB_SCHEMA=${schema} pnpm db:studio
`)
  } catch (error) {
    console.error('\n❌ Error resetting schema:', error.message)
    console.error('\nMake sure:')
    console.error('- DATABASE_URL is correct')
    console.error('- You have permission to drop/create schemas')
    console.error('- psql command is available')
    process.exit(1)
  } finally {
    rl.close()
  }
})
