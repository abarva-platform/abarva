# SRC24 — Source Commercial Missions Panel

**Wave:** wave-15
**Type:** source-ui
**Status:** complete
**Branch:** wave15/src24-commercial-missions-panel

## Summary

Adds a display-ready missions panel for the Source module that surfaces the commercial intelligence mission queue produced by Wave-14.

## Files

| File | Purpose |
|---|---|
| `src/lib/source/source-commercial-missions-view.ts` | Pure TS view-model: `SourceMissionDisplayItem`, `SourceCommercialMissionsViewModel`, `buildCommercialMissionsViewModel()` |
| `src/components/source/SourceCommercialMissionsPanel.tsx` | `'use client'` React component. Header with high-priority badge, agent summary pills, mission list (5-item default cap), show-more toggle, caveat footer. |
| `src/__tests__/integration/source/source-commercial-missions-panel.test.ts` | 9 type-shape tests. No jsdom, no React rendering. |

## Design

Follows AbarVa canon: `#FAFAF9` background, `#0F0E0D` headings, `#3D3B38` body, `#706D66` muted, `#E8E6E3` borders, `#1E3A5F` accent. Priority chips use semantic red/amber/green palettes. No teal, no cyber aesthetic.

## Behaviour

- Default visible count: 5 missions.
- `hasMore: true` when total queue exceeds visible count; show-more toggle reveals all.
- `agentSummary` covers all 5 owner agents from Wave-14 (Nexus, Sentinel, Atlas, Steward, Buyer Team).
- `generatedAt` is deterministic: `'2026-04-26'`.
- No model calls, no network calls, no scheduler.

## Validation

```
tsc --noEmit  → 0 errors
jest (9 tests) → 9 passed
```
