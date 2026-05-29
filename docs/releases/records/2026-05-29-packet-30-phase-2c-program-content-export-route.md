# 2026-05-29-packet-30-phase-2c-program-content-export-route — Phase 2C.2g Program Content Export Route

## Release ID

`2026-05-29-packet-30-phase-2c-program-content-export-route`

## Status

`candidate`

## Plain-English Summary

This release removes direct Supabase reads from the legacy program deliverable
content-export GET route. Deliverable metadata and latest-version content now
come from the Packet 30 read plane. Export rendering for HTML, DOCX, and XLSX
is unchanged.

## Layer Impact

- data-plane-lane: deliverable metadata and latest-version reads now use the
  Azure read plane.
- runtime-app-lane: `/api/programs/[id]/deliverables/[deliverableId]/content-export`
  response status, download headers, and render behavior are preserved.
- release-governance-lane: updates Phase 2C inventory and adds parity/census
  artifacts with rollback notes.
- client-data-lane: no migrations, seed changes, or data writes.

## Client Applicability

- All clients: shared program content-export route is universal across
  tenant-scoped program surfaces.
- Specific clients: none.
- Internal only: API read-path internals; user-facing behavior should be
  unchanged.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Removed `getServerSupabase()` from
  `src/app/api/programs/[id]/deliverables/[deliverableId]/content-export/route.ts`.
- Replaced `deliverables_v2` metadata lookup with `azureRead.maybeSingle()`.
- Replaced latest `deliverable_versions` lookup with `azureRead.maybeSingle()`.
- Kept HTML, DOCX, and XLSX rendering logic unchanged.
- Removed an unused DOCX-renderer local variable surfaced by focused ESLint.
- Added focused route tests for HTML export and empty-content behavior.
- Updated `verification/packet-30-phase-2c/CODEMOD_INVENTORY.*`.
- Added
  `verification/packet-30-phase-2c/2c2g-program-content-export-route-parity.md`.
- Added
  `verification/packet-30-phase-2c/2c2g-program-content-export-route-census.json`.

## QA / Validation

Validation performed:

```text
npx jest --runTestsByPath src/app/api/programs/[id]/deliverables/[deliverableId]/content-export/__tests__/route.test.ts --runInBand
npx eslint src/app/api/programs/[id]/deliverables/[deliverableId]/content-export/route.ts src/app/api/programs/[id]/deliverables/[deliverableId]/content-export/__tests__/route.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
```

Results:

- Focused Jest: pass, 1 suite / 2 tests.
- Focused ESLint: pass.
- Runtime Supabase census: pass/WARN, reduced from
  `152 files / 620 import-helper matches` to
  `151 files / 617 import-helper matches`.
- Codemod inventory: pass, reduced `READ_ONLY_SELECT` from `91` to `90`.
- Release control gate: pass.
- Diff whitespace check: pass.
- Full local typecheck: blocked by pre-existing missing optional package type
  declarations (`@azure/identity`, `@azure/storage-blob`,
  `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`). No touched-file
  errors were emitted.

## Rollout Plan

Merge to main after CI is green, then allow the normal Vercel production
deployment to promote the route read-plane change. No database migration or
manual data operation is required.

Post-deploy smoke target:

- `/api/programs/[id]/deliverables/[deliverableId]/content-export?format=html`
  from an authenticated tenant session.

## Rollback Plan

Rollback is file-local. Revert the content-export route, its focused test file,
the two `2c2g` evidence files, and the generated inventory update. If the route
regresses in production, revert this merge commit and restore the previous
production deployment.

## Audit Evidence

- Parity artifact:
  `verification/packet-30-phase-2c/2c2g-program-content-export-route-parity.md`
- Census artifact:
  `verification/packet-30-phase-2c/2c2g-program-content-export-route-census.json`
- Updated inventory:
  `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`
- PR CI and Vercel deployment evidence after merge.

## Known Gaps

- `src/app/api/programs/phase-gate/route.ts` remains write-adjacent and out of
  scope for this read-only export slice.
- Program attachment routes remain storage-backed and out of this focused
  content-export route slice.
- Phase 2D warn-to-fail Supabase guard enforcement remains out of scope until
  Phase 2C completes.
