# SRC26 - Source Commercial Hub

Slice ID: SRC26
Slice name: Source Commercial Hub
Status: code_complete
Authored: 2026-04-26
Wave: Wave 15 (Source Commercial UI + Architecture Page)
Primary agent: SRC26 lane agent
Depends on: SRC19, SRC20, SRC21, SRC22, SRC23, SRC24, SRC25

## Purpose

SRC26 lands the top-level 7-tab commercial intelligence hub container for the
Source module. It provides a cohesive tab-navigation shell that organises all
commercial intelligence panels (Summary, Pricing, BAFO, Risks, Readiness,
Missions, Signals) under a single AbarVa-compliant surface.

## What Changed

- `src/lib/source/source-commercial-hub-view.ts` — pure TypeScript view model
  exporting `CommercialHubTab`, `SourceCommercialHubViewModel`,
  `COMMERCIAL_HUB_TABS` (7 tabs), and `buildCommercialHubViewModel`.
- `src/components/source/SourceCommercialHub.tsx` — `'use client'` React
  component with prop-slot composition pattern. Renders page header, 7-tab
  bar, and the active panel slot. Inline styles use AbarVa design tokens.
- `src/__tests__/integration/source/source-commercial-hub.test.ts` — 9
  type-shape tests (no jsdom): tab count, field shapes, uniqueness,
  builder correctness, defaultTabId, generatedAt, caveat, component export,
  and props shape verification.
- `docs/build/slices/SRC26_SOURCE_COMMERCIAL_HUB.md` — this slice doc.
- Append to `docs/build/build-slices.json`.
- wave-15 entry added to `docs/build/build-waves.json`.
- Source component notes updated in `docs/build/production-readiness.json`.

## Design

AbarVa design tokens applied via inline styles:

| Token | Value |
|---|---|
| Background | `#FAFAF9` |
| Near-black text | `#0F0E0D` |
| Body text | `#3D3B38` |
| Muted text | `#706D66` |
| Border | `#E8E6E3` |
| Accent (active tab) | `#1E3A5F` |

No teal, no cyber/dashboard aesthetic. Premium, calm, enterprise feel.

## Prop-Slot Composition Pattern

The hub receives panel components as `React.ReactNode` props
(`summarySlot`, `pricingSlot`, `bafoSlot`, `risksSlot`, `readinessSlot`,
`missionsSlot`, `signalsSlot`). This decouples SRC26 from the parallel
SRC19–SRC25 lanes. If a slot is undefined, the panel area renders a
"Panel loading..." placeholder in muted gray.

## The 7 Tabs

| tabId | Label | Description |
|---|---|---|
| `summary` | Summary | Commercial summary and vendor overview |
| `pricing` | Pricing | Normalized pricing comparison across vendors |
| `bafo` | BAFO | Best and final offer negotiation strategy |
| `risks` | Risks | Commercial risk detection and exception tracking |
| `readiness` | Readiness | Decision readiness checklist |
| `missions` | Missions | Commercial intelligence mission queue |
| `signals` | Signals | Control tower signals and intelligence patterns |

## Validation

```bash
node_modules/.bin/tsc --noEmit
node_modules/.bin/jest src/__tests__/integration/source/source-commercial-hub.test.ts --no-coverage
```

Both pass: 0 TypeScript errors, 9 tests green.

## What This Slice Does NOT Do

- Does not import SRC19–SRC25 components directly.
- Does not call any model provider or make network requests.
- Does not write to any database.
- Does not modify auth, migrations, or runtime configuration.
- Does not use third-party UI libraries.
