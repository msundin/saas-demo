import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTask, toggleTask, deleteTask } from '../actions/task-actions'

// Mock the Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

// Mock the auth helper
vi.mock('@/lib/auth/helpers', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com',
  }),
}))

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Task Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createTask', () => {
    it('should create a task successfully with valid data', async () => {
      const mockTask = {
        id: 'task-123',
        title: 'New Task',
        description: 'Task description',
        completed: false,
        userId: 'test-user-id',
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

      const result = await createTask({
        title: 'New Task',
        description: 'Task description',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBeDefined()
        expect(result.data.title).toBe('New Task')
        expect(result.data.description).toBe('Task description')
        expect(result.data.completed).toBe(false)
      }
    })

    it('should create a task without description', async () => {
      const mockTask = {
        id: 'task-124',
        title: 'Task without description',
        description: null,
        completed: false,
        userId: 'test-user-id',
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

      const result = await createTask({
        title: 'Task without description',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Task without description')
        expect(result.data.description).toBeNull()
      }
    })

    it('should return error for invalid input', async () => {
      const result = await createTask({
        title: '', // Empty title
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
        expect(result.error).toContain('Title is required')
      }
    })

    it('should return error for missing title', async () => {
      const result = await createTask({} as { title: string })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })

    it('should return error when not authenticated', async () => {
      const { requireAuth } = await import('@/lib/auth/helpers')
      vi.mocked(requireAuth).mockRejectedValueOnce(new Error('Unauthorized'))

      const result = await createTask({
        title: 'Test Task',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Unauthorized')
      }
    })
  })

  describe('toggleTask', () => {
    it('should toggle task completion status', async () => {
      const mockTask = {
        id: 'task-123',
        completed: false,
        userId: 'test-user-id',
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

      const result = await toggleTask('task-123')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.completed).toBe(true)
      }
    })

    it('should return error for non-existent task', async () => {
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

      const result = await toggleTask('non-existent-id')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })

    it('should return error when not authenticated', async () => {
      const { requireAuth } = await import('@/lib/auth/helpers')
      vi.mocked(requireAuth).mockRejectedValueOnce(new Error('Unauthorized'))

      const result = await toggleTask('some-id')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Unauthorized')
      }
    })
  })

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      })

      const result = await deleteTask('task-123')
      expect(result.success).toBe(true)
    })

    it('should return error when delete fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi
              .fn()
              .mockResolvedValue({ error: { message: 'Delete failed' } }),
          }),
        }),
      })

      const result = await deleteTask('task-123')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to delete task')
      }
    })

    it('should return error when not authenticated', async () => {
      const { requireAuth } = await import('@/lib/auth/helpers')
      vi.mocked(requireAuth).mockRejectedValueOnce(new Error('Unauthorized'))

      const result = await deleteTask('some-id')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Unauthorized')
      }
    })
  })
})
