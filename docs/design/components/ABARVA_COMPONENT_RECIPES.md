# AbarVa · Component Recipes

Slice ID: DES1 / DES2 component recipes
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25

This document specifies the canonical AbarVa component recipes.
Future implementation slices follow these recipes. Reads in
`ABARVA_VISUAL_CANON.md`.

Recipes documented:

1. AbarVaWordmark · AbarVaTopNav
2. AgentBadge · AgentBriefPanel
3. MetricStrip
4. PressureCard · PatternCard
5. JourneyRail
6. FileTypeChip · EvidenceChip
7. DetailDrawerShell · EmptyInspector

---

## 1. AbarVaWordmark + AbarVaTopNav

### AbarVaWordmark

Renders the canonical "AbarVa" mark — "Abar" near-black bold, "Va"
NAVY slightly larger.

```tsx
<AbarvaWordmark size="md" />
```

- Sizes: `sm` (16/18px), `md` (18/20px), `lg` (24/28px).
- Always two `<span>` children inside one inline-flex container —
  no SVG.
- Letter-spacing: −0.01em on "Abar"; default on "Va".
- "Va" is rendered at 1.05 – 1.10× the size of "Abar".
- Vertical alignment: baseline. Never raised, never superscripted.

### AbarVaTopNav

The single global top nav.

- Height 52 – 56px (thin).
- Layout: wordmark · top-level link row · operator chip.
- Wordmark left, clickable to `/home`.
- Center top-level surfaces in canonical order
  (Programs · Tower · Intelligence · Source · Admin). Active surface
  adds a 2px bottom inset in `NAVY`.
- Operator chip: 28px circle, mono initials in `INK` on `surface2`.
- 1px bottom `border`. No banner / promo strip.

---

## 2. AgentBadge + AgentBriefPanel

### AgentBadge

Inline marker that names which agent is speaking.

```tsx
<AgentBadge agent="sentinel" status="partial" size="sm" />
```

- 9 – 10px JetBrains Mono uppercase, weight 700.
- Background: agent accent at 10 % opacity (NAVY_SOFT, AMBER_SOFT,
  etc.).
- Foreground: agent accent.
- Optional status suffix: `· <status>` muted.
- Padding 2 – 4px / 6 – 10px. Radius 999.
- Inline only; never block. Never carries a glyph.

### AgentBriefPanel

The shared brief shell every agent uses.

```tsx
<AgentBriefPanel
  agent="sentinel"
  variant="light"   // or "dark" for Atlas hero
  title="..."
  eyebrow="..."
  topChips={[...]}
  briefLines={[...]}
  recommendedAction={{ label, reason, href }}
  suggestedFollowUps={[...]}      // exactly 3, all disabled
  sourceLabel="..."
  interpretationBasis="..."
/>
```

- Variant `light`: `card` background, 1px `border`, 12px radius,
  18 – 22px padding.
- Variant `dark`: `INK_DARK` or `NAVY_DARK` background, type
  uses `surface` foreground.
- 3px **left** border in agent's accent.
- Eyebrow + title at top; severity / confidence chips top-right.
- ≤ 6 BriefLine rows.
- Recommended-action callout in dashed-border `surface2` panel.
- Three disabled "Ask <agent>" chips with sub-label
  `deferred · live <agent> runtime`.
- Footer caption echoes `interpretationBasis`.

---

## 3. MetricStrip

Calm metric strip: a horizontal row of small stat chips, used in
Tower / Programs / Admin to surface 3 – 5 numbers at a glance.

```tsx
<MetricStrip
  metrics={[
    { label: 'loaded',    value: '100' },
    { label: 'available', value: '73'  },
    { label: 'usable',    value: '38', tone: 'navy' },
  ]}
/>
```

- Each metric: mono uppercase label + DM Sans value (16 – 18px,
  weight 700).
- Tone options: `default` (`INK`), `navy` (`NAVY`), `amber`
  (`AMBER`), `red` (`RED`).
- Padding 4 – 8px / 10 – 14px; pill background `surface2`; radius
  999.
- ≤ 5 metrics per strip. No animation.

---

## 4. PressureCard + PatternCard

### PressureCard

Tower / Programs pressure surfacing.

