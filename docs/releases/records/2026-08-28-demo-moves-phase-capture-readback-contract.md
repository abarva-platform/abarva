# 2026-08-28-demo-moves-phase-capture-readback-contract — Demo Moves Phase-Capture Readback Contract

## Release ID

`2026-08-28-demo-moves-phase-capture-readback-contract`

## Status

`candidate`

## Plain-English Summary

This release fixes the operator readback contract for a demo Moves activation load. The load already writes completed phase-capture module rows; the readback now reports those rows explicitly so the governed job can distinguish a missing load from a missing proof field.

## Layer Impact

Release lane: `client-data-lane`.

Layer 2 / operator pipeline: updates the governed activation execute wrapper readback query and idempotency comparison.

Layer 4 / product projection support: no product UI is changed, but the proof contract now validates the phase-detail data that Strategic Moves reads after activation.

## Client Applicability

- All clients: No.
- Specific clients: Synthetic/demo Meridian readiness lane only.
- Internal only: Operator proof path for a demo activation load.
- Public/demo only: Yes, demo data only.
- Feature flag: None.

## Changes Included

- `scripts/ecl/execute_meridian_phs_moves_activation_load.mjs`
- `scripts/ecl/__tests__/run-meridian-phs-moves-activation-execute-tests.mjs`

## QA / Validation

- `npm run test:ecl-meridian-phs-moves-activation-execute` passed.
- `npm run test:ecl-meridian-phs-moves-activation` passed.
- `git diff --check` passed.
- `npm run release:check -- --base origin/main --head HEAD` must pass before merge.

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the updated image. The governed ACA operator job can then be rerun from the digest-pinned image to validate phase-capture row readback.

## Deployment Authority

- Repo-owned deploy workflow: Required for live image rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: Resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required before claiming live rollout.
- Worker image invariant: Required by the repo-owned deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming Strategic Moves phase-detail proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. This change does not alter persisted data shape; any already-written activation rows remain governed demo rows and can be reloaded by the previous script if needed.

## Audit Evidence

- PR URL after creation.
- Local test output for both activation test commands.
- Release check output.
- ACA deploy workflow run after merge.
- Governed ACA operator job output after rerun.
- Signed-in browser proof for Strategic Moves phase detail after rerun.

## Known Gaps

This release only fixes the readback/proof contract. It does not itself rerun the data-build job and does not claim browser proof.
