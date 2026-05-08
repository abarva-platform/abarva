/**
 * Vercel programmatic configuration.
 * https://vercel.com/docs/project-configuration/vercel-ts
 *
 * The buildCommand below invokes scripts/vercel-build.sh, which decides —
 * based on $VERCEL_ENV at deploy time — whether to apply pending Supabase
 * migrations before running `next build`. Two constraints from Vercel
 * shape the indirection:
 *
 *   1. `buildCommand` MUST be a literal string in the exported config
 *      object. Anything dynamic (template literal interpolating
 *      process.env, conditional expression evaluated at module-load
 *      time) is rejected with "Dynamic values found in static
 *      properties: buildCommand".
 *
 *   2. `buildCommand` is capped at 256 characters. An inlined `case`
 *      statement covering both branches plus npm-run incantations does
 *      not fit comfortably under that limit.
 *
 * scripts/vercel-build.sh holds the actual logic. Keep that file in sync
 * with docs/deployment/migrations.md.
 *
 * Behaviour matrix
 * ─────────────────────────────────────────────────────────────────────
 * VERCEL_ENV value     │  Migrations    │  Build
 * ─────────────────────┼────────────────┼─────────────────────────────
 * `production`         │  Apply (--ci)  │  next build
 * `preview`            │  Skip (logged) │  next build
 * `development`        │  Skip (logged) │  next build
 * unset / local        │  n/a — vercel.ts only takes effect on Vercel
 * ─────────────────────────────────────────────────────────────────────
 *
 * Why pre-build, not post-build:
 *   - If the migration fails the deploy must abort BEFORE the new code
 *     goes live. The shell `set -e` in the script propagates non-zero
 *     exit, which fails the buildCommand, which fails the deploy.
 *   - Code that depends on a new column would 500 in prod if it were
 *     served before the migration ran.
 *
 * Why preview deploys never hit prod:
 *   - The script's case statement skips the runner entirely for any
 *     VERCEL_ENV that isn't `production`. Even if a preview branch
 *     somehow inherits a prod DATABASE_URL, the runner never executes.
 *
 * Required env vars on Vercel (production scope):
 *   - DATABASE_URL — Supabase Session-mode pooler URI for migrations.
 *   - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *     SUPABASE_SERVICE_ROLE_KEY — already required for runtime.
 *
 * Destructive-migration safety: src/scripts/run-migrations.ts scans every
 * pending migration for `DROP TABLE`, `DROP COLUMN`, `ALTER TABLE … DROP`,
 * `DROP SCHEMA`, and `TRUNCATE`. Any match aborts the deploy unless the
 * migration carries an explicit `-- migration:destructive-allowed`
 * marker. This prevents accidental data loss on auto-apply.
 */

import { type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'bash scripts/vercel-build.sh',
};
