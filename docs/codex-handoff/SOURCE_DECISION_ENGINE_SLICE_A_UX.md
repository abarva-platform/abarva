# Codex Handoff — Source Decision Engine · Slice A-UX

**Compact gate panel — pure render refactor of the LIVE `GateTab.tsx`**

> Read `SOURCE_DECISION_ENGINE_OVERVIEW.md` §UX density contract and `SLICE_A.md` §4.5 first.
> This is a **render-only refactor**. The assessment engine (Slice A, PR #3541) and persistence
> (Slice A2) are already merged + live. Do NOT change assessment logic, data flow, routes, or the
> derive-at-read model. Only how the already-computed data is displayed.

---

## 0 · Why this slice

Slice A shipped to the *original* brief — before the §4.5 compact spec existed — so the live gate
panel is the cluttered version the founder rejected: the same criteria rendered **three times**
(Stage Decision Status panel + a separate blocker block + per-criterion cards), with an
**always-open approval textarea** on every criterion and a list that **dumps all inputs** for a
multi-input criterion. This is form-fill, the opposite of "every click is a decision." Fix the
rendering to the §4.5 layout. No new data — all of it already flows into `GateTab`.

---

## 1 · The exact targets in the shipped `GateTab.tsx` (~1335 lines on main)

Verified structure to refactor:

1. **Duplication — collapse to ONE list.** `StageDecisionStatusPanel` (renders the recommendation +
   reason codes + blockers) AND the separate `blockers` summary block (the
   `data-testid="source-canvas-gate-blockers"` list, ~lines 276–301) AND the `CriterionRow` cards
   all restate the same criteria. Keep **one** header (status + count) and **one** row list. The
   rows ARE the blockers — delete the standalone blocker summary block. The header count
   (`0 of 5 cleared`) is the only summary.
2. **Always-open textarea — gate behind the click.** `CriterionRow` (~line 516) renders an inline
   `Approval reason` `textarea` (~line 577) for every criterion. Move it behind the **Mark met**
   action: the textarea appears only after the user clicks Mark met **on that one row**, and
   collapses on cancel/confirm. Never pre-rendered, never open on more than one row at once.
   (Keep the existing `SOURCE_APPROVAL_REASON_MIN_LENGTH` gate + `data-testid`s so tests still pass.)
3. **Input dump — collapse to a count + link.** `RequiredInputsList` (~line 374) lists every
   required input for a criterion (the 4-input `GATE-SCOPE-04` case). Replace the always-expanded
   list with `N inputs not ready · see what's missing` that expands on click. Detail on demand.
4. **One row = dot + title + one gap line + owner chip + one action.** Per §4.5: the status is a
   single color dot (red = blocked by evidence, amber = needs human review, green = met incl.
   `Auto-assessed from evidence`). The secondary line is the **derived** gap
   (`Application inventory · not requested → needs usable evidence`) or the human action
   (`Needs human review · sponsor sign-off`) — one line, not description + reason + needs-stanza + id
   stacked. Criterion ID, full description, full owner role → hover/expand only.

Keep the promote control + its reason field (that's the one deliberate stage-level reason, distinct
from per-criterion approval) and the "Next: … needs …" look-ahead footer — both already exist.

## 2 · Hard constraints (render-only)

- **No assessment/logic change.** `assessStageGate`, `buildStageRecommendation`,
  `gate-auto-assessment*`, the `gate-decision` route, the derive-at-read overlay, and the
  manual-wins precedence are untouched. If you find yourself editing anything outside `GateTab.tsx`
  (and at most small presentational helpers it owns), stop — that's out of scope.
- **Preserve existing `data-testid`s and the Mark met / Reopen / Promote behaviors** so the live
  gate test (`src/__tests__/integration/source/source-canvas-gate-tab.test.tsx`) and the criterion
  tests still pass. Update tests only where they assert on now-removed duplicate blocks.
- The panel renders at **every stage** (Scope, RFP, Evaluation…), not Scope-only — the layout must
  hold for 2 criteria and for 12.

---

## 3 · Tests
- Update `source-canvas-gate-tab.test.tsx`: assert the criteria render **once** (no separate
  blocker-summary block), the approval textarea is **absent until Mark met is clicked**, and a
  multi-input criterion shows the collapsed count rather than all inputs.
- Keep all assessment/persistence tests green (you didn't touch that code).
- Standing validation (OVERVIEW): `tsc --noEmit`, `eslint`, `test:behaviors`, `release:check`.

---

## 4 · Browser verification — THE HARD GATE
On a real SkyHarbor Air Scope gate (create a disposable event + approve via P0 as Slice B did, or
reuse one with evidence below threshold so blockers show):
1. Screenshot: the gate panel renders **one** list of criteria — no triple-repeat, no standalone
   "N hard blockers" block.
2. Screenshot: **no approval textarea is visible** on load; click **Mark met** on one row →
   the reason box appears on **that row only**; cancel → it collapses.
3. Screenshot: the multi-input criterion shows `N inputs not ready · see what's missing` (collapsed),
   expands on click.
4. Confirm the promote control + count + look-ahead footer still work; Mark met / Reopen unchanged.

Label `click-verified` (with screenshots) or `code-complete` (with exact steps). The success
sentence: *the founder opens the Scope gate and sees a clean "load these files" list, not a wall of
repeated blocker labels.*

---

## 5 · Boundaries
- Render-only. No assessment/data/route changes. No new manual checkboxes.
- Obey OVERVIEW §UX density contract + SLICE_A §4.5 verbatim.
- Branch: `codex/source-decision-engine-slice-a-ux` ·
  PR title: `Source Decision Engine · Slice A-UX: compact gate panel (render refactor, no logic change)`
