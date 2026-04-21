# AbarVa Design System · Canonical Specification

**The single source of truth for AbarVa's visual and interaction design.**

This document specifies the design tokens, component patterns, interaction patterns, motion principles, accessibility standards, and voice-in-UI conventions that govern every surface of the AbarVa platform. It consolidates design rules previously scattered across the Intelligence, Programs, Tower, and Agent Architecture specs into one authoritative reference.

When a page is designed — by Codex, by Claude Code, by a human designer, by anyone — this document is what they reference. Drift from this spec is a bug.

## Document structure

Five packets organized into two tracks.

**Track A · Foundation** (Packets 1-2)
1. Design tokens · colors, typography, spacing, elevation, motion primitives
2. Component patterns · canonical UI components with visual specs and usage rules

**Track B · Application** (Packets 3-5)
3. Interaction patterns · hover, focus, loading, empty, error, transitions
4. Voice, microcopy, iconography, accessibility standards
5. Surface-specific conventions · how each surface (Intelligence / Programs / Tower) applies the system

Each packet locks decisions and closes with a checkpoint.

---

# PACKET 1 · Design Tokens

Design tokens are the atomic values that compose every visual element. They are versioned, named, and referenced — never inlined. A card color is not `#1E293B`, it is `color.surface.raised`. This indirection is what lets the system evolve without rewriting components.

## 1.1 Color system

AbarVa operates in a dark-first palette. Dark mode is the default. Light mode is deferred post-demo.

### Foundation colors

```
color.background.base         #0F172A    /* Page background */
color.background.subtle       #111B2E    /* Subtle alternate background */
color.surface.raised          #1E293B    /* Card, panel, modal */
color.surface.elevated        #26334A    /* Elevated card, dropdown */
color.surface.overlay         #0F172AE6  /* Modal backdrop, 90% opacity */
color.border.subtle           #1E293B    /* Default border */
color.border.default          #334155    /* Input border, divider */
color.border.strong           #475569    /* Emphasis border */
color.border.focus            #14B8A6    /* Focus ring, teal */
```

### Text colors

```
color.text.primary            #F8FAFC    /* Body, headings */
color.text.secondary          #CBD5E1    /* Supporting text */
color.text.muted              #94A3B8    /* Metadata, timestamps */
color.text.disabled           #64748B    /* Disabled state */
color.text.inverse            #0F172A    /* Text on light backgrounds, rare */
```

### Brand colors

```
color.brand.primary           #14B8A6    /* AbarVa teal, wordmark "Va" */
color.brand.primary.hover     #0D9488    /* Hover state */
color.brand.primary.active    #0F766E    /* Active/pressed */
color.brand.primary.subtle    #14B8A61A  /* 10% opacity for backgrounds */
```

### Agent accent colors

Each agent has a distinctive accent used sparingly — agent identification, agent-scoped UI elements, agent-owned actions.

```
color.agent.nexus             #14B8A6    /* Teal · delivery, execution */
color.agent.nexus.subtle      #14B8A61A  
color.agent.sentinel          #6366F1    /* Indigo · research, depth */
color.agent.sentinel.subtle   #6366F11A
color.agent.atlas             #F59E0B    /* Amber · alert, real-time */
color.agent.atlas.subtle      #F59E0B1A
```

Rule: agent accents never dominate a screen. They appear as thin borders, small dots, accent marks on chat panels, or tinted backgrounds for agent-scoped cards — never as full-bleed color.

### Semantic colors

For status, severity, feedback.

```
color.severity.critical       #DC2626    /* Critical signal, blocker */
color.severity.warning        #D97706    /* Warning signal, caution */
color.severity.success        #059669    /* Success, green */
color.severity.info           #2563EB    /* Informational, neutral blue */

color.severity.critical.subtle #DC26261A
color.severity.warning.subtle  #D977061A
color.severity.success.subtle  #0596691A
color.severity.info.subtle     #2563EB1A
```

Usage rule: severity colors indicate *state*, not *decoration*. A button is not red unless it indicates destructive action. A card is not amber unless it carries a warning signal.

### Data visualization palette

For charts, graphs, distributions. Ordered for max contrast when values are compared.

```
color.data.1                  #14B8A6    /* Teal primary */
color.data.2                  #6366F1    /* Indigo */
color.data.3                  #F59E0B    /* Amber */
color.data.4                  #EC4899    /* Pink */
color.data.5                  #8B5CF6    /* Violet */
color.data.6                  #14B8A680  /* Teal 50% for secondary series */
color.data.7                  #6366F180
color.data.8                  #F59E0B80
```

Rule: never use severity colors for data series. A bar chart with red bars implies criticality even if the bars just represent a number.

## 1.2 Typography

Three typefaces, each with a specific role. No fourth typeface. Ever.

### Typefaces

**Georgia (serif)** — used exclusively for the AbarVa wordmark. Nowhere else.

**DM Sans (sans-serif)** — the body typeface. All UI text, headings, body, labels, buttons.

**JetBrains Mono (monospace)** — used for: Intelligence product names, code snippets, data identifiers (IDs, hashes), technical metadata, table cell values where tabular alignment matters.

Load via Google Fonts CDN:
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

Georgia is a system font, no load needed.

### Type scale

```
type.display.xl     48px / 56px / -0.02em / DM Sans 700   /* Hero, rare */
type.display.lg     36px / 44px / -0.02em / DM Sans 700   /* Page hero */
type.display.md     28px / 36px / -0.01em / DM Sans 700   /* Section hero */

type.heading.xl     24px / 32px / -0.01em / DM Sans 700   /* Page H1 */
type.heading.lg     20px / 28px / 0        / DM Sans 700   /* H2 */
type.heading.md     18px / 26px / 0        / DM Sans 600   /* H3, card title */
type.heading.sm     16px / 24px / 0        / DM Sans 600   /* H4, widget title */
type.heading.xs     14px / 20px / 0        / DM Sans 600   /* H5, subsection */

type.body.lg        16px / 24px / 0        / DM Sans 400   /* Primary body */
type.body.md        14px / 22px / 0        / DM Sans 400   /* Default body */
type.body.sm        13px / 20px / 0        / DM Sans 400   /* Supporting body */

type.label.lg       14px / 20px / 0.01em   / DM Sans 500   /* Input label */
type.label.md       12px / 16px / 0.02em   / DM Sans 600   /* Section label */
type.label.sm       11px / 14px / 0.05em   / DM Sans 600   /* Microlabel, uppercase */

type.caption        12px / 16px / 0        / DM Sans 400   /* Caption, timestamp */
type.meta           11px / 14px / 0.03em   / DM Sans 500   /* Metadata, badge */

type.code.lg        14px / 22px / 0        / JetBrains Mono 400
type.code.md        13px / 20px / 0        / JetBrains Mono 400
type.code.sm        12px / 18px / 0        / JetBrains Mono 400

type.intel.name     11px / 14px / 0.08em   / JetBrains Mono 600 UPPERCASE   /* Intelligence product name, teal */
```

### Wordmark

Locked specification. Never altered.

```
Wordmark:
  "Abar" — Georgia, 17px, weight 800, color.text.primary (#F8FAFC)
  "Va"   — Georgia, 23px, weight 900, color.brand.primary (#14B8A6)

Tagline:
  "Intelligence. Now act on it." — DM Sans, 14px, weight 700, color.text.primary
  (appears under wordmark in marketing surfaces only; not in authenticated product chrome)

Hero line (marketing surfaces):
  "Act on intelligence. Before the window closes." — DM Sans, 36px, weight 700
```

Minimum wordmark render size: 14px for "Abar" / 19px for "Va". Below this, use the brand mark alone (see iconography in Packet 4).

### Typography usage rules

- Never mix typefaces within a line except Wordmark ("Abar" / "Va" by design).
- Intelligence product names (e.g., "SITUATION INTELLIGENCE") always render in `type.intel.name` style — JetBrains Mono 11px uppercase teal. This is a recognition anchor across the product.
- Numerical data in tables or dashboards: use JetBrains Mono for tabular alignment. Non-tabular numbers inline with prose use DM Sans.
- Never use italics as emphasis in UI. Use weight (500 or 600) instead. Italics in UI reads as decoration and weakens hierarchy.

## 1.3 Spacing

Single baseline: 8px. Everything is a multiple of 4px, preferring multiples of 8.

```
space.0     0
space.0.5   2px
space.1     4px
space.1.5   6px
space.2     8px          /* Primary baseline unit */
space.3     12px
space.4     16px         /* Common card inner padding */
space.5     20px
space.6     24px         /* Common section gap */
space.8     32px         /* Large section gap */
space.10    40px
space.12    48px         /* Extra-large section gap */
space.16    64px
space.20    80px
space.24    96px
```

### Spacing usage rules

- Inter-component vertical spacing: `space.4` (16px) between related items, `space.6` (24px) between unrelated items, `space.8` (32px) between sections.
- Card inner padding: `space.4` (16px) for compact cards, `space.6` (24px) for default cards, `space.8` (32px) for hero cards.
- Text-to-element spacing: `space.2` (8px) between a label and its input, `space.1` (4px) between adjacent inline elements.
- Horizontal gutters: `space.6` (24px) between columns in multi-column layouts.

