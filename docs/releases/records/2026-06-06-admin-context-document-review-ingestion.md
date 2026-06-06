# 2026-06-06-admin-context-document-review-ingestion — Admin Context Document Review Ingestion

## Release ID

`2026-06-06-admin-context-document-review-ingestion`

## Status

`candidate`

## Plain-English Summary

Admin bulk context ingestion now keeps a stronger truth boundary for rich documents. ZIP packages can match files by full nested manifest paths, queued worker messages carry the bulk job id, and parsed PDF/DOCX/PPTX/XLSX/Markdown files create review-required extraction artifacts before any document-derived chunks can become grounding context.

This does not claim the newest PHS/Meridian synthetic pack is searchable. Document-derived chunks still require operator approval, database commit, embedding refresh, and signed-in retrieval QA before Sentinel/Nexus can cite them as active context.

## Layer Impact

- `internal-admin`: Adds operator-facing review artifacts and a tenant-scoped review/approval API for Admin Context Layer bulk uploads.
- `client-data-lane`: Affects tenant-scoped ingestion metadata, Azure Blob review artifacts, job-status updates, and approved document chunk writes to `enterprise_context_chunks`.

## Client Applicability

- All clients: Any tenant using Admin Data Loads receives safer ZIP matching and the document review path.
- Specific clients: Meridian/PHS benefits directly for synthetic context pack loads, but the pack is not active grounding until commit, embedding, and retrieval QA pass.
- Internal only: The routes are under authenticated Admin Context Layer workflows.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/context-ingestion/bulk-context-upload.ts`
  - Matches manifest files by full normalized path first, with basename fallback only when unambiguous.
  - Computes a stable bulk job id before queueing and includes job metadata in Blob/Service Bus handoff.
- `src/lib/context-ingestion/bulk-document-review.ts`
  - Builds and persists review-required document extraction artifacts.
  - Commits approved candidates as pending embedding chunks only after operator approval.
- `src/lib/context-ingestion/bulk-context-upload-status.ts`
  - Adds review artifact metadata and worker/approval status update helpers.
- `src/scripts/azure-context-ingestion-worker.ts`
  - Writes review-required artifacts for admin bulk rich-document messages instead of treating parsed document text as immediately grounded context.
- `src/app/api/admin/context-layer/bulk-upload/review/route.ts`
  - Adds tenant-scoped review artifact fetch and approval commit endpoints.
- Tests added/updated under:
  - `src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts`
  - `src/lib/context-ingestion/__tests__/bulk-document-review.test.ts`
  - `src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts`

## QA / Validation

- Pending local validation on this branch before final PR update:
  - `npx jest src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts src/lib/context-ingestion/__tests__/bulk-document-review.test.ts src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts src/app/api/admin/context-layer/bulk-upload/status/__tests__/route.test.ts --runInBand`
  - `npx eslint src/lib/context-ingestion/bulk-context-upload.ts src/lib/context-ingestion/bulk-document-review.ts src/lib/context-ingestion/bulk-context-upload-status.ts src/scripts/azure-context-ingestion-worker.ts src/app/api/admin/context-layer/bulk-upload/review/route.ts src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts src/lib/context-ingestion/__tests__/bulk-document-review.test.ts src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts`
  - `npm run release:check`
  - `git diff --check`

## Rollout Plan

Merge to main and deploy through the normal Vercel and Azure worker deployment paths. Existing loose-file and structured upload behavior continues to work; document review artifacts become active when the Admin bulk route stages documents and the private worker processes the queue.

## Rollback Plan

Revert the PR. Existing structured `stage_and_process` uploads and previous Blob/queue staging remain available after rollback; document review artifact creation and the review approval API are removed.

## Audit Evidence

- PR URL: to be attached after PR creation.
- CI checks: to be attached after PR creation.
- Local validation commands listed above.
- Review artifacts are persisted under `context-uploads/<tenant>/_reviews/<jobId>/`.

## Known Gaps

Embedding/search refresh remains an operator step via `npm run embed:pending-chunks -- --tenant <tenant>`. Signed-in Sentinel/Nexus retrieval QA is still required before claiming a newly loaded document pack is active grounding.
