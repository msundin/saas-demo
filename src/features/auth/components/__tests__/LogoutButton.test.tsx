import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogoutButton } from '../LogoutButton'

// Mock Next.js navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock Supabase client
const mockSignOut = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}))

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render logout button with default text', () => {
      render(<LogoutButton />)
      expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
    })

    it('should render with custom children', () => {
      render(<LogoutButton>Sign Out</LogoutButton>)
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    })

    // Note: We don't test CSS classes as they're implementation details
    // The variant prop is passed correctly, which is tested in integration

    it('should accept custom className', () => {
      render(<LogoutButton className="custom-class" />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Logout Interaction', () => {
    it('should call signOut when clicked', async () => {
      const user = userEvent.setup()
      mockSignOut.mockResolvedValue({ error: null })

      render(<LogoutButton />)
      const button = screen.getByRole('button', { name: /log out/i })

      await user.click(button)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1)
      })
    })

    it('should disable button while logging out', async () => {
      const user = userEvent.setup()
      mockSignOut.mockResolvedValue({ error: null })

      render(<LogoutButton />)
      const button = screen.getByRole('button', { name: /log out/i })

      await user.click(button)

      // Button should be disabled while logging out
      await waitFor(() => {
        expect(button).toBeDisabled()
      })

      // After successful logout, button stays disabled (component will redirect/unmount)
      expect(button).toBeDisabled()
    })

    it('should show "Logging out..." text while processing', async () => {
      const user = userEvent.setup()
      mockSignOut.mockResolvedValue({ error: null })

      render(<LogoutButton />)
      const button = screen.getByRole('button', { name: /log out/i })

      await user.click(button)

      // Should show loading text while processing
      await waitFor(() => {
        expect(screen.getByText(/logging out/i)).toBeInTheDocument()
      })

      // After successful logout, text stays (component will redirect/unmount)
      expect(screen.getByText(/logging out/i)).toBeInTheDocument()
    })

    it('should redirect to home page after successful logout', async () => {
      const user = userEvent.setup()
      mockSignOut.mockResolvedValue({ error: null })

      render(<LogoutButton />)
      const button = screen.getByRole('button', { name: /log out/i })

      await user.click(button)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle signOut error gracefully', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockSignOut.mockResolvedValue({ error: { message: 'Network error' } })

      render(<LogoutButton />)
      const button = screen.getByRole('button', { name: /log out/i })

      await user.click(button)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to log out:', 'Network error')
      })

      // Button should be re-enabled after error
      expect(button).not.toBeDisabled()

      consoleErrorSpy.mockRestore()
    })

    it('should not redirect if logout fails', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockSignOut.mockResolvedValue({ error: { message: 'Network error' } })

      render(<LogoutButton />)
      const button = screen.getByRole('button', { name: /log out/i })

      await user.click(button)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      // Should not have called push
      expect(mockPush).not.toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should handle network errors', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockSignOut.mockRejectedValue(new Error('Network failure'))

      render(<LogoutButton />)
      const button = screen.getByRole('button', { name: /log out/i })

      await user.click(button)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      // Button should be re-enabled
      expect(button).not.toBeDisabled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button role', () => {
      render(<LogoutButton />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should support keyboard interaction', async () => {
      const user = userEvent.setup()
      mockSignOut.mockResolvedValue({ error: null })

      render(<LogoutButton />)
      const button = screen.getByRole('button', { name: /log out/i })

      // Focus and press Enter
      button.focus()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1)
      })
    })

    it('should not be clickable when disabled', async () => {
      const user = userEvent.setup()
      let resolveSignOut: (() => void) | undefined
      mockSignOut.mockReturnValue(
        new Promise((resolve) => {
          resolveSignOut = () => resolve({ error: null })
        })
      )

      render(<LogoutButton />)
      const button = screen.getByRole('button', { name: /log out/i })

      // First click starts logout
      await user.click(button)
      expect(button).toBeDisabled()

      // Try to click again while disabled
      await user.click(button)

      // Should only have been called once (disabled button blocks second click)
      expect(mockSignOut).toHaveBeenCalledTimes(1)

      // Complete the logout
      resolveSignOut!()
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })
  })
})
