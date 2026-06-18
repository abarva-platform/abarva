# 2026-06-18-intelligence-azure-search-retrieval-wire — Intelligence Azure Search Retrieval Wire

## Release ID

`2026-06-18-intelligence-azure-search-retrieval-wire`

## Status

`candidate`

## Plain-English Summary

Lets Sentinel's Intelligence ask path use the tenant-scoped Azure AI Search context index when the `retrieval_azure_search` feature flag is enabled for a client. The existing Postgres structured facts and persisted context chunk path stays in place, so a Search outage or disabled flag does not make the agent lose the already-loaded client context.

## Layer Impact

- `global-control-lane`: Adds a flagged retrieval source to the shared Intelligence ask evidence path.
- `client-data-lane`: Reads tenant-scoped chunks from the existing `tenant-context-v1` Azure Search index; no data is written or deleted.

## Client Applicability

- All clients: Code path is available to every tenant.
- Specific clients: Meridian Health and Lakeshore can be enabled once the `retrieval_azure_search` tenant flag is set and live answer QA passes.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `retrieval_azure_search`.

## Changes Included

- `src/lib/knowledge/tenant-enterprise-context.ts` now adds an Azure Search indexed context source when the tenant flag is enabled.
- `src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts` covers flag-off behavior, flag-on indexed evidence, and Search failure fallback.

## QA / Validation

- PASS: `./node_modules/.bin/jest src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts --runInBand`
- PASS: `./node_modules/.bin/tsc --noEmit --pretty false`
- PASS: `./node_modules/.bin/eslint src/lib/knowledge/tenant-enterprise-context.ts src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check`

## Rollout Plan

Merge to the controlled substrate branch, pass CI, deploy the web image, then enable `retrieval_azure_search` tenant-by-tenant through the existing environment allowlist only after signed-in Sentinel answer QA confirms the indexed context improves answers without cross-tenant leakage.

## Rollback Plan

Disable the `retrieval_azure_search` tenant allowlist to return Sentinel to the existing Postgres structured fact and persisted chunk sources. If needed, revert this code PR and redeploy the previous healthy web image. No schema or data rollback is required.

## Audit Evidence

- Focused unit test output for `src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts`.
- Prior Azure Search refresh evidence showed tenant-scoped indexed context counts for Meridian and Lakeshore.

## Known Gaps

- Does not enable the feature flag for any tenant by itself.
- Does not generate new embeddings.
- Does not prove signed-in Sentinel browser answers; that remains a required post-deploy QA gate before claiming user-visible answer proof.
