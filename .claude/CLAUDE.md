# SaaS Template

## Project Overview

**Type:** Next.js SaaS application template
**Purpose:** Production-ready template for rapid SaaS development
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

## 📚 Documentation Structure

This documentation is split into focused files for efficiency:

- **[LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)** - How to run and test the app locally (START HERE!)
- **[tech-stack.md](./tech-stack.md)** - Complete tech stack, tools, and services
- **[architecture.md](./architecture.md)** - Architecture principles, patterns, and code standards
- **[workflows.md](./workflows.md)** - Development workflows, git process, and CI/CD
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Three-tier deployment strategy (TrueNAS + Cloud)
- **[patterns.md](./patterns.md)** - Common SaaS patterns (webhooks, uploads, email, etc.)
- **[testing.md](./testing.md)** - Testing strategy, TDD approach, and coverage goals

---

## Quick Start

### Local Development Setup

```bash
# 1. Clone and install
git clone <your-repo-url>
cd saas-template
pnpm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Setup Supabase (optional but recommended)
pnpm supabase init
pnpm supabase start

# 4. Run migrations (creates tables + RLS policies)
pnpm supabase db reset

# 5. Generate types
mkdir -p types
pnpm supabase gen types typescript --local > types/database.ts

# 6. Start development
pnpm dev
```

**Access:**

- App: http://localhost:3000
- Supabase Studio: http://localhost:54323

**Troubleshooting:**

| Issue                     | Solution                                                 |
| ------------------------- | -------------------------------------------------------- |
| Port 3000 in use          | Change port: `"dev": "next dev -p 3001"` in package.json |
| Supabase connection error | Verify DATABASE_URL and SUPABASE_URL in .env.local       |
| TypeScript errors         | Run `pnpm type-check` for details                        |
| Module not found          | `rm -rf .next node_modules && pnpm install`              |

---

## Essential Commands

```bash
# Development
pnpm dev                          # Start development server
pnpm build                        # Build for production
pnpm start                        # Start production server

# Quality
pnpm test                         # Run tests
pnpm test:coverage                # With coverage
pnpm lint                         # Lint code
pnpm type-check                   # TypeScript check

# Database - Migrations (Supabase = source of truth)
pnpm supabase migration new <name>  # Create SQL migration with RLS
pnpm supabase db reset              # Apply migrations locally
pnpm supabase db push               # Push to cloud

# Database - Schema Generation (Drizzle = auto-generated from DB)
pnpm exec dotenv -e .env.local -- drizzle-kit introspect  # Generate from DB
cp drizzle/migrations/schema.ts src/lib/drizzle/schema.ts # Use for queries
pnpm db:studio                      # Drizzle Studio (inspection)
```

---

## Notes for Claude

1. **Always reference docs** for architecture decisions
2. **Learn from next-forge** - Adapt patterns to our Supabase + Drizzle stack
3. **Write tests FIRST** - TDD for all critical paths, 80%+ coverage
4. **Keep features isolated** - No cross-feature dependencies
5. **Show the plan** before large changes
6. **Run validation** before committing
7. **Proactively suggest improvements** - Challenge patterns, propose better approaches
8. **Security first** - Always check auth before using Drizzle
9. **Test-First Development - MANDATORY:**
   - Write comprehensive tests BEFORE implementation
   - Cover happy path, edge cases, errors, and security scenarios
   - Implement to pass all tests (aim for first-try success)
   - Show test results after implementation
   - 80%+ coverage required, never proceed with failing tests
   - See [testing.md](./testing.md) for detailed approach

### 🎯 Your Mission: Maximum Efficiency & Correctness

**Actively suggest improvements to:**

- **Process:** Better workflows, faster feedback loops
- **Architecture:** Simpler patterns, better separation
- **Tech Stack:** Better libraries, new tools
- **Testing:** Better strategies, faster execution
- **DX:** Better developer experience, clearer docs

**When you spot:**

- 🔴 Patterns that cause bugs → Suggest safer alternatives
- 🐌 Slow workflows → Propose faster approaches
- 🤔 Confusing architecture → Recommend simplifications
- 📚 Better libraries/tools → Explain benefits and propose adoption
- ⚠️ Technical debt → Flag it and suggest when/how to address

**Philosophy:**

- **Speak up early** - Don't wait until it's a problem
- **Be specific** - "Use X instead of Y because..." with examples
- **Balance trade-offs** - Explain pros/cons, let user decide
- **Challenge assumptions** - Including patterns in these docs

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

**Last Updated:** October 2025
**Version:** 2.0.0 (2025 Best Practices)
**Status:** ✅ **Production-Ready Template**

**Complete Implementation:**
- ✅ Backend: Service layer, Server Actions, validation, RLS policies
- ✅ Frontend: Auth pages (login/signup/logout), dashboard, task components
- ✅ Testing: 140 tests, 84.91% coverage (exceeds 80% goal)
- ✅ Validation: TypeScript, ESLint, build all passing
- ✅ Middleware: Route protection and session management
- ✅ Documentation: Comprehensive guides and troubleshooting

**Working Features:**
- User authentication (signup, login, logout with loading states)
- Task management (create, read, update, delete)
- Optimistic UI updates
- Row Level Security (database-enforced)
- Accessible UI (WCAG 2.1 AA compliant)

**Deployment Strategy:**
- Three-tier repository approach (demo, template, production apps)
- Bootstrap phase: $0/month (TrueNAS self-hosted)
- Cloud migration: Only when apps are successful
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive guide
