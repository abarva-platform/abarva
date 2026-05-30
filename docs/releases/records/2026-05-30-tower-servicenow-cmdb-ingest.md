# 2026-05-30-tower-servicenow-cmdb-ingest — Tower S5 · live ServiceNow CMDB ingest

## Release ID

`2026-05-30-tower-servicenow-cmdb-ingest`

## Status

`candidate`

## Plain-English Summary

The 2026-05-06 Tower audit (`docs/build/TOWER_AUDIT_2026-05-06.md`) found that Tower watched **zero** real source systems — every Tower lens was reading from manually-loaded fixtures, not from a customer's CMDB / observability / FinOps pipe. This slice is the first of the parallel "S" series that gives Tower live integrations.

S5 specifically wires the ServiceNow CMDB: a customer extracts their CI inventory (`cmdb_ci`) and CI relationships (`cmdb_rel_ci`) via the ServiceNow Table API or a scheduled export, pastes both into the workbook shipped at `public/templates/tower/servicenow-cmdb/template.xlsx`, and runs `npx tsx src/scripts/tower/ingest-servicenow-cmdb.ts --file <wb> --client-id <tenant>` (with `--dry-run` first). The parser validates every dependency edge's foreign keys before any database write, the upsert is transactional and idempotent (re-uploading the same workbook is safe), and the two new tables (`tower_cmdb_cis`, `tower_cmdb_dependencies`) are tenant-scoped on `client_id`.

A sample-filled workbook with ~200 synthetic Northwind Retail CIs and ~360 dependency edges (covering checkout, inventory, payments, loyalty, fulfillment, analytics, and a 3-region server fleet) ships alongside the blank template so the customer can validate the pipeline end-to-end against known-good rows before pasting their real extract. Both workbooks display a banner on every data sheet — the sample's banner explicitly flags it as synthetic data not real customer telemetry.

This slice also establishes `src/lib/tower/ingest/registry.ts` as the spine that sibling slices (other CMDB sources, observability, FinOps) will append into. Each slice adds exactly one manifest entry; the union-merge guard throws if two slices register the same key with different manifests, so concurrent PR conflicts are caught at module-load time rather than silently overwriting each other.

## Layer Impact

- `runtime-app-lane`: New `src/lib/tower/ingest/` subtree with the registry, schema, parser, validator, transactional upsert, and the per-source manifest. No changes to existing Tower request paths — the lenses keep reading from their current fixtures until a follow-up slice points them at `tower_cmdb_cis` / `tower_cmdb_dependencies`.
- `data-plane-lane`: New SQL migration `supabase/migrations/20260530120000_tower_cmdb.sql` adds `tower_cmdb_cis` and `tower_cmdb_dependencies` with the tenant-scoped unique constraints that make the upsert idempotent. Migration is additive — no existing table is touched.
- `tooling-lane`: New CLI `src/scripts/tower/ingest-servicenow-cmdb.ts` (parse + validate + transactional upsert, `--dry-run`, `--verbose`, `--ingest-run-id`) and build script `src/scripts/tower/build-servicenow-cmdb-template.ts` (regenerates the two xlsx artifacts deterministically).
- `qa-validation-lane`: 4 new test suites, 15 new tests covering template shape, parser banner-awareness + enum-validation + blank-row tolerance, FK / duplicate-edge / duplicate-CI validation, upsert idempotency and rollback-on-error, and the registry's existence-of-files contract.
- `docs-lane`: Enterprise runbook at `docs/templates/tower/servicenow-cmdb/README.md` covers the production ServiceNow extract path (Table API field-by-field mapping, install_status / criticality / relationship-type enum bridges), CLI usage, validation rules, and the rollback procedure.

## Client Applicability

- All clients: The schema migration adds two new empty tables that every tenant gets. No tenant data changes until a customer or operator runs the CLI against their workbook.
- Specific clients: First pilot customer for the live ingest path is the next CIO-stewardship conversation; until then the sample is the only data present.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None — the surface area is new, gated by the existence of the CLI invocation. UI exposure (a Tower → Connectors picker) is a follow-up slice.

## Changes Included

