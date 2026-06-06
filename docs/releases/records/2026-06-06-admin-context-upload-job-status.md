# 2026-06-06-admin-context-upload-job-status — Admin Context Upload Job Status

## Release ID

`2026-06-06-admin-context-upload-job-status`

## Status

`candidate`

## Plain-English Summary

Admin Data Loads now has a durable status handoff for bulk context uploads. When an operator stages and queues a package, the loader writes a small job-status JSON document to the governed Azure Blob upload area and returns a pollable job id to the Admin screen.

This lets the UI keep checking the job after upload, so Meridian/PHS pilot operators can see whether the package is still waiting for private-worker extraction, needs review, or has been committed.

## Layer Impact

- `internal-admin`: Adds polling behavior to the Admin bulk context upload screen.
- `client-data-lane`: Adds a tenant-scoped job-status JSON document in the governed context upload Blob area for commit-mode bulk loads. No database schema change.

## Client Applicability

- All clients: Any tenant using Admin Data Loads can receive pollable bulk upload status.
- Specific clients: Meridian/PHS benefits immediately for pilot ZIP and document-package reloads.
- Internal only: The UI and route are under Admin workspace access.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/context-ingestion/bulk-context-upload-status.ts`
  - Adds Blob-backed job-status build, persist, and read helpers.
- `src/lib/context-ingestion/bulk-context-upload.ts`
  - Persists a status JSON document for `stage_and_enqueue` and `stage_and_process`.
  - Keeps `validate_only` as a true no-write path.
- `src/app/api/admin/context-layer/bulk-upload/status/route.ts`
  - Adds a tenant-checked status endpoint by `clientId` and `jobId`.
- `src/components/admin/context-layer/BulkContextUploadConnector.tsx`
  - Polls the status endpoint for pollable jobs and shows last-check status.
- Tests added/updated for loader status and route tenant isolation.

## QA / Validation

- Pass: `npx jest src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts src/app/api/admin/context-layer/bulk-upload/status/__tests__/route.test.ts --runInBand`
  - Result: 3 suites passed, 13 tests passed.
- Pass: `npx eslint src/lib/context-ingestion/bulk-context-upload.ts src/lib/context-ingestion/bulk-context-upload-status.ts src/components/admin/context-layer/BulkContextUploadConnector.tsx src/app/api/admin/context-layer/bulk-upload/status/route.ts src/app/api/admin/context-layer/bulk-upload/status/__tests__/route.test.ts src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
  - First run blocked because this release record still listed validation as pending; record updated before rerun.
- Pass: `git diff --check`

## Rollout Plan

Merge to main and deploy through the normal Vercel production path. No migration is required. The existing Azure Blob configuration is used for job-status documents.

## Rollback Plan

Revert the PR. Bulk upload and the response-time workflow display remain from the prior release, but durable status polling is removed.

## Audit Evidence

- PR URL: to be attached after PR creation.
- CI checks: to be attached after PR creation.
- Local validation commands listed above.

## Known Gaps

This release stores the initial upload job state and lets the Admin UI poll it. It does not yet implement the private Azure worker callback that updates the status from `waiting_for_private_worker` to `needs_operator_review` or `committed`.
