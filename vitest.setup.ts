import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Add custom matchers for better assertions
// Example: expect(element).toBeInTheDocument()

// Cleanup after each test
afterEach(() => {
  cleanup()
})
