import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskForm } from '../components/TaskForm'
import * as taskActions from '../actions/task-actions'

// Mock the Server Actions
vi.mock('../actions/task-actions', () => ({
  createTask: vi.fn(),
}))

describe('TaskForm', () => {
  const mockCreateTask = vi.mocked(taskActions.createTask)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render form with title and description fields', () => {
      render(<TaskForm />)

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /create task/i })
      ).toBeInTheDocument()
    })

    it('should have empty fields initially', () => {
      render(<TaskForm />)

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
      const descriptionInput = screen.getByLabelText(
        /description/i
      ) as HTMLTextAreaElement

      expect(titleInput.value).toBe('')
      expect(descriptionInput.value).toBe('')
    })

    it('should render submit button with correct text', () => {
      render(<TaskForm />)

      expect(
        screen.getByRole('button', { name: /create task/i })
      ).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should show error when title is empty', async () => {
      const user = userEvent.setup()
      render(<TaskForm />)

      const submitButton = screen.getByRole('button', { name: /create task/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when title exceeds 200 characters', async () => {
      const user = userEvent.setup()
      render(<TaskForm />)

      const titleInput = screen.getByLabelText(/title/i)
      const longTitle = 'a'.repeat(201)

      await user.type(titleInput, longTitle)
      await user.click(screen.getByRole('button', { name: /create task/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/title must be less than 200 characters/i)
        ).toBeInTheDocument()
      })
    })

    it('should show error when description exceeds 1000 characters', async () => {
      const user = userEvent.setup()
      render(<TaskForm />)

      const titleInput = screen.getByLabelText(/title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const longDescription = 'a'.repeat(1001)

      await user.type(titleInput, 'Valid title')
      await user.type(descriptionInput, longDescription)
      await user.click(screen.getByRole('button', { name: /create task/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/description must be less than 1000 characters/i)
        ).toBeInTheDocument()
      })
    })

    it('should allow submission with only title (description optional)', async () => {
      const user = userEvent.setup()
      mockCreateTask.mockResolvedValue({
        success: true,
        data: {
          id: 'task-123',
          title: 'Test Task',
          description: null,
          completed: false,
          user_id: 'user-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      render(<TaskForm />)

      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Test Task')
      await user.click(screen.getByRole('button', { name: /create task/i }))

      await waitFor(() => {
        expect(mockCreateTask).toHaveBeenCalledWith({
          title: 'Test Task',
          description: '',
        })
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      mockCreateTask.mockResolvedValue({
        success: true,
        data: {
          id: 'task-123',
          title: 'Buy groceries',
          description: 'Milk and eggs',
          completed: false,
          user_id: 'user-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      render(<TaskForm />)

      const titleInput = screen.getByLabelText(/title/i)
      const descriptionInput = screen.getByLabelText(/description/i)

      await user.type(titleInput, 'Buy groceries')
      await user.type(descriptionInput, 'Milk and eggs')
      await user.click(screen.getByRole('button', { name: /create task/i }))

      await waitFor(() => {
        expect(mockCreateTask).toHaveBeenCalledWith({
          title: 'Buy groceries',
          description: 'Milk and eggs',
        })
      })
    })

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup()
      mockCreateTask.mockResolvedValue({
        success: true,
        data: {
          id: 'task-123',
          title: 'Test Task',
          description: 'Test Description',
          completed: false,
          user_id: 'user-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      render(<TaskForm />)

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
      const descriptionInput = screen.getByLabelText(
        /description/i
      ) as HTMLTextAreaElement

      await user.type(titleInput, 'Test Task')
      await user.type(descriptionInput, 'Test Description')
      await user.click(screen.getByRole('button', { name: /create task/i }))

      await waitFor(() => {
        expect(titleInput.value).toBe('')
        expect(descriptionInput.value).toBe('')
      })
    })

    it('should call onSuccess callback after successful submission', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()

      mockCreateTask.mockResolvedValue({
        success: true,
        data: {
          id: 'task-123',
          title: 'Test Task',
          description: null,
          completed: false,
          user_id: 'user-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      render(<TaskForm onSuccess={onSuccess} />)

      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Test Task')
      await user.click(screen.getByRole('button', { name: /create task/i }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      mockCreateTask.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: {
                  id: 'task-123',
                  title: 'Test',
                  description: null,
                  completed: false,
                  user_id: 'user-123',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              })
            }, 100)
          })
      )

      render(<TaskForm />)

      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Test Task')

      const submitButton = screen.getByRole('button', {
        name: /create task/i,
      }) as HTMLButtonElement
      await user.click(submitButton)

      // Button should be disabled while loading
      expect(submitButton).toBeDisabled()
      expect(screen.getByText(/creating/i)).toBeInTheDocument()

      // Wait for submission to complete
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('should disable form fields during submission', async () => {
      const user = userEvent.setup()
      mockCreateTask.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: {
                  id: 'task-123',
                  title: 'Test',
                  description: null,
                  completed: false,
                  user_id: 'user-123',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              })
            }, 100)
          })
      )

      render(<TaskForm />)

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
      await user.type(titleInput, 'Test Task')
      await user.click(screen.getByRole('button', { name: /create task/i }))

      // Inputs should be disabled
      expect(titleInput).toBeDisabled()

      await waitFor(() => {
        expect(titleInput).not.toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when submission fails', async () => {
      const user = userEvent.setup()
      mockCreateTask.mockResolvedValue({
        success: false,
        error: 'Failed to create task',
      })

      render(<TaskForm />)

      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Test Task')
      await user.click(screen.getByRole('button', { name: /create task/i }))

      await waitFor(() => {
        expect(screen.getByText(/failed to create task/i)).toBeInTheDocument()
      })
    })

    it('should not reset form when submission fails', async () => {
      const user = userEvent.setup()
      mockCreateTask.mockResolvedValue({
        success: false,
        error: 'Database error',
      })

      render(<TaskForm />)

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement
      const descriptionInput = screen.getByLabelText(
        /description/i
      ) as HTMLTextAreaElement

      await user.type(titleInput, 'Test Task')
      await user.type(descriptionInput, 'Test Description')
      await user.click(screen.getByRole('button', { name: /create task/i }))

      await waitFor(() => {
        expect(screen.getByText(/database error/i)).toBeInTheDocument()
      })

      // Form should retain values
      expect(titleInput.value).toBe('Test Task')
      expect(descriptionInput.value).toBe('Test Description')
    })

    it('should clear error message on retry', async () => {
      const user = userEvent.setup()

      // First submission fails
      mockCreateTask.mockResolvedValueOnce({
        success: false,
        error: 'Network error',
      })

      render(<TaskForm />)

      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Test Task')
      await user.click(screen.getByRole('button', { name: /create task/i }))

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })

      // Second submission succeeds
      mockCreateTask.mockResolvedValueOnce({
        success: true,
        data: {
          id: 'task-123',
          title: 'Test Task',
          description: null,
          completed: false,
          user_id: 'user-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      await user.click(screen.getByRole('button', { name: /create task/i }))

      await waitFor(() => {
        expect(screen.queryByText(/network error/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(<TaskForm />)

      const titleInput = screen.getByLabelText(/title/i)
      const descriptionInput = screen.getByLabelText(/description/i)

      expect(titleInput).toHaveAttribute('id')
      expect(descriptionInput).toHaveAttribute('id')
    })

    it('should mark required fields with aria-required', () => {
      render(<TaskForm />)

      const titleInput = screen.getByLabelText(/title/i)
      expect(titleInput).toHaveAttribute('aria-required', 'true')
    })

    it('should associate error messages with fields using aria-describedby', async () => {
      const user = userEvent.setup()
      render(<TaskForm />)

      await user.click(screen.getByRole('button', { name: /create task/i }))

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i)
        const errorMessage = screen.getByText(/title is required/i)

        expect(titleInput).toHaveAttribute('aria-invalid', 'true')
        expect(errorMessage).toHaveAttribute('id')
      })
    })

    it('should allow keyboard-only form submission', async () => {
      const user = userEvent.setup()
      mockCreateTask.mockResolvedValue({
        success: true,
        data: {
          id: 'task-123',
          title: 'Test Task',
          description: null,
          completed: false,
          user_id: 'user-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      })

      render(<TaskForm />)

      const titleInput = screen.getByLabelText(/title/i)

      // Tab to title field
      await user.tab()
      expect(titleInput).toHaveFocus()

      // Type title
      await user.keyboard('Test Task')

      // Tab to description
      await user.tab()

      // Tab to submit button and press Enter
      await user.tab()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockCreateTask).toHaveBeenCalled()
      })
    })
  })
})
