# Supabase Sunset Proof - 04 Azure Search / Vector Proof

Date: 2026-06-07
Status: HOLD - production golden retrieval proof not complete
Scope: Azure search/vector indexes rebuilt from Azure Postgres data

## Gate verdict

Supabase is **not sunset-ready** until Azure search/vector indexes are rebuilt
from Azure Postgres data, index counts match expected Azure source rows, and
golden retrieval questions return specific grounded answers for all required
tenants.

## Existing evidence from 2026-06-06

The release record `docs/releases/records/2026-06-06-azure-search-canonical-rebuild.md`
records a successful lab rebuild of `tenant-context-v1` from Azure Postgres:

| Tenant               | Expected Azure source rows | Observed Azure Search docs | Status             |
| -------------------- | -------------------------: | -------------------------: | ------------------ |
| `apex-retail`        |                      6,497 |                      6,497 | PASS for lab count |
| `first-capital`      |                        400 |                        400 | PASS for lab count |
| `lakeshore-holdings` |                      6,576 |                      6,576 | PASS for lab count |
| `meridian-health`    |                      4,376 |                      4,376 | PASS for lab count |
| `northstar-clinical` |                        878 |                        878 | PASS for lab count |
| `skyharbor-air`      |                      3,240 |                      3,240 | PASS for lab count |

The same release record cites Azure Container Apps execution
`job-a24-search-canon-eus-ac5kk3z`, with `21,967` source rows uploaded and
`mismatches: []`. It also cites runtime/retrieval smoke execution
`job-a24-azure-soak-eus-nmvq83t`, where all six tenants returned three hits for
the Kyriba/treasury query.

This is useful evidence, but it is not enough for final Supabase sunset because
the current gate requires production-cutover proof and golden retrieval answers
for the named tenant set below.

## Required production proof

| Control                      | Required evidence                                                                                                                           | Current status                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Rebuild from Azure Postgres  | Production index rebuild job ID, source Azure database host/name, source row count, index name/version, upload success count, failure count | PARTIAL - lab rebuild evidence exists; production-cutover rebuild evidence not attached |
| Index count parity           | Per-tenant expected Azure source rows equal observed index docs                                                                             | PARTIAL - lab counts pass for six tenants; production proof pending                     |
| No legacy vector fallback    | Runtime env/log proof showing no Pinecone, Supabase, or Neo4j fallback for production retrieval                                             | PARTIAL - lab env removal recorded; production proof pending                            |
| Golden retrieval specificity | Golden questions produce grounded, tenant-specific answers where facts exist                                                                | BLOCKED - not attached                                                                  |
| Generic-answer block         | Any generic answer where loaded facts exist blocks sunset                                                                                   | BLOCKED until golden answers are reviewed                                               |

## Local execution attempt

Captured from branch `cursor/supabase-sunset-proof-96c4` on 2026-06-07 at
`02:24 UTC`.

| Check                    | Result        | Impact                                                                                                            |
| ------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `AZURE_SEARCH_ENDPOINT`  | NOT AVAILABLE | Direct Azure Search count/query proof cannot run from this shell.                                                 |
| `AZURE_SEARCH_ADMIN_KEY` | NOT AVAILABLE | Index rebuild/count proof cannot run from this shell unless managed identity is available in an Azure-hosted job. |
| `AZURE_SEARCH_QUERY_KEY` | NOT AVAILABLE | Query-only golden retrieval proof cannot run from this shell.                                                     |
| Azure CLI (`az`)         | NOT AVAILABLE | Container Apps Search rebuild/soak job logs cannot be queried from this shell.                                    |

No Azure Search/vector mutation was attempted. Production golden retrieval
remains blocked until run from an approved Azure/operator environment.

## 2026-06-07 operator attempt

- Azure CLI was installed and authenticated for subscription `abarva-lab-sub`.
- Existing prior Search rebuild evidence still shows
  `job-a24-search-canon-eus-ac5kk3z` succeeded with `21,967` source rows and no
  count mismatches.
- Fresh rebuild attempt was blocked:
  `Microsoft.App/jobs/start/action` is denied for `job-a24-search-canon-eus`.
- Direct runtime golden retrieval proof was not completed because Container Apps
  exec later hit `429 Too Many Requests` with `retry-after: 600`.

