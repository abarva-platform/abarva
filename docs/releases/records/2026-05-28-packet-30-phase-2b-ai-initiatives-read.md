# 2026-05-28-packet-30-phase-2b-ai-initiatives-read — Packet 30 Phase 2B AI Initiatives Admin Reads

## Release ID

`2026-05-28-packet-30-phase-2b-ai-initiatives-read`

## Status

`candidate`

## Plain-English Summary

This release moves the read-only AI Initiatives admin query module off direct runtime Supabase reads and onto the Phase 2A Azure read boundary. It is a narrow Packet 30 Phase 2B slice with no schema, data, or UI changes intended.

## Layer Impact

- data-plane-lane: uses `azureRead` for `ai_categories`, `ai_business_goals`, and `ai_initiatives` reads.
- admin-lane: preserves the existing AI initiatives page-data shape.
- runtime-app-lane: no UI behavior change intended.
- client-data-lane: no data changes.

## Client Applicability

- All clients: shared admin AI initiatives reads now use the Azure read boundary.
- Apex Retail, Meridian Health, First Capital, Northstar, SkyHarbor: no tenant-specific branching added.
- Feature flag: not applicable.

## Changes Included

- `listCategories` now reads `ai_categories` through `azureRead.select`.
- `listBusinessGoalsForClient` now tenant-scopes `ai_business_goals` through `azureRead.select`.
- `listInitiativesForClient` now tenant-scopes `ai_initiatives` through `azureRead.select`.
- `listVendorsForClient` and `listKpisForClient` now use Azure read `in` predicates after tenant-scoped initiative lookup.
- Added focused tests covering Azure read usage, tenant scoping, numeric hydration, vendor/KPI joins, and page-data composition.

## QA / Validation

Validation performed:

```text
npx jest src/lib/admin/ai-initiatives/queries.test.ts --runInBand
npx eslint src/lib/admin/ai-initiatives/queries.ts src/lib/admin/ai-initiatives/queries.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
git diff --check
npx tsc --noEmit --pretty false
```

Results:

- Focused Jest: pass, 1 suite / 6 tests.
- Focused ESLint: pass.
- Runtime Supabase census: pass/warn, improved from `178 files / 750 import-helper matches` to `177 files / 743 import-helper matches`; broad matches improved from `327 files / 1685` to `326 files / 1673`.
- Diff whitespace check: pass.
- Full TypeScript: blocked by pre-existing missing optional package declarations (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`); no AI Initiatives query errors appeared.

## Rollout Plan

Merge after focused validation, release gate, and CI are green. Runtime behavior changed in a shared admin read module, so verify production deployment and production alias smoke after merge.

## Rollback Plan

Revert this PR to restore direct Supabase reads in the AI Initiatives admin query module.

## Audit Evidence

- Packet 30 Phase 2A established `azureRead`.
- Previous Phase 2B slices reduced the census to `178 / 750`.
- This slice reduces direct helper matches to `177 / 743` while keeping focused AI Initiatives admin query tests green.

## Known Gaps

- This does not migrate write-heavy AI initiative management paths.
- This does not migrate program, Source, or session-memory write paths.
- This does not enable blocking enforcement for the runtime Supabase import census; Phase 2D owns that.
