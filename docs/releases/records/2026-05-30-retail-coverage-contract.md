# 2026-05-30-retail-coverage-contract — Retail Coverage Contract

## Release ID

`2026-05-30-retail-coverage-contract`

## Status

`candidate`

## Plain-English Summary

This release connects the Retail Overlay v1 corpus to the question coverage contract. In plain terms: when Apex asks a Tier-1 strategy, technology, vendor, finance, risk, benchmark, or evidence question, the system now has an explicit list of retail packs that should be available for that question type.

## Layer Impact

- `retrieval-control-lane`: Adds retail overlay pack requirements for all 25 Tier-1 question categories.
- `industry-corpus-lane`: Binds the loaded `retail-v1` corpus to the coverage contract.
- `qa-validation-lane`: Adds acceptance coverage proving every referenced pack exists in the consolidated manifest.
- `runtime-app-lane`: No route or UI change in this PR.

## Client Applicability

- All clients: No behavior change unless a caller requests retail overlay coverage.
- Specific clients: Apex Retail gets the `retail-v1` coverage contract.
- Internal only: Contract and validation tests.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/knowledge/coverage.ts`
- `src/lib/knowledge/__tests__/coverage.test.ts`
- `src/lib/knowledge/__tests__/coverage-contract-acceptance.test.ts`

## QA / Validation

- PASS: All 25 Tier-1 question categories map to at least three `retail-v1` packs.
- PASS: Acceptance test verifies every referenced retail pack exists in `RETAIL_OVERLAY_v1_CONSOLIDATED_MANIFEST.json`.
- PASS: `npx jest src/lib/knowledge/__tests__/coverage.test.ts src/lib/knowledge/__tests__/coverage-contract-acceptance.test.ts --runInBand`.
- PASS: `npx eslint src/lib/knowledge/coverage.ts src/lib/knowledge/__tests__/coverage.test.ts src/lib/knowledge/__tests__/coverage-contract-acceptance.test.ts`.
- PASS: `git diff --check`.
- PENDING: PR CI.

## Rollout Plan

Merge after CI passes. This enables Section 6.3 retrieval smoke to evaluate Apex retail answers against explicit required packs.

## Rollback Plan

Revert this PR. The loaded `retail-v1` chunks remain in the data plane but the explicit coverage-pack contract is removed.

## Audit Evidence

- Contract: `src/lib/knowledge/coverage.ts`
- Tests: `src/lib/knowledge/__tests__/coverage.test.ts`, `src/lib/knowledge/__tests__/coverage-contract-acceptance.test.ts`

## Known Gaps

Section 6.3 API retrieval smoke is next.
