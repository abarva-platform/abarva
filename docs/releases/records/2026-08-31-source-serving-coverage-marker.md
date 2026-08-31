# 2026-08-31-source-serving-coverage-marker — Source Serving Coverage Marker

## Release ID

`2026-08-31-source-serving-coverage-marker`

## Status

`candidate`

## Plain-English Summary

Adds the shared ECL serving-surface coverage marker to the Source workspace client so product proof can verify the Source surface contract before browser execution.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Source workspace rendering now includes the shared ECL serving-surface coverage component already used by adjacent product surfaces.

## Client Applicability

- All clients: applies to the shared Source workspace shell.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: follows the existing Source workspace route behavior.

## Changes Included

- Source workspace client imports and renders `EclServingSurfaceCoverage` with `product="source"`.

## QA / Validation

- `npm run ecl:product-browser:predeploy-gate` — pass.
- `npm run release:check` — pass after this release record update.
- `git diff --check` — pass.

## Rollout Plan

Merge through pull request. The repo-owned Azure Container Apps main deploy workflow builds and deploys the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: resolved by the deploy workflow.
- ACA runtime invariant: required before claiming live state.
- Worker image invariant: required by deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: product live proof workflow after deploy.

## Rollback Plan

Revert the pull request or roll back to the prior digest-pinned ACA revision.

## Audit Evidence

Pull request, local pre-deploy gate output, release check output, and post-deploy product proof workflow.

## Known Gaps

This does not change Source data, Source business logic, or Home narrative rows.
