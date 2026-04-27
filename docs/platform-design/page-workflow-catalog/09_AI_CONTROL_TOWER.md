# Page · AI Control Tower

Status: Canonical (CAT1)
Authored: 2026-04-25

## Page purpose

The AI Control Tower is **Atlas's room** — the executive control
surface for AI program portfolio posture. It must read like a
boardroom-ready operating brief, not a busy dashboard. The Tower
exists to answer three questions, in order, in under three
minutes: where does the AI portfolio stand, where is it at risk,
and what is the next steering decision. Atlas leads the surface;
Nexus, Sentinel, and Steward feed it. The dark-surface Atlas
Brief is the **only place** in the platform where dark chrome is
default — the contrast is intentional.

## Primary user question

"Where does the AI portfolio stand, where is it at risk, and what
is the next steering decision?"

## Primary agent

Atlas (with Nexus / Sentinel / Steward as upstream contributors).

## Route(s)

- `/(maestro)/tower` — canonical Tower index.
- `/(maestro)/tower/onboard` — onboarding posture subsurface.
- `/(maestro)/tower/projects` — project posture subsurface.
- `/(maestro)/tower/staff-aug` — staffing posture subsurface.
- `/(maestro)/tower/tech-stack` — tech stack posture subsurface.
- `/(maestro)/tower/volumetrics` — volumetrics posture subsurface.

## Required data contract / read model

- ACT1 · AI Control Tower Product Contract.
- S9E · Programs Control Tower Signal Read Model.
- S9F · Tower Program Pressure Cards.
- S9G · Tower Atlas Executive Brief.
- I1 · Sentinel Pattern Detection Read Model (cross-link from
  pressure cards into Intelligence).
- ADM3 · Dataset Domain Inventory Read Model (drives readiness
  posture line in the brief).

## What the page knows

- Portfolio posture: programs in motion, gates open vs closed.
- Value posture: value at risk vs value secured.
- Pressure posture: top program pressures (≤ 3 cards).
- Vendor posture: vendor concentration and contract risk one-liner.
- Run-rate posture: burn vs plan.
- Tech-stack posture: model / connector / capability gaps.
- Volumetrics posture: load and throughput shape.
- The single recommended next steering decision (Atlas verb).

## What the page is missing

- Live LLM-composed brief — Atlas brief is deterministic in v2.
- Live spend and burn tracking — run-rate posture is seeded.
- Live throughput telemetry — volumetrics posture is seeded.
- Cross-tenant Tower view (partner accounts) — out of scope.

## Key user actions

- Read the Atlas brief (above the fold) and act on the recommended
  next steering decision.
- Scan the ≤ 5 scorecards for one-fact reads.
- Read the active lens (exactly one pinned at a time).
- Open a pressure card → drill into the program.
- Open a Tower subsurface (onboard / projects / staff-aug /
  tech-stack / volumetrics) for the relevant dimension.
- Use the single-turn `Ask Atlas` drawer for a follow-up question.

## Agent actions

- **Atlas** composes the brief, names the highest-pressure program,
  recommends the next steering decision, owns the dark-surface
  hero.
- **Nexus** feeds program-by-program signal into the Tower (via
  S9E).
- **Sentinel** feeds patterns into the pressure cards and lens.
- **Steward** feeds readiness posture into the brief readiness line.

## Empty / degraded states

- No programs in motion → render `EmptyInspector` with caption
  "No programs in motion. Steward seeds programs via Setup."
- Fewer than 3 scorecards with non-null values → render none and
  fall back to brief alone (no "empty data wall").
- No active pressure → omit the pressure cards row entirely.
- No lens pinned → render `EmptyInspector` with caption "No lens
  pinned. Atlas pins lenses via the Brief follow-ups."
- Atlas brief contract degraded → fall back to a brief composed
  from the topmost S9F pressure card only.

## Navigation / drill-down behavior

- Top nav `active="tower"`.
- Scorecard click → optional NAVY mini-link to the relevant
  Programs filtered list (no modal).
- Pressure card click → opens the program (NAVY "Open program →"
  link).
- Lens swap → replaces the active lens region in place; never
  appends.
- Atlas response → renders inside `DetailDrawerShell` only — no
  chat input.
- Subsurface link → navigates to dedicated dimension page (one
  level deeper).

## MVP / V1 / V2 scope

- **MVP** — Atlas dark-surface brief, ≤ 5 scorecards, active lens,
  ≤ 3 pressure cards, single-turn ask drawer, five subsurfaces
  (onboard / projects / staff-aug / tech-stack / volumetrics).
- **V1** — adds vendor lens (precursor to Vendor Evaluation V2),
  delta callouts ("changed since yesterday"), Steward attestation
  inline.
- **V2** — adds live LLM-composed brief, live spend / throughput
  telemetry, cross-tenant Tower view, full vendor evaluation
  surface (page 07).

## Visual blueprint reference

- [`docs/design-canon/archive/pre-canon-design/pages/AI_CONTROL_TOWER_PAGE_BLUEPRINT.md`](../../design-canon/archive/pre-canon-design/pages/AI_CONTROL_TOWER_PAGE_BLUEPRINT.md)
  — dark-surface Atlas Brief, scorecards (≤ 5), pressure cards
  (≤ 3), lens (1 active), drawer-not-chat rule, no-dashboard-clutter
  rules.
- Visual canon: [`docs/design-canon/archive/pre-canon-design/ABARVA_VISUAL_CANON.md`](../../design-canon/archive/pre-canon-design/ABARVA_VISUAL_CANON.md).
