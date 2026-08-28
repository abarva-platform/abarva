# 2026-08-28-home-ecl-serving-payload-normalization — Home ECL Serving Payload Normalization

## Release ID

`2026-08-28-home-ecl-serving-payload-normalization`

## Status

`candidate`

## Plain-English Summary

Home preview now unwraps the payload shape emitted by the ECL serving views before building deterministic evidence signals. This keeps Home's contract-value readout aligned with the governed serving rows instead of treating populated contract values as missing.

## Layer Impact

- `global-control-lane`: Updates the Home ECL preview mapper that prepares the visible executive bundle.
- Products: Home preview reads the existing serving-view payload contract correctly.
- Projections/serving: No schema or data mutation.

## Client Applicability

- All clients: Home ECL preview behavior is corrected wherever ECL serving rows are used.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home ECL provider behavior only.

## Changes Included

- `src/lib/home/preview/ecl-projection-bundle.ts`
- `src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts` passed.
- `npm run test:ecl-home-narrative-layer` passed.
- Release and whitespace checks are required before merge.

## Rollout Plan

Merge to `main`, build through the repo-owned Azure Container Apps deploy workflow, then verify Home preview with signed-in browser proof.

## Deployment Authority

- Repo-owned deploy workflow: Required for live rollout.
- Shared runtime mutators: None outside the approved deploy workflow.
- Approved image digest: Captured by the deploy workflow.
- ACA runtime invariant: Required before live claim.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Home preview.

## Rollback Plan

Revert the PR and redeploy the previous digest through the repo-owned ACA workflow. No data rollback is required.

## Audit Evidence

- PR URL, CI checks, ACA deploy run, runtime invariant, and signed-in Home preview proof.

## Known Gaps

The broader Home executive narrative quality review remains separate from this mapper correction.
