# SkyHarbor Source v4 Lab Canary Load and Answer Baseline

## Purpose

This runbook prepares the Source v4 synthetic sourcing-depth package for a lab-only canary load and question baseline.

It is intentionally isolated from the existing v3 Source foundation:

- Raw package rows land in `raw_source_v4`.
- Canary semantic projections land in `consumption_v4_canary`.
- Existing `source.*`, `raw_enterprise_it.*`, `raw_data_analytics.*`, `raw_cloud_hybrid.*`, and `consumption.*` objects are not overwritten.
- Production is not a target for this loader.

## Source Package

Default package:

`/Users/anand/Downloads/SkyHarbor_Source_V4_Synthetic_System_Extracts_20260804T012431Z.zip`

Expected package fingerprint:

`ff9823b96a01f642674bfe1f26aa168025d7a1e8ba5ebcce8925c5491054d695`

Expected manifest values:

- `dataset_id`: `skyharbor-source-v4-202608`
- `dataset_version`: `v4`
- `tenant_key`: `skyharbor_global`
- CSV files: `10`
- CSV rows: `195,960`
- Contracts: `100`
- Vendors: `60`
- Annual contract value: `$1.4805B`

## Commands

Dry-run the canary load plan:

```bash
npm run source:v4:lab-canary:plan
```

Apply to a lab database only:

```bash
SOURCE_CONTEXT_DATABASE_URL="postgres://..." npm run source:v4:lab-canary:apply
```

The apply command accepts the first available database URL from:

- `SOURCE_CONTEXT_DATABASE_URL`
- `AZURE_LAB_DATABASE_URL`
- `LAB_DATABASE_URL`
- `ABARVA_AZURE_DATABASE_URL`
- `AZURE_DATABASE_URL`
- `DATABASE_URL`

Run the offline question baseline:

```bash
npm run source:v4:canary-answer-baseline -- --out /Users/anand/Downloads/SkyHarbor_Source_V4_Canary_Answer_Baseline.json
```

Run the full operator-safe job locally in plan-only mode:

```bash
npm run source:v4:lab-canary:job -- --plan-only --out-dir /tmp/skyharbor-source-v4-lab-canary
```

Run the full lab job in apply mode:

```bash
npm run source:v4:lab-canary:job -- --out-dir /tmp/skyharbor-source-v4-lab-canary
```

The job script is designed for ACA operator execution. It generates the deterministic package inside the container, validates row depth, applies the loader, runs the 150-question baseline, performs a direct database readback, and emits a proof bundle marker that `scripts/ops/submit-aca-operator-job.mjs` can extract.

## Raw Load Contract

The loader creates one raw table per package CSV. Original source columns are preserved as text, and the loader adds technical lineage:

- `_tenant_key`
- `_dataset_id`
- `_load_run_id`
- `_source_file`
- `_source_row_number`
- `_source_csv_sha256`
- `_row_sha256`
- `_loaded_at`

The loader also writes `raw_source_v4._column_map` with original header, normalized column name, source table, source file, ordinal, domain contract, and grain.

## Canary Views

The loader creates these lab-only projections:

- `consumption_v4_canary.sourcing_contract_v1`
- `consumption_v4_canary.sourcing_vendor_v1`
- `consumption_v4_canary.sourcing_contract_scope_v1`
- `consumption_v4_canary.sourcing_spend_monthly_v1`
- `consumption_v4_canary.sourcing_performance_v1`
- `consumption_v4_canary.sourcing_context_coverage_v1`

These are bridge views for Source/Cube design validation. They are not a final canonical model and should not be promoted over existing v3 production Source views without a separate migration and proof bundle.

## Baseline Result Semantics

The answer-baseline ledger records, per question:

- question
- generated SQL
- tables and columns used
- joins attempted
- execution plan
- latency
- rows scanned and returned
- SQL correctness
- answer quality
- missing context

`canary_supported` means the v4 raw package and first canary projections are sufficient to produce a responsible answer shape.

`partial_semantic_view_needed` means the source data exists, but a richer governed semantic view should be built before the answer is considered product-ready.

`blocked` means a required source file is missing. The expected blocked count is `0`.

## Local Execution Note

The current local shell did not expose a lab database URL. Local validation therefore covered package parsing, hash/count verification, dry-run load planning, and offline question-baseline generation. The apply command is ready for the lab ACA/operator or any shell with a valid lab Postgres connection string.

For ACA operator execution, prefer:

```bash
node scripts/ops/submit-aca-operator-job.mjs \
  --image <digest-pinned-web-image> \
  --script source:v4:lab-canary:job \
  --out-dir /tmp/source-v4-lab-canary-operator-proof
```

The operator job must use a digest-pinned image that contains this script and must restore to idle afterward.
