# Deployment Guide: Hybrid Bootstrap Strategy

**Last Updated:** October 2025
**Version:** 2.0.0
**Strategy:** Self-Hosted → Cloud Migration Path

---

## Table of Contents

1. [Overview](#overview)
2. [Repository Strategy](#repository-strategy)
3. [Architecture](#architecture)
4. [Prerequisites](#prerequisites)
5. [Phase 1: Bootstrap Setup](#phase-1-bootstrap-setup)
6. [Phase 2: Production Migration](#phase-2-production-migration)
7. [Environment Configuration](#environment-configuration)
8. [OAuth Setup](#oauth-setup)
9. [Backup Strategy](#backup-strategy)
10. [Troubleshooting](#troubleshooting)
11. [Cost Analysis](#cost-analysis)

---

## Overview

This deployment strategy allows you to:
- ✅ Test unlimited SaaS ideas for **$0/month**
- ✅ Use your existing TrueNAS SCALE server for Supabase hosting
- ✅ Leverage Vercel's free tier for global CDN
- ✅ Migrate individual apps to cloud only when they gain traction
- ✅ **No code changes** required between self-hosted and cloud

### Philosophy

**Bootstrap Phase:** Run everything free until you validate product-market fit.
**Production Phase:** Pay only for successful apps that have real users/revenue.

This approach saves **$400-900/month** compared to cloud-only hosting during the validation phase.

---

## Repository Strategy

This template uses a **three-tier repository approach** to optimize for different deployment scenarios:

### 1. **saas-template** (This Repository)

**Purpose:** Source code template for cloning
**Deployment:** Local development only (optional: deploy to saas-template.infswsol.com)
**Backend:** Supabase Local (Docker)

**Use for:**
- ✅ Feature development and testing
- ✅ Source of truth for all new apps
- ✅ Creating new production apps by cloning

**Deployment strategy:**
- Keep as local-only development environment
- OR optionally deploy to saas-template.infswsol.com with TrueNAS backend for remote testing

### 2. **saas-demo** (Separate Repository - Cloud Deployment)

**Purpose:** Cloud deployment validation + reliable customer demos
**Deployment:** Vercel Free + Supabase Cloud Free (Project #1 of 2)
**Domain:** demo.infswsol.com

**Why separate from template:**
- ✅ **Validates cloud deployment early** - Test Vercel + Supabase Cloud integration before production
- ✅ **Tests template cloning workflow** - Prove the "clone → deploy" process works
- ✅ **Always-available demo** - Show customers even if TrueNAS is down
- ✅ **Professional perception** - Cloud-hosted = enterprise credibility
- ✅ **Uses 1 of 2 free Supabase projects** - Intelligent free tier usage

**Workflow:**
```bash
# Clone template to create demo
git clone https://github.com/msundin/saas-template saas-demo
cd saas-demo
# Update package.json, deploy to Vercel + Supabase Cloud
```

### 3. **Production Apps** (app1, app2, ..., app20)

**Purpose:** Real SaaS applications testing product-market fit
**Initial Deployment:** Vercel Free + TrueNAS Supabase ($0/month)
**Domains:** app1.novatratech.com, app2.novatratech.com, etc.

**Bootstrap Phase (0-100 users):**
- Frontend: Vercel Free (global CDN)
- Backend: TrueNAS Supabase (unlimited apps, $0 cost)
- Test product-market fit without financial pressure

**Production Phase (100+ users OR paying customers):**
- Migrate to Supabase Cloud Free (Project #2)
- When 500MB exceeded → Supabase Cloud Paid ($25/month)
- When traffic high → Vercel Pro ($20/month)
- **Only pay when app is successful**

**Workflow:**
```bash
# Clone template for new production app
git clone https://github.com/msundin/saas-template app1
cd app1
# Deploy to Vercel Free + TrueNAS Supabase
# Iterate until successful
# Migrate to cloud only when needed
```

### Summary Table

| Repository | Purpose | Frontend | Backend | Domain | Cost |
|------------|---------|----------|---------|--------|------|
| **saas-template** | Source template | Local dev | Supabase Local | localhost:3000 | $0 |
| **saas-demo** | Cloud validation | Vercel Free | Supabase Cloud | demo.infswsol.com | $0 |
| **app1-20** (bootstrap) | Product testing | Vercel Free | TrueNAS | app{N}.novatratech.com | $0 |
| **app1** (successful) | Production | Vercel Pro | Supabase Cloud | app1.novatratech.com | $45/mo |

---

## Architecture

### Three-Stage Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: Local Development                                  │
├─────────────────────────────────────────────────────────────┤
│ Laptop/Desktop:                                              │
│   • pnpm dev → localhost:3000                                │
│   • Supabase Local (Docker) → localhost:54321               │
│   • Fast iteration, no internet dependency                   │
│                                                               │
│ Cost: $0                                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: Bootstrap / MVP Testing (0-100 users)              │
├─────────────────────────────────────────────────────────────┤
│ Frontend: Vercel Free Tier                                   │
│   • demo.infswsol.com                                        │
│   • saas-template.infswsol.com                               │
│   • app1-20.novatratech.com                                  │
│   • Global CDN, automatic HTTPS                              │
│   • Unlimited deployments                                    │
│                                                               │
│ Backend: TrueNAS SCALE (Your Home Server)                    │
│   • Supabase instances (Docker containers)                   │
│   • One instance per app                                     │
│   • Full Supabase features (auth, RLS, realtime, storage)   │
│   • Accessible via DDNS or Cloudflare Tunnel                 │
│                                                               │
│ Cost: $0/month for unlimited apps                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STAGE 3: Production (100+ active users, paying customers)   │
├─────────────────────────────────────────────────────────────┤
│ Frontend: Vercel Pro                                         │
│   • app1.novatratech.com                                     │
│   • Better performance, more bandwidth                       │
│   • $20/month                                                │
│                                                               │
│ Backend: Supabase Cloud                                      │
│   • Managed PostgreSQL                                       │
│   • Automated backups                                        │
│   • Global replication                                       │
│   • $25/month                                                │
│                                                               │
│ Cost: $45/month per successful app only                      │
│ (Other apps stay free on Stage 2 until needed)               │
└─────────────────────────────────────────────────────────────┘
```

### Network Topology

```
┌──────────────────────────────────────────────────────────┐
│                        Internet                           │
└──────┬──────────────────────────────────┬────────────────┘
       │                                  │
       │                                  │
       ├─> Vercel (Frontend)              ├─> Supabase Cloud
       │   • demo.infswsol.com   ─────────┤   • demo.infswsol.com backend
       │   • saas-template.infswsol.com    │   • Managed PostgreSQL
       │   • app1-20.novatratech.com       │   • Global availability
       │                                   │   • Free Project #1
       │                                   │
       │   API Requests (app1-20)          │
       │   ↓                               │
       │                                   │
┌──────┴───────────────────────────────────┴───────────────┐
│  Your Home Network                                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │ TrueNAS SCALE                                       │  │
│  │                                                     │  │
│  │ ┌─────────────────────────────────┐                │  │
│  │ │ Docker Compose Stack #1         │                │  │
│  │ │  • Supabase (template) OPTIONAL │                │  │
│  │ │    - PostgreSQL                 │                │  │
│  │ │    - Auth, Storage, Realtime    │                │  │
│  │ └─────────────────────────────────┘                │  │
│  │                                                     │  │
│  │ ┌─────────────────────────────────┐                │  │
│  │ │ Docker Compose Stack #2-20      │                │  │
│  │ │  • Supabase (app1-19)           │                │  │
│  │ │    - One instance per app       │                │  │
│  │ │    - Full isolation             │                │  │
│  │ └─────────────────────────────────┘                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  Exposed via:                                             │
│  • Cloudflare Tunnel (recommended), OR                    │
│  • DDNS + Port Forwarding + Caddy                         │
└───────────────────────────────────────────────────────────┘

Legend:
  demo.infswsol.com          → Supabase Cloud (validates cloud deployment)
  saas-template.infswsol.com → TrueNAS (optional, for remote testing)
  app1-20                    → TrueNAS (bootstrap phase, $0/month)
```

---

## Prerequisites

### TrueNAS SCALE Server

- ✅ TrueNAS SCALE installed and running
- ✅ Docker and Docker Compose available
- ✅ ZFS pool with sufficient space (recommend 100GB+ per Supabase instance)
- ✅ Static local IP configured
- ✅ SSH access enabled

### Home Network

- ✅ Stable internet connection (recommend 50+ Mbps upload)
- ✅ Router admin access for port forwarding (if not using Cloudflare Tunnel)
- ✅ Dynamic DNS service account (if not using static IP)
  - Recommended: [DuckDNS](https://www.duckdns.org/) (free)
  - Or: [No-IP](https://www.noip.com/) (free tier available)
- ✅ OR Cloudflare account (for Cloudflare Tunnel - recommended)

### Development Machine

- ✅ Node.js 20+ installed
- ✅ pnpm installed
- ✅ Git configured
- ✅ Vercel CLI installed: `pnpm install -g vercel`

### Accounts Needed

- ✅ Vercel account (free tier) - for all deployments
- ✅ Supabase Cloud account (free tier) - for saas-demo deployment
- ✅ GitHub account (for OAuth and deployment)
- ✅ Cloudflare account (optional but recommended for tunnel)

---

## Phase 1: Bootstrap Setup

**NOTE:** This phase is for setting up TrueNAS Supabase instances for:
- ✅ **Production apps** (app1-20.novatratech.com) - Bootstrap phase
- ✅ **Template** (saas-template.infswsol.com) - OPTIONAL remote testing

**For saas-demo (demo.infswsol.com):** Skip Phase 1. Use Supabase Cloud instead (see [saas-demo Deployment Guide](#saas-demo-deployment-guide) below).

---

### Step 1: TrueNAS - Install Supabase

There's an automated installer specifically for TrueNAS SCALE!

#### 1.1 SSH into TrueNAS

```bash
ssh admin@your-truenas-ip
```

#### 1.2 Create ZFS Dataset

```bash
# Create dataset for Supabase installations
zfs create pool1/supabase

# Create subdirectories for each app
mkdir -p /mnt/pool1/supabase/demo
mkdir -p /mnt/pool1/supabase/template
mkdir -p /mnt/pool1/supabase/app1
# Add more as needed...
```

#### 1.3 Install Supabase (First Instance)

```bash
# Download the automated installer
cd /mnt/pool1/supabase/demo
wget https://raw.githubusercontent.com/Jbcheck/truenas-supabase-installer/main/install-supabase.sh
chmod +x install-supabase.sh

# Run installer (will generate secure passwords automatically)
sudo ./install-supabase.sh
```

The installer will:
- Generate secure JWT secrets and database passwords
- Create `.env` file with all configuration
- Set up Docker Compose configuration
- Create systemd service for auto-start
- Configure port mappings

#### 1.4 Verify Installation

```bash
# Check containers are running
docker ps

# Should see containers:
# - supabase-db (PostgreSQL)
# - supabase-studio
# - supabase-auth
# - supabase-rest
# - supabase-realtime
# - supabase-storage
```

Access Supabase Studio:
```
http://your-truenas-ip:3000
```

**IMPORTANT:** Save the credentials displayed during installation!

```bash
# Credentials are in .env file:
cat /mnt/pool1/supabase/demo/.env

# Save these securely:
# - JWT_SECRET (for your Next.js app)
# - POSTGRES_PASSWORD
# - ANON_KEY (public key)
# - SERVICE_ROLE_KEY (secret key)
```

#### 1.5 Install Additional Instances

Repeat for each app, using **different ports**:

```bash
# Template instance
cd /mnt/pool1/supabase/template
# Modify install script or .env to use ports: 3001, 8001, 5433
./install-supabase.sh

# App1 instance
cd /mnt/pool1/supabase/app1
# Modify ports: 3002, 8002, 5434
./install-supabase.sh
```

**Port Mapping Convention:**

| Instance | Studio | API Gateway | PostgreSQL |
|----------|--------|-------------|------------|
| demo     | 3000   | 8000        | 5432       |
| template | 3001   | 8001        | 5433       |
| app1     | 3002   | 8002        | 5434       |
| app2     | 3003   | 8003        | 5435       |

### Step 2: Network Access Configuration

Choose ONE of these approaches:

#### Option A: Cloudflare Tunnel (Recommended - Most Secure)

**Why Cloudflare Tunnel?**
- ✅ No port forwarding needed (no holes in firewall)
- ✅ Automatic HTTPS with valid certificates
- ✅ DDoS protection
- ✅ Better performance (Cloudflare CDN)
- ✅ Free for personal use

**Setup:**

1. **Install Cloudflare Tunnel on TrueNAS:**

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Authenticate
cloudflared tunnel login
# Opens browser - log in to Cloudflare

# Create tunnel
cloudflared tunnel create saas-backend

# Save the tunnel ID and credentials shown
```

2. **Configure DNS in Cloudflare Dashboard:**

Go to Cloudflare → Your Domain → DNS:

```
Type: CNAME
Name: demo-api
Target: <tunnel-id>.cfargotunnel.com

Type: CNAME
Name: template-api
Target: <tunnel-id>.cfargotunnel.com

Type: CNAME
Name: app1-api
Target: <tunnel-id>.cfargotunnel.com
```

3. **Create Tunnel Configuration:**

```bash
# Create config file
sudo nano ~/.cloudflared/config.yml
```

```yaml
tunnel: <your-tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  # Demo Supabase API
  - hostname: demo-api.infswsol.com
    service: http://localhost:8000

  # Template Supabase API
  - hostname: saas-template-api.infswsol.com
    service: http://localhost:8001

  # App1 Supabase API
  - hostname: app1-api.novatratech.com
    service: http://localhost:8002

  # Catch-all (required)
  - service: http_status:404
```

4. **Start Tunnel Service:**

```bash
# Start tunnel
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Verify running
sudo systemctl status cloudflared
```

Your Supabase instances are now accessible:
- `https://demo-api.infswsol.com` → TrueNAS port 8000
- `https://saas-template-api.infswsol.com` → TrueNAS port 8001
- `https://app1-api.novatratech.com` → TrueNAS port 8002

#### Option B: DDNS + Port Forwarding (Alternative)

**If you prefer traditional approach or can't use Cloudflare:**

1. **Set up Dynamic DNS:**

```bash
# Install ddclient on TrueNAS
sudo apt install ddclient

# Configure for your DDNS provider
# Example: DuckDNS
sudo nano /etc/ddclient.conf
```

```conf
protocol=duckdns
use=web
server=www.duckdns.org
login=your-domain
password=your-token
your-domain.duckdns.org
```

```bash
# Start ddclient
sudo systemctl start ddclient
sudo systemctl enable ddclient
```

2. **Configure Router Port Forwarding:**

Forward these ports to your TrueNAS IP:

| External Port | Internal Port | Protocol | Service           |
|---------------|---------------|----------|-------------------|
| 8000          | 8000          | TCP      | Demo API          |
| 8001          | 8001          | TCP      | Template API      |
| 8002          | 8002          | TCP      | App1 API          |
| 443           | 443           | TCP      | HTTPS (via proxy) |

3. **Set up Reverse Proxy with SSL (Caddy):**

```bash
# Install Caddy on TrueNAS
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

```bash
# Configure Caddyfile
sudo nano /etc/caddy/Caddyfile
```

```caddy
demo-api.your-domain.duckdns.org {
    reverse_proxy localhost:8000
}

saas-template-api.your-domain.duckdns.org {
    reverse_proxy localhost:8001
}

app1-api.your-domain.duckdns.org {
    reverse_proxy localhost:8002
}
```

```bash
# Start Caddy
sudo systemctl reload caddy
```

### Step 3: Vercel Deployment

#### 3.1 Prepare Your Repository

```bash
# From your local development directory
cd /path/to/saas-template

# Ensure .env.local is in .gitignore (already is)
# Create .env.example for reference (we'll do this later)
```

#### 3.2 Deploy to Vercel

**For each app (demo, template, app1...):**

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Scope: Your account
# - Link to existing project? No
# - Project name: demo-infswsol (or template-infswsol, app1-novatratech, etc.)
# - Directory: ./
# - Override settings? No

# After successful deployment, configure environment variables
```

#### 3.3 Configure Environment Variables in Vercel

**Via Vercel Dashboard:**

1. Go to: https://vercel.com/your-username/demo-infswsol
2. Click "Settings" → "Environment Variables"
3. Add these variables:

**For demo.infswsol.com:**

```env
# Supabase Configuration (pointing to your TrueNAS)
NEXT_PUBLIC_SUPABASE_URL=https://demo-api.infswsol.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-truenas-demo-env>

# Database URL (for Server Actions)
DATABASE_URL=postgresql://postgres:<password>@demo-api.infswsol.com:5432/postgres

# Node Environment
NODE_ENV=production

# Optional: SEO Control
NEXT_PUBLIC_ROBOTS=noindex
```

**For saas-template.infswsol.com:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://saas-template-api.infswsol.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-truenas-template-env>
DATABASE_URL=postgresql://postgres:<password>@saas-template-api.infswsol.com:5433/postgres
NODE_ENV=production
NEXT_PUBLIC_ROBOTS=noindex
```

**For app1.novatratech.com:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://app1-api.novatratech.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-truenas-app1-env>
DATABASE_URL=postgresql://postgres:<password>@app1-api.novatratech.com:5434/postgres
NODE_ENV=production
# No NEXT_PUBLIC_ROBOTS (production app, allow indexing)
```

#### 3.4 Configure Custom Domains

**In Vercel Dashboard:**

1. Go to Project → "Settings" → "Domains"
2. Add custom domain:
   - demo.infswsol.com
   - saas-template.infswsol.com
   - app1.novatratech.com

3. Update DNS records in your domain provider:

```
Type: CNAME
Name: demo
Value: cname.vercel-dns.com

Type: CNAME
Name: template
Value: cname.vercel-dns.com

Type: CNAME
Name: app1
Value: cname.vercel-dns.com
```

Wait 5-10 minutes for DNS propagation. Vercel will automatically provision SSL certificates.

#### 3.5 Run Database Migrations

**For each app's first deployment:**

```bash
# SSH into TrueNAS
ssh admin@your-truenas-ip

# Navigate to Supabase instance
cd /mnt/pool1/supabase/demo

# Access PostgreSQL container
docker exec -it supabase-db psql -U postgres

# Run migrations (copy from migrations/schema.sql)
-- Or use Supabase Studio to run SQL
```

**Or use Supabase CLI remotely:**

```bash
# From your local machine, targeting TrueNAS Supabase
DATABASE_URL=postgresql://postgres:<password>@demo-api.infswsol.com:5432/postgres \
  pnpm supabase db push
```

### Step 4: Verify Bootstrap Setup

#### 4.1 Test Frontend

Visit your deployed apps:
- https://demo.infswsol.com
- https://saas-template.infswsol.com
- https://app1.novatratech.com

Verify:
- ✅ Page loads
- ✅ HTTPS works (valid certificate)
- ✅ No console errors

#### 4.2 Test Authentication

1. Sign up with test email
2. Verify email redirect works
3. Log in
4. Verify dashboard access
5. Log out

#### 4.3 Test Database Connection

1. Create a task in demo app
2. SSH into TrueNAS:

```bash
docker exec -it supabase-db psql -U postgres -c "SELECT * FROM tasks;"
```

Verify task appears in database.

#### 4.4 Test RLS Policies

1. Create account A, create task
2. Create account B, try to access tasks
3. Verify account B cannot see account A's tasks

### Step 5: Backup Configuration

#### 5.1 ZFS Snapshots (TrueNAS)

```bash
# Create automated snapshot task in TrueNAS GUI:
# Storage → Snapshots → Add

# Snapshot Task Configuration:
Dataset: pool1/supabase
Recursive: Yes
Snapshot Lifetime: 30 days
Schedule: Daily at 3:00 AM
```

#### 5.2 Database Backups to Cloud

**Set up automatic PostgreSQL dumps:**

```bash
# Create backup script
sudo nano /usr/local/bin/supabase-backup.sh
```

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/mnt/pool1/backups/supabase"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Backup each instance
for instance in demo template app1; do
    echo "Backing up $instance..."

    # Get port for this instance
    case $instance in
        demo) PORT=5432 ;;
        template) PORT=5433 ;;
        app1) PORT=5434 ;;
    esac

    # Create backup
    docker exec supabase-db-$instance pg_dump -U postgres \
        > "$BACKUP_DIR/${instance}_${DATE}.sql"

    echo "Backup completed: ${instance}_${DATE}.sql"
done

# Upload to cloud storage (optional - requires rclone configured)
# rclone copy "$BACKUP_DIR" backblaze:saas-backups/supabase

# Clean up old backups
find "$BACKUP_DIR" -name "*.sql" -mtime +$RETENTION_DAYS -delete

echo "Backup completed successfully"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/supabase-backup.sh

# Add to crontab (daily at 2:00 AM)
sudo crontab -e
```

```cron
0 2 * * * /usr/local/bin/supabase-backup.sh >> /var/log/supabase-backup.log 2>&1
```

#### 5.3 Optional: Cloud Storage Sync (Backblaze B2)

**Free tier: 10GB storage, 1GB daily egress**

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure Backblaze B2
rclone config
# Follow prompts to add Backblaze B2 remote

# Test backup
rclone copy /mnt/pool1/backups/supabase backblaze:saas-backups/supabase

# Add to backup script (already shown above)
```

---

## saas-demo Deployment Guide

**Purpose:** Deploy the demo app to Vercel + Supabase Cloud to validate the cloud deployment process and maintain a reliable customer demo.

### Why Deploy saas-demo First?

Before deploying production apps to TrueNAS, deploy saas-demo to cloud to:
1. ✅ **Validate the deployment workflow** - Test the full Vercel + Supabase integration
2. ✅ **Create template cloning documentation** - Document the clone → deploy process
3. ✅ **Ensure always-available demo** - Show customers without TrueNAS dependency
4. ✅ **Test cloud features** - Verify auth, RLS, and all features work in cloud

### Step 1: Clone Template Repository

```bash
# Clone saas-template to create saas-demo
cd ~/projects
git clone https://github.com/msundin/saas-template saas-demo
cd saas-demo

# Update package.json
# Change "name": "saas-template" to "name": "saas-demo"

# Create new GitHub repository
gh repo create msundin/saas-demo --public --source=. --remote=origin

# Push to new repository
git push -u origin main
```

### Step 2: Create Supabase Cloud Project

1. **Go to https://supabase.com/dashboard**
2. **Click "New Project":**
   - Organization: Select or create
   - Name: `saas-demo`
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to your users (e.g., us-east-1)
   - Plan: **Free** (500MB database, 50k MAU, 2GB bandwidth)

3. **Wait ~2 minutes for provisioning**

4. **Save credentials** (Project Settings → API):
   ```
   Project URL: https://abcdefgh.supabase.co
   Anon/Public Key: eyJhbGci...
   Service Role Key: eyJhbGci... (secret, never expose)
   ```

5. **Get Database URL** (Project Settings → Database → Connection String):
   - Use **Transaction mode** (port 5432) for migrations:
     ```
     postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
     ```
   - Use **Session mode** (port 6543) for runtime queries:
     ```
     postgresql://postgres.[project-ref]:[password]@aws-0-region.pooler.supabase.com:6543/postgres
     ```

### Step 3: Run Migrations

```bash
# Link to your Supabase Cloud project
pnpm supabase link --project-ref [your-project-ref]
# Enter database password when prompted

# Push migrations to Supabase Cloud (creates tables + RLS policies)
pnpm supabase db push

# Verify tables created
# Go to Supabase Dashboard → Table Editor
# Should see: tasks table with RLS policies enabled
# Auth → Policies should show 4 policies (SELECT, INSERT, UPDATE, DELETE)
```

**Why this command:**
- ✅ Applies SQL migrations from `supabase/migrations/` directory
- ✅ Creates RLS policies (Drizzle cannot do this!)
- ✅ Maintains Supabase as single source of truth
- ✅ Ensures security policies are properly enforced

**Optional: Generate Drizzle Schema (for complex server-side queries)**

If you plan to use Drizzle for complex queries:

```bash
# After migrations are applied, generate Drizzle schema from database
pnpm exec dotenv -e .env.local -- drizzle-kit introspect

# Copy generated schema to project
cp drizzle/migrations/schema.ts src/lib/drizzle/schema.ts

# Now you can use Drizzle for type-safe complex queries
# (Supabase client still used for simple queries with automatic RLS)
```

### Step 4: Deploy to Vercel

```bash
# Login to Vercel (if not already)
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Scope: Your account/team
# - Link to existing project? No
# - Project name: saas-demo
# - Directory: ./
# - Override settings? No
```

### Step 5: Configure Environment Variables in Vercel

**Via Vercel Dashboard:**

1. Go to https://vercel.com/your-username/saas-demo
2. Settings → Environment Variables
3. Add these variables for **Production, Preview, and Development**:

```env
# Supabase Configuration (from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Database URL (Session mode for runtime)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-region.pooler.supabase.com:6543/postgres

# App URL (will update after custom domain)
NEXT_PUBLIC_APP_URL=https://saas-demo.vercel.app

# SEO Protection (block search engines)
NEXT_PUBLIC_ROBOTS=noindex
```

**Via Vercel CLI (alternative):**

```bash
# Add environment variables via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste value when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_ROBOTS production

# Repeat for preview and development environments if needed
```

### Step 6: Configure Custom Domain

**In Vercel Dashboard:**

1. Go to Project → Settings → Domains
2. Add custom domain: `demo.infswsol.com`
3. Vercel will show DNS records to add

**In your DNS provider (e.g., Cloudflare, Namecheap):**

Since `infswsol.com` apex is already pointing to your home server, you need to manually add the subdomain:

```
Type: CNAME
Name: demo
Target: cname.vercel-dns.com
TTL: Auto (or 3600)
```

**Wait for DNS propagation** (usually 5-60 minutes)

**Update environment variable:**
```bash
# Update NEXT_PUBLIC_APP_URL to custom domain
vercel env rm NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://demo.infswsol.com
```

**Redeploy to pick up new environment variable:**
```bash
vercel --prod
```

### Step 7: Add Demo Data

```bash
# Visit https://demo.infswsol.com
# Sign up with a demo account:
# Email: demo@example.com
# Password: DemoPassword123!

# Create sample tasks:
# - "Welcome to the demo!"
# - "Try creating a new task"
# - "Toggle task completion"
# - "Delete unwanted tasks"

# This data will persist in Supabase Cloud
```

### Step 8: Verify Deployment

**Checklist:**
- ✅ Site accessible at https://demo.infswsol.com
- ✅ SSL certificate valid (automatic via Vercel)
- ✅ Can sign up new users
- ✅ Can log in
- ✅ Can create/update/delete tasks
- ✅ RLS policies working (users only see their own tasks)
- ✅ Logout works
- ✅ robots.txt blocks search engines (visit /robots.txt)

**Test with curl:**
```bash
# Test site is accessible
curl -I https://demo.infswsol.com

# Should return 200 OK with security headers

# Test robots.txt
curl https://demo.infswsol.com/robots.txt

# Should show:
# User-agent: *
# Disallow: /
```

### Step 9: Document Learnings

Create a deployment log to reference when deploying production apps:

```bash
# In saas-demo repository
touch DEPLOYMENT_LOG.md
```

Document:
- ✅ Any issues encountered during deployment
- ✅ DNS configuration details
- ✅ Environment variables that needed adjustment
- ✅ Supabase Cloud setup steps
- ✅ Migration commands that worked
- ✅ Vercel configuration notes

### Success Criteria

- ✅ demo.infswsol.com accessible publicly
- ✅ All features working (auth, tasks, logout)
- ✅ Cloud deployment process validated
- ✅ Template cloning workflow tested
- ✅ Deployment documentation updated
- ✅ Demo ready to show customers

**Next:** Use this experience to deploy production apps to TrueNAS with confidence.

---

## Phase 2: Production Migration

### When to Migrate to Cloud

Migrate individual apps when they reach:
- ✅ 100+ daily active users
- ✅ Paying customers (recurring revenue)
- ✅ Need for global performance
- ✅ Need for 99.9%+ uptime SLA
- ✅ Team collaboration (multiple developers)

**Cost-benefit:** At $45/month per app, wait until you have revenue to justify the cost.

### Migration Process (Self-Hosted → Supabase Cloud)

#### Step 1: Create Supabase Cloud Project

1. Go to https://supabase.com
2. Create new project:
   - Project name: app1-novatratech
   - Database password: Generate strong password (save it!)
   - Region: Choose closest to your users
   - Plan: Pro ($25/month)

3. Save project credentials:
   - Project URL: `https://abc123.supabase.co`
   - `anon` public key
   - `service_role` secret key
   - Database password

#### Step 2: Export Data from TrueNAS

```bash
# SSH into TrueNAS
ssh admin@your-truenas-ip

# Export database (app1 example)
docker exec supabase-db-app1 pg_dump -U postgres \
    --clean \
    --if-exists \
    --format=custom \
    --file=/tmp/app1-migration.dump

# Copy to local machine
scp admin@your-truenas-ip:/tmp/app1-migration.dump ./app1-migration.dump
```

#### Step 3: Import to Supabase Cloud

```bash
# From your local machine

# Set connection string (from Supabase Cloud dashboard)
DB_URL="postgresql://postgres:[password]@db.abc123.supabase.co:5432/postgres"

# Restore database
pg_restore --clean --if-exists \
    --no-owner --no-acl \
    --dbname="$DB_URL" \
    app1-migration.dump

# Verify import
psql "$DB_URL" -c "SELECT count(*) FROM auth.users;"
psql "$DB_URL" -c "SELECT count(*) FROM tasks;"
```

**Important:** This preserves:
- ✅ All user accounts (with hashed passwords)
- ✅ All user data
- ✅ All RLS policies
- ✅ All indexes and constraints

Users can log in immediately with existing credentials!

#### Step 4: Update Vercel Environment Variables

**In Vercel Dashboard for app1.novatratech.com:**

1. Go to Settings → Environment Variables
2. Update these variables:

```env
# OLD (pointing to TrueNAS)
NEXT_PUBLIC_SUPABASE_URL=https://app1-api.novatratech.com
DATABASE_URL=postgresql://postgres:pass@app1-api.novatratech.com:5434/postgres

# NEW (pointing to Supabase Cloud)
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<new-anon-key>
DATABASE_URL=postgresql://postgres:<new-pass>@db.abc123.supabase.co:5432/postgres
```

3. Click "Save"
4. Trigger redeploy:

```bash
# From local machine
vercel --prod

# Or in Vercel Dashboard: Deployments → Redeploy
```

#### Step 5: Verify Migration

1. **Test authentication:**
   - Log in with existing user
   - Verify dashboard access
   - Check data appears correctly

2. **Test new signups:**
   - Create new account
   - Verify email delivery
   - Check user appears in Supabase dashboard

3. **Test data operations:**
   - Create new task
   - Edit task
   - Delete task
   - Verify RLS policies working

4. **Monitor for 24-48 hours:**
   - Check Vercel logs for errors
   - Check Supabase logs
   - Monitor performance metrics

#### Step 6: Clean Up TrueNAS Instance (Optional)

**After verifying migration is successful:**

```bash
# SSH into TrueNAS
ssh admin@your-truenas-ip

# Stop app1 Supabase instance
cd /mnt/pool1/supabase/app1
docker compose down

# Optional: Remove data (be SURE migration is verified!)
# rm -rf /mnt/pool1/supabase/app1
```

**Keep the backup for 30 days before deletion.**

### Migration Rollback Plan

If issues arise during migration:

```bash
# In Vercel Dashboard: Revert environment variables
# Trigger redeployment

# Or: Instant rollback to previous deployment
# Vercel Dashboard → Deployments → Previous deployment → Promote to Production
```

Your app is back on TrueNAS within seconds!

---

## Environment Configuration

### Local Development (.env.local)

```env
# Local Supabase (Docker)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Development mode
NODE_ENV=development
```

### Bootstrap / Self-Hosted (Vercel Environment Variables)

**Demo:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://demo-api.infswsol.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<truenas-demo-anon-key>
DATABASE_URL=postgresql://postgres:<pass>@demo-api.infswsol.com:5432/postgres
NODE_ENV=production
NEXT_PUBLIC_ROBOTS=noindex
```

**Template:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://template-api.infswsol.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<truenas-template-anon-key>
DATABASE_URL=postgresql://postgres:<pass>@template-api.infswsol.com:5433/postgres
NODE_ENV=production
NEXT_PUBLIC_ROBOTS=noindex
```

### Production / Cloud (Vercel Environment Variables)

**App1 (migrated to Supabase Cloud):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-cloud-anon-key>
DATABASE_URL=postgresql://postgres:<pass>@db.abc123.supabase.co:5432/postgres
NODE_ENV=production
# No NEXT_PUBLIC_ROBOTS (allow indexing)
```

---

## OAuth Setup

### Google OAuth (Example)

**One-time setup in Google Cloud Console, then reuse credentials:**

#### 1. Create OAuth App (Once)

1. Go to: https://console.cloud.google.com
2. Create project: "SaaS Template Auth"
3. Enable Google+ API
4. Go to: Credentials → Create Credentials → OAuth Client ID
5. Application type: Web application
6. Name: "SaaS Template"
7. Authorized redirect URIs:

```
# Local Development
http://localhost:54321/auth/v1/callback

# Bootstrap (TrueNAS)
https://demo-api.infswsol.com/auth/v1/callback
https://template-api.infswsol.com/auth/v1/callback
https://app1-api.novatratech.com/auth/v1/callback

# Production (Supabase Cloud) - Add when migrating
https://abc123.supabase.co/auth/v1/callback
```

8. Save credentials:
   - Client ID: `123456789.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-abc123...`

#### 2. Configure in Each Supabase Instance

**For TrueNAS instances:**

1. Open Supabase Studio: `http://your-truenas-ip:3000`
2. Go to: Authentication → Providers → Google
3. Enable Google provider
4. Enter Client ID and Client Secret (same credentials for all)
5. Save

**For Supabase Cloud (after migration):**

1. Go to: https://supabase.com → Your Project
2. Settings → Authentication → Providers → Google
3. Enter Client ID and Client Secret (same credentials!)
4. Save

#### 3. Add Sign-In Button to Your App

**The code is already in the template!**

```typescript
// src/features/auth/components/SignInWithGoogle.tsx
import { createClient } from '@/lib/supabase/client'

export function SignInWithGoogle() {
  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  return (
    <button onClick={handleGoogleSignIn}>
      Sign in with Google
    </button>
  )
}
```

**This exact code works for:**
- ✅ Local development
- ✅ TrueNAS self-hosted
- ✅ Supabase Cloud
- ✅ No environment-specific changes needed!

### GitHub OAuth (Example)

**Similar process:**

1. Go to: https://github.com/settings/developers
2. New OAuth App
3. Application name: "SaaS Template"
4. Homepage URL: `https://saas-template.infswsol.com`
5. Authorization callback URLs:

```
http://localhost:54321/auth/v1/callback
https://demo-api.infswsol.com/auth/v1/callback
https://template-api.infswsol.com/auth/v1/callback
https://app1-api.novatratech.com/auth/v1/callback
```

6. Save Client ID and Client Secret
7. Add to each Supabase instance (same credentials everywhere)

### OAuth Pattern Reuse

**When cloning template to new app:**

1. Clone repository: `git clone template-repo new-app`
2. OAuth code already exists in `src/features/auth/components/`
3. Just add new redirect URL to existing OAuth app in Google/GitHub
4. Configure in new Supabase instance with same credentials
5. **Done!** ~5 minutes per new app

---

## Backup Strategy

### Three-Layer Backup Approach

#### Layer 1: ZFS Snapshots (Instant Recovery)

**TrueNAS automatic snapshots:**
- Frequency: Every 4 hours, plus daily snapshot
- Retention: 7 days for 4-hour snapshots, 30 days for daily
- Recovery time: < 1 minute

**Restore from snapshot:**

```bash
# List snapshots
zfs list -t snapshot -r pool1/supabase

# Rollback to specific snapshot
zfs rollback pool1/supabase/app1@daily-2025-10-30
```

#### Layer 2: PostgreSQL Dumps (Portable Backups)

**Automated daily dumps:**
- Script runs at 2 AM daily (cron job)
- Exports each database to `.sql` file
- Stored in `/mnt/pool1/backups/supabase`
- Retention: 30 days local

**Manual backup:**

```bash
# Backup specific instance
docker exec supabase-db-app1 pg_dump -U postgres \
    > app1-backup-$(date +%Y%m%d).sql

# Backup with compression
docker exec supabase-db-app1 pg_dump -U postgres | gzip \
    > app1-backup-$(date +%Y%m%d).sql.gz
```

**Restore from dump:**

```bash
# Restore to same instance
docker exec -i supabase-db-app1 psql -U postgres < app1-backup-20251030.sql

# Restore to new instance
psql -h new-server -U postgres -d postgres < app1-backup-20251030.sql
```

#### Layer 3: Cloud Storage (Disaster Recovery)

**Backblaze B2 (Free tier: 10GB):**
- Automated sync via rclone
- Runs after daily database dump
- Encrypted at rest
- Geographic redundancy

**Configure cloud backup:**

```bash
# Configure rclone (one-time)
rclone config

# Test upload
rclone copy /mnt/pool1/backups/supabase backblaze:saas-backups/

# Verify
rclone ls backblaze:saas-backups/supabase

# Add to cron (already in backup script)
```

**Recovery from cloud:**

```bash
# List available backups
rclone ls backblaze:saas-backups/supabase

# Download specific backup
rclone copy backblaze:saas-backups/supabase/app1_20251030.sql.gz ./

# Extract and restore
gunzip app1_20251030.sql.gz
psql -h your-server < app1_20251030.sql
```

### Backup Testing

**Test backups monthly:**

```bash
# 1. Create test Supabase instance
cd /mnt/pool1/supabase/test
docker compose up -d

# 2. Restore latest backup
docker exec -i supabase-db-test psql -U postgres \
    < /mnt/pool1/backups/supabase/app1_latest.sql

# 3. Verify data
docker exec supabase-db-test psql -U postgres \
    -c "SELECT count(*) FROM auth.users;"

# 4. Clean up
docker compose down
rm -rf /mnt/pool1/supabase/test
```

**Document results in backup log.**

---

## Troubleshooting

### Issue: Cannot Connect to TrueNAS Supabase

**Symptoms:**
- Vercel deployment shows "Failed to connect to database"
- `ECONNREFUSED` errors in logs

**Solutions:**

1. **Verify Supabase is running:**

```bash
ssh admin@your-truenas-ip
docker ps | grep supabase
# Should see all supabase containers running
```

2. **Check Cloudflare Tunnel status:**

```bash
sudo systemctl status cloudflared
# Should be active (running)

# Check tunnel connectivity
cloudflared tunnel list
```

3. **Verify port forwarding (if using DDNS):**

Test from external network:

```bash
curl https://demo-api.infswsol.com/health
# Should return 200 OK
```

4. **Check firewall rules:**

```bash
# TrueNAS firewall
sudo ufw status
# Ensure ports 8000, 8001, 8002, etc. are allowed
```

5. **Verify environment variables in Vercel:**

Vercel Dashboard → Project → Settings → Environment Variables

Ensure `NEXT_PUBLIC_SUPABASE_URL` matches your tunnel/DDNS URL exactly.

### Issue: Authentication Not Working

**Symptoms:**
- "Invalid JWT" errors
- Cannot log in even with correct credentials
- Sessions expire immediately

**Solutions:**

1. **Verify JWT secret matches:**

```bash
# On TrueNAS, check JWT secret
cat /mnt/pool1/supabase/demo/.env | grep JWT_SECRET

# Ensure this matches the SUPABASE_ANON_KEY in Vercel
```

2. **Check redirect URL configuration:**

Supabase Studio → Authentication → URL Configuration:
- Site URL: `https://demo.infswsol.com`
- Redirect URLs: `https://demo.infswsol.com/**`

3. **Verify callback route exists:**

```bash
# Check file exists
ls src/app/auth/callback/route.ts
# Should exist from template
```

4. **Check CORS settings:**

Supabase Studio → Settings → API → CORS:
- Add your Vercel domain: `https://demo.infswsol.com`

### Issue: Database Migration Failed

**Symptoms:**
- Import to Supabase Cloud shows errors
- Missing tables or data after migration

**Solutions:**

1. **Check for schema conflicts:**

```bash
# Before import, check target database is clean
psql "$CLOUD_DB_URL" -c "\dt"
# Should show minimal tables (Supabase defaults)
```

2. **Use `--clean --if-exists` flags:**

```bash
pg_dump --clean --if-exists ... > backup.sql
# This handles existing objects gracefully
```

3. **Import in sections if needed:**

```bash
# Schema only first
pg_dump --schema-only ... > schema.sql
psql "$CLOUD_DB_URL" < schema.sql

# Then data
pg_dump --data-only ... > data.sql
psql "$CLOUD_DB_URL" < data.sql
```

4. **Check for RLS policy conflicts:**

After import, verify policies:

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

### Issue: Performance is Slow

**Symptoms:**
- Page load times >3 seconds
- API requests timing out
- Database queries slow

**Solutions:**

1. **Check home internet speed:**

```bash
# On TrueNAS
speedtest-cli
# Upload speed should be >50 Mbps for good performance
```

2. **Enable database connection pooling:**

Add to Vercel environment variables:

```env
DATABASE_URL=postgresql://postgres:pass@...?pgbouncer=true&connection_limit=10
```

3. **Optimize database:**

```sql
-- Run on TrueNAS Supabase
VACUUM ANALYZE;
REINDEX DATABASE postgres;
```

4. **Check container resources:**

```bash
docker stats
# Ensure Supabase containers aren't hitting resource limits
```

5. **Consider migration to cloud:**

If consistent slow performance, may be time to migrate to Supabase Cloud for global edge network.

### Issue: Deployment Fails on Vercel

**Symptoms:**
- Build errors during deployment
- Environment variable issues

**Solutions:**

1. **Check build logs:**

Vercel Dashboard → Deployments → Failed deployment → View logs

2. **Verify environment variables are set:**

```bash
# All deployments need these:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
DATABASE_URL
```

3. **Test build locally:**

```bash
# With production environment
cp .env.production .env.local
pnpm build
# Should complete without errors
```

4. **Clear Vercel cache:**

Vercel Dashboard → Settings → Clear Build Cache

Then redeploy.

### Getting Help

**TrueNAS Community:**
- Forum: https://forums.truenas.com/
- Discord: https://discord.gg/truenas

**Supabase Community:**
- Discord: https://discord.supabase.com/
- GitHub Discussions: https://github.com/orgs/supabase/discussions

**This Repository:**
- Open issue: https://github.com/your-org/saas-template/issues
- Check existing issues for solutions

---

## Cost Analysis

### Bootstrap Phase (0-2 successful apps)

```
Infrastructure:
  Vercel Free Tier:          $0/month
  TrueNAS Supabase × 20:     $0/month (already own hardware)
  Cloudflare Tunnel:         $0/month
  Backblaze B2 (10GB):       $0/month

Ongoing:
  Electricity (~50W):        ~$5/month
  Internet (existing):       $0 (already paying)

Total: $5/month for unlimited apps
```

### Hybrid Phase (2-5 successful apps)

```
Infrastructure:
  Vercel Free:               $0/month (free tier)
  TrueNAS Supabase × 15:     $0/month (testing/staging)
  Supabase Cloud × 2:        $50/month (successful apps)
  Cloudflare Tunnel:         $0/month

Total: $50/month
  Per successful app: $25/month
  Testing apps: Free
```

### Growth Phase (5-10 successful apps)

```
Infrastructure:
  Vercel Pro:                $20/month (better perf)
  TrueNAS Supabase × 10:     $0/month (testing/staging)
  Supabase Cloud × 5:        $125/month (successful apps)
  Cloudflare:                $0/month

Total: $145/month
  Per successful app: $29/month average
  Testing apps: Still free!
```

### Comparison: Cloud-Only Approach

```
Same scenario (5 successful apps):
  Vercel Pro:                $20/month
  Supabase Cloud × 15:       $375/month (all apps, no free testing)

Total: $395/month

Savings with hybrid: $250/month ($3,000/year)
```

### ROI Calculation

**Scenario:** You test 20 SaaS ideas. 2 gain traction (10% success rate).

**Hybrid Bootstrap Approach:**
```
Year 1 costs:
  Months 1-6 (testing): $5/mo × 6 = $30
  Months 7-12 (2 successful): $50/mo × 6 = $300
  Total Year 1: $330
```

**Cloud-Only Approach:**
```
Year 1 costs:
  All 12 months: $395/mo × 12 = $4,740
  Total Year 1: $4,740
```

**Savings: $4,410 in first year** 💰

---

## Best Practices

### Security

1. **Never commit secrets:**
   - Keep `.env.local` in `.gitignore`
   - Use Vercel environment variables for production
   - Rotate JWT secrets annually

2. **Use strong passwords:**
   - PostgreSQL: 32+ character random
   - Supabase JWT: 64+ character random
   - Generate with: `openssl rand -base64 64`

3. **Keep TrueNAS secure:**
   - Enable SSH key authentication only
   - Disable password authentication
   - Keep system updated: `apt update && apt upgrade`
   - Enable firewall: `ufw enable`

4. **Monitor access logs:**
   - Check Supabase Studio logs regularly
   - Review Vercel access logs
   - Set up alerts for suspicious activity

### Performance

1. **Database indexing:**
   - Add indexes on frequently queried columns
   - Run `EXPLAIN ANALYZE` on slow queries
   - Optimize based on results

2. **Connection pooling:**
   - Use PgBouncer for high-traffic apps
   - Set appropriate `connection_limit`
   - Monitor connection usage

3. **Caching:**
   - Use Next.js static generation where possible
   - Implement API response caching
   - Cache database queries in Redis (if needed)

4. **Monitoring:**
   - Set up Vercel Analytics
   - Monitor Supabase performance metrics
   - Track error rates and slow queries

### Maintenance

1. **Regular updates:**
   - Update Supabase Docker images monthly
   - Keep Next.js and dependencies current
   - Test updates in staging first

2. **Backup verification:**
   - Test restore monthly
   - Verify cloud backup sync
   - Document restore procedures

3. **Health checks:**
   - Set up uptime monitoring (UptimeRobot free tier)
   - Monitor disk space on TrueNAS
   - Check Docker container health

4. **Documentation:**
   - Document all customizations
   - Keep runbook updated
   - Record all migrations and changes

---

## Conclusion

This hybrid bootstrap strategy gives you:

✅ **Maximum flexibility** - Test unlimited ideas without cost pressure
✅ **Smooth scaling** - Migrate only successful apps to production infrastructure
✅ **Cost efficiency** - Save thousands during validation phase
✅ **Production quality** - Same security and features as cloud deployments
✅ **No vendor lock-in** - Own your infrastructure, migrate when needed

**Next Steps:**

1. ✅ Read this guide thoroughly
2. ✅ Set up TrueNAS Supabase (1-2 hours)
3. ✅ Deploy first app to Vercel (30 minutes)
4. ✅ Configure backups (30 minutes)
5. ✅ Test authentication flow (15 minutes)
6. ✅ Clone template for next app (15 minutes)

**Happy building!** 🚀

---

**Support:**
- GitHub Issues: https://github.com/your-org/saas-template/issues
- Documentation: https://saas-template.infswsol.com/docs
- Community Discord: [Link]

**Last Updated:** October 2025
**Maintainer:** [Your Name]
**Version:** 2.0.0
