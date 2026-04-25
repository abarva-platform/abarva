# Intelligence Page · Visual Blueprint (DES1)

Status: Canonical (DES1)
Authored: 2026-04-25

The Intelligence surface is **Sentinel's room**: where pattern
detections, evidence trails, and program impact resolve into a single
calm canvas. The Intelligence page must read like a research note,
not a chat thread.

This blueprint binds the AbarVa Visual Canon to the Intelligence
read-models defined by I1 / I2 / I3 / I4 / PF1.

---

## Page structure

```
┌───────────────────────────────────────────────────────────────┐
│ AbarVaTopNav (active=intelligence)                            │
├───────────────────────────────────────────────────────────────┤
│ Sentinel Brief hero                                           │
│   AgentBriefPanel(agent="sentinel", variant="light")          │
│   • brief lines: portfolio risk posture, hot pattern count    │
│   • recommended action: "Open PT-12 — exec sponsor risk"      │
├───────────────────────────────────────────────────────────────┤
│ Active Patterns strip                                         │
│   horizontal scroller of PatternCard (≤ 6 visible)            │
│   ordered by severity → confidence                            │
├───────────────────────────────────────────────────────────────┤
│ Dynamic Insight Canvas (DIC)  ←  the page anchor              │
│   Tabs: Summary · Evidence · Programs · Actions               │
│   ┌──────────────────────────────────────────────────────┐    │
│   │ Sentinel interaction rail (right side, drawer-style) │    │
│   └──────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

---

## Sentinel Brief hero

- Renders via `AgentBriefPanel(agent="sentinel", variant="light")`.
- AMBER top border + AMBER footer badge.
- 2–4 brief lines summarizing portfolio-wide pattern posture:
  - "3 patterns active. 1 critical. 2 high."
  - "Strongest signal: PT-12 (exec sponsor erosion · 87% conf)."
  - Optional: "Internal basis: 12 evidence rows from 3 programs."
- Recommended action: a single, executable next step that links
  into the canvas.
- Three disabled follow-up chips: `Why is this critical`, `What
  changed since last week`, `Where else does this show up` — each
  carries the `deferred · live sentinel runtime` sub-label.

---

## Active Patterns strip

- Renders `PatternCard` for each active pattern.
- Ordered: severity DESC (`critical` → `high` → `medium` → `low`),
  then confidence DESC.
- Maximum 6 cards visible at rest; remainder is reachable via the
  horizontal scroller affordance (no pagination button).
- Each card carries:
  - severity + confidence MiniChips (canon §H accents)
  - title + summary + why-it-matters italic
  - 2-cell stat grid (e.g. `programs affected`, `evidence rows`)
  - top 4 affected programs as NAVY pill chips with hrefs
  - optional collapsible `<details>` for missing inputs
  - recommended action with mono `next` eyebrow
  - optional handoff chips (`handoff · steward`, `handoff · nexus`)
  - "Open pattern detail →" plain NAVY link

Cards never autoplay. They never animate on hover beyond the chip
tone. They render statically.

---

## Dynamic Insight Canvas (DIC)

The DIC is a four-mode canvas that replaces the legacy
"Sentinel chat" idea. Modes:

| Mode | Content |
| --- | --- |
| `Summary` | The pattern's narrative — title, severity, why-it-matters, key stats. |
| `Evidence` | Evidence rows with `EvidenceChip` for each lifecycle state. |
| `Programs` | Affected programs with their phase + gate state. |
| `Actions` | Recommended next steps, handoff chips, and a single primary CTA. |

Rules:

- The mode tabs are NAVY-tinted. Active tab = NAVY underline.
- The canvas is the **same surface across modes** — switching tabs
  never navigates the page. Body content swaps in place.
- The canvas always renders inside a `card` surface — never on the
  raw page background.
- The Actions tab carries **one** primary CTA. Secondary actions
  appear as muted text-links beneath, not as additional buttons.

---

## Sentinel interaction rail (drawer, not chat)

Sentinel "answers" via a `DetailDrawerShell`, not a chat thread.

- Width: 400–460px (clamped by the primitive).
- Eyebrow: `sentinel response`.
- Title: a one-line summary of the answer.
- Body: short paragraphs, evidence chips inline, NAVY-link
  references to programs / patterns / artifacts.
- Footer: source caption naming the deterministic basis (e.g.
  "I1 deterministic pattern read-model").
- Plain-text "Close ✕" affordance — no `X` icon, no animation.

There is **no** chat input bar. There is **no** scrolling
conversation history. The drawer is single-turn and dismissible.

---

## Internal vs external basis

Every pattern carries an explicit `basis` flag that drives canvas
chrome:

- `internal` → NAVY chip "internal basis", body cites E-### evidence
  ids.
- `external` → AMBER chip "external basis", body cites public
  research and a short disclosure line.

Basis is never silent. The canvas always discloses *which* basis
the pattern stands on.

---

## Same-canvas interaction

Sentinel interaction never opens a new page. The canvas swaps
mode-by-mode within `card` surface. The drawer overlays the right
edge. The pattern strip remains visible (sticky-scroll above the
canvas) so the operator can pivot between patterns without losing
context.

---

## Acceptance criteria

An Intelligence surface is canon-compliant when:

1. `AbarvaTopNav` is rendered with `active="intelligence"`.
2. The brief uses `AgentBriefPanel(agent="sentinel", variant="light")`.
3. Active Patterns strip renders only `PatternCard` and shows ≤ 6
   cards at rest.
4. The Dynamic Insight Canvas exposes exactly four modes: Summary,
   Evidence, Programs, Actions.
5. Switching modes never navigates the page (same canvas).
6. There is no chat input. Sentinel responses render in a
   `DetailDrawerShell` only.
7. Internal vs external basis is explicit on every pattern.
8. All colors flow from `abarva-theme.ts`. AMBER is reserved for
   Sentinel; NAVY for portfolio refs.
9. Empty Active Patterns strip renders `EmptyInspector` with caption
   "No patterns active for this tenant. Sentinel seeds via I1."
10. Drawer footer source-caption names the deterministic basis.
