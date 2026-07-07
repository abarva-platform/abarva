# 2026-06-05-meridian-canonical-system-profile — Meridian Canonical System Display

## Release ID

`2026-06-05-meridian-canonical-system-profile`

## Status

`candidate`

## Plain-English Summary

Meridian now renders as Meridian Health System across the canonical tenant path, crawl expectations, Intelligence corpus labels, and agent-grounding labels. The governed Meridian vNext context reload remains the source of detailed profile facts; this PR does not add or edit seed side-load data.

## Layer Impact

`global-control-lane`: Canonical tenant display-name resolution now maps Meridian aliases, including retired Heliara labels, to Meridian Health System.

`client-data-lane`: Meridian-only display labels and fixture tenant names were aligned to the canonical system name. No new client data rows, seed scripts, or static profile facts are introduced.

`client-data-lane`: A forward migration removes the stale database trigger prohibition on the canonical Meridian Health System name and normalizes the existing canonical `clients` row.

## Client Applicability

- All clients: No.
- Specific clients: Meridian Health System.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/client-config.ts` canonicalizes Meridian and retired Heliara aliases to `Meridian Health System`.
- `src/config/tenants/CANONICAL_TENANTS.ts` and `src/lib/data/clients.ts` use the full system name.
- Meridian agent-grounding prompts and scorer labels now expect the full system name.
- Tests updated to pin the full system display name while preserving `Meridian Health` as a recognized alias.
- The release intentionally avoids editing `src/data/meridian*.ts`; the pilot data-loader gate correctly treats those static data files as side-load risk.
- `supabase/migrations/20260605054000_allow_meridian_health_system_name.sql` updates the DB trigger and canonical client row.
- The enterprise-context loaders now normalize the canonical client row when resolving an existing Meridian client.

## QA / Validation

- PASS: `npx jest src/lib/__tests__/active-client.test.ts src/lib/auth/__tests__/tenant-isolation-probes.test.ts src/lib/crawl/__tests__/post-deploy-crawl-guard.test.ts src/lib/intelligence-v3/__tests__/tenant-corpus-loader.test.ts src/app/intelligence/__tests__/page-corpus.test.tsx src/lib/agent-grounding/__tests__ --runInBand` — 82 tests passed.
- PASS: `npm run coverage:behavior-gate` — 104 behavior tests passed; observed coverage was above threshold.
- PASS: Scoped ESLint on touched TypeScript files, including tenant config, agent-grounding labels, crawl/behavior tests, and enterprise-context loader scripts.
- BLOCKED: `npx tsc --noEmit --pretty false` is blocked by pre-existing missing type packages outside this patch: `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`.
- PASS: `git diff --check`.
- PASS: Production post-deploy crawl before this fix completed with 0 P0 findings, but surfaced Meridian display-name P1 findings because the app rendered `Meridian Health` while the crawler expected `Meridian Health System`.
- PASS: No seed side-load was added; detailed Meridian profile data remains in the loader-backed enterprise-context tables with `data_ingestion_runs` audit evidence.
- PASS: `npm run db:migrate -- --force 20260605054000_allow_meridian_health_system_name.sql` applied through the working Postgres `DATABASE_URL` path after the direct Azure hostname failed local DNS resolution.
- PASS: `npm run db:verify:canonical-tenants` returned `clean (6 canonical tenants verified)`.
- PASS: `npx tsx src/scripts/enterprise-context/chunk-meridian-enterprise-context.ts --tenant=meridian-health --source=docs/enterprise-context/generated/meridian-vnext --apply` completed with 3,503 chunks and a completed `data_ingestion_runs` row at `2026-06-05 05:39:01 UTC`.

## Rollout Plan

Merge to main and allow the normal Vercel production deployment. The migration has been applied to the configured database and is idempotent for future environments. The loader run has also been replayed for Meridian so the ingestion ledger records the normalization path.

## Rollback Plan

Revert the PR for code rollback. For database rollback, restore the prior trigger definition from `supabase/migrations/036_forbidden_name_trigger.sql` and update the Meridian `clients` row back to `Meridian Health` only if the product decision reverses. The governed Meridian context chunks remain intact.

## Audit Evidence

- PR URL and CI checks.
- Post-deploy crawl artifact from run `26996818705`.
- Meridian context reset evidence under `/private/tmp/meridian-context-reset-2026-06-05/`.

## Known Gaps

This release does not resolve broader crawler P1/P2 findings for citation depth, visual-canon checks, or generic admin copy. It also does not replace any stale static Meridian fixture consumers; that should be handled by routing those consumers to the loader-backed context layer rather than editing static seed files.
