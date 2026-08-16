# 2026-08-16-source-l4-cube-refresh-runner — Source L4 Cube Refresh Runner

## Release ID

`2026-08-16-source-l4-cube-refresh-runner`

## Status

`candidate`

## Plain-English Summary

Adds a governed operator runner that projects the approved Layer 3 runtime refresh into Source-facing Layer 4 read models and Cube-facing consumption views. The runner is scoped to the approved synthetic demonstration tenants, refuses out-of-scope tenants, and emits proof covering projected row counts, readback counts, and the cube hierarchy/drill-path surfaces that become available.

## Layer Impact

Release lane: `client-data-lane` for the bounded synthetic tenant projection runner, with `internal-admin` operator tooling.

Layer 3 Canonical Model: Reads the already-materialized runtime baseline from `intelligence_v6.business_records` when used in write/readback mode. It does not change object identity rules.

Layer 4 Products: Updates Source read-model tables and Cube-facing consumption views through the governed Source schema. This is the product projection step after the Layer 3 refresh.

## Client Applicability

- All clients: No.
- Specific clients: Approved synthetic demonstration scope only.
- Internal only: Operator tooling and proof bundle.
- Public/demo only: Yes, for synthetic demonstration data.
- Feature flag: None.

## Changes Included

- `scripts/data-build/refresh-source-l4-cube.ts`
- `package.json` commands:
  - `data-build:source-l4-cube-refresh`
  - `data-build:source-l4-cube-refresh:readback`

## QA / Validation

Candidate validation:

- `pass`: Local dry-run of `npm run data-build:source-l4-cube-refresh -- --out-dir /tmp/nexus-source-l4-cube-dry-4f2dfe52 --build-version runtime-layer-refresh-2026-08-16-4f2dfe52-l4-dry --input-source-version 4f2dfe52f --idempotency-key runtime-layer-refresh:4f2dfe52:meridian-skyharbor:l4-dry`.
- `pass`: Focused ESLint for the runner, `npx eslint scripts/data-build/refresh-source-l4-cube.ts`.
- `pass`: `npm run release:check`.

Post-merge/operator validation:

- `pending`: Repo-owned ACA deploy workflow.
- `pending`: ACA operator write with `SOURCE_L4_CUBE_WRITE_APPROVED=true`.
- `pending`: Independent readback through `data-build:source-l4-cube-refresh:readback`.
- `pending`: Source/Cube parity checks for the governed consumption views.

## Rollout Plan

Merge through PR, deploy through the repo-owned ACA main deploy workflow, then run the bounded ACA operator job with the approved tenant scope and exact build identity. The runner writes only when the explicit write approval environment variable is present.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: Repo-owned ACA main deploy only.
- Approved image digest: Captured by the ACA deploy workflow after merge.
- ACA runtime invariant: Required before claiming the runner is available in the deployed image.
- Worker image invariant: Required for the ACA operator job.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming Home, Source, Vendor 360, or Cube surfaces are refreshed in runtime.

## Rollback Plan

Revert the PR to remove the runner and package commands. If a write has run, rerun the prior Source L4 projection or use the proof bundle to identify rows stamped with the runner build version; do not delete or move tenant data without a separate scoped approval.

## Audit Evidence

- PR URL after opening.
- Local dry-run summary JSON.
- Release gate output.
- ACA deploy run and image digest after merge.
- ACA operator proof bundle and independent readback bundle after execution.

## Known Gaps

The runner updates governed Source L4 read models and Cube-facing consumption views. Source V4 canary/raw-source-only slices remain separately reported until they are retired or reprojected into the governed consumption path.
