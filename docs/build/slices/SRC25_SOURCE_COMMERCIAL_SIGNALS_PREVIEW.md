# SRC25 — Source Commercial Signals Preview

**Wave:** wave-15
**Type:** source-ui
**Status:** complete
**Branch:** wave15/src25-commercial-signals-preview

## Summary

Compact preview component surfacing top-3 control-tower signals and top-3 intelligence patterns for a given RFP/sourcing event. Built on the Wave-14 `buildSourceControlTowerSignals` and `detectIntelligencePatterns` deterministic libs.

## Files

| File | Purpose |
|------|---------|
| `src/lib/source/source-commercial-signals-preview.ts` | Pure TypeScript view-model builder. Exports `SourceSignalPreviewItem`, `SourcePatternPreviewItem`, `SourceCommercialSignalsPreviewViewModel`, and `buildCommercialSignalsPreviewViewModel()`. |
| `src/components/source/SourceCommercialSignalsPreview.tsx` | `'use client'` React component. Two-column layout: signals left, patterns right. Severity chips, confidence bars, caveat footer. AbarVa design canon. |
| `src/__tests__/integration/source/source-commercial-signals-preview.test.ts` | 9 type-shape integration tests. No React rendering, no jsdom. |

## Design

- Background `#FAFAF9`, border `#E8E6E3`, accent `#1E3A5F`
- Severity chips: critical=`#FEE2E2`/`#991B1B`, warning=`#FEF9C3`/`#92400E`, info=`#DBEAFE`/`#1E40AF`
- Confidence bar: thin `4px` progress bar in `#1E3A5F`
- No third-party UI libraries

## View Model Logic

- Calls `buildSourceControlTowerSignals()` with representative procurement flags
- Calls `detectIntelligencePatterns()` with same event context
- Sorts signals by severity priority (critical > high > medium > low > info)
- Maps 5-level severity to 3-level preview severity (critical / warning / info)
- Sorts patterns by strength (confirmed > likely > possible)
- Maps pattern strength to confidence: confirmed=0.95, likely=0.70, possible=0.40
- Slices top 3 from each sorted list

## Constraints

- Deterministic — no model calls, no network calls, no API routes
- Does not modify any Wave-14 libs
- `generatedAt` is hardcoded to `'2026-04-26'`
