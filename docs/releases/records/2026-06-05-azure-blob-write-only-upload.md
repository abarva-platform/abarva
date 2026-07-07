# 2026-06-05-azure-blob-write-only-upload — Azure Blob Write-Only Upload Semantics

## Release ID

`2026-06-05-azure-blob-write-only-upload`

## Status

`candidate`

## Plain-English Summary

The Admin bulk context loader now supports least-privilege Azure Blob credentials that can write landing-zone files but cannot read existing blobs. Instead of checking blob existence before upload, the adapter uses Azure conditional upload semantics to prevent overwrite without requiring read permission.

## Layer Impact

- `client-data-lane`: Meridian/PHS governed bulk loads can proceed with private data-plane Blob writer credentials.
- `internal-admin`: Admin upload behavior remains no-overwrite by default, but no longer depends on Blob read permission.

## Client Applicability

- All clients: Any tenant using the Admin bulk loader with Azure Blob landing benefits from the narrower RBAC model.
- Immediate pilot: Meridian/PHS live reset/reload.
- Public/demo only: No.
- Feature flag: No.

## Changes Included

- `src/lib/data-plane/objectStorage.ts` removes read-before-write existence checks from uploads.
- The adapter now sends `conditions: { ifNoneMatch: '*' }` when `upsert` is false.
- Upload failures are normalized to a safe error summary with Azure code/status/name where available.
- `src/lib/data-plane/__tests__/objectStorage.test.ts` covers no-read upload behavior, conditional upload, and safe authorization error reporting.

## QA / Validation

- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/jest src/lib/data-plane/__tests__/objectStorage.test.ts --runInBand`
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/eslint src/lib/data-plane/objectStorage.ts src/lib/data-plane/__tests__/objectStorage.test.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- BLOCKED until deploy: live Meridian/PHS bulk upload retry against production.

## Rollout Plan

Merge to `main`, deploy to Vercel production, then rerun the Meridian/PHS Admin bulk upload. A successful rerun should stage files to Azure Blob and process tenant context rows through the governed loader.

## Rollback Plan

Revert this release. The previous behavior requires Blob read permission for no-overwrite checks and may block least-privilege writer credentials.

## Audit Evidence

- Live pre-fix validate-only passed for 26 Meridian/PHS files.
- Live pre-fix `stage_and_process` still returned `bulk_upload_failed` after container-create fallback, consistent with a second least-privilege Blob operation blocker.

## Known Gaps

- If the credential lacks Blob write permission, upload will still fail. The normalized error should now expose the safe Azure status/code needed for RBAC correction.
