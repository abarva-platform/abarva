# 2026-07-24-gate-approval-confirmation — Confirm-before-approve dialog for Moves phase gates

## Release ID

`2026-07-24-gate-approval-confirmation`

## Status

`released` — merged (#5556, commit `34335af96b406da13f0b59f0b6a798d98b6b97b8`), deployed, ACA
runtime invariant confirmed, and live-proven signed-in on `app.abarva.ai` (see Audit Evidence).

## Plain-English Summary

Approving a Strategic Moves phase gate — the P0 origination "Approve gate →" button, and the
P1–P5 "Approve & Build" button — used to submit the approval the instant a user clicked it: no
confirmation, no summary of what was about to happen, and no visible statement of who was
approving. This closes `MOVES-UI-010` from the 2026-07-24 gate-approval-clarity audit. Both
buttons now open a plain-language confirmation dialog first — it states what the approval does
(which gate, what it unlocks, what has no undo) and, when the signed-in session resolves to a
known identity, shows "Approving as: `email · role`". The actual mutation only fires from the
dialog's own confirm button; clicking Cancel (or the click-away overlay is not wired, only the
explicit Cancel button) closes the dialog with zero side effects — no fetch is made until
confirmed.

## Layer Impact

- **global-control-lane**: client-rendered UI change in the shared Strategic Moves phase workspace
  (`MovesPhaseStandaloneClient.tsx`, `PhaseApproveAndBuild.tsx`) and a new shared component
  (`GateApprovalConfirmDialog.tsx`). No server-side, database, or API contract change — the
  existing mutation endpoints (`/api/v1/programs/:id/phase-gate-approval`,
  `/api/v1/deliverables/generate-phase`) and their identity resolution
  (`resolvePhaseGateActorPersonId`) are unchanged. This is a client-side gate in front of an
  unmodified server path.

## Client Applicability

- All clients: yes — every tenant using the Strategic Moves phase workspace gets the
  confirmation step; there is no flag.
- Feature flag: none

## Changes Included

- `src/components/strategic-moves/GateApprovalConfirmDialog.tsx` (new) — reusable confirm dialog,
  reusing the existing `StrategicMoves.module.css` confirm-dialog CSS pattern already established
  in `StrategicMoveOriginateClient.tsx`.
- `src/components/strategic-moves/PhaseApproveAndBuild.tsx` — the "Approve & Build" button now
  opens the dialog; `approveAndBuild()` only fires from the dialog's confirm action. New
  `approverLabel` prop for display.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the P0 "Approve gate →" button
  now opens the dialog; `onApproveP0Gate()` only fires from the dialog's confirm action. New
  `currentUser` prop and a derived `approverLabel` (`"{email} · {role}"`) threaded to both mount
  points of `PhaseApproveAndBuild` and to the P0 dialog.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` — passes
  `currentUser={{ email: ctx.email ?? null, role: ctx.tenantRole ?? ctx.role ?? null }}` from the
  already-resolved `TenancyCtx`. Purely a display value — the server mutation resolves the actual
  approver identity itself via `resolvePhaseGateActorPersonId`, independent of this prop.
- `docs/backlog/moves-product-backlog.md` — `MOVES-UI-010` status updated from `Found, not fixed`
  to `Implemented`.

## QA / Validation

- `npx eslint` on all 4 changed/new source files — clean.
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit -p tsconfig.json` — clean (only 3
  pre-existing, unrelated `src/components/home/*` missing-module errors present before this
  change).
