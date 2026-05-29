# 2026-05-29-packet-30-phase-2c-customer-reads — Phase 2C.1a Customer Reads

## Release ID

`2026-05-29-packet-30-phase-2c-customer-reads`

## Status

`candidate`

## Plain-English Summary

This release moves a first customer-facing pure-read slice from direct runtime
Supabase access to the Azure read plane. The converted surface covers Apex
Source live-context assembly plus Admin setup/customer-read helpers for audit
log, blockers, connectors, datasets, overview, production readiness, and setup
progress.

## Layer Impact

- data-plane-lane: removes direct Supabase runtime reads from the converted helpers.
- runtime-app-lane: Source and Admin read behavior is intended to remain equivalent.
- release-governance-lane: adds Phase 2C parity/census evidence under `verification/packet-30-phase-2c/`.
- client-data-lane: no schema, migration, seed, or tenant-data changes.

## Client Applicability

- Apex Retail: Source live-context adapter path is directly affected.
- All tenants using Admin live-mode setup/readiness helpers: Admin read helpers are affected.
- Feature flag: none in this slice; rollback is file-level or deployment-level.

## Changes Included

- Converted `src/lib/source/adapters/apex-retail-adapter.ts` to use `azureRead.query`.
- Updated `src/lib/source/__tests__/apex-retail-adapter.test.ts` to assert Azure SQL/parameter parity.
- Converted shared Admin tenant resolution in `src/lib/admin/data/admin-db-helpers.ts` to `azureRead`.
- Converted these Admin read helpers to `azureRead`:
  - `admin-audit-log-adapter.ts`
  - `admin-blockers-adapter.ts`
  - `admin-connectors-adapter.ts`
  - `admin-datasets-adapter.ts`
  - `admin-overview-adapter.ts`
  - `admin-production-readiness-adapter.ts`
  - `admin-setup-progress-adapter.ts`
- Split live Admin context enrichment out of the browser-safe context-bundle
  contract into `src/lib/agent/context-bundle-live.ts` so `pg`/Azure read code
  cannot enter client bundles through `HonestDisclosureBanner`.
- Added `verification/packet-30-phase-2c/2c1-customer-reads-parity.md`.
- Added `verification/packet-30-phase-2c/2c1-customer-reads-census.json`.

Supabase runtime census delta:

- Start of 2C.0 baseline: 176 files / 725 import-helper matches.
- End of this slice: 167 files / 688 import-helper matches.
- Delta: -9 files / -37 import-helper matches.

The guard remains WARN. This release does not flip 2D enforcement.

## QA / Validation

Validation performed:

```text
npx jest src/lib/source/__tests__/apex-retail-adapter.test.ts src/lib/admin/__tests__/setup-data-broker.test.ts src/lib/admin/__tests__/overview-composer.test.ts src/lib/admin/__tests__/production-readiness-pr9.test.ts src/__tests__/integration/admin/data11-live-adapters.test.ts --runInBand
npx eslint src/lib/agent/context-bundle.ts src/lib/agent/context-bundle-live.ts src/lib/admin/build-progress-page-view.ts src/lib/admin/architecture-page-view.ts src/lib/admin/overview-page-view.ts src/lib/admin/connectors-page-view.ts src/lib/admin/production-readiness-page-view.ts src/lib/admin/users-access-page-view.ts src/__tests__/integration/admin/data11-live-adapters.test.ts src/lib/admin/data/admin-audit-log-adapter.ts src/lib/admin/data/admin-blockers-adapter.ts src/lib/admin/data/admin-connectors-adapter.ts src/lib/admin/data/admin-datasets-adapter.ts src/lib/admin/data/admin-db-helpers.ts src/lib/admin/data/admin-overview-adapter.ts src/lib/admin/data/admin-production-readiness-adapter.ts src/lib/admin/data/admin-setup-progress-adapter.ts src/lib/source/adapters/apex-retail-adapter.ts src/lib/source/__tests__/apex-retail-adapter.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
git diff --check
```

Results:

- Focused Jest: pass, 5 suites / 53 tests.
- Focused ESLint: pass.
- Runtime Supabase census: pass/WARN, expected lower count.
- Diff whitespace check: pass.
- Full local typecheck: blocked by pre-existing missing optional packages unrelated to touched files (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`). CI typecheck remains the authoritative type gate.
- Local production build: blocked by the known temporary-worktree Turbopack
  symlink panic (`node_modules` points outside the filesystem root). Vercel
  preview build remains the authoritative build gate.

## Rollout Plan

Because this release changes runtime read implementation, merge only after CI
is green and then deploy to production.

Rolling release:

1. Production exposure at 10% for 10 minutes.
2. Increase to 50% for 10 minutes if live smokes stay green.
3. Increase to 100% after 30 minutes total if live smokes stay green.
4. Run production alias smoke and post-deploy crawl.

Smoke targets:

- Apex Source live-context ask route smoke for a Source event.
- Admin overview/setup-progress render smoke.
- Runtime Supabase census remains WARN and lower than baseline.
- Post-deploy crawl remains `0 P0`.

## Rollback Plan

Rollback is file-local. If one area fails, revert the named file(s) in this
release and redeploy:

- Apex Source live-context failure:
  - Revert `src/lib/source/adapters/apex-retail-adapter.ts`.
  - Revert `src/lib/source/__tests__/apex-retail-adapter.test.ts`.
- Admin tenant resolution failure:
  - Revert `src/lib/admin/data/admin-db-helpers.ts`.
- Admin audit-log failure:
  - Revert `src/lib/admin/data/admin-audit-log-adapter.ts`.
- Admin blockers / production readiness failure:
  - Revert `src/lib/admin/data/admin-blockers-adapter.ts`.
  - Revert `src/lib/admin/data/admin-production-readiness-adapter.ts`.
- Admin connectors failure:
  - Revert `src/lib/admin/data/admin-connectors-adapter.ts`.
- Admin datasets failure:
  - Revert `src/lib/admin/data/admin-datasets-adapter.ts`.
- Admin overview failure:
  - Revert `src/lib/admin/data/admin-overview-adapter.ts`.
- Admin setup-progress failure:
  - Revert `src/lib/admin/data/admin-setup-progress-adapter.ts`.
- Client/server bundle boundary failure:
  - Revert `src/lib/agent/context-bundle.ts`.
  - Revert `src/lib/agent/context-bundle-live.ts`.
  - Revert the Admin page-view import updates listed in this release.

If multiple areas fail or production smoke fails at 10%, roll back the entire
merge commit and restore the previous production deployment.

## Audit Evidence

- 2C.0 inventory PR shipped before this transformation slice.
- Parity artifact: `verification/packet-30-phase-2c/2c1-customer-reads-parity.md`.
- Census artifact: `verification/packet-30-phase-2c/2c1-customer-reads-census.json`.
- This slice remains below the `<100 files` bulk PR cap and is area-grouped.

## Known Gaps

- Packet 32 C8 P1 backlog / standing crawl P1s remain out of scope.
- Apex Level-3 E2E remains gated behind Phase 7.
- Phase 2D guard warn-to-fail enforcement remains out of scope.
- Supabase storage/write-path removal remains out of scope.
