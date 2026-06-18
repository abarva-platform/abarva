# 2026-06-18-azure-search-replace-refresh — Azure Search Replace-Style Tenant Refresh

## Release ID

`2026-06-18-azure-search-replace-refresh`

## Status

`deployed-private-data-plane`

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
- PASS: ACR build `cadh` produced `acrabarvalab001.azurecr.io/abarva/web:context-refresh-8ea3b75e` with digest `sha256:83b989f067e4beccc29c96aa5f1474723157d9640c4931618e293b392cbfe329`.
- PASS: Web ACA deployed revision `ca-abarva-web-lab-eastus--0000099` and shifted 100% traffic to `context-refresh-8ea3b75e`.
- PASS: Public health check returned `ok: true`, `postgres: true`, `direct_postgres: true`, `azure_graph: postgres`.
- PASS: ACA scoped apply execution `job-abarva-private-operator-eus-zbdnod1` purged stale tenant docs, uploaded 941 tenant-context documents, and verified observed counts `lakeshore: 439`, `meridian-health: 502`.
- PASS: Independent ACA verify execution `job-abarva-private-operator-eus-666ek2o` verified observed counts `lakeshore: 439`, `meridian-health: 502`.
- PASS: Private operator was restored to idle image `acrabarvalab001.azurecr.io/abarva/web@sha256:e7668ebbb670bc014893fcc3265341cc56810c98a73b104d05ef3a079c430b3c`, command `/bin/true`, with Search refresh env vars removed.

## Rollout Plan

Completed on June 18, 2026:

- Merged PR #3656.
- Rebuilt and deployed the web ACA image `context-refresh-8ea3b75e`.
- Ran tenant-scoped Search apply for `meridian-health,lakeshore`.
- Ran an independent tenant-scoped Search verify.

The private operator used `AZURE_CLIENT_ID=3b6e0c9d-2265-499f-af46-965e0ad78b95` for the user-assigned managed identity. It was restored to idle after apply and verify completed.

## Rollback Plan

Git-revert this release. If a bad Search apply occurred, rerun a known-good tenant-scoped Search refresh after restoring the previous script or purge tenant documents and leave `retrieval_azure_search` disabled.

## Audit Evidence

- Failed apply with no Search credential/identity selection: `job-abarva-private-operator-eus-07wvamh`
- Failed apply with upload-only mismatch: `job-abarva-private-operator-eus-w9m2wh7`
- Successful replace-style apply: `job-abarva-private-operator-eus-zbdnod1`
- Successful independent verify: `job-abarva-private-operator-eus-666ek2o`
- Web revision serving 100% traffic: `ca-abarva-web-lab-eastus--0000099`
- Image digest: `sha256:83b989f067e4beccc29c96aa5f1474723157d9640c4931618e293b392cbfe329`

## Known Gaps

- Does not generate embeddings.
- Does not enable Search-backed retrieval.
- Does not implement Intelligence `context_insights`.