- `npx jest src/components/strategic-moves` — 154 passed, 0 failed. This includes:
  - 2 pre-existing tests in `MovesPhaseStandaloneClient.test.tsx` updated to click through the new
    confirmation dialog before asserting on post-approval/post-build behavior (they previously
    assumed the old click-fires-immediately behavior).
  - 3 pre-existing tests in `phase-approve-and-build-settle.test.tsx` updated the same way via a
    shared `clickApproveAndBuild()` test helper.
  - 4 new tests added: P0 dialog shows the approver identity and blocks the
    `/phase-gate-approval` fetch until confirmed; cancelling the P0 dialog performs no mutation;
    the phase-level dialog shows the approver identity and blocks
    `/api/v1/deliverables/generate-phase` until confirmed; cancelling the phase-level dialog
    performs no mutation and a subsequent confirm still succeeds.
  - 1 unrelated pre-existing test-suite failure (`moves-liability-visible-controls.test.tsx`,
    a Clerk ESM transform error in this worktree's `node_modules`) — confirmed via `git diff
    origin/main` to be untouched by this change, and is an existing worktree/jest-config issue,
    not a regression.
- Live signed-in browser verification (2026-07-24, post-deploy): navigated to
  `https://app.abarva.ai/strategic-moves/4d0e21b9-1812-44db-9268-a7fcff90f118/phase/5`
  (RETAIL-APEX-2026, a real, already-existing demo/canary Move at P5 Prepare to Execute — no new
  Move created, no approval confirmed), signed in as `anand.sundaram+apex@thesundaram.com ·
  tenant_admin`. Clicked "Approve & Build P5 Prepare to Execute →": the confirmation dialog opened
  and its rendered text read exactly:

  > Approve & build P5 Prepare to Execute?
  >
  > This generates all 2 P5 Prepare to Execute deliverables in one governed batch and closes the
  > phase gate once every document reaches a terminal state. There is no per-document regenerate
  > afterward — if an input changes, you'll re-run and re-approve the whole phase.
  >
  > Approving as: anand.sundaram+apex@thesundaram.com · tenant_admin

  confirming the real signed-in session's email/role render correctly, sourced from `TenancyCtx`,
  with no fabricated placeholder. Per the standing guardrail against approving/advancing real
  Moves, the dialog was then **cancelled**, not confirmed — verified via
  `read_network_requests` (urlPattern `generate-phase`) showing zero requests, the dialog element
  removed from the DOM, and the gate rail still reading "0 of 4" afterward, i.e. no mutation and no
  gate-state change occurred from this proof pass.

## Rollout Plan

Merge to `main` via squash-merge PR (repository ruleset is PR-only, speed mode). The repo-owned
`aca-main-deploy.yml` workflow builds and deploys the `main-<sha>` image to
`ca-abarva-web-lab-eastus`. No feature flag, no migration, no worker-job change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (only mutator of shared web
  traffic) — run `30106990157`, conclusion `success`, for commit `34335af96b`.
- Shared runtime mutators: none outside the repo-owned workflow
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:3abb9dd7bc4c5ae1ac1ff2d344b5d9398bb3286b901405285ae4f50e26eec0f4`
- ACA runtime invariant: confirmed — `ca-abarva-web-lab-eastus`'s template image and the
  100%-traffic revision (`ca-abarva-web-lab-eastus--m34335af9`) both resolve to the digest above.
- Worker image invariant: not applicable (no worker-job change)
- Feature/env flag update path: not applicable (no flag)
- Live signed-in proof required: yes — captured (see Audit Evidence). The P0 path was not
  separately re-exercised live in this pass (no P0-stage Move was readily at hand); the phase-level
  "Approve & Build" path, which shares the same `GateApprovalConfirmDialog` component and the same
  `approverLabel` derivation, was proven directly.

## Rollback Plan

Revert the merge commit (or redeploy the prior `main-<sha>` image). No data migration, no stored
state introduced by this change — both approval mutation endpoints and their request/response
shapes are unchanged, so a rollback is a pure UI revert with no backward-compatibility concern.

## Audit Evidence

- PR: [#5556](https://github.com/abarva-platform/abarva/pull/5556), squash-merged as
  `34335af96b406da13f0b59f0b6a798d98b6b97b8`
- Local validation: eslint clean, tsc clean, `npx jest src/components/strategic-moves` — 154
  passed / 1 pre-existing unrelated failure
- ACA deploy workflow run `30106990157` — `success`
- ACA runtime invariant — template image and 100%-traffic revision `ca-abarva-web-lab-eastus--
  m34335af9` both at digest `sha256:3abb9dd7bc4c5ae1ac1ff2d344b5d9398bb3286b901405285ae4f50e26eec0f4`
- Live signed-in browser proof (2026-07-24) — RETAIL-APEX-2026 Move, P5 Prepare to Execute,
  `anand.sundaram+apex@thesundaram.com · tenant_admin`: confirmation dialog opened with the exact
  approval summary and approver identity, then was cancelled with zero fetches to
  `/api/v1/deliverables/generate-phase` and no change to the gate's "0 of 4" state.

## Known Gaps

- The P0 "Approve gate →" path shares the identical `GateApprovalConfirmDialog` component and
  `approverLabel` derivation as the phase-level path that was live-proven, but was not separately
  re-exercised live in this pass (no P0-stage Move was readily at hand in this proof session) —
  covered by unit tests only for the P0-specific wiring.
- `MOVES-UI-012` (approval history/audit trail) remains explicitly deferred — it depends on the
  separate `MOVES-ARTIFACT-001` event-sourced lifecycle model and is intentionally out of scope
  here, to avoid building a second, competing history mechanism.
- The dialog has no keyboard-trap/focus-management beyond the existing shared CSS pattern
  (matches the precedent already established by `StrategicMoveOriginateClient.tsx`'s confirm
  dialog — not a new gap introduced by this change).
