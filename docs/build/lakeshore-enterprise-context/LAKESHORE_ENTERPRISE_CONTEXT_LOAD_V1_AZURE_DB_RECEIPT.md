# LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1 — Azure Postgres Receipt

**State: DB-COMMITTED — VERIFIED.** Parsed context chunks are committed to the native Azure
Postgres control-plane database and independently re-queried.

## Database target

| Field      | Value                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------- |
| Server     | `pg-abarva-context-lab-001.postgres.database.azure.com`                                      |
| Database   | `abarva_control`                                                                             |
| Table      | `enterprise_context_chunks` (+ audit row in `data_ingestion_runs`)                           |
| Tenant key | `lakeshore-holdings`                                                                         |
| Client ID  | `49fc8aee-3d39-48c5-82ac-1313c31470c7` (existing `clients` row)                              |
| Connection | KV-backed secret `azure-postgres-control-database-url` (kv-abarva-lab-001), resolved by UAMI |
| Network    | private endpoint; written from inside the VNet Container App                                 |

> No fallback `DATABASE_URL`, no Supabase pooler, no local DB writes were used. The connection
> string is a Key Vault secret resolved by the Container Apps managed identity inside the Azure
> network — the approved native Azure data plane.

## Commit result (live)

| Metric                            | Value                                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Chunks committed                  | **5,247**                                                                                                |
| Distinct source files represented | **133 / 133**                                                                                            |
| Embedding status `embedded`       | **5,247**                                                                                                |
| Embedding model / dim             | `text-embedding-3-small` / **1536**                                                                      |
| `data_ingestion_runs` audit row   | inserted (`source_label=LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1`, `chunks_loaded=5247`, `status=completed`) |
| Idempotency                       | load deletes prior `chunk_id LIKE 'LAKESHORE_ENTERPRISE_CONTEXT_LOAD_V1::%'` then re-inserts             |

## Chunks by context domain (from DB `group by chunk_metadata->>'context_domain'`)

| context_domain               | chunks    |
| ---------------------------- | --------- |
| servicenow_support_workload  | 3,051     |
| data_analytics_reporting     | 575       |
| risk_controls_responsible_ai | 374       |
| vendors_contracts_source     | 312       |
| it_systems_architecture      | 267       |
| treasury_kyriba              | 161       |
| ai_use_cases_moves           | 150       |
| org_decision_rights          | 116       |
| strategy_initiatives         | 95        |
| finance_performance          | 65        |
| enterprise_profile           | 47        |
| manifest                     | 19        |
| operations_business_process  | 15        |
| **Total**                    | **5,247** |

## Chunks by source system (from DB `provenance->>'source_system'`)

ServiceNow ITSM 3,051 · Power BI 426 · Coupa 321 · GRC 289 · Kyriba TMS 196 · Snowflake 173 ·
AbarVa 148 · ServiceNow CMDB 142 · Corporate Strategy 131 · Workday HCM 87 · SAP PI/PO 80 · Sentinel 29 · …

## Chunks by source file type

xlsx 2,100 · csv 1,816 · jsonl 1,200 · svg 79 · docx 24 · pdf 20 · md 8

## Independent verification (separate read-only query, post-load)

```json
{ "total": 5247, "embedded": 5247, "distinct_files": 133, "avg_dim": 1536 }
```

Each chunk row carries `tenant_key`, `client_id`, `chunk_id`, `source_segment_id`, `source_path`,
`chunk_text`, `token_count`, `embedding` (jsonb 1536-d), `embedding_status`, and JSONB
`provenance` (load id, blob container/path, source system/owner/date, sha256) +
`chunk_metadata` (context_domain, sensitivity, synthetic flag, evidence_usable, loader_route).

Raw run evidence: `azure-load-receipts/LAKESHORE_LOAD_RESULT_2026-06-06.json` and
`azure-load-receipts/LAKESHORE_VERIFY_2026-06-06.json`.
