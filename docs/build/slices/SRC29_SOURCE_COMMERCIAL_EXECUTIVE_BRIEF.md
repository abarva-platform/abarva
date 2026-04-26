# SRC29 · Source Commercial Executive Brief

**Wave:** wave-16
**Type:** source-ui
**Status:** code_complete
**Branch:** wave16/src29-source-commercial-executive-brief

## Purpose

Deterministic executive-facing commercial intelligence summary for the Source module. Provides a posture badge, 3 canonical risks, 3 BAFO levers, vendor comparability state, and a recommended next action in a dark-navy header panel with a white body section.

## Files

| File | Purpose |
|------|---------|
| `src/lib/source/source-commercial-executive-brief.ts` | Pure TypeScript builder — no React, no network, no model calls |
| `src/components/source/SourceCommercialExecutiveBrief.tsx` | `'use client'` display component |
| `src/__tests__/integration/source/source-commercial-executive-brief.test.ts` | 11 type-shape tests |

## Design

- **Header:** dark-navy (`#1E3A5F`) background with white/slate text. Posture badge (green/amber/red/gray). Executive summary paragraph.
- **Body:** white (`#FFFFFF`). Three side-by-side cards: Top Risks, BAFO Levers, Vendor Comparability.
- **Risks:** severity chips — critical `#FEE2E2`, high `#FFEDD5`, medium `#FEF9C3`.
- **Next action:** light-blue callout box (`#DBEAFE` background).
- **Caveat footer:** muted small text. No teal, no icons, no sparkles.

## Commercial Posture Logic

| Condition | Posture |
|-----------|---------|
| `vendorList.length === 0` | `incomplete` |
| `vendorList.length >= 3` | `developing` |
| `vendorList.length >= 2` and `includePartialData` | `developing` |
| Otherwise | `at-risk` |

## Atlas Caveat

All data is deterministic seed. Does not reflect live Atlas runtime analysis.

## Acceptance Criteria

- [x] `buildCommercialExecutiveBrief` returns exactly 3 `topRisks`
- [x] `buildCommercialExecutiveBrief` returns exactly 3 `topBafoLevers`
- [x] `commercialPosture` is one of 4 valid values
- [x] `atlasCaveat` is non-empty and contains "deterministic"
- [x] `generatedAt === '2026-04-26'`
- [x] All risk severities valid (`critical | high | medium`)
- [x] All lever `estimatedImpact` values non-empty
- [x] `vendorComparabilityState` non-empty for any vendor list
- [x] Component exports `SourceCommercialExecutiveBrief` as a function
- [x] No teal colors (`#14B8A6`, `#0E9F8C`) in component source
- [x] TypeScript clean, ESLint clean
