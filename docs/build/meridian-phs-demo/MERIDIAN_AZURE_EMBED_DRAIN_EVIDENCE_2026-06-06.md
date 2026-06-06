# Meridian/PHS Azure Embedding Drain Evidence — 2026-06-06

## Status

`complete` — independently re-verified against Azure Log Analytics on 2026-06-06.

## Plain-English Result

Meridian/PHS context embeddings are drained in Azure Postgres: **873 embedded,
0 pending, 0 failed**. The earlier state was 320 embedded with 553 newly loaded
chunks pending; the Azure Container Apps embedding drain completed those 553 and
a follow-up verification run found nothing left to process.

> Treat all Meridian/PHS data as **synthetic, inspired-by pilot context** — not
> real confidential PHS data.

## Verification Method (how this file is grounded)

The embedding work ran on a private worker **inside the Azure VNet** (the private
Azure Postgres is not reachable from outside the VNet, including Cursor Cloud —
its private FQDN does not resolve publicly). The authoritative evidence is the
worker's console output captured in **Azure Log Analytics workspace
`log-abarva-observability-lab-eastus`** (customerId `03910a48-...`), table
`ContainerAppConsoleLogs_CL`, signature `ABARVA_PHS_MERIDIAN_EMBED_DRAIN_RESULT`.

## Azure Execution

| Item                   | Value                                                                        |
| ---------------------- | ---------------------------------------------------------------------------- |
| Azure job              | `job-phs-meridian-embed-0606`                                                |
| Drain execution        | `job-phs-meridian-embed-0606-zbxby67` (ran 2026-06-06 15:51:47→15:52:06 UTC) |
| Verification execution | `job-phs-meridian-embed-0606-9u3e0za` (ran 2026-06-06 15:53:09 UTC)          |
| Earlier failed attempt | `job-phs-meridian-embed-0606-pxx2igr` (15:50 UTC, `embed.js:16` crash)       |
| Azure Postgres host    | `pg-abarva-context-lab-001.postgres.database.azure.com`                      |
| Database               | `abarva_control`                                                             |
| Server address         | `10.43.1.4/32` (private endpoint)                                            |
| Tenant key             | `meridian-health`                                                            |
| Embedding model        | `text-embedding-3-small`                                                     |
| Embedding dimension    | `1536`                                                                       |

## Drain Result (execution `zbxby67`)

| Measure               | Before | After |
| --------------------- | -----: | ----: |
| Total Meridian chunks |    873 |   873 |
| Embedded chunks       |    320 |   873 |
| Pending chunks        |    553 |     0 |
| Failed chunks         |      0 |     0 |
| Vectors present       |    320 |   873 |

Run details:

| Measure                    |     Value |
| -------------------------- | --------: |
| Batches                    |        23 |
| Newly embedded             |       553 |
| Failed                     |         0 |
| Truncated embedding inputs |       218 |
| Tokens used                | 1,754,781 |

Note: truncated embedding inputs affect only the text sent to the embedding model
for oversized chunks. The full chunk text remains intact in Azure Postgres.

## Verification Result (execution `9u3e0za`)

| Measure                    | Value |
| -------------------------- | ----: |
| Batches                    |     0 |
| Newly embedded             |     0 |
| Failed                     |     0 |
| Tokens used                |     0 |
| Pending after verification |     0 |

## Final Coverage By Segment

| Segment              | Chunks | Embedded | Pending | Failed |
| -------------------- | -----: | -------: | ------: | -----: |
| `program_inventory`  |    340 |      340 |       0 |      0 |
| `it_landscape`       |    185 |      185 |       0 |      0 |
| `enterprise_profile` |    171 |      171 |       0 |      0 |
| `it_financials`      |    109 |      109 |       0 |      0 |
| `org_structure`      |     68 |       68 |       0 |      0 |

## Independent Corroboration (other in-VNet jobs, same day)

- `job-phs-meridian-load2-0606` (14:56 UTC) logged `after: total 873,
embedded 320, pending 553` — confirms the drain's "before" baseline.
- `job-phs-meridian-diag-0606` (15:06) and `job-phs-meridian-patch-0606` (15:09)
  both report `db_chunks: 873` in Postgres (these jobs concern the Azure AI
  Search index, separate from pgvector embeddings).

## Known Caveats (recorded for audit honesty)

1. The `job-phs-meridian-embed-0606` Azure **job resource was deleted after the
   run** (cleanup). `az containerapp job show` returns `ResourceNotFound` and it
   is absent from the live job list. Its console output persists in Log Analytics
   (the source verified here).
2. A **failed first attempt** (`pxx2igr`) preceded the successful drain. The end
   state is unaffected.
3. This is the worker's self-reported result captured in telemetry — it is not an
   independent live re-read of Postgres, which is impossible from outside the VNet.
   An independent re-read requires dispatching a query job via the Container Apps
   private-worker path.

## Remaining QA

The data-plane state is ready for signed-in product validation (requires the live
app with Clerk + Azure data-plane reachability — see
`wow-demo/KNOWN_GAPS.md` for the Cursor Cloud blocker):

1. Admin Context Layer should show Meridian at `873 embedded`, `0 pending`, `0 failed`.
2. Intelligence Enterprise Context should no longer claim the tenant context is unloaded.
3. Sentinel/Nexus hard-question QA should be run against Meridian/PHS and cite Azure-loaded context.