Status remains PARTIAL/BLOCKED for final sunset because the requested fresh
production golden retrieval run across all named tenants was not completed.

## 2026-06-07 candidate image verification

After PR #3240 checks passed and the candidate image was built/deployed,
`job-a24-search-verify-eus-zxesl2t` succeeded on image
`acrabarvalab001.azurecr.io/abarva/web:cutover-pr3240-20260607-7c0f682d-manifestfix`.

Observed document counts:

| Tenant               | Observed docs | Status |
| -------------------- | ------------: | ------ |
| `apex-retail`        |         6,497 | PASS   |
| `first-capital`      |           400 | PASS   |
| `lakeshore-holdings` |         6,576 | PASS   |
| `meridian-health`    |         4,376 | PASS   |
| `northstar-clinical` |           878 | PASS   |
| `skyharbor-air`      |         3,240 | PASS   |

`job-a24-azure-soak-eus-4pn97f4` also ran the Azure Search retriever smoke for
the treasury/Kyriba query and returned three hits for each tenant: Apex,
Meridian, First Capital, Lakeshore, SkyHarbor, and Northstar.

Remaining gap: Morgan Street/Northshore golden retrieval is still not mapped or
captured in this proof pack.

## 2026-06-07 merged-main verification

After PR #3242/#3244 were merged to `main`, image
`acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260607-43839a41` was built
and deployed to Azure Container Apps jobs.

`job-a24-search-verify-eus-v4xv4gp` succeeded and emitted:

```json
{
  "event": "azure_search_backfill_verified",
  "observed": {
    "apex-retail": 6497,
    "first-capital": 400,
    "lakeshore-holdings": 6576,
    "meridian-health": 4376,
    "northstar-clinical": 878,
    "skyharbor-air": 3240
  }
}
```

`job-a24-azure-soak-eus-rtthqal` also ran retrieval smoke and returned three
hits for each of Apex, Meridian, First Capital, Lakeshore, SkyHarbor, and
Northstar.

Remaining gap: Morgan Street/Northshore golden retrieval is still not mapped or
captured in this proof pack.

## Golden retrieval matrix

The following tenant set must be run against the Azure-only production runtime
and/or the same Azure Search index used by production retrieval. Record the
question, expected loaded fact, answer excerpt, citations/chunk IDs, and verdict.

| Tenant / account           | Required golden retrieval result                                                                                                                                | Evidence     | Status  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------- |
| Lakeshore Holdings         | Answers must cite loaded Lakeshore facts, including Kyriba/treasury and AMS modernization context where relevant                                                | Not attached | BLOCKED |
| Meridian Health            | Answers must cite loaded Meridian facts and avoid generic healthcare transformation language when specific facts exist                                          | Not attached | BLOCKED |
| Apex Retail                | Answers must cite loaded Apex Retail facts and preserve tenant scope                                                                                            | Not attached | BLOCKED |
| SkyHarbor Air              | Answers must cite loaded SkyHarbor airline facts and preserve tenant scope                                                                                      | Not attached | BLOCKED |
| Morgan Street / Northshore | Answers must cite the loaded facts for the Morgan Street/Northshore account name used in production; if this maps to an existing tenant key, document the alias | Not attached | BLOCKED |

## Command patterns

Use approved production secrets through Azure secret references or managed
identity. Do not print API keys.

```bash
# Count/query smoke against Azure Search. Extend --tenant for each required key.
npx tsx src/scripts/azure-search-retriever-smoke.ts \
  --tenant lakeshore-holdings \
  --tenant meridian-health \
  --tenant apex-retail \
  --tenant skyharbor-air \
  --tenant <morgan-street-or-northshore-key> \
  --require-results
```

If production retrieval runs through the app/agent rather than direct Search,
capture the app route, authenticated persona, question, answer excerpt, cited
chunks, and logs proving Azure Search was used.

## Acceptance rule

This file can move to PASS only when:

1. Production index document counts match Azure source rows for all required
   tenants.
2. Every golden question returns loaded facts with tenant-specific citations.
3. No answer is generic where loaded facts exist.
4. Logs show no Supabase, Pinecone, or Neo4j fallback for the retrieval window.
