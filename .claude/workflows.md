# Development Workflows

## Workflow Modes

**Choose the workflow that matches your project phase:**

### 🚀 Rapid Mode (Prototyping / Solo / MVP)

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
git commit -m "feat(tasks): add task completion toggle

- Added toggle functionality
- Integrated with Supabase
- Added optimistic updates"

# Or if you have an issue:
git commit -m "feat(tasks): add task completion toggle (#123)"
```

---

### 🏢 Production Mode (Stable App / Team / Paying Users)

**When to use:**
- App has paying customers
- Team of 2+ developers
- Stability is critical
- Compliance/audit requirements

**Process:**
1. Create GitHub issue for each feature
2. Create feature branch from `main`
3. Reference issue in branch name: `feature/123-add-task-filter`
4. Make commits with issue reference: `feat(tasks): add task filter (#123)`
5. Open PR when ready
6. Code review required
7. Merge to `main` after approval

**Branch naming:**
```bash
feature/123-add-task-filter
fix/456-task-validation
refactor/789-task-service
```

**Commit format with issue:**
```bash
git commit -m "feat(tasks): add task filtering by status (#123)

- Implements user story from #123
- Added comprehensive validation
- Includes unit and integration tests
- Updated documentation"
```

---

### 📌 Current Recommendation

**Start with Rapid Mode** → Switch to Production Mode when:
- You have first paying customer
- You add a team member
- Stability becomes more important than speed

---

## Iterative Development

Build features in small, testable increments. Each increment should be:
1. **Plannable** - Clear goal and scope
2. **Testable** - Can write tests
3. **Reviewable** - Fits in one PR (if using PRs)
4. **Deployable** - Can ship independently

---

## Feature Development Process (Production Mode)

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
git checkout -b feature/123-add-task-filter
```

**Step 3: Implement (TDD approach)**
```bash
# 1. Write types (if needed)
touch features/tasks/types/task-filter.types.ts

# 2. Write validation schema (if needed)
touch features/tasks/validations/task-filter.schema.ts

# 3. Write tests FIRST
touch features/tasks/__tests__/task-filter.test.ts

# 4. Implement service method
# Edit features/tasks/services/task.service.ts

# 5. Write Server Action (if needed)
# Edit features/tasks/actions/task-actions.ts

# 6. Write component tests
touch features/tasks/__tests__/TaskFilter.test.tsx

# 7. Implement UI
touch features/tasks/components/TaskFilter.tsx
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
git commit -m "feat(tasks): add task filtering by status (#123)"

# Rapid Mode (descriptive message)
git commit -m "feat(tasks): add task filtering with status dropdown"

# Push (adjust branch name based on mode)
git push origin feature/123-add-task-filter  # Production
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

## Git Workflow

### Branch Naming (Production Mode)
```bash
feature/123-add-task-filter     # With issue number
fix/456-task-validation         # Bug fix with issue
refactor/789-task-service       # Refactor with issue
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
feat(tasks): add task filtering by status (#123)
fix(auth): resolve login redirect issue (#456)
refactor(ui): extract button component (#789)
docs: update API documentation
test(tasks): add task filter tests (#123)
chore: update dependencies
```

**Examples without issue reference (Rapid Mode):**
```bash
feat(tasks): add task filtering by status

- Added filter dropdown with all/active/completed
- Integrated with URL search params
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

## Commands Reference

### Development
```bash
# Start all apps
pnpm dev

# Build all
pnpm build
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

**Configuration:**
1. Connect GitHub repo to Vercel
2. Configure project:
   - Build Command: `pnpm build`
   - Install Command: `pnpm install`
3. Add environment variables
4. Deploy on push to `main`

**Features:**
- Automatic preview deployments for PRs
- Production deployments on merge to main
- Environment variables configured in Vercel dashboard

---

## Working with Claude Code

### Initial Setup

**First prompt - Always start with context:**
```bash
> Context: Building [your SaaS name] application.
  Read .claude/CLAUDE.md for all architecture decisions and patterns.
  Current workflow mode: [Rapid/Production]

  Goal: [your task]
```

### When Starting New Feature (Production Mode)
```bash
> Context: Building task manager application.
  Reference: .claude docs for architecture patterns.
  Workflow: Production Mode

  Goal: Implement task filtering feature for GitHub issue #123.

  Steps:
  1. Create feature branch: feature/123-add-task-filter
  2. Extend feature structure in src/features/tasks/
  3. Define TypeScript types (if needed)
  4. Create Zod validation schemas (if needed)
  5. Write service tests FIRST (TDD)
  6. Implement filter method in TaskService
  7. Update Server Action (if needed)
  8. Build UI components (filter dropdown)
  9. Add integration tests
  10. Commit with issue reference: "feat(tasks): add task filtering (#123)"

  Follow the exact structure in .claude/architecture.md.
  Write tests for everything.
  Start with step 1.
```

### When Starting New Feature (Rapid Mode)
```bash
> Context: Building task manager application.
  Reference: .claude docs for architecture patterns.
  Workflow: Rapid Mode (work on main, skip issues)

  Goal: Implement task filtering feature.

  Quick iteration approach:
  1. Extend feature structure in src/features/tasks/
  2. Define types and validation (if needed)
  3. Write tests first (TDD for critical paths)
  4. Implement service method and update Server Action
  5. Build UI components (filter dropdown)
  6. Commit to main with clear message

  Maintain quality: 80%+ coverage, all security checks.
  Start with step 1.
```

### Quality Checks
```bash
> Before we commit, run:
  1. pnpm lint
  2. pnpm type-check
  3. pnpm test

  Show me results and fix any issues.
```
