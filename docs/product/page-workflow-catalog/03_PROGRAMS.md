# Page · Programs

Status: Canonical (CAT1)
Authored: 2026-04-25

## Page purpose

Programs is AbarVa's **portfolio canvas**. It is the surface where
operators read program-by-program state, where Nexus runs the
mastermind layer across the portfolio, and where Steward signs
phase gates. Programs is the first canonical proof surface for the
agent-centered runtime; every other surface (Source, Intelligence,
Tower, Admin) inherits the discipline this page establishes. The
page reads like a private-banking statement: deliberate, calm, and
trustable.

## Primary user question

"What is the state of the program portfolio, and where do I act
next?"

## Primary agent

Nexus (with Steward at gate boundaries; Sentinel and Atlas surface
through cross-link chips only).

## Route(s)

- `/tenant/[tenantSlug]/programs` — canonical Programs portfolio.
- `/(maestro)/engagements` — Maestro alias for the same portfolio
  with engagement framing.
- Legacy `/programs` — kept for backwards compatibility; deprecated
  in favor of `/tenant/[tenantSlug]/programs`.

## Required data contract / read model

- S8 · Programs Page Readiness Contract.
- S9 · Programs canonical index + detail proof.
- S9B · Programs Nexus Rail metadata binding.
- S9C · Program Phase / Gate status rendering.
- S9D · Program Deliverables / Evidence / Value summary.
- S9E · Programs Control Tower signal read model.
- PDEL · Program Deliverables / Artifacts Read Model.
- PF2 · Program Phase Workspace Contract (drives drill-in to
  Workshop Mode).

## What the page knows

- Portfolio roster: program code, name, current phase, current
  gate, evidence posture, named Steward.
- Per-program signal: pressure type, pressure severity (`critical`
  / `high` / `medium` / `low`).
- Cross-program orchestration cues from Nexus (e.g., "PRG-02 G2
  needs the same contract Steward already signed on PRG-04").
- Per-program value summary: projected vs realized (M6 dual
  ledger).
- Active patterns mentioning the program (cross-link from I1).

## What the page is missing

- Live program editor / authoring tools — programs are seed-driven
  in v2.
- Cross-tenant rollups — Programs is per-tenant in v2.
- Live deliverable generation pipeline — generated deliverables are
  deterministic in v2.
- Pattern graph traversal beyond the M1–M6 hooks — full traversal
  is deferred.

## Key user actions

- Read the Nexus portfolio brief and follow the recommended action.
- Read the metric strip (≤ 5 metrics) summarizing portfolio state.
- Click a row in the portfolio table to drill into the per-program
  canvas without leaving the page (or navigate to the Workshop
  Mode page for full focus).
- Open a deliverable from the per-program canvas (opens
  `DetailDrawerShell` on the same page — no new page).
- Click a gate cap on the rail to inspect gate readiness.

## Agent actions

- **Nexus** composes the portfolio brief, names the recommended
  next move, surfaces cross-program orchestration callouts.
- **Steward** signs gates, owns the gate readiness signal (`signed`
  / `missing_inputs` / `not_wired`) on each row.
- **Sentinel** appears as a NAVY chip "Sentinel: pattern PT-12
  affects this program" when a pattern detection mentions the
  program; clicking opens Intelligence with the pattern preselected.
- **Atlas** does not author content here; Atlas links into Programs
  from the Tower pressure cards.

## Empty / degraded states

- No programs seeded → render `EmptyInspector` with caption
  "No programs in motion. Steward seeds programs via Setup."
- Per-program canvas with no deliverables for the current phase →
  render `EmptyInspector` with caption "No deliverables seeded for
  this phase. Steward seeds via Setup."
- Metric strip with fewer than 3 non-null metrics → hide the strip
  and fall back to the brief alone.
- Gate cap in `not_wired` state → render honestly with MUTED glyph
  `·`; never soften to look ready.

## Navigation / drill-down behavior

- Top nav `active="programs"`.
- Row click on the portfolio table → per-program canvas (same
  page) or full Workshop Mode page
  `/tenant/[tenantSlug]/programs/[programSlug]`.
- JourneyRail (six phase chips, four gate caps) renders inline; no
  modal.
- Deliverable click → `DetailDrawerShell` (400px clamp 360–480).
  Drawer carries deterministic source caption (e.g., "PDEL
  deterministic seed").
- Pattern chip click → Intelligence with pattern preselected.

## MVP / V1 / V2 scope

- **MVP** — portfolio table, Nexus brief, JourneyRail, gate status,
  deliverable drawer, evidence chips, pattern cross-links.
- **V1** — adds value-realized ledger column, cross-program
  recommendation rail, Steward-readiness inline on each row.
- **V2** — adds live deliverable authoring, cross-tenant portfolio
  view, live Nexus runtime authoring of the brief.

## Visual blueprint reference

- [`docs/design/pages/PROGRAMS_PAGE_BLUEPRINT.md`](../../design/pages/PROGRAMS_PAGE_BLUEPRINT.md)
  — JourneyRail rules, six-phase + four-gate canon, deliverable +
  evidence chip rules.
- Visual canon: [`docs/design/ABARVA_VISUAL_CANON.md`](../../design/ABARVA_VISUAL_CANON.md).
