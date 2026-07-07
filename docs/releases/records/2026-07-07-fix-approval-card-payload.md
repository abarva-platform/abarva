# 2026-07-07-fix-approval-card-payload — fix the standalone approval card's request/response contract

## Release ID
`2026-07-07-fix-approval-card-payload`

## Status
`candidate`

## Plain-English Summary
The standalone `/source/events/[eventId]/approval` card (`EventApprovalCard`) drifted out of contract
with the approve route after a parallel refactor changed the route's shape:
- It POSTed a bare `{ confirmed: true }`, but the route validates `body.confirmations`
  (the three `SourceApprovalConfirmations` keys) via `evaluateSourceApprovalDecision` — so for a
  gate tenant (Strategy-at-P0, e.g. Lakeshore) the approve **422'd** (`confirmations_required`).
- It read `payload.advancedToStage` for the post-approve redirect, but the route returns
  `stageAdvancedTo` — so the user was left on the completed Strategy view.

Fix: the card now sends `confirmations` mapped from its gate checkboxes (or the single confirm for
non-gate tenants) onto `{ strategyMemoReviewed, valueTargetConfirmed, archetypeRigorConfirmed }`, and
reads `stageAdvancedTo` (with `advancedToStage` as a backward-compatible fallback). This mirrors the
in-canvas Strategy gate shipped in #4524.

## Layer Impact
- `global-control-lane`: restores the standalone approval flow for all tenants (not flag-gated) —
  the P0 approval was failing for gate tenants.

## Client Applicability
- All clients: the standalone `/approval` approve action works again; gate tenants (Lakeshore) were
  hitting a 422. Not applicable to the flag-gated in-canvas gate, which already sent the right shape.

## Changes Included
- `src/components/source/approval/EventApprovalCard.tsx` — send `confirmations`; read `stageAdvancedTo`.

## QA / Validation
- `npx eslint` on the file → clean. `npx tsc --noEmit` filtered to the file → 0 errors. **pass.**
- Not yet browser-proven post-fix (recommend a live signed-in approve on `/approval` for a gate tenant).

## Rollout Plan
Merge to `main` via PR + squash → ACA deploy. No flag; it's a straight contract fix.

## Deployment Authority
- Repo-owned ACA main deploy. No migration, no shared-runtime mutation beyond the standard deploy.

## Rollback Plan
Revert the PR — restores the prior (broken-for-gate-tenants) card.

## Audit Evidence
- PR URL (added on open). Route contract: `src/app/api/v1/source/events/[eventId]/approve/route.ts`
  (`body.confirmations`, returns `stageAdvancedTo`); confirmations keys:
  `src/lib/source/approval-decision.ts` (`REQUIRED_APPROVAL_CONFIRMATIONS`).

## Known Gaps
- Live signed-in approve proof pending.
