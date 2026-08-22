# 2026-08-21-moves-ava-complete-inputs-draft-action — Moves aVa Complete Inputs Draft Action

## Release ID

`2026-08-21-moves-ava-complete-inputs-draft-action`

## Status

`candidate`

## Plain-English Summary

The Moves aVa panel no longer offers `Draft proposed inputs` when the current phase already has all required input fields populated. Instead, it shows a short complete-state note and keeps the blocker-check action available. This removes a dead-end click path on complete phases without changing how missing-input phases request cited drafts.

## Layer Impact

Layer 4 Products only. The change affects the Moves page UI state for the aVa helper panel. It does not change tenant intake, adapters, canonical data, projections, gates, persistence, or data-plane state.

## Client Applicability

- All clients: Moves phase pages.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- Hides the aVa draft action when `phaseCaptureMissingCount` is zero.
- Shows `Inputs complete. Ask aVa to refine or check blockers.` for complete phases.
- Adds component coverage proving complete phases do not render the draft action while blocker checks remain available.

## QA / Validation

- `npx jest --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` passed.
- Typecheck, focused ESLint, release control, and staged secret scan must pass before merge.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Yes, approved for this session.
- Shared runtime mutators: None beyond the repo-owned deploy workflow.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify the complete-phase aVa panel after deploy.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main workflow. No data rollback is required.

## Audit Evidence

- PR URL, merge SHA, CI checks, deploy run, runtime invariant proof, and signed-in browser proof to be attached after release.

## Known Gaps

This does not create an incomplete live Move for draft insertion proof. The existing component coverage still proves missing-input phases can request and insert cited local drafts without saving.
