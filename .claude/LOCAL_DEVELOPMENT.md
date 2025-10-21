# Local Development & Testing Guide

## Overview

This guide explains how to run and test the app locally during development.

---

## Required Services

You need **2 services** running simultaneously:

| Service      | Purpose                       | Default Port                |
| ------------ | ----------------------------- | --------------------------- |
| **Supabase** | Database + Auth + Storage     | 54321 (API), 54323 (Studio) |
| **Next.js**  | Your app (frontend + backend) | 3000                        |

---

## Starting Local Development

### **1. Start Supabase (Once per dev session)**

```bash
# Start local Supabase
pnpm supabase start

# Check status
pnpm supabase status
```

**What this runs:**

- PostgreSQL database (port 54322)
- Supabase Studio (http://127.0.0.1:54323)
- Auth API
- Storage API
- Realtime API

**Leave this running** in the background. You only need to start it once.

### **2. Start Next.js Dev Server**

```bash
# Start Next.js (with hot reload)
pnpm dev

# Or start specific app
pnpm dev --filter=template
```

**Access:**

- App: http://localhost:3000
- Supabase Studio: http://127.0.0.1:54323

---

## Typical Development Workflow

### **Terminal Setup**

```bash
# Terminal 1: Supabase (leave running)
pnpm supabase start

# Terminal 2: Next.js dev server (leave running)
pnpm dev

# Terminal 3: Tests in watch mode (optional)
pnpm test:watch

# Terminal 4: Ad-hoc commands
pnpm lint
git status
```

### **Making Code Changes**

1. **Edit code** - Changes auto-reload in browser
2. **Save file** - Next.js rebuilds automatically
3. **Refresh browser** - See changes

**Pro tip:** Keep browser DevTools open (F12) to see errors

---

## Testing Strategies

### **1. Manual Testing (Browser)**

**Use for:** UI/UX, visual bugs, user flows

```bash
# 1. Ensure services running
pnpm supabase status
pnpm dev

# 2. Open browser
open http://localhost:3000

# 3. Test manually
# - Click through pages
# - Fill out forms
# - Create/edit/delete data
```

**When to use:**

- ✅ Visual regression
- ✅ User experience
- ✅ Edge cases you discover
- ✅ Quick exploratory testing

### **2. Unit/Integration Tests (Vitest)**

**Use for:** Business logic, services, Server Actions

```bash
# Run all tests once
pnpm test

# Watch mode (re-runs on file changes) - RECOMMENDED during development
pnpm test:watch

# Coverage report
pnpm test:coverage

# Run specific test file
pnpm test task.service.test.ts

# Run tests matching pattern
pnpm test --grep "create task"
```

**What gets tested:**

- Task service functions
- Server Actions
- Validation schemas
- Business logic
- Database operations

**When to use:**

- ✅ TDD (write tests first)
- ✅ Refactoring existing code
- ✅ Regression testing
- ✅ CI/CD pipeline
- ✅ **80%+ coverage goal**

### **3. E2E Tests (Playwright)**

**Use for:** Complete user journeys, critical flows

```bash
# Run E2E tests (headless)
pnpm test:e2e

# Headed mode (see browser)
pnpm test:e2e --headed

# UI mode (interactive, debug)
pnpm test:e2e --ui

# Run specific test
pnpm test:e2e task-creation.spec.ts
```

**What gets tested:**

- Full authentication flow
- Complete CRUD operations
- Multi-step processes
- Real browser interactions

**When to use:**

- ✅ Before major releases
- ✅ Testing critical flows
- ✅ Smoke tests after deployment
- ⚠️ Slower than unit tests (use sparingly)

---

## Health Checks

### **Quick Verification**

```bash
# 1. Check Supabase running
pnpm supabase status
# Should show: "supabase local development setup is running"

# 2. Check database has correct schema
# Open Studio: http://127.0.0.1:54323
# Table Editor → Verify tables exist

# 3. Check Next.js builds
pnpm build
# Should complete without errors

# 4. Run tests
pnpm test
# Should pass

# 5. TypeScript check
pnpm type-check
# Should have 0 errors
```

### **Common Issues**

| Problem                    | Solution                                     |
| -------------------------- | -------------------------------------------- |
| Port 3000 in use           | `lsof -ti:3000 \| xargs kill` or change port |
| Supabase not running       | `pnpm supabase start`                        |
| Database connection failed | Check .env.local has correct DATABASE_URL    |
| TypeScript errors          | `pnpm type-check` for details                |
| Tests failing              | Check Supabase is running                    |
| Cache issues               | `rm -rf .next && pnpm dev`                   |

---

## Troubleshooting Colima + Supabase Issues

### **Issue 1: Supabase Fails to Start with Colima**

**Symptoms:**
```
Error response from daemon: error while creating mount source path
'/Users/mattias/.colima/default/docker.sock': mkdir
/Users/mattias/.colima/default/docker.sock: operation not supported
```

**Root Cause:**
Colima using `virtiofs` mount type cannot properly mount `docker.sock` into containers. Supabase containers need to mount the Docker socket for logging and analytics.

**Solution: Switch Colima to SSHFS Mount Type**

```bash
# 1. Stop and delete existing Colima instance
colima stop
colima delete  # Confirm with 'y'

# 2. Recreate with sshfs mount type
colima start --vm-type vz --mount-type sshfs --arch aarch64

# 3. Verify mount type
colima status | grep mountType
# Should show: mountType: sshfs

# 4. Try Supabase again
pnpm supabase start
```

**Important:** This setting persists after reboot. After reboot, just run `colima start` (no flags needed).

---

### **Issue 2: Supabase Vector Container Unhealthy**

**Symptoms:**
```
supabase_vector_template container is not ready: unhealthy
ERROR: Listing currently running containers failed: Connection refused
```

**Root Cause:**
The analytics/vector container tries to connect to Docker socket for log aggregation, which fails with Colima's socket mounting limitations.

**Solution: Disable Analytics (Safe for Local Development)**

```bash
# Edit supabase/config.toml
[analytics]
enabled = false  # Change from true to false
port = 54327

# Restart Supabase
pnpm supabase stop
pnpm supabase start
```

**Why it's safe:** Analytics/vector is only for log aggregation in production. You don't need it for local development.

---

### **Issue 3: Missing Environment Variables**

**Symptoms:**
```
Error: Your project's URL and Key are required to create a Supabase client!
```

**Root Cause:**
Missing `.env.local` file with Supabase connection details.

**Solution: Create .env.local**

```bash
# Create .env.local with local Supabase credentials
cat > .env.local << 'EOF'
# Supabase Local Development
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
EOF

# Restart Next.js
# Press Ctrl+C to stop, then:
pnpm dev
```

**Note:** These are default Supabase local keys (safe to commit for local development).

---

### **Complete Reset Procedure**

If you still have issues after trying the above solutions:

```bash
# 1. Stop everything
pnpm supabase stop
colima stop

# 2. Clean up Supabase volumes
docker volume rm supabase_db_template supabase_storage_template supabase_config_template 2>/dev/null || true

# 3. Remove Supabase state
rm -rf supabase/.branches supabase/.temp

# 4. Recreate Colima with correct mount type
colima delete
colima start --vm-type vz --mount-type sshfs --arch aarch64

# 5. Update Supabase config
# Edit supabase/config.toml:
# [analytics]
# enabled = false

# 6. Start fresh
pnpm supabase start
pnpm dev
```

---

### **Verification Checklist**

After applying fixes, verify everything works:

```bash
# ✓ Colima is running with sshfs
colima status | grep mountType
# Expected: mountType: sshfs

# ✓ Supabase started successfully
pnpm supabase status
# Expected: All services running

# ✓ Next.js can connect
curl http://localhost:3000
# Expected: HTML response (not error)

# ✓ Environment variables loaded
# Check terminal output when running `pnpm dev`
# Expected: "Environments: .env.local"
```

---

### **Why This Happens**

**Technical Details:**

1. **VirtioFS Limitation:** VirtioFS mount type on macOS uses Apple's Virtualization Framework, which doesn't support mounting Unix domain sockets (like `docker.sock`) into containers the same way traditional Docker Desktop does.

2. **SSHFS Workaround:** SSHFS mounts use SSH file transfer protocol, which handles socket files differently and works reliably with Supabase's container requirements.

3. **Analytics Container:** Supabase's vector/analytics container needs Docker socket access to collect container logs. Since we don't need log analytics in local development, disabling it is safe and recommended.

**References:**
- [Colima Issue #997](https://github.com/abiosoft/colima/issues/997) - VirtioFS docker.sock mounting
- Supabase CLI uses Docker-in-Docker patterns that require proper socket mounting

---

## Database Operations

### **Making Schema Changes**

```bash
# 1. Create migration
pnpm supabase migration new add_new_feature

# 2. Write SQL (in supabase/migrations/xxxxx.sql)
# Include CREATE TABLE, ALTER TABLE, RLS policies

# 3. Apply migration
pnpm supabase db reset

# 4. Regenerate Drizzle schema
pnpm exec dotenv -e .env.local -- drizzle-kit introspect

# 5. Copy schema to src
cp drizzle/migrations/schema.ts src/lib/drizzle/schema.ts

# 6. Add type exports manually
# export type MyTable = typeof myTable.$inferSelect
```

### **Viewing Database**

**Option 1: Supabase Studio (GUI)**

```bash
# Open in browser
open http://127.0.0.1:54323

# Navigate: Table Editor → Select table
```

**Option 2: Drizzle Studio**

```bash
pnpm db:studio
# Opens at http://localhost:4983
```

### **Resetting Database**

```bash
# Nuclear option - wipes everything and re-applies migrations
pnpm supabase db reset

# Confirm when prompted
```

---

## Current Project State

### **✅ What's Implemented**

**Backend:**

- ✅ Database schema (tasks table)
- ✅ RLS policies (row-level security)
- ✅ Auth helpers (getCurrentUser, requireAuth)
- ✅ Task service (CRUD operations)
- ✅ Server Actions (create, toggle, delete)
- ✅ Validation schemas (Zod)
- ✅ Unit tests (service + actions)

**Infrastructure:**

- ✅ Supabase local setup
- ✅ Drizzle ORM configured
- ✅ Testing framework (Vitest + Playwright)
- ✅ TypeScript strict mode

### **❌ What's NOT Implemented Yet**

**Frontend:**

- ❌ Landing page (/)
- ❌ Login page (/login)
- ❌ Signup page (/signup)
- ❌ Dashboard (/dashboard)
- ❌ Task list component
- ❌ Task form component
- ❌ Auth middleware

**Features:**

- ❌ User registration flow
- ❌ Password reset
- ❌ Task editing (only create/toggle/delete)

### **What You CAN Test Now**

**Via Supabase Studio:**

1. Open http://127.0.0.1:54323
2. Table Editor → tasks
3. Manually insert/update/delete tasks
4. Verify RLS policies work

**Via Unit Tests:**

```bash
pnpm test
# Runs service and action tests
```

**Via API (if you create a user):**

- Server Actions work (but no UI to trigger them)

### **What You CANNOT Test Yet**

❌ Sign up / Log in (no auth pages)  
❌ Browse tasks in UI (no dashboard)  
❌ Create tasks via UI (no form)  
❌ Click to toggle/delete (no buttons)

---

## Development Best Practices

### **1. Test-Driven Development (TDD)**

```bash
# 1. Write test FIRST
# features/tasks/__tests__/my-feature.test.ts

# 2. Run test (should fail)
pnpm test:watch

# 3. Implement feature

# 4. Test passes
```

### **2. Keep Tests Running**

```bash
# Always run in watch mode during development
pnpm test:watch

# See failures immediately
# Fast feedback loop
```

### **3. Check TypeScript Before Committing**

```bash
# Run full validation
pnpm validate

# Includes:
# - TypeScript check
# - Linting
# - Tests
# - Build check
```

### **4. Use Supabase Studio**

```bash
# Visual database browser
http://127.0.0.1:54323

# Great for:
# - Viewing data
# - Testing RLS policies
# - Running SQL queries
# - Debugging auth issues
```

---

## Debugging Tips

### **Server-Side Errors**

```bash
# Check terminal running Next.js dev server
# Errors appear in real-time
```

### **Database Errors**

```bash
# Check Supabase logs
pnpm supabase logs

# View in Studio
http://127.0.0.1:54323 → Logs
```

### **RLS Policy Issues**

```sql
-- Test RLS in Studio SQL Editor
SELECT * FROM tasks; -- Should only show your tasks

-- Debug: Check auth.uid()
SELECT auth.uid(); -- Should return your user ID when authenticated
```

### **TypeScript Errors**

```bash
# Full type check
pnpm type-check

# Check specific file
pnpm tsc --noEmit src/features/tasks/services/task.service.ts
```

---

## Next Steps

To make the app fully functional:

1. **Build auth pages** (/login, /signup)
2. **Create dashboard** (/dashboard)
3. **Build task components** (list, form)
4. **Add auth middleware** (protect /dashboard)
5. **Test full user flow** (sign up → create task → complete → delete)

**Once UI is built, you can:**

- Test in browser end-to-end
- Run E2E tests with Playwright
- Deploy to production

---

## Quick Reference

```bash
# Start everything
pnpm supabase start && pnpm dev

# Stop everything
# Ctrl+C in Next.js terminal
pnpm supabase stop

# Run tests
pnpm test              # Once
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage
pnpm test:e2e          # E2E tests

# Database
pnpm supabase db reset              # Reset DB
pnpm supabase migration new <name>  # New migration
http://127.0.0.1:54323              # Supabase Studio

# Quality checks
pnpm validate          # Everything
pnpm type-check        # TypeScript only
pnpm lint              # ESLint only
```

---

**Last Updated:** October 2025  
**Status:** Active Development