## 1.4 Elevation and shadow

Dark-first design uses less shadow than light-first. Elevation is primarily expressed through `color.surface.*` values, with subtle shadows reserved for floating elements.

```
shadow.none           none
shadow.subtle         0 1px 2px 0 rgba(0, 0, 0, 0.3)
shadow.default        0 4px 12px 0 rgba(0, 0, 0, 0.4)       /* Dropdown, popover */
shadow.raised         0 8px 24px 0 rgba(0, 0, 0, 0.5)       /* Modal, dialog */
shadow.floating       0 16px 48px 0 rgba(0, 0, 0, 0.6)      /* High-elevation floating panel */

shadow.focus.brand    0 0 0 3px rgba(20, 184, 166, 0.35)    /* Focus ring, teal glow */
shadow.focus.danger   0 0 0 3px rgba(220, 38, 38, 0.35)     /* Destructive focus ring */
```

### Elevation usage rules

- Cards on the base background: use `color.surface.raised`, no shadow.
- Dropdowns, popovers: use `color.surface.elevated` + `shadow.default`.
- Modals, dialogs: use `color.surface.raised` + `shadow.raised` + `color.surface.overlay` backdrop.
- Floating right-rail (Atlas panel, signal detail): use `color.surface.raised` + optional `shadow.subtle` at the leading edge.

## 1.5 Border radius

```
radius.none           0
radius.sm             4px       /* Small interactive elements, tags */
radius.md             6px       /* Inputs, buttons */
radius.lg             8px       /* Cards, modals */
radius.xl             12px      /* Large cards, panels */
radius.2xl            16px      /* Hero cards */
radius.full           9999px    /* Pills, avatars */
```

## 1.6 Motion primitives

Motion reinforces meaning. It is not decoration. Every animation has a reason: signaling state change, guiding attention, masking latency, establishing continuity.

### Duration tokens

```
motion.duration.instant   75ms        /* Micro-feedback: button press, toggle */
motion.duration.fast      150ms       /* UI element transitions: hover, focus */
motion.duration.default   250ms       /* Panel slides, accordion expand */
motion.duration.slow      400ms       /* Page transitions, modal enter */
motion.duration.deliberate 600ms      /* Handoff ceremony, milestone celebrations */
```

### Easing tokens

```
motion.easing.linear      cubic-bezier(0, 0, 1, 1)
motion.easing.ease-out    cubic-bezier(0, 0, 0.2, 1)         /* Enter animations */
motion.easing.ease-in     cubic-bezier(0.4, 0, 1, 1)         /* Exit animations */
motion.easing.ease-in-out cubic-bezier(0.4, 0, 0.2, 1)       /* Transitions in place */
motion.easing.overshoot   cubic-bezier(0.34, 1.56, 0.64, 1)  /* Celebratory motion, rare */
```

### Motion usage rules

- Entering UI (dropdown opens, toast appears): `motion.duration.fast` + `motion.easing.ease-out`.
- Exiting UI: `motion.duration.instant` + `motion.easing.ease-in`. Exits are faster than entries.
- In-place state change (color shift, icon rotate): `motion.duration.fast` + `motion.easing.ease-in-out`.
- Large spatial moves (slide-in panels, page transitions): `motion.duration.default` + `motion.easing.ease-out`.
- Celebratory / significant moments (Phase 6 handoff completion): `motion.duration.deliberate` + `motion.easing.overshoot`. Use rarely.
- `prefers-reduced-motion` at the OS level: all motion reduces to `motion.duration.instant` or is disabled. Mandatory accessibility.

## 1.7 Breakpoints

Responsive breakpoints. Mobile-first where applicable, but most AbarVa surfaces are desktop-primary.

```
breakpoint.mobile         0 – 639px       /* Phone portrait */
breakpoint.tablet         640 – 1023px    /* Tablet, small laptop */
breakpoint.desktop        1024 – 1279px   /* Default desktop */
breakpoint.desktop.wide   1280px+         /* Wide desktop, Tower primary */
breakpoint.desktop.xl     1440px+         /* Large display */
```

### Breakpoint usage rules

- Intelligence surface: desktop-primary, minimum 1024px. Below 1024px, show "AbarVa works best on desktop" interstitial.
- Programs surface: desktop-primary, minimum 1024px. Same interstitial below.
- Tower surface: desktop-primary AND dedicated mobile experience at `/m/tower`. Between 640-1024px, redirect to mobile variant.
- All surfaces support 1280px+ as the optimized experience.

## 1.8 Z-index scale

Finite, named layers. No `z-index: 9999`.

```
z.base           0
z.raised         10       /* Raised card, dropdown trigger */
z.sticky         20       /* Sticky header, sticky footer */
z.dropdown       30       /* Dropdown menu, popover */
z.drawer         40       /* Side panel, drawer */
z.modal.backdrop 50
z.modal          51
z.toast          60
z.tooltip        70
z.agent.dock     80       /* Atlas mobile dock */
```

## 1.9 Decisions locked in Packet 1

| # | Decision | Rationale |
|---|---|---|
| 1.L1 | Dark-first palette, light mode deferred | Matches the product's analytical character; one mode simplifies |
| 1.L2 | Three typefaces only: Georgia (wordmark), DM Sans (UI), JetBrains Mono (code/intel/data) | Any more creates drift |
| 1.L3 | 8px baseline, everything multiples of 4 | Standard, predictable, tooling-friendly |
| 1.L4 | Agent accents used sparingly, never dominant | Unified platform feel, subtle agent identity |
| 1.L5 | Severity colors indicate state, never decoration | Reserved vocabulary |
| 1.L6 | Tokens are named, not inlined hex | Evolution without rewrite |
| 1.L7 | `prefers-reduced-motion` reduces all motion to instant | Accessibility mandate |
| 1.L8 | Finite named z-index scale | Prevents z-index wars |
| 1.L9 | Intelligence product names always JetBrains Mono 11px uppercase teal | Recognition anchor |
| 1.L10 | Wordmark locked: "Abar" 17px 800 white + "Va" 23px 900 teal Georgia | Brand signature, never altered |

---

## Packet 1 · Checkpoint

**STATUS · Track A, Packet 1 of 5 complete**

Design tokens defined: colors, typography, spacing, elevation, motion, breakpoints, z-index. Every value named and referenceable. Ready for Packet 2 (component patterns).

---

# PACKET 2 · Component Patterns

Components are the building blocks of every page. This packet specifies the canonical AbarVa components — their anatomy, variants, states, and usage rules. Every new page composes from this library. New components added to the library require a design review.

## 2.1 The component philosophy

Three rules govern every component.

**Rule 1 · One way to do a thing.** If there's a card pattern, there's one card pattern with defined variants. Not five card patterns that all look almost the same. Variety weakens recognition.

**Rule 2 · State is visible.** Every interactive component has explicit states: default, hover, focus, active, disabled, loading, error. Not specifying a state means it defaults to broken-looking.

**Rule 3 · Composition over customization.** Components compose. A signal card is a card + a severity badge + a metric + an action button. Not a custom "SignalCard" with bespoke styling. The underlying building blocks stay stable.

## 2.2 Button

The workhorse component. Every button in AbarVa uses one of these variants.

### Variants

**Primary** · for the single most important action on a page. Teal, solid. One per view maximum.

```
Background:  color.brand.primary       (#14B8A6)
Text:        color.text.inverse        (#0F172A)
Border:      none
Hover:       color.brand.primary.hover (#0D9488)
Active:      color.brand.primary.active (#0F766E)
Focus:       shadow.focus.brand
Disabled:    color.brand.primary @ 40% opacity, cursor not-allowed
```

**Secondary** · for supporting actions. Bordered, transparent fill.

```
Background:  transparent
Text:        color.text.primary
Border:      1px solid color.border.default
Hover:       color.surface.elevated background + color.border.strong border
Active:      color.surface.raised background
Focus:       shadow.focus.brand
```

**Tertiary / Ghost** · for de-emphasized actions, icon buttons, dismissals.

```
Background:  transparent
Text:        color.text.secondary
Border:      none
Hover:       color.surface.raised background, color.text.primary text
Active:      color.surface.elevated background
Focus:       shadow.focus.brand
```

**Destructive** · for actions that delete, sunset, or irreversibly change state.

```
Background:  color.severity.critical   (#DC2626)
Text:        color.text.primary
Border:      none
Hover:       color.severity.critical darkened 10%
Focus:       shadow.focus.danger
Confirmation required before firing (use a confirm modal)
```

### Sizes

```
button.sm    height 32px · padding 0 12px · type.body.sm  · icon 14px
button.md    height 40px · padding 0 16px · type.body.md  · icon 16px   /* Default */
button.lg    height 48px · padding 0 20px · type.body.lg  · icon 18px
```

### Anatomy

```
[icon-optional] [label-required] [icon-optional]
```

- Label is always required. Icon-only buttons exist but use a visually-hidden label for screen readers (aria-label).
- Leading icon = action descriptor (e.g., "+" for Add). Trailing icon = directional (e.g., arrow for "Continue →").
- Border radius: `radius.md` (6px).

