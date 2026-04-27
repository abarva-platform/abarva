# AbarVa Visual Canon

Status: Canonical (DES1)
Authored: 2026-04-25
Author: Founder + Code

This document is the single source of truth for AbarVa visual
direction at the platform level. Every product surface — Programs,
Intelligence, AI Control Tower, Admin Setup, Source — derives its
brand and layout discipline from this canon. UI primitives that
implement these tokens live in
[`src/lib/design/abarva-theme.ts`](../../src/lib/design/abarva-theme.ts)
and
[`src/components/abarva/`](../../src/components/abarva/).

---

## §A · Brand direction

AbarVa is the calm intelligence layer for AI program execution.
The brand is **executive, not enterprise**. It looks like a
deliberately understated control surface: more like a private banking
dashboard than a SaaS analytics tool.

What that means in practice:

- Mostly white and warm off-white surfaces.
- Dark navy / black text. Never grey-on-grey.
- Dark navy as the single accent — no green, no purple, no neon.
- Dark surfaces are **reserved** — they exist to make the few
  high-impact briefs feel important by contrast (Atlas Brief,
  occasional pattern detail), never as default page chrome.
- Small typographic moves carry the design — there are no large
  illustrations, no gradients, no avatar-driven UI.

The visual outcome an executive should experience: "this is calm,
this is honest, this is in control."

---

## §B · Wordmark rule

The AbarVa wordmark is a **typographic** mark — no SVG, no glyph
substitution.

- Render as one inline-flex container, baseline-aligned, **no gap**
  between the two halves.
- "Abar" → near-black ink (`#0A0C12`), font-weight 700, DM Sans.
- "Va" → NAVY (`#1B2B5C`), font-weight 700, DM Sans, **1.05–1.10×
  larger** than the "Abar" half.
- The wordmark is letter-spaced `-0.01em`. Line-height 1.

**Three sizes:** `sm` (16px base), `md` (20px base), `lg` (28px base).
Top nav uses `sm`; brief heroes use `md`; landing surfaces use `lg`.

Implemented by `AbarvaWordmark` in
[`src/components/abarva/AbarVaTopNav.tsx`](../../src/components/abarva/AbarVaTopNav.tsx).

---

## §C · Symbol rule

The AbarVa symbol is **secondary**. The wordmark is always primary.

- The symbol is small, minimal, and references one of:
  *connector*, *data*, *intelligence*, *growth*. Never more than one
  motif at a time.
- **Forbidden symbol motifs:** Sanskrit characters, AI sparkles,
  large network / mesh icons, brain icons, gradient orbs.
- The symbol is **optional** in v2 — most surfaces render only the
  wordmark. When the symbol is shown it sits to the left of the
  wordmark at ≤ 1× the cap height of "Abar".

Until a symbol is approved, use the wordmark alone.

---

## §D · Color palette

| Token | Hex | Role |
| --- | --- | --- |
| `surface` | `#FBFAF7` | Default page background (warm off-white) |
| `surface2` | `#F5F3EE` | Secondary surface / inset panels |
| `card` | `#FFFFFF` | Card / panel background |
| `border` | `#E8E6E1` | Hairline border |
| `borderSoft` | `#F0EEEA` | Inner hairlines |
| `ink` | `#0A0C12` | Primary text |
| `body` | `#1F2433` | Body text |
| `muted` | `#525866` | Captions, eyebrows |
| `mutedSoft` | `#8B91A1` | Tertiary captions |
| `navy` | `#1B2B5C` | **Primary accent** |
| `navySoft` | `rgba(27,43,92,0.10)` | NAVY tint |
| `amber` | `#B45309` | Partial / high pressure |
| `amberSoft` | `rgba(180,83,9,0.10)` | AMBER tint |
| `red` | `#B42318` | Blocked / critical |
| `redSoft` | `rgba(180,35,24,0.10)` | RED tint |
| `inkDark` | `#0A0C12` | High-impact dark surface |
| `navyDark` | `#10193A` | High-impact dark surface |

**Direction shift from v1.** v1 used a teal accent (`#14B8A6`) and
serif body text. v2 retires teal in favor of NAVY and retires the
serif body in favor of DM Sans. v1 callers stay legal but new
components must read from `abarva-theme.ts`.

---

## §E · Typography

- **Body face: DM Sans.** No exceptions. Headings, labels, links,
  and body copy all use DM Sans.
- **Mono face: JetBrains Mono.** Eyebrows, status pills, file-type
  chips, gate labels (`G1–G4`), and any `data-*` glyph use mono.
- **No serif body.** v1 used Georgia for hero copy; v2 retires this.

