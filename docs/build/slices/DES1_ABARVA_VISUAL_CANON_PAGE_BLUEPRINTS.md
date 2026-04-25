# DES1 · AbarVa Visual Canon and Page Blueprints

Slice ID: DES1
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Type: Specification / contract document only.

This slice captures the approved AbarVa visual canon and four
page-level blueprints. Future Codex / Claude implementation slices
must read these documents before writing UI.

## What changed

- [docs/design/ABARVA_VISUAL_CANON.md](../../design/ABARVA_VISUAL_CANON.md)
  — brand direction, wordmark rules ("Abar" near-black bold + "Va"
  navy slightly larger, no gap), small secondary symbol motif,
  off-white surface palette with NAVY as the primary brand accent
  (no green-heavy, no purple-heavy), typography (DM Sans + JetBrains
  Mono only), light vs dark usage (dark reserved for high-impact
  brief / storytelling moments only), thin top nav, agent visual
  treatment, no-clutter rules, card / table / drawer style,
  progressive disclosure.
- [docs/design/pages/PROGRAMS_PAGE_BLUEPRINT.md](../../design/pages/PROGRAMS_PAGE_BLUEPRINT.md)
  — portfolio table-card hybrid, 6-phase journey rail with G1–G4 gate
  caps, phase / workshop center canvas, Nexus mastermind rail,
  Steward gate role, deliverables / artifacts by phase via PDEL,
  hide / show rules, 10 acceptance criteria.
- [docs/design/pages/INTELLIGENCE_PAGE_BLUEPRINT.md](../../design/pages/INTELLIGENCE_PAGE_BLUEPRINT.md)
  — Sentinel Brief hero (light card, AMBER accent), active patterns
  strip, four-mode Dynamic Insight Canvas (Summary / Evidence /
  Programs / Actions, mutually exclusive, mode switches do not
  navigate), Sentinel interaction rail (drawer not chat), internal
  vs external dataset basis, same-canvas interaction model, 10
  acceptance criteria.
- [docs/design/pages/AI_CONTROL_TOWER_PAGE_BLUEPRINT.md](../../design/pages/AI_CONTROL_TOWER_PAGE_BLUEPRINT.md)
  — Atlas Brief hero on `INK_DARK` / `NAVY_DARK` (the storytelling
  dark moment), 5-scorecard limit on light cards, 3-pressure-card
  limit, 1-active-lens, Ask Atlas drawer (not chat), seven canonical
  AI Control Tower dimensions, no-dashboard-clutter rules, 10
  acceptance criteria.
- [docs/design/pages/ADMIN_SETUP_PAGE_BLUEPRINT.md](../../design/pages/ADMIN_SETUP_PAGE_BLUEPRINT.md)
  — Steward Brief (light, MUTED accent), Apple-like five-zone
  control plane, dataset domain readiness, loaded / available /
  usable evidence model, users / access / governance / connectors
  portals, Agent Readiness Matrix, ADM4 dataset explorer wiring, 15
  acceptance criteria.
- [docs/design/components/ABARVA_COMPONENT_RECIPES.md](../../design/components/ABARVA_COMPONENT_RECIPES.md)
  — recipes for AbarVaWordmark, AbarVaTopNav, AgentBadge,
  AgentBriefPanel, MetricStrip, PressureCard, PatternCard,
  JourneyRail, FileTypeChip, EvidenceChip, DetailDrawerShell,
  EmptyInspector. Each recipe specifies purpose, props, visual
  treatment, behavior, and constraints.

## Direction shift from prior canon iterations

- Wordmark rule re-anchored: "Abar" near-black bold + "Va" navy
  slightly larger, **DM Sans** body family (sans-serif). The earlier
  Georgia-serif direction is retired.
- Primary accent shifted from teal to **NAVY** (`#1B2B5C`). All
  agent / status palettes lift onto NAVY / AMBER / RED.
- Secondary symbol motif **allowed** (small connector / data /
  intelligence motif). The earlier "wordmark-only, no symbol" rule
  is replaced by a "symbol always secondary, never required" rule.
- Dark surfaces are **allowed** for high-impact briefs and
  storytelling moments only — the Atlas Tower hero, Sentinel
  operating-model gap headline, Founder Build Progress cover, and
  the Maestro pre-workshop opening panel.

## Validation

- `npx tsc --noEmit --pretty false` — pass (no application code
  changed).
- `npm run build` — pass.

## Status

Code complete. Pending founder review.
