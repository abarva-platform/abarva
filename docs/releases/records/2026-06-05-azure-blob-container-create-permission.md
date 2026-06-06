# 2026-06-05-azure-blob-container-create-permission — Azure Blob Landing Permission Fix

## Release ID

`2026-06-05-azure-blob-container-create-permission`

## Status

`candidate`

## Plain-English Summary

The Admin bulk context loader no longer requires container-create permission before uploading files into an already-provisioned Azure Blob landing container. This matches the private data-plane model where storage containers are provisioned by Azure operations and the app runtime receives only the minimum permission needed to write landing-zone objects.

## Layer Impact

- `client-data-lane`: The Meridian/PHS bulk loader can proceed past pre-created container setup and test the real blob write permission.
- `internal-admin`: Admin upload behavior is unchanged except that restricted storage credentials are no longer blocked by an unnecessary create-container call.

## Client Applicability

- All clients: Any tenant using the Admin bulk context loader with Azure Blob object storage benefits from the narrower permission model.
- Specific clients: Meridian/PHS is the immediate pilot validation lane.
- Internal only: Yes, this affects authenticated Admin upload operations only.
- Public/demo only: No.
- Feature flag: No.

## Changes Included

- `src/lib/data-plane/objectStorage.ts` tolerates Azure 403 authorization responses from `createIfNotExists()` and proceeds to the actual blob upload.
- `src/lib/data-plane/__tests__/objectStorage.test.ts` proves the adapter continues after a container-create permission denial but still surfaces a true upload authorization failure.

## QA / Validation

- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/jest src/lib/data-plane/__tests__/objectStorage.test.ts --runInBand`
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/eslint src/lib/data-plane/objectStorage.ts src/lib/data-plane/__tests__/objectStorage.test.ts`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- BLOCKED until deploy: live Meridian/PHS bulk upload retry against production.

## Rollout Plan

Merge to `main`, deploy to Vercel production, then rerun the Meridian/PHS Admin bulk upload. A successful rerun should stage files to Blob and process tenant context chunks through the governed loader.

## Rollback Plan

Revert this release. The previous behavior fails earlier when the runtime lacks container-create permission, so rollback is safe but reintroduces the private data-plane blocker.

## Audit Evidence

- Live pre-fix failure: `stage_and_process` returned Azure authorization failure during Meridian/PHS bulk upload on 2026-06-06T00:08Z.
- Local validate-only evidence: 26 Meridian/PHS files passed manifest, template, and sensitive-data gates before the Blob authorization failure.

## Known Gaps

- If the storage credential also lacks blob write permission, the upload will still fail. This fix only removes the unnecessary container-create requirement.
