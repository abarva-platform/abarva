# SkyHarbor Reset/Load Pass - 01 Current State Inventory

Created: 2026-06-06
Branch/worktree: `codex/skyharbor-reset-load-proof` in `/private/tmp/abarva-skyharbor-reset-load`

## Executive Truth State

This pass reached the required pre-delete inventory gate, but the live Azure/Postgres data plane is not reachable from this local runtime. Because the user instruction says to stop before delete/load if DB access fails, no destructive operation was performed.

## Runtime And Repo State

| Item | Value |
|---|---|
| Canonical repo | `https://github.com/abarva-platform/abarva` |
| Base after refresh | `origin/main` at `1ff24e975f4d7be3a0726e1654f884619d23559f` |
| Worktree | `/private/tmp/abarva-skyharbor-reset-load` |
| Branch | `codex/skyharbor-reset-load-proof` |
| Loader invocation key | `TENANT_KEY=skyharbor` |
| Canonical tenant key | `skyharbor-air` |
| Canonical client id | `6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301` |

## Azure/Postgres Reachability

The loader resolves `ABARVA_AZURE_DATABASE_URL` before `DATABASE_URL`. The local environment currently has:

| Env var | Presence | Host observed | Use in this lane |
|---|---|---|---|
| `ABARVA_AZURE_DATABASE_URL` | present | `pg-abarva-context-lab-001.postgres.database.azure.com` | intended Azure/Postgres data plane |
| `DATABASE_URL` | present | `aws-1-us-east-2.pooler.supabase.com` | legacy/compatibility residue; not used for this Azure lane |

Connection probe result:

```json
{
  "ok": false,
  "host": "pg-abarva-context-lab-001.postgres.database.azure.com",
  "error": "getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com"
}
```

Interpretation: the private Azure/Postgres host did not resolve from this runtime. No live DB counts below should be inferred.

## Live DB Inventory

| Category/table | SkyHarbor scope key | Live count | Sample IDs | Status |
|---|---|---:|---|---|
| `clients` | `id = 6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301` | unknown | unknown | blocked by DB DNS |
| `enterprise_context_source_files` | `tenant_key = skyharbor-air` | unknown | unknown | blocked by DB DNS |
| `enterprise_context_chunks` | `tenant_key = skyharbor-air` | unknown | unknown | blocked by DB DNS |
| `applications` | `client_id = 6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301` | unknown | unknown | blocked by DB DNS |
| `ai_initiatives` | `client_id = 6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301` | unknown | unknown | blocked by DB DNS |
| `vendor_contracts` | `client_id = 6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301` | unknown | unknown | blocked by DB DNS |
| `source_events` | `client_key = skyharbor-air` or proven client FK | unknown | unknown | blocked by DB DNS |
| `source_artifacts` | `tenant_key = skyharbor-air` or proven event FK | unknown | unknown | blocked by DB DNS |
| Moves/engagement records | `client_id = 6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301` | unknown | unknown | blocked by DB DNS |
| Generated deliverables/docs | proven SkyHarbor FK/path | unknown | unknown | blocked by DB DNS |
| Object storage references | proven SkyHarbor metadata/path | unknown | unknown | blocked by DB DNS |

## Local Dataset Inventory

These are repo-backed files, not proof of live persistence.

| Local object | Count | Sample IDs/details |
|---|---:|---|
| Dataset files under `datasets/skyharbor-air-synthetic-v1` | 130 | includes briefs, records, source uploads, templates, graph, chunks, verification |
| Source files under `13-context/source-files` | 1 | `SHA-SRC-METHODOLOGY.md` |
| Main context chunks | 480 | `SHA-CHUNK-0001`, `SHA-CHUNK-0002`, `SHA-CHUNK-0003`, `SHA-CHUNK-0004`, `SHA-CHUNK-0005` |
| Airline overlay chunks | 2,760 | `SHA-AIR-PATTERN-CHUNK-AIR-A-001-01` through overlay corpus |
| Applications CSV rows | 92 | `SHA-Z-001` Passenger Name Record Core; `SHA-Z-002` Ticketing Exchange Engine; `SHA-Z-003` Departure Control Closeout |
| Active initiatives CSV rows | 38 | `SHA-INIT-001` AI-Powered SDLC Modernization Factory; `SHA-INIT-002` IROps Recovery Decision Engine |
| Closed initiatives CSV rows | 0 | CSV has header plus no closed rows |
| Vendor contracts CSV rows | 52 | `SHA-VEND-001` IBM; `SHA-VEND-002` AWS; `SHA-VEND-003` Salesforce |
| Vendor portfolio JSON | 52 records | `datasets/skyharbor-air-synthetic-v1/records/json/vendor_portfolio.json` |
| Sourcing pipeline JSON | 32 records | `datasets/skyharbor-air-synthetic-v1/records/json/sourcing_pipeline.json` |
| Source upload exemplars | 16 files | AWS inventory, IBM SOW summary, DORA baseline, sourcing pipeline, vendor calendar |
| Local SkyHarbor/Delta/proof docs and audit artifacts | 352 matching files | docs, reports, audit artifacts, dataset assets |

## Local SkyHarbor Docs/Artifacts That Could Be Mistaken For Proof

These local artifacts are useful method evidence, but they are not proof of current loader-backed live product state:

| Path family | Meaning |
|---|---|
| `docs/build/delta-pilot/` | Packet 28/29/30 and Delta/SkyHarbor demo docs |
| `docs/skyharbor/` | architecture, adoption guide, Azure private load runbook, FAQ |
| `audit-artifacts/comprehensive-crawl-2026-05-30/skyharbor-air/` | historical crawl evidence, not current reset evidence |
| `datasets/skyharbor-air-synthetic-v1/azure_load_artifacts/` | historical load artifacts bundled with dataset, not current DB verification |
| `datasets/skyharbor-air-synthetic-v1/verification/` | local substrate quality reports, not current live data-plane proof |

## Loader Contract Observed

| Loader phase | Target | Current behavior |
|---|---|---|
| Phase 0 | `clients` | updates/inserts SkyHarbor client profile |
| Phase 1 | `enterprise_context_source_files` | dry-run counts 1; non-dry-run currently skips direct insert because `source_id` FK requires parent rows, preserving provenance at chunk level |
| Phase 2 | `enterprise_context_chunks` + `ai_egress_audit` | deletes existing chunks by `client_id`, inserts chunks, embeds pending chunks |
| Phase 3 | `applications` | deletes `client_id + is_demo_data = true`, inserts apps |
| Phase 4 | `ai_initiatives` | upserts initiatives |
| Phase 5 | `vendor_contracts` | upserts vendor contracts |

Important loader note: `--skip-embeddings` is forwarded by the wrapper but is not currently parsed by `scripts/seed/load-tenant-substrate.ts`. In dry-run it is harmless because embeddings are not performed; in a real run it should not be assumed to suppress embeddings.

## Inventory Verdict

HOLD for live reset/load. The local substrate is intact and dry-run-compatible, but live DB inventory could not be performed. No delete, load, Moves/Source proof creation, or buyer proof should be claimed from this pass.
