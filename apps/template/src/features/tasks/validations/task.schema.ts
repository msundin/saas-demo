import { z } from 'zod'

/**
 * Schema for creating a new task
 */
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
})

/**
 * Schema for updating a task
 */
export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  completed: z.boolean().optional(),
})

/**
 * Schema for toggling task completion
 */
export const toggleTaskSchema = z.object({
  id: z.string().uuid('Invalid task ID'),
  completed: z.boolean(),
})

// Export types
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type ToggleTaskInput = z.infer<typeof toggleTaskSchema>
