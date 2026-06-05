# 2026-06-05-bulk-context-worker-queue-handoff - Bulk context upload worker queue handoff

## Release ID

`2026-06-05-bulk-context-worker-queue-handoff`

## Status

`candidate`

## Plain-English Summary

Adds an async handoff mode to the Admin bulk context upload lane. Operators can now validate files, stage them to Azure Blob, and queue canonical `abarva.ingestion.v1` messages for the private Azure ingestion worker instead of immediately writing tenant context rows from the web request.

## Layer Impact

- `client-data-lane`: Adds a Blob-to-Service-Bus handoff path for governed context ingestion. Files remain tenant-scoped, attested, sensitive-scanned, and routed through the canonical Azure landing-zone message contract.
- `internal-admin`: Adds a worker-queue run mode to the Admin bulk upload connector for private data-plane pilots.

## Client Applicability

- All clients: Shared Admin bulk upload lane gains the async worker handoff mode.
- Specific clients: Meridian/PHS is the immediate pilot use case.
- Internal only: Only authenticated tenant operators can access the Admin upload lane.
- Public/demo only: No.
- Feature flag: No.

## Changes Included

- Adds `stage_and_enqueue` mode to `src/lib/context-ingestion/bulk-context-upload.ts`.
- Adds `src/lib/ingestion/service-bus-producer.ts` for canonical Azure landing-zone queue messages.
- Exposes `describeObjectStorageLocation()` from `src/lib/data-plane/objectStorage.ts` so worker messages reference the actual Azure account/container/blob path, including shared-container deployments.
- Exposes `segmentKeyForContextDimension()` from the context upload loader so queued messages use the existing canonical segment mapping.
- Updates `/api/admin/context-layer/bulk-upload` to accept `stage_and_enqueue`.
- Updates Admin bulk upload UI mode selector.
- Updates the Meridian/PHS Azure handoff doc to mark Blob staging and queue handoff as implemented-in-code while preserving the Azure private-network smoke gap.

## QA / Validation

- PASS: `./node_modules/.bin/jest src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts --runInBand`
- PASS: `./node_modules/.bin/eslint src/lib/data-plane/objectStorage.ts src/lib/ingestion/service-bus-producer.ts src/lib/context-ingestion/csv-upload-connector.ts src/lib/context-ingestion/bulk-context-upload.ts src/components/admin/context-layer/BulkContextUploadConnector.tsx src/app/api/admin/context-layer/bulk-upload/route.ts src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts`
- BLOCKED: `./node_modules/.bin/tsc --noEmit --pretty false` in the temporary worktree because the linked local dependency tree is missing `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`. This is a local tooling/dependency issue unrelated to the touched files; PR CI must be used as the authoritative typecheck.
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` after CI is green. Deploy normally to Vercel production if runtime behavior is desired. Operators should use `Validate only` first, then `Stage to Azure Blob and queue worker` only after Blob and Service Bus env vars are present in the executing runtime.

## Rollback Plan

Revert the PR and redeploy. Queued messages can be left for retry/dead-letter handling or drained manually from Service Bus. Blob objects created before rollback are additive under the context upload prefix and can be removed by prefix if needed.

## Audit Evidence

- PR URL: Pending.
- CI checks: Pending.
- Production deployment: Pending merge/deploy approval.
- Local focused tests and lint passed as listed above.
- Local typecheck blocked by missing optional dependency packages in the linked local dependency tree.

## Known Gaps

- Azure private-network smoke is still required before claiming live async processing.
- Worker default mode remains `audit_only`; queued files prove handoff, but chunk commit/embedding still need the worker commit pipeline and retrieval smoke.
- Pilot ingestion ledger writer is still not wired into the worker wrapper.