| Style | Family | Size | Weight |
| --- | --- | --- | --- |
| `h1` | DM Sans | 28 | 600 |
| `h2` | DM Sans | 20 | 600 |
| `h3` | DM Sans | 15 | 600 |
| `body` | DM Sans | 14 | 400 |
| `eyebrow` | JetBrains Mono | 10 | 500 (uppercase, `0.14em`) |
| `caption` | DM Sans | 12 | 400 |

---

## §F · Light versus dark surfaces

Default page chrome is **always light** (`surface` / `card`). Dark
surfaces are reserved for:

- **Atlas Brief hero** — `navyDark` panel as the executive control
  card.
- **Occasional pattern detail hero** — when Sentinel pivots to
  "this pattern crosses the portfolio."

Forbidden:

- Whole-page dark dashboards.
- Dark Programs index.
- Dark Admin / Setup.
- Dark Intelligence pattern body.

When in doubt, render light.

---

## §G · Top navigation

The top nav is a **thin band**: 52–56px tall.

- Background `surface` (warm off-white).
- Bottom border: 1px hairline.
- Wordmark left, surface links centered-left (Programs · Control
  Tower · Intelligence · Source · Admin in canonical order).
- Active link uses NAVY text + 2px NAVY underline.
- No mega-menus, no dropdowns, no client switcher in this primitive
  (the legacy `AbarvaNav` keeps that; the v2 primitive is calm).
- No tagline, no live status badge, no agent avatar in the nav.

Implemented by `AbarvaTopNav` in
[`src/components/abarva/AbarVaTopNav.tsx`](../../src/components/abarva/AbarVaTopNav.tsx).

---

## §H · Agent treatment

There are four canonical agents:

| Agent | Role | Accent |
| --- | --- | --- |
| `nexus` | Mastermind / portfolio | NAVY |
| `sentinel` | Intelligence / pattern detection | AMBER |
| `atlas` | Executive AI Control Tower | NAVY (light) / INK (dark hero) |
| `steward` | Admin / governance / setup | MUTED |

Agents are **never represented as large avatars or photo-realistic
characters**. They appear as:

- A small `AgentBadge` pill: `agent · status` in mono uppercase.
- A short label inside a card header.
- A tone tinted on the top border of a brief shell.

There are no chat avatars, no anthropomorphic illustrations, no
stylized agent personas.

---

## §I · No-clutter rules

- A surface renders **one** brief. Pressure cards are capped at 3.
  Scorecards are capped at 5.
- A page may render **one** active "lens" at a time (Atlas).
- Drawers reveal detail; pages do not stack KPI walls.
- No more than **5 metrics** in a `MetricStrip`.
- No bar-chart gauges, no spark-line walls, no live-pulse animations.
- No "AI is thinking…" loading bubbles.
- The default empty state is a **dashed, captioned `EmptyInspector`**
  that names *why* it is empty.

---

## §J · Card, table, drawer style

- **Cards.** White surface, 1px hairline border, 12px radius. Top
  border may be 3px tinted with the relevant accent (NAVY, AMBER,
  RED). Padding 16–20px. Internal vertical rhythm is 8/12/16.
- **Tables.** Hairline `borderSoft` row separators. Column heads in
  `eyebrow` mono uppercase. Numbers right-aligned. No zebra
  striping.
- **Drawers.** Right side, 360–480px wide. Eyebrow + title at top,
  plain-text "Close ✕" affordance, optional source-label footer.
  Background `card`, left border hairline. **Drawers replace chat
  windows.**

---

## §K · Progressive disclosure

Every surface follows the same rhythm:

1. **Brief first.** A brief panel summarizes what the agent sees in
   2–4 sentences and proposes one recommended action.
2. **Key signals.** A calm row or grid (≤ 5 cards / ≤ 3 pressure
   cards / ≤ 1 active lens) surfaces the most important state.
3. **Progressive detail.** Detail lives in drawers, drilldowns, or
   collapsible sections. The page does not pre-expand everything.

This rhythm appears verbatim in:

- Programs (brief → portfolio table → phase canvas)
- Intelligence (brief → patterns → pattern canvas)
- AI Control Tower (Atlas Brief → 5 scorecards → 3 pressure cards
  → Ask Atlas drawer)
- Admin (Steward Brief → 5-zone control plane → drilldowns)

---

## §L · Acceptance gates for any new surface

A surface is canon-compliant only if:

1. The wordmark renders per §B (no gap, "Va" navy + larger).
2. Page chrome is light per §F. Dark is justified and limited.
3. The top nav is ≤ 56px tall and uses NAVY-on-active per §G.
4. Agents are shown via small label / badge — never as avatars
   per §H.
5. Brief → signals → detail rhythm is followed per §K.
6. No more than 5 metrics, 5 scorecards, 3 pressure cards, 1 active
   lens per §I.
7. Empty inspectors carry honest captions per §I.
8. The surface uses tokens from `abarva-theme.ts` — no hard-coded
   colors that bypass the canon.
