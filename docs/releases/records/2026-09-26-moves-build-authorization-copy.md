# 2026-09-26-moves-build-authorization-copy — Moves Build Authorization Copy

## Release ID

`2026-09-26-moves-build-authorization-copy`

## Status

`candidate`

## Plain-English Summary

The phase-level Moves dialog for `Approve & Build` no longer describes the action as a gate approval. It now states that the signed-in user is authorizing a governed build, and that generated deliverables still require review and sign-off before the phase gate can pass.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Updates Strategic Moves UI copy only. The underlying phase gate, deliverable sign-off rules, and server mutations are unchanged.

## Client Applicability

- All clients: Applies wherever Strategic Moves phase `Approve & Build` is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/GateApprovalConfirmDialog.tsx`
- `src/components/strategic-moves/PhaseApproveAndBuild.tsx`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- `NODE_PATH=$PWD/node_modules ./node_modules/.bin/jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — passed, 79 tests.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow publishes the UI copy change with the next web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by the deploy workflow after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment, although this change affects web UI only.
- Feature/env flag update path: None.
- Live signed-in proof required: Verify the `Approve & Build` confirmation dialog says build authorization and does not say `Approving as`.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA workflow. No migration or data rollback is required.

## Audit Evidence

- Pull request for this release.
- Focused Strategic Moves UI test output.
- Post-deploy signed-in screenshot or accessibility text of the `Approve & Build` confirmation dialog.

## Known Gaps

This PR does not change who may sign off deliverables, does not auto-advance any Move, and does not clear the P1-to-P2 gate. A signed-in runtime proof should still be captured after deployment because this is a user-facing governance copy fix.
