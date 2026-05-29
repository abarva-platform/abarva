# 2026-05-29-packet-30-phase-2c-program-helper-reads — Phase 2C.2a Program Helper Reads

## Release ID

`2026-05-29-packet-30-phase-2c-program-helper-reads`

## Status

`candidate`

## Plain-English Summary

This release moves a bounded set of program helper reads from direct runtime
Supabase access to the Packet 30 Azure read plane. It covers approval person
display lookup, program evidence prompt context, move business-case input, and
program phase-data aggregation. It does not change program mutations, route
handlers, uploads, storage, schemas, or tenant data.

## Layer Impact

- data-plane-lane: selected program helper reads now use `azureRead`.
- runtime-app-lane: helper outputs keep the same RBAC gates, tenant predicates,
  ordering, limits, and fail-soft behavior.
- release-governance-lane: updates Phase 2C inventory and adds parity/census
  artifacts with rollback notes.
- client-data-lane: no migrations, seed changes, or data writes.

## Client Applicability

- All clients: shared program helper reads are universal across tenant-scoped
  program surfaces.
- Specific clients: none.
- Internal only: admin/program helper internals; user-facing behavior should be
  unchanged.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Converted `src/lib/programs/approval-person-resolver.ts` to `azureRead`.
- Converted `src/lib/programs/evidence-context.ts` to `azureRead`.
- Converted `src/lib/programs/board-artifacts/load-move-business-case-input.ts`
  to `azureRead`.
- Converted `src/lib/programs/db-phase-queries.ts` to explicit `azureRead`
  reads, decomposing the prior Supabase FK-expanded query into auditable table
  reads.
- Added focused tests for all converted helpers.
- Updated `verification/packet-30-phase-2c/CODEMOD_INVENTORY.*`.
- Added `verification/packet-30-phase-2c/2c2-program-helper-reads-parity.md`.
- Added `verification/packet-30-phase-2c/2c2-program-helper-reads-census.json`.

## QA / Validation

Validation performed:

```text
npx jest src/lib/programs/__tests__/approval-person-resolver.test.ts src/lib/programs/__tests__/evidence-context.test.ts src/lib/programs/board-artifacts/load-move-business-case-input.test.ts src/lib/programs/__tests__/db-phase-queries.test.ts --runInBand
npx eslint src/lib/programs/approval-person-resolver.ts src/lib/programs/__tests__/approval-person-resolver.test.ts src/lib/programs/evidence-context.ts src/lib/programs/__tests__/evidence-context.test.ts src/lib/programs/board-artifacts/load-move-business-case-input.ts src/lib/programs/board-artifacts/load-move-business-case-input.test.ts src/lib/programs/db-phase-queries.ts src/lib/programs/__tests__/db-phase-queries.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
git diff --check
```

Results:

- Focused Jest: pass, 4 suites / 8 tests.
- Focused ESLint: pass.
- Runtime Supabase census: pass/WARN, reduced from `160 files / 661
  import-helper matches` to `156 files / 649 import-helper matches`.
- Codemod inventory: pass, reduced `READ_ONLY_SELECT` from `103` to `99`.
- Diff whitespace check: pass.
- Full local typecheck: blocked by pre-existing missing optional package type
  declarations (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`,
  `pptxgenjs`, `@resvg/resvg-js`). No touched-file errors were emitted before
  those dependency-resolution failures.

## Rollout Plan

Merge to main after CI is green, then allow the normal Vercel production
deployment to promote the helper reads. No database migration or manual data
operation is required.

Post-deploy smoke targets:

- Program approval queue page, because it consumes approval person display
  lookup.
- Any program detail page that calls phase-data aggregation.
- Board-grade business-case export route with a `moveId`, because it consumes
  move business-case input.

## Rollback Plan

Rollback is file-local. If one helper regresses, revert that helper and its
test. If program detail aggregation regresses, revert
`src/lib/programs/db-phase-queries.ts` first and redeploy; it is the widest
behavior surface in this slice. If multiple surfaces regress, revert this merge
commit and restore the previous production deployment.

## Audit Evidence

- Parity artifact:
  `verification/packet-30-phase-2c/2c2-program-helper-reads-parity.md`
- Census artifact:
  `verification/packet-30-phase-2c/2c2-program-helper-reads-census.json`
- Updated inventory:
  `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`
- PR CI and Vercel deployment evidence after merge.

## Known Gaps

- `src/lib/programs/transformers.ts` remains a dedicated future parity slice.
- Program route handlers remain for route-level pure-read PRs.
- Upload/storage and mutation-adjacent program flows remain out of this
  pure-read helper slice.
- Phase 2D warn-to-fail Supabase guard enforcement remains out of scope until
  Phase 2C completes.
