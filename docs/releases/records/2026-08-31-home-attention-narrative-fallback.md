# 2026-08-31 Home Attention Narrative Fallback

## Release ID

`2026-08-31-home-attention-narrative-fallback`

## Status

`candidate`

## Plain-English Summary

This change tightens the Home narrative builder so a claim-backed attention page cannot publish generic refusal-style language when verified claims are present. If the model returns a refusal-like opening for a page that has usable evidence, the builder falls back to a deterministic, claim-backed summary.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 PRODUCTS: Home narrative generation now applies a stricter visible-quality guard during product projection assembly.

Layer 3 CANONICAL MODEL: No schema or canonical data changes.

## Client Applicability

- All clients: Home narrative generation behavior
- Specific clients: None
- Internal only: None
- Public/demo only: None
- Feature flag: None

## Changes Included

- `scripts/data-build/build-home-chapters.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

Status: PASS.

- PASS — `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`
- PASS — `NODE_PATH=/Users/anand/Projects/nexus/node_modules /Users/anand/Projects/nexus/node_modules/.bin/tsx -e "Promise.all([import('./scripts/data-build/build-home-chapters.ts'), import('./scripts/ecl/build_home_ecl_narrative_layer.ts')]).then(()=>console.log('tsx import ok'))"`
- PASS — `git diff --check`
- PASS — `npm run release:check`

## Rollout Plan

Merge to main through a pull request. The change becomes active in the next repo-owned Azure Container Apps image build/deploy and the next governed Home narrative generation job.

## Deployment Authority

- Repo-owned deploy workflow: Required before claiming runtime availability
- Shared runtime mutators: None in this PR
- Approved image digest: To be captured by deploy workflow
- ACA runtime invariant: Required after deploy
- Worker image invariant: Required for governed data-build execution
- Feature/env flag update path: None
- Live signed-in proof required: Required before claiming rendered Home page proof

## Rollback Plan

Revert the PR and redeploy the previous known-good image. Previously published projection rows are not changed by this PR until a governed write job is run.

## Audit Evidence

Pull request, CI checks, release check output, governed data-build plan/apply output, readback proof, and Home browser screenshots after deploy.

## Known Gaps

This PR does not regenerate or publish Home narrative rows by itself. It only changes the builder and tests.
