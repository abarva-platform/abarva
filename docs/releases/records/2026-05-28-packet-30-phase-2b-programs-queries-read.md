# 2026-05-28-packet-30-phase-2b-programs-queries-read — Packet 30 Phase 2B Programs Query Reads

## Release ID

`2026-05-28-packet-30-phase-2b-programs-queries-read`

## Status

`candidate`

## Plain-English Summary

This release moves the customer-facing Programs query helpers for modules, work items, milestones, risks, Maestro flags, pending approvals, and phase snapshots off default direct runtime Supabase reads and onto the Phase 2A Azure read boundary. Explicit `opts.supabase` compatibility is preserved for API routes and tests that intentionally pass a scoped Supabase client.

## Layer Impact

- data-plane-lane: uses `azureRead.query` for default Programs read helpers.
- moves-lane: preserves existing view-model shapes used by Moves and program detail surfaces.
- tower-lane: improves Azure read coverage for portfolio/value surfaces that depend on program modules, risks, work items, and milestones.
- runtime-app-lane: no UI behavior change intended.
- client-data-lane: no data changes.

## Client Applicability

- All clients: shared Programs read helpers now use the Azure read boundary by default.
- Apex Retail, Meridian Health, First Capital, Northstar, SkyHarbor: no tenant-specific branching added.
- Feature flag: not applicable.

## Changes Included

- `getModuleState`, `getWorkItems`, `getMilestones`, `getRisks`, `getOpenMaestroFlags`, and `getPendingApprovals` now use Azure read SQL by default.
- `getPhaseSnapshots` now uses Azure read SQL with optional phase filtering.
- Existing `opts.supabase` behavior remains for call sites that pass an explicit Supabase client.
- Added focused tests covering Azure read SQL, RBAC gating, output mapping, and no-query behavior when RBAC rejects access.

## QA / Validation

Validation performed:

```text
npx jest src/lib/programs/queries.azure-read.test.ts --runInBand
npx eslint src/lib/programs/queries.ts src/lib/programs/queries.azure-read.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
git diff --check
npx tsc --noEmit --pretty false
```

Results:

- Focused Jest: pass, 1 suite / 5 tests.
- Focused ESLint: pass.
- Runtime Supabase census: pass/warn, improved from `176 files / 736 import-helper matches` to `176 files / 727 import-helper matches`; broad matches improved from `325 files / 1661` to `325 files / 1651`.
- Diff whitespace check: pass.
- Full TypeScript: blocked by pre-existing missing optional package declarations (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`); no Programs query errors appeared after fixing the local thenable type.

## Rollout Plan

Merge after focused validation, release gate, and CI are green. Runtime behavior changed in shared Programs read helpers, so verify production deployment and production alias smoke after merge.

## Rollback Plan

Revert this PR to restore default direct Supabase reads in the Programs query helpers.

## Audit Evidence

- Packet 30 Phase 2A established `azureRead`.
- Previous Phase 2B slices reduced the census to `176 / 736`.
- This slice reduces direct helper matches to `176 / 727` while keeping focused Programs query tests green.

## Known Gaps

- This does not migrate program write/mutation paths.
- This does not migrate Program transformers or governance reads.
- This does not enable blocking enforcement for the runtime Supabase import census; Phase 2D owns that.
