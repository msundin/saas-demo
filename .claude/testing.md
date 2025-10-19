# Testing Strategy

## Testing Philosophy

**Every feature must include tests. No exceptions.**

Tests are NOT overhead - they make development FASTER by:
- Catching bugs immediately instead of in production
- Providing confidence to refactor
- Serving as executable documentation
- Reducing debugging time

---

## Test Coverage Goals

- **Minimum:** 70% coverage
- **Target:** 80%+ coverage (BOTH Rapid and Production modes)
- **Critical paths:** 100% coverage (auth, payments, data mutations)

**Why 80%+ always?**
- Writing tests takes ~10 minutes upfront
- Debugging production bugs takes hours
- Backfilling tests later takes 10x longer
- Tests give confidence to move fast

---

## TDD Approach

### Write Tests FIRST for Critical Paths

**Critical paths that require TDD:**
- Authentication & authorization
- Payment processing
- Data mutations (create, update, delete)
- Business logic & calculations
- Security-sensitive operations

**Process:**
1. Write test describing expected behavior
2. Run test (it should fail)
3. Write minimal code to make it pass
4. Refactor if needed
5. Repeat

**Example TDD Flow:**
```typescript
// Step 1: Write test FIRST
describe('InvoiceService', () => {
  it('validates amount is positive', async () => {
    await expect(
      invoiceService.create(userId, { amount: -100 })
    ).rejects.toThrow('Amount must be positive')
  })
})

// Step 2: Run test (fails - method doesn't exist)

// Step 3: Implement minimal code
export class InvoiceService {
  async create(userId: string, data: CreateInvoiceInput) {
    if (data.amount <= 0) {
      throw new Error('Amount must be positive')
    }
    // ... rest of implementation
  }
}

// Step 4: Run test (passes)
```

---

## Unit Tests

Test individual functions and services in isolation.

**What to test:**
- Business logic
- Utility functions
- Service methods
- Data transformations
- Validation logic

**Example (Services):**
```typescript
// __tests__/invoice.service.test.ts
import { describe, it, expect, vi } from 'vitest'
import { invoiceService } from '../services/invoice.service'

describe('InvoiceService', () => {
  it('generates unique invoice numbers', () => {
    const num1 = invoiceService.generateInvoiceNumber()
    const num2 = invoiceService.generateInvoiceNumber()
    expect(num1).not.toBe(num2)
  })

  it('validates amount is positive', async () => {
    await expect(
      invoiceService.create(userId, { amount: -100 })
    ).rejects.toThrow('Amount must be positive')
  })

  it('sends notification after invoice creation', async () => {
    const sendEmailSpy = vi.spyOn(invoiceService, 'sendInvoiceNotification')

    await invoiceService.create(userId, validInvoiceData)

    expect(sendEmailSpy).toHaveBeenCalledOnce()
  })
})
```

---

## Integration Tests

Test how components work together (Server Actions, API routes).

**What to test:**
- Server Actions
- API route handlers
- Database operations
- Third-party integrations

**Example (Server Actions):**
```typescript
// __tests__/invoice-actions.test.ts
import { describe, it, expect } from 'vitest'
import { createInvoice } from '../actions/invoice-actions'

describe('createInvoice action', () => {
  it('creates invoice successfully', async () => {
    const result = await createInvoice({
      customerId: 'valid-uuid',
      amount: 100,
      dueDate: '2025-12-31T00:00:00Z'
    })

    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('id')
    expect(result.data.amount).toBe(100)
  })

  it('returns error for invalid input', async () => {
    const result = await createInvoice({
      customerId: 'invalid',
      amount: -100,
      dueDate: 'invalid'
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('requires authentication', async () => {
    // Mock unauthenticated state
    vi.mock('@/lib/auth', () => ({
      getCurrentUser: vi.fn().mockResolvedValue(null)
    }))

    const result = await createInvoice(validData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unauthorized')
  })
})
```

---

## Component Tests

Test React components (interaction, rendering, accessibility).

**What to test:**
- Component renders correctly
- User interactions work
- Form validation
- Error states
- Loading states

**Example (Component Tests):**
```typescript
// __tests__/InvoiceForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InvoiceForm } from '../components/InvoiceForm'
import { describe, it, expect, vi } from 'vitest'

describe('InvoiceForm', () => {
  it('renders form fields', () => {
    render(<InvoiceForm />)

    expect(screen.getByLabelText('Amount')).toBeInTheDocument()
    expect(screen.getByLabelText('Customer')).toBeInTheDocument()
    expect(screen.getByLabelText('Due Date')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<InvoiceForm />)

    // Submit without filling fields
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(screen.getByText('Amount is required')).toBeInTheDocument()
    })
  })

  it('validates amount is positive', async () => {
    render(<InvoiceForm />)

    const amountInput = screen.getByLabelText('Amount')
    fireEvent.change(amountInput, { target: { value: '-100' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(screen.getByText('Amount must be positive')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn()
    render(<InvoiceForm onSubmit={onSubmit} />)

    // Fill out form
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Customer'), { target: { value: 'customer-id' } })
    fireEvent.change(screen.getByLabelText('Due Date'), { target: { value: '2025-12-31' } })

    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        amount: 100,
        customerId: 'customer-id',
        dueDate: '2025-12-31'
      })
    })
  })

  it('shows loading state during submission', async () => {
    render(<InvoiceForm />)

    // Fill and submit
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled()
  })
})
```

