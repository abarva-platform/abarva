Date: 2026-04-26
Slice: Vendor Pricing Smoke Coverage
Status: done

## Scope

- Add smoke regression coverage for the vendor-response/pricing-normalization boundary.
- Confirm event canvas exposure of vendor response completeness in seeded flow.
- Confirm pricing normalization blockers remain aligned with response completeness readiness gaps.
- Confirm missing required pricing inputs do not mark deterministic pricing as comparable.

## Files

- `src/__tests__/integration/source/source-vendor-pricing-smoke.test.ts`
- `src/__tests__/integration/source/source-event-canvas-shell.test.ts`
- `src/__tests__/integration/source/source-vendor-response-completeness.test.ts`
- `src/__tests__/integration/source/source-vendor-response-completeness-panel.test.ts`
- `src/__tests__/integration/source/source-pricing-normalization.test.ts`
- `src/lib/source/pricing-normalization.ts`
- `src/lib/source/vendor-response-completeness.ts`
- `src/lib/source/pricing-normalization-types.ts`

## Validation

- `npx jest src/__tests__/integration/source/source-vendor-pricing-smoke.test.ts`
- `npx eslint src/__tests__/integration/source/source-vendor-pricing-smoke.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run build -- --webpack`
- `git diff --check`

## Behavior covered

- Event canvas smoke checks assert deterministic `vendor_responses` stage output still shows
  `Vendor Response Completeness` and comparability signal fields.
- Pricing normalization smoke checks verify:
  - event-level status is not fully comparable in seeded incomplete state,
  - pricing traps are emitted in deterministic output,
  - top traps and markdown include the pricing completeness issues that block comparability.
- Cross-read-model consistency checks confirm critical comparability linkage between
  `buildSourceVendorResponseCompleteness` and `buildSourcePricingNormalization` for seeded
  non-comparable cases (notably missing pricing templates).

## Design / dependency boundaries

- No UI redesign, no chat model input, and no production flow changes.
- No upload/parsing, no artifact drawer behavior, and no document export/import in this slice.
- No runtime API changes; reads are deterministic from seeded event contracts.

## Risks / follow-ups

- Slice 7 is smoke-only and does not introduce a dedicated pricing panel yet.
- If later pricing UX is added, this slice should be extended with event-canvas surface assertions
  for whichever rendering path hosts pricing readiness.
