# 2026-08-14-graph-quarantine-alias-analysis — Graph Quarantine Alias Analysis

## Release ID

`2026-08-14-graph-quarantine-alias-analysis`

## Status

`candidate`

## Plain-English Summary

Adds a sanitized, report-only graph quarantine alias analysis for current `origin/main` at `6ac668f96e79debb431bb1b46f798f7f72a41005`. The report quantifies unresolved graph endpoints that may be recoverable through code-only acronym alias handling, while keeping semantic identity alias activation and graph materialization closed.

## Layer Impact

- Affected release lane: `global-control-lane`.
- Layer 1 Client Intake: read-only source inspection only; no intake files or template contract are changed.
- Layer 2 Source Adapters: no adapter behavior change.
- Layer 3 Canonical Enterprise Model: alias opportunity reporting only; no canonical object, fact, relationship, registry, alias, or graph table write is performed.
- Layer 4 Products: no projection refresh or runtime routing change.

## Client Applicability

- All clients: anonymized report-only status.
- Specific clients: none named in public release material.
- Internal only: operators and agents planning graph quarantine reduction.
- Public/demo only: no direct change.
- Feature flag: none.

## Changes Included

- Adds `scripts/audit/build-graph-quarantine-alias-analysis.mjs`.
- Adds `scripts/audit/__tests__/run-graph-quarantine-alias-analysis-tests.mjs`.
- Adds `audit:graph-quarantine-alias-analysis` to `package.json`.
- Adds `reports/graph-quarantine-alias-analysis/current-main/graph-quarantine-alias-analysis.json`.
- Adds `reports/graph-quarantine-alias-analysis/current-main/graph-quarantine-alias-analysis.md`.

## QA / Validation

- Pass: `npm run audit:tenant-graph-reconciliation -- --tenant all --out /tmp/nexus-graph-alias-analysis-6ac668f.uv9Dzh`.
- Pass: `node scripts/audit/__tests__/run-graph-quarantine-alias-analysis-tests.mjs`.
- Pass: `npm run audit:graph-quarantine-alias-analysis -- --graph-dir /tmp/nexus-graph-alias-analysis-6ac668f.uv9Dzh --out-dir reports/graph-quarantine-alias-analysis/current-main --source-sha 6ac668f96e79debb431bb1b46f798f7f72a41005`.

## Rollout Plan

Merge through a pull request. The repo-owned ACA main deploy workflow may deploy the report, but the change is inert and does not change runtime graph behavior.

## Deployment Authority

- Repo-owned deploy workflow: approved for this session.
- Shared runtime mutators: none beyond the repo-owned main deploy.
- Approved image digest: captured by ACA main deploy if this report is merged.
- ACA runtime invariant: required if the repo-owned deploy runs.
- Worker image invariant: required if the repo-owned deploy runs.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this is report-only.

## Rollback Plan

Revert this report, script, package script, test, and release record. No data rollback is needed because no tenant data, registry, index, data-plane state, graph table, projection, or runtime route changes are made.

## Audit Evidence

- `reports/graph-quarantine-alias-analysis/current-main/graph-quarantine-alias-analysis.json`
- `reports/graph-quarantine-alias-analysis/current-main/graph-quarantine-alias-analysis.md`
- Graph reconciliation evidence: `/tmp/nexus-graph-alias-analysis-6ac668f.uv9Dzh`
- PR URL: pending.

## Known Gaps

The report found `50` code-only acronym alias candidate endpoints and `6,103` source-data gated endpoints. No semantic identity alias activation was performed. No graph rows were materialized. Any future alias activation remains a closed hard gate unless explicitly approved.
