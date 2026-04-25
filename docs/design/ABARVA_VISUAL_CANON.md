# AbarVa · Visual Canon

Slice ID: DES1
Document type: design canon — contract for all future implementation
slices.
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25

This canon captures the approved AbarVa visual direction. Future
Codex / Claude implementation slices must read this canon first and
conform to its rules. PRs that violate the canon are not eligible
for `verified` promotion.

If the founder approves a deviation, that deviation lands as an
explicit revision to this document — never as silent drift inside a
feature slice.

---

## A. Brand direction

AbarVa is a **calm, executive-grade, agent-led** product. It reads
in boardrooms, not on phones in line at coffee shops. The visual
system reflects that posture:

- **Calm** — reads like a printed brief, not a SaaS dashboard.
- **Executive-grade** — every surface defends a CXO claim.
- **Agent-led** — Nexus / Sentinel / Atlas / Steward speak; the
  surface frames their voice.
- **Honest** — when data is missing, the surface names the absence
  rather than fabricating a value.

If a surface looks like a metrics wall, it is wrong. If it looks
like an executive operating brief, it is right.

---

## B. AbarVa wordmark rules

The wordmark is **AbarVa** rendered as one word, no space, with two
weights / colors:

- **"Abar"** — bold, near-black ink (token `INK`, `#0F1115`).
- **"Va"** — dark navy (token `NAVY`, `#1B2B5C`), slightly larger
  than "Abar" (1.05× – 1.10× tracking-equivalent size).

The wordmark is always the literal "AbarVa" string. Never
"abarva", "ABARVA", "Abarva", "Abar Va", "Abar-Va", or any other
casing. Never abbreviated to "AV" or "AB" inside the product.

### Typography

- Font: **DM Sans** (or `-apple-system` fallback). The wordmark
  uses sans-serif body family — not serif.
- "Abar" weight: 700 – 800.
- "Va" weight: 600 – 700; size 1.05× – 1.10× of "Abar"; color
  `NAVY`.
- Letter-spacing: −0.01em on "Abar"; default on "Va". The two
  segments sit visually flush — `letterSpacing: '-0.01em'` on the
  whole wordmark is acceptable.
- Vertical alignment: baseline-aligned. "Va" is **not** raised or
  superscripted.

### Sizing

- Top nav: 18 – 22px (Abar) → 20 – 24px (Va).
- Print export: 12pt minimum.
- Browser favicon: stencil at 16 / 32 / 48 / 96px in `INK`.

### Reserved area

Half-x of "Abar" cap-height of breathing room on every side.

### Variants

- One canonical wordmark (`<AbarvaWordmark size="md" />`).
- Sizes: `sm` / `md` / `lg`.
- No tagline lockups inside product. No co-brand lockups inside
  product.

---

## C. Logo / symbol rules

AbarVa has a **small secondary symbol** that may appear adjacent to
the wordmark in headers, favicons, and large brand moments. The
symbol is **never** required; the wordmark is the primary mark.

### Symbol motif

- A minimal connector / data / intelligence motif: two stacked
  horizontal hairlines (data) crossed by a single vertical anchor
  (connector / intelligence axis). Stroke `1.5px`; color `INK` or
  `NAVY` depending on placement.
- Total bounding box: square, 16 – 24px in nav contexts; up to 48px
  in hero contexts.
- Optical alignment: the symbol's vertical anchor aligns to the
  cap-height of "Abar".

### Symbol restraint

- Never render the symbol without the wordmark in primary product
  surfaces.
- Never enlarge the symbol so it competes with the wordmark — it
  is always secondary.
- Never use the symbol as a loading spinner, hover micro-animation,
  or chat avatar.

### Forbidden glyphs

- No Sanskrit, Devanagari, or other script-based glyphs.
- No "AI sparkle" / star / wand glyph.
- No big network / mesh diagram as a logo.
- No abstract gradient orb.
- No emoji as a logo.

---

## D. Color palette

The palette is **small and disciplined** — 5 surface tones, 4
semantic accents, 3 type tones. No gradients, no neon, no
brand-rainbow.

### Surface

| Token | Hex | Use |
|---|---|---|
| `surface` (off-white) | `#FAFAF8` | Default page background. AbarVa reads on off-white. |
| `surface2` | `#F5F5F2` | Inset surfaces, dashed-border placeholders. |
| `card` | `#FFFFFF` | Cards, drawers, panels, brief panels. |
| `border` | `#E6E6E2` | 1px borders on cards / dividers / chips. |
| `borderSoft` | `#EFEFEB` | Hairlines inside cards. |

### Type tones

