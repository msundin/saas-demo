# SaaS Template

# 🤖 FOR CLAUDE CODE: READ THIS FIRST

This project has comprehensive documentation split across multiple files for better organization. **You MUST read all required files before starting any work.**

---

## 📖 Required Reading (Read in order before starting)

### 1. [.claude/CLAUDE.md](./.claude/CLAUDE.md) ⭐ REQUIRED

**What:** Project overview, quick start, current configuration
**Why:** Understand the project context and development mode

### 2. [.claude/architecture.md](./.claude/architecture.md) ⭐⭐⭐ CRITICAL

**What:** Feature-based structure, code organization patterns, where to put files
**Why:** This defines HOW to structure ALL code you write
**Must read before:** Writing any feature or component

### 3. [.claude/tech-stack.md](./.claude/tech-stack.md) ⭐ REQUIRED

**What:** Technologies, tools, libraries, why each is chosen
**Why:** Know what tools to use and how to use them correctly

### 4. [.claude/workflows.md](./.claude/workflows.md) ⭐ REQUIRED

**What:** Git process, commit conventions, development modes
**Why:** Follow correct development workflow

---

## 📚 Reference Documentation (Read as needed)

**When writing tests:**

- **[.claude/testing.md](./.claude/testing.md)** - Test-First approach, coverage goals, TDD when needed

**When implementing common patterns:**

- **[.claude/patterns.md](./.claude/patterns.md)** - Auth, security, webhooks, file uploads, emails, payments

**When stuck or setting up:**

- **[.claude/LOCAL_DEVELOPMENT.md](./.claude/LOCAL_DEVELOPMENT.md)** - How to run locally, troubleshooting, health checks

---

## 🎯 Quick Rules (Always Apply)

These apply to **EVERY** feature:

- ✅ **Feature-based structure** (see architecture.md)
- ✅ **Tests BEFORE code** - 80%+ coverage required (see testing.md)
- ✅ **RLS policies** for all database tables (see patterns.md)
- ✅ **Zod validation** for all inputs (see tech-stack.md)
- ✅ **TypeScript strict mode** - no `any` types
- ✅ **Current mode: RAPID MODE** - work on main, fast iteration, same quality (see workflows.md)

---

## 🗺️ Common Tasks → Files to Read

| Task                       | Read These Files                                    |
| -------------------------- | --------------------------------------------------- |
| 🆕 Creating a new feature  | architecture.md + testing.md                        |
| 🔐 Adding auth/security    | patterns.md + tech-stack.md (Supabase Auth section) |
| 🗄️ Database schema changes | tech-stack.md (Schema Management Workflow)          |
| 🧪 Writing tests           | testing.md                                          |
| 📝 Making commits          | workflows.md                                        |
| 🐛 Troubleshooting/setup   | LOCAL_DEVELOPMENT.md                                |
| 📧 Sending emails          | patterns.md (Email Patterns)                        |
| 💳 Payment integration     | patterns.md (Payment Patterns)                      |
| 📤 File uploads            | patterns.md (File Upload Patterns)                  |

---

## ✅ Validation Checklist (Before You Start)

Confirm you have:

- [ ] Read .claude/CLAUDE.md (project overview)
- [ ] Read .claude/architecture.md ⭐ (code structure - CRITICAL)
- [ ] Read .claude/workflows.md (git process)
- [ ] Read .claude/tech-stack.md (tools and libraries)
- [ ] Understood the feature-based structure
- [ ] Understood the current development mode (RAPID MODE)
- [ ] Know to write tests BEFORE implementation
- [ ] Know to follow patterns from existing features

**Ready to proceed:** Only after all boxes are checked ✓

---

## 🚀 Quick Start

**Current Mode:** **RAPID MODE** (work on main, high quality, fast iteration)

**Essential Commands:**

```bash
pnpm dev                    # Start development
pnpm test                   # Run tests
pnpm test:coverage          # Check coverage
pnpm validate               # Run all quality checks
```

**Template Reference:**
Look at `src/features/tasks/` for a complete feature example following all patterns.

---

**Version:** 2.0.0 (2025 Best Practices)
**Last Updated:** October 2025

---

## 📌 Remember

**Before implementing ANY feature:**

1. ✅ Confirm you've read architecture.md
2. ✅ Check if there's an existing pattern to follow
3. ✅ Write comprehensive tests FIRST
4. ✅ Implement following established patterns
5. ✅ Run tests and show results
6. ✅ Verify 80%+ coverage

**The template app demonstrates these patterns in action.**
