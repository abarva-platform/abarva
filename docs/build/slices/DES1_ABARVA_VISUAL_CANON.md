# DES1 · AbarVa Visual Canon

Slice ID: DES1
Slice name: AbarVa Visual Canon
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Documentation-only foundation slice. Captures the single source of
truth for AbarVa visual direction at the platform level: brand
posture, wordmark/symbol rules, color palette, typography, light vs
dark surfaces, top-nav contract, agent visual treatment, icon
restraint, card/table/drawer style, progressive-disclosure rules,
and the four canonical page blueprints. Every product surface —
Programs, Intelligence, AI Control Tower, Admin Setup, Source —
derives its brand and layout discipline from this canon.

**No app code. No model calls. No migrations. No runtime changes.**
Page blueprints describe direction and acceptance criteria only;
they do not commit any current page to a refactor in this slice.

## What changed

- New canon document
  [docs/design/ABARVA_VISUAL_CANON.md](../../design/ABARVA_VISUAL_CANON.md):
  - §A · Brand direction — calm, executive, single-accent posture.
  - §B · Wordmark rule — typographic mark, "Abar" near-black + "Va"
    NAVY, 1.05–1.10× larger; three sizes (sm / md / lg).
  - §C · Symbol rule — secondary, optional, restrained motifs only.
  - §D · Color palette — surfaces (`#FBFAF7` / `#F5F3EE` / `#FFFFFF`),
    ink (`#0A0C12`), NAVY accent (`#1B2B5C`), AMBER (`#B45309`),
    RED (`#B42318`); reserved dark surfaces (`#0A0C12` / `#10193A`).
  - §E · Typography direction — DM Sans body + JetBrains Mono
    eyebrow/chips; serif body intentionally retired from v2.
  - §F · Light vs dark surfaces — light is default, dark is reserved
    for high-impact briefs (e.g. Atlas Brief hero).
  - §G · Top-nav contract — eight canonical surfaces, eyebrow scale,
    no avatar, no breadcrumb noise.
  - §H · Agent visual treatment — Nexus / Sentinel / Atlas / Steward
    accent partition (NAVY / AMBER / NAVY-on-dark / MUTED).
  - §I · Icon and symbol restraint — small, monochrome, never the
    centerpiece; no AI sparkles, no brain icons, no gradient orbs.
  - §J · Card / table / drawer style — hairline borders, calm
    spacing, single-column-of-attention rule.
  - §K · Progressive-disclosure rules — what each surface starts
    closed, what is one click away, what is two clicks away.
  - §L · No-clutter rules — explicit ban on dashboard density,
    decorative gauges, and avatar-driven UI.

- New component recipes
  [docs/design/components/ABARVA_COMPONENT_RECIPES.md](../../design/components/ABARVA_COMPONENT_RECIPES.md):
  spec for the eleven canonical primitives (top nav, agent badge,
  agent brief panel, journey rail, pattern card, pressure card,
  metric strip, evidence chip, file-type chip, detail drawer,
  empty inspector). Implemented by DES2.

- New page blueprints
  [docs/design/pages/PROGRAMS_PAGE_BLUEPRINT.md](../../design/pages/PROGRAMS_PAGE_BLUEPRINT.md),
  [docs/design/pages/INTELLIGENCE_PAGE_BLUEPRINT.md](../../design/pages/INTELLIGENCE_PAGE_BLUEPRINT.md),
  [docs/design/pages/AI_CONTROL_TOWER_PAGE_BLUEPRINT.md](../../design/pages/AI_CONTROL_TOWER_PAGE_BLUEPRINT.md),
  [docs/design/pages/ADMIN_SETUP_PAGE_BLUEPRINT.md](../../design/pages/ADMIN_SETUP_PAGE_BLUEPRINT.md):
  - Programs — portfolio table, program journey rail, phase /
    workshop center canvas, Nexus mastermind role, Steward gate
    role, deliverables/artifacts by phase, hide/show rules,
    acceptance criteria.
  - Intelligence — Sentinel Brief, active patterns strip, dynamic
    insight canvas (summary / evidence / programs / actions modes),
    Sentinel interaction rail, internal/external dataset basis,
    same-canvas interaction model, acceptance criteria.
  - AI Control Tower — Atlas Brief hero, ≤ 5 scorecards, ≤ 3
    pressure cards, one active lens, Ask Atlas drawer, the seven
    AI Control Tower dimensions, no-dashboard-clutter rule,
    acceptance criteria.
  - Admin Setup — Steward Brief, Apple-like control plane, dataset
    domain readiness, loaded / available / usable evidence,
    user/role posture, governance gap surface, acceptance criteria.

## What is canonical today

- Single accent rule — only NAVY (`#1B2B5C`); AMBER and RED are
  status partitions, not brand accents.
- Typographic wordmark — no SVG, no glyph substitution.
- Body type is DM Sans only — serif body is retired from v2.
- Dark surfaces are reserved for high-impact briefs; pages are
  light by default.
- Agent partition — Nexus → NAVY, Sentinel → AMBER, Atlas → NAVY
  on light / INK on dark, Steward → MUTED.
- Top nav surfaces order: Programs → Intelligence → AI Control
  Tower → Source → Knowledge → Admin Setup → Investor → Marketing.
- Icon/symbol restraint — banned motifs explicitly listed
  (Sanskrit characters, AI sparkles, brain icons, gradient orbs).

## What is NOT in this slice

- No app code — every primitive lives in DES2.
- No page refactor — DES3+ slices apply the blueprints to actual
  Programs / Intelligence / AI Control Tower / Admin Setup pages.
- No new color outside the palette declared here — slices that
  need a new accent must amend the canon first.
- No runtime, no model call, no migration, no auth change.

## Honest fallbacks used

- Page blueprints describe acceptance criteria only; they do not
  alter or imply changes to Programs / Intelligence / AI Control
  Tower / Admin Setup runtime in this slice.
- Component recipes describe surface and props only; binding to
  data, agents, or routing is owned by consuming slices.
- The wordmark, color palette, and typography choices are stated
  exactly so DES2's `abarva-theme.ts` can encode them as tokens
  without interpretation drift.

## Validation

- `git diff --cached --name-only` confirms only allowed files are
  staged before commit.
- DES2 sibling slice's tests assert that
  `src/lib/design/abarva-theme.ts` matches the canon (NAVY exact,
  DM Sans body, no serif, agent partition, status partition).

## Status

Code complete. Pending founder review.
