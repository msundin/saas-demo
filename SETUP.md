# Setup Guide

## Initial Installation

This monorepo was set up on **October 20, 2025** with the complete tech stack.

## Tech Stack Installed

- **Monorepo:** Turborepo 2.3.3 + pnpm 10.18.3
- **Framework:** Next.js 15.5.6 + React 19.1.0 + TypeScript 5+
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (local) + Drizzle ORM 0.44.6
- **UI:** Shadcn UI (Radix primitives + CVA)
- **Testing:** Vitest 3.2.4 + Playwright 1.56.1
- **Quality:** ESLint + Prettier + Husky + lint-staged

## ⚠️ Important Workarounds

### Supabase + Colima on macOS

**Issue:** Supabase CLI's `vector` service requires Docker socket mounting which doesn't work with Colima on macOS.

**Solution:** Skip the vector service when starting Supabase:

```bash
supabase start -x vector --workdir apps/template
```

**What you lose:** Local analytics/logging (Vector service)
**Impact:** None for development - all other services work perfectly

**Alternative:** Use Docker Desktop instead of Colima (but it's heavier)

## Running Locally

### Prerequisites

- Node.js 20+
- pnpm 9+ (installed globally)
- Colima (lightweight Docker runtime)

### Start Development

**1. Start Colima (if not running):**

```bash
colima start
```

**2. Start Supabase:**

```bash
cd apps/template
supabase start -x vector
```

This will output:

- API URL: http://127.0.0.1:54321
- Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- Studio: http://127.0.0.1:54323
- Mailpit: http://127.0.0.1:54324

**3. Start Next.js dev server:**

```bash
pnpm --filter=template dev
```

Access app at http://localhost:3000

## Environment Variables

All environment variables are in `apps/template/.env.local` (generated during setup):

```bash
# Public (safe for client)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Server-only
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
DIRECT_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## Database Workflow

### Create a new table

**1. Define schema in `src/lib/drizzle/schema.ts`:**

```typescript
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**2. Generate migration:**

```bash
pnpm --filter=template db:generate
```

**3. Apply migration:**

```bash
pnpm --filter=template db:migrate
```

**4. Verify in Drizzle Studio:**

```bash
pnpm --filter=template db:studio
```

### Quick iteration (no migrations)

For rapid prototyping:

```bash
pnpm --filter=template db:push
```

⚠️ This pushes schema changes directly without creating migration files. Use only for solo development.

## Testing

### Unit Tests (Vitest)

```bash
pnpm --filter=template test              # Run once
pnpm --filter=template test:watch        # Watch mode
pnpm --filter=template test:ui           # Visual UI
pnpm --filter=template test:coverage     # Coverage report
```

### E2E Tests (Playwright)

```bash
pnpm --filter=template test:e2e          # Run E2E tests
pnpm --filter=template test:e2e:ui       # Interactive mode
```

## Code Quality

### Pre-commit hooks (Husky + lint-staged)

Automatically runs on `git commit`:

- ESLint (auto-fix)
- Prettier (auto-format)
- Type checking

### Manual commands

```bash
pnpm format              # Format all files
pnpm format:check        # Check formatting
pnpm lint                # Lint all packages
pnpm lint:fix            # Auto-fix lint issues
pnpm type-check          # TypeScript checks
pnpm validate            # Run all checks + tests
```

## Build & Deploy

### Local build

```bash
pnpm --filter=template build
```

### Production deployment (Vercel)

1. Connect repo to Vercel
2. Set root directory: `apps/template`
3. Build command: `pnpm turbo run build --filter=template`
4. Install command: `pnpm install`
5. Add production environment variables (from Supabase cloud project)

## Troubleshooting

### Colima not starting

```bash
colima stop
colima start
```

### Supabase containers won't start

```bash
# Reset Supabase
supabase stop --workdir apps/template
supabase start -x vector --workdir apps/template
```

### Database connection issues

Check `.env.local` has correct `DATABASE_URL`:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Port conflicts

If ports 3000, 54321-54324 are in use, stop conflicting services:

```bash
lsof -ti:3000 | xargs kill -9
```

## File Structure

```
saas-monorepo/
├── .claude/              # Claude Code documentation
├── .husky/               # Git hooks
├── apps/
│   └── template/         # Next.js 15 app
│       ├── src/
│       │   ├── app/          # Next.js App Router
│       │   ├── features/     # Feature modules
│       │   ├── lib/
│       │   │   ├── drizzle/  # Drizzle ORM
│       │   │   ├── supabase/ # Supabase clients
│       │   │   └── utils.ts  # Shared utils
│       │   └── components/   # Shadcn UI components
│       ├── drizzle/
│       │   └── migrations/   # Database migrations
│       ├── e2e/              # Playwright tests
│       ├── supabase/         # Supabase config
│       ├── .env.local        # Local environment vars
│       ├── drizzle.config.ts
│       ├── vitest.config.ts
│       └── playwright.config.ts
├── packages/             # Shared packages (future)
├── turbo.json            # Turborepo config
├── package.json          # Root workspace
└── pnpm-workspace.yaml   # pnpm workspace config
```

## Next Steps

1. **Build your first feature** following the patterns in `.claude/architecture.md`
2. **Enable RLS policies** in Supabase for security
3. **Create cloud Supabase project** for production
4. **Set up CI/CD** with GitHub Actions (see `.claude/workflows.md`)
5. **Add shared packages** in `packages/` for code reuse

## Resources

- [CLAUDE.md](./.claude/CLAUDE.md) - Complete development guide
- [Tech Stack](./.claude/tech-stack.md) - Technology decisions
- [Architecture](./.claude/architecture.md) - Code organization patterns
- [Workflows](./.claude/workflows.md) - Git & development workflows
- [Patterns](./.claude/patterns.md) - Common SaaS patterns
- [Testing](./.claude/testing.md) - Testing strategy

## Support

- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Drizzle: https://orm.drizzle.team
- Shadcn UI: https://ui.shadcn.com