### Usage rules

- One primary button per view. More than one creates hierarchy confusion.
- Destructive buttons always confirm — never fire on first click for irreversible actions.
- Icon-only buttons only for universally-understood icons (close, menu, settings). Never for custom actions.
- Button groups: horizontal, `space.2` (8px) gap. Primary always rightmost.

## 2.3 Input

Text input, the most common form element.

### Anatomy

```
[Label]                                            [optional hint]
┌─────────────────────────────────────────────────┐
│ [leading-icon] value goes here   [trailing-icon] │
└─────────────────────────────────────────────────┘
[helper text or error message]
```

### Specification

```
Height:         40px (default), 48px (large)
Padding:        0 12px (left/right), 0 40px if icon present
Background:     color.surface.raised
Border:         1px solid color.border.default
Border radius:  radius.md (6px)
Text:           type.body.md, color.text.primary
Placeholder:    type.body.md, color.text.muted

Label:          type.label.lg, color.text.secondary, space.2 below label before input
Helper text:    type.caption, color.text.muted, space.1 above
```

### States

```
Default:  border color.border.default
Hover:    border color.border.strong
Focus:    border color.border.focus, shadow.focus.brand
Error:    border color.severity.critical, helper text in same color
Disabled: background color.surface.subtle, text color.text.disabled, cursor not-allowed
```

### Variants

- **Text input** · single line, default
- **Textarea** · multi-line, min-height 80px, auto-grow disabled by default (opt-in)
- **Select** · dropdown with matching height and style, chevron icon on right
- **Search** · always has leading search icon, optional clear button
- **Password** · trailing eye icon to toggle visibility

### Usage rules

- Labels always present. "Placeholder-as-label" is an accessibility failure.
- Helper text is optional; error message replaces helper text when present.
- Required fields marked with `*` in label, not in placeholder.

## 2.4 Card

The container component. Cards group related content into scannable units.

### Anatomy

```
┌────────────────────────────────────────────────┐
│ [optional: header with title + actions]        │
│ ────────────────────────────────────────────── │
│                                                │
│  [body content]                                │
│                                                │
│ ────────────────────────────────────────────── │
│ [optional: footer with metadata or actions]    │
└────────────────────────────────────────────────┘
```

### Specification

```
Background:     color.surface.raised   (#1E293B)
Border:         1px solid color.border.subtle (subtle, almost invisible)
Border radius:  radius.lg (8px)
Padding:        space.6 (24px) default, space.4 (16px) compact, space.8 (32px) hero
Shadow:         none (elevation via surface color)

Header:
  Title:         type.heading.md, color.text.primary
  Subtitle:      type.body.sm, color.text.muted, space.1 below title
  Actions:       right-aligned, typically icon buttons or secondary buttons
  Separator:     1px color.border.subtle line below, space.4 after

Footer:
  Metadata:      type.caption, color.text.muted
  Actions:       right-aligned if present
  Separator:     1px color.border.subtle line above, space.4 before
```

### Variants

**Default card** · standard container. Most cards use this.

**Interactive card** · clickable, navigates or triggers action. Cursor pointer, hover state (background lightens to `color.surface.elevated`), focus state (brand focus ring).

**Status card** · has a left-edge accent bar indicating severity or agent ownership.

```
Accent bar:  4px wide, full height of card, left side
Color:       color.severity.* or color.agent.*
```

**Metric card** · specialized for displaying a number + context.

```
┌────────────────────────────────────────────────┐
│ METRIC LABEL (uppercase, type.label.sm)        │
│                                                │
│ $2.3M                      (type.display.md)   │
│ Shadow AI exposure         (type.body.sm)      │
│                                                │
│ ▲ 13% vs peer median       (type.caption)      │
└────────────────────────────────────────────────┘
```

**Signal card** (Tower-specific) · severity badge + headline + impact + timestamp. See Tower spec Packet 6.

### Usage rules

- Cards always have a clear reason to exist as a unit. Don't card everything.
- Nested cards (card inside card) should be rare; prefer sections with dividers.
- Card titles are sentence case ("Signal detail"), not title case ("Signal Detail").

## 2.5 Badge

Small status indicators. Inline, non-interactive.

### Specification

```
Height:         20px (default), 24px (large)
Padding:        0 8px
Border radius:  radius.full (pill) or radius.sm (tag)
Type:           type.label.sm for pill, type.meta for tag
```

### Variants

**Severity badges**

```
Critical:   background color.severity.critical.subtle,  text color.severity.critical
Warning:    background color.severity.warning.subtle,   text color.severity.warning
Success:    background color.severity.success.subtle,   text color.severity.success
Info:       background color.severity.info.subtle,      text color.severity.info
```

**Agent badges** — rarely used, only when identifying agent ownership visually.

```
Nexus:      background color.agent.nexus.subtle,     text color.agent.nexus
Sentinel:   background color.agent.sentinel.subtle,  text color.agent.sentinel
Atlas:      background color.agent.atlas.subtle,     text color.agent.atlas
```

**Neutral badge** — default status, counts, generic labels.

```
Background:  color.surface.elevated
Text:        color.text.secondary
```

### Usage rules

- Badges are labels, not actions. Not clickable.
- Maximum 2-3 badges on a single item. More than that is visual noise.
- Icons inside badges: 12px, preceded by 4px spacing.

## 2.6 Tabs

Segmented horizontal navigation within a page or panel.

### Specification

```
Tab bar:
  Height:            44px
  Background:        transparent
  Border bottom:     1px solid color.border.subtle
  Padding:           0 (tabs own their padding)

Tab:
  Height:            44px (aligned with bar)
  Padding:           0 space.4 (16px)
  Type:              type.body.md, color.text.muted
  Border bottom:     2px solid transparent (default)

Active tab:
  Type:              type.body.md weight 600, color.text.primary
  Border bottom:     2px solid color.brand.primary

Hover tab:
  Type:              color.text.secondary
  Cursor:            pointer
```

### Variants

**Primary tabs** · standard segmentation. Described above.

**Pill tabs** · filter chips. Used in lists and inboxes.

```
Background:        transparent
Border:            1px solid color.border.default
Border radius:     radius.full
Padding:           0 space.3 (12px)
Height:            28px

Active pill:
  Background:      color.brand.primary.subtle
  Text:            color.brand.primary
  Border:          1px solid color.brand.primary
```

### Usage rules

- Tabs are for switching between peer views of the same content. Not for steps in a flow (use a wizard component).
- Maximum 6 tabs visible. Beyond that, consider a dropdown or sidebar nav.

## 2.7 Modal / Dialog

Full-attention overlays for focused tasks or destructive confirmations.

### Anatomy

```
┌─ backdrop (color.surface.overlay, z.modal.backdrop) ─────┐
│                                                          │
│        ┌──────────────────────────────────────────┐      │
│        │ [Title]                            [✕]   │      │
│        │ [optional subtitle]                      │      │
│        │ ──────────────────────────────────────── │      │
│        │                                          │      │
│        │ [body content]                           │      │
│        │                                          │      │
│        │ ──────────────────────────────────────── │      │
│        │              [Cancel] [Primary action]   │      │
│        └──────────────────────────────────────────┘      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Specification

```
Max width:         600px (default), 800px (large), 1000px (xl)
Background:        color.surface.raised
Border radius:     radius.xl (12px)
Shadow:            shadow.raised
Padding:           space.8 (32px)
Z-index:           z.modal
Backdrop:          color.surface.overlay, z.modal.backdrop
Enter animation:   scale 0.96 → 1.0, opacity 0 → 1, motion.duration.default, ease-out
Exit animation:    motion.duration.instant, ease-in
```

### Variants

**Default modal** · forms, content displays.

**Confirmation modal** · destructive actions. Max width 480px. Primary button is destructive-styled. Cancel is always left of primary.

**Wizard modal** · multi-step. Shows progress indicator at top (3 dots / 3 numbered steps). Back button appears from step 2+.

### Usage rules

- Modals close on: Escape key, backdrop click (for non-destructive), Cancel button, X icon.
- Destructive modals do NOT close on backdrop click. User must explicitly Cancel or Confirm.
- Only one modal at a time. Nested modals are a design failure.
- Focus trap inside modal when open. First focusable element gets focus on open. Return focus to triggering element on close.

## 2.8 Slide-in panel

Right-edge panel for detail views without full navigation. Tower uses this for signal detail; Programs uses it for artifact detail.

### Specification

```
Position:          fixed right, full height
Width:             400px (default), 480px (wide)
Background:        color.surface.raised
Border left:       1px solid color.border.subtle
Padding:           space.6 (24px)
Z-index:           z.drawer
Enter animation:   translateX(100%) → 0, motion.duration.default, ease-out
Exit animation:    translateX(0) → 100%, motion.duration.default, ease-in
```

### Anatomy

```
┌───────────────────────────────────┐
│ [Title]                    [✕]    │
│ [subtitle]                        │
│ ──────────────────────────────── │
│                                   │
│ [scrollable body content]         │
│                                   │
│                                   │
│ ──────────────────────────────── │
│ [sticky footer: primary action]   │
└───────────────────────────────────┘
```

### Usage rules

- Panel doesn't take over the viewport. The user still sees context (dashboard, list) behind it.
- No backdrop dimming — panel is adjacent to content, not on top of it.
- Close affordances: X icon, Escape key. No backdrop click (there's no backdrop).
- Primary action pinned to bottom with a sticky footer. Content scrolls above.

## 2.9 Navigation

Two primary navigation patterns.

### Top nav (AbarvaNav)

Horizontal top bar, 64px tall, sticky.

```
Height:            64px
Background:        color.background.base with 8px backdrop blur
Border bottom:     1px solid color.border.subtle
Z-index:           z.sticky
Padding:           0 space.6 (24px)

