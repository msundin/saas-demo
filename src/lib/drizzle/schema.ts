import {
  pgTable,
  pgPolicy,
  uuid,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const tasks = pgTable(
  'tasks',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text().notNull(),
    description: text(),
    completed: boolean().default(false).notNull(),
    userId: uuid('user_id').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (_table) => [
    pgPolicy('Users can delete their own tasks', {
      as: 'permissive',
      for: 'delete',
      to: ['public'],
      using: sql`(auth.uid() = user_id)`,
    }),
    pgPolicy('Users can update their own tasks', {
      as: 'permissive',
      for: 'update',
      to: ['public'],
    }),
    pgPolicy('Users can create their own tasks', {
      as: 'permissive',
      for: 'insert',
      to: ['public'],
    }),
    pgPolicy('Users can view their own tasks', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
    }),
  ]
)

// Export TypeScript types for use in application code
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
