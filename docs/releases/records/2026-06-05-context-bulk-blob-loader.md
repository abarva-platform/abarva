# 2026-06-05-context-bulk-blob-loader — Bulk Context Upload to Azure Blob

## Release ID

`2026-06-05-context-bulk-blob-loader`

## Status

`candidate`

## Plain-English Summary

Admin operators can now upload a manifest plus multiple Meridian/PHS context
files in one governed action. The flow validates the manifest, confirms every
file is mapped to a real template, applies the same attestation and
sensitive-data gate as single-file loads, stages committed files to Azure Blob,
and then processes each file through the existing tenant context loader.

## Layer Impact

- `internal-admin`: Adds a bulk upload panel to the Admin Context Uploads
  workspace.
- `client-data-lane`: Adds a tenant-scoped bulk upload API that can write
  pending context chunks only after tenancy, attestation, sensitive scan, Blob
  staging, and template validation pass.

## Client Applicability

- All clients: The shared Admin Context Uploads page receives the bulk lane.
- Specific clients: Meridian/PHS is the immediate pilot use case.
- Internal only: Only authenticated operators with tenant access can use it.
- Public/demo only: No.
- Feature flag: No.

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/3139
- New route: `src/app/api/admin/context-layer/bulk-upload/route.ts`
- New Admin panel:
  `src/components/admin/context-layer/BulkContextUploadConnector.tsx`
- New orchestration library:
  `src/lib/context-ingestion/bulk-context-upload.ts`
- Existing page wiring:
  `src/app/(maestro)/admin/context-layer/uploads/page.tsx`
- Tests:
  `src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts`
  `src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts`

## QA / Validation

- PASS:
  `npx jest src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts --runInBand`
- PASS:
  `npx eslint src/lib/context-ingestion/bulk-context-upload.ts src/components/admin/context-layer/BulkContextUploadConnector.tsx src/app/api/admin/context-layer/bulk-upload/route.ts 'src/app/(maestro)/admin/context-layer/uploads/page.tsx' src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` after CI is green and deploy normally to Vercel production. The
bulk lane is visible in Admin Context Uploads immediately. Operators should run
`Validate only` first, then use `Stage to Azure Blob and process now` after Azure
Blob env vars are present in the runtime.

## Rollback Plan

Revert this PR and redeploy. Already loaded context rows remain valid
tenant-scoped records and can be audited by upload/source document. Azure Blob
objects created before rollback are additive and can be removed by their
`context-uploads/<tenant>/<load-name>/...` prefix if needed.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3139
- CI checks: Pending on PR #3139.
- Production deployment: Pending merge.
- Live smoke: Pending deployment.
- Operator evidence: Admin bulk load response includes file names, template ids,
  Blob bucket/path, row counts, chunk counts, and persistence status.

## Known Gaps

- This slice stages and processes synchronously through the existing backend
  loader. Full asynchronous Azure Function or Container Apps queue processing is
  still a separate architecture/Azure lane.
- Blob commit mode requires object storage env vars in the executing runtime.
