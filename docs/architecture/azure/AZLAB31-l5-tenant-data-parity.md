# AZLAB31 - L5 Tenant Data Parity Gate

Date: 2026-05-15  
Status: wired, manual run  
Layer: L5 data integrity

## Why This Exists

AZLAB29 proves that the schema can replay from zero. That is necessary, but not enough for a credible parallel run. The app also needs the synthetic tenant context layer to be present at useful density for Apex Retail, Meridian Health, and First Capital.

This gate adds a read-only verifier for tenant-level data substance after a copy, restore, or migration event. It answers the founder/auditor question: "Did we really load the profile, KPI, org, graph, source, and move substrate, or did the app just deploy?"

## Artifact

| Artifact | Purpose |
|---|---|
| `src/scripts/verify-azure-tenant-data-parity.ts` | Connects to Azure Postgres through `DATABASE_URL`, counts tenant-scoped rows across context-layer tables, and fails if any tenant falls below the canonical synthetic baseline. |
| `npm run db:azure:verify-data-parity` | Local/manual command for Azure or restored sandbox databases. |
| `.github/workflows/azure-l5-data-parity.yml` | Manual GitHub Actions gate. Uses `AZURE_LAB_DATABASE_URL` and uploads the JSON report. |

## Metrics Checked

| Metric | Tables | Why it matters |
|---|---|---|
| Client row | `clients` | Tenant identity can resolve. |
| Data inventory segments | `data_inventory_segments` | The 14-pack setup/content map is present. |
| Data inventory records | `data_inventory_records` | The loaded dataset has enough profile/KPI/org/vendor/system detail. |
| Context chunks | `enterprise_context_chunks` | Agent retrieval has enough tenant-grounded material. |
| Graph nodes | `enterprise_graph_nodes` | Relationship/entity substrate exists. |
| Graph edges | `enterprise_graph_edges` | Traversal substrate exists. |
| Source events | `source_events` | Source module has live sourcing context. |
| Engagements | `engagements` | Moves/program surfaces have active work to render. |
| KPIs | `kpis` | Sentinel/Tower can cite named business pressure metrics. |
| Pattern packs | `pattern_packs` | Intelligence can rank and cite tenant-specific pattern IDs. |

## Canonical Synthetic Minimums

These are minimum thresholds, not exact counts. They are intentionally below the current synthetic baseline so the gate catches empty/partial loads without failing on harmless extra rows.

| Tenant | Segments | Records | Chunks | Graph nodes | Graph edges | Source events | Engagements | KPIs | Pattern packs |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Apex Retail | 14 | 400 | 900 | 250 | 300 | 5 | 3 | 3 | 3 |
| Meridian Health | 14 | 700 | 800 | 400 | 600 | 8 | 3 | 3 | 3 |
| First Capital | 14 | 300 | 800 | 200 | 200 | 5 | 2 | 3 | 3 |

## How To Run

Local/manual against whichever database `DATABASE_URL` points to:

```bash
npm run db:azure:verify-data-parity
npm run db:azure:verify-data-parity -- --tenant apex-retail
npm run db:azure:verify-data-parity -- --json
```

GitHub Actions:

```bash
gh workflow run azure-l5-data-parity.yml
gh workflow run azure-l5-data-parity.yml -f tenant=first-capital
```

## Expected Output

```json
{
  "status": "pass",
  "results": [
    {
      "tenantKey": "apex-retail",
      "status": "pass",
      "metrics": {
        "contextChunks": { "value": 2075, "minimum": 900, "status": "pass" }
      }
    }
  ]
}
```

## Operating Rule

Run this gate after:

- `db:azure:copy-tenant-context`
- a restored Azure Postgres PITR sandbox
- any tenant-key canonicalization migration
- any broker/index rebuild that depends on `enterprise_context_chunks` or `enterprise_graph_*`

It is read-only and safe to run repeatedly.