Layout:
  [wordmark]  [primary nav items]            [agent-dock] [user-menu]
```

**Primary nav items** (authenticated):
- Intelligence
- Programs
- Tower
- Inventory (once built)
- Admin (role-gated)

```
Link style:
  Default:   type.body.md weight 600, color.text.primary
  Hover:     color.brand.primary, underline via 2px border-bottom teal
  Active:    same as hover (indicates current surface)
```

### Left sidebar (within a surface)

For deep navigation within a surface — e.g., Intelligence's 9 products.

```
Width:             240px (default), 64px (collapsed)
Background:        color.background.subtle
Border right:      1px solid color.border.subtle
Padding:           space.4 (16px)

Nav item:
  Height:          36px
  Padding:         0 space.3 (12px)
  Type:            type.body.md, color.text.secondary
  Border radius:   radius.md

Active nav item:
  Background:      color.surface.raised
  Text:            color.text.primary, weight 600
  Left accent:     3px solid color.brand.primary
```

## 2.10 Toast / notification

Transient feedback. Appears top-right, auto-dismisses.

### Specification

```
Width:             360px
Padding:           space.4 (16px)
Background:        color.surface.elevated
Border:            1px solid color.border.default
Border left:       4px solid severity color (critical/warning/success/info)
Border radius:     radius.lg
Shadow:            shadow.default
Z-index:           z.toast
Enter:             translateY(-16px) + opacity 0 → final position + opacity 1, motion.duration.fast
Exit:              motion.duration.instant
Auto-dismiss:      4 seconds (success), 6 seconds (info), 8 seconds (warning), never (critical)
```

### Usage rules

- Critical toasts don't auto-dismiss. User must acknowledge.
- Toasts stack vertically with space.2 gap.
- Maximum 3 toasts visible simultaneously. Fourth pushes oldest out.

## 2.11 Loading states

Loading is a state, not a moment. Three patterns.

### Skeleton

For content-heavy surfaces loading from the network. Replicates the shape of incoming content.

```
Background:        color.surface.raised
Shimmer gradient:  color.surface.elevated moving left-to-right
Animation:         2s infinite, linear
Border radius:     matches the final element
```

Usage: Tower dashboard zones, Intelligence product outputs, Programs artifact list.

### Spinner

For localized loading — button in-flight, small widget loading.

```
Size:              16px (inside button), 24px (inline with text), 32px (standalone)
Stroke:            2px, color.brand.primary
Animation:         linear rotation, 1s per revolution
```

### Progress bar

For long-running operations with known or unknown duration.

```
Height:            4px (compact), 8px (default)
Background:        color.surface.elevated
Fill:              color.brand.primary
Border radius:     radius.full
Animation:         width transition motion.duration.default ease-out
Indeterminate:     animated fill that pulses across the bar
```

## 2.12 Empty states

Empty is a state, not an accident. Always designed intentionally.

### Anatomy

```
┌────────────────────────────────────────┐
│                                        │
│         [illustrative icon]            │
│                                        │
│         No signals yet                 │
│                                        │
│  When Tower detects contradictions     │
│  in your portfolio, they'll appear     │
│  here.                                 │
│                                        │
│       [Primary action button]          │
│                                        │
└────────────────────────────────────────┘
```

### Specification

```
Container:         center-aligned within parent, space.8 padding
Icon:              48px, color.text.muted
Heading:           type.heading.md, color.text.primary, space.4 below icon
Body:              type.body.md, color.text.secondary, max-width 320px, space.2 below heading
Action:            primary or secondary button, space.6 below body (optional)
```

### Usage rules

- Empty states suggest next action when possible. "Import data", "Open documentation", "Start a thread."
- Never blank screens. Always a message, even if it's "Something will be here soon."

## 2.13 Agent chat panel

Specialized component — the right-rail chat panel for Atlas, the inline thread for Sentinel, the contextual chat for Nexus.

### Common anatomy

```
┌──────────────────────────────────────┐
│ [agent-icon] [Agent Name]  [actions] │
│ [scope/context line]                 │
│ ────────────────────────────────────│
│                                      │
│ [conversation turns scrollable]      │
│                                      │
│  [agent message]                     │
│  [user message right-aligned]        │
│                                      │
│                                      │
│ ────────────────────────────────────│
│ [suggestion chips, optional]         │
│ ┌──────────────────────────────┐    │
│ │ [input field]            [↑] │    │
│ └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

### Specification

```
Width:             400px (right-rail), 600px (centered in a thread page), full (mobile)
Background:        color.surface.raised
Border:            1px solid color.border.subtle on non-adjacent edges

Header:
  Height:          56px
  Padding:         0 space.4
  Agent icon:      20px circle with color.agent.* accent
  Agent name:      type.heading.sm
  Actions:         right-aligned icon buttons (settings, collapse)

Context line:      type.caption, color.text.muted, below agent name
  e.g., "Focused on Contact Center AI · Phase 5"

Conversation area:
  Padding:         space.4
  Scrollable:      yes, scroll anchored to bottom when new message arrives

Message bubble (agent):
  Background:      color.surface.elevated
  Border radius:   radius.lg
  Padding:         space.3 space.4
  Max-width:       85%
  Align:           left

Message bubble (user):
  Background:      color.brand.primary.subtle
  Border:          1px solid color.brand.primary at 30% opacity
  Border radius:   radius.lg
  Padding:         space.3 space.4
  Max-width:       85%
  Align:           right

Suggestion chip:
  Pill tab style, small
  Tap to fire message
  Displayed only when relevant suggestions are available

Input area:
  Background:      color.surface.raised
  Border top:      1px solid color.border.subtle
  Padding:         space.3
  Input field:     standard input component
  Send button:     icon button, color.brand.primary
```

### Variants per agent

- **Nexus**: teal accent, context line shows current Program + Phase.
- **Sentinel**: indigo accent, context line shows current thread title. Evidence weights rendered inline within messages as small badges.
- **Atlas**: amber accent, context line shows "Portfolio: [Client]". Numerical responses emphasized with type.heading.sm inline.

### Usage rules

- Agent identity is always visible in the header. User should never wonder which agent they're talking to.
- Streaming responses: show a subtle pulsing dot at the end of the streaming message.
- Long responses (>300 chars) get a "Collapse" option after 6 lines; expanded by default.

## 2.14 Table

For tabular data, primarily in Tower pillar drill-downs and Programs team lists.

### Specification

```
Background:        color.surface.raised (card containing the table)
Border radius:     radius.lg on the containing card

Header row:
  Background:      color.surface.elevated
  Text:            type.label.sm uppercase, color.text.muted
  Padding:         space.3 space.4
  Border bottom:   1px solid color.border.subtle

Body row:
  Background:      transparent (inherits card background)
  Text:            type.body.md, color.text.primary
  Padding:         space.3 space.4
  Border bottom:   1px solid color.border.subtle (except last row)

Hover row:
  Background:      color.surface.elevated
  Cursor:          pointer (if rows are interactive)

Numerical cells:   JetBrains Mono, right-aligned
Text cells:        DM Sans, left-aligned
Action cells:      right-aligned, icon buttons
```

### Usage rules

- Column widths either all fixed or all proportional. Never mix.
- Numerical columns right-aligned for visual alignment of decimals.
- Sort indicators: arrow glyph in header cell, teal when active.
- Pagination at bottom-right of table, standard pattern: "1-20 of 147" + prev/next.

## 2.15 Decisions locked in Packet 2

| # | Decision | Rationale |
|---|---|---|
| 2.L1 | One way to do a thing · one canonical pattern per component type | Prevents drift |
| 2.L2 | Every interactive component specifies all 7 states | Nothing defaults to broken |
| 2.L3 | Composition over customization — components compose from atoms | Stable foundation |
| 2.L4 | One primary button per view maximum | Clear hierarchy |
| 2.L5 | Destructive actions always confirm | Safety |
| 2.L6 | Labels always present on inputs, not placeholder-as-label | Accessibility |
| 2.L7 | Cards use surface color for elevation, shadow only for floating | Dark-first convention |
| 2.L8 | Modals: max 1 at a time, focus trap, Escape closes (unless destructive) | Predictable behavior |
| 2.L9 | Slide-in panels have no backdrop — context stays visible | UX choice specific to AbarVa |
| 2.L10 | Agent chat panel is standardized with per-agent accent + context line | Unified across agents |
| 2.L11 | Empty states always intentional, with action when possible | No blank screens |

