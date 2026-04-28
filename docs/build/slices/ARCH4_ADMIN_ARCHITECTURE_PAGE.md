# ARCH4 · Admin Architecture Overview Page

**Wave:** wave-15
**Branch:** wave15/arch4-admin-architecture-page
**Status:** complete
**Owner:** Codex

## Summary

Architecture overview page at `/platform/admin/architecture`. Surfaces the Nexus system's build history, module layers, and key metrics in a single admin view.

## Deliverables

| File | Description |
|---|---|
| `src/lib/admin/architecture-overview.ts` | Pure TypeScript data builder — deterministic, no file I/O. Exports `buildArchitectureOverview()` returning 6 system layers, 16 wave summaries, and build stats. |
| `src/components/admin/ArchitectureOverviewPage.tsx` | `'use client'` React component. Stat cards, 3-column layer grid with module tags, full wave history table with status chips and progress bars. AbarVa canon design. |
| `src/app/(maestro)/platform/admin/architecture/page.tsx` | Next.js server-component page. Metadata: `Architecture Overview \| Nexus Admin`. Renders `<ArchitectureOverviewPage />`. |
| `src/__tests__/integration/admin/architecture-overview.test.ts` | 9 type-shape tests — no jsdom, no React rendering. |

## System Layers (6)

1. **Foundation** — Auth, DB schema, routing (Wave 0–2)
2. **RFP Core** — RFP lifecycle, stages, gates, decisions (Wave 3–5)
3. **Agent Intelligence** — Multi-agent briefings, validation, missions (Wave 6–9)
4. **Commercial Intelligence** — Pricing normalization, BAFO, risk detection, signals (Wave 10–14)
5. **Commercial UI** — Surface components for commercial intelligence (Wave 15)
6. **Admin & Ops** — CI hygiene gate, architecture overview, QA verification (Wave 13–15)

## Design

- Background: `#FAFAF9`, near-black: `#0F0E0D`, accent: `#1E3A5F`
- No teal, no cyber aesthetic — premium, calm, enterprise (AbarVa canon)
- Status chips: merged=green, in_progress=amber, planned=gray

## Caveat

Static deterministic snapshot. No live manifest polling, no file I/O, no DB reads.
