# FOUNDATION-FIX-1 Diagnosis — P18 Retrieval Wiring

Generated: 2026-05-24
Worktree: `/tmp/nexus-ff1`
Branch: `feat/fix-p18-retrieval-wiring`

## Summary

Break points found:

1. **B — AgentContextBroker contract not extended to surface P18 chunk-only data.**
   `buildEnterpriseAgentContextBundleAsync('apexretail')` normalized neither the Apex alias nor chunk-only persisted data. `hasPersistedData()` only checked `data_inventory_segments`, but P18 Apex data is present as `enterprise_context_chunks` under `tenant_key='apex-retail'`.
2. **C — Sentinel reasoning queried normalized app tables by the runtime UUID only and did not use P18 chunk records.**
   The normalized `application_portfolio` table currently has 100 older rows for Apex, while the P18 120-app pack lives in `enterprise_context_chunks.application_portfolio`.
3. **D — Source Apex adapter filtered only legacy setup-data segments.**
   It loaded `data_inventory_records` plus a fixed segment list that did not include P18 segments (`application_portfolio`, `initiative_financials`, `regulatory_and_dependency_context`, `vendor_contract`, `sponsor_signal`). That produced the exact audit fallback: “current-state inventory records are unavailable” and “enterprise context chunks are unavailable.”

## Diagnostic Query Results

Connection used by app/runtime: `.env.local DATABASE_URL` (Supabase pooler). `TARGET_DATABASE_URL` / `AZURE_LAB_DATABASE_URL` host did not resolve from this machine during diagnosis.

### Query 1

Requested:

```sql
SELECT count(*)
FROM application_portfolio
WHERE client_id = 'apexretail';
```

Actual: `0`

Alias check:

```text
clients: bb8ed961-a049-4d0c-a38f-f8912138fceb | apex-retail | apex-retail | Apex Retail
application_portfolio where client_id::text in aliases:
  bb8ed961-a049-4d0c-a38f-f8912138fceb | 100
```

Interpretation: normalized app rows are keyed by the Apex UUID, not `apexretail`. The P18 120-app corpus is not in this normalized table on the current runtime DB; it is present as context chunks.

### Query 2

Requested:

```sql
SELECT count(*)
FROM ai_initiatives
WHERE client_id = 'apexretail';
```

Actual: `0`

Alias/schema check:

```text
ai_initiatives.status column: does not exist
ai_initiatives rows keyed by UUID: present
sample: AR-01 Store Associate Copilot...
```

P18 initiative facts are present in context chunks:

```text
INIT-SAP-ERP-FUTURE ... HOLD
INIT-CDP-MIGRATION-PH2 ... RESTRUCTURE
INIT-O9-COMPLETION ... RESTRUCTURE
INIT-LOYALTY-REPLACEMENT ... KILL
INIT-MAINFRAME-MOD-ASSESS ... KILL
INIT-AS400-SUNSET ... KILL
```

Interpretation: current normalized `ai_initiatives` schema is older than the P18 packet shape; P18 initiative ids are retrievable from `enterprise_context_chunks.source_segment_id='initiative_financials'`.

### Query 3

Requested: invoke `buildEnterpriseAgentContextBundle('apexretail')` / inspect broker output.

Static and runtime diagnosis:

- Sync broker is explicitly fixture-only by contract.
- Async broker used `getEnterpriseDataRoom(request.tenantKey)` directly. For `apexretail`, the fixture key is `apex-retail`; without alias normalization, this can return an unknown/fixture-mismatched bundle.
- Async broker delegated persisted detection to `TenantDataAdapter.hasPersistedData()`, which checked only `data_inventory_segments`. Current DB has no Apex `data_inventory_segments` rows, but has 280 Apex P18 `enterprise_context_chunks`.
- Async broker selected only legacy tenant-data segments and did not fetch P18 chunk segments.

Actual P18 chunks:

```text
enterprise_context_chunks tenant_key='apex-retail':
  application_portfolio | 120
  regulatory_and_dependency_context | 80
  initiative_financials | 30
  sponsor_signal | 30
  vendor_contract | 20
```

Break point: **B**.

### Query 4

Requested: inspect Source tenant-context fetch path.

Source path:

```text
src/app/api/v1/source/[eventId]/nexus/ask/route.ts
  -> loadApexRetailSourceIntelligence()
  -> buildApexRetailSourceContextAssemblyInput()
  -> src/lib/source/adapters/apex-retail-adapter.ts
```

Pre-fix behavior:

- `loadApexRetailInventoryRecords()` queried `data_inventory_records` for `tenant_key='apex-retail'`; actual rows: `0`.
- `loadApexRetailContextChunks()` queried `enterprise_context_chunks`, but filtered to the legacy `APEX_RETAIL_DATA_SEGMENTS` list. That list omitted the P18 segment ids, so it returned `0` chunks even though 280 chunks exist.

Break point: **D**.

## Data Samples Confirming P18 Is Present

Application chunk:

```text
APX-AS400-MERCH is a as400 application owned by TEAM-MAINFRAME-LEGACY with annual run cost $2700000 and TIME classification eliminate. Notes: KILL CANDIDATE...
```

Initiative chunks:

```text
INIT-LOYALTY-REPLACEMENT ... Sentinel posture is KILL.
INIT-MAINFRAME-MOD-ASSESS ... Sentinel posture is KILL.
INIT-AS400-SUNSET ... Sentinel posture is KILL.
```

Wipro vendor chunk:

```text
vendor_contract|Wipro|Wipro contract type AMS has annual spend $32000000 and renewal date 2027-03-31...
```

AS-400 blocker topology from checked-in P18 topology file:

```text
EDGE-013 APX-AS400-MERCH -> APX-STERLING-OMS
EDGE-014 APX-AS400-MERCH -> APX-COMMERCE-CLOUD
EDGE-015 APX-AS400-MERCH -> APX-PRICING-SVC
EDGE-016 APX-AS400-MERCH -> APX-DATABRICKS
```

## Fix Direction

- Normalize `apexretail` to `apex-retail` in the broker path.
- Treat tenant context chunks as persisted data when `data_inventory_segments` is empty.
- Extend broker persisted selection to fetch P18 chunk segments for Sentinel/Intelligence.
- Extend Source Apex adapter segment list to include P18 chunk segments.
- Resolve Sentinel client id aliases to the UUID for normalized tables while reading P18 chunks by tenant key.
- Emit concrete APX / INIT / EDGE identifiers in deterministic Sentinel and Source prose.