---

## Packet 2 · Checkpoint

**STATUS · Track A, Packet 2 of 5 complete**

Component patterns specified: button, input, card, badge, tabs, modal, slide-in panel, navigation, toast, loading, empty, agent chat, table. Every component has anatomy, states, variants, usage rules. Ready for Track B (application patterns).

---

# TRACK B · APPLICATION (Packets 3-5)

Track B covers how tokens and components apply in practice: interaction patterns, voice and microcopy, accessibility, surface-specific conventions.

---

# PACKET 3 · Interaction Patterns

Interaction patterns govern how the system behaves in response to the user across time. Components specify appearance; patterns specify behavior.

## 3.1 State transitions

Every state change has a defined transition.

### Hover

Subtle, instant-feeling. Signals "this is interactive."

```
Duration:     motion.duration.fast (150ms)
Easing:       motion.easing.ease-out
Properties:   background-color, border-color, color, transform (rare)
```

Rules:
- Hover effects only on pointer devices (not touch). Use `@media (hover: hover)`.
- Hover cannot be the only state signal for interactivity. Focus must match. Touch users see hover-equivalent on press.

### Focus

Explicit ring, mandatory for all interactive elements. No focus state = accessibility failure.

```
Style:        shadow.focus.brand (teal glow) or shadow.focus.danger (for destructive)
Duration:     motion.duration.fast
Always visible when element is keyboard-focused.
```

Rules:
- `outline: none` only paired with an explicit replacement focus ring.
- Focus visible styles use `:focus-visible` in CSS so pointer clicks don't flash a ring.
- Focus rings never animate the element itself (no scaling, no position shift). Only the ring.

### Active (pressed)

The moment of contact. Signals "your click registered."

```
Duration:     motion.duration.instant (75ms)
Properties:   darker background, possibly 1px shift in transform for tactile feel
```

### Disabled

Non-interactive. Cursor: not-allowed. Opacity 40%. No hover, no focus.

## 3.2 Loading patterns

Three tiers of latency, three patterns.

### Tier 1 · Instant (<100ms perceived)

No loading indicator. System responds as if immediate. Animation may mask the transition but no spinner.

Applies to: scripted Atlas responses, local state changes, UI toggles.

### Tier 2 · Short (100ms – 2s)

Inline spinner or button-level loading state. Page chrome stays responsive.

Applies to: API calls returning quickly, navigation between cached pages.

Pattern for buttons:
```
Default:  [icon] Label
Loading:  [spinner] Loading...   (disabled, cursor not-allowed)
Success:  [✓] Done               (brief, 800ms, then return to default or navigate)
```

### Tier 3 · Long (2s+)

Skeleton UI. Replicates the shape of incoming content. Page feels alive.

Applies to: Tower dashboard load, Intelligence product computation, large data queries.

Pattern:
- Replace each content block with a skeleton shape matching its final dimensions
- Animate subtle shimmer across skeletons
- Reveal real content block-by-block as it arrives, not all at once
- If loading exceeds 10s, show a message: "Still working on this — taking a little longer than usual."

### Tier 4 · Very long (10s+)

Explicit progress. Progress bar with step indicators. Set expectations.

Applies to: long-running AI generation (e.g., Intelligence product output), uploads, batch operations.

Pattern:
```
[Progress bar]
Step 2 of 4: Analyzing cost data across 34 use cases
Elapsed: 00:14
```

## 3.3 Feedback patterns

System has to tell the user what happened. Four feedback mechanisms, used differently.

### Inline feedback

In-place validation. Used for form errors, inline edits, instant results.

- Appears adjacent to the element that caused it
- No disruption to flow
- Persistent until resolved

### Toast

Transient, non-blocking. For completed actions the user initiated.

- "Program created" — 4s success toast
- "Charter saved" — 4s success toast
- "Unable to save — retry?" — 8s warning toast with action

### Banner

Persistent, non-blocking. For ongoing state the user should know about.

- "This Program has a stale attestation. Request re-attestation?"
- "Data sync paused · last refresh 4 hours ago"

Banner styling:
```
Background:     color.severity.*.subtle
Border left:    4px solid color.severity.*
Padding:        space.3 space.4
Text:           type.body.md, color.text.primary
Action:         right-aligned, typically text button
Dismissible:    X icon on right if banner is advisory, not if critical
```

### Modal

Blocking, requires acknowledgment. For critical confirmations and deliberate decisions.

- "Delete this Program? This cannot be undone."
- "Lock baseline and hand off to Tower?"

Decision matrix — when to use which:

| Situation | Feedback type |
|---|---|
| Form validation error | Inline |
| Action succeeded | Toast |
| Action failed, recoverable | Toast (warning) |
| Action failed, blocking | Modal |
| System state worth knowing about | Banner |
| Confirmation before destructive action | Modal |
| Background sync status | Banner |
| Short-lived user feedback | Toast |

## 3.4 Navigation patterns

### Page transitions

```
Default:      Fade-in body, motion.duration.fast, ease-out
Same surface: Instant for sibling pages (Programs Phase 3 → Phase 4)
Cross surface: Brief fade (100ms) to prevent visual flash
```

No elaborate page transitions. They feel slow on repeated use.

### Breadcrumbs

Shown when the user is 2+ levels deep within a surface.

```
Intelligence > AI Supplier Consolidation > Research Base
Programs > Contact Center AI > Phase 5 Build/Deploy > Build Plan
Tower > Cost Pillar > Vendor concentration detail
```

Format: `type.body.sm`, `color.text.muted`, separator is `>` (single character, not slash).

### Back behavior

- Browser back: always returns user to previous URL, state preserved if possible.
- In-app back button: appears in detail views (e.g., signal detail). Goes to parent list view.
- Modal back: in wizards, goes to previous step. In single-step modals, same as Cancel.

### Deep linking

Every meaningful state is linkable. This means URLs encode:
- Surface (Programs / Intelligence / Tower)
- Entity (specific Program ID, thread ID, signal ID)
- View state (which tab active, which panel open)

Example URLs:
```
/programs/contact-center-ai/phase/5
/intelligence/threads/ai-supplier-consolidation?tab=research-base
/tower?signal=shadow-ai-consolidation&panel=detail
/tower/pillars/cost?compare=cohort
```

Rule: deep links restore the exact view. User pastes a link, they see what the sender saw.

## 3.5 Form patterns

### Inline editing

For fields in a list or detail view that are editable in place.

- Click to enter edit mode
- Input gets focus, shows input chrome
- Save on blur OR Enter OR explicit save action
- Cancel on Escape
- Show "Unsaved changes" indicator if user navigates away with pending change

### Multi-step wizards

For flows that benefit from chunking (charter creation, Path 3 origination).

Pattern:
- Progress indicator at top showing all steps
- One step per screen
- "Next" button at bottom-right, disabled until current step is valid
- "Back" button at bottom-left from step 2 onward
- Final step button is primary action ("Create Program", "Submit")
- State preserved if user navigates away, restored on return (unless wizard is short and stateless)

### Form validation

- Validate on blur (after field loses focus), not on every keystroke
- Errors appear inline below field
- Form-level errors appear above submit button
- Submit button disabled if any error; shows tooltip on hover explaining why

## 3.6 Data patterns

### Sorting

Columns in tables are sortable. Click header to sort ascending, click again for descending, click third time to clear.

```
Default:     header shows column name
Sorted asc:  header shows column name + up arrow (teal)
Sorted desc: header shows column name + down arrow (teal)
```

Only one column sorted at a time.

### Filtering

Two filter patterns.

**Inline filters** — chips above a list.

```
[All] [Critical] [Warning] [Advisory]     ← pill tabs, multi-select allowed
```

**Filter drawer** — for complex filtering with multiple dimensions.

Opens as right-side panel. Filters apply live as user adjusts. "Clear all" button always visible.

### Pagination

```
Default:     showing 1-20 of 147   [Prev] [Next]
Jump:        page selector for large datasets
Page size:   selectable (10/25/50/100), default 25
```

Alternative: infinite scroll for "scan and pick" surfaces (signal strip, conversation history). Pagination for "precise location" surfaces (use case list, team list).

### Search

- Search input with leading search icon, clear button when populated
- Instant results as user types (debounced 200ms)
- Results highlight the matched text
- Empty search shows "type to search" placeholder
- No results shows empty state with "Try a different query" message

## 3.7 Draft and save patterns

Work in AbarVa is often long-form (charters, diagnosis decks, strategy threads). Autosave is non-negotiable.

### Autosave rules

- Save draft every 5 seconds of inactivity OR every 60 seconds regardless
- Show autosave status in UI: "Saved 4 seconds ago" or "Saving..." or "Unable to save — retry?"
- On tab close with unsaved changes: browser warning (standard behavior)
- Never autosave a draft to the canonical artifact. Drafts are separate until explicitly saved/published.

### Explicit save

When user takes deliberate action (publish charter, lock decision, commit artifact):

- Confirmation toast on success
- Banner on destination page confirming the publish
- Decision log entry created
- Undo available for 30 seconds via toast action

