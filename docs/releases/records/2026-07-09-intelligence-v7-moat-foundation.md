# 2026-07-09-intelligence-v7-moat-foundation — Intelligence V7 Moat Foundation

## Release ID

`2026-07-09-intelligence-v7-moat-foundation`

## Status

`candidate`

## Plain-English Summary

Adds the governed V7 data and intelligence layer foundation that lets AbarVa promote one active tenant contract version, score module readiness, track derived-intelligence quality, and move existing tenants through before/after upgrade proof instead of relying on whichever V7 pack was most recently loaded.

## Layer Impact

- Data plane: Adds additive `intelligence_v7` governance tables, active-current views, and fact lifecycle columns.
- Agent/runtime read layer: Home, Intelligence, and Tower now default to the active V7 tenant contract instead of independent "latest loaded" queries.
- Loader/operator layer: V7 loaders install the foundation, promote loaded contracts, and write readiness/quality rows.
- Governance/docs: Adds the architecture note and verification script for the V7 moat foundation.

## Client Applicability

- All clients: Yes, for future V7 contract promotion and runtime active-contract reads.
- Specific clients: Meridian, Lakeshore, SkyHarbor, Apex, and First Capital are affected when their V7 packs are loaded or promoted.
- Internal only: The release scaffolding and verifier are internal operator controls.
- Public/demo only: No.
- Feature flag: No new feature flag.

## Changes Included

- Migration: `supabase/migrations/20260709203000_intelligence_v7_moat_foundation.sql`
- Migration replay compatibility: `supabase/migrations/20260705180000_lakeshore_cio_tower_budget_seed.sql` now skips the stale `enterprise_context_records` retirement update when that legacy table is absent in fresh Postgres replay.
- SQL foundation: `scripts/v7/sql/intelligence-v7-moat-foundation.sql`
- Loaders: `scripts/v7/load-tenant-v7-azure.mjs`, `scripts/v7/load-lakeshore-holdco-v7-azure.mjs`
- Runtime readers: `src/lib/home/know/v7-home-ask.ts`, `src/lib/intelligence/ask/retrievers/v7-dossier.ts`, `src/lib/tower/v7-tower-projection.ts`
- Tests: Home V7 ask, Intelligence V7 dossier, Tower V7 projection
- Verifier: `scripts/v7/verify-intelligence-moat-foundation.mjs`
- Architecture: `docs/architecture/intelligence-data-layer-moat.md`

## QA / Validation

- Pass: `npm run v7:moat:verify`
- Pass: `npx jest src/lib/home/know/__tests__/v7-home-ask.test.ts src/lib/intelligence/ask/retrievers/v7-dossier.test.ts src/lib/tower/__tests__/v7-tower-projection.test.ts --runInBand`
- Pass: `npx eslint scripts/v7/verify-intelligence-moat-foundation.mjs src/lib/home/know/v7-home-ask.ts src/lib/home/know/__tests__/v7-home-ask.test.ts src/lib/intelligence/ask/retrievers/v7-dossier.ts src/lib/intelligence/ask/retrievers/v7-dossier.test.ts src/lib/tower/v7-tower-projection.ts src/lib/tower/__tests__/v7-tower-projection.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Pass: `npm run release:check`
- Blocked: `npm run db:migrate:dry` in the clean temp worktree because no `ABARVA_AZURE_DATABASE_URL`, `AZURE_DATABASE_URL`, or `DATABASE_URL` is present there. The migration was not applied.
- CI pending rerun: Fresh Postgres migration replay after guarding the older Lakeshore budget seed migration for absent `enterprise_context_records`.

## Rollout Plan

1. Merge through PR to `main`.
2. Deploy app changes through the repo-owned ACA main deploy workflow.
3. Apply the additive migration through the approved database migration/operator path.
4. Run V7 tenant loaders per tenant or through a governed ACA data-build job.
5. Capture load, readback, module readiness, and before/after proof before calling any tenant live-proven.

## Deployment Authority

- Repo-owned deploy workflow: Required for app runtime reader changes.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required before claiming deployed/live.
- Worker image invariant: Required only if tenant loaders are run through an ACA job.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes before claiming Home/Intelligence/Tower V7 behavior is browser-visible.

## Rollback Plan

Rollback the app by reverting the PR and redeploying through the ACA main deploy workflow. The migration is additive; if rollback is required after migration, point affected tenants back to their previous `rollback_contract_version` in `intelligence_v7.active_tenant_contract_versions` and leave audit tables in place. Do not drop audit tables unless a separate rollback migration is reviewed.

## Audit Evidence

- PR URL: pending
- CI run: pending
- Migration apply proof: pending
- V7 loader proof bundle: pending
- Browser/live proof: pending

## Known Gaps

- Production migration has not been applied in this branch.
- Existing tenant upgrade snapshots are scaffolded but not backfilled for all tenants.
- Live tenant proof is pending until merge, deploy, migration, loader run, and readback/browser verification complete.
