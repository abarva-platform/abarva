# 2026-08-15-scoped-relationship-resolution-repair — Scoped Relationship Resolution Repair

## Release ID

`2026-08-15-scoped-relationship-resolution-repair`

## Status

`candidate`

## Plain-English Summary

This change corrects scoped relationship endpoint resolution so the runtime layer refresh can
materialize the approved graph without quarantined relationship rows. It changes only existing
relationship references and reconciliation behavior; it does not add objects, create placeholder
nodes, or touch out-of-scope tenant packages.

## Layer Impact

Release lane: `tenant-context-layer-refresh`.

Layer 1 intake: one approved active relationship file is corrected in place.

Layer 2 reconciliation: technology ownership rows whose target was typed as a role but names an
existing function are resolved through the same system's declared organization-unit owner.

Layer 3 canonical graph: the graph reconciliation dry-run now plans all scoped relationship rows as
materializable candidates with zero quarantined rows.

Layer 4 products: no product projection or runtime read model is refreshed by this change.

## Client Applicability

- All clients: No.
- Specific clients: Only the two approved scoped synthetic tenant packages.
- Internal only: No.
- Public/demo only: Synthetic demo data only.
- Feature flag: None.

## Changes Included

- Corrected three relationship endpoints that used system IDs where the existing system display
  names were required.
- Added reconciliation normalization so technology ownership targets can resolve through the same
  system's existing organization-unit owner when a role-typed endpoint is actually a function label.
- Added a durable scoped layer-status report with source, canonical, graph, cube, hierarchy, metric,
  and drill-path volumetrics.

## QA / Validation

- `npm run data-build:runtime-layer-refresh -- [approved scoped tenants] --out-dir /tmp/nexus-layer-table-s0-code-final-d2c840a0 --build-version layer-table-s0-code-final-d2c840a0 --input-source-version d2c840a09c9420d2783c549653b00166049aedc7 --idempotency-key layer-table-s0-code-final-d2c840a0`
  - Result: `status=pass`, `relationshipRows=4355`, `relationshipCandidates=4355`,
    `quarantinedRelationships=0`, `graphTablesWritten=false`, `productReadModelsUpdated=false`.

## Rollout Plan

Merge through the normal PR path. The data becomes available to the approved runtime layer refresh
operator job after the repo-owned main deployment builds the merged commit image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge if this is included in the runtime refresh image.
- Shared runtime mutators: None in this PR.
- Approved image digest: Set by the repo-owned ACA main deploy workflow.
- ACA runtime invariant: Required before using the merged image for an operator job.
- Worker image invariant: Required before using the merged image for an operator job.
- Feature/env flag update path: None.
- Live signed-in proof required: Not by this PR alone.

## Rollback Plan

Revert this release commit to restore the prior relationship references. If a runtime layer refresh
has already been written from this commit, rerun the approved refresh operator job with the rollback
commit and a new idempotency key.

## Audit Evidence

- Runtime refresh dry-run artifact: `/tmp/nexus-layer-table-s0-code-final-d2c840a0/summary.json`
- Graph reconciliation dry-run artifact:
  `/tmp/nexus-layer-table-s0-code-final-d2c840a0/graph-reconciliation/summary.json`
- Durable repo report: `reports/tenant-layer-refresh-2026-08-15/scoped-layer-status.md`

## Known Gaps

Canonical writes, graph table materialization, Layer 4 projection refresh, retrieval indexing, and
signed-in runtime proof are separate approved execution steps and are not performed by this PR.
