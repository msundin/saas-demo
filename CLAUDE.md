# Production SaaS Monorepo - CLAUDE.md

## Project Overview

**Type:** Turborepo monorepo for multiple SaaS applications
**Purpose:** Rapid SaaS development with maximum code reuse
**Philosophy:** Feature-based architecture, iterative development, test-driven

## 🚀 Current Configuration

**Workflow Mode:** **RAPID MODE**
**Active Since:** October 19, 2025

**What this means:**
- ⚡ Streamlined **PROCESS** (no PRs, no issues, work on main)
- ⚡ Fast iteration (commit and deploy frequently)
- ✅ **SAME quality standards** (80%+ tests, TDD, security)
- ✅ Work directly on `main` branch
- ✅ Skip GitHub issues (create only if needed)
- ✅ Auto-deploy on every push

**Quality Non-Negotiables (Always Apply):**
- ✅ TDD for critical paths (auth, payments, mutations)
- ✅ 80%+ test coverage
- ✅ All security checks (RLS, validation)
- ✅ TypeScript strict mode
- ✅ Accessibility standards

**Philosophy:** Skip bureaucracy, NOT quality. Move fast with confidence.

**Switch to Production Mode when:**
- First paying customer acquired
- Team member added
- Need code review process

---

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
- **Next.js 15** (App Router, Server Components, Server Actions, PPR)
  - Partial Prerendering (PPR) for optimal performance
  - `use cache` directive for simplified caching
  - Enhanced Forms with `next/form` component
  - Server Actions for mutations
- **TypeScript 5+** (strict mode, no `any` types)
- **React 19** (with Server Components)
- **Tailwind CSS** (utility-first styling)

**Next.js 15 Key Features:**
```typescript
// ✅ Partial Prerendering (PPR) - Enable in next.config.js
export const experimental_ppr = true

// ✅ use cache directive (replaces some React Query needs)
'use cache'
export async function getInvoices() {
  // Cached at function level
}

// ✅ Enhanced Forms (next/form component)
import { Form } from 'next/form'
<Form action="/search">
  <input name="query" />
</Form>
```

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

### UI Components
- **Shadcn UI** (copy-paste components, full ownership)
- **Radix UI** (accessible primitives underneath)
- **CVA** (class-variance-authority for component variants)
- **Tailwind Merge** (for className conflicts)
- **Lucide Icons** (icon library)

**Component Philosophy:**
- Copy-paste, don't install as dependency
- Full control over component code
- Accessible by default via Radix UI
- Customize freely for each app

### State Management
- **Server State:** React Server Components (primary)
- **Client State (simple):** useState, useReducer
- **Client State (complex):** Zustand (recommended over Redux)
- **Form State:** React Hook Form + Zod
- **URL State:** nuqs library (type-safe search params)

**State Management Strategy:**
```typescript
// ✅ GOOD - Server state via RSC
export default async function Page() {
  const data = await fetchData() // Server state
  return <Component data={data} />
}

// ✅ GOOD - Client state with Zustand (for complex state)
import { create } from 'zustand'

const useStore = create((set) => ({
  cart: [],
  addItem: (item) => set((state) => ({ cart: [...state.cart, item] }))
}))

// ✅ GOOD - URL state with nuqs
import { useQueryState } from 'nuqs'

const [search, setSearch] = useQueryState('search')
```

### Background Jobs & Async Tasks
- **Inngest** (recommended) - Type-safe background jobs
- **Trigger.dev** (alternative) - Developer-first job framework
- **Supabase Edge Functions** (lighter tasks, webhooks)
- **Vercel Cron Jobs** (scheduled tasks)

**Use cases:**
- Email sending (avoid blocking requests)
- Data processing and exports
- Webhook processing
- Scheduled reports
- Database cleanup tasks

**Example (Inngest):**
```typescript
// lib/inngest/client.ts
import { Inngest } from 'inngest'

export const inngest = new Inngest({ id: 'my-app' })

// lib/inngest/functions/send-invoice.ts
export const sendInvoice = inngest.createFunction(
  { id: 'send-invoice' },
  { event: 'invoice.created' },
  async ({ event, step }) => {
    const invoice = await step.run('fetch-invoice', async () => {
      return fetchInvoice(event.data.invoiceId)
    })

    await step.run('send-email', async () => {
      return sendEmail(invoice)
    })
  }
)
```

