# AI Control Tower Page · Visual Blueprint (DES1)

Status: Canonical (DES1)
Authored: 2026-04-25

The AI Control Tower is **Atlas's room**: the executive control
surface for AI program portfolio posture. The Control Tower must
read like an executive memo — dense, calm, and selective — never
like a busy dashboard.

This blueprint binds the AbarVa Visual Canon to the Tower
read-models defined by ACT1 / S9E / S9F / S9G.

---

## Page structure

```
┌───────────────────────────────────────────────────────────────┐
│ AbarVaTopNav (active=tower)                                   │
├───────────────────────────────────────────────────────────────┤
│ Atlas Brief hero  [DARK SURFACE · navyDark]                   │
│   AgentBriefPanel(agent="atlas", variant="dark")              │
│   • brief lines: portfolio posture · top pressure · next move │
│   • recommended action: "Drive G2 close on PRG-02"            │
├───────────────────────────────────────────────────────────────┤
│ Scorecards row  [LIGHT]                                       │
│   ≤ 5 scorecards, each a calm card with one number + one verb │
├───────────────────────────────────────────────────────────────┤
│ Active Lens region  [LIGHT]                                   │
│   exactly 1 lens visible at a time (e.g. "value lens")        │
├───────────────────────────────────────────────────────────────┤
│ Pressure cards row  [LIGHT]                                   │
│   ≤ 3 PressureCard entries, severity sorted                   │
├───────────────────────────────────────────────────────────────┤
│ Ask Atlas drawer (DetailDrawerShell · right side)             │
└───────────────────────────────────────────────────────────────┘
```

---

## Atlas Brief hero (dark surface)

The Atlas Brief is the **only place** in the platform that uses a
dark surface as default chrome. The contrast is intentional:

- Surface: `navyDark` (`#10193A`).
- Variant: `AgentBriefPanel(variant="dark", agent="atlas")`.
- Top border: NAVY accent (already enforced by the primitive).
- Brief lines: 2–4, executive tone. Names the single highest
  pressure point in the portfolio, the corresponding program, and
  the recommended move.
- Recommended action callout: NAVY accent, single executable verb.
- Footer caption: e.g. `S9G deterministic seed · v0.4`.

The Atlas Brief is **always above the fold**. It never appears
twice on a single page. The page does not embed an additional
dark hero anywhere else.

---

## Scorecards (≤ 5)

The Tower exposes at most **five** scorecards. Each scorecard is a
single card with:

- mono uppercase eyebrow (e.g. `programs · in_motion`)
- one large number
- one short verb (e.g. `holding · 4 weeks`)
- optional NAVY mini-link to drill into the relevant program list

**Forbidden:** spark-line walls, gauge dials, multi-axis charts,
trend arrows. The scorecard tells one fact.

If fewer than 3 scorecards have non-null values, render none and
fall back to the brief alone — the surface should never read
"empty data wall."

---

## Pressure cards (≤ 3)

Pressure cards surface programs needing executive attention. Render
via the `PressureCard` primitive:

- Sorted: severity DESC (`critical` → `high` → `medium` → `low`),
  ties broken by program code ASC.
- Maximum 3 visible. If more pressure exists, the brief calls it
  out ("3 of 7 programs under pressure — open Programs to drill in").
- Severity tone is enforced by `statusAccent`:
  - `critical` → RED top border
  - `high` → AMBER top border
  - `medium` / `low` → NAVY top border
- Each card carries a NAVY "Open program →" link.

---

## Active Lens (1 only)

A "lens" is a single drilldown frame the operator can pin on the
Tower (value lens, run-rate lens, vendor concentration lens, etc.).

Rules:

- **Exactly one** lens may be active at a time.
- Lens chrome is a single `card` surface with a NAVY top border.
- Switching lenses replaces the active region — never appends.
- Empty lens region renders `EmptyInspector` with caption
  "No lens pinned. Atlas pins lenses via the Brief follow-ups."

---

## Ask Atlas drawer (drawer, not chat)

Atlas answers via `DetailDrawerShell`:

- Width: 400–480px.
- Eyebrow: `atlas response`.
- Title: one-line summary of the answer.
- Body: short paragraphs, NAVY links to programs / scorecards /
  pressure cards. Evidence chips inline where appropriate.
- Footer: source caption naming the deterministic basis.

There is **no** chat input on this page. Atlas is invoked via the
brief follow-up chips, not via a free-text bar. The drawer is
single-turn and dismissible.

---

## Seven canonical Tower dimensions

The Tower covers seven canonical dimensions (per ACT1 contract):

1. **Portfolio posture** — programs in motion, gates open / closed.
2. **Value posture** — value at risk vs value secured.
3. **Pressure posture** — top program pressures.
4. **Vendor posture** — vendor concentration, contract risk.
5. **Run-rate posture** — burn vs plan.
6. **Tech-stack posture** — model / connector / capability gaps.
7. **Volumetrics posture** — load and throughput shape.

Each dimension has a dedicated subsurface
(`/tower/onboard`, `/tower/projects`, etc.). The Tower index page
shows only the brief, the ≤ 5 scorecards, the active lens, and the
≤ 3 pressure cards. Dimension drilldowns live one level deeper.

---

## No-dashboard-clutter rules

- No more than **5** scorecards.
- No more than **3** pressure cards.
- Exactly **1** active lens.
- No charts on the index page. Drilldown subsurfaces may use minimal
  charts but the index is text + tints only.
- No live counters, no spinning loaders, no animated trend arrows.
- No toolbar of filter chips on the index. Filters live inside
  drilldown subsurfaces.

---

## Acceptance criteria

A Tower surface is canon-compliant when:

1. `AbarvaTopNav` is rendered with `active="tower"`.
2. Atlas Brief uses `AgentBriefPanel(agent="atlas", variant="dark")`
   on a `navyDark` panel.
3. Scorecards row contains ≤ 5 entries.
4. Pressure cards row contains ≤ 3 `PressureCard` entries.
5. Exactly 1 active lens is visible at any time.
6. Atlas responses render only inside `DetailDrawerShell` — no chat.
7. Index page renders no spark-lines, no gauges, no animated charts.
8. Empty regions render `EmptyInspector` with honest captions.
9. All colors flow from `abarva-theme.ts`.
10. Footer caption on every drawer names the deterministic basis.