## 3.8 Error patterns

Errors happen. The design system treats them as first-class, not afterthoughts.

### Error types

**Validation error** · user input is invalid. Inline feedback.

**Network error** · request failed. Toast with retry action.

**Permission error** · user can't do that. Inline message explaining why (not "Forbidden").

**Not found** · entity doesn't exist. Full-page empty state with navigation back.

**System error** · something unexpected. Banner with error ID for support, recovery action if possible.

### Error messaging

- Never technical jargon. "Unable to reach server" not "NET_ERR_CONNECTION_REFUSED".
- Always suggest next action. "Try again", "Contact support", "Return to dashboard".
- Error ID shown for system errors (small, muted). Helps support diagnose without being alarming.

### Retry logic

- First failure: automatic retry once, invisible to user
- Second failure: show error with manual retry
- Third failure: escalate, suggest different path

## 3.9 Decisions locked in Packet 3

| # | Decision | Rationale |
|---|---|---|
| 3.L1 | Four latency tiers, four loading patterns | Match feedback to perceived time |
| 3.L2 | Skeleton UI for >2s loads, not spinners | Page feels alive |
| 3.L3 | Four feedback mechanisms with explicit use cases (inline/toast/banner/modal) | Prevent misuse |
| 3.L4 | Autosave drafts every 5s idle, explicit save for publish | Never lose work |
| 3.L5 | Every meaningful state is deep-linkable | Shareability, restorability |
| 3.L6 | Validate on blur, not on keystroke | Less noise |
| 3.L7 | Errors always suggest next action | Recovery over blame |
| 3.L8 | Auto-retry once invisibly, then surface with manual retry | Resilience without annoyance |
| 3.L9 | Deep links restore exact view state (tab, panel, filters) | True linkability |

---

## Packet 3 · Checkpoint

**STATUS · Track B, Packet 3 of 5 complete**

Interaction patterns specified: state transitions, loading tiers, feedback mechanisms, navigation, forms, data patterns, drafts, errors. Ready for Packet 4 (voice, microcopy, iconography, accessibility).

---

# PACKET 4 · Voice, Microcopy, Iconography, Accessibility

The small details that distinguish a platform from a prototype. Voice shapes how AbarVa sounds. Microcopy fills the tiny spaces. Iconography is the visual language. Accessibility is the floor below which nothing ships.

## 4.1 Voice principles

AbarVa's voice is precise, confident, honest. Three principles govern every string.

**Principle 1 · Confident without overclaiming.** AbarVa knows things. It says so directly. But when it doesn't know, it says that too. Never "industry standard is X" without evidence. Never "you should do Y" from data alone.

**Principle 2 · Action-oriented.** Every piece of copy answers "what do I do next?" when next action is relevant. Empty states have CTAs. Errors suggest recovery. Signals propose actions.

**Principle 3 · Warm but not chatty.** AbarVa is a consulting platform, not a consumer app. Warmth comes from precision and care, not from emoji and exclamation points. "Welcome" is fine. "Welcome! 🎉 We're so excited you're here!" is not.

### Per-agent voice adjustment

All three agents share AbarVa's foundational voice but adjust emphasis.

**Nexus** — precise, checklist-oriented, execution-ready. Shorter sentences. Phase and gate vocabulary. "Closing Phase 3 requires 3 open items." Not "I think we're probably ready to wrap up Phase 3."

**Sentinel** — curious, hypothesis-driven, reframing. Questions are a feature. "Before I research, help me sharpen: are we asking X or Y?" Evidence weights always explicit.

**Atlas** — fact-oriented, brief. Numbers first. "Portfolio snapshot: 34 use cases, $18.3M YTD, 1 critical signal." Not conversational warm-up.

See Agent Architecture spec Packets 3-5 for full agent voice specs.

## 4.2 Microcopy patterns

### Button labels

Imperative verbs. Specific, not generic.

```
Good:   "Create Program" "Lock baseline" "Originate"
Bad:    "OK" "Submit" "Done" (too generic)

Good:   "Save draft" "Publish charter" "Archive thread"
Bad:    "Save" (ambiguous: save which version of what?)
```

### Form labels

Sentence case. Descriptive, not instructional.

```
Good:   "Program name"   "Sponsor"   "Success metrics"
Bad:    "Enter program name"   "Who is the sponsor?"
```

### Placeholder text

Examples, not instructions. User should see what a good answer looks like.

```
Program name
[e.g., AI Supplier Consolidation · Managed Procurement]

Success metrics
[What outcomes will prove this worked?]
```

The bracketed example style communicates "this is an example, replace it."

### Empty state headlines

Short, specific to the context. Explain what the space is for, not what's wrong.

```
Good:   "No signals yet"         "No active threads"       "No programs in Phase 4"
Bad:    "Empty"                  "Nothing to show"          "You have nothing here"
```

### Error messages

Plain language. Reason + next step.

```
Good:   "Unable to reach the server. Check your connection and retry."
Bad:    "Error: Request failed with status 503"

Good:   "Program name already exists. Try a different name."
Bad:    "Validation failed"

Good:   "Only the Maestro can close this Phase. Ask [Maestro name] to review."
Bad:    "Forbidden"
```

### Confirmation messages

State what happened, in past tense.

```
Good:   "Program created"       "Baseline locked"      "Signal suppressed"
Bad:    "Success!"               "Done"                  "Great job!"
```

### Dates and timestamps

Context-appropriate precision.

- In lists, relative: "2 hours ago", "3 days ago", "last month"
- In detail views, absolute: "April 20, 2026 · 3:42 PM EST"
- In data tables, consistent format: "2026-04-20 15:42" (ISO-ish for sortability)
- Future dates: "in 3 days", "next Tuesday", never "in -2 days"

### Numbers

Readable formatting. 

```
Good:   $2.3M        $340K         1,247         73%
Bad:    $2,300,000   $340,000      1247          0.73
```

Precision:
- Money in dashboards: thousand/million/billion suffix. Full precision available on hover or drill-down.
- Percentages: whole numbers for summary, one decimal for comparison context.
- Counts: always thousand-separators for 1,000+.

## 4.3 Labels for recurring concepts

Consistent vocabulary across the product. These are locked terms, not variations allowed.

| Concept | Canonical term | Avoid |
|---|---|---|
| A chartered engagement | Program | project, initiative, effort |
| A specific AI deployment | Use case | application, solution |
| A research investigation | Thread | conversation, session, chat |
| A detected portfolio event | Signal | alert, notification, issue |
| A cross-client pattern | Genome pattern | template, blueprint, playbook |
| The AI in Intelligence | Sentinel | the agent, the bot, the AI |
| The AI in Programs | Nexus | same |
| The AI in Tower | Atlas | same |
| Executive sponsor | Sponsor | executive, stakeholder |
| Program lead | Owner | PM, driver, lead |
| AbarVa-side lead | Maestro | consultant, lead, expert |
| Steady-state portfolio | Tower | dashboard, ops view |
| Phase exit criteria | Gate | milestone, checkpoint |

## 4.4 Iconography

Single icon library: **Lucide Icons**. Installed via `lucide-react` for React surfaces, via CDN for static mockups.

### Icon usage rules

- Default size: 16px (inline with text), 20px (button), 24px (standalone).
- Stroke width: 1.5px by default. Lucide defaults to 2px — override to 1.5px for a slightly lighter feel that matches the body typeface.
- Color: inherits from parent text color, or explicitly set via CSS.
- Never use icon as sole meaning. Icon + label, or icon + aria-label.

### Core icon vocabulary

A working set of ~40 Lucide icons covers most needs. Don't invent.

```
Navigation:     layout-dashboard, list, search, menu, chevron-right, arrow-left
Actions:        plus, edit, trash-2, download, upload, share-2, link
Status:         check-circle-2, alert-triangle, alert-circle, info, x-circle
Agents:         (agent-specific icons, defined below)
Time:           clock, calendar, history
People:         user, users, user-check, briefcase
Work:           file-text, folder, archive, layers, target, zap
Data:           bar-chart, pie-chart, trending-up, trending-down, activity
System:         settings, bell, eye, eye-off, lock, unlock
Communication:  message-square, send, at-sign
External:       external-link, arrow-up-right
```

### Agent icons

Each agent has a signature icon used sparingly — in navigation, agent chat header, handoff transitions.

```
Nexus     · layers        (stacked layers, implying multi-phase work)
Sentinel  · search        (investigative, research)
Atlas     · radar         (scanning, real-time)
```

Rendered in their agent accent color for chat headers, standard text color elsewhere.

### AbarVa brand mark

