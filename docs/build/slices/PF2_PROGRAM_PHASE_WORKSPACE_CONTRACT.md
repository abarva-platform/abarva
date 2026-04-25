# PF2 · Program Phase Workspace Contract

Slice ID: PF2
Slice name: Program Phase Workspace Contract
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Specification / contract document only — no application code,
no runtime modification, no migrations, no model calls.

This contract governs the **Program Phase Workspace** — the
center-canvas, Nexus-led workshop room where the Client Maestro
prepares for, runs, and synthesizes a single program phase. It
extends MW1 (Maestro Workshop Intelligence Contract) and PDEL
(Program Deliverables / Artifacts Read Model) into a concrete
workspace shape. **No application code, no runtime modification, no
migrations, no model calls in this slice.**

---

## 1. Purpose

The program phase workspace is a **center-canvas, Nexus-led workshop
room**. The Client Maestro drives every decision in the room; Nexus
prepares the brief, captures what the Maestro records, and
synthesizes the outcome after the session. The workspace exists so
the Maestro never has to context-switch between a directory of
deliverables, a chat panel, and a notes app.

It is explicitly **NOT**:

- A left-rail navigation experience that demotes the workshop to a
  list item.
- A split-view dashboard with two competing primary panes.
- A chat surface where Atlas or any other agent speaks **in** the
  room.
- A document editor that buries gate readiness and evidence behind
  tabs.

The Maestro (human) drives. Nexus prepares + captures + synthesizes.
Atlas only speaks **about** the workshop, never **in** it.

---

## 2. Why phase / workshop mode should use the center canvas

The phase canvas is where decisions happen. It must read like a
**single artifact**, not a directory.

- Center-canvas keeps the Maestro's attention on the deliverable
  under discussion. The deliverable is the room's center of
  gravity, not a list of files.
- The Maestro's mental model during a phase is a single workshop
  (prepare → run → synthesize → decide). The canvas mirrors that
  model. Multi-pane dashboards force the Maestro to reconcile
  multiple foci while leading a real conversation.
- Side rails carry context (journey rail on the left, gate
  readiness on the right) but never compete for primary attention.
  They render calm at all times — no badges, no animations, no
  pulsing counters.
- A drawer overlay carries per-row detail (evidence row, decision
  record, attendee detail). Drawers do not split the canvas; they
  occlude it briefly and dismiss.
- Phase mode switches do not navigate. The URL stays on the phase
  route. The center canvas re-skins to match the active mode while
  the rails hold steady.

Center-canvas is the only layout that lets the workshop read as one
artifact while the rails hold context.

---

## 3. Layout

```
+----------------------------------------------------------------------------+
|  Program header  ·  tenant · program · phase eyebrow · status pill         |
+----------+-----------------------------------------------------+-----------+
|          |                                                     |           |
|  Journey |               Center canvas (~70%)                  |  Context  |
|  rail    |                                                     |  panel    |
|  (≤220px)|   - Active mode artifact                            |  (≤320px) |
|          |   - Workshop notes pane (collapsible)               |           |
|  P0 Discov.|     · default-open on the active phase            |  Steward  |
|   |        |   - Evidence drawer trigger                       |  gate     |
|  P1 Frame  |   - Inline capture affordances                    |  readiness|
|   | G1 cap |                                                   |           |
|  P2 Plan   |   ( hosts: phase overview / workshop preparation /|  Missing  |
|   |        |     live session support / notes synthesis /      |  inputs   |
|  P3 Deliver|     deliverable refinement / gate readiness )     |           |
|   | G2 cap |                                                   |  Recommend|
|  P4 Adopt  |                                                   |  next     |
|   | G3 cap |                                                   |  action   |
|  P5 Scale  |                                                   |           |
|   | G4 cap |                                                   |  (calm,   |
|          |                                                     |  not      |
|          |                                                     |  chatty)  |
+----------+-----------------------------------------------------+-----------+
|                Detail drawer (single-instance overlay)                     |
|  · evidence rows · decision records · attendee detail · 120ms fade only    |
+----------------------------------------------------------------------------+
```

- **Left journey rail** (≤ 220px) — six-phase journey rail with G1,
  G2, G3, G4 gate caps interleaved between phases. Collapses to an
  icon strip on narrow viewports.
- **Center canvas** (~70% of the available width) — Nexus
  conversation / workshop canvas. Hosts the active deliverable
  preview, the workshop notes pane, and the evidence drawer
  trigger. The canvas re-skins per phase mode without leaving the
  phase route.
- **Right compact context panel** (≤ 320px) — Steward gate
  readiness, missing inputs, and the recommended next action. Calm
  surface; never chatty; no streaming text; no agent-talk.
- **Detail drawer** — overlay for evidence rows, decision records,
  attendee detail. Single-instance per page; replaces any open
  drawer rather than stacking.

---

## 4. Phase modes

The center canvas supports **six explicit modes**. Modes are
mutually exclusive; only one renders at a time. Mode switches are
in-canvas re-skins — they do not change the URL.

### 4.1 phase overview

