'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/helpers'
import { taskService } from '../services/task.service'
import {
  createTaskSchema,
  type CreateTaskInput,
} from '../validations/task.schema'
import type { Task } from '@/lib/drizzle/schema'

/**
 * Server Action response type
 */
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Create a new task
 */
export async function createTask(
  input: CreateTaskInput
): Promise<ActionResponse<Task>> {
  try {
    // 1. Check authentication
    const user = await requireAuth()

    // 2. Validate input
    const validatedData = createTaskSchema.parse(input)

    // 3. Create task via service
    const task = await taskService.create(user.id, validatedData)

    // 4. Revalidate cache
    revalidatePath('/dashboard')

    return { success: true, data: task }
  } catch (error) {
    console.error('Create task error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task',
    }
  }
}

/**
 * Toggle task completion status
 */
export async function toggleTask(
  taskId: string
): Promise<ActionResponse<Task>> {
  try {
    // 1. Check authentication
    const user = await requireAuth()

    // 2. Toggle task
    const task = await taskService.toggle(taskId, user.id)

    // 3. Revalidate cache
    revalidatePath('/dashboard')

    return { success: true, data: task }
  } catch (error) {
    console.error('Toggle task error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle task',
    }
  }
}

/**
 * Delete a task
 */
export async function deleteTask(
  taskId: string
): Promise<ActionResponse<void>> {
  try {
    // 1. Check authentication
    const user = await requireAuth()

    // 2. Delete task
    await taskService.delete(taskId, user.id)

    // 3. Revalidate cache
    revalidatePath('/dashboard')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete task error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete task',
    }
  }
}