| Token | Hex | Use |
|---|---|---|
| `INK` | `#0F1115` | Primary type. Headlines, brief titles, key values, "Abar" wordmark. |
| `BODY` | `#2B2F36` | Body copy. |
| `MUTED` | `#5A5F66` | Secondary copy, captions. |
| `MUTED_SOFT` | `#8A8F96` | Eyebrows, monospace labels, footers. |

### Semantic accents

| Token | Hex | Use |
|---|---|---|
| `NAVY` | `#1B2B5C` | **Primary brand accent.** "Va" wordmark, primary affordances, ready / on-track posture, agent chrome. |
| `NAVY_SOFT` | `rgba(27,43,92,0.08)` | NAVY chip backgrounds, status pill tints. |
| `AMBER` | `#B45309` | Partial / pressure / warning. |
| `AMBER_SOFT` | `rgba(180,83,9,0.10)` | AMBER chip backgrounds. |
| `RED` | `#B5322B` | Blocked / critical / failure. |
| `RED_SOFT` | `rgba(181,50,43,0.10)` | RED chip backgrounds. |

### Auxiliary

| Token | Hex | Use |
|---|---|---|
| `INK_DARK` | `#0A0C12` | Hero panel backgrounds (Atlas dark brief). |
| `NAVY_DARK` | `#10193A` | Storytelling-moment dark surfaces. |

### What the palette forbids

- Gradients (linear, radial, mesh).
- Pure black (`#000`) backgrounds or fills.
- Teal / mint / emerald / kelly as primary or accent (no green-heavy
  palette).
- Purple / magenta / violet (no purple-heavy palette).
- Neon, fluorescent, or high-saturation colors.
- Any hue outside the table above. New colors must land in the
  canon revision before they land in code.

---

## E. Typography

Two families, three roles.

| Family | Where it appears |
|---|---|
| **DM Sans, -apple-system, sans-serif** | Page titles, brief titles, body copy, paragraph prose, labels. AbarVa is sans-serif. |
| **JetBrains Mono, "Courier New", monospace** | Eyebrows, status chips, file-type chips, evidence ids, inline code, tabular data. |

(There is no serif body family. The previous canon's Georgia
direction is retired.)

### Scale

- **H1 / page title**: 24 – 28px DM Sans, weight 700, color `INK`.
- **H2 / section**: 18 – 22px DM Sans, weight 600 – 700, color
  `INK`.
- **H3 / card**: 15 – 18px DM Sans, weight 600, color `INK`.
- **Body**: 13 – 14px DM Sans, weight 400, line-height 1.55, color
  `BODY`.
- **Eyebrow / chip**: 9 – 11px JetBrains Mono, weight 700,
  uppercase, letter-spacing 0.10em – 0.14em, color `MUTED_SOFT`.

### Voice rules

- Never bold inside body prose; rely on size + weight at the
  headline level.
- Italic is reserved for interpretation captions and honest
  fallbacks — never for emphasis inside body prose.
- Eyebrows are uppercase with letter-spacing — body is sentence
  case. Never both casings in the same headline.

---

## F. Light vs dark usage

AbarVa is a **light-surface product**. Off-white (`#FAFAF8`) is the
default background. There is **no full dark mode** today.

### When dark surfaces are allowed

Dark surfaces are reserved for **high-impact briefs and
storytelling moments only**:

- Atlas executive brief hero on the AI Control Tower.
- Sentinel "operating model gap" headline detection cards.
- Founder Build Progress cover banner.
- Maestro pre-workshop brief opening panel.

Dark surface tokens: `INK_DARK` (`#0A0C12`) or `NAVY_DARK`
(`#10193A`). Type on dark uses `surface` (`#FAFAF8`) or `card`
(`#FFFFFF`); never lift saturated accent on dark.

### Forbidden

- Full dark mode (no per-page opt-in dark surfaces).
- Dark sidebars, dark forms, dark drawers.
- Dark chrome on Programs / Intelligence / Admin landing pages.

---

## G. Top navigation

