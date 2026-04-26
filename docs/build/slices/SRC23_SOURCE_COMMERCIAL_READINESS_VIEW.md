# SRC23 — Source Commercial Readiness View

**Wave:** wave-15
**Lane:** SRC23
**Branch:** wave15/src23-commercial-readiness
**Status:** complete

## Files Created

- `src/lib/source/source-commercial-readiness.ts` — Pure TypeScript view-model builder
- `src/components/source/SourceCommercialReadinessView.tsx` — `'use client'` React component
- `src/__tests__/integration/source/source-commercial-readiness-view.test.ts` — 8 type-shape tests

## Exports

### `src/lib/source/source-commercial-readiness.ts`
- `SourceCommercialReadinessCheck` — interface (checkId, label, status, detail, category)
- `SourceCommercialReadinessViewModel` — interface (rfpId, checks[6], overallStatus, readyCount, totalCount, readinessPercent, generatedAt, caveat)
- `buildCommercialReadinessViewModel(rfpId, vendorList, pricingData?, riskData?, bafoData?)` — deterministic builder

### `src/components/source/SourceCommercialReadinessView.tsx`
- `SourceCommercialReadinessView` — React component with header, overall status badge, progress bar, 6-check list, and caveat footer

## 6 Checks
1. `pricing-normalized` — pricing category
2. `risks-assessed` — risk category
3. `bafo-strategy` — negotiation category
4. `vendor-comparison` — pricing category
5. `evidence-basis` — evidence category
6. `executive-ready` — decision category

## Tests
8 tests green. No React rendering, no jsdom. Pure type-shape and logic validation.
