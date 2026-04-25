# Intelligence Page · Blueprint

Slice ID: DES1 / Intelligence blueprint
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25

This blueprint governs every implementation slice that touches the
tenant Intelligence surface — `/tenant/[tenantSlug]/intelligence`
and `/tenant/[tenantSlug]/intelligence/patterns/[patternKey]`.
Reads in `ABARVA_VISUAL_CANON.md`.

---

## 1. Surface scope

| Route | Purpose |
|---|---|
| `/tenant/[tenantSlug]/intelligence` | **Sentinel landing.** Sentinel brief + active patterns strip + dynamic insight canvas. |
| `/tenant/[tenantSlug]/intelligence/patterns/[patternKey]` | **Pattern detail.** Per-pattern definition, evidence trail, related patterns, handoff guidance (I3 + I4). |

---

## 2. Sentinel Brief (hero)

The Sentinel Brief is the **page voice**. Anchors top of landing.

### Visual treatment

- Same panel shell as Atlas / Steward briefs (canon §H).
- 3px **left border** in `AMBER` (Sentinel accent — clinical).
- Light `card` surface (white) — not a dark hero.
- Eyebrow: `Sentinel · pattern detection read model` mono.
- Title: H3 (DM Sans 600, color `INK`).
- Severity + confidence chips top-right; tooltip = interpretation
  basis.
- Three disabled "Ask Sentinel" chips with sub-label
  `deferred · live sentinel runtime`.
- Footer caption disclaims live retrieval.

### Forbidden

- Two briefs on the same page (no Atlas brief co-resident).
- Sentinel claiming `high` confidence from seed alone.
- Sentinel inventing dollar amounts.
- Always-on chat panel.

---

## 3. Active Patterns strip

Below the brief, a strip of **Active Pattern Detections** — one card
per I1 detection in canonical sort order.

### Layout

- Section header: eyebrow `Active patterns · <count>` mono +
  serif H3 retired (DM Sans H3 instead, weight 600).
- Grid: `repeat(auto-fill, minmax(340px, 1fr))`.
- Each card consumes I1 + I2 + I3 + I4 contracts via `PatternCard`.

### Empty state

- Dashed-border placeholder: "No active pattern detections in the
  seed today. Once seed-population lands, evidence and value gaps
  will surface here automatically — no change to this page is
  required."

---

## 4. Dynamic Insight Canvas

The Dynamic Insight Canvas is **the same panel** that adapts to four
interaction modes. Operators never navigate to a new page.

### Mode 1 · Summary (default)

- Renders the Sentinel Brief + active patterns strip.

### Mode 2 · Evidence

- Selecting a pattern card swaps the canvas into evidence mode.
- The brief pane shrinks to a one-line callout of the active
  pattern.
- The active patterns strip collapses to a left rail (chip per
  pattern).
- Center surface renders the I3 evidence trail with honest
  `Evidence citations are not yet wired` caption.
- I4 authored-content panel anchors the right column.

### Mode 3 · Programs

- Selecting "Programs affected" swaps to programs mode.
- Center surface: per-affected-program card grid with phase /
  gate / evidence / value chips.
- Each card routes to canonical Programs detail.

### Mode 4 · Actions

- Renders a deterministic action list pulled from the top
  detection's `recommendedAction` + handoff guidance + I4
  interventions.
- Each row: action label · target agent chip · "Open" affordance.

### Mode rules

- **Only one mode active at a time.**
- **Mode switches do not navigate.** They restate the canvas.
  URL stays on `/tenant/.../intelligence`.
- **Mode chips** sit immediately below the brief. Active mode is
  NAVY-accent-underlined; inactive modes are muted.

---

## 5. Sentinel interaction rail

A **right-side rail** persists across all four modes.

### Rail content

- Eyebrow: `Sentinel · interaction` mono.
- Three deterministic disabled prompts (matches the brief follow-ups).
- "more" expand reveals four additional pre-canned prompts
  contextual to the active mode.
- Inspector slot below the prompts where a selected pattern row
  renders full detail.

### Forbidden

- Giant always-on chat panel (the rail is **not** a chat).
- Rail wider than 360px on desktop.
- Animated avatar / face / talking head.

---

## 6. Internal vs. external dataset basis

Every Intelligence surface respects the dual basis (matches ACT1
§J).

- **Internal**: tenant's own captured artifacts. Defensible at
  G3 / G4 once evidence is wired.
- **External**: AbarVa pattern library (PF1), I4 authored content,
  benchmarks. Surfaced as comparisons or references, never as the
  tenant's own captured state.

Every brief sentence, pattern card, evidence row, and authored
content panel tags its basis (`internal` or `external`) via a chip.

---

## 7. Same-canvas interaction model

The Intelligence surface is **one canvas, four modes** — not four
pages.

- Single React tree under `/tenant/.../intelligence`.
- Detail route `/tenant/.../intelligence/patterns/[patternKey]`
  reserved for **deep links**; arriving from email / shared link
  lands on the pattern detail with the canvas in Evidence mode.
- Mode switches are state changes; only deep-links or "Open
  pattern detail →" change the URL.
- "← Back to Intelligence" returns to the landing surface in the
  prior mode.

---

## 8. Acceptance criteria

An Intelligence implementation slice is `verified` when:

1. Sentinel Brief renders at the top of the landing surface with
   the canonical I2 field set.
2. Severity / confidence chips on the brief tooltip the
   `interpretationBasis`.
3. Three disabled "Ask Sentinel" chips render with sub-label
   `deferred · live sentinel runtime`.
4. Active patterns strip renders one `PatternCard` per I1
   detection in canonical sort order; affected program codes link
   to canonical Programs detail.
5. Dynamic Insight Canvas supports four modes (Summary / Evidence /
   Programs / Actions). Only one active at a time. Switching modes
   does not navigate.
6. Sentinel interaction rail anchors the right column across all
   four modes.
7. Pattern detail route renders the I3 + I4 stack including
   authored content panel.
8. Internal vs. external basis is tagged on every brief sentence,
   pattern card, evidence row, and authored content panel.
9. No surface invents a dollar amount or claims a real `E-###`
   citation.
10. No surface implies live retrieval; deterministic-source
    captions visible at every panel footer.
