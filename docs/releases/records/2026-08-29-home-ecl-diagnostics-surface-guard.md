# 2026-08-29-home-ecl-diagnostics-surface-guard — Home ECL Diagnostics Surface Guard

## Release ID

`2026-08-29-home-ecl-diagnostics-surface-guard`

## Status

`candidate`

## Plain-English Summary

The Home preview no longer renders ECL proof-only demo findings on the default executive surface. The proof panel remains available only when an operator requests ECL diagnostics explicitly. The Home narrative generator also now refuses publication when CXO-visible text contains implementation vocabulary or bland empty-state phrasing.

## Layer Impact

- Lane: `global-control-lane`
- Layer 4 Products: Home preview rendering is narrowed so default ECL pages stay executive-facing while diagnostics remain available for operator proof runs. Home narrative publication now checks visible text before writing new generated chapter rows.

## Client Applicability

- All clients: Home preview route behavior is affected when ECL is the selected product provider.
- Specific clients: None.
- Internal only: The diagnostics panel remains an internal/operator proof surface.
- Public/demo only: None.
- Feature flag: Existing ECL provider behavior is unchanged; diagnostics require `diagnostics=ecl` or `debug=ecl`.

## Changes Included

- `src/app/(maestro)/home/preview/page.tsx`
- `src/app/(maestro)/home/__tests__/home-layer-boundary-contract.test.ts`
- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- `npm run test:ecl-home-narrative-layer` passed.
- `/Users/anand/Projects/nexus/node_modules/.bin/jest --runTestsByPath 'src/app/(maestro)/home/__tests__/home-layer-boundary-contract.test.ts' 'src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts' --runInBand` passed.
- `git diff --check` passed.
- `npm run release:check` passed.

## Rollout Plan

Merge through pull request. The repo-owned Azure Container Apps main deploy workflow publishes the change to the shared runtime.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Home preview default route and Home diagnostics route.

## Rollback Plan

Revert the pull request to restore the prior Home preview rendering behavior.

## Audit Evidence

- Pull request, CI output, ACA deployment evidence, and signed-in Home preview screenshots after merge.

## Known Gaps

This change only removes proof scaffolding from the default Home surface. It does not certify the executive narrative quality or the final Home visual design.
