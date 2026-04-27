# PAT3 · Vendor Evaluation Scorecard Pattern

Slice ID: PAT3_W27
Wave: wave-27
Status: code_complete
Authored: 2026-04-26
Author: Code (sole)

Deterministic 8-dimension weighted vendor evaluation scorecard with BAFO
eligibility scoring, auto-exclusion criteria, and commercial risk signals for
enterprise AI/technology vendor selection events.
**No live runtime, no model invocation, no migrations, no UI.**

## What changed

- New module
  [src/lib/solutions/vendor-evaluation-pattern.ts](../../../src/lib/solutions/vendor-evaluation-pattern.ts):
  - Public types: `VendorEvaluationDimension` (8 dimensions),
    `VendorEvaluationWeight` (1–5), `VendorScoreRating` (not_assessed/weak/
    adequate/strong/leading → 0–4), `VendorEvaluationCriterion`,
    `VendorScorecardRow`, `VendorScorecardSummary`, `VendorEvaluationCommercialRisk`,
    `VendorEvaluationPattern`.
  - `VENDOR_EVALUATION_PATTERN` — 10 weighted criteria across 8 dimensions,
    3 commercial risks (BAFO deadline compression, pricing comparability gap,
    reference reachability failure), 5 auto-exclusion criteria,
    BAFO invite threshold 55/100.
  - `buildVendorScorecard(vendorName, ratings)` — computes weighted score,
    normalised 0–100, and BAFO eligibility flag.
  - `getVendorEvaluationCriteriaByDimension(dimension)` — filters by dimension.
  - `VENDOR_EVALUATION_DIMENSIONS` — re-exported constant.
  - `createdFrom: 'pat3_vendor_evaluation'` discriminator on every record.

## Scoring model

| Rating | Score |
|---|---|
| not_assessed | 0 |
| weak | 1 |
| adequate | 2 |
| strong | 3 |
| leading | 4 |

normalizedScore = round((totalWeightedScore / maxPossibleScore) × 100)
bafoEligible = normalizedScore ≥ 55

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/solutions/pattern-library-packs.test.ts` — 91 passed
- `npm run build` — pass
