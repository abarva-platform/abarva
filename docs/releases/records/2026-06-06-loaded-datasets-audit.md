# 2026-06-06-loaded-datasets-audit — Loaded Dataset Inventory Audit

## Release ID

`2026-06-06-loaded-datasets-audit`

## Status

`candidate`

## Plain-English Summary

Adds a read-only operator script that reports what datasets are loaded in the Azure/Postgres data plane, grouped by each table's natural type or category fields. This helps the team answer client-readiness questions such as what context exists, how broad it is, and where loaded-data evidence is still thin.

## Layer Impact

- `internal-admin`: Adds an internal audit command for operators and implementation teams. It does not add a customer-facing route or change product UI.
- `client-data-lane`: Reads client-scoped data when a tenant filter is provided, but performs no writes, migrations, imports, deletes, or transformations.

## Client Applicability

- All clients: Applicable as an internal audit tool where the target data plane contains supported tables.
- Specific clients: None hard-coded.
- Internal only: Yes. The script is intended for AbarVa operator use.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- Adds `src/scripts/audit/report-loaded-datasets.ts`.
- Adds an npm script entry for running the loaded-dataset audit.
- No database migrations.
- No application routes.
- No runtime UI changes.

## QA / Validation

- CI already passed the code-level checks on PR #3215 except the release-record gate before this record was added.
- Expected validation after this record is pushed:
  - `npm run release:check -- --base origin/main --head HEAD`
  - Existing PR checks for lint, typecheck, hygiene, production readiness, and secret scanning.
- The audit script is designed to degrade safely when optional tables or columns are absent by skipping missing surfaces instead of failing the whole report.

## Rollout Plan

Merge PR #3215 to `main`. Operators can then run the script manually against the desired data plane using existing environment variables. No Vercel production deploy, Azure schema apply, or feature flag activation is required for the script itself.

## Rollback Plan

Revert the PR or remove the npm script and `src/scripts/audit/report-loaded-datasets.ts`. Because this is read-only and introduces no schema or runtime behavior, rollback has no data migration concerns.

## Audit Evidence

- PR #3215: `feat(audit): read-only report of loaded datasets by type/category`
- Release-control check after this record is included.
- CI status checks on the PR.
- Local or operator-generated script output may be retained separately as client-readiness evidence when run against a specific data plane.

## Known Gaps

- The script reports loaded-data breadth and category counts; it does not judge document quality, retrieval quality, semantic depth, or whether a client-facing agent answer is demo-ready.
- Live output depends on the environment and database credentials used at run time.
