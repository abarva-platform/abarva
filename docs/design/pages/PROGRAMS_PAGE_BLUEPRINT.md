# Programs Page · Blueprint

Slice ID: DES1 / Programs blueprint
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25

This blueprint governs every implementation slice that touches the
Programs surface — `/tenant/[tenantSlug]/programs` and
`/tenant/[tenantSlug]/programs/[programSlug]`. Reads in
`ABARVA_VISUAL_CANON.md`; implementations conform to both.

---

## 1. Surface scope

| Route | Purpose |
|---|---|
| `/tenant/[tenantSlug]/programs` | **Portfolio table.** One row per active program. Triage view. |
| `/tenant/[tenantSlug]/programs/[programSlug]` | **Program journey.** Six-phase rail, gate caps, per-phase deliverables, Nexus rail. |
| `/tenant/[tenantSlug]/programs/[programSlug]/phase/[phaseNum]` | **Phase / workshop center canvas.** Workshop room. |
| `/tenant/[tenantSlug]/programs/[programSlug]/deliverables/[deliverableCode]` | Deliverable canvas (existing). |

---

## 2. Portfolio (programs index)

- **Page title** `<tenant> · Programs portfolio` (DM Sans H1, weight
  700, color `INK`).
- Eyebrow above title: `<tenant slug> · seed-only` mono uppercase.
- Steward readiness chip top-right (ready / partial / blocked
  pill in NAVY / AMBER / RED).
- **Table / card hybrid**: a calm table with ≤ 6 columns
  (Program · Pattern · Phase · Gate · Owner · Status). Each row
  carries a status chip (NAVY / AMBER / RED) instead of a colored
  background.
- Row hover: `surface2`. Click → program journey.
- No filters in v1; sort by phase desc + name asc.
- Empty portfolio renders a dashed-border placeholder ("No programs
  are seeded for this tenant yet."), never a blank page.
- Programs in canonical Execute (5) emit `—` in the gate column —
  no fake G5.

---

## 3. Program journey

The journey page is the **Maestro's room**. Four bands.

### Band 1 · Header

- Eyebrow: `<tenant> · <pattern key> · <archetype>` mono.
- Title: program name in DM Sans H1.
- Subtitle: 1 – 2 sentences from `programs-canonical-view`.
- Right-aligned chips: phase chip · gate chip · evidence chip ·
  value chip.

### Band 2 · Six-phase journey rail (`JourneyRail`)

- Linear left-to-right rail over the canonical six phases:
  origination → charter → diagnose → design → execute → verify.
- Active phase highlighted in NAVY; future phases muted hairline;
  past phases NAVY-tinted.
- A **gate cap** sits between phases for G1 / G2 / G3 / G4 with
  status chip (signed / missing inputs / not wired).
- Each phase node clickable; click → phase canvas.
- Programs in Execute emit no gate cap after phase 5 — honestly.

### Band 3 · Phase-anchored sections

Below the rail, six in-page sections — one per phase. Active phase
auto-scrolls to view; others collapsible.

Per-phase structure:

1. Eyebrow `Phase <N> · <label>` mono.
2. Phase summary (one sentence body).
3. **Deliverables grid** — one card per deliverable (consumes
   PDEL `program-artifact-inventory`). Each card carries a
   `FileTypeChip` (`HTML` / `XLS` / `NOTE` / etc.), tier, status,
   routing affordance.
4. **Evidence + value strip** — counts of cited /
   quality_checked / usable_as_evidence per phase.
5. **Steward note** — one sentence; routes to the recommended next
   action.

### Band 4 · Nexus mastermind rail

A right-side rail (or floating mast) carries Nexus.

- Eyebrow: `Nexus · program mastermind`.
- AgentBadge: `nexus · partial / ready / blocked`.
- Renders Context Bundle composition state (complete /
  usable_with_gaps / pattern_only / insufficient / blocked).
- Names the missing-input list when below `usable_with_gaps`.
- Three disabled "Ask Nexus" follow-ups with sub-label
  `deferred · live nexus runtime`.
- Routes the operator to the Maestro Workshop brief (MW1).

---

## 4. Phase / workshop center canvas

Center-canvas view for a single phase.

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

- Center canvas renders the active deliverable as `html_render` /
  `markdown_render` / `note_list` (PDEL `getRenderableDeliverables`).
- Workshop notes pane below.
- Steward gate panel right rail: `Steward · gate <N>` eyebrow,
  inputs vs missing inputs, readiness verdict, "advance phase"
  affordance disabled until gate inputs are captured (sub-label
  `deferred · gate inputs missing`).
- MW1 pre-workshop brief reachable in one click.

---

## 5. Nexus mastermind role

- Where: program journey rail + phase canvas. Nexus is **the**
  voice on Programs.
- Voice: neutral, briefing register. Never editorial.
- Reads: Context Bundle (S1 / S4), program seed (S9), pattern key
  (I1).
- Refuses substantive answers when the bundle is `insufficient` /
  `pattern_only` / `blocked`. Surfaces the absence honestly.
- Confidence cap: `medium` from seed alone.

---

## 6. Steward gate role

- Where: gate caps in the journey rail; right rail in the phase
  canvas; per-phase Steward notes.
- Voice: utility-clerical, zero hedging.
- Reads: canonical hard-gate strip (S9c) + readiness summary (S9d)
  + evidence + value state.
- Refuses phase advancement when hard-gate inputs are missing.
- Recommends a single most-leveraged next action with route.

---

## 7. Deliverables / artifacts by phase

Consumes the **PDEL `program-artifact-inventory`** read model.

- Generated deliverables → `html_render` cards.
- Workshop notes → `note_list` row.
- Uploaded charter docs → `pdf_preview` row (renderable: false).
- Decision records → `markdown_render` rows.
- Evidence artifacts → linked from the evidence chip.
- Datasets / spreadsheets / presentations → render-deferred chips
  with honest fallback captions.

Sort: phase bucket asc → artifact type alphabetical → id asc.

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
- Right-rail Nexus AND center-canvas Nexus simultaneously.
- Live "Ask Nexus" runtime claim.
- Dollar amounts not value-ledger-backed.
- Real `E-###` citations.
- Big icons or pictogram-heavy chrome.

---

## 9. Acceptance criteria

A Programs implementation slice is `verified` when:

1. Portfolio renders ≤ 6-column table-card hybrid with Steward
   readiness chip at top-right.
2. Programs in Execute emit no gate chip in the gate column.
3. Program journey shows the six-phase JourneyRail with G1 – G4
   gate caps and status chips.
4. Each phase section: eyebrow, summary, deliverables grid (PDEL),
   Steward note routing to next action.
5. Nexus rail surfaces Context Bundle state and missing-input list
   with disabled "Ask Nexus" chips (`deferred · live nexus
   runtime`).
6. Phase canvas renders the active deliverable in `html_render`
   mode and a Steward gate panel on the right.
7. MW1 Maestro Workshop brief reachable in one click.
8. Save / stop / start program-state respect MW1's lifecycle.
9. No surface invents a dollar amount or real `E-###` citation.
10. No surface implies live model invocation; deterministic-source
    captions visible everywhere.
