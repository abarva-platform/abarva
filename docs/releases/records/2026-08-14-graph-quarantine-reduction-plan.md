# 2026-08-14-graph-quarantine-reduction-plan — Graph quarantine reduction plan

## Release ID

`2026-08-14-graph-quarantine-reduction-plan`

## Status

`candidate`

## Plain-English Summary

Adds a sanitized graph quarantine reduction plan for the current all-tenant graph dry-run. The plan
separates code-repairable dictionary/endpoint alias cases from source-data and disposition-gated
cases, and records that the current checkout has no remaining code-only graph dictionary repair rows.

## Layer Impact

- Affected release lane: `client-data-lane`.
- Layer 1 Client Intake: read-only; no source files or template contracts are changed.
- Layer 2 Source Adapters: unchanged; the dry-run output remains disposable evidence.
- Layer 3 Canonical Enterprise Model: graph reconciliation remains quarantine-first and report-only.
  Unique mapping-declared identity aliases are indexed for existing nodes, while ambiguous aliases
  remain skipped.
- Layer 4 Products: unchanged; no projection or product read model is refreshed.

## Client Applicability

- All clients: the report can be generated from the all-tenant graph dry-run output.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/tenant-graph-reconciliation.mjs` indexes unique identity aliases declared by mapping
  profiles for existing node candidates and reports alias/ambiguity counts.
- `scripts/audit/build-graph-quarantine-reduction-plan.mjs` emits sanitized JSON and Markdown reports
  from graph dry-run output.
- `scripts/audit/__tests__/run-tenant-graph-reconciliation-tests.mjs` covers unique alias resolution
  and ambiguous alias quarantine.
- `scripts/audit/__tests__/run-graph-quarantine-reduction-plan-tests.mjs` covers reduction-path
  classification.
- `package.json` adds `audit:graph-quarantine-reduction`.
- `reports/graph-quarantine-reduction/current-main/graph-quarantine-reduction-plan.json` records the
  current main reduction plan.
- `reports/graph-quarantine-reduction/current-main/graph-quarantine-reduction-plan.md` provides the
  compact human-readable status.

## QA / Validation

- Pass: `node scripts/audit/__tests__/run-tenant-graph-reconciliation-tests.mjs`
- Pass: `node scripts/audit/__tests__/run-graph-quarantine-reduction-plan-tests.mjs`
- Pass: `npm run audit:tenant-graph-reconciliation -- --tenant all --out /tmp/nexus-graph-alias-current.czivry`
  - Output included: 7 tenants, 9,633 relationship rows, 4,454 candidate edges, 5,179 quarantined
    edges, 246 unique identity aliases indexed, and 61 ambiguous identity aliases skipped.
- Pass: `npm run audit:graph-quarantine-reduction -- --graph-dir /tmp/nexus-graph-alias-current.czivry --out-dir reports/graph-quarantine-reduction/current-main --source-sha 6e38a41e826bd61b5492c7c15199347d0d336d5f`
  - Output included: 5,179 quarantined rows, 0 code-repair rows, and 5,179
    source/disposition-gated rows.

## Rollout Plan

Merge through a pull request. The repo-owned ACA deploy may run, but this is report-only and does
not activate canonical writes, registries, graph materialization, data-plane loading, or product use.

## Deployment Authority

- Repo-owned deploy workflow: approved for this session if the PR merges.
- Shared runtime mutators: none.
- Approved image digest: produced by the repo-owned ACA main deploy if it runs.
- ACA runtime invariant: required only for deploy proof.
- Worker image invariant: required only for deploy proof.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product surface behavior changes.

## Rollback Plan

Revert the pull request to remove the report builder, package script, tests, and sanitized current
main artifact.

## Audit Evidence

- Source SHA: `6e38a41e826bd61b5492c7c15199347d0d336d5f`
- Generated report: `reports/graph-quarantine-reduction/current-main/graph-quarantine-reduction-plan.json`
- Generated report: `reports/graph-quarantine-reduction/current-main/graph-quarantine-reduction-plan.md`
- Dry-run evidence: `/tmp/nexus-graph-alias-current.czivry`

## Known Gaps

This release does not reduce the row-level quarantine count because the current dry-run has no
code-only dictionary or endpoint-alias repair rows. The remaining rows require source evidence,
edge retirement, or a no-graph disposition before graph materialization can proceed. This release
does not write tenant data, activate registries, activate semantic aliases, activate graph
dictionary/object registry, load the data plane, materialize graph tables, refresh Layer 4
projections, or make live-client truth claims.