- `src/lib/tower/ingest/registry.ts` (new) — `TowerIngestSourceManifest` + `registerTowerIngestSource` with the union-merge guard; one registration (`servicenow-cmdb`) appended at the bottom.
- `src/lib/tower/ingest/servicenow-cmdb/manifest.ts` (new) — manifest for the ServiceNow CMDB source.
- `src/lib/tower/ingest/servicenow-cmdb/schema.ts` (new) — sheet names, column definitions, enum constants (lifecycle_state, criticality, dependency_type), CmdbCiRow + CmdbDependencyRow types.
- `src/lib/tower/ingest/servicenow-cmdb/parse.ts` (new) — exceljs-backed parser. Banner-aware (scans rows 1–5 for the header row), tolerant to column order, skips fully-blank rows, drops rows with invalid enum values and records issues per row.
- `src/lib/tower/ingest/servicenow-cmdb/validate.ts` (new) — cross-sheet validator: CI sys_id uniqueness, FK on every dependency edge, duplicate-edge detection, retired-CI warning.
- `src/lib/tower/ingest/servicenow-cmdb/sample.ts` (new) — pure deterministic builder for the synthetic Northwind Retail extract (222 CIs / 363 edges). No `Math.random()` / `Date.now()`; tests rely on stable shape.
- `src/lib/tower/ingest/servicenow-cmdb/template.ts` (new) — exceljs workbook builder. Both blank and filled variants. Adds synthetic-data banner + How-to + Schema reference sheets.
- `src/lib/tower/ingest/servicenow-cmdb/upsert.ts` (new) — transactional pg upsert. `INSERT ... ON CONFLICT ... RETURNING (xmax = 0) AS inserted` to distinguish insert from update for the run summary.
- `src/lib/tower/ingest/servicenow-cmdb/db.ts` (new) — lazy pg.Pool helper scoped to the CLI.
- `src/scripts/tower/build-servicenow-cmdb-template.ts` (new) — build script that writes `template.xlsx` and `sample.xlsx`.
- `src/scripts/tower/ingest-servicenow-cmdb.ts` (new) — CLI.
- `public/templates/tower/servicenow-cmdb/template.xlsx` (new) — blank workbook (banner + headers + How-to + Schema).
- `public/templates/tower/servicenow-cmdb/sample.xlsx` (new) — filled workbook (synthetic Northwind data).
- `docs/templates/tower/servicenow-cmdb/README.md` (new) — enterprise runbook.
- `supabase/migrations/20260530120000_tower_cmdb.sql` (new) — `tower_cmdb_cis` + `tower_cmdb_dependencies`.
- `src/lib/tower/ingest/__tests__/{registry,servicenow-cmdb-parse,servicenow-cmdb-validate,servicenow-cmdb-upsert}.test.ts` (new) — 15 tests.

## QA / Validation

- PASS: `npx jest src/lib/tower/ingest` — 4 suites, 15 tests, all green.
- PASS: `npx tsc --noEmit -p tsconfig.json` — clean.
- PASS: `npx eslint src/lib/tower/ingest src/scripts/tower` — clean.
- PASS: `npx tsx src/scripts/tower/ingest-servicenow-cmdb.ts --file public/templates/tower/servicenow-cmdb/sample.xlsx --client-id apexretail --dry-run` — parses 222 CIs / 363 deps, validates clean, dry-run completes.
- DEFERRED: Apply the migration in a staging DB and run the CLI without `--dry-run` to confirm the live upsert + idempotency replay. The upsert layer is tested in isolation against a hand-rolled pg.Pool double that models the two tables and the `RETURNING (xmax = 0)` insert/update discriminator.

## Rollout Plan

- Merge to main; CI runs the four new test suites alongside the existing Tower test suites.
- Migration is applied via the standard Supabase migration pipeline. No data backfill is required — both tables start empty.
- No runtime feature flag. The CLI is opt-in by invocation; the schema migration is the only platform-wide change and it is additive.
- Follow-up slice will expose a Tower → Connectors → ServiceNow CMDB upload UI that drives the same parser + validator + upsert pipeline via an authenticated API route instead of the CLI.
