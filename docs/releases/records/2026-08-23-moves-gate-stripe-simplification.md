# 2026-08-23-moves-gate-stripe-simplification — Moves gate clarity and persisted build reconciliation

## Release ID

`2026-08-23-moves-gate-stripe-simplification`

## Status

`candidate`

## Plain-English Summary

The Moves phase gate page now reads more like a focused decision surface: one visible decision card, a direct "why blocked" explanation, and audit mechanics below the primary story. The phase build panel also reconciles against already-persisted generated deliverables on fresh page load, so it no longer reports previously built outputs as `0/n built` merely because they were not generated in the current browser session.

## Layer Impact

- **Layer 4 — Products / `global-control-lane`:** Updates the Moves product projection and UI state reconciliation only. It reads existing Move artifact registry rows and changes presentation; it does not create, mutate, delete, or promote canonical data.

## Client Applicability

- All clients: Yes, wherever the Moves phase workspace is enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/components/strategic-moves/PhaseApproveAndBuild.tsx`
- `src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx`

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx --runInBand` — pass.
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand -t "gate approval|hard gate|reserves bottom safe area|evidence-item counts"` — pass.
- Full lint, typecheck, release gate, PR checks, deploy proof, and signed-in visual proof are required before marking released.

## Rollout Plan

Merge through a PR to `main`. The repo-owned ACA main deploy workflow will build and deploy the resulting image. No manual Azure command, data-plane load, migration, registry activation, or feature flag change is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime rollout.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be captured by the ACA deploy workflow.
- ACA runtime invariant: Required before live claim.
- Worker image invariant: Standard workflow invariant applies.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, the phase gate page must show persisted build counts and the simplified blocker explanation.

## Rollback Plan

Revert the PR and let the repo-owned ACA deploy workflow roll forward to the reverted image. No data rollback is needed because this release is read-only against the artifact registry and changes only presentation/state reconciliation.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6696
- ACA deploy run: pending.
- Signed-in proof bundle: pending.

## Known Gaps

- This does not implement the separate client-readiness scanner or artifact content scanner.
- This does not change gate rules, evidence rules, role approvals, canonical data, Source, Tower, or data-layer refresh behavior.
