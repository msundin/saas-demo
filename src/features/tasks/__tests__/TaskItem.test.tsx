import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskItem } from '../components/TaskItem'
import * as taskActions from '../actions/task-actions'
import type { Task } from '@/lib/drizzle/schema'

// Mock the Server Actions
vi.mock('../actions/task-actions', () => ({
  toggleTask: vi.fn(),
  deleteTask: vi.fn(),
}))

describe('TaskItem', () => {
  const mockToggleTask = vi.mocked(taskActions.toggleTask)
  const mockDeleteTask = vi.mocked(taskActions.deleteTask)

  const mockTask: Task = {
    id: 'task-123',
    title: 'Buy groceries',
    description: 'Milk and eggs',
    completed: false,
    userId: 'user-123',
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date('2025-01-01').toISOString(),
  }

  const mockCompletedTask: Task = {
    ...mockTask,
    completed: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render task title', () => {
      render(<TaskItem task={mockTask} />)

      expect(screen.getByText('Buy groceries')).toBeInTheDocument()
    })

    it('should render task description', () => {
      render(<TaskItem task={mockTask} />)

      expect(screen.getByText('Milk and eggs')).toBeInTheDocument()
    })

    it('should render checkbox for task completion', () => {
      render(<TaskItem task={mockTask} />)

      const checkbox = screen.getByRole('checkbox', {
        name: /mark task as complete/i,
      })
      expect(checkbox).toBeInTheDocument()
    })

    it('should render delete button', () => {
      render(<TaskItem task={mockTask} />)

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      expect(deleteButton).toBeInTheDocument()
    })

    it('should not render description if task has no description', () => {
      const taskWithoutDescription: Task = {
        ...mockTask,
        description: null,
      }

      render(<TaskItem task={taskWithoutDescription} />)

      expect(screen.queryByText('Milk and eggs')).not.toBeInTheDocument()
    })
  })

  describe('Completion State', () => {
    it('should show unchecked checkbox for incomplete task', () => {
      render(<TaskItem task={mockTask} />)

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement
      expect(checkbox.checked).toBe(false)
    })

    it('should show checked checkbox for completed task', () => {
      render(<TaskItem task={mockCompletedTask} />)

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement
      expect(checkbox.checked).toBe(true)
    })

    it('should apply strikethrough styling to completed task title', () => {
      render(<TaskItem task={mockCompletedTask} />)

      const title = screen.getByText('Buy groceries')
      expect(title).toHaveClass('line-through')
    })

    it('should apply opacity styling to completed task', () => {
      render(<TaskItem task={mockCompletedTask} />)

      const title = screen.getByText('Buy groceries')
      // Check if parent has opacity class
      const parent = title.closest('div')
      expect(parent?.className).toMatch(/opacity/)
    })
  })

  describe('Toggle Functionality', () => {
    it('should call toggleTask when checkbox is clicked', async () => {
      const user = userEvent.setup()
      mockToggleTask.mockResolvedValue({
        success: true,
        data: mockCompletedTask,
      })

      render(<TaskItem task={mockTask} />)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      await waitFor(() => {
        expect(mockToggleTask).toHaveBeenCalledWith('task-123')
      })
    })

    it('should show optimistic update when toggling', async () => {
      const user = userEvent.setup()
      mockToggleTask.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: mockCompletedTask,
              })
            }, 100)
          })
      )

      render(<TaskItem task={mockTask} />)

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement
      expect(checkbox.checked).toBe(false)

      await user.click(checkbox)

      // Checkbox should be immediately checked (optimistic update)
      expect(checkbox.checked).toBe(true)

      await waitFor(() => {
        expect(mockToggleTask).toHaveBeenCalled()
      })
    })

    it('should handle toggle failure', async () => {
      const user = userEvent.setup()
      mockToggleTask.mockResolvedValue({
        success: false,
        error: 'Failed to toggle task',
      })

      render(<TaskItem task={mockTask} />)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      await waitFor(() => {
        expect(mockToggleTask).toHaveBeenCalled()
      })

      // Checkbox should revert to original state on error
      const updatedCheckbox = screen.getByRole('checkbox') as HTMLInputElement
      expect(updatedCheckbox.checked).toBe(false)
    })
  })

  describe('Delete Functionality', () => {
    it('should call deleteTask when delete button is clicked', async () => {
      const user = userEvent.setup()
      mockDeleteTask.mockResolvedValue({
        success: true,
        data: undefined,
      })

      render(<TaskItem task={mockTask} />)

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockDeleteTask).toHaveBeenCalledWith('task-123')
      })
    })

    it('should disable delete button during deletion', async () => {
      const user = userEvent.setup()
      mockDeleteTask.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: undefined,
              })
            }, 100)
          })
      )

      render(<TaskItem task={mockTask} />)

      const deleteButton = screen.getByRole('button', {
        name: /delete/i,
      }) as HTMLButtonElement
      await user.click(deleteButton)

      // Button should be disabled during deletion
      expect(deleteButton).toBeDisabled()

      await waitFor(() => {
        expect(mockDeleteTask).toHaveBeenCalled()
      })
    })

    it('should handle delete failure', async () => {
      const user = userEvent.setup()
      mockDeleteTask.mockResolvedValue({
        success: false,
        error: 'Failed to delete task',
      })

      render(<TaskItem task={mockTask} />)

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockDeleteTask).toHaveBeenCalled()
      })

      // Task should still be visible after failed delete
      expect(screen.getByText('Buy groceries')).toBeInTheDocument()
    })

    it('should show error message on delete failure', async () => {
      const user = userEvent.setup()
      mockDeleteTask.mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      })

      render(<TaskItem task={mockTask} />)

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(
          screen.getByText(/database connection failed/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have accessible checkbox label', () => {
      render(<TaskItem task={mockTask} />)

      const checkbox = screen.getByRole('checkbox', {
        name: /mark task as complete/i,
      })
      expect(checkbox).toBeInTheDocument()
    })

    it('should have accessible delete button label', () => {
      render(<TaskItem task={mockTask} />)

      const deleteButton = screen.getByRole('button', {
        name: /delete/i,
      })
      expect(deleteButton).toHaveAttribute('aria-label')
    })

    it('should allow keyboard interaction with checkbox', async () => {
      const user = userEvent.setup()
      mockToggleTask.mockResolvedValue({
        success: true,
        data: mockCompletedTask,
      })

      render(<TaskItem task={mockTask} />)

      const checkbox = screen.getByRole('checkbox')

      // Tab to checkbox
      await user.tab()
      expect(checkbox).toHaveFocus()

      // Press space to toggle
      await user.keyboard(' ')

      await waitFor(() => {
        expect(mockToggleTask).toHaveBeenCalled()
      })
    })

    it('should allow keyboard interaction with delete button', async () => {
      const user = userEvent.setup()
      mockDeleteTask.mockResolvedValue({
        success: true,
        data: undefined,
      })

      render(<TaskItem task={mockTask} />)

      // Tab to checkbox first
      await user.tab()

      // Tab to delete button
      await user.tab()

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      expect(deleteButton).toHaveFocus()

      // Press Enter to delete
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockDeleteTask).toHaveBeenCalled()
      })
    })
  })

  describe('Loading States', () => {
    it('should disable checkbox during toggle operation', async () => {
      const user = userEvent.setup()
      mockToggleTask.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: mockCompletedTask,
              })
            }, 100)
          })
      )

      render(<TaskItem task={mockTask} />)

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement
      await user.click(checkbox)

      // Checkbox should be disabled during operation
      expect(checkbox).toBeDisabled()

      await waitFor(() => {
        expect(checkbox).not.toBeDisabled()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle task with very long title', () => {
      const longTitleTask: Task = {
        ...mockTask,
        title: 'A'.repeat(200),
      }

      render(<TaskItem task={longTitleTask} />)

      const title = screen.getByText('A'.repeat(200))
      expect(title).toBeInTheDocument()
    })

    it('should handle task with very long description', () => {
      const longDescriptionTask: Task = {
        ...mockTask,
        description: 'B'.repeat(1000),
      }

      render(<TaskItem task={longDescriptionTask} />)

      const description = screen.getByText('B'.repeat(1000))
      expect(description).toBeInTheDocument()
    })

    it('should handle rapid toggle clicks gracefully', async () => {
      const user = userEvent.setup()
      mockToggleTask.mockResolvedValue({
        success: true,
        data: mockCompletedTask,
      })

      render(<TaskItem task={mockTask} />)

      const checkbox = screen.getByRole('checkbox')

      // Click multiple times rapidly - component should handle this without crashing
      await user.click(checkbox)
      await user.click(checkbox)
      await user.click(checkbox)

      // Component should still function correctly
      await waitFor(() => {
        expect(mockToggleTask).toHaveBeenCalled()
      })

      // No errors should be displayed
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
