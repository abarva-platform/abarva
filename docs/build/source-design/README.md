# Source Module Redesign — Design Package

**Audience:** Claude design module (review + refine), then Codex (implement)
**Created:** 2026-06-04
**Companion docs:** `docs/build/cxo-primers/APEX_RETAIL_SOURCE_E2E_CXO_TESTING_BRIEF_2026-06-02.md` (the bar)

---

## Reading order

| # | File | Open in browser | Purpose | Audience |
|---|---|---|---|---|
| 1 | [01-current-state-wireframes.html](./01-current-state-wireframes.html) | ✓ | What's there today · friction points · works-well anchors | Everyone — sets the baseline |
| 2 | [02-end-to-end-wireframes.html](./02-end-to-end-wireframes.html) | ✓ | Full lifecycle current state next to target state · 18 sections from entry through renewal | Design module · CXO reviewers |
| 3 | [03-build-specs.html](./03-build-specs.html) | ✓ | 19 per-surface implementation specs with file paths, props, copy, behavior, acceptance criteria | Design module → Codex |

All three are self-contained HTML — no build step, no JS deps. Open in any browser.

---

## What each doc does

### 01 · Current-state wireframes
14 sections covering every Source page rendered today with proportions matching the production crawl screenshots. Color-coded friction calls (P1 red · P2 amber · works-well green). Identifies seven cross-cutting patterns the redesign must address.

### 02 · End-to-end wireframes
18 parts walking the full sourcing lifecycle:

- **Part 1**: Full state machine diagram (every state, every transition, four missing transitions called out)
- **Parts 2-4**: Entry · Intake · Approval (the new page)
- **Parts 5-15**: Stages 1-11 with current next to target side-by-side
- **Part 16**: Exports (CXO Report + Deal Pack target structure)
- **Part 17**: Cross-cutting (chat sizing, evidence drawer, audit log, notifications)
- **Part 18**: Renewal loop back to entry

Each section has a lifecycle ribbon at top showing where in the flow it sits.

### 03 · Build specs
19 PR-shaped specs, each with:

- **Files** (real repo paths — ✦ new, ✎ edit)
- **Layout / Behavior** (what the surface does)
- **Component signatures** (typed props)
- **Copy** (italicized exact strings · ready for tone review)
- **Acceptance** (definition of done as checklist)
- **OPEN FOR DESIGN REVIEW** (2-5 explicit questions per spec)

Specs are organized into **4 waves** sequenced by load-bearing priority. Wave 1 closes the most user-jarring bugs (routing guard, approval page, intake footer, humanization). Waves 2-4 layer the canvas redesign, stage depth, and lifecycle completion.

Also includes:
- **The bar** — five design principles every spec must clear
- **Design tokens** — locked color palette, typography, spacing (per project memory · do not change)
- **Component architecture** — existing components to be aware of, new components to create
- **8 cross-spec open questions** the design module needs to weigh in on

---

## How the design module should use this package

1. **Read 01 first** to ground in current state and friction
2. **Read 02 next** to understand the lifecycle and current-vs-target deltas
3. **Refine 03** spec-by-spec — each has explicit "OPEN FOR DESIGN REVIEW" blocks

### Per-spec review pattern

For each of the 19 specs, leave a comment block:

```
// DESIGN MODULE REVIEW
// Approved as-is: [Y/N]
// Revisions:
//   - [bullet]
// Open with Codex before ship: [yes/no]
```

That structure makes the handoff to Codex deterministic — no ambiguity about what's approved, what needs work, and what should be discussed in implementation.

### Cross-spec questions to resolve before Wave 1 ships

The build specs surface eight questions that span specs (voice and tone, density philosophy, chat positioning, etc.). Resolve these before Wave 1 ships — they affect every downstream design decision.

---

## How Codex uses this package

After design module review, Codex picks up the refined `03-build-specs.html` and ships PRs **wave-by-wave**:

- **Wave 1** (week 1) — Specs 2 · 3 · 4 · 7
- **Wave 2** (week 2-3) — Specs 1 · 5 · 6 · 8
- **Wave 3** (week 4-5) — Specs 9 · 10 · 11 · 12
- **Wave 4** (week 6+) — Specs 13 · 14 · 15 · 16 · 17 · 18 · 19

Each spec is bounded enough to ship as its own PR. No PR spans multiple specs.

---

## Related docs

- **The bar:** [docs/build/cxo-primers/APEX_RETAIL_SOURCE_E2E_CXO_TESTING_BRIEF_2026-06-02.md](../cxo-primers/APEX_RETAIL_SOURCE_E2E_CXO_TESTING_BRIEF_2026-06-02.md) — the CXO Testing Brief these specs are designed against
- **L6 audit:** Multiple audit memos in this session captured friction points the specs close
- **Design system memory:** Locked per `feedback_design_locked.md` (2026-04-16) · do not propose color/font changes without explicit approval

---

## Status

| Doc | State |
|---|---|
| 01 Current-state wireframes | ✓ Complete · ready for review |
| 02 End-to-end wireframes | ✓ Complete · ready for review |
| 03 Build specs | ✓ Draft v1 · design module to refine, then hand to Codex |
| Wave 1 PRs | ⏸ Pending design module pass |
