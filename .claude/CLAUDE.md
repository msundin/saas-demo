# Production SaaS Monorepo

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

## 📚 Documentation Structure

This documentation is split into focused files for efficiency:

- **[tech-stack.md](./tech-stack.md)** - Complete tech stack, tools, and services
- **[architecture.md](./architecture.md)** - Architecture principles, patterns, and code standards
- **[workflows.md](./workflows.md)** - Development workflows, git process, and CI/CD
- **[patterns.md](./patterns.md)** - Common SaaS patterns (webhooks, uploads, email, etc.)
- **[testing.md](./testing.md)** - Testing strategy, TDD approach, and coverage goals

---

## Quick Start

### Local Development Setup

```bash
# 1. Clone and install
git clone <your-repo-url>
cd saas-monorepo
pnpm install

# 2. Setup environment
cp apps/template/.env.example apps/template/.env.local
# Edit .env.local with your Supabase credentials

# 3. Setup Supabase (optional but recommended)
pnpm supabase init
pnpm supabase start

# 4. Generate types and run migrations
pnpm supabase gen types typescript --local > apps/template/types/database.ts
cd apps/template && pnpm drizzle-kit migrate && cd ../..

# 5. Start development
pnpm dev --filter=template
```

**Access:**
- App: http://localhost:3000
- Supabase Studio: http://localhost:54323

**Troubleshooting:**

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Change port: `"dev": "next dev -p 3001"` in package.json |
| Supabase connection error | Verify DATABASE_URL and SUPABASE_URL in .env.local |
| TypeScript errors | Run `pnpm type-check` for details |
| Module not found | `rm -rf .next node_modules && pnpm install` |

---

## Essential Commands

```bash
# Development
pnpm dev                          # Start all apps
pnpm dev --filter=app-name        # Start specific app
pnpm build                        # Build all
pnpm build --filter=app-name      # Build specific app

# Quality
pnpm test                         # Run tests
pnpm test:coverage                # With coverage
pnpm lint                         # Lint code
pnpm type-check                   # TypeScript check
pnpm validate                     # All checks (pre-commit)

# Database
pnpm drizzle-kit generate         # Generate migrations
pnpm drizzle-kit migrate          # Run migrations
pnpm drizzle-kit push             # Quick push (solo dev)
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

**Last Updated:** October 2025
**Version:** 2.0.0 (2025 Best Practices)
**Status:** Production Ready