Calm summary of the phase. Top deliverables grid, phase eyebrow,
phase summary copy. No active workshop content; this is the
default landing for an inactive phase.

### 4.2 workshop preparation

Renders the MW2 readiness brief inside the canvas: agenda,
pre-read, questions, expected decisions. Maestro reviews and edits
the brief before the session.

### 4.3 live session support

Minimal chrome. The notes pane is the prominent affordance.
Capture affordances render inline (decision, risk, missing input,
follow-up). The right rail dims to avoid pulling attention from
the room.

### 4.4 notes synthesis

Post-session view. Notes flow into decisions, risks, missing
inputs, and follow-ups via the deterministic extractors (PF4).
The Steward verdict for the next gate is shown. The recommended
next session is surfaced; Maestro decides.

### 4.5 deliverable refinement

Active deliverable rendered in the canvas at its PDEL
`html_render` mode. Inline edit affordance is exposed per
deliverable. The Stub → Outline → Rich promotion ladder is shown
so the Maestro can see and trigger the next tier promotion (PF5).

### 4.6 gate readiness

Steward gate readiness verdict for the gate immediately after this
phase. The canonical hard-gate strip is rendered. The
advance-phase affordance is **disabled until inputs are captured**;
it never silently advances.

---

## 5. Client Maestro + Nexus roles

- **Client Maestro** — the human consultant who runs the room. The
  Maestro:
  - Owns the phase decision.
  - Sets the agenda, leads the conversation, and selects SMEs.
  - Captures notes (typed, pasted, or uploaded).
  - Confirms deterministic extractor outputs before they are
    filed to the program state.
  - Is the only role that can **advance the phase**.

- **Nexus** — the program mastermind. Nexus:
  - Composes the pre-workshop brief from program state and Maestro
    intent.
  - Names which gate is at risk and why, against the canonical
    PF1 failure-mode pack.
  - Captures Maestro inputs into the program state (notes,
    decisions, risks, missing inputs, follow-ups).
  - Synthesizes the post-session state and recommends the next
    session.
  - Never speaks in the workshop.

- **Atlas** — only speaks **about** the workshop, in the executive
  brief, after Nexus has updated the program state. Atlas does not
  appear inside the phase canvas.

---

## 6. AbarVa SME / resource participation

- **SMEs** are surfaced via MW1 §I recommendation logic — top three
  SMEs with reason captions (pattern key match, industry alignment,
  prior tenant engagement, calendar availability). The Maestro
  selects who attends. The platform never auto-books an SME.
- **AbarVa resources** — pattern library, authored content, prior
  case examples, vendor evaluations, regulatory references — are
  composed alongside Nexus retrieval into the Maestro's
  pre-workshop brief. They appear as cited snippets in the
  workshop preparation mode, never as raw model output.
- The right context panel may carry an SME-recommendation chip
  during workshop preparation mode. The chip never auto-resolves
  to a calendar invite.

---

## 7. Save / stop / resume state

The workspace exposes the three explicit lifecycle affordances
defined in MW1 §G:

- **Save** — flush in-progress workspace state without advancing
  the phase. Emits an audit row tagged with the saving Maestro,
  the phase, the mode, and a timestamp. Save is non-destructive
  and idempotent within a session.
- **Stop** — pause the program. Nexus surfaces a resume checklist
  (open decisions, missing inputs, pending follow-ups). The
  workspace is read-only until resumed.
- **Resume** — replay the Context Bundle (S1 / S2) from the last
  save point and re-open the workspace at the same mode. Resume
  never silently mutates state.
- **Maestro is the only role that advances the phase.** Save,
  Stop, and Resume do not advance the phase. Phase advancement
  requires an explicit Maestro action against the gate readiness
  mode and is refused while hard-gate inputs are missing.

---

## 8. Meeting notes / workshop material ingestion concept

Three sources are accepted today:

- **Typed notes** — entered directly in the platform's notes pane
  during the workshop or after.
- **Pasted notes** — text pasted from a personal note-taker (not a
  meeting bot).
- **Uploaded docs** — PDF / DOCX / Markdown files attached to the
  phase.

For every ingestion path:

- The **raw text is stored verbatim** as the source-of-truth for
  the capture.
- **Deterministic extractors** run over the raw text to produce:
  decisions, risks, objections, missing inputs, follow-ups. **No
  model invocation in v1.**
- The Maestro is asked to **confirm extractor outputs** before
  they are filed against the program state.
- Every record is tagged `source: 'maestro_capture'`,
  `createdFrom: 'deterministic_seed'`.

Explicitly deferred:

- Audio capture and real-time transcription.
- Meeting-bot ingestion (no third-party bot is admitted to the
  room).
- Model-based extraction or summarization.

---

## 9. Dynamic deliverables by phase

The PDEL `program-artifact-inventory` read model provides the
per-phase artifact set. The phase canvas:

