/**
 * Vercel programmatic configuration.
 * https://vercel.com/docs/project-configuration/vercel-ts
 *
 * The buildCommand here is the only place we customise the deploy. It runs
 * once per deploy on Vercel build infrastructure. The shell command we
 * compose decides — based on `process.env.VERCEL_ENV` — whether to apply
 * pending Supabase migrations BEFORE running `next build`.
 *
 * Behaviour matrix
 * ─────────────────────────────────────────────────────────────────────
 * VERCEL_ENV value     │  Migrations    │  Build
 * ─────────────────────┼────────────────┼─────────────────────────────
 * `production`         │  Apply (--ci)  │  next build
 * `preview`            │  Skip (logged) │  next build
 * `development`        │  Skip (logged) │  next build
 * unset / local        │  Skip (logged) │  next build
 * ─────────────────────────────────────────────────────────────────────
 *
 * Why pre-build, not post-build:
 *   - If the migration fails the deploy must abort BEFORE the new code goes
 *     live. A failed `npm run db:migrate` exits non-zero, which makes the
 *     compound shell command exit non-zero, which fails the deploy.
 *   - Code that depends on a new column would 500 in prod if it were served
 *     before the migration ran.
 *
 * Why preview deploys never hit prod:
 *   - Preview branches share `DATABASE_URL` only if the operator chose to
 *     scope it that way. Even if scoped, we explicitly skip the runner so
 *     a feature-branch preview can never write to the production database.
 *   - Preview-specific Supabase branches handle their own schema via the
 *     existing Supabase Branching workflow.
 *
 * Required env vars on Vercel (production scope):
 *   - DATABASE_URL — Supabase Session-mode pooler URI for migrations.
 *   - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *     SUPABASE_SERVICE_ROLE_KEY — already required for runtime.
 *
 * If DATABASE_URL is missing in production, run-migrations.ts exits 1 with
 * a clear error message; the compound build command will propagate that
 * failure and abort the deploy.
 *
 * Destructive-migration safety: src/scripts/run-migrations.ts scans every
 * pending migration for `DROP TABLE`, `DROP COLUMN`, `ALTER TABLE … DROP`,
 * `DROP SCHEMA`, and `TRUNCATE`. Any match aborts the deploy unless the
 * migration carries an explicit `-- migration:destructive-allowed`
 * marker. This prevents accidental data loss on auto-apply.
 */

import type { VercelConfig } from '@vercel/config/v1/types';

const vercelEnv = process.env.VERCEL_ENV;
const isProductionDeploy = vercelEnv === 'production';

// Pre-build step. We use `&&` so any non-zero exit from the migration
// runner aborts the deploy before next build runs.
const preBuildStep = isProductionDeploy
  ? // Production: actually apply migrations.
    'npm run db:migrate -- --ci'
  : // Preview / development / local: log a skip line, then proceed.
    `node -e "console.log('⏭  Skipping migrations (VERCEL_ENV=${vercelEnv ?? 'unset'}, prod-only)')"`;

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: `${preBuildStep} && npm run build`,
};
