Date: 2026-04-26
Slice: Pricing Normalization Model
Status: done

## Scope

- Add deterministic pricing normalization read model for Source seeded events.
- Compare pricing from multiple vendors across assumptions, cost profile, and exclusions.
- Surface commercial traps and readiness impacts without introducing model calls or persistence.
- Provide helpers for comparison ranking and deterministic markdown rendering.

## Files

- `src/lib/source/pricing-normalization-types.ts`
- `src/lib/source/pricing-normalization.ts`
- `src/lib/source/mock-seed.ts`
- `src/lib/source/index.ts`
- `src/__tests__/integration/source/source-pricing-normalization.test.ts`

## Behavior implemented

- Added deterministic normalized vendor pricing input contract:
  - annual, transition, one-time, optional, excluded, and change-order cost inputs
  - automation, escalation, support, and size assumptions
  - assumptions/exclusions/evidence metadata
- Added deterministic snapshot contract and comparison outputs:
  - per-vendor cost year projections (Year 1/2/3)
  - transition-inclusive Year 1
  - cost per application / cost per ticket markers
  - per-vendor readiness and comparability states
  - top traps and blockers
- Added deterministic helpers:
  - `buildSourcePricingNormalization`
  - `normalizeVendorPricing`
  - `getSourcePricingComparison`
  - `getSourceCommercialTraps`
  - `getSourcePricingNormalizationBlockers`
  - `getSourcePricingNormalizationNextActions`
  - `getSourcePricingNormalizationSummary`
  - `summarizeSourcePricingNormalization`
  - `formatSourcePricingNormalizationAsMarkdown`
- Added seeded pricing inputs for three vendors to support deterministic test coverage.

## Determinism and boundaries

- Deterministic by design: all outputs are derived from seeded data and explicit event inputs.
- No model/API calls or live data fetches added.
- No upload/parsing behavior, no scorecard, no approval engine, no document export/import.
- No status is promoted to pilot/production readiness by this slice.

## Tests run

- `npx jest src/__tests__/integration/source/source-pricing-normalization.test.ts`
- `npx eslint src/lib/source/pricing-normalization.ts src/lib/source/pricing-normalization-types.ts src/lib/source/mock-seed.ts src/lib/source/index.ts src/__tests__/integration/source/source-pricing-normalization.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run build -- --webpack`
- `git diff --check`
- production-readiness JSON parse check skipped in this slice (no manifest changes made)

## Production-readiness impact

- Adds deterministic pricing normalization foundation used by Source workflow planning.
- No change to `docs/build/production-readiness.json` in this slice because no runtime or deployment behavior changed.
- Source remains non-production despite richer pricing analysis surfaces; traps and blockers remain advisory.
