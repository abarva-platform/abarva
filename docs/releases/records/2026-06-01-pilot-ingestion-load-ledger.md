# 2026-06-01-pilot-ingestion-load-ledger — Pilot Ingestion Load Ledger

## Release ID

`2026-06-01-pilot-ingestion-load-ledger`

## Status

`candidate`

## Plain-English Summary

This release creates the durable private data-plane ledger needed before pilot client files can move from upload to review, approval, commit, and rollback. Every upload run is tenant-scoped, tied to a template version and mapping profile, guarded by idempotency keys, and backed by commit-item snapshots so a bad load can be unloaded without manual cleanup.

## Layer Impact

- `client-data-lane`: Adds additive Postgres schema for pilot upload runs, file manifests, quarantine cases, clarifications, approvals, load commits, rollback requests, and audit export manifests.
- `global-control-lane`: Adds a typed contract used by admin tests and future Setup Data Load Center runtime code. No visible UI behavior changes in this slice.

## Client Applicability

- All clients: Schema and typed contract are tenant-scoped and available to all canonical tenants once migrations are applied.
- Specific clients: Apex Retail, Meridian Health, and SkyHarbor Air are the first pilot QA focus.
- Internal only: No AbarVa-only runtime surface changes.
- Public/demo only: None.
- Feature flag: No feature flag; the migration is additive and inert until wired by follow-on API/UI slices.

## Changes Included

- `supabase/migrations/20260601090000_pilot_ingestion_load_ledger.sql`
- `src/lib/admin/pilot-ingestion-ledger.ts`
- `src/lib/admin/__tests__/pilot-ingestion-ledger.test.ts`
- `src/__tests__/integration/admin/data/pilot-ingestion-load-ledger-migration.test.ts`
- `docs/build/PILOT_PRIVATE_DATA_PLANE_FULL_SCOPE_BACKLOG_2026-06-01.md`

## QA / Validation

- Passed: `npx jest src/lib/admin/__tests__/pilot-ingestion-ledger.test.ts src/__tests__/integration/admin/data/pilot-ingestion-load-ledger-migration.test.ts --runInBand`
- Passed: `npx eslint src/lib/admin/pilot-ingestion-ledger.ts src/lib/admin/__tests__/pilot-ingestion-ledger.test.ts src/__tests__/integration/admin/data/pilot-ingestion-load-ledger-migration.test.ts`
- Passed: `npx tsc --noEmit --pretty false`
- Passed: `git diff --check origin/main...HEAD`
- Passed: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`, let CI and Vercel previews run, then apply the additive migration through the normal database migration lane. The schema remains inert until later API/UI slices write to it.

## Rollback Plan

If the migration has not been applied, revert the PR. If it has been applied and no pilot data has been written, use the down-migration block to drop the new `pilot_ingestion_*` tables in dependency order. If pilot rows exist, pause ingestion, export the affected ledgers, and roll back only after the data owner approves deletion.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2734
- CI checks: to be added after GitHub Actions completes.
- Migration smoke: `src/__tests__/integration/admin/data/pilot-ingestion-load-ledger-migration.test.ts`
- Runtime contract smoke: `src/lib/admin/__tests__/pilot-ingestion-ledger.test.ts`

## Known Gaps

Follow-on rows T361-T368 still need malware scanning, encryption/key policy, retention/deletion, audit export UI/API, observability, tenant isolation tests, legal/data-use pack, and full SSO-to-output smoke evidence.
