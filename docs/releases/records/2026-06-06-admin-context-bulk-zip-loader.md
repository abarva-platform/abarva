# 2026-06-06-admin-context-bulk-zip-loader — Admin Context Bulk ZIP Loader

## Release ID

`2026-06-06-admin-context-bulk-zip-loader`

## Status

`candidate`

## Plain-English Summary

Admin Data Loads can now accept one ZIP package for a bulk context load. The ZIP must include a root `manifest.json` or `bulk-manifest.json`; the route safely expands the archive, validates paths and size limits, and then sends each referenced file through the same governed bulk loader used by individual multi-file uploads.

The change also clarifies that document-style files such as PDFs, Word documents, PowerPoint decks, Excel workbooks, and Markdown can be staged to Azure Blob and queued for private Azure processing, while immediate in-app processing remains limited to structured CSV, JSON, JSONL, and YAML inputs.

## Layer Impact

- `internal-admin`: Enhances the Admin context upload workflow for pilot operators.
- `client-data-lane`: Affects tenant-scoped ingestion, Azure Blob staging, Service Bus queue messages, sensitive-data gates, and context chunk writes.

## Client Applicability

- All clients: Any tenant using Admin Data Loads receives the ZIP package and document staging capability.
- Specific clients: Meridian/PHS benefits immediately for pilot context reloads and richer source packages.
- Internal only: The UI is under Admin workspace access.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/admin/context-layer/bulk-upload/route.ts`
  - Accepts a single ZIP package containing `manifest.json` or `bulk-manifest.json`.
  - Rejects mixed ZIP plus loose-file uploads, unsafe archive paths, missing manifests, and oversized extracted files.
- `src/lib/context-ingestion/bulk-context-upload.ts`
  - Adds MIME detection for PDF, DOCX, PPTX, XLSX, and Markdown.
  - Allows document files to stage and queue for Azure processing.
  - Blocks document files from `stage_and_process` so unparsed PDFs/decks cannot silently become grounding rows.
- `src/components/admin/context-layer/BulkContextUploadConnector.tsx`
  - Updates Admin copy and file picker support for ZIP and document formats.
- Tests added in:
  - `src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts`
  - `src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts`

## QA / Validation

- `npx jest src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts --runInBand`
  - Passed: 3 suites, 22 tests.
- `npx eslint src/app/api/admin/context-layer/bulk-upload/route.ts src/lib/context-ingestion/bulk-context-upload.ts src/components/admin/context-layer/BulkContextUploadConnector.tsx src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts`
  - Passed.
- `git diff --check`
  - Passed.

## Rollout Plan

Merge to main and deploy through the normal Vercel production path. No database migration is required. Azure Blob and queue behavior continues to use the existing object-storage adapter and Service Bus producer configuration.

## Rollback Plan

Revert the PR. Existing loose-file bulk uploads and single structured uploads will continue working after rollback; ZIP package support and document staging copy will be removed.

## Audit Evidence

- PR URL: to be attached after PR creation.
- CI checks: to be attached after PR creation.
- Local validation commands listed above.

## Known Gaps

PDF, DOCX, PPTX, XLSX, and Markdown parsing is not committed inline by this release. Those files are staged and queued for private Azure processing. A future release should add review-required extraction artifacts with page, slide, heading, sheet, and cell citations before document-derived facts become agent-grounding context.
