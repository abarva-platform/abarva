# 2026-06-05-phs-loader-ui-preflight — PHS Loader UI and Preflight

## Release ID

`2026-06-05-phs-loader-ui-preflight`

## Status

`candidate`

## Plain-English Summary

Makes the governed Admin context-layer CSV loader recognize the PHS Phase 0
templates. Operators can now select the six PHS command-center file shapes in
the upload UI, and the server blocks malformed PHS files before writing any
tenant context chunks.

## Layer Impact

`client-data-lane`: Adds PHS-specific upload-template recognition and
server-side required-field enforcement before context rows are persisted.

`global-control-lane`: Extends the shared template registry resolver so future
Setup/Admin loader slices can reuse the same PHS template definitions.

## Client Applicability

- All clients: The shared resolver can host additional governed templates.
- Specific clients: Meridian / PHS command-center setup is the immediate target.
- Internal only: Yes, Admin/context-layer setup flow.
- Public/demo only: No public route impact.
- Feature flag: None.

## Changes Included

- Updated `src/lib/context-ingestion/template-registry.ts` to expose PHS
  templates through the shared resolver.
- Updated `src/components/admin/context-layer/CsvUploadConnector.tsx` so the
  Uploads surface lists PHS Phase 0 templates.
- Updated `src/lib/context-ingestion/csv-upload-connector.ts` so malformed PHS
  uploads are rejected before persistence.
- Added focused registry and upload-guard tests.

## QA / Validation

- PASS: `npx jest src/lib/context-ingestion/__tests__/template-library-exceptions.test.ts src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts --runInBand`.
- PASS: `npx eslint src/lib/context-ingestion/template-registry.ts src/lib/context-ingestion/csv-upload-connector.ts src/lib/context-ingestion/__tests__/template-library-exceptions.test.ts src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts src/components/admin/context-layer/CsvUploadConnector.tsx`.

## Rollout Plan

Merge to main. The UI change becomes available wherever the Admin
context-layer upload route is available. No data load, migration, or generation
job is triggered by this release.

## Rollback Plan

Revert the PR. Existing Northstar/general templates remain unchanged in their
own export, and no production data is mutated by this change.

## Audit Evidence

- Registry source: `src/lib/context-ingestion/template-registry.ts`.
- Upload connector source: `src/lib/context-ingestion/csv-upload-connector.ts`.
- UI source: `src/components/admin/context-layer/CsvUploadConnector.tsx`.
- Tests: `src/lib/context-ingestion/__tests__/template-library-exceptions.test.ts`.
- Tests: `src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts`.

## Known Gaps

Evidence-ledger binding and human approval-state persistence are follow-on
slices. This release only surfaces the templates and blocks malformed PHS CSVs
before context-chunk persistence.
