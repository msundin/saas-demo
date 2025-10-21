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

## Test-First Development (MANDATORY for Claude)

**For EVERY feature, follow this sequence:**

### ☐ Phase 1: Write Comprehensive Tests

**BEFORE any implementation, write ALL test cases:**

- Create test file: `__tests__/feature.test.ts`
- Write comprehensive test suite covering:
  - Happy path scenarios
  - Edge cases and boundaries
  - Error scenarios (validation failures, DB errors, auth failures)
  - Security scenarios (unauthorized access, RLS violations)
- Include mocks for external dependencies (database, APIs, auth, etc.)

**Example:**

```typescript
describe('TaskService', () => {
  // Happy path
  it('should create a task with valid data', async () => {
    mockSupabaseClient.from.mockReturnValue({...})
    const task = await taskService.create(userId, data)
    expect(task.title).toBe('Test Task')
  })

  // Edge cases
  it('should create a task without description', async () => {
    const task = await taskService.create(userId, { title: 'Task' })
    expect(task.description).toBeNull()
  })

  // Error scenarios
  it('should throw error for empty title', async () => {
    await expect(
      taskService.create(userId, { title: '' })
    ).rejects.toThrow('Title is required')
  })

  // Security
  it('should only return tasks for the authenticated user', async () => {
    const tasks = await taskService.getAll(userId)
    expect(tasks.every(t => t.userId === userId)).toBe(true)
  })
})
```

**Why comprehensive tests first:**

- Defines all requirements upfront
- Ensures edge cases aren't forgotten
- Creates complete specification before coding
- Prevents scope creep during implementation

### ☐ Phase 2: Implement to Pass All Tests

**Write implementation to satisfy the test suite:**

- Implement complete functionality
- Aim to pass all tests on first run
- Follow architecture patterns (services, actions, validation)
- Use TypeScript strict mode
- Add proper error handling

**Example:**

```typescript
// services/task.service.ts
export class TaskService {
  async create(userId: string, data: CreateTaskInput) {
    // Validate input
    const validatedData = createTaskSchema.parse(data);

    const supabase = await createClient();
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title: validatedData.title,
        description: validatedData.description || null,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    return task as Task;
  }

  async getAll(userId: string): Promise<Task[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    return (data as Task[]) || [];
  }
}
```

### ☐ Phase 3: Verify All Tests Pass

**RUN:**

```bash
pnpm test feature.test.ts
```

**EXPECT:**

- ✅ All tests passing on first run (ideal)
- If some fail, debug and fix until all green

**SHOW:**

- Include test output in response
- Show all passing tests

**IF FAILING:**

- Debug and fix issues
- Re-run tests until all pass
- Don't proceed to next feature with failing tests

**Example Output:**

```
✓ src/features/tasks/__tests__/task.service.test.ts (9 tests) 4ms
  ✓ TaskService
    ✓ should create a task with valid data (2ms)
    ✓ should create a task without description (1ms)
    ✓ should throw error for empty title (1ms)
    ✓ should only return tasks for authenticated user (0ms)
    ...

Test Files  1 passed (1)
     Tests  9 passed (9)
```

### ☐ Phase 4: Verify Coverage

**RUN:**

```bash
pnpm test:coverage
```

**VERIFY:**

- 80%+ coverage for new code
- Critical paths have 100% coverage (auth, payments, mutations)

**IF BELOW TARGET:**

- Add missing test cases
- Re-run coverage check

---

## RED Flags (You're Doing Test-First Wrong)

❌ **Writing implementation before tests**

- Violation: No test specification
- Fix: Write tests FIRST, then implement

❌ **Incomplete test coverage**

- Violation: Missing edge cases or error scenarios
- Fix: Write comprehensive test suite (happy path, edges, errors, security)

❌ **Not running tests after implementation**

- Violation: No verification that code works
- Fix: ALWAYS run tests and show output

❌ **Proceeding with failing tests**

- Violation: Broken code in codebase
- Fix: Debug and fix until all tests pass

❌ **Mocking after implementation**

- Violation: Tests coupled to implementation
- Fix: Mock dependencies when writing tests (before implementation)

❌ **Not showing test output in responses**

- Violation: Can't verify tests passed
- Fix: Include test output after implementation

