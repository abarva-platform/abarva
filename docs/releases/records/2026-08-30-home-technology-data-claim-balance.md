# 2026-08-30-home-technology-data-claim-balance — Home Technology Data Claim Balance

## Release ID

`2026-08-30-home-technology-data-claim-balance`

## Status

`candidate`

## Plain-English Summary

Home's deterministic narrative writer now prioritizes data, analytics, reporting, ETL, script, user, and platform-context signals when it builds the Technology & Data chapter. This prevents the page from showing generic application-cost language while verified data-workload context is available in the governed packet.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 — Canonical Enterprise Model: No schema or canonical data changes.
- Layer 4 — Products: Home's deterministic narrative planning and visual routing are adjusted so generated chapter content reflects the available governed data-workload and platform evidence.

## Client Applicability

- All clients: Home narrative generation behavior changes when ECL projection-backed packets include data-workload evidence.
- Specific clients: None named in this public release record.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home ECL narrative job flags continue to control write execution.

## Changes Included

- `scripts/data-build/build-enterprise-thesis.ts`
- `scripts/data-build/build-home-chapters.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- `npm run test:ecl-home-narrative-layer` — passed.
- `npx eslint scripts/data-build/build-enterprise-thesis.ts scripts/data-build/build-home-chapters.ts scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` — passed.
- New regression coverage verifies that visible Technology & Data claim slots prioritize data-workload and platform-context signals before generic application-cost signals, and that workload-by-function and workload-by-technology visuals route to the Technology & Data chapter.

## Rollout Plan

Merge through a pull request. The repo-owned Azure Container Apps deployment workflow will build and deploy the merged image. The governed Home ECL narrative apply/readback jobs must then be rerun before claiming refreshed narrative content.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime image rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required before claiming live runtime rollout.
- Worker image invariant: Not changed by this PR.
- Feature/env flag update path: No feature or environment flag changes.
- Live signed-in proof required: Required after the narrative apply/readback jobs if claiming refreshed Home content is visible.

## Rollback Plan

Revert the merge commit and redeploy the previous approved image. If narrative rows have already been regenerated, rerun the prior digest's Home narrative job or restore the previous projection snapshot through the governed operator path.

## Audit Evidence

- Pull request URL and merge commit.
- Local test output for `npm run test:ecl-home-narrative-layer`.
- Local lint output for the changed files.
- Home narrative apply/readback job logs after deployment.
- Signed-in Home preview proof after narrative refresh.

## Known Gaps

This release changes deterministic prioritization and visual routing. It does not add new canonical source data, new Home UI components, or a broader source-family summarization layer.
