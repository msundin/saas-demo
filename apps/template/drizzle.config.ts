import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // PgBouncer/Supavisor compatibility
  // Set to false to avoid prepared statements that don't work with connection poolers
  casing: 'snake_case',
})