- White card, 1px border, 3px **top** border in severity accent
  (NAVY medium · AMBER high · RED critical · MUTED low).
- Eyebrow: `<severity> pressure · <programCode>` mono.
- Title: H3 (DM Sans 600).
- Body: 13px DM Sans `MUTED`.
- Missing-inputs preview: top 3 + "+ N more" overflow.
- Recommended-action row.
- "Open program →" affordance.

### PatternCard

Sentinel pattern surfacing on Intelligence.

- White card, 1px border, 3px **top** border in severity accent.
- Eyebrow: pattern name in agent accent (mono).
- Severity + confidence MiniChips top-right.
- Title: H3.
- Summary body.
- `whyItMatters` italic caption.
- 2-cell stat grid (Programs / Source signals).
- Affected program list (top 4 + overflow). Programs link to
  canonical Programs detail.
- Collapsible `Missing inputs · N` `<details>` block.
- Recommended-action row.
- Handoff chips.
- "Open pattern detail →" affordance.

---

## 5. JourneyRail

Six-phase rail for the program journey page.

- Horizontal flex row, full width.
- Each phase node: 28 – 32px circle, 1px border, label below in
  11px mono uppercase.
- Active phase: filled in `NAVY`; future phases muted hairline; past
  phases NAVY-tinted.
- Gate cap between phases: small pill carrying G1 / G2 / G3 / G4
  in mono uppercase + status chip beneath.
- Click on phase → routes to phase canvas.
- Programs in canonical Execute (5) emit no gate cap after phase 5
  (no exit gate).

---

## 6. FileTypeChip + EvidenceChip

### FileTypeChip

Names the artifact's file type.

```tsx
<FileTypeChip type="HTML" />
```

- Pill: 10px JetBrains Mono uppercase, weight 700, letter-spacing
  0.12em.
- Background `surface2`. Foreground `MUTED`.
- Padding 2px / 6px. Radius 4.
- Types: `DOC` · `PDF` · `XLS` · `PPT` · `NOTE` · `HTML` · `DATA`.

### EvidenceChip

Names an evidence reference state.

```tsx
<EvidenceChip state="cited" />
```

- States (per canon §J + ADM1 §J):
  `not_seeded` · `partial` · `cited` · `quality_checked` ·
  `usable_as_evidence` · `blocked`.
- Color: NAVY for cited / quality_checked / usable_as_evidence;
  AMBER for partial; RED for blocked; MUTED for not_seeded.
- Hover tooltip names the state in plain language.
- Never carries a real `E-###` citation today.

---

## 7. DetailDrawerShell + EmptyInspector

### DetailDrawerShell

Right-side overlay for per-object detail.

```tsx
<DetailDrawerShell
  open={open}
  title="..."
  eyebrow="..."
  onClose={onClose}
>
  ...content...
</DetailDrawerShell>
```

- 360 – 480px wide on desktop; full-screen sheet on narrow
  viewports.
- White surface, 1px left border, 24px padding.
- Header: eyebrow (mono) + H3 + plain-text "Close ✕".
- Footer caption: deterministic-source label.
- 120ms fade animation only. Closes on Esc / click-outside / "Close
  ✕".

### EmptyInspector

Honest placeholder for empty inspector slots.

```tsx
<EmptyInspector
  caption="Object inspector slot · selecting a row will open the detail drawer here once the inspector slice lands."
  routeHint={{ label: 'Open data', href: '/platform/admin/data' }}
/>
```

- Dashed-border container: `surface2`, 1px dashed `border`, 10px
  radius, 12 – 14px padding.
- Body: 11 – 12px italic `MUTED_SOFT`.
- Optional route hint as a small `NAVY` link at the bottom.
- Always renders the caption explicitly. Never blank.

---

## Acceptance for `verified` promotion

- Each component matches the recipe's visual treatment + behavior.
- Props match the recipe's suggested shape.
- All canon §H, §I, §J, §K, §L rules honored.
- Module hygiene: each component imports only `next/link`, the
  AbarVa theme module, sibling components, and DOM types — never
  Sentinel / Atlas / Nexus / Agent runtime, Source UI, legacy
  /programs, mock.ts, auth, or supabase.
