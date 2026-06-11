# 2026-06-11-source-approvals-experience — Source approvals: one place, one simple flow

## Release ID

`2026-06-11-source-approvals-experience`

## Status

`candidate`

## Plain-English Summary

Makes the Source approval experience simple and obvious. Before: intake approvals only
appeared if you happened to click a pending event, and stage approval was spread across
four surfaces (Next Move card → Gate tab → per-criterion actions → promotion reason),
with the approve button hard-disabled until every criterion was met — no approve-with-gaps
path despite it being the product's core flexibility principle. Now: (1) an **Approvals**
tab shows everything waiting on you in one list — each item says in plain English what you
are approving, how ready it is, and has one button that takes you exactly where you decide;
(2) the Gate tab is a single guided flow — what you're approving, what's open, one
rationale box, and two buttons: **Approve & advance** (all items met) or **Approve with
gaps** (open items are deferred with your rationale and carried forward, never hidden).

## Layer Impact

- `global-control-lane`: new `/source/approvals` page + `approvals-inbox` lib (reuses the
  existing read adapters + gate-criterion table; no schema change); "Approvals" tab in the
  Source sub-nav; GateTab gains the approve-with-gaps action built entirely on the existing
  per-criterion state PATCH (`deferred` is an existing enum value) + stage PATCH.

## Client Applicability

- All clients: yes — the inbox is tenant-scoped via the existing adapters.

## Changes Included

- `src/lib/source/approvals-inbox.ts` — pure `buildApprovalsInbox` + `loadApprovalsInbox`.
- `src/app/(maestro)/source/approvals/page.tsx` — the inbox surface with a "How approving
  works" explainer.
- `src/components/source/SourceSubNav.tsx` — Approvals tab (IA v2 set).
- `src/components/source/canvas/workspace-tabs/GateTab.tsx` — plain-English approval copy,
  primary button renamed "Approve & advance to {stage}", new "Approve with gaps (N
  deferred)" secondary action (rationale required; defers open criteria with the rationale
  recorded per criterion, then advances), and an inline hint when the reason is too short.
- Tests: `approvals-inbox.test.ts` (5) + updated gate-tab integration test copy (6 pass).

## QA / Validation

- `jest approvals-inbox` 5/5 · `source-canvas-gate-tab` 6/6 · nav-active-state 26/26.
- `tsc --noEmit` clean (scoped) · `eslint` clean (one pre-existing unused-style warning in
  GateTab untouched) · `release:check` pass · `audit:architecture-rules` 0 violations.
- Governance preserved: approve-with-gaps requires the same minimum-length human rationale
  as a clean approval; deferred items keep their criterion rows (state `deferred`, an
  existing enum) with the rationale in notes — nothing is hidden or auto-met.

## Rollout Plan

Squash-merge to main → ships with the next web image roll (the F1-fix roll already in
flight can be repeated after this merge to carry both).

## Rollback Plan

Revert the PR. No schema/data changes; the new states written are normal product data via
existing endpoints.

## Known Gaps

- The inbox shows intake + stage-gate approvals; award/contract approvals can be added to
  the same list when those flows land.
- Approve-with-gaps defers open criteria; a per-criterion follow-up assignment UI is a
  future nicety (the rationale records the decision today).

## Audit Evidence

Live-audit observations (2026-06-11) that motivated this; gate-tab integration test +
inbox unit tests.
