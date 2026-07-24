# 2026-07-24-gate-approval-confirmation — Confirm-before-approve dialog for Moves phase gates

## Release ID

`2026-07-24-gate-approval-confirmation`

## Status

`candidate`

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
- No live browser verification was performed for this specific change. Per the standing session
  guardrail against approving/advancing real production Moves, and because the change is a
  client-side confirmation gate in front of an already-verified server mutation, this was judged
  low-risk enough to rely on unit-test coverage plus a subsequent live click-through check after
  deploy (see Known Gaps).

## Rollout Plan

Merge to `main` via squash-merge PR (repository ruleset is PR-only, speed mode). The repo-owned
`aca-main-deploy.yml` workflow builds and deploys the `main-<sha>` image to
`ca-abarva-web-lab-eastus`. No feature flag, no migration, no worker-job change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (only mutator of shared web
  traffic)
- Shared runtime mutators: none outside the repo-owned workflow
- Approved image digest: to be confirmed post-merge via `az containerapp show` /
  `az containerapp revision list` runtime-invariant check
- ACA runtime invariant: to be verified after deploy (template image == 100%-traffic revision
  image == approved digest)
- Worker image invariant: not applicable (no worker-job change)
- Feature/env flag update path: not applicable (no flag)
- Live signed-in proof required: yes — a signed-in click-through of both the P0 and a P1–P5
  "Approve & Build" confirmation dialog (open → cancel → reopen → confirm) should be captured
  after deploy, consistent with this session's pattern for prior UI changes (MOVES-UI-009,
  MOVES-UI-011).

## Rollback Plan

Revert the merge commit (or redeploy the prior `main-<sha>` image). No data migration, no stored
state introduced by this change — both approval mutation endpoints and their request/response
shapes are unchanged, so a rollback is a pure UI revert with no backward-compatibility concern.

## Audit Evidence

- PR: to be opened
- Local validation: eslint clean, tsc clean, `npx jest src/components/strategic-moves` — 154
  passed / 1 pre-existing unrelated failure
- Post-deploy: ACA runtime-invariant check output and live signed-in browser proof to be added
  once captured (see Known Gaps)

## Known Gaps

- Live signed-in browser verification on `app.abarva.ai` has not yet been captured for this
  specific change — planned as a follow-up once deployed, following the same pattern used for
  MOVES-UI-009/011 in this session.
- `MOVES-UI-012` (approval history/audit trail) remains explicitly deferred — it depends on the
  separate `MOVES-ARTIFACT-001` event-sourced lifecycle model and is intentionally out of scope
  here, to avoid building a second, competing history mechanism.
- The dialog has no keyboard-trap/focus-management beyond the existing shared CSS pattern
  (matches the precedent already established by `StrategicMoveOriginateClient.tsx`'s confirm
  dialog — not a new gap introduced by this change).