- Surfaces the **active** deliverable for the phase at the PDEL
  render mode for that artifact:
  - `html_render` — generated deliverables (use case canvas,
    operating model doc, etc.).
  - `markdown_render` — decision records.
  - `note_list` — workshop notes.
  - `pdf_preview` — uploaded charters; non-renderable in canvas
    today, surfaces an honest fallback caption.
- After each session, the **Stub → Outline → Rich** tier promotion
  runs deterministically per MW1 §J. Promotion never invents
  content; it only re-tiers what the deterministic seed already
  carries.
- `downloadable` remains `false` today; the export pipeline is
  deferred (PF5).

---

## 10. Evidence / value / gate integration

Every phase canvas exposes:

- **Evidence chip** per relevant deliverable, colored per the
  PDEL evidence usability state:
  - **NAVY** — cited / quality_checked / usable_as_evidence.
  - **AMBER** — partial.
  - **RED** — blocked.
  - **MUTED** — not_seeded.
- **Value ledger reference** per the Atlas brief shape (S9g). The
  reference points at the program's value ledger; it does not
  fabricate dollar amounts and does not assert a real `E-###`
  citation.
- **Canonical gate caps** in the journey rail at G1 / G2 / G3 /
  G4. Gate caps render with the steward verdict color from S9c.
- **Steward gate readiness verdict** in the right context panel
  for the immediately upcoming gate.
- **Refusal of phase advancement** when hard-gate inputs are
  missing. The advance-phase affordance is disabled with a calm
  caption naming the missing input(s); no banner, no toast.

---

## 11. Interaction model

- **Click-to-explore.** Mode switches do not navigate; the URL
  stays on the phase route.
- **Drawer overlays** carry per-row detail (evidence rows,
  decision records, attendee detail). The drawer is
  **single-instance per page** — opening a new drawer replaces the
  current one rather than stacking.
- **120ms fade** animation only — no slide, no spring, no bounce.
- **Workshop notes pane** is collapsible per phase; it defaults
  open on the **active** phase and defaults collapsed on
  inactive phases.
- The right context panel is calm: no streaming text, no agent
  chat bubble, no animated badges.
- The left journey rail collapses to an icon strip on narrow
  viewports.

---

## 12. Acceptance criteria

1. The phase workspace renders a left journey rail (≤ 220px),
   center canvas (~70%), and right compact context panel (≤ 320px)
   at full width; the layout collapses the journey rail to an icon
   strip on narrow viewports.
2. The center canvas supports exactly six mutually exclusive
   modes — phase overview, workshop preparation, live session
   support, notes synthesis, deliverable refinement, gate
   readiness — and only one renders at a time.
3. Mode switches do not change the URL; the phase route is stable
   while modes re-skin the canvas.
4. Save, Stop, and Resume affordances are present per MW1 §G; only
   Save emits an audit row without advancing the phase, only Stop
   pauses the program with a resume checklist, and only Resume
   replays the Context Bundle from the last save point.
5. The Maestro is the only role that can advance the phase; phase
   advancement is refused while hard-gate inputs are missing.
6. Active deliverables render at their PDEL render mode
   (`html_render`, `markdown_render`, `note_list`, or
   `pdf_preview`) and never claim a render mode the artifact does
   not declare.
7. Every relevant deliverable in the canvas exposes an evidence
   chip whose color is derived from PDEL evidence usability
   (NAVY / AMBER / RED / MUTED).
8. The right context panel exposes the Steward gate readiness
   verdict and a recommended next action, calm in tone, with no
   streaming text and no agent-talk.
9. No phase canvas, mode, or chip fabricates a dollar amount, a
   real `E-###` citation, or a "live runtime" claim; all
   capture-derived records are tagged
   `source: 'maestro_capture'` and
   `createdFrom: 'deterministic_seed'`.
10. Detail drawer is single-instance per page; opening a new
    drawer replaces the current one. Drawer animation is a 120ms
    fade only.
11. The contract introduces no new runtime modules; it does not
    modify Sentinel, Atlas, Nexus, Agent runtime, Source UI,
    legacy `/programs`, `mock.ts`, auth, or supabase.
12. Atlas does not appear inside the phase canvas; Atlas-authored
    content surfaces only in the executive brief surface (S9g),
    not in the workshop room.

---

## 13. Future slices

- **PF3 · Workshop Template Read Model** — per workshop type,
  deterministic agenda + question library composed into the
  workshop preparation mode.
- **PF4 · Meeting Notes Ingestion Contract** — typed / pasted /
  uploaded sources with deterministic extractors (decisions,
  risks, objections, missing inputs, follow-ups); audio and
  meeting-bot capture remain deferred.
- **PF5 · Dynamic Deliverable Generation Contract** — Stub →
  Outline → Rich promotion logic and the export / download
  pipeline.
- **PF6 · Program Resume / State Continuity Contract** —
  audit-row backed save / stop / resume, including resume
  checklist composition and Context Bundle replay.
- **PF7 · Nexus Program Mastermind Rail v2** — live
  retrieval-backed pre-workshop brief composition, replacing the
  deterministic-seed brief once the retrieval substrate is
  online.

---

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npm run build` — pass

## Status

Code complete. Pending founder review.
