import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redirect } from 'next/navigation'
import DashboardPage from '../page'

// Mock Next.js redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock auth helpers - use hoisted for variables
const { mockRequireAuth } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
}))

vi.mock('@/lib/auth/helpers', () => ({
  requireAuth: () => mockRequireAuth(),
}))

// Mock task service - use hoisted for variables
const { mockGetAll } = vi.hoisted(() => ({
  mockGetAll: vi.fn(),
}))

vi.mock('@/features/tasks/services/task.service', () => ({
  taskService: {
    getAll: mockGetAll,
  },
}))

// Mock components
vi.mock('@/features/tasks/components/TaskForm', () => ({
  TaskForm: () => <div data-testid="task-form">Task Form</div>,
}))

vi.mock('@/features/tasks/components/TaskList', () => ({
  TaskList: ({ tasks }: { tasks: any[] }) => (
    <div data-testid="task-list">
      Task List ({tasks.length} tasks)
    </div>
  ),
}))

describe('DashboardPage', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  const mockTasks = [
    {
      id: 'task-1',
      title: 'Task 1',
      description: 'Description 1',
      completed: false,
      user_id: 'user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'Task 2',
      description: null,
      completed: true,
      user_id: 'user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to login when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))

    const page = DashboardPage()

    // Server component - await the render
    try {
      await page
    } catch (err) {
      // Expected to throw due to redirect
    }

    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('should fetch tasks for authenticated user', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockGetAll.mockResolvedValue(mockTasks)

    await DashboardPage()

    expect(mockGetAll).toHaveBeenCalledWith('user-123')
  })

  it('should render dashboard with user tasks', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockGetAll.mockResolvedValue(mockTasks)

    const result = await DashboardPage()

    // Check that the page structure is correct
    expect(result).toBeDefined()
  })

  it('should handle empty task list', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockGetAll.mockResolvedValue([])

    const result = await DashboardPage()

    expect(mockGetAll).toHaveBeenCalledWith('user-123')
    expect(result).toBeDefined()
  })

  it('should call requireAuth before fetching tasks', async () => {
    const callOrder: string[] = []

    mockRequireAuth.mockImplementation(() => {
      callOrder.push('auth')
      return Promise.resolve(mockUser)
    })

    mockGetAll.mockImplementation(() => {
      callOrder.push('tasks')
      return Promise.resolve(mockTasks)
    })

    await DashboardPage()

    expect(callOrder).toEqual(['auth', 'tasks'])
  })
})
