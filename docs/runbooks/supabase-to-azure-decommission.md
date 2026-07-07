# Supabase To Azure Decommission Runbook

Status: migrated, shutdown gated
Owner: AbarVa operators  
Created: 2026-06-06
Last updated: 2026-06-06

## Rule

Do not pause, delete, or close the Supabase account until Azure has parity and the app has run Azure-only without fallback.

Supabase is now a legacy source system to drain. It is not safe to treat it as disposable because it still contains corpus, pattern, graph, and context assets that cost time and money to create.

## Current Evidence

Read-only Azure Container Apps execution `job-supa-drain-sum-eus-axp1kij` ran on 2026-06-06.

It proved:

- Source Supabase host: `aws-1-us-east-2.pooler.supabase.com`
- Target Azure host: `pg-abarva-context-lab-001.postgres.database.azure.com`
- Azure private DNS resolved the target to `10.43.1.4`
- Target database: `abarva_control`

Targeted Azure schema unblock:

- Execution `job-ec-schema-eus-8vwh99b` applied exactly one migration to Azure Postgres:
  `20260514100000_enterprise_context_layer.sql`.
- Execution `job-ec-schema-check-eus-iz7faco` then verified `ok: true` for the
  enterprise context schema on Azure database `abarva_control` at private address
  `10.43.1.4/32`.
- All enterprise context target tables now exist.

Live drain apply:

- Execution `job-supa-natural-eus-h7s7qc0` ran from Azure Container Apps on
  2026-06-06 and succeeded.
- Target database was `abarva_control` as user `abarvaadmin`.
- Target private address was `10.43.1.4/32`.
- The job copied Supabase rows using natural keys where Azure already had
  canonical rows, including client remapping for existing Azure client IDs.
- No Supabase account pause, delete, or production env removal happened in this
  step.

Read-only reconciliation:

- Execution `job-supa-recon-eus-cy73h9i` ran from Azure Container Apps on
  2026-06-06 and succeeded.
- Reconciliation result: `ok: true`, `blockers: []`.
- Source was legacy Supabase Postgres; target was Azure Postgres
  `abarva_control` at private address `10.43.1.4/32`.

Post-migration table truth:

| Table | Supabase rows | Azure rows | Gap | Status |
| --- | ---: | ---: | ---: | --- |
| `clients` | 9 | 9 | 0 | Parity |
| `canonical_industry_ai_patterns` | 312 | 312 | 0 | Parity |
| `foundational_pattern_packs` | 1 | 1 | 0 | Parity |
| `foundational_pattern_variants` | 3 | 3 | 0 | Parity |
| `genome_patterns` | 43,436 | 43,436 | 0 | Parity |
| `knowledge_sources` | 136 | 136 | 0 | Parity |
| `knowledge_chunks` | 0 | 0 | 0 | Parity |
| `intelligence_graph_edges` | 93,743 | 93,743 | 0 | Parity |
| `pattern_packs` | 21 | 21 | 0 | Parity |
| `pattern_match_logs` | 6 | 6 | 0 | Parity |
| `corpus_patterns` | 8,987 | 9,026 | +39 | Azure ahead |
| `corpus_pattern_versions` | 8,987 | 9,026 | +39 | Azure ahead |
| `corpus_pattern_content` | 8,987 | 9,026 | +39 | Azure ahead |
| `corpus_pattern_relationships` | 27,052 | 27,169 | +117 | Azure ahead |
| `corpus_telemetry` | 9,027 | 9,066 | +39 | Azure ahead |
| `enterprise_context_sources` | 13 | 13 | 0 | Parity |
| `enterprise_context_source_files` | 57 | 57 | 0 | Parity |
| `enterprise_context_records` | 3,503 | 3,503 | 0 | Parity |
| `enterprise_context_facts` | 38,640 | 38,640 | 0 | Parity |
| `enterprise_context_relationships` | 820 | 820 | 0 | Parity |
| `enterprise_context_evidence` | 3,503 | 3,503 | 0 | Parity |
| `enterprise_context_template_runs` | 2 | 2 | 0 | Parity |
| `enterprise_context_chunk_queue` | 3,503 | 3,503 | 0 | Parity |
| `enterprise_context_chunks` | 15,847 | 21,967 | +6,120 | Azure ahead |

Zero-row tables also reconciled with parity on both sides:
`emergent_patterns`, `outcome_pattern_feedback`, `corpus_review_state`,
`corpus_overlays`, `client_private_patterns`,
`enterprise_context_quality_issues`, `enterprise_context_stewardship_tasks`,
and `enterprise_context_snapshots`.

## Stages

1. Freeze new Supabase writes. Pending operator confirmation.
2. Run the read-only drain dry-run from Azure Container Apps. Completed with `job-supa-drain-sum-eus-axp1kij`.
3. Apply missing Azure schema for target-missing enterprise context tables. Completed with `job-ec-schema-eus-8vwh99b`.
4. Run the drain apply from Azure-hosted compute only. Completed with `job-supa-natural-eus-h7s7qc0`.
5. Re-run reconciliation until Azure is at parity or intentionally ahead. Completed with `job-supa-recon-eus-cy73h9i`.
6. Rebuild search/vector indexes from Azure. Pending.
7. Remove Supabase env vars from production, preview, Azure, and local operator shells. Pending.
8. Run Azure-only app and retrieval soak. Pending.
9. Take final off-platform backup/export. Pending.
10. Pause Supabase first. Pending.
11. Delete Supabase only after the retention window. Pending.

## Commands

Dry-run after a fresh image contains `scripts/data-plane/drain-supabase-to-azure.ts`:

```bash
az deployment sub create \
  --name az-supabase-drain-dry-run-$(date +%Y%m%d%H%M%S) \
  --location eastus \
  --template-file infra/azure/database-migration-foundation.bicep \
  --parameters infra/azure/parameters/supabase-drain-dry-run.lab.bicepparam

az containerapp job start \
  --resource-group rg-abarva-controlplane-lab-eastus \
  --name job-abarva-supabase-drain-dry-run-eus
```

Apply copy only after dry-run review:

```bash
npx tsx scripts/data-plane/drain-supabase-to-azure.ts --apply
```

The apply command must run inside Azure-hosted compute with:

- `SOURCE_DATABASE_URL`: legacy Supabase Postgres URL
- `TARGET_DATABASE_URL`: Azure Postgres URL

The 2026-06-06 live apply used an Azure Container Apps inline operator job
because the existing ACR image did not yet contain
`scripts/data-plane/drain-supabase-to-azure.ts`. Future runs should prefer the
committed script after a fresh app image is built.

## Shutdown Gate

Supabase can be shut down only when all are true:

- Read-only reconcile shows no Azure-behind required tables.
- Target-missing schema blockers are resolved.
- The app runs with Azure DB envs and no Supabase fallback.
- Search/vector indexes are rebuilt from Azure.
- A final off-platform backup exists.
- Supabase is paused before delete.