---

## E2E Tests

Test complete user flows (with Playwright).

**What to test:**
- Critical user journeys
- Authentication flows
- Payment flows
- Multi-step processes

**Example (E2E):**
```typescript
// e2e/invoice-creation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Invoice Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
  })

  test('creates invoice successfully', async ({ page }) => {
    // Navigate to invoices
    await page.goto('/dashboard/invoices')
    await page.click('text=New Invoice')

    // Fill out form
    await page.fill('input[name="amount"]', '100')
    await page.selectOption('select[name="customerId"]', 'customer-1')
    await page.fill('input[name="dueDate"]', '2025-12-31')

    // Submit
    await page.click('button:has-text("Create Invoice")')

    // Verify success
    await expect(page.locator('text=Invoice created successfully')).toBeVisible()
    await expect(page).toHaveURL(/\/dashboard\/invoices\/.*/)
  })

  test('validates form fields', async ({ page }) => {
    await page.goto('/dashboard/invoices/new')

    // Try to submit empty form
    await page.click('button:has-text("Create Invoice")')

    // Check for validation errors
    await expect(page.locator('text=Amount is required')).toBeVisible()
  })
})
```

---

## Testing Database Operations

**Use test database:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL,
      SUPABASE_URL: process.env.TEST_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY,
    },
    setupFiles: ['./tests/setup.ts'],
  },
})
```

**Setup/teardown:**
```typescript
// tests/setup.ts
import { beforeEach, afterEach } from 'vitest'
import { db } from '@/lib/drizzle/client'

beforeEach(async () => {
  // Start transaction
  await db.execute('BEGIN')
})

afterEach(async () => {
  // Rollback transaction (clean state)
  await db.execute('ROLLBACK')
})
```

---

## Mocking Strategies

**Mock external services:**
```typescript
// __tests__/email.test.ts
import { vi } from 'vitest'

vi.mock('@/lib/email/client', () => ({
  resend: {
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'email-id' })
    }
  }
}))
```

**Mock Supabase:**
```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockInvoice })
        }))
      }))
    }))
  }))
}))
```

---

## Running Tests

```bash
# Run all tests
pnpm test

# Watch mode (during development)
pnpm test:watch

# Coverage report
pnpm test:coverage

# Run specific test file
pnpm test invoice.service.test.ts

# E2E tests
pnpm test:e2e

# E2E in headed mode (see browser)
pnpm test:e2e --headed
```

---

## Test Organization

```
features/invoices/
├── __tests__/
│   ├── invoice.service.test.ts      # Unit tests
│   ├── invoice-actions.test.ts      # Integration tests
│   ├── InvoiceForm.test.tsx         # Component tests
│   └── fixtures/
│       └── invoices.ts               # Test data
├── components/
│   └── InvoiceForm.tsx
├── actions/
│   └── invoice-actions.ts
└── services/
    └── invoice.service.ts
```

---

## Best Practices

### 1. Test Behavior, Not Implementation
```typescript
// ❌ BAD - Testing implementation details
it('calls setState with correct value', () => {
  const setState = vi.fn()
  // ...
  expect(setState).toHaveBeenCalledWith({ count: 1 })
})

// ✅ GOOD - Testing behavior
it('increments counter when button clicked', () => {
  render(<Counter />)
  fireEvent.click(screen.getByText('Increment'))
  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})
```

### 2. Use Descriptive Test Names
```typescript
// ❌ BAD
it('works', () => { })

// ✅ GOOD
it('creates invoice with valid data and sends email notification', () => { })
```

### 3. Keep Tests Independent
```typescript
// ✅ GOOD - Each test is self-contained
it('test 1', () => {
  const data = createTestData()
  // test logic
})

it('test 2', () => {
  const data = createTestData()
  // test logic
})
```

### 4. Test Edge Cases
```typescript
it('handles empty array', () => { })
it('handles null values', () => { })
it('handles maximum allowed value', () => { })
it('rejects values exceeding limit', () => { })
```

### 5. Use Test Fixtures
```typescript
// fixtures/invoices.ts
export const mockInvoice = {
  id: 'invoice-1',
  amount: 100,
  customerId: 'customer-1',
  dueDate: '2025-12-31'
}

export const createMockInvoice = (overrides = {}) => ({
  ...mockInvoice,
  ...overrides
})
```

---

## CI Integration

Tests run automatically on every commit via pre-commit hooks and on every push via GitHub Actions.

See [workflows.md](./workflows.md) for CI/CD pipeline details.
