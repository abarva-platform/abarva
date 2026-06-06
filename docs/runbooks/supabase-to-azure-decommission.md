# Supabase To Azure Decommission Runbook

Status: active  
Owner: AbarVa operators  
Created: 2026-06-06

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

Key gaps:

| Table | Supabase rows | Azure rows | Gap | Status |
| --- | ---: | ---: | ---: | --- |
| `genome_patterns` | 43,436 | 52 | 43,384 | Azure behind |
| `intelligence_graph_edges` | 93,743 | 268 | 93,475 | Azure behind |
| `corpus_patterns` | 8,987 | 39 | 8,948 | Azure behind |
| `corpus_pattern_versions` | 8,987 | 39 | 8,948 | Azure behind |
| `corpus_pattern_content` | 8,987 | 39 | 8,948 | Azure behind |
| `corpus_pattern_relationships` | 27,052 | 117 | 26,935 | Azure behind |
| `corpus_telemetry` | 9,027 | 39 | 8,988 | Azure behind |
| `knowledge_sources` | 136 | 20 | 116 | Azure behind |
| `enterprise_context_records` | 3,503 | missing | n/a | Target missing |
| `enterprise_context_facts` | 38,640 | missing | n/a | Target missing |
| `enterprise_context_evidence` | 3,503 | missing | n/a | Target missing |
| `enterprise_context_chunks` | 15,847 | 9,360 | 6,487 | Azure behind |

Tables already at parity in the compact check:

- `knowledge_chunks`: 0 / 0
- `pattern_packs`: 21 / 21

## Stages

1. Freeze new Supabase writes.
2. Run the read-only drain dry-run from Azure Container Apps.
3. Apply missing Azure schema for target-missing enterprise context tables.
4. Run the drain with `--apply` from Azure-hosted compute only.
5. Re-run reconciliation until Azure is at parity or intentionally ahead.
6. Rebuild search/vector indexes from Azure.
7. Remove Supabase env vars from production, preview, Azure, and local operator shells.
8. Run Azure-only soak.
9. Pause Supabase first.
10. Delete Supabase only after the retention window.

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

## Shutdown Gate

Supabase can be shut down only when all are true:

- Read-only reconcile shows no Azure-behind required tables.
- Target-missing schema blockers are resolved.
- The app runs with Azure DB envs and no Supabase fallback.
- Search/vector indexes are rebuilt from Azure.
- A final off-platform backup exists.
- Supabase is paused before delete.
