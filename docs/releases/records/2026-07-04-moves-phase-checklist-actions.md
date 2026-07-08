# 2026-07-04-moves-phase-checklist-actions — Moves checklist actions + chat-decoupling contract (increment 5)

## Release ID

`2026-07-04-moves-phase-checklist-actions`

## Status

`candidate`

## Plain-English Summary

Two things. (1) The phase checklist's tasks become clickable: an active task's action scrolls the user down to the workspace controls (evidence upload + gate) where the work actually happens — the checklist never changes anything itself, it just takes you to the right control. (2) A test now enforces that the whole phase-workspace never depends on the chat/agent layer, so a change to chat can't break the workflow — the exact "functioning without breaking anything" guarantee. Behind the same `moves_phase_workspace_v2` flag (Lakeshore on).

## Layer Impact

- `global-control-lane` (flag-gated): checklist action pass-through + a client scroll handler; a CI contract test. Additive; no route/data/model change.
- `experimental`: gated by `moves_phase_workspace_v2` (off by default).

## Client Applicability

- All clients: no — off by default. Specific clients: **Lakeshore** (flag opt-in). Feature flag: `moves_phase_workspace_v2`.

## Changes Included

- `MovePhaseWorkspacePanel.tsx` — passes an optional `onTaskAction` to the checklist; adds an `id` to the panel root as the scroll anchor.
- `StrategicMovePhaseClient.tsx` — `focusWorkspaceControls` scroll handler wired to the checklist (scrolls to the controls below; never commits).
- `__tests__/phase-workspace-contract.test.ts` — new: enforces phase-workspace ⟂ chat/agent (no agent imports, no runtime context/flag hooks, no local React state) so chat can't break the workflow.
- `__tests__/phase-workspace.test.tsx` — +1 action-render test.
- No migrations, routes, scripts, or env changes.

## QA / Validation

- Jest 40/40 — **pass** (incl. the new contract suite + action-render test).
- esbuild parse of the edited client — **pass** (exit 0). Scoped strict `tsc` — **pass** (exit 0). ESLint — **pass** (exit 0).
- Live signed-in Lakeshore proof — **run post-deploy** (click a checklist action → scrolls to the workspace controls; recorded in the PR).
- Full-project `tsc --noEmit` — **not run** (red from an unrelated merge; doesn't block build/deploy given `ignoreBuildErrors: true`).

## Rollout Plan

Squash-merge → ACA main-deploy auto-deploys → live for Lakeshore. Same flag as increments 3–4.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (auto on merge). No ad-hoc Azure commands.
- Shared runtime mutators: none by hand. Approved image digest: the `main-<sha>` the workflow builds.
- ACA runtime invariant / worker invariant: confirmed by the feature rendering live on `app.abarva.ai`.
- Feature/env flag update path: code-defined flag; no shared-runtime env mutation.
- Live signed-in proof required: yes — checklist action scroll on the Lakeshore P2 page, post-deploy.

## Rollback Plan

Set the flag `includeTenants: []` (instant off) or revert the PR. No data impact.

## Audit Evidence

- PR URL: (added on open). Tests: jest 40/40 + scoped tsc 0 + eslint 0 + esbuild parse 0.
- Report: `reports/moves-phase-workflow-checklist-implementation-2026-07-04.md` (increment-4 report covers the checklist; this increment adds actions + the contract test).

## Known Gaps

- Actions scroll to the workspace controls (single write path); they intentionally do not commit. Per-control deep links (jump straight to the gate vs. the upload) are a refinement.
- Full-project `tsc --noEmit` red from an unrelated merge; does not block build/deploy or this change.
