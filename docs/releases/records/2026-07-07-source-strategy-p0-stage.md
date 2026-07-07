# 2026-07-07-source-strategy-p0-stage — Strategy (P0) stage on the unified canvas, with the P0 approval folded in

## Release ID

`2026-07-07-source-strategy-p0-stage`

## Status

`candidate`

## Plain-English Summary

The **Strategy (P0) stage** on the redesigned Source canvas, behind `source_analytics` (Lakeshore on).
Strategy is the first stage of every sourcing event — "confirm the mandate and sponsor before any work
begins" — and it renders from the SAME unified stage template as Scope (header → progress → tabs
[Inputs to gate | ✦ Intelligence] → task checklist → gate).

Two things ship:

- **The Strategy stage renders correctly.** Previously, clicking Strategy in the stage rail rendered the
  Scope placeholder (the canvas defaulted every stage to the Scope sample). Now the canvas selects the
  Strategy view for a strategy-stage event and the Scope view for a scope-stage event. The Strategy stage
  has ONE task, "Confirm strategy & sponsor" (a Sponsor / Mandate / Value-thesis review table drawn from
  the event's captured intake), and — because Strategy is a pure-intake stage — the Intelligence tab shows
  the engine read ("What Source brings to Strategy") with **no value-type waterfall** (the value thesis is
  a captured fact, not a computed proof, so none is fabricated).

- **The P0 approval is folded into the Strategy gate.** When `source_analytics` is ON and the event is
  genuinely awaiting the P0 approval in the strategy stage, the in-canvas Strategy gate's Approve button
  calls the **existing** approve backend (`POST /api/v1/source/events/[eventId]/approve`) — the same route
  the standalone `/source/events/[eventId]/approval` page uses — so approving in-canvas persists the
  approval and advances the event to Scope identically. Persistence is **not** forked. When the flag is
  OFF, nothing changes: the standalone `/approval` page still governs.

## Layer Impact

- `experimental`: the Strategy stage + folded approval render only when `source_analytics` is on
  (Lakeshore only). The standalone `/approval` page is the untouched fallback when the flag is off.
- `global-control-lane`: the Strategy view-model + stage-selection helper + fact-driven Strategy builder
  are added to the `canvas/analytics/` library and the flag-gated branch of the event page. Inert unless
  the flag is on.

## Client Applicability

- All clients: no behavior change when the flag is off — the standalone `/approval` page governs the P0
  approval exactly as before.
- Specific clients: **Lakeshore** (`source_analytics` on) sees the Strategy stage + folded approval on the
  unified canvas.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (on for Lakeshore, off for all others).

## Changes Included

- `src/components/source/canvas/analytics/strategy-sample-view-model.ts` **(new)** — `SAMPLE_STRATEGY_STAGE`
  + `SAMPLE_STRATEGY_AVA`: the honest sample Strategy view (intake read, one confirm task with the
  Sponsor/Mandate/Value-thesis table, three-confirm gate, no waterfall).
- `src/lib/source/facts/view/strategy-stage-builder.ts` **(new)** — `buildStrategyStageView` +
  `deriveStrategyIntakeFacts`: builds the FACT-DRIVEN Strategy view from the persisted event row (the same
  intake fields the standalone approval page reads) and attaches the live approve `action` when eligible.
- `src/components/source/canvas/analytics/view-model.ts` — new `StageGateActionView` + optional
  `StageGateView.action` (the live-approve wiring; absent → presentational end-state).
- `src/components/source/canvas/analytics/ScopeGate.tsx` — the Approve button POSTs to the existing approve
  route when `gate.action` is present; error surface; advances on success. No `action` → unchanged.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` — stage selection: render the Strategy
  view for a strategy stage, the Scope view otherwise (the honest sample fallback preserved).
- `src/components/source/canvas/analytics/index.ts` — export the Strategy sample view-model +
  `StageGateActionView`.
- `src/app/(maestro)/source/events/[eventId]/page.tsx` — flag-gated branch builds the fact-driven Strategy
  view for the strategy stage (with the live approve action when the event is awaiting P0 approval and the
  user can approve); other stages keep the value-waterfall builder.
- `src/components/source/canvas/analytics/__tests__/StrategyStage.test.tsx` **(new, 9 tests)**.

## QA / Validation

- `npx jest src/components/source/canvas/analytics/__tests__/` → **14 tests pass** (9 new Strategy tests +
  5 existing honesty tests). Covers: Strategy header + "Confirm strategy & sponsor" table (Sponsor /
  Mandate / Value thesis) + the three-confirm gate; stage selection returns the Strategy view for a
  strategy-stage event and Scope for scope; the Intelligence tab shows the read with **no waterfall** on
  Strategy; the folded approve action mirrors the standalone approval's three confirmation keys. **pass.**
- `npx tsc --noEmit` (full project, 8 GB heap) → **0 errors in the changed files** (213 pre-existing
  project errors are unrelated; `next.config` uses `ignoreBuildErrors`). **pass.**
- `npx eslint` on all changed files → clean. **pass.**
- Not live-proven yet: requires a signed-in Lakeshore proof that a fresh strategy-stage event's in-canvas
  Approve persists + advances to Scope (see Known Gaps).

## Rollout Plan

Merge to `main` via PR + squash. The Strategy stage renders on the unified canvas only when
`source_analytics` is on (Lakeshore). When off, the standalone `/approval` page governs the P0 approval
with zero change. No migration. A live signed-in Lakeshore proof is required to flip this from
`candidate` to `released`.

## Deployment Authority

- Repo-owned ACA main deploy per `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — the Strategy stage + folded approval are unreachable while the flag is
  off; the default path is the untouched standalone `/approval` page.
- Approved image digest: assigned by the ACA main deploy workflow at deploy time.
- ACA runtime invariant: template image = 100%-traffic revision image = approved digest (proven post-deploy).
- Worker image invariant: n/a (no worker change).
- Feature/env flag update path: `source_analytics` via `includeTenants` in the feature registry
  (Lakeshore already enrolled).
- Live signed-in proof required: yes, at Lakeshore — a fresh strategy-stage event's in-canvas Approve must
  persist + advance to Scope.

## Rollback Plan

Revert the PR. The Strategy stage + folded approval are reachable only through the flag-gated branch and
the optional `gate.action`; removing them restores the canvas to the sample/Scope behavior and leaves the
standalone `/approval` page as the sole P0 approval path. No migration to roll back.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest (14 tests), tsc, eslint.
- The in-canvas Approve reuses `POST /api/v1/source/events/[eventId]/approve` (the same route + write
  adapter `applyApproval` + `source_event_approvals` record) — no forked persistence. Confirmation keys
  mirror `REQUIRED_APPROVAL_CONFIRMATIONS` from `approval-decision.ts`.

## Known Gaps

- **Live signed-in Lakeshore proof pending** — the in-canvas Approve is wired to the real backend and unit-
  tested, but not yet proven end-to-end against a real strategy-stage event in a signed-in browser.
- The other intake beats on the fact-driven Strategy view (intel points, task guide) reuse the sample copy
  structure; only the Sponsor / Mandate / Value-thesis table + sponsor/approver are fact-driven from the
  event's captured intake.
