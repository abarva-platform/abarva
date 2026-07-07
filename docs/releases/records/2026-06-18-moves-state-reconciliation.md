# 2026-06-18-moves-state-reconciliation — One canonical phase/gate state for Strategic Moves

## Release ID

`2026-06-18-moves-state-reconciliation`

## Status

`candidate`

## Plain-English Summary

A Strategic Move's status was rendered from inconsistent signals, so the four surfaces a user looks at could disagree: the **Overview** could show "P0 · awaiting decision" while the **phase workspace** at `/phase/1` rendered as if the move were already in P1, and the **Documents** / **File Cabinet** tabs (which read `current_phase`) showed yet another state. Root cause: approving the P0 origination brief flipped `lifecycle_state` to `approved` but **left `current_phase` pinned at 0** (it was hard-coded), and the phase workspace let you open any phase regardless of where the move actually was.

This change makes **`engagements.current_phase` the single source of truth** and keeps every advance path and every read in lockstep:

- **P0 brief approval now advances `current_phase` 0 → 1** (was hard-coded to 0). So once the brief is approved, the Overview, Documents, and File Cabinet (all of which already read `current_phase`) immediately show P1.
- **The phase-gate advance now also writes an `approved` `phase_snapshot` + `lifecycle_state`** so `getMoveStatus` (Overview) doesn't read a stale "awaiting decision" after a P1→P2…P5 advance.
- **The phase workspace guards on `current_phase`**: opening `/phase/N` ahead of the true current phase redirects back, so you can't do P1 work while P0 is still awaiting the brief approval, and the workspace can never contradict the Overview.

No schema change — every column/table already exists (`engagements.current_phase`, `engagements.lifecycle_state`, `phase_snapshots`).

## Acceptance matrix (what is validated end-to-end)

| Surface | Before P0 approval | After P0 approval | After P1 generate |
|---|---|---|---|
| Overview | P0 · awaiting decision | P1 · active | P1 · artifact status visible |
| Phase `/0` | active | complete | — |
| Phase `/1` | blocked → redirected | active | same artifact/version/status |
| Documents | P1 Charter not generated | P1 Charter available to generate | P1 Charter generated |
| File Cabinet | no P1 artifact | no artifact until generation | same artifact/version |

Invariants: cannot access `/phase/1` before P0 approval · P0 approval advances `current_phase` to 1 · phase-gate advance writes `lifecycle_state` + `phase_snapshot` · all four surfaces agree after reload.

## Layer Impact

- **`global-control-lane`** — shared Move state-machine behavior for all tenants. No per-client data, no schema/RLS change, no migration.

## Client Applicability

- All clients: **Yes** — shared control-plane behavior, no feature flag.
- Specific clients: No. Internal only: No. Public/demo only: No. Feature flag: None.

## Changes Included

- `src/lib/programs/approval.ts` — `decideApprovalRequest`: on P0 brief approval set `current_phase: 1` (was `0`) so the canonical phase advances.
- `src/app/api/programs/phase-gate/route.ts` — after `advanceEngagementPhase`, best-effort write of an `approved` `phase_snapshot` + `lifecycle_state='approved'` (non-fatal; the audit-log write remains authoritative).
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` — redirect `/phase/N` → `/phase/{current_phase}` when `N > current_phase`.

## QA / Validation

- **PASS** — `eslint` changed files → 0 errors/0 warnings.
- **PASS** — `tsc --noEmit` → 0 errors in changed files.
- **NOT-RUN (pending deploy)** — live acceptance walk: create a fresh Move → verify the *Before* column on all four surfaces → approve the P0 brief → verify the *After P0* column → save/approve/generate P1 → verify the *After P1* column. localhost cannot reach the private data plane, so this must run on ACA after deploy and be attached before marking `released`.

## Rollout Plan

Merge to `main` → `aca-main-deploy` builds + deploys the web image (and, once PR #3680 lands, updates the worker jobs). No migration, no worker-code change.

## Rollback Plan

Revert the PR and redeploy prior `main`. No schema migration. Each of the three changes is independent and individually revertible. (Note: a move approved while this is live will have `current_phase=1`; reverting only changes future approvals — existing rows are already correct.)

## Audit Evidence

- PR URL (added on open) for `fix/state-reconciliation`; CI run; live four-surface walk screenshots/network traces post-deploy.

## Known Gaps

- The P0 brief approval action still lives in the Admin approvals queue (`program_approval_requests` → `decideApprovalRequest`); "Resolve decision" routes to the in-place phase workspace. An in-place "approve the brief" control on the Move (calling the same `decideApprovalRequest`) is a UX follow-up — the state-layer is now correct regardless of which surface triggers the approval.
- `lifecycle_state` after an advance is left at `approved` (no dedicated "in-progress" enum value exists); `getMoveStatus` reads that as on-track for the new phase, which matches the matrix.