A **thin** top nav. Wordmark left, top-level surfaces center,
operator chip right. Nothing else.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ AbarVa   Programs · Tower · Intelligence · Source · Admin   │
│                                                  AS · v1.0  │
└─────────────────────────────────────────────────────────────┘
```

- Height: 52 – 56px (thin). Never larger.
- Background: `surface` with 1px bottom `border`.
- Wordmark: clickable to `/home`.
- Center links: 13 – 14px DM Sans, default `MUTED`, hover `INK`,
  active surface adds a 2px bottom inset in `NAVY`.
- Operator chip: 28px circle, mono initials in `INK` on
  `surface2`.
- No banner, no announcement bar, no marketing strip.
- No mega-menu, no dropdown. Sub-surfaces live inside the surface
  page.

---

## H. Agent visual treatment

The four canonical agents — **Nexus, Sentinel, Atlas, Steward** —
are visible but elegant:

- A small **AgentBadge** (mono uppercase pill, NAVY-tinted by
  default).
- A short label naming the agent (e.g., "Sentinel · brief").
- No avatar, no face, no animated glyph.

### Per-agent accent

| Agent | Accent | Where it leads |
|---|---|---|
| **Nexus** | `NAVY` | Programs detail, Maestro workshop briefs |
| **Sentinel** | `AMBER` | Intelligence brief, pattern detail |
| **Atlas** | `INK` (dark hero) or `NAVY` (light) | AI Control Tower brief |
| **Steward** | `MUTED` | Admin / Setup, gate readiness |

### Brief panel shell

Every agent brief uses the same `AgentBriefPanel`:

- Card surface (light) or `INK_DARK` (dark hero variant).
- 3px left border in the agent's accent.
- Eyebrow: `<agent name> · <source label>` mono uppercase.
- Title: H3 (`INK` on light, `surface` on dark).
- ≤ 6 BriefLine rows (label · value).
- Three disabled "Ask <agent>" follow-up chips with sub-label
  `deferred · live <agent> runtime`.
- Footer: deterministic-source caption.

### Forbidden

- Anthropomorphic glyphs (no robot icon, no avatar).
- Color-coded "sentiment" (no greens for happy, no reds for angry).
- Sound, motion, talking-head animation.
- Always-on chat panel.

---

## I. No-clutter rules

These rules are **non-negotiable**.

- **One brief per page.** Atlas, Sentinel, Steward — only one
  is the page voice.
- **Five scorecards max** per page.
- **Three pressure cards max** per page.
- **One active lens at a time.**
- **Details hidden by default** — surfaced via same-canvas mode
  switches, drawers, or click-to-explore. Never crammed above the
  fold.
- **No banners** — no marketing, promo, announcement strips.
- **No animation beyond a 120ms fade.**
- **No tooltips on prose.** Tooltips belong on chips and status
  pills.
- **No giant icons.** Status is communicated by chip + accent
  color, not pictogram.
- **No fake dollar amounts** — every dollar must trace back to a
  baseline + target + realized ledger.
- **No real `E-###` evidence citation** until the registry resolves
  it.
- **No "live retrieval" claim** until the live runtime lands.

If a surface feels noisy, drop a panel, collapse a row, move detail
into a drawer. Calm wins.

---

## J. Card / table / drawer style

### Card

- White surface (`#FFFFFF`), 1px `border`, 12px radius (10px small).
- 16 – 20px padding.
- Optional 3px left border in the agent / status accent.
- Internal hierarchy: eyebrow (mono) → headline (DM Sans 600) →
  body → metadata grid (mono) → action.
- Hover: 1px border tint to active accent. No shadow lift, no color
  background swap.

### Table

- Reserved for Admin / Programs portfolio.
- Sticky header in `surface2`, mono uppercase eyebrow cells.
- Body rows in `card`. No zebra striping.
- Row hover: `surface2`. No underline.
- ≤ 6 visible columns. Overflow lives in the row drawer.

### Drawer

- Right-aligned overlay (or in-pane object inspector).
- 360 – 480px desktop; full-screen sheet on narrow viewports.
- 24px padding, 1px left `border`, `card` background.
- Title eyebrow + H3, plain-text "Close ✕" affordance.
- 120ms fade animation only — no slide, no spring.

### Dashed-border placeholder

- `surface2` background, 1px dashed `border`, 10px radius, 12 – 14px
  padding.
- Italic body in `MUTED`. Always carries a sentence naming **why**
  the placeholder is empty.

---

## K. Progressive disclosure

Surfaces follow a strict top-to-bottom stack:

1. **Brief** at the top — single agent voice, calm.
2. **Readiness panels / scorecards / pressure cards** below the
   brief — ≤ 5 panels.
3. **Drillable list / explorer rail** below the panels —
   collapsible.
4. **Object inspector / detail drawer** at the bottom or as
   overlay — honest-empty until selection.

Operators move top-to-bottom, never side-to-side at the same
density level. Two competing briefs on the same page is
forbidden.

---

## L. Acceptance for `verified` promotion of DES1

- Founder confirms the wordmark direction (no-gap, "Abar" near-
  black bold + "Va" navy slightly larger).
- Founder confirms the symbol motif (small connector / data
  hairlines + vertical anchor).
- Founder confirms the off-white surface / NAVY accent palette,
  retiring the prior teal direction.
- Founder confirms the thin top nav, agent treatment, and
  no-clutter rules.
- Documentation only; no application code, runtime, auth, supabase,
  or migrations are modified.
