# Deployment Guide - Cloud Infrastructure Setup

**Version:** 2.0.0 (2025 Best Practices)
**Last Updated:** October 2025
**Status:** Production-Ready

This guide covers deploying your SaaS template to Vercel and Supabase Cloud with a multi-tenant PostgreSQL schema architecture.

---

## Table of Contents

- [Section 0: Prerequisites & Account Setup](#section-0-prerequisites--account-setup)
- [Section 1: Understanding the Architecture](#section-1-understanding-the-architecture)
- [Section 2: ⚠️ CRITICAL SAFETY WARNINGS](#section-2-️-critical-safety-warnings)
- [Section 3: Supabase Project #1 Setup](#section-3-supabase-project-1-setup-infswsolcom)
- [Section 4: Supabase Project #2 Setup](#section-4-supabase-project-2-setup-novatratechcom)
- [Section 5: Vercel Template Project Setup](#section-5-vercel-template-project-setup)
- [Section 6: Vercel Production App Projects](#section-6-vercel-production-app-projects)
- [Section 7: DNS Configuration](#section-7-dns-configuration)
- [Section 8: Environment Variables](#section-8-environment-variables-schema-specific)
- [Section 9: Creating New Production App](#section-9-creating-new-production-app-from-template)
- [Section 10: Safe Database Operations](#section-10-safe-database-operations)
- [Section 11: Branch Workflows](#section-11-branch-workflows)
- [Section 12: Migrating App to Paid Tier](#section-12-migrating-app-to-paid-tier)
- [Section 13: SEO Protection](#section-13-seo-protection)
- [Section 14: Monitoring & Limits](#section-14-monitoring--limits)
- [Section 15: Troubleshooting](#section-15-troubleshooting)
- [Section 16: Complete Verification Checklist](#section-16-complete-verification-checklist)

---

## Section 0: Prerequisites & Account Setup

### Required Accounts

1. **GitHub Account** (you already have)
2. **Supabase Account** (sign up with GitHub OAuth)
3. **Vercel Account** (sign up with GitHub OAuth)

### Account Creation Steps

#### Create Supabase Account

```bash
# 1. Go to https://supabase.com
# 2. Click "Start your project"
# 3. Choose "Continue with GitHub" (recommended)
# 4. Authorize Supabase to access your GitHub account
# 5. You'll be redirected to the Supabase dashboard
```

#### Create Vercel Account

```bash
# 1. Go to https://vercel.com
# 2. Click "Sign Up"
# 3. Choose "Continue with GitHub" (recommended)
# 4. Authorize Vercel to access your GitHub account
# 5. You'll be redirected to the Vercel dashboard
```

### Install Required CLIs

```bash
# Vercel CLI (for manual deployments and debugging)
pnpm add -D vercel

# Authenticate Vercel CLI
pnpm vercel login
# Choose "Continue with GitHub"

# Verify authentication
pnpm vercel whoami
# Should show your GitHub username
```

**Note:** Supabase CLI is already installed in this project (`pnpm supabase --version`).

### Verify GitHub Access

```bash
# Ensure your GitHub account has:
# ✅ Access to msundin/saas-template repository
# ✅ Ability to create new repositories
# ✅ Connected to Vercel
# ✅ Connected to Supabase

# Check repository access
gh repo view msundin/saas-template

# Check if Vercel has access
# Go to https://vercel.com/account/integrations
# Verify GitHub integration is active

# Check if Supabase has access
# Go to https://supabase.com/dashboard
# Projects should be visible
```

---

## Section 1: Understanding the Architecture

### Why This Architecture?

**Goal:** Maximize free tier usage while maintaining professional infrastructure for:
- Template reference app
- Client demos
- Multiple production apps

**Solution:** Multi-tenant database with PostgreSQL schemas + strategic domain usage.

### PostgreSQL Schemas Explained (Simple Analogy)

Think of a Supabase project as an **apartment building**:

- **Building** = Supabase Project (500MB total)
- **Apartments** = PostgreSQL Schemas (each completely isolated)
- **Residents** = Your deployed apps

Each apartment (schema) has:
- ✅ Its own tables (data completely isolated)
- ✅ Its own users/auth data
- ✅ Its own RLS policies
- ✅ Cannot see other apartments' data

All apartments share:
- 🔄 The same building utilities (500MB disk space)
- 🔄 The same connection pool
- 🔄 The same backup schedule

**Example:**

```
Supabase Project #1 (infswsol.com - 500MB total)
├── Schema: template_infswsol_com (150MB)
│   ├── Table: users
│   ├── Table: tasks
│   └── Table: profiles
├── Schema: demo_infswsol_com (100MB)
│   ├── Table: users (different data!)
│   ├── Table: tasks (different data!)
│   └── Table: profiles (different data!)
└── 250MB available for future demos
```

### Why 2 Supabase Projects?

**Project #1: infswsol.com (Demos/Reference)**
- Purpose: Template reference, client demos, experiments
- Can reset data freely without affecting production
- Schemas: `template_infswsol_com`, `demo_infswsol_com`

**Project #2: novatratech.com (Production Apps)**
- Purpose: Real production apps with real users
- Protected from demo resets
- Schemas: `app1_novatratech_com`, `app2_novatratech_com`, etc.
- Migrate individual apps to paid tier when they become profitable

### Domain Strategy

**infswsol.com (Demos/Reference/Templates)**

```
infswsol.com (apex)              → Your home server (NOT Vercel)
├── [existing subdomains]        → Your home server
├── template.infswsol.com        → Vercel (manually added) ✅
└── demo.infswsol.com            → Vercel (manually added) ✅
```

**Why manual subdomains?**
- Apex domain points to home server
- Cannot use wildcard trick
- Must add each subdomain manually in Vercel

**novatratech.com (Production Apps)**

```
novatratech.com (apex)           → Vercel (unlocks all subdomains) ✅
├── app1.novatratech.com         → Auto-available (wildcard)
├── app2.novatratech.com         → Auto-available (wildcard)
├── app3.novatratech.com         → Auto-available (wildcard)
└── [unlimited subdomains]       → Auto-available (wildcard)
```

**Why apex domain?**
- Pointing apex to Vercel enables wildcard DNS
- All subdomains automatically work
- No manual addition needed
- Perfect for scaling production apps

### Data Isolation - How It Works

**Question:** Can app1.novatratech.com see app2.novatratech.com's data?

**Answer:** NO! Completely impossible. Here's why:

1. **Application Level:**
   - Each app sets `DB_SCHEMA=app1_novatratech_com` in environment variables
   - Database client automatically sets `search_path` to that schema
   - App can only see tables in its schema

2. **Database Level:**
   - PostgreSQL schemas are namespace-isolated
   - `app1_novatratech_com.users` ≠ `app2_novatratech_com.users`
   - Even if you tried, you can't access other schemas without explicit permission

3. **RLS Level:**
   - Row Level Security policies are schema-scoped
   - Each schema has its own auth.users table reference
   - User IDs are completely separate

**Example Query:**

```sql
-- In app1.novatratech.com context:
SELECT * FROM tasks;
-- Returns only app1's tasks (via search_path)

-- Trying to access app2's tasks:
SELECT * FROM app2_novatratech_com.tasks;
-- ERROR: permission denied (no cross-schema access granted)
```

### 500MB Shared Limit Per Project

**Supabase Free Tier:** 500MB disk space per project

**Project #1 (infswsol.com):**
- Schema `template_infswsol_com`: ~150MB
- Schema `demo_infswsol_com`: ~100MB
- Available: ~250MB for future demos
- **Total: 500MB**

**Project #2 (novatratech.com):**
- Schema `app1_novatratech_com`: ~100MB
- Schema `app2_novatratech_com`: ~80MB
- Schema `app3_novatratech_com`: ~90MB
- Available: ~230MB for future apps
- **Total: 500MB**

**What happens when you hit 500MB?**
- Supabase will warn you at 90% usage
- Database becomes read-only at 100%
- **Solution:** Migrate profitable app to paid tier ($25/month = 8GB)

**How many apps can fit?**
- Small apps (10-50MB): ~10 apps per project
- Medium apps (50-100MB): ~5 apps per project
- Large apps (100MB+): ~3-4 apps per project

---

## Section 2: ⚠️ CRITICAL SAFETY WARNINGS

### Commands That Affect ALL Schemas

**DANGER ZONE:** These commands operate on the ENTIRE database:

```bash
# ❌ DANGEROUS - Affects ALL schemas
pnpm db:reset
pnpm db:drop
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE;"

# ❌ DANGEROUS - Without DB_SCHEMA
pnpm db:push
pnpm db:generate

# ❌ DANGEROUS - Backup/restore without schema
pg_dump $DATABASE_URL
pg_restore $DATABASE_URL
```

**SAFE ALTERNATIVES:**

```bash
# ✅ SAFE - Targets specific schema
DB_SCHEMA=template_infswsol_com pnpm db:push
DB_SCHEMA=demo_infswsol_com pnpm db:reset-schema
DB_SCHEMA=app1_novatratech_com pnpm db:generate

# ✅ SAFE - Schema-specific backup
pg_dump --schema=app1_novatratech_com $DATABASE_URL > app1.sql
```

### Required Safety Practices

**RULE #1:** ALWAYS set `DB_SCHEMA` for cloud database operations

```bash
# ✅ Correct
DB_SCHEMA=template_infswsol_com pnpm db:push

# ❌ Wrong (will error with safety script)
pnpm db:push
```

**RULE #2:** Use `pnpm db:reset-schema` instead of `pnpm db:reset`

```bash
# ✅ Correct (requires confirmation)
DB_SCHEMA=demo_infswsol_com pnpm db:reset-schema

# ❌ Wrong (would reset ALL schemas)
pnpm db:reset
```

**RULE #3:** Local development doesn't need `DB_SCHEMA`

```bash
# ✅ Correct (local uses 'public' schema)
pnpm dev
pnpm db:push

# Local .env.local (no DB_SCHEMA needed)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**RULE #4:** List schemas before operations

```bash
# ✅ Always check what schemas exist
pnpm db:list-schemas

# Output:
# Schemas in database:
# - template_infswsol_com
# - demo_infswsol_com
# - app1_novatratech_com
# - app2_novatratech_com
```

### Backup Strategies

**Per-Schema Backups (Recommended):**

```bash
# Backup single schema
pg_dump \
  --schema=app1_novatratech_com \
  $DATABASE_URL \
  > backups/app1_$(date +%Y%m%d).sql

# Restore single schema
psql $DATABASE_URL < backups/app1_20251024.sql
```

**Full Project Backup (All Schemas):**

```bash
# Backup entire database
pg_dump $DATABASE_URL > backups/full_$(date +%Y%m%d).sql

# Restore entire database
psql $DATABASE_URL < backups/full_20251024.sql
```

### Recovery Procedures

**Scenario 1: Accidentally deleted data in one schema**

```bash
# 1. Restore from latest backup
psql $DATABASE_URL < backups/app1_novatratech_com_latest.sql

# 2. Verify data restored
DB_SCHEMA=app1_novatratech_com pnpm db:studio
```

**Scenario 2: Schema corruption**

```bash
# 1. Drop corrupted schema
psql $DATABASE_URL -c "DROP SCHEMA app1_novatratech_com CASCADE;"

# 2. Recreate schema
psql $DATABASE_URL -c "CREATE SCHEMA app1_novatratech_com;"

# 3. Restore from backup
psql $DATABASE_URL < backups/app1_novatratech_com_latest.sql

# 4. Verify structure
DB_SCHEMA=app1_novatratech_com pnpm db:push
```

### Real-World Examples of Mistakes

**Mistake #1: Running migrations without DB_SCHEMA**

```bash
# ❌ What happened:
pnpm db:push

# Result: Migrations ran on ALL schemas
# - template_infswsol_com ✅ (intended)
# - demo_infswsol_com ❌ (unintended)
# - app1_novatratech_com ❌ (unintended)
# - app2_novatratech_com ❌ (unintended)

# ⚠️ Now all schemas have the new migration
# Rollback is complex and risky

# ✅ Prevention: Safety scripts now require DB_SCHEMA
```

**Mistake #2: Resetting wrong schema**

```bash
# ❌ What happened:
DB_SCHEMA=app1_novatratech_com pnpm db:reset-schema
# Typed schema name wrong: "app1_novatech_com"

# Result: Deleted production data!

# ✅ Prevention: reset-schema.js requires typing exact schema name
# ✅ Recovery: Restore from latest backup
```

---

## Section 3: Supabase Project #1 Setup (infswsol.com)

### Create Project for Demos/Reference

```bash
# 1. Go to https://supabase.com/dashboard
# 2. Click "New Project"
# 3. Fill in details:
#    - Name: "saas-reference-demos"
#    - Database Password: [generate strong password]
#    - Region: Choose closest to your users
#    - Pricing Plan: Free
# 4. Click "Create new project"
# 5. Wait ~2 minutes for project to provision
```

### Get Project Credentials

```bash
# 1. Go to Project Settings > API
# 2. Copy the following (you'll need these for Vercel):

# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# Anon/Public Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# 3. Go to Project Settings > Database
# 4. Copy Connection String (Pooler):

# Connection string (port 6543 for pooler)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

**Important:** Save these credentials securely. You'll need them for Vercel environment variables.

### Create Schemas

```bash
# Use transaction mode (port 5432) for DDL operations
DATABASE_URL_DIRECT=postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres

# Create schemas for infswsol.com apps
psql "$DATABASE_URL_DIRECT" << 'EOF'
-- Create template schema
CREATE SCHEMA IF NOT EXISTS template_infswsol_com;

-- Create demo schema
CREATE SCHEMA IF NOT EXISTS demo_infswsol_com;

-- Verify schemas created
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name LIKE '%infswsol%'
ORDER BY schema_name;
EOF

# Expected output:
#  schema_name
# --------------------------
#  demo_infswsol_com
#  template_infswsol_com
# (2 rows)
```

### Run Migrations Per Schema

```bash
# 1. Setup environment for template schema
export DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
export DB_SCHEMA=template_infswsol_com

# 2. Run migrations for template schema
pnpm db:push

# Output:
# ✅ Targeting schema: template_infswsol_com
# Applying migrations...
# ✅ Done!

# 3. Setup environment for demo schema
export DB_SCHEMA=demo_infswsol_com

# 4. Run migrations for demo schema
pnpm db:push

# Output:
# ✅ Targeting schema: demo_infswsol_com
# Applying migrations...
# ✅ Done!
```

### Verify Setup

```bash
# 1. List all schemas
pnpm db:list-schemas

# Expected output:
# Schemas in database:
# - template_infswsol_com
# - demo_infswsol_com

# 2. Open Drizzle Studio to verify tables
DB_SCHEMA=template_infswsol_com pnpm db:studio
# Should show: users, tasks, profiles tables

DB_SCHEMA=demo_infswsol_com pnpm db:studio
# Should show: users, tasks, profiles tables (separate data!)
```

---

## Section 4: Supabase Project #2 Setup (novatratech.com)

### Create Project for Production Apps

```bash
# 1. Go to https://supabase.com/dashboard
# 2. Click "New Project"
# 3. Fill in details:
#    - Name: "saas-production-apps"
#    - Database Password: [generate different strong password]
#    - Region: Same as Project #1 (for consistency)
#    - Pricing Plan: Free
# 4. Click "Create new project"
# 5. Wait ~2 minutes for project to provision
```

### Get Project Credentials

```bash
# 1. Go to Project Settings > API
# 2. Copy the following (DIFFERENT from Project #1):

# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://yyyyy.supabase.co

# Anon/Public Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# 3. Go to Project Settings > Database
# 4. Copy Connection String (Pooler):

# Connection string
DATABASE_URL=postgresql://postgres.[project-ref-2]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

**Important:** These are DIFFERENT credentials from Project #1. Keep them separate.

### Create Initial Schema

```bash
# Use transaction mode for DDL
DATABASE_URL_DIRECT=postgresql://postgres.[project-ref-2]:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres

# Create schema for first production app
psql "$DATABASE_URL_DIRECT" << 'EOF'
-- Create app1 schema
CREATE SCHEMA IF NOT EXISTS app1_novatratech_com;

-- Verify schema created
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name LIKE '%novatratech%'
ORDER BY schema_name;
EOF

# Expected output:
#  schema_name
# --------------------------
#  app1_novatratech_com
# (1 row)
```

### Run Migrations

```bash
# 1. Setup environment for app1 schema
export DATABASE_URL="postgresql://postgres.[project-ref-2]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
export DB_SCHEMA=app1_novatratech_com

# 2. Run migrations for app1 schema
pnpm db:push

# Output:
# ✅ Targeting schema: app1_novatratech_com
# Applying migrations...
# ✅ Done!
```

### Verify Setup

```bash
# 1. List schemas
pnpm db:list-schemas

# Expected output:
# Schemas in database:
# - app1_novatratech_com

# 2. Open Drizzle Studio
DB_SCHEMA=app1_novatratech_com pnpm db:studio
# Should show: users, tasks, profiles tables
```

---

## Section 5: Vercel Template Project Setup

### Import Repository

```bash
# 1. Go to https://vercel.com/new
# 2. Choose "Import Git Repository"
# 3. Select "msundin/saas-template"
# 4. Click "Import"
```

### Configure Build Settings

```bash
# Project Settings:
# - Name: "saas-template"
# - Framework Preset: Next.js (auto-detected)
# - Root Directory: ./
# - Build Command: pnpm build (auto-detected)
# - Output Directory: .next (auto-detected)
# - Install Command: pnpm install (auto-detected)

# Click "Deploy" (will fail initially, we'll add env vars next)
```

### Add Domains Manually

**Why manual?** infswsol.com apex points to home server, so we can't use wildcard.

```bash
# 1. Go to Project Settings > Domains
# 2. Add "template.infswsol.com"
#    - Type: Custom Domain
#    - Git Branch: main
#    - Click "Add"
# 3. Add "demo.infswsol.com"
#    - Type: Custom Domain
#    - Git Branch: demo
#    - Click "Add"
```

**Vercel will show DNS instructions:**

```
template.infswsol.com needs CNAME record:
CNAME → cname.vercel-dns.com

demo.infswsol.com needs CNAME record:
CNAME → cname.vercel-dns.com
```

We'll configure DNS in Section 7.

### Configure Branch-Specific Environment Variables

**For main branch (template.infswsol.com):**

```bash
# 1. Go to Project Settings > Environment Variables
# 2. Add each variable below:
# 3. Select "Production" (main branch)
# 4. Click "Save"

# Supabase Project #1 credentials
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (from Project #1)

# Database URL with schema in search_path
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?options=-c%20search_path%3Dtemplate_infswsol_com

# Schema name
DB_SCHEMA=template_infswsol_com

# App URL
NEXT_PUBLIC_APP_URL=https://template.infswsol.com

# SEO protection (block search engines)
NEXT_PUBLIC_ALLOW_INDEXING=false
```

**For demo branch (demo.infswsol.com):**

```bash
# 1. Go to Project Settings > Environment Variables
# 2. Add each variable below:
# 3. Select "Preview" and specify "demo" branch
# 4. Click "Save"

# Supabase Project #1 credentials (SAME as main)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (from Project #1)

# Database URL with DIFFERENT schema
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?options=-c%20search_path%3Ddemo_infswsol_com

# Schema name (DIFFERENT from main)
DB_SCHEMA=demo_infswsol_com

# App URL
NEXT_PUBLIC_APP_URL=https://demo.infswsol.com

# SEO protection (block search engines)
NEXT_PUBLIC_ALLOW_INDEXING=false
```

### Enable Auto-Deploy

```bash
# 1. Go to Project Settings > Git
# 2. Verify "Production Branch": main
# 3. Verify "Preview Deployments" enabled
# 4. Add "demo" branch to preview deployments if needed

# Now:
# - Push to main → deploys to template.infswsol.com
# - Push to demo → deploys to demo.infswsol.com
```

---

## Section 6: Vercel Production App Projects

### One Vercel Project Per Production App

**Strategy:** Each production app = separate GitHub repo = separate Vercel project

**Why?**
- Independent deployments
- Separate environment variables
- Isolated logs and analytics
- Clean separation of concerns

### Creating First Production App

**Step 1: Create GitHub Repository** (covered in Section 9)

**Step 2: Import to Vercel**

```bash
# 1. Go to https://vercel.com/new
# 2. Choose "Import Git Repository"
# 3. Select "msundin/app1"
# 4. Click "Import"

# Project Settings:
# - Name: "app1"
# - Framework Preset: Next.js (auto-detected)
# - Leave other settings as default
```

**Step 3: Add novatratech.com Apex Domain**

```bash
# 1. Go to Project Settings > Domains
# 2. Add "novatratech.com" (apex domain)
#    - Type: Custom Domain
#    - Git Branch: main
#    - Click "Add"

# Vercel will show:
# "Add these DNS records to novatratech.com:"
# A record → 76.76.21.21
# A record → 76.76.21.22
```

**Why apex?** This unlocks wildcard DNS, making ALL subdomains automatically available.

**Step 4: Add app1.novatratech.com Subdomain**

```bash
# 1. Still in Project Settings > Domains
# 2. Add "app1.novatratech.com"
#    - Type: Custom Domain
#    - Git Branch: main
#    - Click "Add"

# Vercel will show:
# "This subdomain is automatically available via apex wildcard"
# Status: Ready (no additional DNS needed)
```

**Step 5: Configure Environment Variables**

```bash
# Go to Project Settings > Environment Variables

# Supabase Project #2 credentials
NEXT_PUBLIC_SUPABASE_URL=https://yyyyy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (from Project #2)

# Database URL with app1 schema
DATABASE_URL=postgresql://postgres.[project-ref-2]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?options=-c%20search_path%3Dapp1_novatratech_com

# Schema name
DB_SCHEMA=app1_novatratech_com

# App URL
NEXT_PUBLIC_APP_URL=https://app1.novatratech.com

# SEO protection (allow indexing for production)
NEXT_PUBLIC_ALLOW_INDEXING=true
```

**Step 6: Deploy**

```bash
# Push to main branch
git checkout main
git push origin main

# Vercel auto-deploys to app1.novatratech.com
# Check deployment at https://vercel.com/msundin/app1
```

---

## Section 7: DNS Configuration

### infswsol.com (Manual Subdomains)

**Constraint:** Apex domain points to home server, cannot use wildcard.

**DNS Records to Add:**

```dns
# Template subdomain
template.infswsol.com    CNAME    cname.vercel-dns.com

# Demo subdomain
demo.infswsol.com        CNAME    cname.vercel-dns.com
```

**Verification:**

```bash
# Wait 5-60 minutes for DNS propagation

# Check DNS resolution
dig template.infswsol.com
# Should show CNAME → cname.vercel-dns.com

dig demo.infswsol.com
# Should show CNAME → cname.vercel-dns.com

# Check HTTPS
curl -I https://template.infswsol.com
# Should return 200 OK with Vercel headers
```

### novatratech.com (Apex + Wildcard)

**Strategy:** Point apex to Vercel, enable wildcard for ALL subdomains.

**DNS Records to Add:**

```dns
# Apex domain (enables wildcard)
novatratech.com          A        76.76.21.21
novatratech.com          A        76.76.21.22

# Wildcard for ALL subdomains
*.novatratech.com        CNAME    cname.vercel-dns.com
```

**Verification:**

```bash
# Wait 5-60 minutes for DNS propagation

# Check apex resolution
dig novatratech.com
# Should show A records: 76.76.21.21, 76.76.21.22

# Check wildcard resolution
dig app1.novatratech.com
# Should show CNAME → cname.vercel-dns.com

dig app2.novatratech.com
# Should show CNAME → cname.vercel-dns.com

# Check HTTPS
curl -I https://app1.novatratech.com
# Should return 200 OK with Vercel headers
```

### SSL Certificates

**Automatic:** Vercel automatically provisions SSL certificates via Let's Encrypt.

```bash
# 1. Once DNS is configured and verified
# 2. Vercel automatically requests SSL certificate
# 3. Certificate provisioning takes ~1-5 minutes
# 4. Status visible in Vercel dashboard > Domains

# Check SSL status:
# Go to https://vercel.com/msundin/saas-template/settings/domains
# Each domain should show "✓ Active" with padlock icon
```

---

## Section 8: Environment Variables (Schema-Specific)

### Template - main branch (template.infswsol.com)

```bash
# Supabase Project #1 (infswsol.com apps)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Database URL with schema in search_path
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?options=-c%20search_path%3Dtemplate_infswsol_com

# Schema name (for Drizzle)
DB_SCHEMA=template_infswsol_com

# App URL (for redirects, emails, etc.)
NEXT_PUBLIC_APP_URL=https://template.infswsol.com

# Search Engine Indexing (false = block search engines)
NEXT_PUBLIC_ALLOW_INDEXING=false
```

**Where to set:** Vercel > saas-template > Settings > Environment Variables > Production

### Template - demo branch (demo.infswsol.com)

```bash
# Supabase Project #1 (same as main, different schema)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Database URL with DIFFERENT schema
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?options=-c%20search_path%3Ddemo_infswsol_com

# Schema name (DIFFERENT from main)
DB_SCHEMA=demo_infswsol_com

# App URL
NEXT_PUBLIC_APP_URL=https://demo.infswsol.com

# Search Engine Indexing (false = block search engines)
NEXT_PUBLIC_ALLOW_INDEXING=false
```

**Where to set:** Vercel > saas-template > Settings > Environment Variables > Preview (select demo branch)

### Production App1 (app1.novatratech.com)

```bash
# Supabase Project #2 (novatratech.com apps)
NEXT_PUBLIC_SUPABASE_URL=https://yyyyy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Database URL with app1 schema
DATABASE_URL=postgresql://postgres.[project-ref-2]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?options=-c%20search_path%3Dapp1_novatratech_com

# Schema name
DB_SCHEMA=app1_novatratech_com

# App URL
NEXT_PUBLIC_APP_URL=https://app1.novatratech.com

# Search Engine Indexing (true = allow search engines)
NEXT_PUBLIC_ALLOW_INDEXING=true
```

**Where to set:** Vercel > app1 > Settings > Environment Variables > Production

### Local Development (.env.local)

```bash
# Local Supabase (NO DB_SCHEMA needed)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (from local Supabase)

# Local Database (uses 'public' schema by default)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Search Engine Indexing (doesn't matter for local)
NEXT_PUBLIC_ALLOW_INDEXING=false
```

**Note:** Local development doesn't need `DB_SCHEMA` because it uses the default `public` schema.

---

## Section 9: Creating New Production App from Template

### Complete Workflow

```bash
# ========================================
# STEP 1: Create New GitHub Repository
# ========================================

# Clone template to new repo
gh repo create msundin/app1 --template msundin/saas-template --private

# Clone locally
git clone https://github.com/msundin/app1.git
cd app1


# ========================================
# STEP 2: Update CLAUDE.md Immediately
# ========================================

# Edit .claude/CLAUDE.md
# Update first lines to:
# App1 - Production Application
#
# ⚠️ IMPORTANT: This is app1, NOT the template!
#
# Forked from: saas-template
# Domain: app1.novatratech.com
# Supabase: Project #2, Schema: app1_novatratech_com


# ========================================
# STEP 3: Setup Local Development
# ========================================

# Create develop branch
git checkout -b develop

# Install dependencies
pnpm install

# Start local Supabase
pnpm supabase start

# Get local credentials
pnpm supabase status
# Copy API URL and anon key

# Setup environment
cp .env.example .env.local

# Edit .env.local with local credentials
# (same as current template local setup)

# Run migrations locally
pnpm db:push

# Start development server
pnpm dev
# Open http://localhost:3000


# ========================================
# STEP 4: Remove Template Example (Optional)
# ========================================

# Remove tasks feature if not needed
rm -rf src/features/tasks

# Update dashboard page to remove task components
# (Or keep as reference)

# Commit changes
git add .
git commit -m "Initial setup: Remove template example feature"


# ========================================
# STEP 5: Create Schema in Supabase Project #2
# ========================================

# Get Project #2 database URL
DATABASE_URL_PROJECT2="postgresql://postgres.[project-ref-2]:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# Create app1 schema
psql "$DATABASE_URL_PROJECT2" -c "CREATE SCHEMA IF NOT EXISTS app1_novatratech_com;"

# Run migrations for app1 schema
export DATABASE_URL="$DATABASE_URL_PROJECT2"
export DB_SCHEMA=app1_novatratech_com
pnpm db:push

# Verify tables created
DB_SCHEMA=app1_novatratech_com pnpm db:studio


# ========================================
# STEP 6: Create Vercel Project
# ========================================

# Via Web UI (easier):
# 1. Go to https://vercel.com/new
# 2. Import "msundin/app1"
# 3. Add domain: app1.novatratech.com
# 4. Configure environment variables (see Section 8)

# Via CLI:
pnpm vercel
# Follow prompts


# ========================================
# STEP 7: Deploy to Production
# ========================================

# Merge develop to main
git checkout main
git merge develop

# Push to GitHub (triggers Vercel deployment)
git push origin main

# Monitor deployment
# Check https://vercel.com/msundin/app1

# Verify deployment
curl -I https://app1.novatratech.com
# Should return 200 OK


# ========================================
# DONE! 🎉
# ========================================
```

---

## Section 10: Safe Database Operations

### Always with Schema Context

**RULE:** Cloud database operations require `DB_SCHEMA` environment variable.

```bash
# ✅ SAFE - Targets specific schema
DB_SCHEMA=template_infswsol_com pnpm db:push
DB_SCHEMA=demo_infswsol_com pnpm db:generate
DB_SCHEMA=app1_novatratech_com pnpm db:studio

# ❌ DANGEROUS - Will error (safety script prevents this)
pnpm db:push
# Output: ❌ ERROR: DB_SCHEMA environment variable required!
```

### Schema-Specific Operations

**Generate Migrations:**

```bash
# For template schema
DB_SCHEMA=template_infswsol_com pnpm db:generate

# For demo schema
DB_SCHEMA=demo_infswsol_com pnpm db:generate

# For production app schema
DB_SCHEMA=app1_novatratech_com pnpm db:generate
```

**Push Migrations:**

```bash
# For template schema
DB_SCHEMA=template_infswsol_com pnpm db:push

# For demo schema
DB_SCHEMA=demo_infswsol_com pnpm db:push

# For production app schema
DB_SCHEMA=app1_novatratech_com pnpm db:push
```

**Open Drizzle Studio:**

```bash
# For template schema
DB_SCHEMA=template_infswsol_com pnpm db:studio
# Opens studio at https://local.drizzle.studio
# Shows ONLY template_infswsol_com tables

# For demo schema
DB_SCHEMA=demo_infswsol_com pnpm db:studio
# Shows ONLY demo_infswsol_com tables
```

### Resetting Schema Safely

**Use `pnpm db:reset-schema` (requires confirmation):**

```bash
# Reset demo data (safe, template unaffected)
DB_SCHEMA=demo_infswsol_com pnpm db:reset-schema

# Output:
# ⚠️  WARNING: This will DELETE ALL DATA in schema: demo_infswsol_com
# This action cannot be undone!
#
# Type the schema name "demo_infswsol_com" to confirm:

# Type exact schema name
demo_infswsol_com

# Output:
# Dropping schema demo_infswsol_com...
# Recreating schema demo_infswsol_com...
# ✅ Schema reset complete!
```

### Listing Schemas

**See all schemas in database:**

```bash
pnpm db:list-schemas

# Output:
# Schemas in database:
# - template_infswsol_com
# - demo_infswsol_com
# - app1_novatratech_com
# - app2_novatratech_com
```

### Local Development (No Schema Required)

**Local uses 'public' schema by default:**

```bash
# Local database operations (no DB_SCHEMA needed)
pnpm dev
pnpm db:push
pnpm db:studio

# .env.local (no DB_SCHEMA)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

---

## Section 11: Branch Workflows

### Template Repository

**Branches:**
- `develop` - Local development only (not deployed)
- `main` - Deployed to template.infswsol.com
- `demo` - Deployed to demo.infswsol.com

**Daily Work (Local):**

```bash
# Work on develop branch locally
git checkout develop
pnpm dev

# Make changes, write tests, commit
git add .
git commit -m "Add new feature"
```

**Deploy Reference Template:**

```bash
# Merge to main when ready
git checkout main
git merge develop

# Push to GitHub (triggers Vercel deployment)
git push origin main

# Vercel auto-deploys to template.infswsol.com
# Uses schema: template_infswsol_com
```

**Update Client Demo:**

```bash
# Cherry-pick specific features for demo
git checkout demo
git cherry-pick [commit-hash]

# Or merge from develop
git merge develop

# Push to GitHub
git push origin demo

# Vercel auto-deploys to demo.infswsol.com
# Uses schema: demo_infswsol_com (separate data!)
```

### Production App Repository

**Branches:**
- `develop` - Local development only (not deployed)
- `main` - Deployed to app1.novatratech.com

**Daily Work (Local):**

```bash
# Work on develop branch locally
git checkout develop
pnpm dev

# Make changes, write tests, commit
git add .
git commit -m "Add user profile feature"

# Test locally with local Supabase
pnpm test
pnpm validate
```

**Deploy to Production:**

```bash
# Merge to main when ready
git checkout main
git merge develop

# Push to GitHub (triggers Vercel deployment)
git push origin main

# Vercel auto-deploys to app1.novatratech.com
# Uses schema: app1_novatratech_com
```

---

## Section 12: Migrating App to Paid Tier

### When to Migrate

**Triggers:**
- App approaching 500MB limit
- App generating revenue (can afford $25/month)
- Need more features (point-in-time recovery, daily backups)
- Need dedicated resources

### Migration Process

**Step 1: Export Specific Schema**

```bash
# Get current schema data
DATABASE_URL_PROJECT2="postgresql://postgres.[project-ref-2]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# Export app1 schema only
pg_dump \
  --schema=app1_novatratech_com \
  --format=custom \
  "$DATABASE_URL_PROJECT2" \
  > backups/app1_migration_$(date +%Y%m%d).dump
```

**Step 2: Create New Paid Supabase Project**

```bash
# 1. Go to https://supabase.com/dashboard
# 2. Click "New Project"
# 3. Fill in details:
#    - Name: "app1-production"
#    - Pricing Plan: Pro ($25/month)
# 4. Create project
```

**Step 3: Import Data**

```bash
# Get new project database URL
DATABASE_URL_NEW="postgresql://postgres.[new-project-ref]:[new-password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# Create schema
psql "$DATABASE_URL_NEW" -c "CREATE SCHEMA IF NOT EXISTS app1_novatratech_com;"

# Import backup
pg_restore \
  --schema=app1_novatratech_com \
  --dbname="$DATABASE_URL_NEW" \
  backups/app1_migration_YYYYMMDD.dump
```

**Step 4: Update Vercel Environment Variables**

```bash
# 1. Go to https://vercel.com/msundin/app1/settings/environment-variables
# 2. Update with new Supabase Project credentials
# 3. Redeploy
```

---

## Section 13: SEO Protection

### Why SEO Protection?

**Problem:** Don't want template/demo deployments indexed by Google.

**Solution:** Triple-layer protection to block search engines.

### Layer 1: robots.txt

```typescript
// app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true'

  if (!allowIndexing) {
    return {
      rules: { userAgent: '*', disallow: '/' }
    }
  }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`
  }
}
```

### Layer 2: Meta Tags

```typescript
// app/layout.tsx
const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true'

export const metadata: Metadata = {
  robots: allowIndexing ? 'index, follow' : 'noindex, nofollow'
}
```

### Layer 3: X-Robots-Tag Header

```typescript
// src/middleware.ts
const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true'

if (!allowIndexing) {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
}
```

### Configuration

**Template/Demo (Block Indexing):**

```bash
NEXT_PUBLIC_ALLOW_INDEXING=false
```

**Production App (Allow Indexing):**

```bash
NEXT_PUBLIC_ALLOW_INDEXING=true
```

---

## Section 14: Monitoring & Limits

### Supabase Database Size

**Check Size Per Project:**

```bash
# Project #1 (infswsol.com apps)
psql "$DATABASE_URL_PROJECT1" << 'EOF'
SELECT
  schemaname,
  pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))) as size
FROM pg_tables
WHERE schemaname IN ('template_infswsol_com', 'demo_infswsol_com')
GROUP BY schemaname
ORDER BY schemaname;
EOF

# Output:
#       schemaname        |  size
# ------------------------+--------
#  demo_infswsol_com      | 100 MB
#  template_infswsol_com  | 150 MB
```

### When to Upgrade

**Supabase Free → Pro ($25/month):**

```bash
# Upgrade when:
- Database size approaching 500MB
- App generates >$50/month revenue (2x cost)
- Need point-in-time recovery
- Need dedicated resources
```

**Vercel Free → Pro ($20/month):**

```bash
# Upgrade when:
- Bandwidth exceeding 100GB/month
- Need team collaboration
- Need organization repositories
```

---

## Section 15: Troubleshooting

### Schema-Specific Issues

**Problem:** "relation does not exist" error

```bash
# Error:
# ERROR: relation "tasks" does not exist

# Solution: Check DB_SCHEMA matches schema with tables

# 1. List all schemas
pnpm db:list-schemas

# 2. Verify which schema has tables
DB_SCHEMA=template_infswsol_com pnpm db:studio

# 3. Set correct DB_SCHEMA
export DB_SCHEMA=template_infswsol_com
pnpm db:push
```

### Migration Failures

**Problem:** Migration fails with "permission denied"

```bash
# Cause: Schema doesn't exist
# Solution: Create schema first

psql $DATABASE_URL -c "CREATE SCHEMA app1_novatratech_com;"
DB_SCHEMA=app1_novatratech_com pnpm db:push
```

### DNS Propagation

**Problem:** Domain not resolving

```bash
# Wait 5-60 minutes for DNS propagation

# Check DNS
dig template.infswsol.com

# Clear local DNS cache (macOS)
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### Deployment Errors

**Problem:** Vercel build fails with "MODULE_NOT_FOUND"

```bash
# Check which file imports the missing module
# Remove import from file
# Commit and push

git add .
git commit -m "Remove deleted import"
git push origin main
```

---

## Section 16: Complete Verification Checklist

### Initial Setup (One-Time)

```
Account Creation:
☐ Created Supabase account
☐ Created Vercel account
☐ Installed Vercel CLI
☐ Authenticated CLIs

Supabase Project #1:
☐ Created project "saas-reference-demos"
☐ Created schemas (template_infswsol_com, demo_infswsol_com)
☐ Ran migrations for both schemas
☐ Verified tables in Drizzle Studio

Supabase Project #2:
☐ Created project "saas-production-apps"
☐ Created schema (app1_novatratech_com)
☐ Ran migrations
☐ Verified tables

Vercel Template Project:
☐ Imported saas-template repository
☐ Added domains (template.infswsol.com, demo.infswsol.com)
☐ Configured environment variables (main and demo branches)
☐ Enabled auto-deploy

DNS Configuration:
☐ Added CNAME records for infswsol.com subdomains
☐ Added A records for novatratech.com apex
☐ Added wildcard CNAME for *.novatratech.com
☐ Verified DNS propagation
☐ Verified SSL certificates active
```

### Deployment Verification

```
Template Deployment:
☐ template.infswsol.com loads correctly
☐ Authentication works
☐ Dashboard accessible
☐ SEO protection active
☐ Database uses template_infswsol_com schema

Demo Deployment:
☐ demo.infswsol.com loads correctly
☐ Authentication works independently
☐ Database uses demo_infswsol_com schema
☐ Can reset demo data without affecting template

Production App1:
☐ Created new repo from template
☐ Updated CLAUDE.md
☐ Setup local development
☐ Created app1_novatratech_com schema
☐ Deployed to app1.novatratech.com
☐ Site loads correctly
☐ Indexing allowed
```

### Safety Verification

```
Safety Scripts:
☐ Tested require-schema.js
☐ Tested reset-schema.js
☐ Tested list-schemas.js
☐ Verified schema isolation

Database Isolation:
☐ Template data separate from demo
☐ Demo data separate from app1
☐ Can reset demo without affecting others
☐ Each schema has own users/auth

Backup & Recovery:
☐ Created backups of all schemas
☐ Tested restoration process
```

---

## Summary

**You now have:**

- ✅ 2 Supabase Projects - Demos isolated from production
- ✅ Unlimited Vercel Subdomains - Via novatratech.com apex
- ✅ Schema Isolation - Each app completely separate
- ✅ Safety Mechanisms - Prevent multi-schema accidents
- ✅ Easy Scaling - Add apps with just new schemas
- ✅ Clear Upgrade Path - Migrate profitable apps to paid tier
- ✅ Professional Domains - Separate demo/production

**Next steps:**

1. Follow this guide to set up accounts and deployments
2. Verify all checkboxes in Section 16
3. Create your first production app using Section 9
4. Start building features
5. Monitor usage monthly
6. Migrate profitable apps to paid tier when ready

---

**🎉 Congratulations!**
You have a production-ready deployment infrastructure that scales from free tier to paid as your apps grow.

**Happy shipping! 🚀**
