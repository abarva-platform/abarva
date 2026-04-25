# AbarVa · Visual Canon

Slice ID: DES1
Document type: design canon — contract for all future implementation
slices.
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

This document captures the approved AbarVa visual direction. Every
future Codex / Claude implementation slice **must** read this canon
first and conform to the rules below. Pull requests that violate
the canon are not eligible for `verified` promotion.

If the founder approves a deviation, that deviation lands as an
explicit revision to this document — never as silent drift inside a
feature slice.

---

## A. Brand direction

AbarVa is a **calm, executive-grade, agent-led** product. It is read
in boardrooms, not on phones in line at coffee shops. The visual
system reflects that posture:

- **Calm** — reads like a printed brief, not a SaaS dashboard.
- **Executive-grade** — every surface should defend a CXO claim.
- **Agent-led** — Nexus / Sentinel / Atlas / Steward speak; the
  surface frames their voice.
- **Honest** — when data is missing, the surface names the absence
  rather than fabricating a value.

If a surface looks like a metrics wall, it is wrong. If it looks
like an executive operating brief, it is right.

---

## B. AbarVa wordmark rules

The wordmark is **AbarVa** — capital A, lowercase b/a/r, capital V,
lowercase a. Always rendered as the literal string "AbarVa" — never
"abarva", "ABARVA", "Abarva", or any other casing. Never abbreviated
to "AV" or "AB" inside the product.

- **Font**: serif (Georgia or "Times New Roman" fallback) at every
  size. Never sans-serif. Never italic. Never display-script.
- **Color**: ink (`#0F0E0D`) on cream, or cream on ink. No accent
  fills, no gradients, no shadow.
- **Letter-spacing**: 0 (default tracking). Never expanded, never
  condensed.
- **Minimum size**: 16px on screen, 9pt in print. Never below.
- **Reserved area**: half-x of the wordmark height of breathing room
  on every side.
- **Variants**: only one — the literal "AbarVa" wordmark. No mark
  + tagline lockups inside product.

The wordmark anchors the top-left of the top nav and never
participates in animation, hover state, or skin theming.

---

## C. Logo / symbol rules

AbarVa is **wordmark-only**. There is no symbol, no glyph, no
"icon-only" mark. Never invent one.

- The wordmark functions as the logo on every surface (top nav,
  print export, email signature, browser favicon-rendered glyph).
- The favicon is a wordmark stencil at small size, not a glyph.
- "Powered by AbarVa" lockups are forbidden inside product.
- AbarVa never co-brands inside product (no "AbarVa × Vendor" logo
  rows). External marketing is governed by a separate canon, not
  this one.

---

## D. Color palette

The palette is **small and disciplined** — 6 surface tones, 3
semantic accents, 2 muted accents. No gradients, no neon, no
brand-rainbow.

### Surface

| Token | Hex | Use |
|---|---|---|
| `surface` (cream) | `#FAFAF9` | Default page background. The platform reads on cream. |
| `surface2` | `#F7F6F3` | Inset surfaces, secondary backgrounds, dashed-border placeholders. |
| `card` | `#FFFFFF` | Cards, drawers, panels, brief panels. |
| `border` | `#E8E6E3` | Default 1px border on cards / dividers / chips. |
| `borderSoft` | `#F2F1F0` | Hairlines inside cards, subtle separators. |
| `ink` | `#0F0E0D` | Primary type. Headlines, brief titles, key values. |

### Type tones

| Token | Hex | Use |
|---|---|---|
| `body` | `#3D3B38` | Body copy. |
| `muted` | `#5a5148` (or `#706D66`) | Secondary copy, captions, descriptions. |
| `mutedSoft` | `#9A958E` (or `#8a7e72`) | Eyebrows, monospace labels, footers. |

### Semantic accents

| Token | Hex | Use |
|---|---|---|
| `accent` (teal) | `#0E9F8C` | Ready / on-track / primary action. |
| `amber` | `#B45309` (or `#D97706`) | Partial / pressure / warning. |
| `red` | `#C53030` (or `#E04444`) | Blocked / critical / failure. |

Each semantic accent has a corresponding 8 – 10 % opacity tint
(`accentSoft`, `amberSoft`, `redSoft`) for chip backgrounds and
status pills. Never use full-saturation accent for fills.

### Auxiliary

| Token | Hex | Use |
|---|---|---|
| `teal` | `#1f7a8c` | Confidence / interpretation chip backgrounds. |
| `green` | `#166534` | "Approve" affordances only — never decorative. |

### What the palette forbids

- Gradients (linear, radial, mesh).
- Pure black (`#000`) backgrounds or fills.
- Pure white type on saturated accent fills.
- Any hue outside the table above. If a feature wants a new color,
  it must land in the canon before it lands in code.

---

## E. Typography

Three families, three roles.

