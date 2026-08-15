# 2026-08-14-graph-disposition-current-main-report — Graph Disposition Current-Main Report

## Release ID

`2026-08-14-graph-disposition-current-main-report`

## Status

`candidate`

## Plain-English Summary

Refreshes the sanitized graph disposition status report against current `origin/main`. The report confirms that every remaining quarantined relationship has an explicit class and disposition, but it remains audit-only and does not materialize graph tables, create canonical objects, modify tenant inputs, activate registries, or refresh product projections.

## Layer Impact

- Affected release lane: `global-control-lane`.
- Layer 1 Client Intake: read-only source inspection only; no intake files are changed.
- Layer 2 Source Adapters: no adapter behavior change.
- Layer 3 Canonical Enterprise Model: graph disposition status only; no canonical object, fact, relationship, registry, or graph table write is performed.
- Layer 4 Products: no projection refresh or runtime routing change.

## Client Applicability

- All clients: anonymized report-only status.
- Specific clients: none named in public release material.
- Internal only: operators and agents using current-main graph blocker evidence.
- Public/demo only: no direct change.
- Feature flag: none.

## Changes Included

- Refreshes `reports/graph-disposition-status/current-main/graph-disposition-status.json`.
- Refreshes `reports/graph-disposition-status/current-main/graph-disposition-status.md`.
- Records `sourceSha` as `5746c7fea8103d5a5b5a87a127ae5d1a7c2f3064`.

## QA / Validation

- Pass: `npm run audit:tenant-graph-reconciliation -- --tenant all --out /tmp/nexus-graph-disposition-current-5746c7f`.
- Pass: `npm run audit:graph-disposition-status -- --graph-dir /tmp/nexus-graph-disposition-current-5746c7f --out-dir reports/graph-disposition-status/current-main --source-sha 5746c7fea8103d5a5b5a87a127ae5d1a7c2f3064`.
- Pass: `node --check scripts/audit/build-graph-disposition-status-report.mjs`.
- Pass: `npx eslint scripts/audit/build-graph-disposition-status-report.mjs`.
- Pass: `git diff --check`.
- Pass: disclosure scan over the report and release record for tenant-name/path leakage.
- Pass: `npm run release:check`.

## Rollout Plan

Merge through a pull request. The repo-owned ACA main deploy workflow may deploy the report, but the change is inert and does not change runtime behavior.

## Deployment Authority

- Repo-owned deploy workflow: approved for this session.
- Shared runtime mutators: none beyond the repo-owned main deploy.
- Approved image digest: captured by ACA main deploy if this report is merged.
- ACA runtime invariant: required if the repo-owned deploy runs.
- Worker image invariant: required if the repo-owned deploy runs.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this is report-only.

## Rollback Plan

Revert this report refresh and release record. No data rollback is needed because no tenant data, registry, index, data-plane state, graph table, projection, or runtime route changes are made.

## Audit Evidence

- `reports/graph-disposition-status/current-main/graph-disposition-status.json`
- `reports/graph-disposition-status/current-main/graph-disposition-status.md`
- Dry-run evidence: `/tmp/nexus-graph-disposition-current-5746c7f`
- PR URL: pending.

## Known Gaps

The report shows `5,179` quarantined relationships and `0` missing class/disposition rows. Graph materialization, canonical writes, Layer 4 projection refresh, semantic alias activation, graph dictionary/object-registry activation, and live-client truth claims remain closed until approved evidence-backed execution work is ready.
