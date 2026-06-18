# 2026-06-18-azure-search-replace-refresh — Azure Search Replace-Style Tenant Refresh

## Release ID

`2026-06-18-azure-search-replace-refresh`

## Status

`candidate`

## Plain-English Summary

Hardens the tenant-context Azure Search refresh after the first scoped Meridian/Lakeshore apply proved that upload-only backfill is not enough. The apply uploaded documents, but verification failed because old Meridian documents were still present and Lakeshore did not reach the expected count. This change makes a scoped apply replace the tenant's Search documents: scan existing IDs for each selected tenant, delete them, upload the current Postgres chunks, inspect per-document indexing results, and retry verification while Azure Search settles.

## Layer Impact

- `client-data-lane`: Changes the Search refresh behavior for tenant context chunks.
- `internal-admin`: Makes private operator refresh jobs safer and more auditable.

## Client Applicability

- All clients: Scoped Search apply now replaces selected tenant docs instead of only uploading over existing docs.
- Specific clients: Built because Meridian Health and Lakeshore Industries refresh verification exposed stale/mismatched Search counts.
- Internal only: Private operator Search refresh job.
- Public/demo only: Not applicable.
- Feature flag: Does not enable `retrieval_azure_search`.

## Changes Included

- `src/scripts/azure-ai-search-backfill.ts`

## QA / Validation

- PASS: Prior #3655 CI gates passed before this follow-up.
- FAIL/BLOCKED: ACA scoped apply execution `job-abarva-private-operator-eus-07wvamh` failed before Search auth because no Search credential or selected managed identity was available.
- FAIL/BLOCKED: ACA scoped apply execution `job-abarva-private-operator-eus-w9m2wh7` authenticated after setting `AZURE_CLIENT_ID`, uploaded 941 docs, then failed verification with `lakeshore: expected 439, got 180; meridian-health: expected 502, got 3848`.
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/eslint src/scripts/azure-ai-search-backfill.ts`
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/tsc --noEmit --pretty false`
- PASS: `git diff --check`
- PASS: `node scripts/release-check.mjs --base origin/codex/ai-control-tower-substrate --head HEAD`

## Rollout Plan

Merge, rebuild the ACA image, deploy it, then rerun:

`AZURE_SEARCH_BACKFILL_TENANTS=meridian-health,lakeshore npx tsx src/scripts/azure-ai-search-backfill.ts apply`

The private operator must also set `AZURE_CLIENT_ID` to the user-assigned managed identity client id until a Search admin key secret is wired directly to the job.

## Rollback Plan

Git-revert this release. If a bad Search apply occurred, rerun a known-good tenant-scoped Search refresh after restoring the previous script or purge tenant documents and leave `retrieval_azure_search` disabled.

## Audit Evidence

- Failed apply with no Search credential/identity selection: `job-abarva-private-operator-eus-07wvamh`
- Failed apply with upload-only mismatch: `job-abarva-private-operator-eus-w9m2wh7`
- Future PR/CI and successful ACA apply/verify execution ids once available.

## Known Gaps

- Does not generate embeddings.
- Does not enable Search-backed retrieval.
- Does not implement Intelligence `context_insights`.