❌ **Below 80% coverage**

- Violation: Insufficient testing
- Fix: Add more test cases until coverage target met

---

## Test-First Process Example (Complete Feature)

### Feature: Task Service

**Phase 1: Write All Tests First**

```typescript
// __tests__/task.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { taskService } from '../services/task.service'

const mockSupabaseClient = { from: vi.fn() }
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

describe('TaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Happy path
  it('should create a task with valid data', async () => {
    mockSupabaseClient.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: '1', title: 'Test', userId: 'user-1' },
            error: null
          }),
        }),
      }),
    })

    const task = await taskService.create('user-1', { title: 'Test' })
    expect(task.title).toBe('Test')
  })

  // Edge case
  it('should create task without description', async () => {
    mockSupabaseClient.from.mockReturnValue({...})
    const task = await taskService.create('user-1', { title: 'Test' })
    expect(task.description).toBeNull()
  })

  // Error scenario
  it('should throw error for empty title', async () => {
    await expect(
      taskService.create('user-1', { title: '' })
    ).rejects.toThrow('Title is required')
  })

  // Database error handling
  it('should throw error when database operation fails', async () => {
    mockSupabaseClient.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          }),
        }),
      }),
    })

    await expect(
      taskService.create('user-1', { title: 'Test' })
    ).rejects.toThrow('Failed to create task')
  })
})
```

**Phase 2: Implement Complete Feature**

```typescript
// services/task.service.ts
import { createClient } from "@/lib/supabase/server";
import {
  createTaskSchema,
  type CreateTaskInput,
} from "../validations/task.schema";
import type { Task } from "@/lib/drizzle/schema";

export class TaskService {
  async create(userId: string, input: CreateTaskInput): Promise<Task> {
    const validatedData = createTaskSchema.parse(input);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title: validatedData.title,
        description: validatedData.description || null,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    return data as Task;
  }
}

export const taskService = new TaskService();
```

**Phase 3: Run Tests**

```bash
pnpm test task.service.test.ts

# Output:
✓ src/features/tasks/__tests__/task.service.test.ts (4 tests) 3ms
  ✓ TaskService
    ✓ should create a task with valid data (1ms)
    ✓ should create task without description (1ms)
    ✓ should throw error for empty title (0ms)
    ✓ should throw error when database operation fails (1ms)

Test Files  1 passed (1)
     Tests  4 passed (4)
```

**All tests pass on first implementation! ✅**

---

## For Claude Code Assistant

**When implementing features with Test-First approach:**

### MANDATORY Steps:

1. **Before ANY implementation:**
   - Write comprehensive test suite
   - Cover: happy path, edge cases, errors, security
   - Mock external dependencies (DB, APIs, auth)

2. **After writing tests:**
   - Implement complete feature
   - Aim to pass all tests on first run
   - Follow architecture patterns

3. **After implementing:**
   - Run: `pnpm test feature.test.ts`
   - Show: Test output in response
   - Verify: All tests pass

4. **Include test output in response:**

   ```
   ## Tests Written
   [list of test cases]

   ## Implementation
   [code]

   ## Test Output
   ✓ All tests passing
   [paste test results]
   ```

### Blocking Rules:

- **NEVER implement before writing tests**
- **NEVER proceed with failing tests**
- **NEVER skip showing test output**
- **NEVER accept <80% coverage**

### When Traditional TDD Makes Sense:

Use RED-GREEN-REFACTOR cycle when:

- Exploring unfamiliar APIs or patterns
- Debugging complex issues
- Implementation approach is unclear
- User explicitly requests it

In these cases, show RED output before implementation.

---

**Original TDD Flow Example:**