| Family | Where it appears |
|---|---|
| **Georgia, "Times New Roman", serif** | Page titles, brief titles, card headlines, hero values. Always serif for the titular voice. |
| **DM Sans, -apple-system, sans-serif** | Body copy, paragraph prose, mid-prominence labels. |
| **JetBrains Mono, "Courier New", monospace** | Eyebrows, status chips, file-type chips, evidence ids, inline code, tabular data. |

### Scale

- **H1 / page title**: 24 – 28px serif, weight 600.
- **H2 / section**: 18 – 22px serif, weight 600.
- **H3 / card**: 15 – 18px serif, weight 600.
- **Body**: 13 – 14px DM Sans, weight 400, line-height 1.55.
- **Eyebrow / chip**: 9 – 11px JetBrains Mono, weight 700, uppercase,
  letter-spacing 0.10em – 0.14em.

### Voice rules

- Never bold inside body prose; rely on size + weight at the
  headline level. Bold inside a paragraph is a smell.
- Never italicize for emphasis; italic is reserved for
  interpretation captions and honest fallbacks.
- Eyebrows are uppercase with letter-spacing — body is sentence
  case. Both casing styles never appear in the same headline.

---

## F. Light vs dark usage

AbarVa is a **light-surface product**. Cream is the default
background. There is **no dark mode** today.

The single dark surface is the **Admin Portal sidebar** (a near-
black `#020408` rail). It is reserved to differentiate platform-
governance content from tenant content. No other surface in the
product uses dark.

When dark mode lands as a future canon revision, it will be a full
re-spec of every token — not a per-component opt-in.

---

## G. Top nav direction

The top nav is **the AbarVa wordmark, plus the eight canonical
surfaces, plus the operator profile chip**. Nothing else.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ AbarVa   Programs · Tower · Intelligence · Source · Admin   │
│                                                  AS · v1.0  │
└─────────────────────────────────────────────────────────────┘
```

- Left: AbarVa wordmark (serif). Click → `/home`.
- Center: top-level surfaces in canonical order
  (Programs · Tower · Intelligence · Source · Admin). The
  per-tenant workspace is selected from the workspace switcher,
  not the top nav.
- Right: operator initials chip + role label. Click → operator
  drawer (sign out, role inspector, "switch workspace").

### Rules

- Height: 56 – 64px. Never larger.
- Background: cream (`#FAFAF9`); 1px bottom border (`#E8E6E3`).
- Wordmark: serif, never animated.
- Top-level links: 13 – 14px DM Sans, color shifts from `muted` →
  `ink` on hover; never underlined except on focus.
- Active surface: 2px bottom inset accent (teal `#0E9F8C`).
- No banner, no announcement bar, no marketing strip.
- No dropdown mega-menus. Sub-surfaces live inside the surface
  page, not in the nav.

---

## H. Agent visual treatment

The four canonical agents — **Nexus, Sentinel, Atlas, Steward** —
have a consistent visual treatment. Operators must be able to read
"who is speaking" at a glance.

| Agent | Voice | Accent | Where it leads |
|---|---|---|---|
| **Nexus** | program mastermind · neutral, briefing | teal `#0E9F8C` | Programs detail, Maestro workshop briefs |
| **Sentinel** | pattern detector · clinical | amber `#B45309` | Intelligence brief, pattern detail |
| **Atlas** | executive editorial · concise | teal-on-ink for chrome, amber for pressure | Tower brief, AI Control Tower brief |
| **Steward** | setup gate · utility-clerical | muted ink (`#0F0E0D` on `#F7F6F3`) | Admin Setup Home, gate readiness |

### Consistent agent-brief shell

Every agent brief — Atlas, Sentinel, Steward — uses the same panel
shell:

- Card background `#FFFFFF`, 1px border, 3px left border in the
  agent's accent.
- Eyebrow: `<agent name> brief · <source label>` in JetBrains Mono.
- Title: serif H3.
- Severity / confidence chips at top-right; tooltip = interpretation
  basis.
- 4 – 6 BriefLine rows (label · value); never a paragraph wall.
- "Ask <agent>" disabled-chip footer with sub-label
  `deferred · live <agent> runtime` until the live runtime lands.
- Footer caption with the deterministic source basis.

### "Ask <agent>" rules

- Disabled by default. The `disabled` + `aria-disabled="true"` pair
  is mandatory until the live runtime lands.
- Sub-label `deferred · live <agent> runtime` is mandatory.
- Hover tooltip names the reason for deferral.
- When live wires, the visual treatment stays — only the disabled
  state and sub-label flip.

### Forbidden

- Anthropomorphic glyphs (no robot icons, no avatars).
- Color-coded "sentiment" signals (no greens for "happy", no reds
  for "angry").
- Sound, motion, or talking-head animation.

---

## I. Icon / symbol restraint

**The platform uses almost no icons.** Operators read AbarVa with
their eyes on the words; pictograms add noise.

- The Admin Portal sidebar is the only place where small emoji-style
  icons appear (👤 / 🔐 / 📈 etc.). They exist only because the
  sidebar is a dense navigation rail; they will be replaced with
  monochrome glyphs in a future canon revision.
