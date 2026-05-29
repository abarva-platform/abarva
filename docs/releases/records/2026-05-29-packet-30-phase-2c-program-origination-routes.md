# 2026-05-29-packet-30-phase-2c-program-origination-routes — Phase 2C.2c Program Origination Routes

## Release ID

`2026-05-29-packet-30-phase-2c-program-origination-routes`

## Status

`candidate`

## Plain-English Summary

This release moves a bounded set of program origination and pattern-library API
route reads from route-local Supabase query chains to the Packet 30 Azure read
plane. It covers portfolio GET, accepted-pattern shape lookup during program
creation, origination classifier catalog enrichment, intelligence-thread
handoff reads, and pattern-library browse. It does not change program writes,
storage, uploads, schemas, migrations, or tenant data.

## Layer Impact

- data-plane-lane: selected program API route reads now use `azureRead`.
- runtime-app-lane: route response shapes, tenancy gates, and SSE event shapes
  are preserved.
- release-governance-lane: updates Phase 2C inventory and adds parity/census
  artifacts with rollback notes.
- client-data-lane: no migrations, seed changes, or data writes.

## Client Applicability

- All clients: shared program origination and pattern browse routes are
  universal across tenant-scoped program surfaces.
- Specific clients: none.
- Internal only: API read-path internals; user-facing behavior should be
  unchanged.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Converted `src/app/api/v1/programs/route.ts` portfolio GET and
  accepted-pattern shape lookup to the default read plane / `azureRead`.
- Converted `src/app/api/v1/programs/originate/route.ts` catalog enrichment to
  `azureRead`.
- Converted `src/app/api/v1/programs/originate/from-thread/route.ts` thread,
  turn, and catalog reads to `azureRead`.
- Converted `src/app/api/v1/programs/patterns/route.ts` pattern browse to a
  select-only `azureRead.query`.
- Updated focused integration tests for the route-read plane.
- Updated `verification/packet-30-phase-2c/CODEMOD_INVENTORY.*`.
- Added
  `verification/packet-30-phase-2c/2c2c-program-origination-routes-parity.md`.
- Added
  `verification/packet-30-phase-2c/2c2c-program-origination-routes-census.json`.

## QA / Validation

Validation performed:

```text
npx jest src/__tests__/integration/programs/programs-origination-routes-guards.test.ts src/__tests__/integration/programs/programs-auth-mode-and-tenant-guards.test.ts src/__tests__/integration/programs/programs-create-route.test.ts src/__tests__/integration/programs-api-contracts.test.ts --runInBand
npx eslint src/app/api/v1/programs/route.ts src/app/api/v1/programs/originate/route.ts src/app/api/v1/programs/originate/from-thread/route.ts src/app/api/v1/programs/patterns/route.ts src/__tests__/integration/programs/programs-auth-mode-and-tenant-guards.test.ts src/__tests__/integration/programs/programs-origination-routes-guards.test.ts src/__tests__/integration/programs/programs-create-route.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
git diff --check
```

Results:

- Focused Jest: pass, 4 suites / 56 tests.
- Focused ESLint: pass.
- Runtime Supabase census: pass/WARN, reduced from `155 files / 631
  import-helper matches` to `154 files / 628 import-helper matches`.
- Codemod inventory: pass, reduced `READ_ONLY_SELECT` from `98` to `94`.
- Diff whitespace check: pass.
- Full local typecheck: blocked by pre-existing missing optional package type
  declarations (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`,
  `pptxgenjs`, `@resvg/resvg-js`). No touched-file errors were emitted before
  those dependency-resolution failures.

## Rollout Plan

Merge to main after CI is green, then allow the normal Vercel production
deployment to promote the route read-plane change. No database migration or
manual data operation is required.

Post-deploy smoke targets:

- `/api/v1/programs` GET from an authenticated tenant session.
- `/api/v1/programs/originate` classifier stream.
- `/api/v1/programs/originate/from-thread` with an own-tenant thread.
- `/api/v1/programs/patterns` with and without an `industry` filter.

## Rollback Plan

Rollback is file-local. If one route regresses, revert that route and its test
updates. If multiple origination surfaces regress, revert this merge commit and
restore the previous production deployment.

## Audit Evidence

- Parity artifact:
  `verification/packet-30-phase-2c/2c2c-program-origination-routes-parity.md`
- Census artifact:
  `verification/packet-30-phase-2c/2c2c-program-origination-routes-census.json`
- Updated inventory:
  `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`
- PR CI and Vercel deployment evidence after merge.

## Known Gaps

- `src/app/api/v1/programs/[programId]/generate/route.ts` remains as a
  dedicated future generation-route read slice.
- Program module/detail route reads remain for a focused detail-route slice.
- Upload/storage and mutation-adjacent program flows remain out of this
  pure-read route slice.
- Phase 2D warn-to-fail Supabase guard enforcement remains out of scope until
  Phase 2C completes.