### Monorepo
- **Turborepo** (build system)
- **pnpm** (package manager)
- **Workspace structure:** apps/* and packages/*

### Deployment & Infrastructure
- **Hosting:** Vercel (automatic deployments)
- **Payments:** Stripe (when needed)

### Observability & Monitoring
- **Error Tracking:** Sentry (exceptions, performance)
- **Logging:** Axiom or Logflare (structured logs)
- **Analytics:** PostHog (product analytics + feature flags)
- **Real User Monitoring:** Vercel Web Analytics
- **Database Monitoring:** Supabase Dashboard + custom metrics
- **Tracing:** OpenTelemetry (optional, for distributed tracing)
- **Uptime Monitoring:** Better Uptime or Checkly

**Observability Strategy:**
```typescript
// ✅ Structured logging
import { logger } from '@/lib/logger'

logger.info('Invoice created', {
  invoiceId: invoice.id,
  userId: user.id,
  amount: invoice.amount
})

// ✅ Error tracking with context
Sentry.captureException(error, {
  tags: { feature: 'invoices' },
  extra: { invoiceId }
})

// ✅ Custom metrics
analytics.track('Invoice Created', {
  amount: invoice.amount,
  currency: 'USD'
})
```

### Testing & Quality
- **Unit Tests:** Vitest
- **Integration Tests:** Playwright
- **E2E Tests:** Playwright
- **Linting:** ESLint + TypeScript ESLint
- **Formatting:** Prettier
- **Pre-commit:** Husky + lint-staged

---

## Getting Started

### Local Development Setup

**Prerequisites:**
- Node.js 20+ and pnpm installed
- Supabase account (free tier works)
- Git for version control

**Initial Setup:**
```bash
# 1. Clone repository (or create new monorepo)
git clone <your-repo-url>
cd saas-monorepo

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp apps/template/.env.example apps/template/.env.local

# 4. Setup Supabase locally (optional but recommended)
pnpm supabase init
pnpm supabase start

# 5. Configure environment variables
# Edit apps/template/.env.local with your Supabase credentials

# 6. Generate database types
pnpm supabase gen types typescript --local > apps/template/types/database.ts

# 7. Run database migrations
cd apps/template
pnpm drizzle-kit migrate

# 8. Start development server
cd ../..
pnpm dev --filter=template
```

**Accessing the app:**
- App: http://localhost:3000
- Supabase Studio: http://localhost:54323

**Common Setup Issues:**

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | Change port in package.json: `"dev": "next dev -p 3001"` |
| Supabase connection error | Check DATABASE_URL and SUPABASE_URL in .env.local |
| TypeScript errors on start | Run `pnpm type-check` to see full errors |
| Module not found | Clear cache: `rm -rf .next node_modules && pnpm install` |

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

**What "Rapid" means:**
- ⚡ **Streamlined PROCESS** (no PRs, no issues, work on main)
- ⚡ **Fast iteration** (commit and deploy frequently)
- ⚠️ **NOT** lower code quality or fewer tests!

**Process:**
1. Work directly on `main` branch
2. Skip GitHub issues (unless you want them for your own tracking)
3. **Write tests first** (TDD for all critical paths)
4. Commit frequently with clear, descriptive messages
5. Include `#issue-number` in commits IF you created an issue
6. Auto-deploy via Vercel on every push
7. Focus on speed AND quality

**Quality Standards (SAME as Production Mode):**
- ✅ 80%+ test coverage
- ✅ TDD for critical features (auth, payments, mutations)
- ✅ All security checks (RLS, validation, auth)
- ✅ TypeScript strict mode
- ✅ Zero ESLint errors
- ✅ Accessibility requirements met

**The difference is PROCESS, not QUALITY:**
- Rapid Mode = Skip bureaucracy, move fast
- Production Mode = Add process for team coordination
- Both modes = Same code quality standards

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

### Multi-Tenancy Pattern (Organizations/Workspaces)

Most B2B SaaS requires team-based access, not just individual users.

**Database Schema:**
```sql
-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members (junction table)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Invoices now belong to organizations
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  amount DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team-based access
CREATE POLICY "Users view organizations they belong to"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team members view team invoices"
  ON invoices FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

**TypeScript Types:**
```typescript
// types/organization.types.ts
export type OrganizationRole = 'owner' | 'admin' | 'member'

export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: OrganizationRole
  created_at: string
}
```

**Helper Functions:**
```typescript
// lib/auth/organization.ts
export async function getCurrentOrganization(
  organizationId: string
): Promise<Organization | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single()

  return data
}

export async function hasOrganizationAccess(
  userId: string,
  organizationId: string,
  requiredRole?: OrganizationRole
): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)

  if (requiredRole) {
    const roleHierarchy = { owner: 3, admin: 2, member: 1 }
    query = query.gte('role', roleHierarchy[requiredRole])
  }

  const { data } = await query.single()
  return !!data
}
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

### Rate Limiting
Protect your API routes and Server Actions:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
})

// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // Process webhook...
}
```

---

## Common SaaS Patterns

### Webhooks (Receiving)
```typescript
// app/api/webhooks/stripe/route.ts
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return Response.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
      const subscription = event.data.object
      // Update database
      await updateSubscription(subscription)
      break

    case 'invoice.payment_succeeded':
      // Send invoice email
      await sendInvoiceEmail(event.data.object)
      break
  }

  return Response.json({ received: true })
}
```

### File Uploads (Supabase Storage)
```typescript
// actions/upload-actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadFile(formData: FormData) {
  const supabase = await createClient()
  const file = formData.get('file') as File

  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  // Validate file type and size
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type' }
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { success: false, error: 'File too large' }
  }

  // Upload to Supabase Storage
  const fileName = `${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    return { success: false, error: error.message }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(fileName)

  return { success: true, url: publicUrl }
}
```

### Email (Resend + React Email)
```typescript
// lib/email/client.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

// emails/invoice-created.tsx
import { Html, Button, Container, Heading, Text } from '@react-email/components'

export function InvoiceCreatedEmail({ invoiceNumber, amount, dueDate }) {
  return (
    <Html>
      <Container>
        <Heading>New Invoice Created</Heading>
        <Text>Invoice #{invoiceNumber} for ${amount}</Text>
        <Text>Due: {dueDate}</Text>
        <Button href={`https://app.example.com/invoices/${invoiceNumber}`}>
          View Invoice
        </Button>
      </Container>
    </Html>
  )
}

// actions/invoice-actions.ts
import { resend } from '@/lib/email/client'
import { InvoiceCreatedEmail } from '@/emails/invoice-created'

async function sendInvoiceEmail(invoice: Invoice) {
  await resend.emails.send({
    from: 'noreply@example.com',
    to: invoice.customer_email,
    subject: `Invoice #${invoice.number}`,
    react: InvoiceCreatedEmail({
      invoiceNumber: invoice.number,
      amount: invoice.amount,
      dueDate: invoice.due_date
    })
  })
}
```

### Feature Flags
```typescript
// lib/feature-flags.ts
import { posthog } from '@/lib/posthog'

export async function isFeatureEnabled(
  featureKey: string,
  userId: string
): Promise<boolean> {
  return posthog.isFeatureEnabled(featureKey, userId)
}

// components/new-dashboard.tsx
'use client'

export function Dashboard({ userId }: { userId: string }) {
  const [showNewDashboard, setShowNewDashboard] = useState(false)

  useEffect(() => {
    isFeatureEnabled('new-dashboard', userId).then(setShowNewDashboard)
  }, [userId])

  if (showNewDashboard) {
    return <NewDashboard />
  }

  return <OldDashboard />
}
```

---

## Accessibility

### Accessibility Requirements

All features must meet WCAG 2.1 AA standards:

**1. Keyboard Navigation**
- All interactive elements accessible via keyboard
- Logical tab order
- Visible focus indicators
- Escape key closes modals/dropdowns

**2. Screen Reader Support**
- Semantic HTML (`<nav>`, `<main>`, `<article>`)
- ARIA labels where needed
- Alt text for images
- Form labels properly associated

**3. Color & Contrast**
- Minimum 4.5:1 contrast for normal text
- Minimum 3:1 for large text
- Don't rely on color alone
- Support for dark mode

**4. Forms**
- Clear labels for all inputs
- Error messages announced to screen readers
- Validation feedback visible and audible

**Example:**
```typescript
// ✅ GOOD - Accessible button
<button
  type="button"
  aria-label="Close modal"
  onClick={handleClose}
  className="focus:ring-2 focus:ring-blue-500"
>
  <XIcon className="h-5 w-5" aria-hidden="true" />
</button>

// ✅ GOOD - Accessible form
<form>
  <label htmlFor="email" className="block text-sm font-medium">
    Email Address
  </label>
  <input
    id="email"
    name="email"
    type="email"
    aria-required="true"
    aria-invalid={!!error}
    aria-describedby={error ? "email-error" : undefined}
  />
  {error && (
    <p id="email-error" role="alert" className="text-red-600">
      {error}
    </p>
  )}
</form>
```

**Tools:**
- **Testing:** axe DevTools, Lighthouse
- **Screen readers:** NVDA (Windows), VoiceOver (Mac)
- **Components:** Radix UI handles most accessibility automatically

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

// Next.js 15: use cache directive
'use cache'
export async function getInvoices() {
  // Function-level caching
}
```

### Image Optimization
```typescript
// ✅ GOOD - Use Next.js Image component
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // for LCP images
  placeholder="blur"
/>
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm build

      # Enable Turborepo Remote Caching
      - name: Setup Turborepo cache
        uses: actions/cache@v3
        with:
          path: .turbo
          key: ${{ runner.os }}-turbo-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-turbo-

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm playwright install --with-deps
      - run: pnpm test:e2e

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Vercel Deployment
- Automatic preview deployments for PRs
- Production deployments on merge to main
- Turborepo remote caching enabled
- Environment variables configured in Vercel dashboard

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
4. **Write tests FIRST** - TDD for all critical paths, 80%+ coverage in ALL modes
5. **Keep features isolated** - no cross-feature dependencies
6. **Show me the plan** before implementing large changes
7. **Run validation** before committing
8. **Proactively suggest improvements** - Challenge patterns, suggest better approaches, propose tech stack improvements
9. **Security first**: Always check auth before using Drizzle, use Supabase client when RLS is sufficient

### 🎯 Your Mission: Maximum Efficiency & Correctness

**You should actively suggest improvements to:**
- **Process:** Better workflows, faster feedback loops, reduced friction
- **Architecture:** Simpler patterns, better separation of concerns, more maintainable code
- **Tech Stack:** Better libraries, new tools, performance improvements
- **Testing:** Better test strategies, faster test execution, higher confidence
- **DX:** Better developer experience, clearer documentation, easier onboarding

**When you spot:**
- 🔴 Patterns that cause bugs → Suggest safer alternatives
- 🐌 Slow workflows → Propose faster approaches
- 🤔 Confusing architecture → Recommend simplifications
- 📚 Better libraries/tools → Explain benefits and propose adoption
- ⚠️ Technical debt → Flag it and suggest when/how to address it

**Philosophy:**
- **Speak up early** - Don't wait until it's a problem
- **Be specific** - "Use X instead of Y because..." with examples
- **Balance trade-offs** - Explain pros/cons, let user decide
- **Challenge assumptions** - Including patterns in this document

This is a living codebase. Your insights make it better. 🚀

---

## Success Metrics

### Code Quality
- ✅ All tests passing
- ✅ 80%+ test coverage
- ✅ Zero ESLint errors
- ✅ Zero TypeScript errors
- ✅ No RLS bypasses without explicit auth checks

### Performance
- ✅ Fast build times (<2 min with Turborepo cache)
- ✅ Lighthouse score >90
- ✅ Core Web Vitals: Good (LCP <2.5s, FID <100ms, CLS <0.1)
- ✅ Time to First Byte (TTFB) <600ms

### Accessibility
- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation working
- ✅ Screen reader tested
- ✅ 4.5:1 color contrast minimum

### Security
- ✅ All RLS policies tested
- ✅ No secrets in client-side code
- ✅ Rate limiting on public endpoints
- ✅ CSRF protection on forms
- ✅ Input validation on all Server Actions

---

## Resources

### Core Technologies
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Backend & Database
- [Supabase Docs](https://supabase.com/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

### Tooling
- [Turborepo Docs](https://turborepo.com/docs)
- [pnpm Docs](https://pnpm.io)
- [Vitest Docs](https://vitest.dev)
- [Playwright Docs](https://playwright.dev)

### UI & Accessibility
- [Shadcn UI](https://ui.shadcn.com)
- [Radix UI](https://www.radix-ui.com)
- [Lucide Icons](https://lucide.dev)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref)

### Services
- [Stripe Docs](https://stripe.com/docs)
- [Resend Docs](https://resend.com/docs)
- [React Email](https://react.email)
- [Inngest Docs](https://www.inngest.com/docs)
- [PostHog Docs](https://posthog.com/docs)
- [Sentry Docs](https://docs.sentry.io)

### Learning Resources
- [next-forge (reference template)](https://github.com/vercel/next-forge)
- [Next.js Learn](https://nextjs.org/learn)
- [Patterns.dev](https://www.patterns.dev)

---

**Last Updated:** October 2025
**Version:** 2.0.0 (2025 Best Practices)
**Status:** Production Ready
