# 2026-06-05-phs-evidence-ledger-binding — PHS Evidence Ledger Binding

## Release ID

`2026-06-05-phs-evidence-ledger-binding`

## Status

`candidate`

## Plain-English Summary

Connects valid PHS evidence-register uploads to the append-only evidence
ledger. When an operator uploads the governed evidence register through the
Admin context-layer loader, AbarVa now writes searchable context chunks and
also records citation-grade evidence rows that later generated artifacts can
cite.

## Layer Impact

`client-data-lane`: PHS evidence-register rows now become tenant-scoped,
append-only evidence ledger records after the normal upload gates pass.

`global-control-lane`: The shared CSV loader returns evidence ledger IDs in
the upload response so QA and future stage gates can prove citation records
exist.

## Client Applicability

- All clients: The pattern can be reused for future evidence-register loaders.
- Specific clients: Meridian / PHS command-center setup is the immediate target.
- Internal only: Admin/context-layer setup workflow.
- Public/demo only: No public route impact.
- Feature flag: None.

## Changes Included

- Added `src/lib/context-ingestion/phs-evidence-ledger-binding.ts`.
- Updated `src/lib/context-ingestion/csv-upload-connector.ts` to append PHS
  evidence-register rows to `evidence_ledger`.
- Updated `src/components/admin/context-layer/CsvUploadConnector.tsx` to show
  inserted evidence ledger IDs.
- Added focused tests for PHS evidence mapping and upload integration.

## QA / Validation

- PASS: `npx jest src/lib/context-ingestion/__tests__/phs-evidence-ledger-binding.test.ts src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts --runInBand`.
- PASS: `npx eslint src/lib/context-ingestion/phs-evidence-ledger-binding.ts src/lib/context-ingestion/csv-upload-connector.ts src/lib/context-ingestion/__tests__/phs-evidence-ledger-binding.test.ts src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts src/components/admin/context-layer/CsvUploadConnector.tsx`.

## Rollout Plan

Merge to main. No migration is required because the append-only
`evidence_ledger` table already exists. The feature becomes active for
governed PHS evidence-register CSV uploads.

## Rollback Plan

Revert the PR. Context chunk uploads continue to work, but PHS evidence-register
uploads would no longer append evidence ledger records.

## Audit Evidence

- Mapping helper: `src/lib/context-ingestion/phs-evidence-ledger-binding.ts`.
- Loader integration: `src/lib/context-ingestion/csv-upload-connector.ts`.
- UI response: `src/components/admin/context-layer/CsvUploadConnector.tsx`.
- Tests: `src/lib/context-ingestion/__tests__/phs-evidence-ledger-binding.test.ts`.
- Tests: `src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts`.

## Known Gaps

Stage-readiness gating still needs to require approved evidence before later
PHS demo phases can generate strategy, architecture, business-case, or
mobilization artifacts.
