# 2026-05-29-packet-30-phase-2c-program-generate-route — Phase 2C.2f Program Generate Route

## Release ID

`2026-05-29-packet-30-phase-2c-program-generate-route`

## Status

`candidate`

## Plain-English Summary

This release removes direct Supabase read helpers from the program generate
POST route. Program lookup, module-state lookup, prior-deliverable context,
engagement detail, people lookup, matched pattern lookup, and topic lookup now
use the Packet 30 read plane. LLM generation and deliverable drafting semantics
are unchanged.

## Layer Impact

- data-plane-lane: program generation context reads now use the Azure read
  plane.
- runtime-app-lane: `/api/v1/programs/[programId]/generate` request validation,
  LLM streaming, save behavior, and response shape are preserved.
- release-governance-lane: updates Phase 2C inventory and adds parity/census
  artifacts with rollback notes.
- client-data-lane: no migrations, seed changes, or data writes.

## Client Applicability

- All clients: shared program generate route is universal across tenant-scoped
  program surfaces.
- Specific clients: none.
- Internal only: API read-path internals; user-facing behavior should be
  unchanged.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Removed `getProgramsRouteSupabase('mutation')` and `getServerSupabase()` from
  `src/app/api/v1/programs/[programId]/generate/route.ts`.
- Let `getProgramById()` and `getModuleState()` use their default read-plane
  paths.
- Replaced prior-deliverable context reads with `azureRead.query()`.
- Replaced engagement, milestone, risk, person, pattern-match, and topic reads
  with `azureRead` calls.
- Kept LLM streaming and `draftModuleDeliverable()` unchanged.
- Added focused integration coverage for the generate route read-plane
  behavior.
- Updated `verification/packet-30-phase-2c/CODEMOD_INVENTORY.*`.
- Added
  `verification/packet-30-phase-2c/2c2f-program-generate-route-parity.md`.
- Added
  `verification/packet-30-phase-2c/2c2f-program-generate-route-census.json`.

## QA / Validation

Validation performed:

```text
npx jest src/__tests__/integration/programs/programs-generate-route-azure-read.test.ts src/__tests__/integration/programs-api-contracts.test.ts --runInBand
npx eslint src/app/api/v1/programs/[programId]/generate/route.ts src/__tests__/integration/programs/programs-generate-route-azure-read.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
```

Results:

- Focused Jest: pass, 2 suites / 29 tests.
- Focused ESLint: pass.
- Runtime Supabase census: pass/WARN, reduced from
  `153 files / 626 import-helper matches` to
  `152 files / 620 import-helper matches`.
- Codemod inventory: pass, reduced `READ_ONLY_SELECT` from `92` to `91`.
- Release control gate: pass.
- Diff whitespace check: pass.
- Full local typecheck: blocked by pre-existing repo issues outside the touched
  files: duplicate helper implementation in
  `src/__tests__/integration/demo-code-sign-in-route.test.ts` and missing
  optional package type declarations (`@azure/identity`,
  `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`,
  `@resvg/resvg-js`). No touched-file errors remain.

## Rollout Plan

Merge to main after CI is green, then allow the normal Vercel production
deployment to promote the route read-plane change. No database migration or
manual data operation is required.

Post-deploy smoke target:

- `/api/v1/programs/[programId]/generate` from an authenticated tenant session.

## Rollback Plan

Rollback is file-local. Revert the generate route, its focused test file, the
two `2c2f` evidence files, and the generated inventory update. If the route
regresses in production, revert this merge commit and restore the previous
production deployment.

## Audit Evidence

- Parity artifact:
  `verification/packet-30-phase-2c/2c2f-program-generate-route-parity.md`
- Census artifact:
  `verification/packet-30-phase-2c/2c2f-program-generate-route-census.json`
- Updated inventory:
  `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`
- PR CI and Vercel deployment evidence after merge.

## Known Gaps

- `src/app/api/v1/programs/[programId]/advance/route.ts` remains
  mutation-adjacent despite its current read-only census classification.
- Upload/storage and mutation-heavy program flows remain out of this focused
  generate route slice.
- Phase 2D warn-to-fail Supabase guard enforcement remains out of scope until
  Phase 2C completes.
