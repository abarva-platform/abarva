# SkyHarbor Reality Build — Before State

Created: 2026-06-05

## Executive Summary

SkyHarbor has strong repo-backed substrate assets, but this pass did not prove live Azure/Postgres load state. The loader dry-run works and identifies the exact data it would load. The read-only database audit could not connect from this environment because the configured Azure Postgres host did not resolve.

Current truth: SkyHarbor is dataset-ready and loader-dry-run-ready, but not yet proven as admin-loader/live-data-plane-real.

## What Was Verified Locally

| Check | Result |
|---|---:|
| Dataset root exists | `datasets/skyharbor-air-synthetic-v1` |
| Tenant key used by loader | `skyharbor-air` |
| Client id used by loader | `6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301` |
| Source files found by loader | 1 |
| Main context chunks | 480 |
| Airline overlay chunks | 2,760 |
| Total chunks dry-run would upsert | 3,240 |
| Applications dry-run would insert | 92 |
| AI initiatives dry-run would upsert | 38 |
| Vendor contracts dry-run would upsert | 52 |
| Embedding behavior | Loader would embed via AI Egress on non-dry-run |

Command run:

```bash
TENANT_KEY=skyharbor node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --dry-run --skip-embeddings
```

Key output:

```text
Packet 24 Substrate Loader · tenant=skyharbor · DRY-RUN
client_id:  6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301
tenant_key: skyharbor-air
dataset:    datasets/skyharbor-air-synthetic-v1
Found 480 chunks in 13-context/client-data-corpus.jsonl
Found 2760 chunks in 16-industry-pattern-overlay/airline-industry-pattern-chunks.jsonl
Found 3240 chunks total
Found 92 apps
Found 38 initiatives
Found 52 vendor contracts
```

## Live Data Plane Check

Command run:

```bash
node scripts/audit/db-substrate-audit.mjs
```

Result:

```text
Postgres connection failed: getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com
```

Interpretation: this environment loaded `.env.local`, but DNS/network could not resolve the configured Azure Postgres host. No live database count should be inferred from this failure.

## Existing SkyHarbor Source Material

| Asset | File |
|---|---|
| SkyHarbor pipeline wrapper | `scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs` |
| Shared tenant substrate loader | `scripts/seed/load-tenant-substrate.ts` |
| Engineering productivity brief | `datasets/skyharbor-air-synthetic-v1/briefs/engineering_productivity.brief.md` |
| AI SDLC brief | `datasets/skyharbor-air-synthetic-v1/briefs/ai_sdlc_opportunity.brief.md` |
| Vendor portfolio records | `datasets/skyharbor-air-synthetic-v1/records/json/vendor_portfolio.json` |
| Sourcing pipeline records | `datasets/skyharbor-air-synthetic-v1/records/json/sourcing_pipeline.json` |
| Airline overlay verification | `datasets/skyharbor-air-synthetic-v1/verification/airline_pattern_overlay_report.md` |

## Current Evidence Gap

Do not claim these until separately proven:

- SkyHarbor files loaded through the setup/admin loader.
- SkyHarbor chunks exist in Azure/Postgres.
- SkyHarbor embeddings completed.
- SkyHarbor source files appear in admin context-layer UI.
- SkyHarbor Moves exist as saved records.
- SkyHarbor Source events exist as saved records.
- SkyHarbor generated artifacts are persisted and retrievable.
- KK/CTO login is tenant-isolated to SkyHarbor.

## Recommended Next Step

Once database access resolves, run a read-only count first:

```sql
select count(*) from clients where id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
select count(*) from enterprise_context_chunks where tenant_key = 'skyharbor-air';
select count(*) from enterprise_context_source_files where tenant_key = 'skyharbor-air';
select count(*) from applications where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
select count(*) from ai_initiatives where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
select count(*) from vendor_contracts where client_id = '6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301';
```

Then, only if counts are missing or stale, run the loader intentionally:

```bash
TENANT_KEY=skyharbor node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --skip-embeddings
TENANT_KEY=skyharbor node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --only-chunks
```

After load, capture admin context-layer screenshots and create persisted Moves/Source artifacts before producing the KK primer.
