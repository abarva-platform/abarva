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

| Tenant | Expected Azure source rows | Observed Azure Search docs | Status |
| --- | ---: | ---: | --- |
| `apex-retail` | 6,497 | 6,497 | PASS for lab count |
| `first-capital` | 400 | 400 | PASS for lab count |
| `lakeshore-holdings` | 6,576 | 6,576 | PASS for lab count |
| `meridian-health` | 4,376 | 4,376 | PASS for lab count |
| `northstar-clinical` | 878 | 878 | PASS for lab count |
| `skyharbor-air` | 3,240 | 3,240 | PASS for lab count |

The same release record cites Azure Container Apps execution
`job-a24-search-canon-eus-ac5kk3z`, with `21,967` source rows uploaded and
`mismatches: []`. It also cites runtime/retrieval smoke execution
`job-a24-azure-soak-eus-nmvq83t`, where all six tenants returned three hits for
the Kyriba/treasury query.

This is useful evidence, but it is not enough for final Supabase sunset because
the current gate requires production-cutover proof and golden retrieval answers
for the named tenant set below.

## Required production proof

| Control | Required evidence | Current status |
| --- | --- | --- |
| Rebuild from Azure Postgres | Production index rebuild job ID, source Azure database host/name, source row count, index name/version, upload success count, failure count | PARTIAL - lab rebuild evidence exists; production-cutover rebuild evidence not attached |
| Index count parity | Per-tenant expected Azure source rows equal observed index docs | PARTIAL - lab counts pass for six tenants; production proof pending |
| No legacy vector fallback | Runtime env/log proof showing no Pinecone, Supabase, or Neo4j fallback for production retrieval | PARTIAL - lab env removal recorded; production proof pending |
| Golden retrieval specificity | Golden questions produce grounded, tenant-specific answers where facts exist | BLOCKED - not attached |
| Generic-answer block | Any generic answer where loaded facts exist blocks sunset | BLOCKED until golden answers are reviewed |

## Golden retrieval matrix

The following tenant set must be run against the Azure-only production runtime
and/or the same Azure Search index used by production retrieval. Record the
question, expected loaded fact, answer excerpt, citations/chunk IDs, and verdict.

| Tenant / account | Required golden retrieval result | Evidence | Status |
| --- | --- | --- | --- |
| Lakeshore Holdings | Answers must cite loaded Lakeshore facts, including Kyriba/treasury and AMS modernization context where relevant | Not attached | BLOCKED |
| Meridian Health | Answers must cite loaded Meridian facts and avoid generic healthcare transformation language when specific facts exist | Not attached | BLOCKED |
| Apex Retail | Answers must cite loaded Apex Retail facts and preserve tenant scope | Not attached | BLOCKED |
| SkyHarbor Air | Answers must cite loaded SkyHarbor airline facts and preserve tenant scope | Not attached | BLOCKED |
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
