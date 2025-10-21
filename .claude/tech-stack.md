# Tech Stack (October 2025)

## Reference Architecture

**Inspiration:** [next-forge by Vercel](https://github.com/vercel/next-forge) - A production-grade Turborepo template

**What we adopt from next-forge:**

- ✅ Monorepo structure (apps/_ and packages/_)
- ✅ Shared packages pattern
- ✅ Testing approaches
- ✅ Documentation style

**What we adapt for our stack:**

- 🔄 Supabase instead of Prisma + Neon
- 🔄 Supabase Auth instead of Clerk
- 🔄 Supabase client for app CRUD (RLS) + Drizzle for server-only complex queries

---

## Core Framework

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

---

## Backend & Database

- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
  - PostgreSQL with Row Level Security (RLS)
  - Auto-generated REST APIs (for client-side)
  - Realtime subscriptions
  - Connection pooling via Supavisor (PgBouncer)

**Database Access Strategy:**

- **Client-side & Server Components:** Supabase JavaScript client (respects RLS automatically)
- **Server-side complex queries:** Drizzle ORM with direct PostgreSQL access (manual auth required)
- **Migrations:** Supabase migrations (SQL files - single source of truth)
- **Type generation:** Drizzle Kit introspect (auto-generates from database)

**Schema Management Workflow (DB-First):**

```bash
# 1. Create migration with table + RLS policies
pnpm supabase migration new add_feature

# 2. Write SQL (tables, indexes, RLS policies)
# supabase/migrations/xxxxx_add_feature.sql

# 3. Apply migration
pnpm supabase db reset

# 4. Auto-generate Drizzle schema from database
pnpm exec dotenv -e .env.local -- drizzle-kit introspect

# 5. Copy generated schema (guaranteed to match DB)
cp drizzle/migrations/schema.ts src/lib/drizzle/schema.ts

# 6. Add type exports manually
# export type MyTable = typeof myTable.$inferSelect
```

**Why This Workflow:**

- ✅ Supabase migrations handle RLS policies (Drizzle cannot write RLS)
- ✅ Database is single source of truth
- ✅ Drizzle schema guaranteed to match DB (via introspect)
- ✅ Zero schema drift
- ✅ Type safety for server-side queries

**Important Runtime Requirements:**

- Drizzle ORM requires **Node.js runtime** (NOT Edge runtime)
- Use Supabase client in Edge runtime if needed
- **PgBouncer compatibility:** Use `prepare: false` in Drizzle client config
- **Always check auth when using Drizzle** - it bypasses RLS!

---

## Authentication

- **Primary:** Supabase Auth (email/password + OAuth)
- **Alternative:** Clerk (if advanced features needed)

---

## UI Components

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

---

## State Management

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

---

## Background Jobs & Async Tasks

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
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "my-app" });

// lib/inngest/functions/send-invoice.ts
export const sendInvoice = inngest.createFunction(
  { id: "send-invoice" },
  { event: "invoice.created" },
  async ({ event, step }) => {
    const invoice = await step.run("fetch-invoice", async () => {
      return fetchInvoice(event.data.invoiceId);
    });

    await step.run("send-email", async () => {
      return sendEmail(invoice);
    });
  },
);
```

---

## Monorepo

- **Turborepo** (build system)
- **pnpm** (package manager)
- **Workspace structure:** apps/_ and packages/_

---

## Deployment & Infrastructure

- **Hosting:** Vercel (automatic deployments)
- **Payments:** Stripe (when needed)

---

## Observability & Monitoring

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
import { logger } from "@/lib/logger";

logger.info("Invoice created", {
  invoiceId: invoice.id,
  userId: user.id,
  amount: invoice.amount,
});

// ✅ Error tracking with context
Sentry.captureException(error, {
  tags: { feature: "invoices" },
  extra: { invoiceId },
});

// ✅ Custom metrics
analytics.track("Invoice Created", {
  amount: invoice.amount,
  currency: "USD",
});
```

---

## Testing & Quality

- **Unit Tests:** Vitest
- **Integration Tests:** Playwright
- **E2E Tests:** Playwright
- **Linting:** ESLint + TypeScript ESLint
- **Formatting:** Prettier
- **Pre-commit:** Husky + lint-staged

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
