# 2026-08-16-integrated-healthcare-tenant-input — Integrated Healthcare Tenant Input Baseline

## Release ID

`2026-08-16-integrated-healthcare-tenant-input`

## Status

`candidate`

## Plain-English Summary

Consolidates the duplicate synthetic healthcare tenant-input lane into one active repo-local healthcare example. The active healthcare packet now uses the universal template contract, removes the prior column-contract waiver, and resolves its relationship graph without placeholder node creation.

This is a repository data-package change only. It does not load canonical data, materialize graph tables, refresh product projections, index retrieval content, or prove runtime behavior.

## Layer Impact

Layer 1 client intake: Updates the active synthetic healthcare input files and registry state so there is one active healthcare packet.

Layer 2 source adapters: Uses the existing adapter/gate path to validate the integrated packet against the universal template manifest. No adapter contract is activated or changed by this record.

Layer 3 canonical model: Produces report-only canonical object and relationship candidates through the graph reconciliation audit. No canonical/data-plane write and no graph materialization is included.

Layer 4 products: No projection refresh, product routing change, or runtime read-model change is included.

## Client Applicability

- All clients: No runtime impact.
- Specific clients: None.
- Internal only: Synthetic/demo healthcare tenant-input package and validation evidence.
- Public/demo only: Client-facing explanation artifact for how templates and synthetic examples should be interpreted.
- Feature flag: None.

## Changes Included

- Consolidates the active synthetic healthcare input package under `datasets/tenant-inputs/active/meridian-health/current`.
- Retires the duplicate active healthcare registry entry from `datasets/tenant-inputs/tenant-input-registry.json`.
- Removes the no-longer-needed healthcare column-contract waiver from `datasets/tenant-inputs/templates/universal/standard-2026-07-v3/quality-depth-rules.json`.
- Deactivates stale anonymized semantic-alias approvals whose tenant numbering changed after registry consolidation.
- Repairs relationship endpoints to resolve against source-backed existing or newly catalogued rows; no placeholder ID rows are introduced.
- Adds `docs/demo/integrated-healthcare-template-synthetic-data-walkthrough.md` for template and synthetic-data explanation.

## QA / Validation

- Pass: `npm run audit:tenant-input-quality -- --out-dir /tmp/nexus-healthcare-integrated-quality`
  - Result: 6 active tenants audited.
- Pass: `npm run audit:tenant-graph-reconciliation -- --tenant meridian-health --out /tmp/nexus-healthcare-integrated-graph/meridian-health`
  - Result: 2,302 relationship rows, 2,302 candidates, 0 quarantined.

## Rollout Plan

Merge through PR. No runtime rollout is required for this repository-local tenant-input baseline.

Any later canonical load, graph materialization, retrieval indexing, Layer 4 projection refresh, or runtime proof requires its own approved data-build or deployment lane.

## Deployment Authority

- Repo-owned deploy workflow: Not required by this change.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR to restore the prior registry and active input files. Because this change performs no data-plane write, graph materialization, projection refresh, or runtime activation, rollback is repository-only.

## Audit Evidence

- Local tenant input quality report: `/tmp/nexus-healthcare-integrated-quality/tenant-input-quality-depth.md`
- Local graph reconciliation report: `/tmp/nexus-healthcare-integrated-graph/meridian-health`
- Client-facing template walkthrough: `docs/demo/integrated-healthcare-template-synthetic-data-walkthrough.md`

## Known Gaps

- The synthetic healthcare packet remains planning-grade until client evidence or workshop sign-off exists.
- Vendor contract documents must be generated from the structured contract register and reconciled back to it before procurement-facing use.
- No canonical load, graph materialization, retrieval indexing, Layer 4 refresh, or runtime proof is included in this release candidate.
