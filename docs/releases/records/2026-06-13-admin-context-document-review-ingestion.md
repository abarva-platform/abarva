# 2026-06-13-admin-context-document-review-ingestion — Admin Context Document Review Ingestion

## Release ID

`2026-06-13-admin-context-document-review-ingestion`

## Status

`candidate`

## Plain-English Summary

Admin bulk context uploads can now stage rich documents for governed operator review instead of pretending that parsed PDF, DOCX, PPTX, XLSX, or Markdown content is immediately agent-ready. Structured CSV/JSON/YAML uploads keep their existing path. Rich-document evidence is staged as tenant-scoped review artifacts, then an operator can approve selected candidates before they become pending embedding chunks.

## Layer Impact

- `client-data-lane`: Adds a review-required document path before tenant-context chunk commit. Approved candidates are written as pending chunks only after explicit review.
- `internal-admin`: Adds the admin review API and persisted job/review status used by AbarVa operators and tenant admins.

## Client Applicability

- All clients: Admin Data Loads tenants receive the safer rich-document review path after deployment.
- Specific clients: None hard-coded.
- Internal only: Operator/admin review workflow and private-worker handoff.
- Public/demo only: No.
- Feature flag: None in this slice.

## Changes Included

- `src/lib/context-ingestion/bulk-context-upload.ts`: matches ZIP files by full manifest path, preserves stable bulk job ids, and records review-oriented workflow state.
- `src/lib/context-ingestion/bulk-context-upload-status.ts`: persists review artifact references with job status.
- `src/lib/context-ingestion/bulk-document-review.ts`: builds, stores, reads, and commits review-required document candidates.
- `src/app/api/admin/context-layer/bulk-upload/review/route.ts`: tenant-scoped review read/approve API.
- `src/scripts/azure-context-ingestion-worker.ts`: stages parsed document review artifacts for private-worker processing.
- Focused tests for bulk upload, nested ZIP path matching, status, and document review artifacts.

## QA / Validation

- PASS: `npx jest src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts src/lib/context-ingestion/__tests__/bulk-document-review.test.ts src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts --runInBand` — 3 suites, 17 tests passed.
- PASS: `npx eslint src/lib/context-ingestion/bulk-context-upload.ts src/lib/context-ingestion/bulk-document-review.ts src/lib/context-ingestion/bulk-context-upload-status.ts src/app/api/admin/context-layer/bulk-upload/review/route.ts src/scripts/azure-context-ingestion-worker.ts src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts src/lib/context-ingestion/__tests__/bulk-document-review.test.ts`.
- PASS: `git diff --check`.
- PENDING: PR CI after the reauthored current-main PR is opened.

## Rollout Plan

Merge the reauthored PR to `main`, build the Azure Container Apps image, deploy the web app and any worker image that uses `src/scripts/azure-context-ingestion-worker.ts`, then validate with a non-production tenant upload. No database migration is included in this slice.

## Rollback Plan

Revert the PR and redeploy the previous Azure Container Apps image. Existing structured uploads continue to work. Any review artifacts already staged in Blob remain inert unless approved through the review API.

## Audit Evidence

- Reauthored PR URL once opened.
- Focused Jest and ESLint outputs from this branch.
- PR CI checks.
- Post-deploy ACA image digest and health proof if deployed.
- Optional follow-up: Admin bulk upload receipt showing staged original, review artifact path, operator approval, pending chunks, embedding/index refresh, retrieval proof, and citation rendering.

## Known Gaps

- This slice does not make rich documents agent-ready by itself.
- This slice does not auto-promote rows to `agent_ready`.
- This slice does not claim broad PDF/DOCX/PPTX/XLSX production readiness beyond the tested manifest-driven upload, parser artifact staging, review, and pending-chunk handoff.
