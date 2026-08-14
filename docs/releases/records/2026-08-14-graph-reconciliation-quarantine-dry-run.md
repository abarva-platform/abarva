# 2026-08-14-graph-reconciliation-quarantine-dry-run — Graph reconciliation quarantine dry-run

## Release ID

`2026-08-14-graph-reconciliation-quarantine-dry-run`

## Status

`candidate`

## Plain-English Summary

The tenant graph reconciliation lane now has a quarantine-first local job. It reads registry-declared
active intake roots, builds a temporary canonical node index from v3 mapping profiles, normalizes
relationship rows through the approved Layer 3 dictionary, and writes candidate plus quarantine
reports for operator review.

No graph table write, canonical store write, data-plane load, product read-model update, registry
activation, or runtime route change is included.

## Layer Impact

Release lane: `client-data-lane`. This is an offline Layer 3 graph-validation dry-run.

- **Layer 1:** active relationship and dimension CSV files are read only.
- **Layer 2:** current mapping profiles are used only to derive temporary node identities.
- **Layer 3:** relationship rows are classified as candidate-only or quarantined against the
  canonical object registry and relationship dictionary.
- **Layer 4:** unchanged; no product consumes the generated graph reports.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/tenant-graph-reconciliation.mjs` — adds the quarantine-first graph reconciliation
  dry-run job.
- `scripts/audit/__tests__/run-tenant-graph-reconciliation-tests.mjs` — verifies endpoint
  normalization, accepted candidate behavior, and quarantine reason capture.
- `package.json` — adds `npm run audit:tenant-graph-reconciliation`.
- `reports/graph-reconciliation-2026-08/` — report-only proof bundle for all active tenants.

## QA / Validation

| Check                             | Command                                                                                                                      | Result                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Graph reconciliation unit harness | `node scripts/audit/__tests__/run-tenant-graph-reconciliation-tests.mjs`                                                     | pass                                                                                            |
| Graph reconciliation dry-run      | `npm run audit:tenant-graph-reconciliation -- --tenant all --out reports/graph-reconciliation-2026-08`                       | pass — 7 active tenants, 9,633 relationship rows, 1,472 candidate-only edges, 8,161 quarantined |
| Script lint                       | `npx eslint scripts/audit/tenant-graph-reconciliation.mjs scripts/audit/__tests__/run-tenant-graph-reconciliation-tests.mjs` | pass                                                                                            |

## Rollout Plan

Merge to `main`. No runtime rollout. Operators can run the job locally to inspect relationship
readiness before any separately approved graph materialization job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not used.
- Live signed-in proof required: no.

## Rollback Plan

Revert the squash commit and remove the generated graph reconciliation proof bundle. No tenant data
or runtime state needs rollback because none is mutated.

## Audit Evidence

- Summary: `reports/graph-reconciliation-2026-08/summary.json`.
- Candidate edges: `reports/graph-reconciliation-2026-08/graph-edge-candidates.csv`.
- Quarantine report: `reports/graph-reconciliation-2026-08/graph-quarantine.csv`.

## Known Gaps

- The job does not materialize `intelligence_v6.graph_nodes` or `intelligence_v6.graph_edges`.
- Quarantined rows require dictionary, endpoint, source evidence, or intake remediation before any
  graph promotion.
