# 2026-06-06-admin-context-upload-progress — Admin Context Upload Progress Center

## Release ID

`2026-06-06-admin-context-upload-progress`

## Status

`candidate`

## Plain-English Summary

Admin Data Loads now show operators what is happening after they upload a bulk context package. The loader response includes a job id, phase-by-phase workflow status, and file-level next actions so a pilot operator can see whether the package was only validated, staged to Azure Blob, queued for private Azure worker processing, or processed immediately through the governed loader.

This makes the bulk loader easier to trust during Meridian/PHS pilot reloads because the screen no longer collapses the whole process into one success sentence.

## Layer Impact

- `internal-admin`: Improves the Admin Data Loads operator experience for governed context uploads.
- `client-data-lane`: Adds traceable status metadata around tenant-scoped upload, scan, Blob staging, queue handoff, worker wait, operator review, and commit phases. No schema or data-plane write behavior changes.

## Client Applicability

- All clients: Any tenant using Admin Data Loads receives the clearer upload-progress workflow.
- Specific clients: Meridian/PHS benefits immediately for pilot context ZIP and document-package reloads.
- Internal only: The UI is under Admin workspace access.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/context-ingestion/bulk-context-upload.ts`
  - Adds a deterministic bulk upload job id.
  - Adds workflow steps for validation, attestation, sensitive-data scan, Azure Blob staging, Azure worker queue handoff, private-worker processing, operator review, and tenant-context commit.
  - Adds file-level processing status and next action.
- `src/components/admin/context-layer/BulkContextUploadConnector.tsx`
  - Shows a live in-progress workflow while the upload request is running.
  - Shows the returned job id and loader workflow after the run completes.
  - Shows file-level next actions for staged, queued, validated, or processed files.
- Tests updated in:
  - `src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts`
  - `src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts --runInBand`
  - Result: 2 suites passed, 11 tests passed.
- Pass: `npx eslint src/lib/context-ingestion/bulk-context-upload.ts src/components/admin/context-layer/BulkContextUploadConnector.tsx src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
  - First run blocked because this release record still listed validation as pending; record updated before rerun.
- Blocked: `npx tsc --noEmit --pretty false --incremental false`
  - Local TypeScript stopped on missing packages in the linked dependency tree: `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`. The edited files passed focused Jest, ESLint, release check, and diff whitespace validation.

## Rollout Plan

Merge to main and deploy through the normal Vercel production path. No database migration is required. The first release is response-driven and UI-visible; durable worker callback polling can land as a later backend slice.

## Rollback Plan

Revert the PR. Bulk ZIP upload and document staging from the prior release remain available, but the Admin screen returns to the simpler accepted/blocked result display.

## Audit Evidence

- PR URL: to be attached after PR creation.
- CI checks: to be attached after PR creation.
- Local validation commands listed above.

## Known Gaps

This release does not add durable job persistence or Azure worker callbacks. For document-heavy uploads, the UI correctly marks private-worker processing, operator review, and tenant-context commit as pending after queue handoff. A future release should persist job state and poll worker results from the private data plane.
