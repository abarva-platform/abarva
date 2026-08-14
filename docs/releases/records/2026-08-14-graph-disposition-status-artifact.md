# 2026-08-14-graph-disposition-status-artifact — Graph disposition status artifact

## Release ID

`2026-08-14-graph-disposition-status-artifact`

## Status

`candidate`

## Plain-English Summary

Adds a sanitized graph disposition status report so the current quarantine blocker is preserved in
the repository instead of only in temporary dry-run output. The report uses tenant aliases and
omits row-level object names and source paths.

## Layer Impact

- Affected release lane: `client-data-lane`.
- Layer 1 Client Intake: read-only; no source files or template contracts are changed.
- Layer 2 Source Adapters: unchanged.
- Layer 3 Canonical Enterprise Model: report-only graph disposition artifact; no canonical store,
  registry, or graph table is activated.
- Layer 4 Products: unchanged; no projection or product read model is refreshed.

## Client Applicability

- All clients: graph disposition status can be generated from quarantine-first dry-run output.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/build-graph-disposition-status-report.mjs` creates sanitized JSON and Markdown
  graph disposition status artifacts from graph reconciliation output.
- `package.json` adds `audit:graph-disposition-status`.
- `reports/graph-disposition-status/current-main/graph-disposition-status.json` records current
  graph disposition status for `origin/main`.
- `reports/graph-disposition-status/current-main/graph-disposition-status.md` provides the compact
  human-readable status.

## QA / Validation

- Pass: `npm run audit:tenant-graph-reconciliation -- --tenant all --out /tmp/nexus-graph-status.1hCyv6/graph`
  - Output included: 7 tenants, 9,633 relationship rows, 4,454 candidates, 5,179 quarantined.
- Pass: `npm run audit:graph-disposition-status -- --graph-dir /tmp/nexus-graph-status.1hCyv6/graph --out-dir reports/graph-disposition-status/current-main --source-sha 933a381c9bb3be9b919cd210892c56dcfb71cf71`
  - Output included: 5,179 quarantined rows and 0 missing class/disposition.
- Pass: `node --check scripts/audit/build-graph-disposition-status-report.mjs`
- Pass: `npx eslint scripts/audit/build-graph-disposition-status-report.mjs`
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

Revert the pull request to remove the report builder and the sanitized graph disposition status
artifact.

## Audit Evidence

- Source SHA: `933a381c9bb3be9b919cd210892c56dcfb71cf71`
- Generated report: `reports/graph-disposition-status/current-main/graph-disposition-status.json`
- Generated report: `reports/graph-disposition-status/current-main/graph-disposition-status.md`
- Dry-run evidence: `/tmp/nexus-graph-status.1hCyv6/graph`

## Known Gaps

This release does not reduce quarantine by mutating tenant data, creating nodes, retiring source
edges, activating registries, writing canonical stores, materializing graph tables, refreshing Layer
4 projections, or making live-client truth claims.
