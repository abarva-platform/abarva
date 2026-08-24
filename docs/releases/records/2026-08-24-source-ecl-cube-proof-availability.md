# 2026-08-24-source-ecl-cube-proof-availability — Source ECL Cube Proof Availability

## Release ID

`2026-08-24-source-ecl-cube-proof-availability`

## Status

`candidate`

## Plain-English Summary

Source workspace ECL mode loaded contract and vendor projection rows but still rendered proof-layer cube availability from an empty compatibility snapshot. This release wires Source ECL mode to the ECL cube slice read model for the Source contract and vendor cubes, so the proof layer distinguishes loaded ECL cube slices from genuinely unavailable legacy-grain slices.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Source workspace read adapter only. It reads existing ECL projection and cube tables; it does not create schema, load data, promote data, repoint defaults, or mutate persistence.

## Client Applicability

- All clients: Applies only when Source workspace is explicitly using the ECL projection provider.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source provider selection controls applicability.

## Changes Included

- Source ECL database mode now reads `ecl_projection.cube_slice` for Source contract/vendor cube slices.
- The ECL workspace snapshot derives portfolio coverage and proof-layer availability from the ECL projection rows and cube slices instead of an all-zero empty snapshot.
- Existing legacy Source workspace behavior is unchanged.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand` — pass.
- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand` — pass.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts'` — pass.

## Rollout Plan

Merge through pull request. The repo-owned ACA main deploy workflow will publish the shared runtime image from main.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime rollout.
- Shared runtime mutators: None.
- Approved image digest: Produced by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming live rollout.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes before claiming the Source proof-layer correction is live.

## Rollback Plan

Revert this read-adapter change and redeploy the previous shared runtime image. No data rollback is required.

## Audit Evidence

- Focused unit and browser-surface tests listed above.
- Existing Azure readback proves ECL cube tables are populated; this release only changes product read wiring.

## Known Gaps

This does not turn ECL cube slices into legacy Source V4 invoice-line or SLA-grain rows. Slices without corresponding ECL product grain remain explicitly unavailable instead of being estimated.
