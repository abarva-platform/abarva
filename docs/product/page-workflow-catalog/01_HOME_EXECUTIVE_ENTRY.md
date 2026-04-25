# Page · Home / Executive Entry

Status: Canonical (CAT1)
Authored: 2026-04-25

## Page purpose

Home is the executive's first 90 seconds inside AbarVa. It is a
calm, agent-led landing surface that surfaces the single most
important portfolio fact, the strongest active pattern, and a single
recommended next move. Home is **not** a dashboard — it is a brief.
Operators land here, read three short paragraphs, and either act on
the recommendation or drill into Programs / Intelligence / Tower /
Setup. Home does not invent anything; it composes from Atlas's
executive editorial layer and routes the operator into the right
agent surface.

## Primary user question

"Where does my AbarVa stand right now, and what should I do next?"

## Primary agent

Atlas (with Nexus follow-up routing). Atlas composes the brief;
Nexus owns the `Open in Programs →` follow-up; Sentinel and Steward
are referenced only when their state changes the brief.

## Route(s)

- `/home`
- `/(maestro)/home`
- `/(maestro)/home/queue`

## Required data contract / read model

- ACT1 · AI Control Tower Product Contract — Atlas Brief composition.
- S9G · Tower Atlas Executive Brief read model.
- S9E · Programs Control Tower Signal read model — for the single
  most-pressured program callout.
- I1 · Sentinel Pattern Detection read model — for the single
  strongest active pattern callout.
- ADM3 · Dataset Domain Inventory read model — for the readiness
  posture line.

A unified Home read model that joins these four sources is **to be
defined** as part of the MVP roadmap (see `13_MVP_V1_V2_PAGE_ROADMAP.md`).

## What the page knows

- Portfolio posture: count of programs in motion, count of gates
  signed, count of programs under pressure.
- Highest-pressure program: code, phase, gate state, single-line
  reason from S9F.
- Strongest active pattern: pattern key, severity, confidence,
  affected program count.
- Tenant readiness posture: percent loaded, percent usable as
  evidence, count of blocked dataset domains.
- The single recommended next move (deterministic Atlas verb).

## What the page is missing

- Live model-composed editorial. The MVP brief is deterministic;
  live Atlas authoring lands in a later slice.
- Cross-tenant rollups. Home is per-tenant; multi-tenant
  executive view is V2.
- Steward attestation queue surfacing. Home references readiness
  but does not list outstanding attestations (deferred to Setup).
- "Why this changed since yesterday" delta callouts. Pending a
  delta read model.

## Key user actions

- Read the Atlas brief (3–4 lines, single recommended action).
- Click the recommended-action link (routes to Programs / Tower /
  Intelligence / Setup with the relevant program / pattern preselected).
- Open the operator queue (`/(maestro)/home/queue`) to see the
  next-best work items.
- Use the top nav to jump directly to Programs · Intelligence ·
  Tower · Setup.

## Agent actions

- **Atlas** composes 2–4 brief lines, names the highest-pressure
  program, the strongest pattern, the readiness posture, and one
  recommended verb-led next move.
- **Nexus** wires the recommended action into a deep link with the
  correct program / phase context.
- **Sentinel** contributes the strongest pattern callout but does
  not narrate the brief.
- **Steward** contributes the readiness posture but does not
  narrate the brief.

## Empty / degraded states

- No programs seeded → render `EmptyInspector` with caption
  "No programs in motion. Steward seeds programs via Setup."
- No active patterns → omit the pattern line; do not show "no
  patterns" as a tile. The brief shrinks to portfolio + readiness.
- No readiness data → render the brief with portfolio facts only
  and a footer "Readiness posture pending Steward seeding."
- Atlas brief contract degraded → render `EmptyInspector` with
  caption "Atlas brief unavailable. Open Tower for raw posture."

## Navigation / drill-down behavior

- Top nav exposes the canonical surfaces (Home · Programs ·
  Intelligence · Tower · Setup) with `active="home"`.
- Recommended action link opens the destination surface (Programs
  detail / Intelligence pattern detail / Tower pressure card)
  with the relevant entity preselected.
- Drill into the operator queue replaces the brief content with a
  ranked list — same canvas, no modal.
- No same-page tabs; Home is a single agent-led brief surface.

## MVP / V1 / V2 scope

- **MVP** — deterministic Atlas brief, recommended action, and the
  operator queue link. Covers the highest-pressure program, the
  strongest pattern, and the tenant readiness line.
- **V1** — adds the delta line ("changed since yesterday") and
  links to recently signed gates and recently quality-checked
  evidence.
- **V2** — multi-tenant executive home for partners; live Atlas
  composition; per-stakeholder personalization (CIO / CFO / CAIO).

## Visual blueprint reference

- Tower-style brief chrome inherits
  [`docs/design/pages/AI_CONTROL_TOWER_PAGE_BLUEPRINT.md`](../../design/pages/AI_CONTROL_TOWER_PAGE_BLUEPRINT.md)
  (dark-surface Atlas Brief). Home reuses the brief primitive but
  on a light surface for entry softness; dark surface is reserved
  for the Tower hero.
- Visual canon: [`docs/design/ABARVA_VISUAL_CANON.md`](../../design/ABARVA_VISUAL_CANON.md).
