# Programs Page · Blueprint

Slice ID: DES1 / Programs blueprint
Document type: page-level design contract.
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25

This blueprint governs every implementation slice that touches the
Programs surface — `/tenant/[tenantSlug]/programs` and
`/tenant/[tenantSlug]/programs/[programSlug]`. Reads in the
`ABARVA_VISUAL_CANON.md` direction; implementations must conform to
both.

---

## 1. Surface scope

| Route | Purpose |
|---|---|
| `/tenant/[tenantSlug]/programs` | **Portfolio table.** One row per active program. Used by the Maestro to triage. |
| `/tenant/[tenantSlug]/programs/[programSlug]` | **Program journey.** One program in depth. Used by the Maestro and steering committee. |
| `/tenant/[tenantSlug]/programs/[programSlug]/phase/[phaseNum]` | **Phase / workshop center canvas.** One phase in depth. Workshop-grade detail. |
| `/tenant/[tenantSlug]/programs/[programSlug]/deliverables/[deliverableCode]` | Deliverable canvas (existing). |
| `/tenant/[tenantSlug]/programs/[programSlug]/evidence/[evidenceId]` | Evidence drawer (existing). |

---

## 2. Portfolio table (program index)

Above-the-fold:

- **Page title** — `<tenant> · Programs portfolio` in serif H1,
  eyebrow `<tenant slug> · seed-only`.
- **Steward readiness chip** at top-right naming overall portfolio
  health (ready / partial / blocked) with a one-line tooltip basis.

Body:

- **Single table.** Columns (≤ 6): Program · Pattern · Phase ·
  Gate · Owner · Status. The status column carries a chip; the
  pattern column carries the canonical pattern key from the I1
  read model.
- Row hover: `surface2` background. Click → program journey route.
- No filters above the table in v1; sort by phase desc + name asc.
- **No badges on the page header.** Status lives in rows.

Honest fallbacks:

- Empty portfolio renders a dashed-border card naming the absence
  ("No programs are seeded for this tenant yet."), not a blank page.
- Programs in canonical Execute (5) honestly emit zero gate chips
  in the gate column (no exit gate); render `—` not "G5".

---

## 3. Program journey

The journey page is the **Maestro's room**. It has four bands.

### Band 1 · Header

- Eyebrow: `<tenant> · <pattern key> · <archetype>`.
- Title: program name in serif H1.
- Subtitle: 1 – 2 sentence framing from `programs-canonical-view`.
- Right-aligned chips: phase chip · gate chip · evidence chip ·
  value chip.

### Band 2 · Six-phase journey rail

- Linear left-to-right rail of the canonical six phases:
  `origination → charter → diagnose → design → execute → verify`.
- Active phase is highlighted with the agent accent; future phases
  are muted; past phases are accent-tinted.
- Each phase node is clickable; click → phase center canvas.
- A **gate cap** sits between phases for G1 / G2 / G3 / G4. The
  gate cap shows status (signed / missing inputs / not wired).
- The rail never claims `signed_off` from the seed alone; honest
  states only.

### Band 3 · Phase-anchored sections

Below the rail, six in-page sections — one per phase — render in
order. The active phase auto-scrolls to view; others are
collapsible.

Per-phase section structure:

1. Eyebrow (`Phase <N> · <label>`).
2. Phase summary (1 sentence).
3. **Deliverables grid** — one card per deliverable in that phase
   (consumes the PDEL `program-artifact-inventory` model). Each
   card carries a file chip (`HTML` / `XLS` / `NOTE` / etc.), the
   tier, the status, and a routing affordance.
4. **Evidence + value strip** — counts of cited / quality_checked
   / usable_as_evidence per phase.
5. **Steward note** for the phase — one sentence; routes to the
   recommended next action.

### Band 4 · Nexus mastermind rail

A right-side rail (or floating mast) carries Nexus.

- Eyebrow: `Nexus · program mastermind`.
- Renders the Context Bundle composition state for the program
  (complete / usable_with_gaps / pattern_only / insufficient /
  blocked).
