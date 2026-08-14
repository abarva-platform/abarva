# 2026-08-14-layer-refresh-status-v2-report — Layer refresh status V2 report

## Release ID

`2026-08-14-layer-refresh-status-v2-report`

## Status

`candidate`

## Plain-English Summary

Adds a checked-in, report-only status artifact for the current Layer 1 through Layer 4 refresh lane.
The report corrects the stale Layer 2 blocker narrative and records the current blocker as graph
quarantine and downstream report-only state.

## Layer Impact

- Affected release lane: `client-data-lane`.
- Layer 1 Client Intake: classified active files that are not declared in the template contract.
- Layer 2 Source Adapters: records current dry-run status as complete for this contract.
- Layer 3 Canonical Enterprise Model: records scaffold and graph quarantine status only.
- Layer 4 Products: records that no product projection refresh occurred.

## Client Applicability

- All clients: no runtime or data-plane effect.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/build-layer-refresh-status-report.mjs` generates the report from existing audit
  outputs.
- `reports/layer-refresh-status/current-main-v2/layer-refresh-status-v2.md` and `.json` provide the
  durable status artifact.
- `docs/codex-handoff/LAYER_RECONCILIATION_HOME_REFRESH_AVA_READINESS_2026-08-13.md` now warns that
  its Layer 2 figures are stale and points at the current artifact.

## QA / Validation

- Pass: `npm run release:check`
  - Output included: `migration-seals: verified 1 sealed migration`, `Azure deployment lane check passed`,
    `[audit:no-legacy-tenant-inputs] pass`, `Release Control Gate passed`,
    `Release-relevant files: 1`, `Deploy Authority Gate passed`, `Pilot Data Loader Gate passed`.
- Pass: `npm run audit:tenant-input-quality -- --out-dir /tmp/nexus-v2-layer-refresh.TD3w2Z/tenant-input-quality`
  - Output included: `Tenant input quality audit passed: 7 active tenants audited`.
- Pass: `npm run validate:context-corpus`
  - Output included: all five gates passed and `Context & Corpus governance gate passed`.
- Pass: `node scripts/tower/fact-lineage-report.mjs`
  - Output included: `status: PASS`, 7 tenants, 63 metric rows, 49 gap rows.
- Pass: `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out /tmp/nexus-v2-layer-refresh.TD3w2Z/layer-reconciliation --no-package`
  - Output included: 7 tenants, 56 layer rows, 109 claims, 56 gates.
- Pass: `npm run audit:tenant-graph-reconciliation -- --tenant all --out /tmp/nexus-v2-layer-refresh.TD3w2Z/graph-reconciliation`
  - Output included: 7 tenants, 9,633 relationship rows, 4,454 candidates, 5,179 quarantined.

## Rollout Plan

Merge through a pull request. The repo-owned ACA deploy may run, but this change has no runtime,
data-plane, registry, tenant data, graph table, or product projection effect.

## Deployment Authority

- Repo-owned deploy workflow: approved for this session if the PR merges.
- Shared runtime mutators: none.
- Approved image digest: produced by the repo-owned ACA main deploy if it runs.
- ACA runtime invariant: required only for deploy proof.
- Worker image invariant: required only for deploy proof.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this is report-only.

## Rollback Plan

Revert the pull request to remove the status artifact, generator, and stale-doc correction.

## Audit Evidence

- Detached source worktree: `/tmp/verify`
- Source SHA: `d7b2de2aac93cc379052a45f9e730281bb328236`
- Layer refresh evidence: `/tmp/nexus-v2-layer-refresh.TD3w2Z/layer-reconciliation`
- Graph evidence: `/tmp/nexus-v2-layer-refresh.TD3w2Z/graph-reconciliation`
- Tenant input quality evidence: `/tmp/nexus-v2-layer-refresh.TD3w2Z/tenant-input-quality`

## Known Gaps

This release does not amend the template contract, mutate tenant data, perform Azure/Postgres writes,
activate registries, write canonical stores, materialize graph tables, refresh product projections,
or make live-client truth claims.
