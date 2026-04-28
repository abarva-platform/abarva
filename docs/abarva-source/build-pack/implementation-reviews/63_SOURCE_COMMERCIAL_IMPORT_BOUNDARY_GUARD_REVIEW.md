# 63 — Source Commercial Import Boundary Guard Review

## Slice
- `test(source): add commercial import boundary guard`

## Goal
- Prevent drift in executive decision paths by enforcing canonical commercial import boundaries.
- Ensure executive synthesis consumes adapters/contracts rather than directly importing parallel Wave-14 model modules.

## Files Changed
- `src/__tests__/integration/source/source-commercial-import-boundary.test.ts`

## Deterministic Guard Coverage
1. `executive-decision-summary.ts` is blocked from importing:
   - `./bafo-negotiation-model`
   - `./pricing-normalization-model`
   - `./commercial-risk-detection`
   - `./bafo-negotiation`
   - `./pricing-normalization`
2. `executive-decision-summary.ts` must import canonical modules:
   - `./commercial-signals`
   - `./commercial-mission-adapter`
3. `SourceExecutiveDecisionSummaryPanel.tsx` must not directly import parallel commercial model modules.
4. Canonical executive path references are asserted through executive summary module content and source-module usage marker.

## Scope Controls
- No runtime code changes.
- No UI changes.
- No model calls, upload/parsing, workflow engine, or approval engine work.
- No dependencies added.

## Validation
- `npx jest src/__tests__/integration/source/source-commercial-import-boundary.test.ts`
- `npx eslint src/__tests__/integration/source/source-commercial-import-boundary.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run build -- --webpack`
- `git diff --check`

## Result
- Guard test introduces deterministic import-boundary protection for the executive decision path.
- Future drift to direct Wave-14 model imports should fail in CI before merge.

