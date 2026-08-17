# 2026-08-16-governed-layer-refresh-execution — Governed Layer Refresh Execution

## Release ID

`2026-08-16-governed-layer-refresh-execution`

## Status

`executed`

## Plain-English Summary

Records the governed layer refresh execution for the currently approved active scope. The run used
the repo-owned ACA image for commit `e2ecadcfcd25544bde4772cf16a7499df9e388ae`, wrote Layer 3
canonical and graph tables through the private ACA operator job, independently read those writes
back with tenant isolation checks, then refreshed and read back the governed Source Layer 4 read
models and cube-facing consumption views for the same build.

This record is deliberately precise about the boundary: Layer 3 and Source Layer 4 are
write/readback-proven for this build. Product-specific write adapters for Tower, Moves, and
Intelligence are not claimed by this execution record.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 1: Active source files were consumed as the input source for the canonical build.
- Layer 2: Adapter dry-run was previously clean for the active scope; no adapter registry activation
  was performed by this execution.
- Layer 3: Canonical business records, relationship edge rows, graph nodes, graph edges, graph
  quality reports, and refresh-run status were written and read back.
- Layer 4: Governed Source read models and cube-facing consumption views were written and read back
  for the same build. Other product read-model writers are outside this execution.

## Client Applicability

- All clients: No.
- Specific clients: Current approved active scope only.
- Internal only: Governed refresh execution and proof review.
- Public/demo only: No.
- Feature flag: None changed.

## Changes Included

- Executed `data-build:runtime-layer-refresh` through the shared ACA operator job with write approval
  enabled for the current active scope.
- Executed `data-build:runtime-layer-refresh:readback` through the shared ACA operator job with
  expected table counts and RLS verification.
- Executed `data-build:source-l4-cube-refresh` through the shared ACA operator job, reading from the
  just-written Layer 3 build and writing Source Layer 4/cube rows.
- Restored the shared operator job to its documented idle state after each run.

## QA / Validation

- PASS: ACA main deploy run `31980041553` completed for commit
  `e2ecadcfcd25544bde4772cf16a7499df9e388ae`.
- PASS: Runtime invariant proof in
  `/tmp/nexus-aca-main-deploy-31980041553.e2ecadcf.proof.1786924577/runtime-invariant/runtime-invariant-proof.json`
  reports `passed: true`, active revision `ca-abarva-web-lab-eastus--me2ecadcf`, and 100% traffic on
  image digest `sha256:f26f0f07ba787e4f01cbee7dc2fb99968ba4bc1482f065e0b75213c184542bfc`.
- PASS: Runtime layer refresh job execution `job-abarva-private-operator-eus-3s8kbb9` succeeded.
- PASS: Runtime layer refresh proof in
  `/tmp/nexus-runtime-layer-refresh-aca-job.1786924752/proof/nexus-runtime-layer-refresh-e2ecadcf/summary.json`
  reports 9,676 canonical records written, 5,556 raw relationship edges written, 1,751 graph nodes
  written, 5,556 graph edges written, and 64 quarantined relationships.
- PASS: Runtime layer readback job execution `job-abarva-private-operator-eus-c7x6taz` succeeded.
- PASS: Runtime layer readback proof in
  `/tmp/nexus-runtime-layer-refresh-readback-aca-job.1786924873/proof/nexus-runtime-layer-refresh-readback-e2ecadcf/summary.json`
  reports 0 failures and matching counts for `intelligence_v6.business_records`,
  `intelligence_v6.relationship_edges`, `intelligence_v6.graph_nodes`,
  `intelligence_v6.graph_edges`, and `intelligence_v6.graph_quality_reports`.
- PASS: Runtime readback RLS verification reports 0 failures.
- PASS: Source Layer 4 cube refresh job execution `job-abarva-private-operator-eus-9mhes5n`
  succeeded.
- PASS: Source Layer 4 proof in
  `/tmp/nexus-source-l4-cube-refresh-aca-job.1786925006/proof/nexus-source-l4-cube-refresh-e2ecadcf/summary.json`
  reports 9,676 canonical records read from the Layer 3 build, 137 vendors, 137 contracts, 196
  contract scope rows, 137 spend observations, and 71 sourcing opportunities projected, persisted,
  and read back.
- PASS: Source cube readback reports current-build scoped zeros for performance/event cubes rather
  than stale legacy rows.
- PASS: Operator job idle verification reports `idleVerified: true` for all three ACA job runs.

## Rollout Plan

Already executed through the approved ACA operator job path using the digest-pinned repo-owned image.
No additional rollout action is performed by this record.

## Deployment Authority

- Repo-owned deploy workflow: Completed in run `31980041553`.
- Shared runtime mutators: None beyond the repo-owned deploy workflow.
- Data-plane writes: Performed by the shared private ACA operator job with explicit write approval
  environment gates.
- Registry activation: None.
- Tenant data deletion/move: None.
- Feature/env flag update path: None.
- Live signed-in proof required: Post-deploy crawl run `31980470640` is tracked separately.

## Rollback Plan

Use the recorded build version and idempotency key to identify rows written by this execution. A
rollback must be handled as a scoped data-plane operator job that removes or supersedes only rows
for this build version, then independently reads back the prior active build state before any product
claim is made.

## Audit Evidence

- Deploy proof artifact:
  `/tmp/nexus-aca-main-deploy-31980041553.e2ecadcf.proof.1786924577`.
- Runtime refresh proof artifact:
  `/tmp/nexus-runtime-layer-refresh-aca-job.1786924752`.
- Runtime readback proof artifact:
  `/tmp/nexus-runtime-layer-refresh-readback-aca-job.1786924873`.
- Source Layer 4 proof artifact:
  `/tmp/nexus-source-l4-cube-refresh-aca-job.1786925006`.

## Known Gaps

Home reads governed Source L4 summary values where present, and Source reads the refreshed Source
Layer 4/cube rows. Tower, Moves, and Intelligence still need governed product-specific write adapters
or runtime read adapters from the same Layer 3 build before this work can be called a full
all-product Layer 4 refresh. Retrieval indexing and live-client truth claims are not covered by this
record.
