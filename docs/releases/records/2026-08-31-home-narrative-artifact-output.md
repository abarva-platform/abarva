# 2026-08-31-home-narrative-artifact-output -- Home Narrative Artifact Output

## Release ID

`2026-08-31-home-narrative-artifact-output`

## Status

`candidate`

## Plain-English Summary

Home narrative measurement now honors the final CLI value for repeated single-value flags. This keeps workflow-specified artifact output paths aligned with the files produced by the chapter measurement runner.

## Layer Impact

Layer 4 product proof tooling only. This does not change tenant intake, source adapters, canonical records, projections, serving views, product rendering, or live data-plane state.

## Client Applicability

- All clients: Applies to shared Home narrative proof tooling.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/data-build/build-home-chapters.ts` now resolves repeated single-value CLI flags by using the final supplied value.
- `scripts/data-build/__tests__/build-home-chapters-cli.test.ts` asserts workflow-provided output paths override package-script defaults.

## QA / Validation

- Pass: `npm test -- --runTestsByPath scripts/data-build/__tests__/build-home-chapters-cli.test.ts`
- Pass: `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Not run: GitHub PR checks.

## Rollout Plan

Merge through the normal PR path. No data load or route change is included. Rerun the Home narrative measurement workflow after merge and confirm the artifact contains the generated measurement files.

## Deployment Authority

- Repo-owned deploy workflow: Not required for the proof-tooling behavior itself.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert this PR. The prior behavior would return, where the earliest repeated CLI flag value wins.

## Audit Evidence

Inspect the PR diff, targeted parser test, Home narrative layer test output, release control output, and the follow-up workflow artifact from the Home narrative measurement run.

## Known Gaps

This release fixes artifact path resolution. It does not improve generated narrative quality or publish new Home chapter output.
