# 2026-05-28-packet-30-phase-2b-context-read-model — Packet 30 Phase 2B Context Layer Read Model

## Release ID

`2026-05-28-packet-30-phase-2b-context-read-model`

## Status

`candidate`

## Plain-English Summary

This release moves the admin context-layer read model off direct runtime Supabase reads and onto the Phase 2A Azure read boundary. It keeps the existing empty-fallback behavior for unavailable read tables so the context-layer surface remains stable during tenant substrate audits.

## Layer Impact

- data-plane-lane: uses `azureRead` for client, context chunk, and embedding audit reads.
- admin-lane: preserves the existing context-layer summary, source-file, evidence-map, embedding-history, and pending-chunk view models.
- runtime-app-lane: no UI behavior change intended.
- client-data-lane: no data changes.

## Client Applicability

- All clients: shared context-layer admin reads now use the Azure read boundary.
- Apex Retail, Meridian Health, First Capital, Northstar, SkyHarbor: no tenant-specific branching added.
- Feature flag: not applicable.

## Changes Included

- Replaced direct Supabase reads in `tenant-context-read-model.ts` with `azureRead.select` and `azureRead.maybeSingle`.
- Preserved prior graceful fallback behavior by returning empty results/null client rows on read failures.
- Added focused tests covering summary composition, source-file grouping, embedding history, evidence map, pending chunks, tenant scoping, and fallback behavior.

## QA / Validation

Validation performed:

```text
npx jest src/lib/context-ingestion/tenant-context-read-model.test.ts --runInBand
npx eslint src/lib/context-ingestion/tenant-context-read-model.ts src/lib/context-ingestion/tenant-context-read-model.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
git diff --check
npm run release:check -- --base 3ae683ef7c273427e7ff3cfb6b8b316cb98f964b --head HEAD
npx tsc --noEmit --pretty false
```

Results:

- Focused Jest: pass, 1 suite / 5 tests.
- Focused ESLint: pass.
- Runtime Supabase census: pass/warn, improved from `177 files / 743 import-helper matches` to `176 files / 736 import-helper matches`; broad matches improved from `326 files / 1673` to `325 files / 1661`.
- Diff whitespace check: pass.
- Release Control Gate: pass.
- Full TypeScript: blocked by pre-existing missing optional package declarations (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`); no context-layer read-model errors appeared.

## Rollout Plan

Merge after focused validation, release gate, and CI are green. Runtime behavior changed in a shared admin context-layer read module, so verify production deployment and production alias smoke after merge.

## Rollback Plan

Revert this PR to restore direct Supabase reads in the context-layer read model.

## Audit Evidence

- Packet 30 Phase 2A established `azureRead`.
- Previous Phase 2B slices reduced the census to `177 / 743`.
- This slice reduces direct helper matches to `176 / 736` while keeping focused context-layer read-model tests green.

## Known Gaps

- This does not migrate context ingestion write paths.
- This does not migrate Source, program, or session-memory write paths.
- This does not enable blocking enforcement for the runtime Supabase import census; Phase 2D owns that.