```typescript
// Step 1: Write test FIRST
describe("TaskService", () => {
  it("validates title is required", async () => {
    await expect(
      taskService.create(userId, { title: '' }),
    ).rejects.toThrow("Title is required");
  });
});

// Step 2: Run test (fails - method doesn't exist)

// Step 3: Implement minimal code
export class TaskService {
  async create(userId: string, data: CreateTaskInput) {
    if (!data.title || data.title.length === 0) {
      throw new Error("Title is required");
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
// __tests__/task.service.test.ts
import { describe, it, expect, vi } from "vitest";
import { taskService } from "../services/task.service";

describe("TaskService", () => {
  it("creates task with defaults", () => {
    const task = taskService.create(userId, { title: 'Test' });
    expect(task.completed).toBe(false);
  });

  it("validates title is required", async () => {
    await expect(
      taskService.create(userId, { title: '' }),
    ).rejects.toThrow("Title is required");
  });

  it("orders tasks by creation date", async () => {
    const tasks = await taskService.getAll(userId);
    expect(tasks[0].createdAt >= tasks[1].createdAt).toBe(true);
  });
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
// __tests__/task-actions.test.ts
import { describe, it, expect } from "vitest";
import { createTask } from "../actions/task-actions";

describe("createTask action", () => {
  it("creates task successfully", async () => {
    const result = await createTask({
      title: "Buy groceries",
      description: "Milk, eggs, bread",
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty("id");
    expect(result.data.title).toBe("Buy groceries");
    expect(result.data.completed).toBe(false);
  });

  it("returns error for invalid input", async () => {
    const result = await createTask({
      title: "",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("Title is required");
  });

  it("requires authentication", async () => {
    // Mock unauthenticated state
    vi.mock("@/lib/auth/helpers", () => ({
      requireAuth: vi.fn().mockRejectedValue(new Error("Unauthorized")),
    }));

    const result = await createTask({ title: "Test" });

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
// __tests__/TaskForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskForm } from '../components/TaskForm'
import { describe, it, expect, vi } from 'vitest'

describe('TaskForm', () => {
  it('renders form fields', () => {
    render(<TaskForm />)

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<TaskForm />)

    // Submit without filling fields
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
    })
  })

  it('validates title length', async () => {
    render(<TaskForm />)

    const titleInput = screen.getByLabelText('Title')
    fireEvent.change(titleInput, { target: { value: 'a'.repeat(201) } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText('Title must be less than 200 characters')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn()
    render(<TaskForm onSubmit={onSubmit} />)

    // Fill out form
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Buy groceries' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Milk and eggs' } })

    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Buy groceries',
        description: 'Milk and eggs'
      })
    })
  })

  it('shows loading state during submission', async () => {
    render(<TaskForm />)

    // Fill and submit
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Test' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
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
// e2e/task-creation.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Task Creation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
  });

  test("creates task successfully", async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.click("text=New Task");

    // Fill out form
    await page.fill('input[name="title"]', "Buy groceries");
    await page.fill('textarea[name="description"]', "Milk and eggs");

    // Submit
    await page.click('button:has-text("Create Task")');

    // Verify success
    await expect(
      page.locator("text=Task created successfully"),
    ).toBeVisible();
    await expect(page.locator("text=Buy groceries")).toBeVisible();
  });

  test("validates form fields", async ({ page }) => {
    await page.goto("/dashboard");
    await page.click("text=New Task");

    // Try to submit empty form
    await page.click('button:has-text("Create Task")');

    // Check for validation errors
    await expect(page.locator("text=Title is required")).toBeVisible();
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
          single: vi.fn().mockResolvedValue({ data: mockTask }),
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
pnpm test task.service.test.ts

# E2E tests
pnpm test:e2e

# E2E in headed mode (see browser)
pnpm test:e2e --headed
```

---

## Test Organization

```
features/tasks/
├── __tests__/
│   ├── task.service.test.ts      # Unit tests
│   ├── task-actions.test.ts      # Integration tests
│   ├── TaskForm.test.tsx         # Component tests
│   └── fixtures/
│       └── tasks.ts               # Test data
├── components/
│   └── TaskForm.tsx
├── actions/
│   └── task-actions.ts
└── services/
    └── task.service.ts
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
it("creates task with valid data and sends notification", () => {});
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
// fixtures/tasks.ts
export const mockTask = {
  id: "task-1",
  title: "Buy groceries",
  description: "Milk and eggs",
  completed: false,
  userId: "user-1",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

export const createMockTask = (overrides = {}) => ({
  ...mockTask,
  ...overrides,
});
```

---

## CI Integration

Tests run automatically on every commit via pre-commit hooks and on every push via GitHub Actions.

See [workflows.md](./workflows.md) for CI/CD pipeline details.
