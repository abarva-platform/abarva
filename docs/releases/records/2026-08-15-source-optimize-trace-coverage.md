# 2026-08-15-source-optimize-trace-coverage — Optimize Calculation Trace Coverage

## Release ID

`2026-08-15-source-optimize-trace-coverage`

## Status

`candidate`

## Plain-English Summary

Optimize Contract already separates opportunity amounts that can be reproduced
from calculation runs from amounts that cannot. This release makes that
coverage visible in the baseline evidence panel, so a case with only partial
calculation support no longer looks fully ready just because one calculation
run exists.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source Optimize Contract presentation is clearer about calculation
  coverage in the evidence baseline panel.
- Canonical model: No schema, data, or calculation-rule change.

## Client Applicability

- All clients: Yes, for tenants using Source Optimize Contract.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

- `npm test -- --runTestsByPath src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand` — passed.
- `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts --runInBand` — passed.
- `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-traceability.test.ts --runInBand` — passed.
- `npx eslint src/components/source/SourceOptimizeContractPage.tsx src/components/source/__tests__/SourceOptimizeContractPage.test.tsx` — passed.

## Rollout Plan

Merge through the normal PR lane. The repo-owned ACA main deploy workflow builds
and deploys the merged image to the shared web runtime.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned workflow after merge.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required before claiming live.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, affected Source Optimize route.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No database or
data-plane rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6327
- Deploy workflow run: To be added.
- Signed-in browser proof: To be added.

## Known Gaps

This release only clarifies trace coverage in the Optimize Contract page. It
does not create missing calculation runs or change opportunity math.
