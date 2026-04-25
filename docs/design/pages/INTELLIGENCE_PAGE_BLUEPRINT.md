# Intelligence Page · Blueprint

Slice ID: DES1 / Intelligence blueprint
Document type: page-level design contract.
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25

This blueprint governs every implementation slice that touches the
tenant Intelligence surface — `/tenant/[tenantSlug]/intelligence`
and `/tenant/[tenantSlug]/intelligence/patterns/[patternKey]`.
Reads in the `ABARVA_VISUAL_CANON.md` direction; implementations
must conform to both.

---

## 1. Surface scope

| Route | Purpose |
|---|---|
| `/tenant/[tenantSlug]/intelligence` | **Sentinel landing.** Sentinel brief + active pattern strip + dynamic insight canvas. |
| `/tenant/[tenantSlug]/intelligence/patterns/[patternKey]` | **Pattern detail.** Per-pattern definition, evidence trail, related patterns, handoff guidance (I3 + I4). |

---

## 2. Sentinel Brief

The Sentinel Brief is the **page voice**. It anchors the top of the
landing surface.

### Required fields (I2 contract, restated)

- `title` · `<tenant> · Sentinel intelligence brief`
- `topPattern`
- `topSeverity` (uppercase)
- `topConfidence` (uppercase)
- `whatSentinelSees` — single sentence
- `whyItMatters` — one sentence (top detection's `whyItMatters`)
- `affectedPrograms` — one sentence
- `recommendedAction` — one sentence (routes to a real destination)
- `suggestedHandoffs` — handoff targets pulled from the top
  detection
- `suggestedFollowUps` — exactly three deterministic disabled
  chips (canonical Ask-agent rule)
- `sourceLabel` — `deterministic_seed` or
  `pattern_detection_read_model`
- `interpretationBasis` — one-line caption

### Visual treatment

- Same panel shell as Atlas / Steward briefs (canon §H).
- 3px left border in **amber** `#B45309` (Sentinel accent for
  pattern detection — clinical voice).
- Severity + confidence chips at top right; tooltip = interpretation
  basis.
- Three disabled "Ask Sentinel" follow-up chips with sub-label
  `deferred · live sentinel runtime`.
- Footer caption echoes interpretation basis and disclaims live
  retrieval.

### Forbidden

- Two briefs on the same page (no Atlas brief co-resident).
- Sentinel claiming `high` confidence from seed alone.
- Sentinel inventing a dollar amount.

---

## 3. Active Patterns strip

Below the brief, a strip of **Active Pattern Detections** — one card
per I1 detection in the canonical sort order.

### Layout

- Section header: eyebrow `Active patterns · <count>` + serif H3
  `What Sentinel is mining from the Fabric`.
- Grid: `repeat(auto-fill, minmax(340px, 1fr))`.
- Each card consumes I1 + I2 + I3 + I4 contracts.

### Card content (per detection)

- Pattern name eyebrow in agent accent.
- Severity + confidence MiniChips at top-right.
- Title (serif, weight 600).
- Summary (DM Sans body).
- `whyItMatters` italic caption (muted).
- 2-cell stat grid (`Programs` · `Source signals`).
- Affected program list (top 4 + "+ N more" overflow). Each program
  code links to canonical Programs detail.
- Collapsible `Missing inputs · <count>` `<details>` block.
- Recommended-action row.
- Handoff chips (one per handoff target).
- "Open pattern detail →" routing affordance.

### Empty state

- Dashed-border card naming the absence: "No active pattern
  detections in the seed today. Once seed-population lands, evidence
  and value gaps will surface here automatically — no change to
  this page is required."

---

## 4. Dynamic Insight Canvas

The Dynamic Insight Canvas is **the same panel** that adapts to
four interaction modes — Summary, Evidence, Programs, Actions. The
operator never navigates to a new page to see related angles.

### Mode 1 · Summary (default)

- Renders the Sentinel Brief + active patterns strip.
- This is the "what's going on" view.

### Mode 2 · Evidence

- Selecting a pattern card swaps the canvas into evidence mode.
- The brief pane shrinks to a one-line callout of the active
  pattern.
- The active patterns strip collapses to a left rail (chip per
  pattern).
- The center surface renders the I3 evidence trail: per-S9e signal
  rows with `signalId`, type, severity, program, route, and an
  honest `Evidence citations are not yet wired` caption.
- An I4 authored-content panel anchors the right column with
  definition, failure modes, interventions, required evidence,
  related patterns, handoff guidance.

### Mode 3 · Programs

- Selecting "Programs affected" anywhere in the canvas swaps to
  programs mode.
- Center surface: a per-affected-program card grid with phase /
  gate / evidence / value chips per program.
- Each card routes to the canonical Programs detail; the canvas
  remembers state when the user comes back.
- The brief pane reframes to: "Sentinel · <pattern> · across N
  programs."

### Mode 4 · Actions

- Renders a deterministic action list pulled from the top
  detection's `recommendedAction` + handoff guidance + I4
  interventions.
- Each row shows: action label (DM Sans body 14px) · target agent
  chip · "Open" affordance.
- The brief pane reframes to: "Sentinel · <pattern> · next
  actions."

### Mode rules

- **Only one mode active at a time.** Modes are mutually exclusive.
- **Mode switches do not navigate.** They restate the canvas. The
  URL stays on `/tenant/.../intelligence`.
- **Modes are urlable.** A `?mode=evidence` query param is
  preserved on refresh (future slice). Default = summary.
- **Mode chips** sit immediately below the brief, in the top-left
  of the canvas. Active mode is teal-accent-underlined; inactive
  modes are muted.

---

## 5. Sentinel interaction rail

A **right-side rail** persists across all four modes. It is
Sentinel's voice in the canvas.

### Rail content

- Rail header: `Sentinel · interaction` eyebrow.
- Three deterministic prompts (the same three follow-ups as the
  brief): walk-top-pattern · program-cross-section · recurrence-
  history. All disabled until live runtime.
- A "more" expand affordance reveals four additional pre-canned
  prompts contextual to the active mode.
- Below the prompts, an inspector slot (drawer-style) where a
  selected pattern row can render full detail.

### Forbidden

- Giant always-on chat panel (the rail is not a chat).
- Rail wider than 360px on desktop; collapses to a top sheet on
  narrow viewports.
- Animated avatar / face / talking head.

---

## 6. Internal vs. external dataset basis

Every Intelligence surface respects the dual basis (matches ACT1
§J).

### Internal basis

- Sourced from the tenant's own captured artifacts (S9e signals,
  ADM3 dataset inventory, deliverables, value ledger).
