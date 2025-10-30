# SaaS Template

**Production-ready Next.js SaaS application template with Supabase backend**

A comprehensive, feature-complete template for rapid SaaS development featuring authentication, database management, testing infrastructure, and a cost-optimized deployment strategy.

---

## ✨ Features

### 🏗️ **Complete Full-Stack Implementation**
- **Backend:** Service layer, Server Actions, validation, RLS policies
- **Frontend:** Auth pages (login/signup/logout), dashboard, task management
- **Testing:** 140 tests, 84.91% coverage (exceeds 80% goal)
- **Infrastructure:** Auth middleware, TypeScript strict mode, production build ready

### 🔐 **Authentication & Security**
- Supabase Auth with email/password
- Row Level Security (RLS) database policies
- Protected routes via middleware
- Secure Server Actions with Zod validation

### 💰 **Cost-Optimized Deployment**
- **Bootstrap Phase:** $0/month for unlimited apps (TrueNAS self-hosted)
- **Production Phase:** Pay only when apps are successful
- **Three-tier strategy:** Demo (cloud) + Template (local) + Production apps (TrueNAS → Cloud)

### 🧪 **Test-Driven Development**
- Comprehensive test suite (unit, integration, component)
- Test-first approach demonstrated
- 80%+ code coverage required
- Production-ready testing patterns

### ♿ **Accessibility & Quality**
- WCAG 2.1 AA compliant
- TypeScript strict mode
- ESLint configuration
- Optimistic UI updates

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Docker (for local Supabase)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/msundin/saas-template
cd saas-template

# 2. Install dependencies
pnpm install

# 3. Start local Supabase (Docker)
pnpm supabase start

# 4. Copy environment variables
cp .env.example .env.local
# Uses local Supabase by default (http://127.0.0.1:54321)

# 5. Run migrations (creates tables + RLS policies)
pnpm supabase db reset

# 6. Start development server
pnpm dev
```

**Access:**
- App: http://localhost:3000
- Supabase Studio: http://localhost:54323

---

## 📚 Documentation

Comprehensive documentation is located in `.claude/`:

### **Essential Reading**

- **[.claude/CLAUDE.md](./.claude/CLAUDE.md)** - Project overview, quick start, current configuration
- **[.claude/architecture.md](./.claude/architecture.md)** ⭐ - Feature-based structure, code organization (CRITICAL)
- **[.claude/tech-stack.md](./.claude/tech-stack.md)** - Technologies, tools, libraries
- **[.claude/workflows.md](./.claude/workflows.md)** - Git process, commit conventions, development modes
- **[.claude/DEPLOYMENT.md](./.claude/DEPLOYMENT.md)** - Three-tier deployment strategy

### **Reference Documentation**

- **[.claude/testing.md](./.claude/testing.md)** - Test-first approach, coverage goals
- **[.claude/patterns.md](./.claude/patterns.md)** - Auth, security, webhooks, file uploads, emails
- **[.claude/LOCAL_DEVELOPMENT.md](./.claude/LOCAL_DEVELOPMENT.md)** - How to run locally, troubleshooting

---

## 🏗️ Architecture

### Feature-Based Structure

```
src/
├── features/           # Feature-based organization
│   └── tasks/         # Example feature (complete reference)
│       ├── actions/   # Server Actions
│       ├── components # UI components
│       ├── services/  # Business logic
│       ├── validations # Zod schemas
│       └── __tests__/ # Comprehensive tests
├── app/               # Next.js App Router
│   ├── (auth)/       # Auth pages (login, signup)
│   └── dashboard/    # Protected dashboard
├── lib/              # Shared libraries
│   ├── supabase/     # Supabase client
│   └── drizzle/      # Drizzle ORM (optional)
└── middleware.ts     # Auth middleware
```

**Key Principle:** Organize by feature, not technical layer. Each feature is self-contained.

---

## 🎯 Deployment Strategy

### Three-Tier Repository Approach

**1. saas-template** (this repo)
- **Purpose:** Source code template for cloning
- **Deployment:** Local development (optional: saas-template.infswsol.com)
- **Backend:** Supabase Local (Docker)

**2. saas-demo** (separate repo)
- **Purpose:** Cloud deployment validation + customer demos
- **Deployment:** Vercel Free + Supabase Cloud Free
- **Domain:** demo.infswsol.com
- **Cost:** $0/month

**3. Production Apps** (app1, app2, ...)
- **Bootstrap Phase:** Vercel Free + TrueNAS Supabase ($0/month)
- **Production Phase:** Vercel Pro + Supabase Cloud ($45/month)
- **Strategy:** Pay only when app is successful (100+ users OR paying customers)

See **[.claude/DEPLOYMENT.md](./.claude/DEPLOYMENT.md)** for comprehensive deployment guide.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend:** Supabase (Auth, PostgreSQL, RLS), Drizzle ORM
- **Testing:** Vitest, React Testing Library, 80%+ coverage
- **Deployment:** Vercel (frontend), Supabase Cloud / TrueNAS (backend)
- **Development:** TypeScript strict mode, ESLint, Prettier

---

## ✅ Commands

```bash
# Development
pnpm dev                # Start development server
pnpm build              # Build for production
pnpm start              # Start production server

