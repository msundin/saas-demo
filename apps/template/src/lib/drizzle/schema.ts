import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/**
 * Example schema for demonstration
 *
 * This shows how to define tables with Drizzle ORM.
 * When you build features, create tables here and run:
 * - `pnpm db:generate` to create migration files
 * - `pnpm db:migrate` to apply migrations to database
 */

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  userId: uuid('user_id').notNull(), // References auth.users from Supabase Auth
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Export types for use in your app
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
