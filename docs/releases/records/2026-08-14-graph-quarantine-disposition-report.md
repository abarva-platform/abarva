# 2026-08-14-graph-quarantine-disposition-report — Graph quarantine disposition report

## Release ID

`2026-08-14-graph-quarantine-disposition-report`

## Status

`candidate`

## Plain-English Summary

The graph reconciliation audit now assigns a machine-readable class and disposition to every
quarantined relationship row. This makes the graph blocker explicit without reducing quarantine by
inventing nodes, writing graph tables, or refreshing product projections.

## Layer Impact

- Affected release lane: `client-data-lane`.
- Layer 1 Client Intake: read-only; no source files are changed.
- Layer 2 Source Adapters: unchanged.
- Layer 3 Canonical Enterprise Model: graph reconciliation reports get clearer quarantine classes
  and dispositions, but no canonical store or graph table is written.
- Layer 4 Products: unchanged; no product read model or projection is refreshed.

## Client Applicability

- All clients: graph audit outputs include quarantine class and disposition fields.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/tenant-graph-reconciliation.mjs` adds quarantine classification and disposition
  helpers, and emits `quarantineClass` plus `quarantineDisposition` in graph quarantine CSVs and
  reason summaries.
- `scripts/audit/__tests__/run-tenant-graph-reconciliation-tests.mjs` covers the new class and
  disposition behavior.

## QA / Validation

- Pass: `node scripts/audit/__tests__/run-tenant-graph-reconciliation-tests.mjs`
- Pass: `npm run audit:tenant-graph-reconciliation -- --tenant all --out /tmp/nexus-graph-disposition.1ZGmuR`
  - Output included: 7 tenants, 9,633 relationship rows, 4,454 candidates, 5,179 quarantined.
  - Proof check: 5,179 quarantined rows; 0 missing class or disposition.
  - Class counts: 4,660 `dangling_reference`; 519 `empty_endpoint_or_required_field_missing`.
- Pass: `npx eslint scripts/audit/tenant-graph-reconciliation.mjs scripts/audit/__tests__/run-tenant-graph-reconciliation-tests.mjs`
- Pass: `git diff --check`
- Pass: `npm run release:check`
  - Output included: `Release Control Gate passed`, `Release-relevant files: 2`,
    `Deploy Authority Gate passed`, and `Pilot Data Loader Gate passed`.

## Rollout Plan

Merge through a pull request. The repo-owned ACA deploy may run, but this is report-only and does
not activate graph materialization or product use.

## Deployment Authority

- Repo-owned deploy workflow: approved for this session if the PR merges.
- Shared runtime mutators: none.
- Approved image digest: produced by the repo-owned ACA main deploy if it runs.
- ACA runtime invariant: required only for deploy proof.
- Worker image invariant: required only for deploy proof.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product surface behavior changes.

## Rollback Plan

Revert the pull request to remove the new graph quarantine class/disposition fields from report
outputs.

## Audit Evidence

- Source SHA before this slice: `f2c129f3a817f0bbe4fdac8877976c1565b2926d`
- Graph evidence: `/tmp/nexus-graph-disposition.1ZGmuR`

## Known Gaps

This release does not mutate tenant data, create nodes, drop edges, write canonical stores,
materialize graph tables, refresh product projections, or make live-client truth claims.
