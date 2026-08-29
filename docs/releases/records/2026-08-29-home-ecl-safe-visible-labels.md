# 2026-08-29-home-ecl-safe-visible-labels — Home ECL Safe Visible Labels

## Release ID

`2026-08-29-home-ecl-safe-visible-labels`

## Status

`candidate`

## Plain-English Summary

This change tightens the Home ECL narrative scrubber so a replacement display label cannot reintroduce an internal object identifier into CXO-visible prose.

## Layer Impact

Lane: `global-control-lane`

Layer 4 Products: Home narrative generation now sanitizes visible display labels before using them as replacements for governed object IDs.

## Client Applicability

- All clients: Home ECL narrative generation behavior is tightened.
- Specific clients: None.
- Internal only: Operator validation and tests.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- Passed: `npm run test:ecl-home-narrative-layer`
- Passed: `git diff --check`
- Passed locally after this record update: `npm run release:check`
- Passed: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
- Pending after deploy: governed Home ECL narrative apply/readback jobs with the deployed digest
- Pending after apply/readback: signed-in browser proof for `/home/preview`

## Rollout Plan

Merge by pull request to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. After deployment, rerun the governed Home ECL narrative apply/readback jobs with the deployed digest.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow
- Approved image digest: resolved by the deploy workflow
- ACA runtime invariant: required after deploy
- Worker image invariant: required after deploy
- Feature/env flag update path: none
- Live signed-in proof required: required for affected Home preview route after apply/readback

## Rollback Plan

Revert the pull request and redeploy the previous approved digest through the repo-owned deploy workflow. If narrative rows were written, rerun the previous approved narrative writer or restore the prior approved Home ECL projection snapshot.

## Audit Evidence

- Pull request
- CI checks
- ACA deploy evidence
- Home ECL narrative apply/readback logs
- Signed-in browser screenshot for `/home/preview`

## Known Gaps

This does not redesign the Home architecture or data-browser surfaces. It only hardens the narrative writer against visible internal identifier leakage.
