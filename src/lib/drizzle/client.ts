import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Disable prefetch as it is not supported for "Transaction" pool mode
// This is required for PgBouncer/Supavisor compatibility
const client = postgres(process.env.DATABASE_URL!, {
  prepare: false, // Required for PgBouncer/Supavisor compatibility
})

export const db = drizzle(client, { schema })
