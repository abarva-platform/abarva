# 2026-05-31-vendor-scorecard-inference-economics — Vendor Inference Economics

## Release ID

`2026-05-31-vendor-scorecard-inference-economics`

## Status

`candidate`

## Plain-English Summary

Vendor scorecards can now carry an explicit inference-economics block. For the first signature-client vendors, AbarVa records the operating-cost questions that are known and keeps unknown per-call pricing, tier ladders, repricing terms, volume locks, and contract ceilings as structured gaps instead of inventing precision.

## Layer Impact

- `global-control-lane`: Adds shared typed vendor inference-economics helpers and wires them into the Intelligence vendor rollup.
- `global-control-lane`: Extends the context broker seam with `getInferenceEconomicsForVendor()` so sourcing and retrieval code can ask for the same structured payload without reaching around the broker.

## Client Applicability

- All clients: The typed field is available everywhere vendor rollups are rendered.
- Specific clients: Apex Retail, Meridian Health, and SkyHarbor Air receive seeded signature-client coverage for the initial vendor set.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `src/lib/source/vendor-inference-economics.ts`.
- Adds focused tests for the inference-economics catalog, Intelligence vendor rollup attachment, and broker seam.
- Updates `src/lib/intelligence-v3/vendors-data.ts` and `src/lib/intelligence-v3/vendors-display.ts` so vendor rollups expose `inferenceEconomics`.
- Updates `src/lib/knowledge/context-broker/broker.ts` so callers can resolve vendor inference economics through the broker contract.

## QA / Validation

- Pass: `npx jest src/lib/source/__tests__/vendor-inference-economics.test.ts src/lib/intelligence-v3/__tests__/vendors-data.test.ts src/lib/knowledge/context-broker/__tests__/broker.test.ts --runInBand`
- Pass: `npx eslint src/lib/source/vendor-inference-economics.ts src/lib/source/__tests__/vendor-inference-economics.test.ts src/lib/intelligence-v3/vendors-data.ts src/lib/intelligence-v3/vendors-display.ts src/lib/intelligence-v3/__tests__/vendors-data.test.ts src/lib/knowledge/context-broker/broker.ts src/lib/knowledge/context-broker/__tests__/broker.test.ts`
- Pass: `npm run qa:agent-quality:corpus`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Merge to main. No database migration or feature flag is required because the new inference-economics block is optional and populated from typed control-lane fixtures.

## Rollback Plan

Revert the PR. Existing vendor rollups will continue to render because the new fields are optional and no persisted schema change is introduced.

## Audit Evidence

- PR URL: to be added after PR creation.
- CI checks on the PR.
- Local validation commands listed above.

## Known Gaps

Per-call AI pricing and tier-ladder terms remain null for the initial scorecards unless the source data names real contract economics. That is intentional: the product now exposes the gap instead of fabricating vendor run-cost precision.
