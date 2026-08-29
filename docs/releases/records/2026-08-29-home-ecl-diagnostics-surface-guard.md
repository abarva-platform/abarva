# 2026-08-29-home-ecl-diagnostics-surface-guard — Home ECL Diagnostics Surface Guard

## Release ID

`2026-08-29-home-ecl-diagnostics-surface-guard`

## Status

`candidate`

## Plain-English Summary

The Home preview no longer renders ECL proof-only demo findings on the default executive surface. The proof panel remains available only when an operator requests ECL diagnostics explicitly.

## Layer Impact

- Lane: `global-control-lane`
- Layer 4 Products: Home preview rendering is narrowed so default ECL pages stay executive-facing while diagnostics remain available for operator proof runs.

## Client Applicability

- All clients: Home preview route behavior is affected when ECL is the selected product provider.
- Specific clients: None.
- Internal only: The diagnostics panel remains an internal/operator proof surface.
- Public/demo only: None.
- Feature flag: Existing ECL provider behavior is unchanged; diagnostics require `diagnostics=ecl` or `debug=ecl`.

## Changes Included

- `src/app/(maestro)/home/preview/page.tsx`
- `src/app/(maestro)/home/__tests__/home-layer-boundary-contract.test.ts`

## QA / Validation

- `npm run test:ecl-home-narrative-layer` passed.
- `git diff --check` passed.
- Initial Jest path run could not execute in the temporary worktree because local Jest dependencies were not installed there; the node-based Home ECL narrative gate passed.

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
