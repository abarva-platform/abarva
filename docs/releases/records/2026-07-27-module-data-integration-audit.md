# 2026-07-27-module-data-integration-audit — Moves Source Tower Data Integration Audit

## Release ID

`2026-07-27-module-data-integration-audit`

## Status

`candidate`

## Plain-English Summary

This release adds a static audit package for existing Moves, Source, and Tower persisted objects. It inventories module-relevant persisted objects parsed from migration DDL, uses focused code references only as consumer evidence, classifies each item as operational, provisional canonical-promotion candidate, shared-consumption projection, archive, or replacement candidate, and documents the target integration pattern for later controlled migration planning.

## Layer Impact

- Release lane: `internal-admin`.
- Product layer: no runtime behavior changes.
- Data architecture documentation: adds a current-state audit and future integration blueprint.
- Internal audit tooling: adds repeatable scripts that generate CSV, XLSX, JSON, and Markdown audit outputs from repository migrations, with focused module code references used only as consumer evidence.

## Client Applicability

- All clients: no runtime impact.
- Specific clients: none.
- Internal only: yes, audit/planning artifact only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/build-module-data-integration-audit.mjs`
- `scripts/audit/build-module-data-integration-workbooks.mjs`
- `scripts/audit/build-module-migration-sunset-backlog.mjs`
- `reports/module-data-integration-audit/2026-07-27/`
- `reports/module-migration-sunset-backlog/2026-07-27/`

## QA / Validation

- PASS: `node scripts/audit/build-module-data-integration-audit.mjs`
- PASS: `NODE_PATH=/Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/audit/build-module-data-integration-workbooks.mjs`
- PASS: `node scripts/audit/build-module-migration-sunset-backlog.mjs`
- PASS: CSV sanity check confirmed row and column counts for all generated matrices.
- PASS: independent classification review corrected code-reference false positives and confirmed the stricter baseline: 131 persisted objects; 72 retain operational; 38 promote/link; 16 shared consumption projections; 5 archive.
- PASS: final row-level spot check confirmed one row per persisted object, one disposition per object, typed table/view posture, provisional promotion families, projection guidance, archive handling, and explicit static/live verification boundaries.
- PASS: targeted correction patch replaced coarse canonical targets with provisional object families plus mapping confidence, clarified projection-catalog scope, reconciled 131 audit rows to 129 backlog rows, and narrowed the Moves orchestrator sunset target so the durable run ledger is retained.
- PASS: generated separate migration/sunset planning backlog package; planning only, no migration authorization.
- PASS: `node --check scripts/audit/build-module-data-integration-audit.mjs && node --check scripts/audit/build-module-data-integration-workbooks.mjs && node --check scripts/audit/build-module-migration-sunset-backlog.mjs`
- PASS: `npm run release:check`

## Rollout Plan

No runtime rollout. This PR should merge as an internal planning/audit artifact only.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because there is no runtime change.

## Rollback Plan

Revert the audit scripts and generated report artifacts. No runtime, database, Azure, tenant, or API rollback is required.

## Audit Evidence

- Generated XLSX/CSV/JSON/Markdown files under `reports/module-data-integration-audit/2026-07-27/`.
- Independent review memo: `reports/module-data-integration-audit/2026-07-27/INDEPENDENT_CLASSIFICATION_REVIEW.md`.
- Separate planning backlog package: `reports/module-migration-sunset-backlog/2026-07-27/`.
- `summary.json` records the static audit scope and row counts.

## Known Gaps

- Static audit only. Live row counts, RLS catalog status, null rates, duplicates, stale rows, and broken references require a later read-only database audit.
- Canonical object families are provisional until live row profiling, tenant/RLS inspection, lineage validation, and publication-framework proof are complete.
- No migration, API cutover, Cube model, dashboard change, tenant move, or Azure mutation is included.
- The migration/sunset backlog records future path-level candidates only. It does not authorize migration, backfill, dual-write, cutover, archive, drop, or runtime changes.
