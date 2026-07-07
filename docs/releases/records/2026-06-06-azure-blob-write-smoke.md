# 2026-06-06-azure-blob-write-smoke — Azure Blob Write-Only Smoke

## Release ID

`2026-06-06-azure-blob-write-smoke`

## Status

`candidate`

## Plain-English Summary

Adds a write-only Azure Blob smoke command for the Admin context loader lane. The command writes one tiny diagnostic object through the same object-storage adapter used by the governed bulk upload flow. It does not read, list, or delete blobs, so it can prove the exact least-privilege permission Meridian/PHS needs before rerunning the live reset/reload.

## Layer Impact

- `internal-admin`: Adds an operator diagnostic command for the Admin Data Loads unblock path.
- `client-data-lane`: Helps validate the Blob staging permission required before tenant context files can be staged and processed.

## Client Applicability

- All clients: Any tenant using the governed Admin bulk loader can use the smoke to verify Blob write permission.
- Specific client: Meridian/PHS is the immediate blocker being diagnosed.
- Public/demo only: No.
- Feature flag: No.

## Changes Included

- `src/scripts/azure-blob-write-smoke.ts`
  - Writes a tiny text object to `context-uploads` by default.
  - Defaults the tenant key to `meridian-health`.
  - Uses `describeObjectStorageLocation()` and `getObjectStorageAdapter()` from the runtime object-storage adapter.
  - Emits safe JSON with account/container/blob path and redacted error details.
  - Does not perform Blob read, list, or delete operations.
- `package.json`
  - Adds `npm run azure:blob-write:smoke`.

## QA / Validation

- `npx eslint src/scripts/azure-blob-write-smoke.ts`
  - PASS.
- `npm run release:check -- --base origin/main --head HEAD`
  - PASS after release-record status wording was corrected.
- Live Azure validation:
  - BLOCKED until run from a runtime with the production/Azure object-storage env vars and managed identity or storage credential.

## Rollout Plan

Merge to `main` after CI is green. Run the command from the same runtime lane that will perform Admin bulk context uploads:

```bash
npm run azure:blob-write:smoke
```

Optional overrides:

```bash
AZURE_BLOB_WRITE_SMOKE_TENANT_KEY=meridian-health \
AZURE_BLOB_WRITE_SMOKE_BUCKET=context-uploads \
npm run azure:blob-write:smoke
```

If the smoke passes, rerun the Meridian/PHS Admin loader `stage_and_process` or `stage_and_enqueue` flow. If it fails with `object_upload_failed:...status=403`, fix the Azure credential/RBAC before retrying the reload.

## Rollback Plan

Revert this PR. No data migration or runtime route behavior is changed.

## Audit Evidence

- PR URL: to be attached after PR creation.
- CI checks: to be attached after PR creation.
- Live smoke result JSON: to be captured by the Azure/private-runner session.

## Known Gaps

This smoke proves only Blob write permission. It does not prove Service Bus, worker consumption, document parsing, tenant context persistence, embedding, retrieval, or 50-question grounding quality.
