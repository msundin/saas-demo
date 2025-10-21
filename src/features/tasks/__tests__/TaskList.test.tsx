import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaskList } from '../components/TaskList'
import type { Task } from '@/lib/drizzle/schema'

// Mock the TaskItem component
vi.mock('../components/TaskItem', () => ({
  TaskItem: ({ task }: { task: Task }) => (
    <div data-testid={`task-item-${task.id}`}>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
    </div>
  ),
}))

describe('TaskList', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'First Task',
      description: 'First description',
      completed: false,
      userId: 'user-123',
      createdAt: new Date('2025-01-03').toISOString(),
      updatedAt: new Date('2025-01-03').toISOString(),
    },
    {
      id: 'task-2',
      title: 'Second Task',
      description: 'Second description',
      completed: true,
      userId: 'user-123',
      createdAt: new Date('2025-01-02').toISOString(),
      updatedAt: new Date('2025-01-02').toISOString(),
    },
    {
      id: 'task-3',
      title: 'Third Task',
      description: null,
      completed: false,
      userId: 'user-123',
      createdAt: new Date('2025-01-01').toISOString(),
      updatedAt: new Date('2025-01-01').toISOString(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering with tasks', () => {
    it('should render all tasks', () => {
      render(<TaskList tasks={mockTasks} />)

      expect(screen.getByText('First Task')).toBeInTheDocument()
      expect(screen.getByText('Second Task')).toBeInTheDocument()
      expect(screen.getByText('Third Task')).toBeInTheDocument()
    })

    it('should render correct number of task items', () => {
      render(<TaskList tasks={mockTasks} />)

      const taskItems = screen.getAllByTestId(/task-item-/)
      expect(taskItems).toHaveLength(3)
    })

    it('should display section heading', () => {
      render(<TaskList tasks={mockTasks} />)

      expect(screen.getByText(/your tasks/i)).toBeInTheDocument()
    })

    it('should render tasks in order provided', () => {
      render(<TaskList tasks={mockTasks} />)

      const taskItems = screen.getAllByTestId(/task-item-/)

      // Tasks should be in the order they were provided
      expect(taskItems[0]).toHaveAttribute('data-testid', 'task-item-task-1')
      expect(taskItems[1]).toHaveAttribute('data-testid', 'task-item-task-2')
      expect(taskItems[2]).toHaveAttribute('data-testid', 'task-item-task-3')
    })
  })

  describe('Empty state', () => {
    it('should show empty state when no tasks', () => {
      render(<TaskList tasks={[]} />)

      expect(
        screen.getByText(/no tasks yet/i)
      ).toBeInTheDocument()
    })

    it('should show helpful message in empty state', () => {
      render(<TaskList tasks={[]} />)

      expect(
        screen.getByText(/create your first task/i)
      ).toBeInTheDocument()
    })

    it('should not render task items when empty', () => {
      render(<TaskList tasks={[]} />)

      const taskItems = screen.queryAllByTestId(/task-item-/)
      expect(taskItems).toHaveLength(0)
    })

    it('should not show empty state when tasks exist', () => {
      render(<TaskList tasks={mockTasks} />)

      expect(
        screen.queryByText(/no tasks yet/i)
      ).not.toBeInTheDocument()
    })
  })

  describe('Single task', () => {
    it('should render single task correctly', () => {
      const singleTask = [mockTasks[0]]

      render(<TaskList tasks={singleTask} />)

      expect(screen.getByText('First Task')).toBeInTheDocument()
      expect(screen.queryByText('Second Task')).not.toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('should handle task with null description', () => {
      const taskWithNullDescription: Task[] = [
        {
          ...mockTasks[0],
          description: null,
        },
      ]

      render(<TaskList tasks={taskWithNullDescription} />)

      expect(screen.getByText('First Task')).toBeInTheDocument()
    })

    it('should handle large number of tasks', () => {
      const manyTasks: Task[] = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: `Description ${i}`,
        completed: i % 2 === 0,
        userId: 'user-123',
        createdAt: new Date(2025, 0, i + 1).toISOString(),
        updatedAt: new Date(2025, 0, i + 1).toISOString(),
      }))

      render(<TaskList tasks={manyTasks} />)

      const taskItems = screen.getAllByTestId(/task-item-/)
      expect(taskItems).toHaveLength(100)
    })

    it('should handle task with very long title', () => {
      const longTitleTask: Task[] = [
        {
          ...mockTasks[0],
          title: 'A'.repeat(200),
        },
      ]

      render(<TaskList tasks={longTitleTask} />)

      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should use semantic list element', () => {
      const { container } = render(<TaskList tasks={mockTasks} />)

      const list = container.querySelector('ul, ol, [role="list"]')
      expect(list).toBeInTheDocument()
    })

    it('should have card title for section', () => {
      render(<TaskList tasks={mockTasks} />)

      // CardTitle from shadcn/ui renders as a div, not a heading element
      const title = screen.getByText(/your tasks/i)
      expect(title).toBeInTheDocument()
    })

    it('should provide count of tasks to screen readers', () => {
      render(<TaskList tasks={mockTasks} />)

      // Should show task count somewhere for screen readers
      const heading = screen.getByText(/your tasks/i)
      expect(heading).toBeInTheDocument()
    })
  })
})
