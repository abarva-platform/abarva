# Page · Intelligence

Status: Canonical (CAT1)
Authored: 2026-04-25

## Page purpose

Intelligence is **Sentinel's room** — the surface where pattern
detections, evidence trails, and program impact resolve into a
single calm canvas. The page reads like a research note, not a
chat thread. Operators come here to read the active patterns
ranked by severity and confidence, to drill into the strongest
signal, and to follow the recommended next move. Internal-basis
patterns (rooted in tenant evidence) and external-basis patterns
(rooted in public research) are explicit on every card; basis is
never silent.

## Primary user question

"What patterns are active, what is the strongest signal, and what
should I act on?"

## Primary agent

Sentinel (with Nexus / Steward / Atlas as handoff targets per
pattern).

## Route(s)

- `/intelligence` — canonical landing.
- `/(maestro)/intelligence` — Maestro alias.
- `/(maestro)/intelligence/patterns` — full pattern roster.
- `/(maestro)/intelligence/briefing` — Sentinel briefing detail.
- `/(maestro)/intelligence/library` — content library (industry
  references, prior cases).
- `/(maestro)/intelligence/topics` — topic-clustered patterns.
- `/(maestro)/intelligence/people` — people-clustered patterns.
- `/(maestro)/intelligence/kpis` — KPI-clustered patterns.
- `/(maestro)/intelligence/ask` — single-turn ask drawer entry.

## Required data contract / read model

- I1 · Sentinel Pattern Detection Read Model.
- I2 · Intelligence Sentinel Brief / Active Patterns.
- I3 · Intelligence Pattern Detail / Evidence Trail.
- I4 · Intelligence Pattern Content Renderer.
- PF1 · AI Program Failure Modes Pattern Pack (canonical pattern
  taxonomy).
- S9E · Programs Control Tower Signal Read Model (drives the
  underlying signal stream).

## What the page knows

- Sentinel brief: portfolio risk posture, hot pattern count,
  strongest signal callout, internal vs external basis split.
- Active patterns: pattern key, severity (`critical` / `high` /
  `medium` / `low`), confidence, affected program list.
- Per-pattern evidence trail: deterministic evidence ids (E-###)
  with usability state per row.
- Per-pattern recommended action and handoff target (Nexus /
  Steward / Atlas).
- Per-pattern basis (internal — cites E-### evidence; external —
  cites public research with disclosure line).
- Topic / people / KPI clusters across patterns.

## What the page is missing

- Live LLM-driven pattern composition — patterns are deterministic
  in v2.
- Live "ask Sentinel" free-text — single-turn drawer is canon;
  conversational chat is forbidden.
- Cross-tenant pattern rollups — Intelligence is per-tenant.
- Live external feed ingestion (industry research) — external
  basis patterns are seeded in v2.

## Key user actions

- Read the Sentinel brief and act on the recommended action.
- Scroll the Active Patterns strip; click a pattern card to drill
  into the Dynamic Insight Canvas.
- Switch DIC tabs (Summary · Evidence · Programs · Actions) to
  read the pattern from different angles — same canvas, no
  navigation.
- Click an evidence id (E-###) → opens evidence drawer with the
  source artifact.
- Click an affected program pill → opens Programs with that
  program preselected.
- Trigger a handoff (Nexus / Steward / Atlas) via the chip on the
  Actions tab.
- Use the single-turn `Ask Sentinel` drawer for a follow-up
  question.

## Agent actions

- **Sentinel** composes the brief, ranks active patterns by
  severity then confidence, surfaces the recommended action per
  pattern, names the handoff target.
- **Nexus** receives handoffs to update program context bundles.
- **Steward** receives handoffs to seed missing evidence.
- **Atlas** receives handoffs to elevate a pattern into the Tower
  brief when severity is `critical`.

## Empty / degraded states

- No active patterns → Active Patterns strip renders
  `EmptyInspector` with caption "No patterns active for this
  tenant. Sentinel seeds via I1."
- Pattern with missing inputs → render collapsed `<details>`
  block "Missing inputs" with deterministic blocker list.
- Evidence trail with no E-### ids → render evidence tab with
  `EmptyInspector` caption "No internal evidence cited.
  Pattern basis: external."
- External-basis pattern → render AMBER chip "external basis"
  and disclosure footer line.

## Navigation / drill-down behavior

- Top nav `active="intelligence"`.
- Pattern card click → activates the Dynamic Insight Canvas (DIC)
  in place. The pattern strip stays sticky-scroll above the
  canvas.
- DIC tab swap → swaps body content same-canvas; never navigates.
- Sentinel response → renders inside `DetailDrawerShell` (no chat
  input; single-turn).
- Evidence id click → opens evidence drawer (right side).
- Pattern detail "Open detail →" → opens
  `/(maestro)/intelligence/patterns/[patternKey]` for a focused
  view.

## MVP / V1 / V2 scope

- **MVP** — Sentinel brief, Active Patterns strip, Dynamic Insight
  Canvas with four modes, evidence trail, deterministic basis
  partition, recommended action + handoff chips, single-turn ask
  drawer.
- **V1** — adds topic / people / KPI clusters, content library
  cross-link, multi-pattern compare drawer.
- **V2** — adds live external feed ingestion, live LLM pattern
  composition, cross-tenant rollups for partner accounts.

## Visual blueprint reference

- [`docs/design/pages/INTELLIGENCE_PAGE_BLUEPRINT.md`](../../design/pages/INTELLIGENCE_PAGE_BLUEPRINT.md)
  — Sentinel brief, Active Patterns strip, DIC, drawer-not-chat
  rule, internal vs external basis.
- Visual canon: [`docs/design/ABARVA_VISUAL_CANON.md`](../../design/ABARVA_VISUAL_CANON.md).
