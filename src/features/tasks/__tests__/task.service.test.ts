import { describe, it, expect, vi, beforeEach } from 'vitest'
import { taskService } from '../services/task.service'
import type { CreateTaskInput } from '../validations/task.schema'

// Mock the Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

describe('TaskService', () => {
  const mockUserId = 'test-user-id'
  const validTaskData: CreateTaskInput = {
    title: 'Test Task',
    description: 'Test Description',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a task with valid data', async () => {
      const mockTask = {
        id: 'task-123',
        title: validTaskData.title,
        description: validTaskData.description,
        completed: false,
        userId: mockUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
          }),
        }),
      })

      const task = await taskService.create(mockUserId, validTaskData)

      expect(task).toBeDefined()
      expect(task.title).toBe(validTaskData.title)
      expect(task.description).toBe(validTaskData.description)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks')
    })

    it('should create a task without description', async () => {
      const mockTask = {
        id: 'task-124',
        title: 'Task without description',
        description: null,
        completed: false,
        userId: mockUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTask, error: null }),
          }),
        }),
      })

      const task = await taskService.create(mockUserId, {
        title: 'Task without description',
      })

      expect(task.title).toBe('Task without description')
      expect(task.description).toBeNull()
    })

    it('should throw error for empty title', async () => {
      await expect(
        taskService.create(mockUserId, { title: '' })
      ).rejects.toThrow('Title is required')
    })
  })

  describe('getAll', () => {
    it('should return all tasks for a user', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', userId: mockUserId },
        { id: '2', title: 'Task 2', userId: mockUserId },
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
          }),
        }),
      })

      const tasks = await taskService.getAll(mockUserId)

      expect(tasks.length).toBe(2)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks')
    })

    it('should return empty array for user with no tasks', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      const tasks = await taskService.getAll('user-with-no-tasks')
      expect(tasks).toEqual([])
    })
  })

  describe('toggle', () => {
    it('should toggle task completion status', async () => {
      const mockTask = {
        id: 'task-123',
        completed: false,
        userId: mockUserId,
      }

      const mockToggledTask = {
        ...mockTask,
        completed: true,
      }

      // First call: get current task
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: mockTask, error: null }),
            }),
          }),
        }),
      })

      // Second call: update task
      mockSupabaseClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockResolvedValue({ data: mockToggledTask, error: null }),
              }),
            }),
          }),
        }),
      })

      const result = await taskService.toggle('task-123', mockUserId)
      expect(result.completed).toBe(true)
    })

    it('should throw error for non-existent task', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
            }),
          }),
        }),
      })

      await expect(
        taskService.toggle('non-existent-id', mockUserId)
      ).rejects.toThrow('Task not found')
    })
  })

  describe('delete', () => {
    it('should delete a task', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      })

      await taskService.delete('task-123', mockUserId)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks')
    })

    it('should throw error when deleting fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi
              .fn()
              .mockResolvedValue({ error: { message: 'Delete failed' } }),
          }),
        }),
      })

      await expect(taskService.delete('task-123', mockUserId)).rejects.toThrow(
        'Failed to delete task'
      )
    })
  })
})