# Quality
pnpm test               # Run tests
pnpm test:coverage      # Run tests with coverage report
pnpm lint               # Lint code
pnpm type-check         # TypeScript type checking
pnpm validate           # Run all quality checks (lint + type-check + test)

# Database - Supabase Migrations (source of truth, includes RLS)
pnpm supabase migration new <name>  # Create new SQL migration
pnpm supabase db reset              # Apply migrations locally
pnpm supabase db push               # Push migrations to cloud

# Database - Drizzle (generate schema for type-safe queries)
pnpm exec dotenv -e .env.local -- drizzle-kit introspect  # Generate schema from DB
cp drizzle/migrations/schema.ts src/lib/drizzle/schema.ts # Copy to project
pnpm db:studio                      # Drizzle Studio (schema inspection)
```

---

## 📊 Template Status

**Version:** 2.0.0 (2025 Best Practices)
**Status:** ✅ **Production-Ready**
**Last Updated:** October 2025

### Complete Implementation

✅ Backend (100%) - Service layer, Server Actions, validation, RLS
✅ Frontend (100%) - Auth pages, dashboard, task management
✅ Testing (100%) - 140 tests, 84.91% coverage
✅ Infrastructure (100%) - Middleware, TypeScript, production build
✅ Deployment (100%) - Three-tier strategy, comprehensive guide

---

## 🎓 Learning Resources

### Template Examples

Study `src/features/tasks/` for complete patterns:
- Server Actions with 5-step pattern
- Service layer with business logic isolation
- Zod validation schemas
- RLS policies
- Comprehensive tests
- Optimistic UI updates

### Development Workflow

**Current Mode:** **RAPID MODE**
- Work directly on `main` branch
- Fast iteration, frequent commits
- Same quality standards (80%+ tests, TDD, security)
- No PRs/issues needed for solo development

See **[.claude/workflows.md](./.claude/workflows.md)** for detailed workflow documentation.

---

## 🤝 Contributing

This is a template repository. Clone it to create your own SaaS applications:

```bash
# Clone for new project
git clone https://github.com/msundin/saas-template my-new-saas
cd my-new-saas

# Update package.json name
# Follow deployment guide in .claude/DEPLOYMENT.md
```

---

## 📝 License

MIT License - Use this template for any purpose, commercial or personal.

---

## 🔗 Links

- **Documentation:** [.claude/](./.claude/)
- **Deployment Guide:** [.claude/DEPLOYMENT.md](./.claude/DEPLOYMENT.md)
- **Architecture:** [.claude/architecture.md](./.claude/architecture.md)
- **Tech Stack:** [.claude/tech-stack.md](./.claude/tech-stack.md)

---

**Built with ❤️ using Next.js, Supabase, and modern best practices.**
