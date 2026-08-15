# 2026-08-14-graph-quarantine-current-main-report — Graph Quarantine Current-Main Report

## Release ID

`2026-08-14-graph-quarantine-current-main-report`

## Status

`candidate`

## Plain-English Summary

Refreshes the sanitized graph quarantine reduction report against current `origin/main` so the Layer 3/graph blocker is measured from the same checkout being deployed. The report remains audit-only and does not materialize graph tables, create canonical objects, modify tenant inputs, activate registries, or refresh product projections.

## Layer Impact

- Affected release lane: `global-control-lane`.
- Layer 1 Client Intake: read-only source inspection only; no intake files are changed.
- Layer 2 Source Adapters: no adapter behavior change.
- Layer 3 Canonical Enterprise Model: graph reconciliation remains quarantine-first; no canonical object, fact, relationship, or graph table write is performed.
- Layer 4 Products: no projection refresh or runtime routing change.

## Client Applicability

- All clients: anonymized report-only status.
- Specific clients: none named in public release material.
- Internal only: operators and agents using current-main graph blocker evidence.
- Public/demo only: no direct change.
- Feature flag: none.

## Changes Included

- Refreshes `reports/graph-quarantine-reduction/current-main/graph-quarantine-reduction-plan.json`.
- Refreshes `reports/graph-quarantine-reduction/current-main/graph-quarantine-reduction-plan.md`.
- Records `sourceSha` as `fef909cd4bae7c7fde7e21f5c6a90e9000d07bf2`.

## QA / Validation

- Pass: `npm run audit:tenant-graph-reconciliation -- --tenant all --out /tmp/nexus-graph-current-fef909`.
- Pass: `npm run audit:graph-quarantine-reduction -- --graph-dir /tmp/nexus-graph-current-fef909 --out-dir reports/graph-quarantine-reduction/current-main --source-sha fef909cd4bae7c7fde7e21f5c6a90e9000d07bf2`.
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

- `reports/graph-quarantine-reduction/current-main/graph-quarantine-reduction-plan.json`
- `reports/graph-quarantine-reduction/current-main/graph-quarantine-reduction-plan.md`
- PR URL: pending.

## Known Gaps

The report shows `0` code-repair rows and `5,179` source/disposition-gated rows. Graph materialization, canonical writes, Layer 4 projection refresh, and live-client truth claims remain closed until the remaining graph quarantine dispositions are resolved through approved evidence-backed work.