- Atlas / Sentinel can defend internal-basis claims at G3 / G4 once
  evidence is wired.

### External basis

- Sourced from the AbarVa pattern library (PF1 failure modes), I4
  authored content, public reports, peer benchmarks.
- Surfaced as **comparisons or references**, not as the tenant's
  own captured state.

### Rules

- Every brief sentence, pattern card, evidence-trail row, and lens
  read tags its basis (`internal` or `external`).
- Mixed-basis surfaces must surface the distinction explicitly via
  a chip on the affected row.
- Authored content (I4) is always external basis; the panel header
  carries the chip `source · deterministic seed`.
- Dataset rows (when surfaced inside Intelligence as cross-links to
  ADM4) carry their `internal` chip.

---

## 7. Same-canvas interaction model

The Intelligence surface is **one canvas, four modes** (per §4) —
not four pages.

### Why

- Operators read patterns and stay; navigating away breaks the
  thread.
- The Sentinel rail anchors continuity.
- The brief reframes per mode without losing the mode-switch state.

### Implementation rules

- Single React tree under `/tenant/.../intelligence`. The detail
  route `/tenant/.../intelligence/patterns/[patternKey]` is reserved
  for **deep-link** views — operators arriving from email or shared
  links land directly on the pattern detail with the canvas in
  Evidence mode.
- Mode switches are state changes; only on a deep-link or "Open
  pattern detail →" anchor click does the URL change.
- The detail route renders the full I3 + I4 stack (header, summary,
  why-it-matters, recommended action, affected programs, evidence
  trail, missing inputs, suggested handoffs, authored content
  panel, footer).
- "← Back to Intelligence" link on the detail route returns to the
  landing surface in the mode the operator was in.

---

## 8. Acceptance criteria

An Intelligence implementation slice is `verified` when:

1. Sentinel Brief renders at the top of the landing surface with
   the canonical I2 field set.
2. Severity / confidence chips on the brief tooltip the
   `interpretationBasis`.
3. Three disabled "Ask Sentinel" follow-up chips render with sub-
   label `deferred · live sentinel runtime`.
4. Active patterns strip renders one card per I1 detection in
   canonical sort order; affected program codes link to canonical
   Programs detail.
5. Dynamic Insight Canvas supports four modes (Summary / Evidence /
   Programs / Actions). Only one mode active at a time. Switching
   modes does not navigate.
6. Sentinel interaction rail anchors the right column across all
   four modes; "Ask Sentinel" runtime is deferred.
7. Pattern detail route renders the I3 + I4 stack including
   authored content panel; "← Back" returns to the landing surface
   in the prior mode.
8. Internal vs. external basis is tagged on every brief sentence,
   pattern card, evidence row, and authored content panel.
9. No surface invents a dollar amount; no surface claims a real
   `E-###` citation.
10. No surface implies live retrieval; deterministic-source
    captions visible at every panel footer.