- Status is communicated by **chip + accent color**, not by icon.
- The "→" affordance is a literal Unicode arrow inside an anchor; no
  SVG arrow components.
- File types use **text chips** (`PDF`, `XLS`, `HTML`) not file-type
  glyphs.
- No emoji inside body prose, brief panels, or user-typed content.
- No third-party icon libraries are imported into the product.

If a surface "needs an icon," the answer is almost always: clearer
copy, a better chip, or a better hierarchy.

---

## J. Card / table / drawer style

### Card

- White surface (`#FFFFFF`), 1px border (`#E8E6E3`), 12px border
  radius (10px on small cards).
- Padding: 16 – 20px. Never < 12px, never > 24px.
- Optional 3px left or top border in the agent / status accent.
- Internal hierarchy: eyebrow (mono) → headline (serif) → body
  (DM Sans) → metadata grid (mono) → action.
- Hover: no shadow lift. Optional 1px border tint to the active
  accent. No color background swap.

### Table

- Reserved for **Admin** and **Programs portfolio** only.
- Sticky header with `surface2` background, mono uppercase eyebrow
  cells.
- Body rows: `card` background; alternating rows are not allowed
  (no zebra).
- Row hover: `surface2` background; no border highlight.
- Action column: 13px DM Sans, accent teal, no underline.
- Never more than 6 visible columns. Overflow lives in the row
  drawer, not in additional columns.

### Drawer

- Right-aligned overlay or in-pane object inspector.
- 24px padding, 1px left border (`#E8E6E3`), `card` background.
- Title: serif H3, eyebrow above.
- Close affordance: top-right "Close ✕" plain text, never a styled
  X icon.
- Drawers do not animate beyond a 120ms fade. No slide, no spring.

### Dashed-border placeholder

Used for honest-empty states (object inspector, dataset detail,
authored content "partial" callout).

- Background: `surface2`, dashed 1px border (`#E8E6E3`), 10px radius.
- Padding: 12 – 14px. Italic body text in `muted`.
- Always carries a sentence naming **why** the placeholder is empty
  ("Object inspector slot · selecting a row will open the detail
  drawer here once the inspector slice lands.").

---

## K. Progressive disclosure rules

AbarVa surfaces follow a **strict progressive-disclosure stack**:

1. **Brief** at the top. Single agent voice, calm, not tabular.
2. **Readiness panels / scorecards / pressure cards** below the
   brief. ≤ 5 panels per surface. Each is a portal.
3. **Drillable list / explorer rail** below the panels. Optionally
   collapsed; the brief and panels carry the first impression.
4. **Object inspector / detail drawer** at the bottom or as overlay.
   Honest-empty until selection.

The brief explains what to do; the panels frame status; the explorer
lists rows; the inspector shows one row in depth. Operators move
top-to-bottom, never side-to-side at the same density level.

### Forbidden

- Two competing briefs on the same page.
- Tables above briefs.
- Mid-page chat panels.
- Two object inspectors at once.

---

## L. No-clutter rules

These rules are **non-negotiable**. Implementation slices that
violate them are not eligible for `verified`.

- **One top-level title per page.** No competing H1s.
- **One brief per page.** Atlas, Sentinel, Steward — only one is
  the page voice.
- **One active lens per page.** Adoption / value / risk / cost /
  ops / readiness lenses are mutually exclusive.
- **Three pressure cards max** above any brief. Beyond three is
  surfaced inside the brief's `interpretationBasis`, not on the
  page.
- **Five scorecards max** per page.
- **No banners.** No marketing, no "promo" rows, no announcement
  strips.
- **No tooltips on prose.** Tooltips belong on chips, status pills,
  and confidence labels — never on body text.
- **No animation beyond 120ms fade.** No slide, no spring, no
  shimmer, no skeleton bounce.
- **No badge counts on top nav.** Badges live inside the surface,
  not on the surface label.
- **No dollar amount may appear that is not captured internally.**
  Every dollar must trace back to a baseline + target + realized
  ledger. Atlas refuses to fabricate.
- **No real `E-###` evidence citation may appear** until the
  evidence registry resolves it. Honest fallback caption is the
  contract.
- **No "live retrieval" claim** until the live runtime lands. Every
  brief carries `deterministic_seed` or `*_read_model` source label.
- **Disabled affordances always render** with `disabled` +
  `aria-disabled="true"` + a `deferred · live <thing>` sub-label.
  Never silently hidden.

If a surface feels noisy, the answer is almost always: drop a
panel, collapse a row, move detail into the drawer. Calm wins.

---

## M. Acceptance for `verified` promotion of DES1

- Founder confirms the wordmark / palette / typography / nav
  direction reflects intent.
- Founder confirms the agent treatment (briefs, chips, "Ask"
  drawers) matches the voice partition.
- Founder confirms the no-clutter rules (3 / 5 / 1 / 1 / 1) match
  the boardroom-grade product posture.
- Documentation only; no application code, runtime, auth, supabase,
  or migrations are modified.
