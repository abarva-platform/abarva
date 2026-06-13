# 2026-06-12-deliverable-export-blob-vault — Deliverable Export Blob Vault

## Release ID

`2026-06-12-deliverable-export-blob-vault`

## Status

`candidate`

## Plain-English Summary

Moves deliverable exports now register the rendered export bytes in the Move Artifact Vault when a user exports HTML, DOCX, or XLSX from a `deliverables_v2` row. The route still returns the same downloadable file, but it also records a File Cabinet artifact with Blob path, format, version, source deliverable id, and export metadata so generated deliverables are not browser-only downloads.

## Layer Impact

- `global-control-lane`: Extends the existing deliverable content-export route without changing its route contract or adding a new generic generation endpoint.
- `client-data-lane`: Writes versioned Move Artifact Vault rows through the existing `move_artifacts`/Azure Blob helper; no schema migration is included.
- `public-demo`: Makes demo exports more truthful because exported DOCX/XLSX bytes become durable artifacts that the File Cabinet can surface.

## Client Applicability

- All clients: Any tenant using the Moves deliverable content-export route receives vault registration on export.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None; the route behavior is additive and response-compatible.

## Changes Included

- Updates `src/app/api/programs/[id]/deliverables/[deliverableId]/content-export/route.ts` to persist rendered HTML/DOCX/XLSX bytes through `saveMoveArtifact`.
- Adds response headers that expose whether a Move Artifact Vault row was created and whether Blob storage succeeded.
- Extends the focused content-export route test to assert DOCX and XLSX binary bodies are passed into the vault helper.

## QA / Validation

- Passed: `npm test -- --runTestsByPath src/app/api/programs/[id]/deliverables/[deliverableId]/content-export/__tests__/route.test.ts --runInBand`
- Passed: `npx eslint src/app/api/programs/[id]/deliverables/[deliverableId]/content-export/route.ts src/app/api/programs/[id]/deliverables/[deliverableId]/content-export/__tests__/route.test.ts`
- Passed: `npx tsc --noEmit --pretty false`
- Passed: `npm run audit:architecture-rules`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Passed: `git diff --check`

## Rollout Plan

Merge to `main`. No migration or feature flag is required. Existing exports continue to return the file immediately; the new vault registration runs during the export request and records whether Blob storage was actually available.

## Rollback Plan

Revert the PR. Existing `move_artifacts` rows created during exports remain as historical artifact records; future exports return to download-only behavior.

## Audit Evidence

- PR URL and CI run for this release candidate.
- Focused route test output showing HTML, DOCX, and XLSX export persistence calls.
- Runtime evidence source: `move_artifacts` rows with `metadata.exportedFrom = deliverables_v2` and Blob headers on export responses.

## Known Gaps

- No live ACA export, DB-row, Blob-byte download, or Log Analytics verification is included in this local slice.
- This slice does not backfill prior browser-only exports; only exports performed after this change carry new vault lineage.
