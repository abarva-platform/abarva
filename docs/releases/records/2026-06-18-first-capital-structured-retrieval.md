# 2026-06-18-first-capital-structured-retrieval — Structured Context Retrieval and Template Classification

## Release ID

`2026-06-18-first-capital-structured-retrieval`

## Status

`candidate`

## Plain-English Summary

AI Control Tower and Atlas-style questions were retrieving generic context chunks ahead of the structured Tower/template rows. This change adds a structured Azure Search pass for AI, spend, vendor, productivity, risk, persona, system, and initiative questions. It also marks the deterministic First Capital manifest templates with trusted domain/function classification so their chunks remain active and eligible for Azure Search backfill. The backfill utility now honors `TENANT_KEY` scope and can purge a scoped tenant's existing Search documents before replacing them. The retriever still pins the tenant key, then searches the structured context segments before merging in the general search results.

## Layer Impact

`client-data-lane`: Changes the Azure AI Search retrieval path over tenant context chunks, the First Capital manifest seed job classification metadata, and tenant-scoped Search backfill behavior. It does not change schema or tenant permissions.

## Client Applicability

- All clients: Applies to tenants using the Azure Search tenant-context retrieval lane.
- Specific clients: Validated against First Capital Financial as the immediate demo tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing retrieval path and feature-flag posture; this does not enable Azure Search for tenants by itself.

## Changes Included

- `src/lib/azure-search/tenant-context-retriever.ts`
- `src/lib/azure-search/__tests__/retriever-parity.test.ts`
- `scripts/jobs/load-first-capital-v2.ts`
- `src/scripts/azure-ai-search-backfill.ts`
- `src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts`

## QA / Validation

- `npx jest src/lib/azure-search/__tests__/retriever-parity.test.ts --runInBand` passed.
- `npx jest src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts --runInBand` passed.
- `npx tsc --noEmit --pretty false` passed.
- Live ACA verification before this change proved First Capital V2 data is committed, but Azure Search only exposed a small subset of the structured chunks because manifest CSV chunks without trusted classification were routed to review state and excluded from backfill. A follow-up ACA backfill showed the new structured chunks indexed, but also exposed stale `FCF-CHUNK-*` Search documents from the prior substrate. This change addresses both the indexing eligibility gap and the tenant-scoped replacement gap.

## Rollout Plan

Merge to `main`, rerun the First Capital V2 ACA load job so manifest CSV chunks are active, rerun Azure Search backfill with tenant purge enabled for First Capital, then rerun the First Capital golden-question smoke against the deployed/runtime retrieval path.

## Rollback Plan

Revert this release commit. The rollback removes the extra structured search pass, the manifest classification overrides, and tenant-scoped purge support. If the load job/backfill was rerun, rerun the last known-good First Capital load/backfill image to restore the prior indexing posture.

## Audit Evidence

- Focused Jest output: `src/lib/azure-search/__tests__/retriever-parity.test.ts` passed, 19 tests.
- Focused Jest output: `src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts` passed.
- ACA evidence before the fix: First Capital context rows and source blobs were verified, but Azure Search segment counts showed `program_inventory=0` and `org_structure=0` for First Capital while live DB chunks existed for the required record IDs.

## Known Gaps

The post-change First Capital load, Azure Search backfill, and golden-question smoke still need to run from an ACA image containing this branch. The change improves retrieval/indexing eligibility but does not generate final Atlas answer prose by itself.
