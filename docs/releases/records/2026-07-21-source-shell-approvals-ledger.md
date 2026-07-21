# 2026-07-21-source-shell-approvals-ledger — SOURCE-SHELL-003: per-event Approvals ledger

## Release ID

`2026-07-21-source-shell-approvals-ledger`

## Status

`candidate` — PR open, not yet merged. Depends on the already-applied
`source_event_approvals.stage_key` migration
(`2026-07-21-source-event-approvals-stage-key-migration`, confirmed live).

## Plain-English Summary

The user's independent Source Event Shell redesign mockup showed an "Approvals & advance"
ledger — one row per canonical stage, named approver, real timestamp. Building it surfaced a
real gap (closed by the migration this PR depends on): `source_event_approvals` never recorded
which stage an approval was for. This PR wires the new `stage_key` column through the write
path (the approve route and the gate-criteria state route now pass the current stage when
recording an approval) and adds a real read path + UI: an 11-row ledger table in the
Approvals workspace.

Honesty discipline carried through the whole feature: a stage's `approved` status is derived
purely from position vs. `current_stage_key` (always reliable — gate advancement always
requires approval), never from the approval-row data. The approver name/timestamp is a real
enrichment, resolved from Clerk, that is `null` — shown as "approver not recorded for this
stage" — when no matching `stage_key` row exists (true for every row written before this
migration). The current stage shows a plain, real authorization statement ("Any client admin
can approve this gate"), not a fabricated named individual — the earlier investigation into
`source-access-policy.ts` confirmed Source approval authority is a flat, per-person capability
uniform across all 11 stages; there is no per-stage-specific named-approver-role data to
surface honestly.

This is `SOURCE-SHELL-003` from the Source Event Shell design-closure plan (Phase 3 of 4).

## Layer Impact

- `global-control-lane`: new read module (`approval-ledger.ts` / `approval-ledger-model.ts`),
  UI (`SourceAnalyticsCanvas.tsx`'s new `ApprovalLedgerTable`), and the two write-path call
  sites that now pass `stageKey`.
- `client-data-lane`: depends on the already-applied `stage_key` column (separate PR/migration
  record).

## Client Applicability

- All clients: yes — no gate, no flag, affects every Source event's Approvals workspace.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/approval-ledger-model.ts` (new): pure `buildApprovalLedger()` — no I/O, no
  Clerk import, importable by UI code/tests without pulling in server-only dependencies.
- `src/lib/source/approval-ledger.ts` (new): loader — resolves real Clerk display names,
  queries `source_event_approvals`, delegates composition to the model.
- `src/lib/data-plane/write-adapters/sourceWriteAdapter.ts`: `SourceApprovalWrite` /
  `SourceCriterionApprovalWrite` gain an optional `stageKey`; both Supabase-style and
  Azure-transaction implementations of `applyApproval`/`insertCriterionApproval` now write it.
- `src/app/api/v1/source/events/[eventId]/approve/route.ts`: passes
  `stageKey: currentStageKey` into `applyApproval`.
- `src/app/api/v1/source/[eventId]/gate-criteria/[criterionId]/state/route.ts`: passes
  `stageKey: criterionRow.from_stage` into `insertCriterionApproval`.
- `src/lib/source/source-event-shell-v2.ts`: `SourceShellApprovalsWorkspace` gains `ledger:
ApprovalLedgerRow[]`; `buildSourceEventShellView` accepts and threads `approvalLedger`.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: new
  `ApprovalLedgerTable`, rendered in `ApprovalsWorkspace` when a ledger is present.
- `src/app/(maestro)/source/events/[eventId]/page.tsx`: loads the ledger via
  `loadApprovalLedger(event.id, event.currentStageKey)` and passes it through.
- New tests: `approval-ledger.test.ts` (7 pure-function cases) and
  `SourceAnalyticsCanvas.approvalLedger.test.tsx` (2 functional UI cases).
- This release record.

## QA / Validation

- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
tsconfig.json` — full project, 0 errors.
- `pass` — `npx eslint` on all changed/added files — 0 errors.
- `pass` — 7 pure-function tests on `buildApprovalLedger`: approved/current/locked derivation
  by position, real approver attachment on a stage_key match, honest `null`/"not recorded" on
  no match, most-recent-row-wins on repeat approvals (send-back case), non-approval actions
  ignored, non-fabricated authorization copy for the current stage, safe fallback for an
  unknown `currentStageKey`.
- `pass` — 2 functional UI tests: real click into the Approvals tab, real 11-row table,
  real differing per-row status/approver text built through the same (also-tested)
  `buildApprovalLedger` — not a hand-typed fixture that could drift from the real shape.
- `pass` — existing `source-write-adapter.test.ts` (31 tests) — unaffected by the new optional
  `stageKey` field.
- `pass` — full Source test sweep (analytics canvas + lib/source + write-adapter): 6
  pre-existing failures confirmed unrelated via `git stash` + re-run against clean `main`
  (2 previously known, 4 newly discovered but confirmed present before this diff existed) —
  zero regressions from this change.
- Live signed-in click-through: to be performed after merge/deploy using the
  already-authenticated Chrome session, same pattern as `SOURCE-SHELL-001`/`-002`. This
  event's real approval history predates the migration, so the live proof will show the
  "approver not recorded" honesty path rather than a populated name — both are correct,
  intended behavior, not a bug.

## Rollout Plan

Merge to `main` via the repo-owned ACA main-deploy workflow. The dependency (schema) is
already live — this PR is safe to deploy on its own.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be verified after merge and deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, see QA / Validation.

## Rollback Plan

Revert the merge commit. Reverting removes the ledger UI and stops populating `stage_key` on
new approvals — the column itself (from the separate migration) is unaffected and safe to
leave in place; a later re-attempt can pick up populating it again with no data loss beyond
the rows written during the revert window.

## Audit Evidence

- PR: to be added once opened.
- Test/typecheck/lint logs: see QA / Validation.
- Migration dependency: `2026-07-21-source-event-approvals-stage-key-migration` (released,
  real apply evidence recorded there).

## Known Gaps

- Live signed-in browser proof pending merge + deploy — to be appended once performed.
- No events in currently-available tenant data have any `stage_key`-tagged approval yet (the
  migration just landed) — the first real "approver attached" row will appear only once a
  live approval happens post-deploy. Until then, every event's ledger correctly shows the
  "not recorded" honesty path for its already-approved stages.
