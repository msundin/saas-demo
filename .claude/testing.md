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

---

## TDD Checklist (MANDATORY for Claude)

**For EVERY feature, follow this exact sequence:**

### ☐ Step 1: Write Test

- Create test file: `__tests__/feature.test.ts`
- Write test cases describing expected behavior
- Include mocks for external dependencies (database, APIs, etc.)

**Example:**

```typescript
describe('TaskService', () => {
  it('should create a task with valid data', async () => {
    // Mock Supabase client
    mockSupabaseClient.from.mockReturnValue({...})

    const task = await taskService.create(userId, data)

    expect(task.title).toBe('Test Task')
  })
})
```

### ☐ Step 2: Verify RED (Test MUST Fail)

**RUN:**

```bash
pnpm test feature.test.ts
```

**EXPECT:**

- ❌ Test failures
- Error messages about missing implementation OR
- Assertion failures

**SHOW:**

- Include test output in response
- Show the failure message

**IF PASSING:**

- ⚠️ Test is useless!
- Rewrite test to actually verify behavior

**Example Output:**

```
❌ FAIL  src/features/tasks/__tests__/task.service.test.ts
  ● TaskService › create › should create a task
    Cannot find module '../services/task.service'
```

### ☐ Step 3: Implement Minimal Code

- Write ONLY enough code to make THIS test pass
- Don't add extra features
- Keep it simple

**Example:**

```typescript
// services/task.service.ts
export class TaskService {
  async create(userId: string, data: CreateTaskInput) {
    // Minimal implementation
    const supabase = await createClient();
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({ user_id: userId, ...data })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return task;
  }
}
```

### ☐ Step 4: Verify GREEN (Test MUST Pass)

**RUN:**

```bash
pnpm test feature.test.ts
```

**EXPECT:**

- ✅ All tests passing
- No errors

**SHOW:**

- Include test output in response
- Show passing tests

**IF FAILING:**

- Debug until green
- Don't move to next feature

**Example Output:**

```
✓ PASS  src/features/tasks/__tests__/task.service.test.ts
  ✓ TaskService › create › should create a task (15ms)
```

### ☐ Step 5: Refactor (Keep GREEN)

- Clean up code if needed
- Extract duplicates
- Improve naming
- Tests MUST stay passing

**RUN tests after every refactor:**

```bash
pnpm test:watch
```

### ☐ Step 6: Next Test

- Write next test case
- Repeat steps 2-5

---

## RED Flags (You're Doing TDD Wrong)

❌ **Writing implementation before running tests**

- Violation: No Red phase
- Fix: Delete implementation, start over

❌ **Tests passing on first run**

- Violation: Test doesn't verify anything
- Fix: Rewrite test to actually fail first

❌ **Writing multiple tests before any pass**

- Violation: Not incremental
- Fix: Focus on ONE test at a time

❌ **Skipping test execution to "save time"**

- Violation: No feedback loop
- Fix: ALWAYS run tests between steps

❌ **Mocking after implementation**

- Violation: Tests coupled to implementation
- Fix: Mock dependencies BEFORE implementing

❌ **Not showing test output in responses**

- Violation: Can't verify TDD was followed
- Fix: Include test output for Red AND Green phases

---

## TDD Process Example (Complete Cycle)

### Cycle 1: Create Task

**1. Write test:**

```typescript
it('should create a task with valid data', async () => {
  mockSupabaseClient.from.mockReturnValue({...})
  const task = await taskService.create(userId, { title: 'Test' })
  expect(task.title).toBe('Test')
})
```

**2. Run test (RED):**

```bash
pnpm test
# ❌ Cannot find module '../services/task.service'
```

**3. Implement:**

```typescript
export class TaskService {
  async create(userId, data) {
    // minimal implementation
  }
}
```

**4. Run test (GREEN):**

```bash
pnpm test
# ✅ Tests passed
```

### Cycle 2: Validate Empty Title

**1. Write test:**

```typescript
it("should throw error for empty title", async () => {
  await expect(taskService.create(userId, { title: "" })).rejects.toThrow(
    "Title is required",
  );
});
```

**2. Run test (RED):**

```bash
pnpm test
# ❌ Expected error but none was thrown
```

**3. Implement:**

```typescript
async create(userId, data) {
  const validated = createTaskSchema.parse(data) // Adds validation
  // ...
}
```

**4. Run test (GREEN):**

```bash
pnpm test
# ✅ All 2 tests passed
```

**Repeat for each test case...**

---

## For Claude Code Assistant

**When implementing features with TDD:**

### MANDATORY Steps:

1. **After writing tests:**
   - Run: `pnpm test feature.test.ts`
   - Show: RED output in response
   - Verify: Tests fail with expected errors

2. **After implementing:**
   - Run: `pnpm test feature.test.ts`
   - Show: GREEN output in response
   - Verify: All tests pass

3. **Include in EVERY response during TDD:**

   ```
   ## Test Output (RED)
   [paste test failures]

   ## Implementation
   [code]

   ## Test Output (GREEN)
   [paste test passes]
   ```

### Blocking Rules:

- **NEVER implement without showing RED first**
- **NEVER proceed to next feature with failing tests**
- **NEVER skip showing test output**

