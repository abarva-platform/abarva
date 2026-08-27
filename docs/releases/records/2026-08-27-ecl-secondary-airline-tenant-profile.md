# 2026-08-27-ecl-secondary-airline-tenant-profile — Secondary Active Tenant ECL Profile

## Release ID

`2026-08-27-ecl-secondary-airline-tenant-profile`

## Status

`candidate`

## Plain-English Summary

Adds profile-aware ECL dense source-room generation and tenant-scoped all-layer loading so the second active synthetic tenant can be loaded through the same governed ECL path without reusing the healthcare-shaped fixture.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 source simulation now supports a separate airline-shaped profile with airline functions, application products, infrastructure categories, KPIs, AI use cases, cost baseline, and contract baseline.

Layer 2 and Layer 3 loader scripts now take tenant, assessment, enterprise identity, and profile values from environment variables while preserving the existing default behavior.

Layer 4 projection and cube builders now honor the tenant/profile values used by the context layer, preventing cross-profile enterprise-object FK drift.

## Client Applicability

- All clients: no direct client-data change.
- Specific clients: none.
- Internal only: applies to synthetic fixture and lab/preprod proof execution.
- Public/demo only: enables the second active synthetic tenant to receive its own ECL proof lane.
- Feature flag: none.

## Changes Included

- `scripts/ecl/generate_dense_source_room_extracts.py`
- `scripts/ecl/validate_dense_source_room_extracts.py`
- `scripts/ecl/load_dense_source_room_source_layer.py`
- `scripts/ecl/load_dense_source_room_context_layer.py`
- `scripts/ecl/load_dense_source_room_commercial_layer.py`
- `scripts/ecl/load_dense_source_room_review_layer.py`
- `scripts/ecl/load_dense_source_room_source_projection_layer.py`
- `scripts/ecl/load_dense_source_room_cube_layer.py`
- `scripts/ecl/execute_dense_all_layer_load.py`

## QA / Validation

Local validation was run in a clean worktree against the secondary active tenant profile:

- Dense source-room generation: 14 source families, 7,080 rows, 750 applications, 1,350 flows, 1,650 deployments.
- Dense source-room validator: passed.
- ECL source local proof: passed with 14 source files, 7,080 source records, 720 documents, 250 document extractions.
- ECL context local proof: passed with 3,899 objects, 9,066 relationships, 13,190 measures, zero relationship/metric drift.
- ECL commercial local proof: passed with 230 contracts, 690 scope rows, 480 invoice lines, 260 SLA observations, zero contract/vendor/scope drift.
- ECL review local proof: passed with 744 review events and zero review subject drift.
- ECL projection local proof: passed with 12 projection manifests, 40 populated serving views, 930 command-center rows, 710 value-chain rows, and zero projection drift.
- ECL cube local proof: passed with 9 cube manifests, 29 cube slices, 4,320 measure FK rows, 103 metric FK rows, and zero cube drift.
- Planted FK/check failures rejected under the secondary tenant slice across context, commercial, review, projection, and cube layers.

## Rollout Plan

Merge to main through PR. The repo-owned ACA main deploy workflow builds and deploys the new image. A governed ACA data-build job can then run the secondary active tenant profile with explicit tenant, assessment, and profile environment values, followed by a separate readback execution and signed-in route proof.

## Deployment Authority

- Repo-owned deploy workflow: required for web image update.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required if a worker image is updated.
- Feature/env flag update path: none.
- Live signed-in proof required: required after the secondary tenant data-build job and readback pass.

## Rollback Plan

Revert the PR to restore the single-profile dense source-room behavior. Any data loaded by a governed job remains tenant/assessment-scoped and can be replaced by rerunning the prior known-good load for that slice.

## Audit Evidence

- Local proof summaries under clean-worktree report directories.
- Dense all-layer plan-only output for the secondary tenant slice.
- PR, CI, deploy, ACA data-build, readback, and browser-proof URLs to be added after execution.

## Known Gaps

This release enables and locally proves the secondary tenant ECL lane. It does not itself mutate Azure, run the ACA data-build job, perform independent Azure readback, or prove signed-in browser routes.
