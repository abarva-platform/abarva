# 2026-06-05-lakeshore-cxo-intel-loader-wave1 — Lakeshore CXO Intel Loader Wave 1

## Release ID

`2026-06-05-lakeshore-cxo-intel-loader-wave1`

## Status

`candidate`

## Plain-English Summary

This release adds the first Lakeshore federated onboarding surface for CXO data. Setup now exposes a CXO Intel Loader under `/admin/setup/cxo-intel`, with active CIO and CFO bundle pages that validate the named CSV files needed before Tower, Moves, or Source can make claims from HoldCo operating data. It also adds the Wave 1 substrate tables that can hold validated CIO/CFO rows with upload provenance.

## Layer Impact

- `client-data-lane`: Adds tenant-scoped `cxo_intel_*` upload and row tables for CIO/CFO bundle files, protected by transaction-grain RLS helpers from the Lakeshore holding-group substrate.
- `internal-admin`: Adds Setup/Admin pages and a browser-side validation flow for CIO/CFO bundle files.

## Client Applicability

- All clients: The route and substrate are available to all tenants.
- Specific clients: Lakeshore Holdings is the immediate demo/pilot consumer, starting with Morgan Street Holdings Chicago as an L1 HoldCo.
- Internal only: Setup/Admin operators use the route; it is not a public route.
- Public/demo only: No.
- Feature flag: No feature flag.

## Changes Included

- `supabase/migrations/20260605143000_cxo_intel_wave1_substrate.sql`
- `src/app/(maestro)/admin/setup/cxo-intel/page.tsx`
- `src/app/(maestro)/admin/setup/cxo-intel/cio/page.tsx`
- `src/app/(maestro)/admin/setup/cxo-intel/cfo/page.tsx`
- `src/components/cxo-intel/CxoIntelUploadFlow.tsx`
- `src/lib/cxo-intel/schemas.ts`
- `src/lib/cxo-intel/validators.ts`
- `src/lib/cxo-intel/__tests__/validators.test.ts`

## QA / Validation

- PASS: `npx jest src/lib/cxo-intel/__tests__/validators.test.ts --runInBand`
- PASS: `npx eslint src/lib/cxo-intel src/components/cxo-intel src/app/(maestro)/admin/setup/cxo-intel`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PENDING: CI migration replay and browser crawl after PR creation.

## Rollout Plan

Merge to `main`, let Vercel production deploy normally, and apply the migration through the standard data-plane migration path. The UI is immediately discoverable under `/admin/setup/cxo-intel`; actual committed data still requires governed approval/commit workflow wiring.

## Rollback Plan

Revert the PR to remove the Setup/Admin routes and schema/validator code. If the migration has been applied and must be rolled back, drop the `cxo_intel_upload_events` table and the fourteen Wave 1 `cxo_intel_*` row tables only after confirming no committed CXO rows are required by Moves, Source, or Tower.

## Audit Evidence

- PR URL: to be added after PR creation.
- CI: Release Control Gate, lint, behavior/type checks, and migration replay.
- Local proof: schema/validator Jest tests and release gate output.

## Known Gaps

The Wave 1 UI validates bundle CSVs and directs operators to governed approval. It does not yet commit rows from the browser into the new `cxo_intel_*` tables, and COO/CHRO/GC bundles remain locked for Wave 2.
