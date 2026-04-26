Date: 2026-04-26
Slice: Source Commercial Signal Adapter
Status: done

## Scope

- Add a deterministic commercial signal adapter that converges existing Source commercial outputs.
- Reuse existing pricing, BAFO, and risk modules instead of duplicating model logic.
- Keep this slice non-UI and non-runtime-expansion.

## Files

- `src/lib/source/commercial-signal-types.ts`
- `src/lib/source/commercial-signals.ts`
- `src/lib/source/index.ts`
- `src/__tests__/integration/source/source-commercial-signals.test.ts`
- `docs/abarva-source/build-pack/implementation-reviews/55_SOURCE_COMMERCIAL_SIGNAL_ADAPTER_REVIEW.md`

## What Changed

1. Canonical signal contract
   - Added `SourceCommercialSignals` shape with:
   - event id/time
   - pricing, BAFO, and risk signal sections
   - vendor tradeoffs
   - commercial readiness
   - executive implications
   - blockers and recommended next action
   - source module provenance (`sourceModulesUsed`)

2. Adapter functions
   - Added:
   - `buildSourceCommercialSignals(input)`
   - `adaptPricingNormalizationToCommercialSignals(...)`
   - `adaptBafoNegotiationToCommercialSignals(...)`
   - `adaptCommercialRisksToCommercialSignals(...)`
   - `summarizeSourceCommercialSignals(...)`
   - `formatSourceCommercialSignalsAsMarkdown(...)`
   - Adapter reuses:
   - `buildSourcePricingNormalization`
   - `buildSourceBafoNegotiationPlan`
   - `detectCommercialRisks`

3. Export wiring
   - Added exports in `src/lib/source/index.ts` for the new types and adapter.

## Determinism / Reuse

- No model calls.
- No network calls.
- No upload/parsing behavior.
- No new BAFO/pricing/risk model families introduced.
- Existing modules are reused and adapted into one canonical output.

## Tests Added

- Deterministic output repeatability check.
- Pricing/BAFO/risk adaptation checks against direct module outputs.
- Summary and markdown formatter checks.
- Module hygiene checks:
  - no model imports
  - no upload/parser imports
  - no `fetch`
  - explicit reuse of existing builders

## Validation

- `npx jest src/__tests__/integration/source/source-commercial-signals.test.ts`
- `npx eslint src/lib/source/commercial-signals.ts src/lib/source/commercial-signal-types.ts src/lib/source/index.ts src/__tests__/integration/source/source-commercial-signals.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run build -- --webpack`
- `git diff --check`

## Production Readiness Impact

- Improves deterministic commercial convergence and canonical signal provenance.
- No readiness-state inflation; no pilot-ready/production-ready claims.

## Out of Scope Confirmation

- No Source UI modifications.
- No workflow/approval engine behavior.
- No runtime model calls.
- No upload/parsing integration.
