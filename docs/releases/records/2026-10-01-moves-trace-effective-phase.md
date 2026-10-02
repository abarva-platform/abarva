# 2026-10-01 — Moves Decision Trace Uses Effective Phase

## Release ID

`2026-10-01-moves-trace-effective-phase`

## Status

`candidate`

## Plain-English Summary

The Moves Decision Trace now presents the phase confirmed by current evidence and gate checks, rather than a stored phase that may be ahead of the verified workflow. When the stored phase is ahead, the trace labels the state as requiring gate review.

## Layer Impact

- **Release lane: `global-control-lane`.** The Moves Decision Trace read path now uses the shared effective-phase resolver. It changes display only and does not write Move state or relax a gate.

## Client Applicability

- All clients: Yes. The read-only trace presents the phase already used by the phase workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Decision Trace page projects the Move through the shared effective-phase resolver before rendering.
- Trace view-model projection labels an ahead-of-gate stored phase as requiring gate review.
- Regression tests cover both stale stored phase and unchanged effective phase.

## QA / Validation

- `jest --runTestsByPath src/lib/programs/__tests__/cross-module-trace-view.test.ts --runInBand` — 16 passed.
- Targeted ESLint for the changed page, view-model, and test — passed.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pending.
- CI typecheck and reasoning-layer tests — pending.
- Signed-in trace verification — pending deployment.

## Rollout Plan

Merge through a reviewed pull request. The repo-owned ACA main deploy workflow builds and deploys the merged commit. No migration, worker behavior, or feature flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending the exact merged-SHA deploy run.
- ACA runtime invariant: Must be verified after deployment before calling the change live.
- Worker image invariant: Verify worker jobs remain aligned with the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; confirm the trace phase and gate-review label match the effective phase workspace state.

## Rollback Plan

Revert the application change through a follow-up pull request and deploy it through the repo-owned ACA main deploy workflow. No data migration or persisted state needs rollback.

## Audit Evidence

- Pull request and CI results — pending.
- Exact-SHA ACA deploy run, runtime image invariant, and signed-in trace check — pending.

## Known Gaps

This display correction does not approve a gate, change a stored phase, or repair missing governed approvals. Gate approval remains a separate, explicit workflow action.
