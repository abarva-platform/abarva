# 2026-08-27-ecl-source-evidence-consumption-object-batch-retirement-proof — ECL Source/Evidence/Consumption Object Retirement Proof

## Release ID

`2026-08-27-ecl-source-evidence-consumption-object-batch-retirement-proof`

## Status

`candidate`

## Plain-English Summary

Records accepted proof that a controlled batch of retired source, evidence, consumption, and related public-schema data-plane objects was removed through the governed private-operator cleanup workflow and then proven absent by a separate dry-run readback. The four-lane ECL completion status now credits this batch only after the post-apply absence proof reports zero discovered objects.

## Layer Impact

- Layer 3 canonical/model substrate: no active ECL canonical table is changed.
- Layer 4 product projections: no active ECL projection or serving view is changed.
- Retired legacy data plane: status documentation now records another retired-object batch proven absent in Azure.

## Client Applicability

- All clients: applies to shared platform cleanup accounting only.
- Specific clients: none.
- Internal only: release/status governance and cleanup evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `docs/architecture/ecl-source-evidence-consumption-object-batch-retirement-proof-2026-08-27.json`.
- Updates `scripts/ecl/write_ecl_four_lane_completion_status.mjs` to include the new object-batch proof in default cleanup accounting.
- Updates `docs/architecture/ecl-four-lane-completion-status.json` from `156/851` to `188/851` for L-CLEANUP.
- Updates the four-lane status test fixture to enforce the new cleanup denominator movement.

## QA / Validation

- Pre-apply dry-run workflow run `33048257249` completed successfully.
- Live apply workflow run `33049569842` completed successfully.
- Separate post-apply absence workflow run `33049800417` completed successfully.
- Post-apply proof reports 28 targets, 0 discovered objects, 0 outside dependencies, 0 active code references, and idle restored/verified.
- Local validation commands are recorded in the pull request.

## Rollout Plan

Merge to `main`. No runtime deploy is required for this documentation/status change. Future status generation will include the proof by default once this commit is present in the repo-owned deployment image.

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

- Pre-apply dry-run workflow: `https://github.com/abarva-platform/abarva/actions/runs/33048257249`
- Apply workflow: `https://github.com/abarva-platform/abarva/actions/runs/33049569842`
- Post-apply absence workflow: `https://github.com/abarva-platform/abarva/actions/runs/33049800417`
- Proof artifact: `docs/architecture/ecl-source-evidence-consumption-object-batch-retirement-proof-2026-08-27.json`
- Status artifact: `docs/architecture/ecl-four-lane-completion-status.json`

## Known Gaps

Legacy data-plane retirement remains incomplete; this records one accepted batch, not completion of L-CLEANUP.
