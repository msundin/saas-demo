#!/usr/bin/env node

/**
 * Safety Script: Require DB_SCHEMA Environment Variable
 *
 * Prevents accidental multi-schema operations by requiring
 * DB_SCHEMA to be explicitly set for cloud database operations.
 *
 * Usage:
 *   DB_SCHEMA=template_infswsol_com pnpm db:push
 *   DB_SCHEMA=demo_infswsol_com pnpm db:push
 *   DB_SCHEMA=app1_novatratech_com pnpm db:push
 *
 * This script is called by package.json before dangerous operations.
 */

if (!process.env.DB_SCHEMA) {
  console.error(`
❌ ERROR: DB_SCHEMA environment variable required!

Prevents accidentally affecting all schemas.

Usage:
  DB_SCHEMA=template_infswsol_com pnpm db:push
  DB_SCHEMA=demo_infswsol_com pnpm db:push
  DB_SCHEMA=app1_novatratech_com pnpm db:push

Available schemas:

  Project #1 (infswsol.com - demos/reference):
  - template_infswsol_com
  - demo_infswsol_com

  Project #2 (novatratech.com - production):
  - app1_novatratech_com
  - app2_novatratech_com
  - [your production apps]

⚠️  Running without DB_SCHEMA affects ALL schemas!
See .claude/DEPLOYMENT.md for safety guidelines.
  `)
  process.exit(1)
}

console.log(`✅ Targeting schema: ${process.env.DB_SCHEMA}`)