If you violate these rules, you're not doing TDD.

---

**Original TDD Flow Example:**

```typescript
// Step 1: Write test FIRST
describe("InvoiceService", () => {
  it("validates amount is positive", async () => {
    await expect(
      invoiceService.create(userId, { amount: -100 }),
    ).rejects.toThrow("Amount must be positive");
  });
});

// Step 2: Run test (fails - method doesn't exist)

// Step 3: Implement minimal code
export class InvoiceService {
  async create(userId: string, data: CreateInvoiceInput) {
    if (data.amount <= 0) {
      throw new Error("Amount must be positive");
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
import { describe, it, expect, vi } from "vitest";
import { invoiceService } from "../services/invoice.service";

describe("InvoiceService", () => {
  it("generates unique invoice numbers", () => {
    const num1 = invoiceService.generateInvoiceNumber();
    const num2 = invoiceService.generateInvoiceNumber();
    expect(num1).not.toBe(num2);
  });

  it("validates amount is positive", async () => {
    await expect(
      invoiceService.create(userId, { amount: -100 }),
    ).rejects.toThrow("Amount must be positive");
  });

  it("sends notification after invoice creation", async () => {
    const sendEmailSpy = vi.spyOn(invoiceService, "sendInvoiceNotification");

    await invoiceService.create(userId, validInvoiceData);

    expect(sendEmailSpy).toHaveBeenCalledOnce();
  });
});
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
import { describe, it, expect } from "vitest";
import { createInvoice } from "../actions/invoice-actions";

describe("createInvoice action", () => {
  it("creates invoice successfully", async () => {
    const result = await createInvoice({
      customerId: "valid-uuid",
      amount: 100,
      dueDate: "2025-12-31T00:00:00Z",
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty("id");
    expect(result.data.amount).toBe(100);
  });

  it("returns error for invalid input", async () => {
    const result = await createInvoice({
      customerId: "invalid",
      amount: -100,
      dueDate: "invalid",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("requires authentication", async () => {
    // Mock unauthenticated state
    vi.mock("@/lib/auth", () => ({
      getCurrentUser: vi.fn().mockResolvedValue(null),
    }));

    const result = await createInvoice(validData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });
});
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
import { test, expect } from "@playwright/test";

test.describe("Invoice Creation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
  });

  test("creates invoice successfully", async ({ page }) => {
    // Navigate to invoices
    await page.goto("/dashboard/invoices");
    await page.click("text=New Invoice");

    // Fill out form
    await page.fill('input[name="amount"]', "100");
    await page.selectOption('select[name="customerId"]', "customer-1");
    await page.fill('input[name="dueDate"]', "2025-12-31");

    // Submit
    await page.click('button:has-text("Create Invoice")');

    // Verify success
    await expect(
      page.locator("text=Invoice created successfully"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/invoices\/.*/);
  });

  test("validates form fields", async ({ page }) => {
    await page.goto("/dashboard/invoices/new");

    // Try to submit empty form
    await page.click('button:has-text("Create Invoice")');

    // Check for validation errors
    await expect(page.locator("text=Amount is required")).toBeVisible();
  });
});
```

---

## Testing Database Operations

**Use test database:**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL,
      SUPABASE_URL: process.env.TEST_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY,
    },
    setupFiles: ["./tests/setup.ts"],
  },
});
```

**Setup/teardown:**

```typescript
// tests/setup.ts
import { beforeEach, afterEach } from "vitest";
import { db } from "@/lib/drizzle/client";

beforeEach(async () => {
  // Start transaction
  await db.execute("BEGIN");
});

afterEach(async () => {
  // Rollback transaction (clean state)
  await db.execute("ROLLBACK");
});
```

---

## Mocking Strategies

**Mock external services:**

```typescript
// __tests__/email.test.ts
import { vi } from "vitest";

vi.mock("@/lib/email/client", () => ({
  resend: {
    emails: {
      send: vi.fn().mockResolvedValue({ id: "email-id" }),
    },
  },
}));
```

**Mock Supabase:**

```typescript
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockInvoice }),
        })),
      })),
    })),
  })),
}));
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
it("works", () => {});

// ✅ GOOD
it("creates invoice with valid data and sends email notification", () => {});
```

### 3. Keep Tests Independent

```typescript
// ✅ GOOD - Each test is self-contained
it("test 1", () => {
  const data = createTestData();
  // test logic
});

it("test 2", () => {
  const data = createTestData();
  // test logic
});
```

### 4. Test Edge Cases

```typescript
it("handles empty array", () => {});
it("handles null values", () => {});
it("handles maximum allowed value", () => {});
it("rejects values exceeding limit", () => {});
```

### 5. Use Test Fixtures

```typescript
// fixtures/invoices.ts
export const mockInvoice = {
  id: "invoice-1",
  amount: 100,
  customerId: "customer-1",
  dueDate: "2025-12-31",
};

export const createMockInvoice = (overrides = {}) => ({
  ...mockInvoice,
  ...overrides,
});
```

---

## CI Integration

Tests run automatically on every commit via pre-commit hooks and on every push via GitHub Actions.

See [workflows.md](./workflows.md) for CI/CD pipeline details.