- Names the missing-input list when below `usable_with_gaps`.
- Three disabled "Ask Nexus" follow-ups (per the canon's "Ask
  agent" rules).
- Routes the operator to the specific Maestro Workshop (MW1) brief
  before the next session.

---

## 4. Phase / workshop center canvas

`/tenant/.../programs/.../phase/[phaseNum]` is a **center-canvas**
view for a single phase. It is the workshop room.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│  Phase header · objective · agenda · attendees                 │
├──────────────────────────┬────────────────────────────────────┤
│  Center canvas           │  Steward gate panel                │
│  · deliverable preview   │  · gate inputs                     │
│  · workshop notes        │  · readiness                       │
│  · evidence drawer       │  · blocking items                  │
│                          │  · next action                     │
└──────────────────────────┴────────────────────────────────────┘
```

### Center canvas

- Renders the **active deliverable** as HTML / Markdown via the
  PDEL `getRenderableDeliverables` filter.
- Workshop notes pane below (workshop-friendly typography:
  DM Sans body, 13 – 14px, line-height 1.6).
- Evidence drawer launches from a chip click; never a giant modal.
- Save / stop / start affordances honor MW1's program-state
  lifecycle.

### Steward gate panel (right rail)

- Eyebrow: `Steward · gate <N>`.
- Lists captured inputs vs. missing inputs.
- One-sentence readiness verdict.
- Disabled "advance phase" affordance until the gate's hard inputs
  are captured. Sub-label: `deferred · gate inputs missing` until
  cleared.

### Workshop intelligence handoff

- Before the workshop, a Maestro brief (MW1 §D contract) is one
  click away from the phase canvas.
- During the workshop, the canvas captures notes / decisions /
  risks / objections / missing inputs (MW1 §E).
- After the workshop, the synthesis pane (MW1 §F) updates the
  program state.

---

## 5. Nexus mastermind role

- **Where**: program journey rail + phase canvas. Nexus is **the**
  voice on Programs.
- **Voice**: neutral, briefing register. Never editorial.
- **Reads from**: Context Bundle composition (S1 / S4), program
  seed (S9), pattern key (I1).
- **Refuses**: substantive answers when the bundle is `insufficient`
  / `pattern_only` / `blocked`. Surfaces the absence honestly.
- **Confidence cap**: `medium` from seed alone. `high` requires a
  live retrieval pass (deferred).

---

## 6. Steward gate role

- **Where**: gate caps in the journey rail; right rail in the phase
  canvas; per-phase Steward notes inside the journey.
- **Voice**: utility-clerical. Zero hedging. Names blocking items.
- **Reads from**: canonical hard-gate strip (S9c) + readiness
  summary (S9d) + evidence + value state.
- **Refuses**: phase advancement when hard-gate inputs are missing.
- **Recommends**: the single most-leveraged next action with a
  route.

---

## 7. Deliverables / artifacts by phase

The journey page consumes the **PDEL `program-artifact-inventory`**
read model. Per phase:

- Generated deliverables → `html_render` cards in the deliverables
  grid.
- Workshop notes → `note_list` row in the phase summary.
- Uploaded charter docs → `pdf_preview` row (renderable: false
  today).
- Decision records → `markdown_render` rows.
- Evidence artifacts → linked from the evidence chip.
- Datasets / spreadsheets / presentations → render-deferred chips
  with honest fallback captions.

Sorting: phase bucket asc → artifact type alphabetical → id asc.

---

## 8. What to hide / show

### Always show

- Six-phase rail with live phase highlight.
- Gate caps with status chips.
- Per-phase eyebrow + summary + deliverables grid.
- Nexus rail with confidence + missing-input chips.
- Steward gate panel on the phase canvas.

### Hide by default (progressive disclosure)

- Per-deliverable detail (drawer on click).
- Workshop notes raw text (collapsible per phase).
- Missing-inputs full list (top 5 + "+ N more" overflow).
- Per-phase Sentinel patterns (link to Intelligence, not embedded).

### Never show

- Two briefs on the same page.
- A right-rail Nexus AND a center-canvas Nexus simultaneously.
- A live "Ask Nexus" runtime claim until live wires.
- Dollar amounts that are not value-ledger-backed.
- Real `E-###` citations until the registry resolves them.

---

## 9. Acceptance criteria

A Programs implementation slice is `verified` when:

1. Portfolio table renders with ≤ 6 columns and a Steward readiness
   chip at top-right.
2. Programs in canonical Execute phase honestly emit no gate chip
   in the gate column.
3. Program journey shows the six-phase rail with G1–G4 gate caps
   and status chips.
4. Each phase section carries an eyebrow, summary, deliverables
   grid (PDEL-backed), and a Steward note routing to the next
   action.
5. Nexus rail surfaces Context Bundle state and missing-input list;
   "Ask Nexus" chips render disabled with `deferred · live nexus
   runtime` sub-label.
6. Phase canvas renders the active deliverable in `html_render`
   mode and a Steward gate panel on the right.
7. Maestro Workshop brief (MW1) is reachable in one click from the
   phase canvas.
8. Save / stop / start program-state affordances respect MW1's
   lifecycle.
9. No surface invents a dollar amount or a real `E-###` citation.
10. No surface implies live model invocation; deterministic-source
    captions visible everywhere.
