# Page · Program Workshop Mode

Status: Canonical (CAT1)
Authored: 2026-04-25

## Page purpose

Program Workshop Mode is the **center-canvas, Nexus-led workshop
room**. It is where the Client Maestro prepares for, runs, and
synthesizes a single program phase. The page is single-focus by
design: one phase, one workshop, one decision-grade artifact at a
time. The Maestro drives. Nexus prepares the brief, captures what
the Maestro records, and synthesizes the outcome after the session.
Atlas only speaks **about** the workshop, never **in** the room.

## Primary user question

"What do I need to walk into this workshop fully prepared, and what
gets captured after?"

## Primary agent

Nexus (with Steward at gate signature; Atlas only **about** the
workshop, never **in** it).

## Route(s)

- `/tenant/[tenantSlug]/programs/[programSlug]` — canonical
  per-program canvas.
- `/(maestro)/tenant/[tenantSlug]/programs/[programSlug]` —
  Maestro alias.
- Legacy `/programs/[programId]` — kept for backwards compat;
  deprecated in favor of the canonical `/tenant/...` route.

## Required data contract / read model

- PF2 · Program Phase Workspace Contract.
- MW1 · Maestro Workshop Intelligence Contract.
- MW2 · Workshop Readiness Read Model.
- PDEL · Program Deliverables / Artifacts Read Model.
- SOL1 · Solution Architecture Composition Contract (drives the
  decision-grade deliverable).
- SOL2 · AI-led PDLC Solution Component Pack (drives the
  pattern-driven solution composition).
- S9C · Program Phase / Gate status rendering.

## What the page knows

- Current phase and current gate state for the program.
- The pre-workshop brief (objective, required attendees, pre-read
  list, agenda, questions to ask, likely tensions, decisions
  needed, evidence checklist).
- Active deliverable for the current phase (one center-canvas
  artifact).
- Gate readiness signal from Steward (signed / missing_inputs /
  not_wired).
- Solution architecture draft state (pattern-driven /
  LLM-composed / SME-validated).
- Recommended SMEs to bring into the next workshop (recommendation
  only — never auto-assigned).
- Post-workshop synthesis status (captured / pending / blocked).

## What the page is missing

- Live model-composed brief authoring — pre-workshop brief is
  deterministic in v2.
- Live transcript ingestion — meeting-notes ingestion is deferred.
- Calendar / SME booking integration — Nexus surfaces SMEs as
  recommendations only.
- Live Sentinel intervention in the room — Sentinel does not speak
  during workshops; it surfaces patterns afterward.

## Key user actions

- Read the pre-workshop brief, confirm attendees, walk in prepared.
- Open the active deliverable (center canvas) and edit / annotate.
- Record decisions and outputs as the workshop runs.
- Click a gate cap on the journey rail (left side) to inspect gate
  readiness in the right rail.
- Trigger post-workshop synthesis (Nexus composes the captured
  outputs into program state).
- Hand off to Steward for gate signature when readiness is met.

## Agent actions

- **Nexus** composes the pre-workshop brief, captures the captured
  outputs after the session, synthesizes them into the program
  state, surfaces the next recommended workshop.
- **Steward** signs the gate when readiness is met; surfaces gate
  readiness state continuously.
- **Sentinel** does not speak in the room; surfaces patterns
  detected from the captured outputs after synthesis.
- **Atlas** does not speak in the room; composes executive
  editorial about the workshop only after Nexus has updated
  program state.

## Empty / degraded states

- No active deliverable for the phase → center canvas renders
  `EmptyInspector` with caption "No deliverable seeded for this
  phase. Steward seeds via Setup."
- Pre-workshop brief missing → render `EmptyInspector` with
  caption "Pre-workshop brief pending. Nexus composes when
  attendees + objective are confirmed."
- Gate `not_wired` → render gate cap with MUTED glyph; show
  Steward note inline ("Gate not wired — readiness contract
  pending").
- Post-workshop synthesis blocked → render `EmptyInspector` with
  caption "Synthesis blocked — Steward must seed missing
  evidence."

## Navigation / drill-down behavior

- Center canvas is the page's center of gravity. Side rails carry
  context (journey rail left, gate readiness right) but never
  compete for primary attention.
- Journey rail click → swap the active phase canvas inline (same
  page, no navigation).
- Deliverable click → opens in the center canvas (not a drawer —
  the deliverable IS the canvas).
- Gate cap click → opens gate readiness drawer on the right (no
  new page).
- Top nav `active="programs"` (Workshop Mode is a sub-surface of
  Programs).

## MVP / V1 / V2 scope

- **MVP** — pre-workshop brief, center canvas with active
  deliverable, journey rail, gate readiness rail, deterministic
  post-workshop synthesis.
- **V1** — adds SME recommendation rail, solution architecture
  draft surface (SOL1 / SOL2 binding), pattern-driven composition.
- **V2** — adds live transcript ingestion, live LLM-composed
  brief, live SME booking, full pattern graph traversal.

## Visual blueprint reference

- [`docs/design/pages/PROGRAMS_PAGE_BLUEPRINT.md`](../../design/pages/PROGRAMS_PAGE_BLUEPRINT.md)
  — JourneyRail + per-program canvas rules; Workshop Mode is the
  fully-zoomed per-program canvas.
- Visual canon: [`docs/design/ABARVA_VISUAL_CANON.md`](../../design/ABARVA_VISUAL_CANON.md).
