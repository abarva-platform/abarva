# 2026-07-27-module-data-integration-audit — Moves Source Tower Data Integration Audit

## Release ID

`2026-07-27-module-data-integration-audit`

## Status

`candidate`

## Plain-English Summary

This release adds a static audit package for existing Moves, Source, and Tower persisted objects. It inventories module-relevant persisted objects parsed from migration DDL, uses focused code references only as consumer evidence, classifies each item as operational, canonical-promotion candidate, shared-consumption projection, archive, or replacement candidate, and documents the target integration pattern for later controlled migration planning.

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
- `reports/module-data-integration-audit/2026-07-27/`

## QA / Validation

- PASS: `node scripts/audit/build-module-data-integration-audit.mjs`
- PASS: `NODE_PATH=/Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/audit/build-module-data-integration-workbooks.mjs`
- PASS: CSV sanity check confirmed row and column counts for all generated matrices.
- PASS: independent classification review corrected code-reference false positives and confirmed the stricter baseline: 131 persisted objects; 72 retain operational; 38 promote/link; 16 shared consumption projections; 5 archive.
- PASS: `node --check scripts/audit/build-module-data-integration-audit.mjs && node --check scripts/audit/build-module-data-integration-workbooks.mjs`
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
- `summary.json` records the static audit scope and row counts.

## Known Gaps

- Static audit only. Live row counts, RLS catalog status, null rates, duplicates, stale rows, and broken references require a later read-only database audit.
- No migration, API cutover, Cube model, dashboard change, tenant move, or Azure mutation is included.
