# Production SaaS Monorepo - CLAUDE.md

## Project Overview

**Type:** Turborepo monorepo for multiple SaaS applications  
**Purpose:** Rapid SaaS development with maximum code reuse  
**Philosophy:** Feature-based architecture, iterative development, test-driven

## Tech Stack (October 2025 Verified)

### Reference Architecture
**Inspiration:** [next-forge by Vercel](https://github.com/vercel/next-forge) - A production-grade Turborepo template

**What we adopt from next-forge:**
- ✅ Monorepo structure (apps/* and packages/*)
- ✅ Shared packages pattern
- ✅ Testing approaches
- ✅ Documentation style

**What we adapt for our stack:**
- 🔄 Supabase instead of Prisma + Neon
- 🔄 Supabase Auth instead of Clerk
- 🔄 Supabase client for app CRUD (RLS) + Drizzle for server-only complex queries

### Core Framework
- **Next.js 15** (App Router, Server Components, Server Actions)
- **TypeScript 5+** (strict mode, no `any` types)
- **React 19** (with Server Components)
- **Tailwind CSS** (utility-first styling)

**Future considerations:**
- React Compiler (when stable in Next.js ecosystem)

### Backend & Database
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
  - PostgreSQL with Row Level Security (RLS)
  - Auto-generated REST APIs (for client-side)
  - Realtime subscriptions
  - Connection pooling via Supavisor (PgBouncer)

**Database Access Strategy:**
- **Client-side & Server Components:** Supabase JavaScript client (respects RLS automatically)
- **Server-side complex queries:** Drizzle ORM with direct PostgreSQL access
- **Migrations:** Drizzle Kit (migration-based workflow)

**Important Runtime Requirements:**
- Drizzle ORM requires **Node.js runtime** (NOT Edge runtime)
- Use Supabase client in Edge runtime if needed
- Type generation: Drizzle generates types from schema
- **PgBouncer compatibility:** Use `prepare: false` in Drizzle client config

### Authentication
- **Primary:** Supabase Auth (email/password + OAuth)
- **Alternative:** Clerk (if advanced features needed)

### Monorepo
- **Turborepo** (build system)
- **pnpm** (package manager)
- **Workspace structure:** apps/* and packages/*

### Deployment & Infrastructure
- **Hosting:** Vercel (automatic deployments)
- **Error Tracking:** Sentry
- **Analytics:** PostHog or Vercel Analytics
- **Payments:** Stripe (when needed)

### Testing & Quality
- **Unit Tests:** Vitest
- **Integration Tests:** Playwright
- **E2E Tests:** Playwright
- **Linting:** ESLint + TypeScript ESLint
- **Formatting:** Prettier
- **Pre-commit:** Husky + lint-staged

---

## Architecture Principles

### Feature-Based Architecture
Organize by **features**, not technical layers. Each feature is self-contained.

```
apps/my-saas/
├── features/
│   ├── invoices/
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── actions/         # Server Actions
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   ├── validations/     # Zod schemas
│   │   └── __tests__/       # Feature tests
│   └── customers/
│       └── (same structure)
├── lib/
│   ├── supabase/           # Database client
│   ├── drizzle/            # Drizzle ORM client
│   ├── utils/              # Shared utilities
│   └── constants/          # App constants
└── app/
    └── (routes)            # Next.js App Router
```

### Layer Responsibilities

**1. Presentation Layer** (`components/` + `hooks/`)
- UI components (Server & Client)
- React hooks for client-side state
- NO business logic
- NO direct database access

**2. Application Layer** (`actions/` + `services/`)
- `actions/`: Server Actions for mutations
- `services/`: Complex business logic
- Coordinates between presentation and data
- Error handling and validation

**3. Data Layer** (`lib/supabase/` + `lib/drizzle/`)
- Database queries (via Supabase client or Drizzle)
- API integrations
- Data transformations
- Type definitions from database

**4. Domain Layer** (`types/` + `validations/`)
- TypeScript types
- Zod schemas for validation
- Business rules and constraints
- No framework dependencies

---

## Code Standards

### TypeScript
```typescript
// ✅ GOOD
interface User {
  id: string
  email: string
  name: string | null
}

// ❌ BAD - avoid any
function getData(input: any) { }

// ✅ GOOD - explicit types
function getData(input: CreateUserInput): Promise<User> { }
```

### React Components
```typescript
// ✅ SERVER COMPONENT (default)
export default async function InvoicesPage() {
  const invoices = await getInvoices()
  return <InvoiceList invoices={invoices} />
}

// ✅ CLIENT COMPONENT (when needed)
'use client'
export function InvoiceForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  // ... interactive logic
}
```

### Server Actions
```typescript
// ✅ GOOD - actions/invoice-actions.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.number().positive(),
  dueDate: z.string().datetime()
})

export async function createInvoice(input: unknown) {
  try {
    // 1. Validate input
    const data = createInvoiceSchema.parse(input)
    
    // 2. Check auth
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')
    
    // 3. Business logic
    const invoice = await invoiceService.create(user.id, data)
    
    // 4. Revalidate cache
    revalidatePath('/dashboard/invoices')
    
    return { success: true, data: invoice }
  } catch (error) {
    console.error('Create invoice error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create invoice'
    }
  }
}
```

### Services (Business Logic)
```typescript
// ✅ GOOD - services/invoice.service.ts

import { supabase } from '@/lib/supabase/server'

export class InvoiceService {
  async create(userId: string, data: CreateInvoiceInput) {
    // Business logic here
    const invoiceNumber = this.generateInvoiceNumber()
    
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        invoice_number: invoiceNumber,
        ...data
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Side effects (email, analytics, etc.)
    await this.sendInvoiceNotification(invoice)
    
    return invoice
  }
  
  private generateInvoiceNumber(): string {
    // Complex logic isolated here
    return `INV-${Date.now()}`
  }
}

export const invoiceService = new InvoiceService()
```

### Validation (Zod)
```typescript
// ✅ GOOD - validations/invoice.schema.ts

import { z } from 'zod'

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount too large'),
  dueDate: z.string().datetime(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().int().positive(),
    price: z.number().positive()
  })).min(1, 'At least one item required')
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
```

### Database Access Patterns

#### Supabase Client (RLS Enforced)
```typescript
// ✅ GOOD - Row Level Security enforced

// Server Component
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data } = await supabase
  .from('invoices')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

// RLS automatically filters by user
```

#### Drizzle ORM (Manual Authorization Required)
```typescript
// ✅ GOOD - lib/drizzle/client.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// PgBouncer/Supavisor compatible configuration
const client = postgres(process.env.DATABASE_URL!, {
  max: 10,
  prepare: false, // Required for PgBouncer compatibility
})

export const db = drizzle(client)
```

```typescript
// ✅ GOOD - Complex query with manual auth check
import { db } from '@/lib/drizzle/client'
import { createClient } from '@/lib/supabase/server'
import { eq } from 'drizzle-orm'

export async function GET() {
  // 1. Always verify auth when using Drizzle
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 2. Manually filter by user - Drizzle bypasses RLS!
  const posts = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.userId, user.id))
    .leftJoin(commentsTable, eq(postsTable.id, commentsTable.postId))
  
  return Response.json(posts)
}
```

---

## Testing Requirements

### Write Tests for ALL Code
Every feature must include tests. No exceptions.

**Unit Tests** (services, utils)
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
})
```

**Integration Tests** (Server Actions)
```typescript
// __tests__/invoice-actions.test.ts
import { describe, it, expect } from 'vitest'
import { createInvoice } from '../actions/invoice-actions'

describe('createInvoice action', () => {
  it('creates invoice successfully', async () => {
    const result = await createInvoice({
      customerId: 'uuid',
      amount: 100,
      dueDate: '2025-12-31'
    })
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('id')
  })
})
```

**Component Tests**
```typescript
// __tests__/InvoiceForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { InvoiceForm } from '../components/InvoiceForm'

describe('InvoiceForm', () => {
  it('renders form fields', () => {
    render(<InvoiceForm />)
    expect(screen.getByLabelText('Amount')).toBeInTheDocument()
  })
  
  it('validates required fields', async () => {
    render(<InvoiceForm />)
    fireEvent.click(screen.getByText('Submit'))
    expect(await screen.findByText('Amount is required')).toBeInTheDocument()
  })
})
```

### Test Coverage Goals
- **Minimum:** 70% coverage
- **Target:** 80%+ coverage
- **Critical paths:** 100% coverage (auth, payments, data mutations)

---

## Development Workflow

### Workflow Modes

**Choose the workflow that matches your project phase:**

#### 🚀 Rapid Mode (Prototyping / Solo / MVP)
**When to use:**
- Exploring new ideas
- Building MVP or prototype
- Solo development without users yet
- Learning new technology

**Process:**
1. Work directly on `main` branch
2. Skip GitHub issues (unless you want them for your own tracking)
3. Commit frequently with clear, descriptive messages
4. Include `#issue-number` in commits IF you created an issue
5. Auto-deploy via Vercel on every push
6. Focus on speed and learning

**Commit format:**
```bash
git commit -m "feat(invoices): add invoice creation form

- Added form component with validation
- Integrated with Supabase
- Added basic error handling"

# Or if you have an issue:
git commit -m "feat(invoices): add invoice creation form (#123)"
```

#### 🏢 Production Mode (Stable App / Team / Paying Users)
**When to use:**
- App has paying customers
- Team of 2+ developers
- Stability is critical
- Compliance/audit requirements

**Process:**
1. Create GitHub issue for each feature
2. Create feature branch from `main`
3. Reference issue in branch name: `feature/123-invoice-creation`
4. Make commits with issue reference: `feat(invoices): add form (#123)`
5. Open PR when ready
6. Code review required
7. Merge to `main` after approval

**Branch naming:**
```bash
feature/123-invoice-creation
fix/456-invoice-validation
refactor/789-invoice-service
```

**Commit format with issue:**
```bash
git commit -m "feat(invoices): add invoice creation form (#123)

- Implements user story from #123
- Added comprehensive validation
- Includes unit and integration tests
- Updated documentation"
```

### 📌 Current Recommendation
**Start with Rapid Mode** → Switch to Production Mode when:
- You have first paying customer
- You add a team member
- Stability becomes more important than speed

---

### Iterative Development
Build features in small, testable increments. Each increment should be:
1. **Plannable** - Clear goal and scope
2. **Testable** - Can write tests
3. **Reviewable** - Fits in one PR (if using PRs)
4. **Deployable** - Can ship independently

### Feature Development Process (Production Mode)

**Step 1: Plan**
```bash
# Create GitHub issue with:
- User story
- Acceptance criteria
- Technical approach
- Test plan
```

**Step 2: Create Feature Branch**
```bash
git checkout -b feature/123-invoice-creation
```

**Step 3: Implement (TDD approach)**
```bash
# 1. Write types
touch features/invoices/types/invoice.types.ts

# 2. Write validation schema
touch features/invoices/validations/invoice.schema.ts

# 3. Write tests FIRST
touch features/invoices/__tests__/invoice.service.test.ts

# 4. Implement service
touch features/invoices/services/invoice.service.ts

# 5. Write Server Action
touch features/invoices/actions/invoice-actions.ts

# 6. Write component tests
touch features/invoices/__tests__/InvoiceForm.test.tsx

# 7. Implement UI
touch features/invoices/components/InvoiceForm.tsx
```

**Step 4: Validate Quality**
```bash
# Run tests
pnpm test

# Run linting
pnpm lint

# Type check
pnpm type-check

# Full validation
pnpm validate  # runs all of the above
```

**Step 5: Commit & Push**
```bash
# Commits trigger pre-commit hooks
git add .

# Production Mode (with issue reference)
git commit -m "feat(invoices): add invoice creation (#123)"

# Rapid Mode (descriptive message)
git commit -m "feat(invoices): add invoice creation with validation"

# Push (adjust branch name based on mode)
git push origin feature/123-invoice-creation  # Production
git push origin main                          # Rapid
```

**Step 6: Pull Request**
- Create PR with description
- Link to GitHub issue
- Request review
- CI runs automatically

**Step 7: Deploy**
- Merge to main → auto-deploy to production (Vercel)
- Monitor Sentry for errors
- Check analytics

---

## Monorepo Structure

```
my-saas-monorepo/
├── apps/
│   ├── template/              # Base template app
│   │   ├── features/
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   └── drizzle/
│   │   ├── app/
│   │   └── package.json
│   │
│   ├── invoice-saas/          # First SaaS product
│   └── crm-saas/              # Future SaaS product
│
├── packages/
│   ├── ui/                    # Shared UI components
│   │   ├── src/
│   │   │   ├── button.tsx
│   │   │   ├── form.tsx
│   │   │   └── card.tsx
│   │   └── package.json
│   │
│   ├── auth/                  # Shared auth logic
│   │   ├── src/
│   │   │   ├── middleware.ts
│   │   │   ├── session.ts
│   │   │   └── utils.ts
│   │   └── package.json
│   │
│   ├── database/              # Shared DB schemas
│   │   ├── src/
│   │   │   ├── schema.ts
│   │   │   └── migrations/
│   │   └── package.json
│   │
│   ├── typescript-config/     # Shared tsconfig
│   └── eslint-config/         # Shared ESLint config
│
├── turbo.json                 # Turborepo config
├── package.json               # Root package.json
├── pnpm-workspace.yaml        # Workspace config
└── CLAUDE.md                  # This file
```

### Shared Packages Best Practices

**UI Package** - Only presentational components
```typescript
// packages/ui/src/button.tsx
export function Button({ children, ...props }) {
  return (
    <button
      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      {...props}
    >
      {children}
    </button>
  )
}
```

**Auth Package** - Reusable auth logic
```typescript
// packages/auth/src/middleware.ts
export function createAuthMiddleware(config) {
  return async function authMiddleware(req) {
    // Shared auth logic here
  }
}
```

---

## Commands Reference

### Development
```bash
# Start all apps
pnpm dev

# Start specific app
pnpm dev --filter=invoice-saas

# Build all
pnpm build

# Build specific app
pnpm build --filter=invoice-saas
```

### Testing
```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e
```

### Quality Checks
```bash
# Lint
pnpm lint
pnpm lint:fix

# Format
pnpm format
pnpm format:check

# Type check
pnpm type-check

# Full validation (pre-commit)
pnpm validate
```

### Database (Supabase + Drizzle)

**Supabase Commands:**
```bash
# Generate TypeScript types from database
pnpm supabase gen types typescript --project-id xxxxx > types/database.ts

# Reset local database
pnpm supabase db reset
```

**Drizzle Migration Workflow (Recommended for Teams):**
```bash
# 1. Update your schema in src/lib/drizzle/schema.ts
# 2. Generate migration files
pnpm drizzle-kit generate

# 3. Review generated SQL in drizzle/migrations/
# 4. Apply migrations to database
pnpm drizzle-kit migrate

# Alternative: Pull existing schema from database
pnpm drizzle-kit introspect
```

**Drizzle Push (Quick iteration, solo dev):**
```bash
# Push schema changes directly without creating migration files
# ⚠️ Use with caution - no migration history
pnpm drizzle-kit push
```

**Migration Strategy Decision:**
- **Teams / Production:** Use `generate` → `migrate` for version-controlled migrations
- **Solo / Prototyping:** Use `push` for quick iteration
- **Never mix:** Choose one approach per project

---

## Git Workflow

### Branch Naming (Production Mode)
```bash
feature/123-invoice-creation    # With issue number
fix/456-invoice-validation      # Bug fix with issue
refactor/789-invoice-service    # Refactor with issue
docs/update-readme              # No issue needed for docs
```

### Branch Naming (Rapid Mode)
```bash
main    # Work directly on main
```

### Commit Messages

**Format:** `type(scope): description (#issue)`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding tests
- `docs`: Documentation
- `chore`: Maintenance tasks

**Examples with issue reference (Production Mode):**
```bash
feat(invoices): add invoice creation form (#123)
fix(auth): resolve login redirect issue (#456)
refactor(ui): extract button component (#789)
docs: update API documentation
test(invoices): add invoice service tests (#123)
chore: update dependencies
```

**Examples without issue reference (Rapid Mode):**
```bash
feat(invoices): add invoice creation form

- Added form validation with Zod
- Integrated with Supabase
- Added loading states

fix(auth): resolve login redirect issue
refactor(ui): extract button component to shared package
```

**Best Practice for Issue References:**
- Production Mode: **Always include `(#123)`** if issue exists
- Rapid Mode: **Optional** - only if you created an issue for tracking
- Benefits:
  - Automatic linking in GitHub
  - Easy to find related code changes
  - Audit trail for compliance
  - Great for `git log` searching: `git log --grep="#123"`

### Pre-commit Hooks (Husky)
Automatically runs before each commit:
1. ESLint
2. Prettier
3. TypeScript check
4. Unit tests for changed files

---

## Environment Variables

### Required (All Apps)
```bash
# Supabase (Client-side - Public, safe for browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Drizzle ORM Database URLs
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
DIRECT_DATABASE_URL=postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require

# App URL
NEXT_PUBLIC_APP_URL=https://app.example.com

# Sentry
SENTRY_DSN=xxx
```

**Database Connection Strategy:**
- `DATABASE_URL` (port 6543): Pooled connection via Supavisor - use for runtime Drizzle queries
- `DIRECT_DATABASE_URL` (port 5432): Direct connection to database host - use ONLY for migrations and maintenance
- `?sslmode=require`: Required by Supabase for all connections

**Security Notes:**
- **Supabase Anon Key:** Use for client-side and most server operations (respects RLS)
- **Drizzle connections:** Check your RLS policies - Drizzle bypasses Supabase auth layer
- **NEVER** expose database passwords to client

### Server-only (Restricted / Optional)
```bash
# Use ONLY for admin tasks, webhooks, and background jobs (bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY=xxx
```

**⚠️ Critical Security Warning:**
- Service Role Key **bypasses ALL Row Level Security policies**
- Should ONLY be used in:
  - Admin panels with proper authorization
  - Background jobs and cron tasks
  - Webhook handlers
  - Batch operations
- NEVER use in regular app code
- NEVER expose to client-side
- Keep out of most apps - only add where absolutely necessary

### Optional (per app needs)
```bash
# Stripe
STRIPE_SECRET_KEY=xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=xxx

# Email
RESEND_API_KEY=xxx

# Analytics
POSTHOG_API_KEY=xxx
```

---

## Deployment

### Vercel (Automatic)
1. Connect GitHub repo to Vercel
2. Configure project:
   - Root Directory: `apps/invoice-saas`
   - Build Command: `pnpm turbo run build --filter=invoice-saas`
   - Install Command: `pnpm install`
3. Add environment variables
4. Deploy on push to `main`

### Preview Deployments
- Every PR gets preview deployment
- Test before merging
- Share with team/stakeholders

---

## Working with Claude Code

### Initial Setup
**First prompt - Always start with context:**
```bash
> Context: Building [your SaaS name] in Turborepo monorepo.
  Read CLAUDE.md for all architecture decisions and patterns.
  Current workflow mode: [Rapid/Production]
  
  Goal: [your task]
```

### When Starting New Feature (Production Mode)
```bash
> Context: Building invoice SaaS in Turborepo monorepo.
  Reference: CLAUDE.md for architecture patterns.
  Workflow: Production Mode
  
  Goal: Implement invoice creation feature for GitHub issue #123.
  
  Steps:
  1. Create feature branch: feature/123-invoice-creation
  2. Create feature structure in features/invoices/
  3. Define TypeScript types
  4. Create Zod validation schemas
  5. Write service tests FIRST (TDD)
  6. Implement InvoiceService
  7. Create Server Action
  8. Build UI components
  9. Add integration tests
  10. Commit with issue reference: "feat(invoices): add invoice creation (#123)"
  
  Follow the exact structure in CLAUDE.md.
  Write tests for everything.
  Start with step 1.
```

### When Starting New Feature (Rapid Mode)
```bash
> Context: Building invoice SaaS in Turborepo monorepo.
  Reference: CLAUDE.md for architecture patterns.
  Workflow: Rapid Mode (work on main, skip issues)
  
  Goal: Implement invoice creation feature.
  
  Quick iteration approach:
  1. Create feature structure in features/invoices/
  2. Define types and validation
  3. Write basic tests (focus on critical paths)
  4. Implement service and Server Action
  5. Build UI components
  6. Commit to main with clear message
  
  Prioritize speed and learning over process.
  Start with step 1.
```

### Iterative Development
```bash
> Implement step 1: Create feature structure.
  Show me the file tree you'll create.

[Claude shows structure]

> Looks good, proceed.

[Claude creates files]

> Now step 2: Define TypeScript types for Invoice entity.
  Follow the patterns in CLAUDE.md.
```

### Quality Checks
```bash
> Before we commit, run:
  1. pnpm lint
  2. pnpm type-check
  3. pnpm test
  
  Show me results and fix any issues.
```

---

## Security Best Practices

### Row Level Security (RLS)
Always enable RLS on all tables:
```sql
-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users see only their own data
CREATE POLICY "Users view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

-- Users create only for themselves
CREATE POLICY "Users create own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Supabase vs Drizzle - When to Use What

**Supabase Client (respects RLS automatically):**
```typescript
'use client'
// ✅ Client Components
// ✅ Simple CRUD operations  
// ✅ When RLS policies handle authorization
// ✅ Realtime subscriptions

const { data } = await supabase
  .from('posts')
  .select('*')
  // RLS automatically filters by user!
```

**Drizzle ORM (direct PostgreSQL access):**
```typescript
// ✅ Complex queries (joins, aggregations, subqueries)
// ✅ Batch operations
// ✅ Better TypeScript inference
// ✅ Server-side only (Node.js runtime)
// ⚠️ Must handle authorization manually!

const posts = await db
  .select()
  .from(postsTable)
  .where(eq(postsTable.userId, userId)) // Manual filtering required!
  .leftJoin(commentsTable, eq(postsTable.id, commentsTable.postId))
```

**Critical Security Rule:**
- When using Drizzle, YOU are responsible for authorization
- Always verify user identity before Drizzle queries
- Drizzle bypasses Supabase's RLS layer
- Consider using both: Supabase client for auth check + Drizzle for complex query

### Environment Variables
```typescript
// ❌ BAD - exposed to client
STRIPE_SECRET_KEY=xxx

// ✅ GOOD - server-only
// Access only in Server Actions or Server Components
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```

---

## Performance Optimization

### Server Components by Default
```typescript
// ✅ GOOD - Server Component (default)
export default async function InvoicePage() {
  const invoices = await getInvoices()
  return <InvoiceList invoices={invoices} />
}

// Only use 'use client' when necessary
```

### Dynamic Imports for Heavy Components
```typescript
// ✅ GOOD - lazy load chart library
const Chart = dynamic(() => import('./Chart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false
})
```

### Caching Strategies
```typescript
// Static (rebuilt on deploy)
export const revalidate = false

// ISR (revalidate every hour)
export const revalidate = 3600

// Dynamic (always fresh)
export const dynamic = 'force-dynamic'
```

---

## Common Patterns

### Loading States
```typescript
// Server Component with Suspense
<Suspense fallback={<InvoiceListSkeleton />}>
  <InvoiceList />
</Suspense>

// Client Component with state
const [loading, setLoading] = useState(false)
```

### Error Handling
```typescript
// Server Action
return { success: false, error: 'User friendly message' }

// Try-catch in components
try {
  await action()
} catch (error) {
  toast.error('Something went wrong')
  console.error(error)
}
```

### Form Handling
```typescript
// With Server Actions (recommended)
<form action={createInvoiceAction}>
  <input name="amount" />
  <button type="submit">Create</button>
</form>

// With React Hook Form (complex forms)
const { register, handleSubmit } = useForm()
```

---

## Notes for Claude

1. **Always reference this file** for architecture decisions
2. **Learn from next-forge**: When implementing patterns, check how next-forge solves similar problems (monorepo structure, shared packages, testing) - but adapt to our Supabase + Drizzle stack
3. **Ask before deviating** from patterns
4. **Write tests** alongside implementation
5. **Keep features isolated** - no cross-feature dependencies
6. **Show me the plan** before implementing large changes
7. **Run validation** before committing
8. **Suggest improvements** to this document when you spot issues
9. **Security first**: Always check auth before using Drizzle, use Supabase client when RLS is sufficient

---

## Success Metrics

- ✅ All tests passing
- ✅ 80%+ test coverage
- ✅ Zero ESLint errors
- ✅ Zero TypeScript errors
- ✅ Fast build times (<2 min with cache)
- ✅ Lighthouse score >90
- ✅ Core Web Vitals: Good
- ✅ No RLS bypasses without explicit auth checks

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Turborepo Docs](https://turborepo.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [Vitest Docs](https://vitest.dev)
- [Playwright Docs](https://playwright.dev)

---

**Last Updated:** October 2025  
**Version:** 1.1.0 (Production-Ready with Security Fixes)  
**Status:** Production Ready
