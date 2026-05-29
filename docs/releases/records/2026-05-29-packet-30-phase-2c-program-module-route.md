# 2026-05-29-packet-30-phase-2c-program-module-route — Phase 2C.2d Program Module Route

## Release ID

`2026-05-29-packet-30-phase-2c-program-module-route`

## Status

`candidate`

## Plain-English Summary

This release moves the program module workspace GET route off route-local
Supabase reads for deliverable and latest-version lookup. The route now uses the
Packet 30 Azure read plane for those reads, while preserving the existing
tenant gate, program-access check, module state response, draft content, and
provenance map.

## Layer Impact

- data-plane-lane: module deliverable/version reads now use `azureRead`.
- runtime-app-lane: `/api/v1/programs/[programId]/module/[key]` response shape
  and error behavior are preserved.
- release-governance-lane: updates Phase 2C inventory and adds parity/census
  artifacts with rollback notes. Also hardens the canonical tenant verifier
  against transient Postgres session-mode pool pressure so the required I10
  guard does not fail before it can check tenant drift.
- client-data-lane: no migrations, seed changes, or data writes.

## Client Applicability

- All clients: shared program module workspace route is universal across
  tenant-scoped program surfaces.
- Specific clients: none.
- Internal only: API read-path internals; user-facing behavior should be
  unchanged.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Removed `getProgramsRouteSupabase('program_read')` from
  `src/app/api/v1/programs/[programId]/module/[key]/route.ts`.
- Let `getProgramById()` and `getModuleState()` use their default read-plane
  path.
- Replaced `deliverables_v2` and `deliverable_versions` Supabase chains with
  `azureRead.maybeSingle()`.
- Extended the route tenant-guard test to assert draft/provenance parity and
  that the route no longer calls the Supabase route helper.
- Added bounded retry/backoff to `scripts/verify-canonical-tenants.ts` for
  session-mode `EMAXCONNSESSION` pool pressure while preserving hard failure
  for actual tenant drift.
- Updated `verification/packet-30-phase-2c/CODEMOD_INVENTORY.*`.
- Added `verification/packet-30-phase-2c/2c2d-program-module-route-parity.md`.
- Added `verification/packet-30-phase-2c/2c2d-program-module-route-census.json`.

## QA / Validation

Validation performed:

```text
npx jest src/__tests__/integration/programs/programs-read-routes-tenant-guards.test.ts src/__tests__/integration/programs-api-contracts.test.ts --runInBand
npx eslint src/app/api/v1/programs/[programId]/module/[key]/route.ts src/__tests__/integration/programs/programs-read-routes-tenant-guards.test.ts
DATABASE_URL= npm run db:verify:canonical-tenants
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
```

Results:

- Focused Jest: pass, 2 suites / 36 tests.
- Focused ESLint: pass.
- Canonical tenant verifier static mode: pass with `DATABASE_URL` absent.
- Runtime Supabase census: pass/WARN, unchanged on import-helper matches at
  `154 files / 628 import-helper matches`, reduced broad census from
  `307 files / 1461 broad matches` to `306 files / 1459 broad matches`.
- Codemod inventory: pass, reduced `READ_ONLY_SELECT` from `94` to `93`.
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

- `/api/v1/programs/[programId]/module/[key]` from an authenticated tenant
  session with a module that has draft content.

## Rollback Plan

Rollback is file-local. Revert the module route, its focused test update, the
two `2c2d` evidence files, and the generated inventory update. If the route
regresses in production, revert this merge commit and restore the previous
production deployment.

## Audit Evidence

- Parity artifact:
  `verification/packet-30-phase-2c/2c2d-program-module-route-parity.md`
- Census artifact:
  `verification/packet-30-phase-2c/2c2d-program-module-route-census.json`
- Updated inventory:
  `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`
- PR CI and Vercel deployment evidence after merge.

## Known Gaps

- `src/app/api/v1/programs/[programId]/generate/route.ts` remains as a
  dedicated future generation-route read slice.
- `src/app/api/v1/programs/[programId]/nexus/ask/route.ts` remains as a future
  read/mutation-adjacent route slice.
- Upload/storage and mutation-heavy program flows remain out of this pure
  module-route slice.
- Phase 2D warn-to-fail Supabase guard enforcement remains out of scope until
  Phase 2C completes.
