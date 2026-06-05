# 2026-06-05-meridian-context-loader-proof — Meridian Context Loader Proof

## Release ID

`2026-06-05-meridian-context-loader-proof`

## Status

`candidate`

## Plain-English Summary

Meridian/PHS healthcare upload templates are now represented in the runtime context template registry and selected for Meridian tenant uploads. The CSV loader keeps new rows tenant-scoped, provenance-bearing, and pending for embedding; it does not claim human approval or agent readiness without downstream evidence.

## Layer Impact

- `internal-admin`: Updates the Admin context-layer template catalog and upload selector to use the tenant-aware runtime template registry.
- `client-data-lane`: Adds Meridian healthcare dimensions to loader mapping so uploaded healthcare CSV rows are classified into canonical context segments without migrations or side-loads.

## Client Applicability

- All clients: Existing Northstar/default template behavior remains available.
- Specific clients: Meridian Health System / PHS receives the healthcare template registry selection.
- Internal only: Admin context-layer setup and verification surfaces.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Runtime template registry now includes the 26 Meridian healthcare catalog templates.
- CSV loader resolves duplicate template IDs by tenant key and maps healthcare dimensions to existing context segments.
- Admin context-layer pages render tenant-aware templates and avoid implying agent readiness from an empty pending queue.
- Meridian showcase verifier checks that catalog template IDs and dimensions exist in the runtime registry.
- Focused CSV loader tests cover template-backed mapping, tenant scoping, provenance, pending embedding status, and absence of human approval / agent-ready claims.

## QA / Validation

- `npx jest src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts --runInBand` — passed.
- `npm run verify:meridian-context-showcase` — passed with 26 templates, 8 scenarios, and 26 dimensions.
- `npx tsc --noEmit --pretty false` — passed.
- `npx eslint src/lib/context-ingestion/types.ts src/lib/context-ingestion/template-registry.ts src/lib/context-ingestion/csv-upload-connector.ts src/lib/context-ingestion/file-classifier.ts src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts src/components/admin/context-layer/CsvUploadConnector.tsx 'src/app/(maestro)/admin/context-layer/page.tsx' 'src/app/(maestro)/admin/context-layer/templates/page.tsx' 'src/app/(maestro)/admin/context-layer/uploads/page.tsx' 'src/app/(maestro)/admin/context-layer/approval-queue/page.tsx'` — passed.
- `git diff --check -- ...touched files...` — passed.

## Rollout Plan

Merge to main and deploy normally. No database migration, seed, or data backfill is required. Meridian/PHS uploads become template-backed when operators use the existing Admin context-layer CSV upload path.

## Rollback Plan

Revert this release candidate. Existing tenant data is unaffected because the patch does not delete rows, run migrations, or side-load data.

## Audit Evidence

- Focused Jest loader test output.
- Meridian showcase verifier output.
- TypeScript and ESLint command outputs.
- Diff of runtime registry, loader, Admin context-layer pages, and release record.

## Known Gaps

Human approval and embedding execution remain downstream workflows. This release only proves the loader path produces pending, tenant-scoped, provenance-bearing chunks and does not mark them agent-ready.
