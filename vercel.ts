/**
 * Vercel programmatic configuration.
 * https://vercel.com/docs/project-configuration/vercel-ts
 *
 * The buildCommand below decides — at *deploy time*, in the shell — whether
 * to apply pending Supabase migrations before running `next build`. The
 * decision lives inside a single shell expression because Vercel's config
 * loader requires `buildCommand` to be a STATIC string (any value computed
 * from runtime expressions like `process.env.VERCEL_ENV` is rejected with
 * "Dynamic values found in static properties: buildCommand"). The shell
 * `case` statement is evaluated by the Vercel build container at deploy
 * time, when `VERCEL_ENV` is correctly set.
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

import { type VercelConfig } from '@vercel/config/v1';

// IMPORTANT: buildCommand MUST be a literal string in the export. Anything
// dynamic (template literal interpolating process.env, conditional
// expression at object-construction time, etc.) is rejected by the Vercel
// config loader with "Dynamic values found in static properties:
// buildCommand". The `case` statement below is plain shell that the
// Vercel build container evaluates at deploy time, when $VERCEL_ENV is
// correctly set.
//
// Shell logic:
//   - VERCEL_ENV=production: apply migrations (db:migrate --ci). On
//     non-zero exit, `&&` short-circuits and the build aborts.
//   - any other value (preview / development / unset): print a skip
//     line and continue to the build.
export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand:
    'case "$VERCEL_ENV" in production) echo "[vercel.ts] Production deploy detected — applying pending Supabase migrations..." && npm run db:migrate -- --ci ;; *) echo "[vercel.ts] Skipping migrations (VERCEL_ENV=${VERCEL_ENV:-unset}, prod-only)" ;; esac && npm run build',
};
