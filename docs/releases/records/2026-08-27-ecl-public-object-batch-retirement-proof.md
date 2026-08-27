# 2026-08-27-ecl-public-object-batch-retirement-proof — ECL Public Object Retirement Proof

## Release ID

`2026-08-27-ecl-public-object-batch-retirement-proof`

## Status

`candidate`

## Plain-English Summary

Records accepted proof that a controlled batch of retired public-schema data-plane objects was removed through the governed private-operator cleanup workflow, then independently checked with a separate dry-run readback. The four-lane ECL completion status now credits the removed objects only after that absence proof is present.

## Layer Impact

- Layer 3 canonical/model substrate: no active ECL canonical table is changed.
- Layer 4 product projections: no active product projection is changed.
- Retired legacy data plane: status documentation now records one additional retired-object batch proven absent in Azure.

## Client Applicability

- All clients: applies to shared platform cleanup accounting only.
- Specific clients: none.
- Internal only: release/status governance and cleanup evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `docs/architecture/ecl-public-object-batch-retirement-proof-2026-08-27.json`.
- Updates `scripts/ecl/write_ecl_four_lane_completion_status.mjs` to include the batch proof in default cleanup accounting.
- Updates `docs/architecture/ecl-four-lane-completion-status.json` from `35/851` to `61/851` for L-CLEANUP.
- Updates the four-lane status test fixture to enforce the new cleanup denominator movement.

## QA / Validation

- Live apply workflow run `33032484335` completed successfully.
- Separate post-apply dry-run workflow run `33033065787` completed successfully.
- Post-apply proof reports 22 targets, 0 discovered objects, 0 outside dependencies, 0 active code references, and idle restored/verified.
- Local validation commands are recorded in the pull request.

## Rollout Plan

Merge to `main`. No runtime deploy is required for the documentation/status artifact itself. Future status generation will include the proof by default once this commit is present in the repo-owned deployment image.

## Deployment Authority

- Repo-owned deploy workflow: not required for this documentation/status change.
- Shared runtime mutators: none in this PR.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR to remove the status credit and proof linkage. The already-executed Azure object retirement is not reversed by reverting documentation; restoring any retired object would require a separate governed restore or migration action.

## Audit Evidence

- Apply workflow: `https://github.com/abarva-platform/abarva/actions/runs/33032484335`
- Post-apply absence workflow: `https://github.com/abarva-platform/abarva/actions/runs/33033065787`
- Proof artifact: `docs/architecture/ecl-public-object-batch-retirement-proof-2026-08-27.json`
- Status artifact: `docs/architecture/ecl-four-lane-completion-status.json`

## Known Gaps

Legacy data-plane retirement remains incomplete; this records one accepted batch, not completion of L-CLEANUP.
