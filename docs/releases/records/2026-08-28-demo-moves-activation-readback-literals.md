# 2026-08-28-demo-moves-activation-readback-literals — Stabilize Moves Activation Readback

## Release ID

`2026-08-28-demo-moves-activation-readback-literals`

## Status

`candidate`

## Plain-English Summary

This release fixes the governed demo activation job readback query so it works consistently inside the Azure Container Apps operator job. The readback now uses escaped SQL literals instead of relying on psql variable interpolation in a `-c` query.

## Layer Impact

Release lane: `client-data-lane`.

Layer 2 — Source adapters and operators: the operator entrypoint can now verify the rows it loaded without failing on client-side SQL interpolation.

Layer 4 — Products: no direct product UI code changes. The fix supports the governed data load that powers demo product readiness.

## Client Applicability

- All clients: No.
- Specific clients: Synthetic demo tenant only.
- Internal only: No.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `scripts/ecl/execute_meridian_phs_moves_activation_load.mjs`
- `scripts/ecl/__tests__/run-meridian-phs-moves-activation-execute-tests.mjs`

## QA / Validation

- `npm run test:ecl-meridian-phs-moves-activation-execute` passed.
- `git diff --check` passed.

## Rollout Plan

Merge through PR, then allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the new digest. After deploy, rerun the governed ACA operator data job and read back the activation counts.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Resolved by the main deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming product readiness.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. No schema or persistent data rollback is introduced by this change.

## Audit Evidence

- PR and CI checks.
- ACA deploy workflow run.
- Governed ACA operator job output directory.
- Operator readback summary.

## Known Gaps

This change only fixes the readback query path. It does not itself load data or prove product UI readiness.
