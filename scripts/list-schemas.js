#!/usr/bin/env node

/**
 * Helper Script: List All Schemas
 *
 * Lists all PostgreSQL schemas in the database (excluding system schemas).
 * Useful for verifying which schemas exist before operations.
 *
 * Usage:
 *   pnpm db:list-schemas
 */

const { exec } = require('child_process')
const { promisify } = require('util')

const execPromise = promisify(exec)

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.error(`
❌ ERROR: DATABASE_URL environment variable required!

Make sure your .env.local file contains:
  DATABASE_URL=postgresql://...
  `)
  process.exit(1)
}

async function listSchemas() {
  try {
    const { stdout } = await execPromise(
      `psql "${dbUrl}" -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema' ORDER BY schema_name;"`
    )

    const schemas = stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (schemas.length === 0) {
      console.log('\nNo custom schemas found in database.\n')
      return
    }

    console.log('\nSchemas in database:')
    schemas.forEach(schema => {
      console.log(`- ${schema}`)
    })
    console.log('')
  } catch (error) {
    console.error('\n❌ Error listing schemas:', error.message)
    console.error('\nMake sure:')
    console.error('- DATABASE_URL is correct')
    console.error('- You have permission to query schemas')
    console.error('- psql command is available\n')
    process.exit(1)
  }
}

listSchemas()
