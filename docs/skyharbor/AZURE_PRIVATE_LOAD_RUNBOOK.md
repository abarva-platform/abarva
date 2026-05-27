# SkyHarbor Azure Private Load Runbook

## Purpose

This runbook is the operational answer to "how did you load the SkyHarbor context layer, and can our team reuse the same process?" It loads the generated SkyHarbor records, source files, chunks, embeddings, application portfolio, initiatives, and vendor contracts into the Azure private data lane.

## Inputs

- Dataset root: `datasets/skyharbor-air-synthetic-v1/`
- Loader wrapper: `scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs`
- Shared loader: `scripts/seed/load-tenant-substrate.ts`
- Verification:
  - `node scripts/skyharbor/verify-skyharbor-substrate.mjs`
  - `node scripts/skyharbor/verify-airline-pattern-overlay.mjs`

## Required Environment

Run from a host with private network access to the Azure PostgreSQL Flexible Server.

```bash
export ABARVA_AZURE_DATABASE_URL='postgres://...'
export AZURE_OPENAI_EMBEDDING_ENDPOINT='https://...'
export AZURE_OPENAI_EMBEDDING_KEY='...'
export AZURE_OPENAI_EMBEDDING_DEPLOYMENT='text-embedding-3-large'
```

If Azure OpenAI embedding variables are absent, the shared loader falls back to `OPENAI_API_KEY`, then deterministic local embeddings for dry runs.

## Preflight

```bash
node scripts/skyharbor/verify-skyharbor-substrate.mjs
node scripts/skyharbor/verify-airline-pattern-overlay.mjs
node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --dry-run
```

Expected: substrate and overlay verifiers pass; dry run reports SkyHarbor source files, chunks, applications, initiatives, and vendor contracts without writing rows.

## Apply Load

```bash
node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --concurrency=8
```

For a chunks-only refresh after pattern-overlay edits:

```bash
node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --only-chunks --concurrency=8
```

## Post-Load Verification

```bash
node scripts/audit/db-substrate-audit.mjs --tenant=skyharbor
node scripts/skyharbor/stages/06_load_to_azure/rls_verification.mjs
node scripts/skyharbor/stages/07_verify/fact_fingerprint_check.mjs
node scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs
```

Go/no-go thresholds:

- SkyHarbor enterprise context chunks include the 480 tenant facts plus 2,760 airline industry patterns.
- Application, initiative, and vendor-contract tables are populated for `skyharbor`.
- Cross-tenant RLS checks return zero SkyHarbor rows when queried as another tenant.
- Ground-truth verification answers the CTO Tier-1 set with citations.

## Audit Artifacts

Save command output to:

- `datasets/skyharbor-air-synthetic-v1/azure_load_artifacts/azure_load_log.txt`
- `datasets/skyharbor-air-synthetic-v1/azure_load_artifacts/rls_verification.txt`
- `datasets/skyharbor-air-synthetic-v1/azure_load_artifacts/ai_egress_audit_baseline.csv`

## Customer Reuse Pattern

To use this process with a real airline data slice, replace the synthetic source files in `datasets/skyharbor-air-synthetic-v1/source_uploads/` with approved customer exports, regenerate records/chunks through `scripts/skyharbor/`, run the same loader, and keep the same verification gates.
