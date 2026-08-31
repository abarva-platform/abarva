# 2026-08-31-home-output-vendor-opening-gate — Home Output Opening Gate

## Release ID

`2026-08-31-home-output-vendor-opening-gate`

## Status

`candidate`

## Plain-English Summary

Adds an output-side Home quality check that rejects executive identity prose when it opens by making an individual supplier or supplier concentration the lead answer. Commercial concentration remains valid on commercial pages, but the executive overview must open on business model, segment economics, accountability, value, or exposure.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: the Home chapter quality measurement now evaluates generated prose for a vendor-led executive opening before the text is accepted as a boardroom-facing narrative.

## Client Applicability

- All clients: Home evidence-led narrative generation quality gate.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `scripts/data-build/home-lens-quality.ts`
- `scripts/data-build/build-home-chapters.ts`
- `scripts/data-build/__tests__/home-lens-quality.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath scripts/data-build/__tests__/home-lens-quality.test.ts` passed with 13 tests.
- `npm run test:ecl-source-intelligence-home-packets` passed with 16 pages and 4 artifacts.
- The planted failure uses a supplier-led executive opening and is rejected by the output gate.

## Rollout Plan

Merge to `main`. No runtime deployment is required because this changes the offline Home generation and measurement path, not a live route.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR to remove the additional quality check from the generation measurement path.

## Audit Evidence

- PR URL after opening.
- Targeted test output for `home-lens-quality.test.ts`.
- Packet contract test output for `test:ecl-source-intelligence-home-packets`.

## Known Gaps

This gate prevents one visible failure class. It does not regenerate or publish new Home prose by itself.
