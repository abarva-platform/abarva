# 2026-05-29-packet-30-phase-2c-program-transformers — Phase 2C.2b Program Transformers

## Release ID

`2026-05-29-packet-30-phase-2c-program-transformers`

## Status

`candidate`

## Plain-English Summary

This release moves the program view-model transformer reads from direct runtime
Supabase access to the Packet 30 Azure read plane. It covers program summaries,
program detail state, strategic move cards, people/team lookup, linked evidence,
deliverable previews, activity history, and status badges. It does not change
program writes, route handlers, uploads, schemas, migrations, or tenant data.

## Layer Impact

- data-plane-lane: program transformer reads now use `azureRead`.
- runtime-app-lane: program and strategic-move view-model output shapes are
  preserved.
- release-governance-lane: updates Phase 2C inventory and adds parity/census
  artifacts with rollback notes.
- client-data-lane: no migrations, seed changes, or data writes.

## Client Applicability

- All clients: shared program transformer code is universal across tenant-scoped
  program and strategic-move surfaces.
- Specific clients: none.
- Internal only: program read-model internals; user-facing behavior should be
  unchanged.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Converted `src/lib/programs/transformers.ts` from direct
  `getServerSupabase()` reads to `azureRead`.
- Preserved public transformer function signatures; the old optional
  `supabase` option remains accepted as a no-op compatibility field.
- Added `src/lib/programs/__tests__/transformers-azure-read.test.ts`.
- Updated `verification/packet-30-phase-2c/CODEMOD_INVENTORY.*`.
- Added `verification/packet-30-phase-2c/2c2b-program-transformers-parity.md`.
- Added `verification/packet-30-phase-2c/2c2b-program-transformers-census.json`.

## QA / Validation

Validation performed:

```text
npx jest src/lib/programs/__tests__/transformers-azure-read.test.ts src/lib/programs/__tests__/strategic-moves-transformers.test.ts src/lib/programs/__tests__/live-program-display.test.ts src/lib/programs/queries.azure-read.test.ts --runInBand
npx eslint src/lib/programs/transformers.ts src/lib/programs/__tests__/transformers-azure-read.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
git diff --check
```

Results:

- Focused Jest: pass, 4 suites / 9 tests.
- Focused ESLint: pass.
- Runtime Supabase census: pass/WARN, reduced from `156 files / 649
  import-helper matches` to `155 files / 631 import-helper matches`.
- Codemod inventory: pass, reduced `READ_ONLY_SELECT` from `99` to `98`.
- Diff whitespace check: pass.
- Full local typecheck: blocked by pre-existing missing optional package type
  declarations (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`,
  `pptxgenjs`, `@resvg/resvg-js`). No touched-file errors were emitted before
  those dependency-resolution failures.

## Rollout Plan

Merge to main after CI is green, then allow the normal Vercel production
deployment to promote the transformer read-plane change. No database migration
or manual data operation is required.

Post-deploy smoke targets:

- A program detail page, because it consumes program full-state transformers.
- A strategic move card/page, because it consumes strategic-move transformers.
- The program portfolio/listing route, because it consumes program summary
  transformers.

## Rollback Plan

Rollback is file-local. If transformer behavior regresses, revert
`src/lib/programs/transformers.ts` and the focused regression test. If the
issue is isolated to one view-model builder, revert that helper block first and
redeploy. If multiple program surfaces regress, revert this merge commit and
restore the previous production deployment.

## Audit Evidence

- Parity artifact:
  `verification/packet-30-phase-2c/2c2b-program-transformers-parity.md`
- Census artifact:
  `verification/packet-30-phase-2c/2c2b-program-transformers-census.json`
- Updated inventory:
  `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`
- PR CI and Vercel deployment evidence after merge.

## Known Gaps

- `src/lib/programs/governance.ts` remains separate because gate evaluation is
  approval/write-adjacent, not a pure transformer read.
- Program route handlers remain for route-level pure-read PRs.
- Upload/storage and mutation-adjacent program flows remain out of this
  pure-read transformer slice.
- Phase 2D warn-to-fail Supabase guard enforcement remains out of scope until
  Phase 2C completes.