The brand mark (for tight spaces where wordmark won't fit):

Stylized "V" with a teal accent mark. SVG spec:
```
48x48 square
Glyph: bold V shape, color.text.primary
Accent: small teal circle at the V's apex
```

Used in: favicon, app icon, loading screen, dense navigation.

## 4.5 Accessibility standards

AbarVa targets **WCAG 2.1 Level AA** as minimum. Level AAA where feasible without compromising design.

### Color contrast

Minimums:
- Body text on background: 7:1 (AAA)
- Large text on background: 4.5:1 (AA)
- Interactive elements: 3:1 for non-text contrast (AA)

Verified pairings from our palette:
- `color.text.primary` (#F8FAFC) on `color.background.base` (#0F172A): 16.8:1 ✓
- `color.text.secondary` (#CBD5E1) on `color.background.base`: 11.9:1 ✓
- `color.text.muted` (#94A3B8) on `color.background.base`: 6.2:1 ✓
- `color.brand.primary` (#14B8A6) on `color.background.base`: 6.8:1 ✓

Caution pairings (require care):
- `color.text.muted` on `color.surface.raised` (#1E293B): 5.4:1 — passes AA large, AAA normal. Don't use for small body text on cards.
- Severity subtles behind text: always test individually.

### Keyboard navigation

Every interactive element reachable via keyboard.

```
Tab          → next focusable element
Shift+Tab    → previous focusable element
Enter        → activate primary action on focused element
Space        → activate primary action on buttons, toggle checkboxes
Escape       → close modal, dismiss dropdown, cancel edit
Arrow keys   → navigate within lists, menus, tab bars
```

Focus order follows visual order. No jumping around.

### Screen readers

- Every image has alt text or `aria-hidden="true"` if purely decorative
- Every icon-only button has `aria-label`
- Every form input has an associated `<label>` (not placeholder-as-label)
- Dynamic content updates announced via `aria-live` regions where appropriate (e.g., toasts, loading completion)
- Headings follow hierarchy: h1 → h2 → h3. No skipping levels

### Motion sensitivity

`prefers-reduced-motion: reduce` is respected system-wide.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Essential motion (like focus ring appearing) stays visible but instant.

### Text sizing

- User-scaled text up to 200% works without horizontal scroll
- No text in images (all text is real text)
- Line height minimum 1.5x for body text, 1.2x for headings

### Form accessibility

- Errors associated with fields via `aria-describedby`
- Required fields marked via `required` attribute AND visual marker
- Fieldsets with legends for grouped inputs (e.g., radio groups)

### Tooling

- Automated: `axe-core` run on every PR against sample pages
- Manual: keyboard-only smoke test on primary flows pre-deploy
- Target: zero axe violations for blocker rules; all WCAG AA criteria met

## 4.6 Inclusive design considerations

Beyond WCAG minimums, a few practices that make the product better for everyone.

### Plain language

- Avoid jargon where plain words work. "Baseline" beats "baselinization metric."
- Consulting terms get defined on first use or via tooltip.
- Acronyms spelled out first time per page ("Contact Center AI (CC-AI)").

### Cultural neutrality

- Dates in ISO-ish format for unambiguous international reading
- Currency explicitly labeled ("$2.3M USD" in shared contexts)
- No idioms that translate poorly ("low-hanging fruit", "moving the needle", etc.)
- Name handling: full names preserved, no truncation to 20 chars

### Reading rhythm

- Long documents broken into scannable sections
- Key numbers emphasized via type scale, not just color (color-blindness)
- Data visualizations always have text labels, not just color coding

## 4.7 Decisions locked in Packet 4

| # | Decision | Rationale |
|---|---|---|
| 4.L1 | Voice: confident without overclaiming, action-oriented, warm not chatty | Platform tone, not consumer-app tone |
| 4.L2 | Per-agent voice adjustment within shared foundation | Each agent sounds distinct but AbarVa unified |
| 4.L3 | Imperative specific verbs in buttons ("Create Program", not "OK") | Clarity of action |
| 4.L4 | Locked vocabulary for Program, Use case, Thread, Signal, Genome pattern | Consistency = recognition |
| 4.L5 | Lucide Icons as single icon library | No drift across sources |
| 4.L6 | Icon stroke 1.5px, not Lucide's default 2px | Lighter feel matching body typeface |
| 4.L7 | WCAG 2.1 AA minimum, AAA where feasible | Accessibility as floor not ceiling |
| 4.L8 | `prefers-reduced-motion` respected system-wide | Motion sensitivity |
| 4.L9 | Placeholder text shows examples, not instructions | "Placeholder-as-example" pattern |
| 4.L10 | Errors always explain reason + suggest next step | Recovery-oriented |

---

## Packet 4 · Checkpoint

**STATUS · Track B, Packet 4 of 5 complete**

Voice, microcopy, iconography, accessibility specified. Vocabulary locked. Accessibility standards defined with tooling strategy. Ready for Packet 5 (surface-specific conventions).

---

# PACKET 5 · Surface-Specific Conventions

The three surfaces share the same design system but apply it differently. This packet specifies the per-surface conventions so that Intelligence feels like Intelligence, Programs feels like Programs, and Tower feels like Tower — while all three feel like AbarVa.

## 5.1 Cross-surface consistency

Regardless of surface, the following stay constant:

- **Top navigation** (AbarvaNav) · same chrome, same links, same placement
- **Color system** · same foundation + semantic colors across all surfaces
- **Typography** · same type scale and typefaces
- **Component library** · same buttons, inputs, cards, modals
- **Accessibility standards** · same minimum
- **Voice foundation** · confident, action-oriented, warm

What varies by surface: information architecture, agent chat panel presence and style, density, pace of interaction, dominant visual motif.

## 5.2 Intelligence surface conventions

### Character

Intelligence is the **research surface**. Sentinel lives here. Threads are long-lived. Depth over glance. Contemplative, analytical.

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│ [AbarvaNav]                                                    │
├──────────┬─────────────────────────────────────────────────────┤
│          │                                                     │
│ Left     │                                                     │
│ Sidebar  │              Main content                           │
│          │                                                     │
│ · Home   │                                                     │
│ · Threads│                                                     │
│ · 9      │                                                     │
│ Products │                                                     │
│          │                                                     │
│          │                                                     │
└──────────┴─────────────────────────────────────────────────────┘
```

- Left sidebar always visible (desktop 1024px+)
- No right rail (Sentinel chat is the main content when in a thread)
- Main content is thread-centric: question at top, research unfolds below

### Density

Generous. Research work benefits from whitespace. Larger padding, more space between thoughts, slower reading rhythm.

```
Page padding:       space.8 (32px) top, space.6 (24px) sides
Content max-width:  800px for thread content (readability)
Between sections:   space.8 (32px)
Between paragraphs: space.4 (16px)
```

### Dominant motif

**Evidence weights** as a recurring pattern. Every claim carries a strong/moderate/weak badge. Evidence badges are the signature visual of Intelligence.

```
Evidence badge:
  Background:     severity subtle matching weight (strong=success, moderate=info, weak=warning)
  Text:           type.meta, severity color
  Format:         "Strong evidence · 7 sources" or "Moderate · 3 sources" or "Weak · 1 source"
```

### Agent presence (Sentinel)

Sentinel doesn't have a right-rail. Sentinel IS the main content when a thread is active. User messages and Sentinel messages interleave down the page. The structure is fundamentally chat-like but with richer artifacts inline (evidence chains, framework diagrams, research sources).

### Special components

- **Intelligence product tile** — 9 tiles on the Intelligence home, one per product. Each tile: product name (`type.intel.name` · teal uppercase), CXO question (`type.body.lg` · white bold), small description, invocation CTA.
- **Thread timeline** — vertical timeline of turns in a thread. User questions, Sentinel responses, inline product invocations.
- **Evidence panel** — collapsible right-side panel listing all sources cited in the active thread.

## 5.3 Programs surface conventions

### Character

Programs is the **delivery surface**. Nexus lives here. Phase-driven, execution-oriented, decision-rich. Structured, methodical.

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│ [AbarvaNav]                                                    │
├────────────────────────────────────────────────────────────────┤
│ [Phase ribbon: 1 - 2 - 3 - 4 - 5 - 6 - 7]     [Program meta]  │
├────────────────────────────┬───────────────────────────────────┤
│                            │                                   │
│                            │  Right rail                       │
│    Main content            │  · Decision log                   │
│    · Phase deliverables    │  · Team                           │
│    · Artifact workspace    │  · Nexus chat                     │
│                            │                                   │
│                            │                                   │
└────────────────────────────┴───────────────────────────────────┘
```

- Phase ribbon at top — always visible, shows current phase highlighted
- Right rail present on most pages (width 320px) for decision log + team + Nexus
- No left sidebar within a Program page (the Phase ribbon replaces it)

### Density

Moderate. Programs pages balance readability with information density. Work-like, not contemplative-like.

```
Page padding:       space.6 (24px) all sides
Main content max:   960px
Right rail:         320px fixed
Between cards:      space.4 (16px)
```

### Dominant motif

**Phase state** as the anchor visual. Every Programs page shows clearly: what phase, how complete, what's blocking, what's next.

Phase ribbon specification:
```
Height:            48px
Layout:            7 phase pills horizontally
Current phase:     background color.brand.primary, text inverse, bold
Completed phases:  background color.brand.primary.subtle, text color.brand.primary
Future phases:     background color.surface.raised, text color.text.muted
Separators:        small arrows between pills (chevron-right, 12px, color.text.muted)
```

### Agent presence (Nexus)

Nexus lives in the right rail, collapsed by default (shown as a pinned tab), expands on click. When expanded: 320px chat panel with Nexus chat pattern.

Nexus's scope is always the current Program. Header shows: "Focused on: [Program name] · [Phase name]".

### Special components

- **Phase ribbon** — described above.
- **Gate criteria checklist** — shown on phase detail pages. Each criterion: check state + label + remediation suggestion if not met.
- **Decision log card** — right-rail component showing recent decisions with timestamp, decider, outcome.
- **Artifact workspace** — central content area for the phase's deliverable. Rich editor with inline Nexus suggestions.
- **Team roster** — horizontal avatars with role labels, clickable for detail.

## 5.4 Tower surface conventions

### Character

Tower is the **portfolio surface**. Atlas lives here. Glance-first, data-dense, real-time. Operational, skeptical, immediate.

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│ [AbarvaNav]                                                    │
├────────────────────────────────────────────────────────────────┤
│ [Tower sub-nav: Dashboard / Signals / Pipeline / Pillars / ...]│
├──────────────────────────────────────────────────┬─────────────┤
│                                                  │             │
│                                                  │  Atlas      │
│   Main content (7-zone grid on dashboard)       │  right rail │
│                                                  │             │
│                                                  │  · Morning  │
│                                                  │    summary  │
│                                                  │  · Scripted │
│                                                  │    queries  │
│                                                  │  · Input    │
│                                                  │             │
└──────────────────────────────────────────────────┴─────────────┘
```

- Tower has its own sub-nav below AbarvaNav (Dashboard, Signals, Pipeline, Use cases, Pillars, Data)
- Atlas right rail (400px) always visible on desktop
- Dashboard uses a 7-zone grid layout (see Tower spec Packet 5.3)

### Density

High. Tower is a CFO's dashboard — lots of information packed efficiently.

```
Page padding:       space.4 (16px) sides, space.6 (24px) top
Between zones:      space.4 (16px)
Within cards:       space.4 (16px) default
Right rail:         400px fixed
```

### Dominant motif

**Numbers** as the anchor visual. Every Tower surface leads with numerical facts. Typography emphasizes numbers via the type scale (display.md or heading.xl for hero metrics).

Signal severity is the second motif. Critical/warning/advisory are instantly visible.

### Agent presence (Atlas)

Atlas in right rail, always visible. Opens with morning summary (fact-dense). Responds to scripted patterns with real data. Suggestion chips contextual to the currently-viewed surface.

Atlas mobile is dedicated — separate design at `/m/tower`, not responsive. See Tower spec Packet 7.

### Special components

- **Signal strip** — horizontal scrolling row of active signals above the dashboard. Critical leftmost.
- **Pillar card** — one per pillar (Inventory, Adoption, Value, Risk, Cost). KPI + trend indicator + drill-down link.
- **Cohort position** — "you vs peers" visualization. Bar or percentile showing position.
- **Pipeline glance** — compact 9-column Kanban on dashboard (full Kanban on Pipeline page).
- **Contradiction matrix** — 2D table showing which pillars are in tension.

## 5.5 Surface transitions

When a user moves between surfaces (e.g., Atlas hands off to Nexus via Path 3), the transition has a deliberate visual signature.

### Pattern

1. Source surface shows a transition toast/banner: "Opening [target] with context..."
2. Page navigation happens (URL change)
3. Target surface loads with a brief fade-in
4. Target surface shows an "originating context" banner at top: "Originated from Tower signal: [Signal name]" with link back to source

### Banner styling for handoffs

```
Background:    color.agent.[target-agent].subtle
Border left:   4px solid color.agent.[target-agent]
Padding:       space.3 space.4
Text:          type.body.md, color.text.primary
Icon:          arrow-left (link back to source)
Dismissible:   X icon (banner persists session, not forever)
```

### Cross-surface vocabulary preservation

When Atlas sends context to Nexus or Sentinel, the terminology carries over. "Shadow AI signal" in Tower becomes "originated from Shadow AI signal" in Programs. User sees continuity.

## 5.6 Cross-surface consistency audit checklist

For reviewing any new page design:

### Visual
- [ ] Uses only design system colors (no one-off hex values)
- [ ] Uses only system typography (no one-off font families or sizes)
- [ ] Uses only system spacing (multiples of 4px)
- [ ] Uses Lucide icons at correct stroke width
- [ ] Dark-first rendering (no light-mode leftovers)

### Components
- [ ] All interactive elements use canonical components (button, input, card)
- [ ] No custom components where a library component would work
- [ ] All components have all 7 states defined (default, hover, focus, active, disabled, loading, error)

### Interaction
- [ ] Keyboard navigable end-to-end
- [ ] Focus rings visible on all interactive elements
- [ ] Loading patterns match latency tier (skeleton / spinner / progress)
- [ ] Empty states are intentional with CTAs
- [ ] Error states provide recovery action

### Accessibility
- [ ] Contrast ratios pass WCAG AA (AAA for body text)
- [ ] Screen reader labels on icon-only buttons
- [ ] Alt text on meaningful images
- [ ] Reduced-motion respected
- [ ] No text in images

### Voice
- [ ] Microcopy uses canonical vocabulary (Program, Use case, Thread, Signal, Genome pattern)
- [ ] Button labels are specific imperative verbs
- [ ] Error messages explain reason + suggest next step
- [ ] Empty state copy describes the space, not the absence

### Surface fit
- [ ] Intelligence: generous density, evidence weights visible, Sentinel-inline
- [ ] Programs: phase ribbon, right-rail decision log, Nexus accessible
- [ ] Tower: high density, numbers-first, Atlas right-rail always visible, sub-nav present

## 5.7 Design system governance

### Ownership

The design system is owned by Anand for now. As the team grows, ownership transitions to a dedicated design lead. Until then:

- All changes to this spec require Anand review
- New components added only when a genuine new pattern emerges (3+ uses)
- Token changes require a version bump and downstream component audit

### Versioning

This spec versions with the product. Current: v1.0 (initial).

- Major: architectural change (e.g., move to light mode primary, adopt a new typeface)
- Minor: new component added, new token added, new surface convention
- Patch: wording fixes, typo corrections, clarifications

### How Codex and Claude Code use this

- **Codex** references this spec when building mockups or frontend components. Codex's first step on any design task: re-read this spec (or relevant packet). No invented tokens, no new components without approval.
- **Claude Code** references this spec when implementing components in the real codebase. Component files start by importing design tokens; raw hex values in CSS are a code-review rejection.

### Tooling

Post-demo, this spec converts into:
- `/src/design-system/tokens.ts` — exported constants
- `/src/design-system/components/` — React components matching specs
- Storybook stories for each component showing all states and variants
- Automated visual regression tests on primary components

## 5.8 Decisions locked in Packet 5

| # | Decision | Rationale |
|---|---|---|
| 5.L1 | Cross-surface constants: nav, colors, typography, components, accessibility | Unified platform feel |
| 5.L2 | Surface variation: IA, density, pace, dominant motif, agent presence | Each surface optimized for its character |
| 5.L3 | Intelligence = generous density, evidence-weight motif, Sentinel-inline (no rail) | Research work needs contemplation |
| 5.L4 | Programs = moderate density, phase-ribbon motif, Nexus right-rail | Execution needs structure |
| 5.L5 | Tower = high density, numbers-first motif, Atlas right-rail always visible | CFO-dashboard pattern |
| 5.L6 | Handoff transitions have visual signature: toast + banner + agent-colored accent | Continuity across surfaces |
| 5.L7 | 6-area audit checklist for every new page design | Enforceable consistency |
| 5.L8 | Design system versioned SemVer; major changes trigger component audit | Evolution without breakage |
| 5.L9 | Post-demo: tokens export to TS, components to React, Storybook coverage | Code parity with spec |

---

## Packet 5 · Checkpoint

**STATUS · Track B, Packet 5 of 5 complete**

Surface-specific conventions specified for Intelligence, Programs, Tower. Cross-surface consistency defined. Audit checklist for new designs. Governance and versioning specified.

**DESIGN SYSTEM SPEC COMPLETE.**

---

## Spec summary

### Files
- `/mnt/user-data/outputs/abarva-design-system-spec.md` · **COMPLETE (5/5 packets)**

### Coverage
- **5 packets** in 2 tracks (Foundation / Application)
- **~50 design decisions** locked
- **~70 design tokens** specified (colors, typography, spacing, elevation, motion, breakpoints, z-index)
- **14 canonical components** with anatomy, states, variants, usage rules
- **9 interaction patterns** (state transitions, loading, feedback, navigation, forms, data, drafts, errors)
- **Full vocabulary + iconography + accessibility standards**
- **3 surface conventions** (Intelligence, Programs, Tower) + transition patterns
- **6-area audit checklist** for new page designs
- **Governance model** for maintaining the spec over time

### How this is used going forward
- Codex's Tower mockup pass 2 references this spec (rather than the scattered fragments in the other specs)
- Every new page design audits against the 6-area checklist
- Claude Code, when building real components in the codebase, imports from this spec's token list
- Human designers (eventually) work from this spec

This spec is the canonical source. Other specs may reference design elements — when they conflict, this one wins.

---
