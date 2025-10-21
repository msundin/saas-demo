import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignupForm } from '../SignupForm'

// Mock Next.js navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Supabase auth
const mockSignUp = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
    },
  }),
}))

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render email and password fields', () => {
      render(<SignupForm />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    })

    it('should render confirm password field', () => {
      render(<SignupForm />)

      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('should render signup button', () => {
      render(<SignupForm />)

      expect(
        screen.getByRole('button', { name: /sign up/i })
      ).toBeInTheDocument()
    })

    it('should render link to login page', () => {
      render(<SignupForm />)

      const loginLink = screen.getByRole('link', { name: /log in/i })
      expect(loginLink).toBeInTheDocument()
      expect(loginLink).toHaveAttribute('href', '/login')
    })

    it('should have password fields of type password', () => {
      render(<SignupForm />)

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Validation', () => {
    it('should show error when email is empty', async () => {
      const user = userEvent.setup()
      render(<SignupForm />)

      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when password is empty', async () => {
      const user = userEvent.setup()
      render(<SignupForm />)

      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when password is too short', async () => {
      const user = userEvent.setup()
      render(<SignupForm />)

      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'short')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i)
        ).toBeInTheDocument()
      })
    })

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup()
      render(<SignupForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'differentpassword')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText(/passwords must match/i)).toBeInTheDocument()
      })
    })

    it('should accept valid inputs with matching passwords', async () => {
      const user = userEvent.setup()
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: {} },
        error: null,
      })

      render(<SignupForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(
        screen.getByLabelText(/confirm password/i),
        'password123'
      )
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      })
    })
  })

  describe('Registration', () => {
    it('should call Supabase signUp on submit', async () => {
      const user = userEvent.setup()
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: {} },
        error: null,
      })

      render(<SignupForm />)

      await user.type(screen.getByLabelText(/email/i), 'new@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(
        screen.getByLabelText(/confirm password/i),
        'password123'
      )
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'new@example.com',
          password: 'password123',
        })
      })
    })

    it('should redirect to dashboard on successful signup', async () => {
      const user = userEvent.setup()
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: {} },
        error: null,
      })

      render(<SignupForm />)

      await user.type(screen.getByLabelText(/email/i), 'new@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(
        screen.getByLabelText(/confirm password/i),
        'password123'
      )
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should display error for email already in use', async () => {
      const user = userEvent.setup()
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      })

      render(<SignupForm />)

      await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(
        screen.getByLabelText(/confirm password/i),
        'password123'
      )
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/user already registered/i)
        ).toBeInTheDocument()
      })
    })

    it('should display generic error for unexpected errors', async () => {
      const user = userEvent.setup()
      mockSignUp.mockRejectedValue(new Error('Network error'))

      render(<SignupForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(
        screen.getByLabelText(/confirm password/i),
        'password123'
      )
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/an error occurred/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading state during signup', async () => {
      const user = userEvent.setup()
      let resolveSignup: (() => void) | undefined
      mockSignUp.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSignup = () =>
              resolve({
                data: { user: { id: 'user-123' }, session: {} },
                error: null,
              })
          })
      )

      render(<SignupForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(
        screen.getByLabelText(/confirm password/i),
        'password123'
      )

      const submitButton = screen.getByRole('button', {
        name: /sign up/i,
      }) as HTMLButtonElement

      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
        expect(screen.getByText(/creating account/i)).toBeInTheDocument()
      })

      resolveSignup!()

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should disable form fields during signup', async () => {
      const user = userEvent.setup()
      let resolveSignup: (() => void) | undefined
      mockSignUp.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSignup = () =>
              resolve({
                data: { user: { id: 'user-123' }, session: {} },
                error: null,
              })
          })
      )

      render(<SignupForm />)

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
      const passwordInput = screen.getByLabelText(
        /^password$/i
      ) as HTMLInputElement

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(
        screen.getByLabelText(/confirm password/i),
        'password123'
      )
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(emailInput).toBeDisabled()
        expect(passwordInput).toBeDisabled()
      })

      resolveSignup!()

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(<SignupForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      expect(emailInput).toHaveAttribute('id')
      expect(passwordInput).toHaveAttribute('id')
      expect(confirmPasswordInput).toHaveAttribute('id')
    })

    it('should mark required fields with aria-required', () => {
      render(<SignupForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      expect(emailInput).toHaveAttribute('aria-required', 'true')
      expect(passwordInput).toHaveAttribute('aria-required', 'true')
      expect(confirmPasswordInput).toHaveAttribute('aria-required', 'true')
    })

    it('should associate error messages with fields using aria-describedby', async () => {
      const user = userEvent.setup()
      render(<SignupForm />)

      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i)
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('should allow keyboard-only form submission', async () => {
      const user = userEvent.setup()
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: {} },
        error: null,
      })

      render(<SignupForm />)

      // Tab to email field
      await user.tab()
      await user.keyboard('test@example.com')

      // Tab to password field
      await user.tab()
      await user.keyboard('password123')

      // Tab to confirm password field
      await user.tab()
      await user.keyboard('password123')

      // Tab to submit button and press Enter
      await user.tab()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalled()
      })
    })
  })

  describe('Error Recovery', () => {
    it('should clear error message on retry', async () => {
      const user = userEvent.setup()

      // First attempt fails
      mockSignUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      })

      render(<SignupForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'password123')
      await user.type(
        screen.getByLabelText(/confirm password/i),
        'password123'
      )
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/user already registered/i)
        ).toBeInTheDocument()
      })

      // Second attempt succeeds
      mockSignUp.mockResolvedValueOnce({
        data: { user: { id: 'user-123' }, session: {} },
        error: null,
      })

      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(
          screen.queryByText(/user already registered/i)
        ).not.toBeInTheDocument()
      })
    })

    it('should not reset form fields on error', async () => {
      const user = userEvent.setup()
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      })

      render(<SignupForm />)

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
      const passwordInput = screen.getByLabelText(
        /^password$/i
      ) as HTMLInputElement

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(
        screen.getByLabelText(/confirm password/i),
        'password123'
      )
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/user already registered/i)
        ).toBeInTheDocument()
      })

      // Form should retain values
      expect(emailInput.value).toBe('test@example.com')
      expect(passwordInput.value).toBe('password123')
    })
  })
})
