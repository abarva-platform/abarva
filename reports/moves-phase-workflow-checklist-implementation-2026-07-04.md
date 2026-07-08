# Moves — Phase workflow checklist (increment 4 implementation report)

**Date:** 2026-07-04 · **Slice:** make the Moves phase workspace workflow-driven (Stripe get-started model) with a real-signal task checklist, on top of increments 1–3.

## 1. Executive verdict

The phase workspace now leads with a **"What to do next" checklist** — the Stripe-style spine the product direction called for. It turns real move state into an ordered, honest task list (provide evidence → meet the gate → attest & advance), with the advance step locked until the prerequisites are done. All statuses come from **real data** (`evidenceNeedPackets` coverage + `move.gateCriteria`), computed by a pure, unit-tested adapter — **no model, no fabrication**. It's additive behind the existing `moves_phase_workspace_v2` flag (Lakeshore on), renders above the guidance cards, and leaves the chat pane untouched — the phase is completable by following the checklist, chat off.

## 2. What "workflow-driven, like Stripe" means here

A visible spine + a short task list where each item has a real status and one action, the final CTA unlocks when prerequisites are met, and the system does the work. This increment delivers the task list; the existing PhaseRail (stepper), evidence workbench, and gate remain the action surface directly below.

## 3. The chat-can't-break-it contract (how this stays safe)

1. **Single write path** — the checklist never commits; its actions render as status hints pointing to the existing workbench controls (the real, validated write path). Wiring click→control is the next step and will route through those same handlers.
2. **Deterministic reads** — statuses come from `buildPhaseWorkflow` over real signals, never from chat/model output.
3. **Additive + flagged** — off by default; when off, the workspace is byte-for-byte unchanged.
4. **Completable with chat off** — the checklist + workbench are sufficient to finish the phase without a chat turn.

## 4. Implementation

- `phase-workflow.ts` — `buildPhaseWorkflow({phaseLabel, nextPhaseLabel, evidence[], gate[]})` → `{tasks, doneCount, totalCount, canAdvance}`. Structural inputs (subsets of `MoveEvidenceNeedPacket` / `move.gateCriteria`) so the lib stays decoupled and testable. Evidence "done" = all required covered/waived/n-a (falls back to the full set if nothing is required, so it never claims done vacuously); gate "done" = all **hard** criteria met (soft don't block); advance unlocks only when both are done.
- `PhaseTaskChecklist.tsx` — progress bar + ordered rows (done ✓ / active → / todo # / locked 🔒), real progress labels, action as a button when wired or a status hint otherwise.
- `MovePhaseWorkspacePanel.tsx` — renders the checklist above the guidance when real signals are present; hides it (guidance only) when there are none.
- `StrategicMovePhaseClient.tsx` — maps real `evidenceNeedPackets` + `move.gateCriteria` into the structural signals (current phase only) and passes them in.

## 5. Files changed

New: `phase-workflow.ts`, `PhaseTaskChecklist.tsx`, `__tests__/phase-workflow.test.ts`. Edited: `MovePhaseWorkspacePanel.tsx`, `styles.tsx`, `index.ts`, `StrategicMovePhaseClient.tsx`, `__tests__/phase-workspace.test.tsx`. Proof: `proof/moves-phase-workflow-p2-2026-07-04/phase-workflow-p2-render.html`.

## 6. Tests / validation

- Jest **36/36** (6 adapter unit tests + checklist/panel render tests + all prior).
- esbuild parse of the edited client — exit 0. Scoped strict `tsc` — exit 0. ESLint — exit 0.
- Render proof screenshotted: real panel shows the progress bar and active/todo/locked states with real counts ("1 of 3 in", "1 of 2 met", locked advance to "P3 · Design").
- Live signed-in Lakeshore proof — post-deploy (see release record).

## 7. Known gaps / non-claims

- Actions are status hints (point to the workbench); click→control wiring is next, through the single write path.
- Progress = the two prerequisites (evidence + gate); finer granularity later.
- One unrelated `neo4j-gate` test fails identically with changes stashed (pre-existing). Full-project `tsc --noEmit` red from an unrelated merge; does not block build/deploy.

## 8. Recommended next backlog

1. Wire the checklist actions to the existing controls (evidence picker, gate scroll) — through the same handlers, single write path.
2. Add the "completes with chat off" E2E as the acceptance test for the workflow.
3. Drive the CurrentStateAssessmentMap live from real `evidenceNeedPackets` (dimension + status + why/next).
4. Then (optional, flagged) the Claude enrichment layer, writing only through the validated path.
