import { createClient } from '@/lib/supabase/server'
import {
  createTaskSchema,
  type CreateTaskInput,
} from '../validations/task.schema'
import type { Task } from '@/lib/drizzle/schema'

/**
 * Task service using Supabase client (respects RLS automatically)
 */
export class TaskService {
  /**
   * Create a new task
   */
  async create(userId: string, input: CreateTaskInput): Promise<Task> {
    // Validate input
    const validatedData = createTaskSchema.parse(input)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: validatedData.title,
        description: validatedData.description || null,
        completed: false,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }

    return data as Task
  }

  /**
   * Get all tasks for a user (RLS automatically filters)
   */
  async getAll(userId: string): Promise<Task[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    return (data as Task[]) || []
  }

  /**
   * Toggle task completion status
   */
  async toggle(taskId: string, userId: string): Promise<Task> {
    const supabase = await createClient()

    // First, get the current task
    const { data: currentTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !currentTask) {
      throw new Error('Task not found')
    }

    // Toggle the completion status
    const { data, error } = await supabase
      .from('tasks')
      .update({
        completed: !currentTask.completed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to toggle task: ${error.message}`)
    }

    return data as Task
  }

  /**
   * Delete a task
   */
  async delete(taskId: string, userId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`)
    }
  }
}

// Export singleton instance
export const taskService = new TaskService()
