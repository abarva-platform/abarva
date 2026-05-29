# 2026-05-28-packet-30-phase-2b-source-pricing-reads — Packet 30 Phase 2B Source Pricing Reads

## Release ID

`2026-05-28-packet-30-phase-2b-source-pricing-reads`

## Status

`candidate`

## Plain-English Summary

This release moves Source vendor pricing submission read helpers from direct runtime Supabase reads to the Phase 2A Azure read boundary. Mutation paths for inserting, superseding, and deleting submissions remain unchanged on the existing write path.

## Layer Impact

- data-plane-lane: uses `azureRead.query` for Source pricing submission reads.
- source-lane: preserves active vendor submission lists and audit history views.
- runtime-app-lane: no UI behavior change intended.
- client-data-lane: no data changes.

## Client Applicability

- All clients using Source pricing submission views.
- No tenant-specific branching added.
- Feature flag: not applicable.

## Changes Included

- `listActiveSubmissionsForEvent` now reads active non-superseded vendor submissions through `azureRead`.
- `listAllSubmissionsForEvent` now reads full vendor submission history through `azureRead`.
- Missing-table and read failures continue to degrade to an empty list.
- Source pricing submission write helpers remain on the existing Supabase write path.
- Added focused tests covering SQL shape, output mapping, full-history reads, and read-failure degradation.

## QA / Validation

Validation performed:

```text
npx jest src/lib/source/pricing-submissions/__tests__/dao.azure-read.test.ts --runInBand
npx eslint src/lib/source/pricing-submissions/dao.ts src/lib/source/pricing-submissions/__tests__/dao.azure-read.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
git diff --check
npm run release:check -- --base a1f23875e0bdb932ac4a50c9f487b165cf571212 --head HEAD
npx tsc --noEmit --pretty false
```

Results:

- Focused Jest: pass, 1 suite / 3 tests.
- Focused ESLint: pass.
- Runtime Supabase census: pass/warn, improved from `176 files / 727 import-helper matches` to `176 files / 725`; broad matches improved from `325 files / 1651` to `325 files / 1647`.
- Diff whitespace check: pass.
- Release control: pass.
- Full TypeScript: blocked by pre-existing missing optional package declarations (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`); no Source pricing DAO errors.

Additional release-gate validation is recorded in `verification/packet-30-phase-2b/source-pricing-reads.md`.

## Rollout Plan

Merge after focused validation, release gate, CI, and post-merge production verification. Runtime behavior changed in Source pricing read helpers, so production alias smoke and post-deploy crawl are required after merge.

## Rollback Plan

Revert this PR to restore direct Supabase reads for Source pricing submission list/history helpers.

## Audit Evidence

- Packet 30 Phase 2A established `azureRead`.
- Prior Phase 2B slices moved intelligence, context, initiatives, and program read paths onto the Azure read boundary.
- This slice targets Source vendor/pricing read behavior without touching Source mutation flows.

## Known Gaps

- This does not migrate Source pricing submission insert/delete mutation paths.
- This does not migrate Source artifact registry, value-chain, or Apex-specific Source context adapter reads.
