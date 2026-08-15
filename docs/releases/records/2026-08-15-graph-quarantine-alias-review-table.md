# 2026-08-15-graph-quarantine-alias-review-table — Graph Alias Review Table

## Release ID

`2026-08-15-graph-quarantine-alias-review-table`

## Status

`candidate`

## Plain-English Summary

Adds a durable, reviewable alias table for the graph quarantine analysis. The prior report exposed counts only; this update lists the proposed endpoint-to-canonical mappings needed for human review while still keeping semantic identity alias activation closed.

## Layer Impact

- Affected release lane: `global-control-lane`.
- Layer 1 Client Intake: read-only inspection only; no intake files or template contracts are changed.
- Layer 2 Source Adapters: no adapter behavior change.
- Layer 3 Canonical Enterprise Model: report-only alias review evidence; no canonical object registry, alias registry, relationship dictionary, graph table, or data-plane write is performed.
- Layer 4 Products: no projection refresh, product route change, or runtime truth claim.

## Client Applicability

- All clients: anonymized report-only status.
- Specific clients: none named in public release material.
- Internal only: operators and agents planning graph quarantine reduction.
- Public/demo only: no direct change.
- Feature flag: none.

## Changes Included

- Updates `scripts/audit/build-graph-quarantine-alias-analysis.mjs` to emit a distinct alias review table with affected endpoint occurrence counts.
- Updates `scripts/audit/__tests__/run-graph-quarantine-alias-analysis-tests.mjs` to verify deduplicated review rows.
- Adds `reports/graph-quarantine-alias-analysis/current-main/graph-quarantine-alias-review.csv`.
- Refreshes `reports/graph-quarantine-alias-analysis/current-main/graph-quarantine-alias-analysis.json`.
- Refreshes `reports/graph-quarantine-alias-analysis/current-main/graph-quarantine-alias-analysis.md`.

## QA / Validation

- Pass: `node --check scripts/audit/build-graph-quarantine-alias-analysis.mjs && node --check scripts/audit/__tests__/run-graph-quarantine-alias-analysis-tests.mjs`.
- Pass: `node scripts/audit/__tests__/run-graph-quarantine-alias-analysis-tests.mjs`.
- Pass: `npm run audit:graph-quarantine-alias-analysis -- --graph-dir /tmp/nexus-graph-alias-review-cb6e35d.MPQVio --out-dir reports/graph-quarantine-alias-analysis/current-main --source-sha cb6e35d48700dfbee001608436fd0e6839d8677e`.

## Rollout Plan

Merge through a pull request. The repo-owned ACA main deploy workflow may deploy the repository contents, but this change is inert and does not activate aliases, materialize graph data, or refresh product projections.

## Deployment Authority

- Repo-owned deploy workflow: approved for this session.
- Shared runtime mutators: none beyond the repo-owned main deploy.
- Approved image digest: captured by ACA main deploy if this report is merged.
- ACA runtime invariant: required if the repo-owned deploy runs.
- Worker image invariant: required if the repo-owned deploy runs.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this is report-only.

## Rollback Plan

Revert this report, script, test, generated artifacts, and release record. No data rollback is needed because no tenant data, registry, index, data-plane state, graph table, projection, or runtime route changes are made.

## Audit Evidence

- `reports/graph-quarantine-alias-analysis/current-main/graph-quarantine-alias-review.csv`
- `reports/graph-quarantine-alias-analysis/current-main/graph-quarantine-alias-analysis.json`
- `reports/graph-quarantine-alias-analysis/current-main/graph-quarantine-alias-analysis.md`
- Graph reconciliation evidence source used for regeneration: `/tmp/nexus-graph-alias-review-cb6e35d.MPQVio`
- PR URL: pending.

## Known Gaps

The report found `3` distinct code-only acronym alias candidates affecting `50` unresolved endpoint occurrences, while `6,103` endpoints remain source-data gated. No semantic identity alias activation was performed. No graph rows were materialized. Any future alias activation, registry activation, graph materialization, data-plane write, or projection refresh remains out of scope unless explicitly approved.
