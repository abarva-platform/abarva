# 2026-05-29-packet-30-phase-2c-program-nexus-ask-route — Phase 2C.2e Program Nexus Ask Route

## Release ID

`2026-05-29-packet-30-phase-2c-program-nexus-ask-route`

## Status

`candidate`

## Plain-English Summary

This release removes the direct Supabase read helper from the program Nexus ask
POST route. Program lookup now uses the default Packet 30 read plane, and
existing-thread ownership validation now uses `azureRead`. Thread creation,
thread touch, context assembly, canonical pattern search, Nexus synthesis, and
SSE response semantics are unchanged.

## Layer Impact

- data-plane-lane: program lookup and existing-thread ownership reads now use
  the Azure read plane.
- runtime-app-lane: `/api/v1/programs/[programId]/nexus/ask` SSE behavior and
  error responses are preserved.
- release-governance-lane: updates Phase 2C inventory and adds parity/census
  artifacts with rollback notes.
- client-data-lane: no migrations, seed changes, or data writes.

## Client Applicability

- All clients: shared program Nexus ask route is universal across
  tenant-scoped program surfaces.
- Specific clients: none.
- Internal only: API read-path internals; user-facing behavior should be
  unchanged.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Removed `getProgramsRouteSupabase('mutation')` from
  `src/app/api/v1/programs/[programId]/nexus/ask/route.ts`.
- Let `getProgramById()` use its default read-plane path.
- Replaced the `program_threads` ownership lookup with
  `azureRead.maybeSingle()`.
- Kept write-side helpers `createThread()` and `touchThread()` unchanged.
- Updated focused mutation-guard tests for the ask route read-plane behavior.
- Updated `verification/packet-30-phase-2c/CODEMOD_INVENTORY.*`.
- Added
  `verification/packet-30-phase-2c/2c2e-program-nexus-ask-route-parity.md`.
- Added
  `verification/packet-30-phase-2c/2c2e-program-nexus-ask-route-census.json`.

## QA / Validation

Validation performed:

```text
npx jest src/__tests__/integration/programs/programs-nexus-mutation-guards.test.ts src/__tests__/integration/programs-nexus-ask-route.test.ts src/__tests__/integration/programs-api-contracts.test.ts --runInBand
npx eslint src/app/api/v1/programs/[programId]/nexus/ask/route.ts src/__tests__/integration/programs/programs-nexus-mutation-guards.test.ts src/__tests__/integration/programs-nexus-ask-route.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
```

Results:

- Focused Jest: pass, 3 suites / 45 tests.
- Focused ESLint: pass.
- Runtime Supabase census: pass/WARN, reduced from
  `154 files / 628 import-helper matches` to
  `153 files / 626 import-helper matches`.
- Codemod inventory: pass, reduced `READ_ONLY_SELECT` from `93` to `92`.
- Release control gate: pass.
- Diff whitespace check: pass.
- Full local typecheck: blocked by pre-existing missing optional package type
  declarations (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`,
  `pptxgenjs`, `@resvg/resvg-js`). No touched-file errors were emitted before
  those dependency-resolution failures.

## Rollout Plan

Merge to main after CI is green, then allow the normal Vercel production
deployment to promote the route read-plane change. No database migration or
manual data operation is required.

Post-deploy smoke target:

- `/api/v1/programs/[programId]/nexus/ask` from an authenticated tenant session.

## Rollback Plan

Rollback is file-local. Revert the Nexus ask route, its focused test update,
the two `2c2e` evidence files, and the generated inventory update. If the route
regresses in production, revert this merge commit and restore the previous
production deployment.

## Audit Evidence

- Parity artifact:
  `verification/packet-30-phase-2c/2c2e-program-nexus-ask-route-parity.md`
- Census artifact:
  `verification/packet-30-phase-2c/2c2e-program-nexus-ask-route-census.json`
- Updated inventory:
  `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`
- PR CI and Vercel deployment evidence after merge.

## Known Gaps

- `src/app/api/v1/programs/[programId]/generate/route.ts` remains as a
  dedicated future generation-route read slice.
- Upload/storage and mutation-heavy program flows remain out of this focused
  Nexus ask route slice.
- Phase 2D warn-to-fail Supabase guard enforcement remains out of scope until
  Phase 2C completes.
